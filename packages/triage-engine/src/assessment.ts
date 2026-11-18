import { AssessmentSchema, type Assessment } from "@rht/shared";
import { buildClinicalNote } from "./note";
import type { Session, Evaluation } from "./session";
import type { ExtractionResult } from "./extraction";
export function buildAssessment(
  s: Session,
  e: Evaluation,
  x: ExtractionResult | null,
  completed_at = new Date().toISOString(),
): Assessment {
  const turns = s.turns.map((t) => ({
    ...t,
    text_english:
      t.text_english ??
      x?.turn_translations.find((v) => v.turn_id === t.turn_id)?.text_english ??
      null,
  }));
  const patientTurns = turns.filter((t) => t.role === "patient");
  const original = patientTurns.map((t) => t.text).join("\n");
  const represented = new Set(x?.turn_translations.map((t) => t.turn_id) ?? []);
  const normalized = [
    x?.normalized_english ?? "",
    ...patientTurns
      .filter((t) => t.input_mode === "button" && !represented.has(t.turn_id))
      .map((t) => {
        const question = turns.find(
          (q) => q.role === "assistant" && q.question_id === t.question_id,
        );
        return (
          (question?.text_english ?? question?.text ?? "Question") +
          " " +
          (t.text_english ?? t.text)
        );
      }),
  ]
    .filter(Boolean)
    .join("\n");
  const complaint =
    x?.chief_complaint ||
    e.symptoms.find((s) => s.present)?.name ||
    "Unclear complaint";
  return AssessmentSchema.parse({
    schema_version: "1.0",
    assessment_id: s.assessment_id,
    patient_id: s.patient_id,
    patient_display_id: s.display_id,
    created_at: s.created_at,
    completed_at,
    language: {
      primary: s.language,
      detected: [...new Set([...s.detected, ...(x?.language_detected ?? [])])],
      code_mixed:
        x?.code_mixed ??
        (/[a-z]/i.test(original) && /[\u0900-\u0d7f]/.test(original)),
    },
    patient: e.patient,
    transcript: { original, normalized_english: normalized, turns },
    chief_complaint: complaint,
    symptoms: e.symptoms,
    history: e.history,
    red_flags: e.red_flags,
    triage: e.triage,
    escalation: e.triage.requires_escalation
      ? {
          event_id: crypto.randomUUID(),
          created_at: completed_at,
          reason: e.triage.reason,
          red_flag_codes: e.red_flags.map((f) => f.code),
          patient_instruction_shown: true,
          emergency_call_offered: true,
        }
      : null,
    clinical_note: buildClinicalNote(e, complaint),
    missing_information: e.missing,
    pipeline: {
      degraded: s.errors.length > 0,
      errors: [...new Set(s.errors)],
      stt_provider: s.provider,
      llm_model: x ? s.model : null,
      time_to_triage_ms: Math.max(
        0,
        Date.parse(completed_at) - Date.parse(s.created_at),
      ),
    },
    referral: {
      status: "NOT_REFERRED",
      referral_id: null,
      facility_id: null,
      updated_at: null,
    },
    sync: {
      status: "PENDING",
      last_synced_at: null,
      updated_at: completed_at,
      origin: "patient_app",
    },
  });
}
