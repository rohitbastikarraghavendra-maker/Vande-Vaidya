import type { ClinicalNote } from "@rht/shared";
import type { Evaluation } from "./session";
export function buildClinicalNote(
  e: Evaluation,
  complaint: string,
): ClinicalNote {
  const { symptoms, patient, history, triage } = e;
  const positives = symptoms.filter((s) => s.present).map((s) => s.name);
  const negatives = symptoms.filter((s) => !s.present).map((s) => s.name);
  const situation =
    (patient.age === null
      ? "Patient (age unknown)"
      : patient.age + "-year-old patient") +
    "; complaint: " +
    complaint +
    ".";
  const background =
    "Conditions: " +
    (history.conditions.join(", ") || "not reported") +
    ". Medicines: " +
    (history.medications.join(", ") || "not reported") +
    ". Pregnancy status: " +
    history.pregnancy_status.replaceAll("_", " ") +
    ". Vitals not recorded.";
  const assessment =
    "Triage " +
    triage.level +
    ". " +
    triage.reason +
    " This is not a diagnosis.";
  const recommendation = triage.recommended_action;
  return {
    format: "SBAR",
    situation,
    background,
    assessment,
    recommendation,
    relevant_positives: positives,
    relevant_negatives: negatives,
    reported_information: [
      ...symptoms
        .filter((s) => s.source === "REPORTED")
        .map((s) => (s.present ? "" : "Denies ") + s.name),
      ...[
        patient.name,
        patient.age !== null ? "Age " + patient.age : null,
        patient.sex === "unknown" ? null : patient.sex,
      ].filter((s): s is string => !!s),
    ],
    inferred_information: [
      ...symptoms.filter((s) => s.source === "INFERRED").map((s) => s.name),
      ...symptoms
        .filter((s) => s.duration_hours !== null)
        .map((s) => s.name + ": " + s.duration_hours + " hours"),
      ...e.red_flags.map((f) => f.label + " (" + f.source + ")"),
    ],
    missing_information: e.missing,
    vitals: "NOT_RECORDED",
    disclaimer: "Automated triage. Clinical review is required.",
    generated_by: "TEMPLATE",
    text: [
      "Situation: " + situation,
      "Background: " + background,
      "Assessment: " + assessment,
      "Recommendation: " + recommendation,
      ...(e.missing.length ? ["Missing: " + e.missing.join("; ")] : []),
    ].join("\n"),
  };
}
