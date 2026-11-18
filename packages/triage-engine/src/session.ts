import type {
  Assessment,
  ConversationTurn,
  LanguageCode,
  PatientSnapshot,
  RedFlag,
  Symptom,
} from "@rht/shared";
import { keywordPregnancy, keywordSymptoms, symptom } from "./lexicon";
import { bank, selectNextQuestion } from "./questions";
import type { ExtractionResult } from "./extraction";
import { evaluateRedFlags } from "./rules";
import { resolveTriage } from "./triage";
export function turn(
  role: ConversationTurn["role"],
  text: string,
  input_mode: ConversationTurn["input_mode"],
  question_id: string | null = null,
  text_english: string | null = null,
): ConversationTurn {
  return {
    turn_id: crypto.randomUUID(),
    role,
    text,
    input_mode,
    question_id,
    text_english,
    created_at: new Date().toISOString(),
  };
}
export type Session = {
  assessment_id: string;
  created_at: string;
  patient_id: string;
  display_id: string;
  language: LanguageCode;
  patient: PatientSnapshot;
  turns: ConversationTurn[];
  errors: string[];
  provider: string;
  model: string | null;
  detected: LanguageCode[];
  confirmedFlags?: RedFlag[];
};
export function evaluate(s: Session, x: ExtractionResult | null) {
  const patientTurns = s.turns.filter((t) => t.role === "patient");
  const raw = patientTurns
    .filter((t) => t.input_mode !== "button")
    .map((t) => t.text)
    .join("\n");
  const reported = x?.patient;
  const patient = {
    ...s.patient,
    age: s.patient.age ?? reported?.age ?? null,
    name: s.patient.name ?? reported?.name ?? null,
    sex:
      s.patient.sex === "unknown"
        ? (reported?.sex ?? "unknown")
        : s.patient.sex,
  };
  const history: Assessment["history"] = x
    ? { ...x.history }
    : {
        conditions: [],
        medications: [],
        pregnancy_status: keywordPregnancy(raw),
      };
  let symptoms: Symptom[] = x
    ? x.symptoms.map(({ explicitly_stated, ...f }) => ({
        ...f,
        source: explicitly_stated ? "REPORTED" : "INFERRED",
      }))
    : keywordSymptoms(raw).map((f) => ({ ...f, source: "INFERRED" as const }));
  const missing = [
    ...(x?.missing_information ?? ["Clinical extraction unavailable"]),
  ];
  for (const t of patientTurns) {
    const q = bank.find((q) => q.id === t.question_id);
    if (!q) continue;
    const answer = (t.text_english ?? t.text).trim().toLowerCase();
    const yes = /^(yes|haan|haudu|haudu, kudeetini|ಹೌದು|हाँ)[.! ]*$/.test(answer);
    const no = /^(no|nahi|illa|ಇಲ್ಲ|नहीं)[.! ]*$/.test(answer);
    if (!yes && !no) {
      if (
        !x ||
        t.input_mode === "button" ||
        !x.turn_translations.some((a) => a.turn_id === t.turn_id)
      )
        missing.push("Answer unclear: " + q.text[0]);
      continue;
    }
    if (q.about === "pregnancy")
      history.pregnancy_status = yes ? "possible" : "not_pregnant";
    else
      symptoms = [
        ...symptoms.filter((f) => f.code !== q.about),
        symptom(q.about, q.inverse ? !yes : yes, t.text),
      ];
  }
  const kw = keywordSymptoms(raw);
  const flags = new Map<string, RedFlag>(
    (s.confirmedFlags ?? []).map((f) => [f.code, f]),
  );
  // Include raw positives with button positives even if extraction failed or omitted a symptom.
  const local = [...kw, ...symptoms.filter((f) => f.present)];
  for (const f of evaluateRedFlags(
    local,
    patient,
    history.pregnancy_status,
    "KEYWORD_RULE",
  ))
    flags.set(f.code, f);
  for (const f of evaluateRedFlags(
    symptoms,
    patient,
    history.pregnancy_status,
    x ? "DETERMINISTIC_RULE" : "KEYWORD_RULE",
  ))
    flags.set(f.code, f);
  for (const f of x?.suggested_red_flags ?? [])
    if (!flags.has(f.code))
      flags.set(f.code, {
        ...f,
        source: "LLM_SUGGESTED",
        level: x!.suggested_level,
        evidence: [],
      });
  const red_flags = [...flags.values()];
  if (
    symptoms.some((s) => s.present && s.code === "breathlessness") &&
    x?.suggested_level === "LOW"
  )
    missing.push("Breathing difficulty requires review");
  if (!symptoms.some((symptom) => symptom.present))
    missing.push("Presenting symptom needs clarification");
  const triage = resolveTriage(red_flags, x, missing);
  const asked = s.turns.flatMap((t) =>
    t.role === "assistant" && t.question_id ? [t.question_id] : [],
  );
  const question = x
    ? selectNextQuestion(
        triage.level,
        x.complaint_group,
        symptoms,
        patient,
        history.pregnancy_status,
        asked,
      )
    : null;
  return { symptoms, patient, history, missing, red_flags, triage, question };
}
export type Evaluation = ReturnType<typeof evaluate>;

// If a later service call fails, keep previously confirmed evidence and add local findings.
export function degradedEvaluation(
  s: Session,
  previous: ExtractionResult | null,
): Evaluation {
  const local = evaluate(s, null);
  if (!previous) return local;
  const prior = evaluate(s, previous);
  const missing = [...new Set([...prior.missing, ...local.missing])];
  const triage = resolveTriage(
    local.red_flags,
    { ...previous, confidence: "LOW" },
    missing,
  );
  if (triage.level === "LOW" || triage.level === "MEDIUM")
    Object.assign(triage, local.triage);
  return {
    ...local,
    patient: prior.patient,
    history: prior.history,
    missing,
    triage,
    symptoms: [
      ...prior.symptoms,
      ...local.symptoms.filter(
        (f) => !prior.symptoms.some((old) => old.code === f.code),
      ),
    ],
  };
}
