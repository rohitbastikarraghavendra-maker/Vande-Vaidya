import { useState, useRef, useEffect } from "react";
import {
  type Assessment,
  type LanguageCode,
  type PatientSnapshot,
} from "@rht/shared";
import { guidance, phrase } from "../i18n/messages";
import { identity } from "../services/patientIdentity";
import { repository } from "../services/repository";
import { speech, clinical, tts } from "../services/providers";
import { recordAudio } from "./recorder";
import type { PatientFlowState } from "./flow";
import { emptyPatient } from "../../../../packages/triage-engine/src/lexicon";
import {
  evaluate,
  degradedEvaluation,
  turn,
  type Session,
  type Evaluation,
} from "../../../../packages/triage-engine/src/session";
import { buildAssessment } from "../../../../packages/triage-engine/src/assessment";
import type { ExtractionResult } from "../../../../packages/triage-engine/src/extraction";
import { questionText } from "../../../../packages/triage-engine/src/questions";
export function useTriageSession() {
  const [phase, setPhase] = useState<PatientFlowState>("WELCOME"),
    [lang, choose] = useState<LanguageCode>("en-IN");
  const [id, setId] = useState(() => identity()),
    [patient, change] = useState<PatientSnapshot>({ ...emptyPatient });
  const session = useRef<Session | null>(null),
    extraction = useRef<ExtractionResult | null>(null);
  const [q, ask] = useState<Evaluation["question"]>(null),
    [outcome, setOutcome] = useState<Evaluation | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null),
    [failed, setFailed] = useState(false);
  const [typing, type] = useState(false),
    [draft, edit] = useState(""),
    [seconds, tick] = useState(0);
  const stop = useRef<(() => void) | null>(null),
    lastClip = useRef<Blob | null>(null);
  const [config, setConfig] = useState<{ stt: string; model: string | null }>({
    stt: "unknown",
    model: null,
  });
  const s = session.current;
  const t = (...v: [string, string, string, string]) => phrase(lang, ...v);
  useEffect(() => {
    fetch("/api/config", { signal: AbortSignal.timeout(4000) })
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
    return () => stop.current?.();
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    if (phase !== "LISTENING") return;
    tick(0);
    const timer = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);
  function start() {
    session.current = {
      ...id,
      assessment_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      patient,
      language: lang,
      turns: [],
      errors: [],
      provider: "typed",
      model: config.model,
      detected: [],
    };
    setPhase("READY");
  }
  function finish(state: Session, e: Evaluation, x: ExtractionResult | null) {
    setOutcome(e);
    setPhase(e.triage.requires_escalation ? "EMERGENCY" : "RESULT");
    const completed = new Date().toISOString();
    // The result is committed independently of note assembly and repository IO.
    setTimeout(() => {
      const a = buildAssessment(state, e, x, completed);
      setAssessment(a);
      void repository.saveAssessment(a).catch(() => {
        if (session.current?.assessment_id === a.assessment_id) setFailed(true);
      });
    }, 0);
    tts.speak(guidance(lang, e.triage.level), lang);
  }
  async function submit(
    value: string,
    mode: "voice" | "text" | "button",
    english: string | null = null,
  ) {
    if (!s || !value.trim()) return;
    s.turns.push(turn("patient", value, mode, q?.id ?? null, english));
    edit("");
    type(false);
    lastClip.current = null;
    const local = evaluate(s, null);
    const input = {
      patient: s.patient,
      language_hint: lang,
      turns: s.turns,
      answered_question_ids: s.turns.flatMap((t) =>
        t.role === "patient" && t.question_id ? [t.question_id] : [],
      ),
    };
    if (mode === "button" && local.triage.requires_escalation) {
      const x = extraction.current;
      const merged = evaluate(s, x);
      finish(s, merged.triage.requires_escalation ? merged : local, x);
      return;
    }
    if (local.triage.requires_escalation) {
      // Paint the local action now, then allow at most four seconds for handoff enrichment.
      setOutcome(local);
      setPhase("EMERGENCY");
      const completed = new Date().toISOString();
      tts.speak(guidance(lang, "EMERGENCY"), lang);
      let x: ExtractionResult | null = null;
      try {
        x = await Promise.race([
          clinical.extract(input),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(Error("TIMEOUT")), 4000),
          ),
        ]);
      } catch {
        s.errors.push("LLM_FAILED");
      }
      const enriched = evaluate(s, x);
      const e = enriched.triage.requires_escalation ? enriched : local;
      const a = buildAssessment(s, e, x, completed);
      setAssessment(a);
      void repository.saveAssessment(a).catch(() => {
        if (session.current?.assessment_id === a.assessment_id) setFailed(true);
      });
      return;
    }
    setPhase("EXTRACTING");
    const previous = extraction.current;
    if (mode !== "button") {
      try {
        extraction.current = await clinical.extract(input);
      } catch {
        s.errors.push("LLM_FAILED");
        extraction.current = null;
      }
    }
    const x = extraction.current;
    const e = x ? evaluate(s, x) : degradedEvaluation(s, previous);
    s.confirmedFlags = e.red_flags.filter((f) => f.source !== "LLM_SUGGESTED");
    if (!e.question) {
      finish(s, e, x);
      return;
    }
    const question = e.question,
      text = questionText(question, lang);
    s.turns.push(
      turn("assistant", text, "text", question.id, question.text[0]),
    );
    ask(question);
    setPhase("QUESTION");
    tts.speak(text, lang);
  }
  function error(code: string) {
    s?.errors.push(code);
    setPhase("ERROR");
  }
  async function transcribe(blob: Blob) {
    if (!s) return;
    lastClip.current = blob;
    setPhase("TRANSCRIBING");
    try {
      const r = await speech.transcribe(blob, lang, !!q);
      s.provider = r.provider;
      if (r.language) s.detected.push(r.language);
      await submit(r.text, "voice");
    } catch {
      error("STT_FAILED");
    }
  }
  async function mic() {
    if (phase === "LISTENING") {
      stop.current?.();
      return;
    }
    setPhase("PERMISSION");
    try {
      stop.current = await recordAudio(
        (blob) => {
          void transcribe(blob);
        },
        () => error("AUDIO_FAILED"),
      );
      setPhase("LISTENING");
    } catch {
      error("MIC_UNAVAILABLE");
    }
  }
  const busy = ["TRANSCRIBING", "EXTRACTING", "PERMISSION"].includes(phase);
  const voiceAllowed =
    !q ||
    (s?.turns.filter(
      (t) => t.role === "patient" && t.question_id && t.input_mode === "voice",
    ).length ?? 0) < 2;
  const y = t("Yes", "ಹೌದು", "हाँ", "ஆம்"),
    n = t("No", "ಇಲ್ಲ", "नहीं", "இல்லை");
  function newPatient() {
    setId(identity(true));
    change({ ...emptyPatient });
  }
  function restart() {
    session.current = null;
    setPhase("WELCOME");
    setOutcome(null);
    setAssessment(null);
    extraction.current = null;
    ask(null);
    setFailed(false);
    type(false);
    edit("");
  }
  return {
    phase,
    lang,
    choose,
    id,
    patient,
    change,
    start,
    newPatient,
    restart,
    outcome,
    assessment,
    failed,
    q,
    t,
    s,
    busy,
    y,
    n,
    submit,
    typing,
    draft,
    edit,
    voiceAllowed,
    mic,
    seconds,
    type,
    lastClip,
    transcribe,
    config,
  };
}
