import type {
  RedFlag,
  RedFlagCode,
  TriageLevel,
  Symptom,
  SymptomCode,
  PatientSnapshot,
  PregnancyStatus,
} from "@rht/shared";

function facts(
  symptoms: Symptom[],
  patient: PatientSnapshot,
  pregnancy: PregnancyStatus,
) {
  const positive = (code: SymptomCode) =>
    symptoms.find((s) => s.code === code && s.present);
  return {
    sex: patient.sex,
    age: patient.age,
    pregnancy,
    has: (code: SymptomCode) => !!positive(code),
    sev: (code: SymptomCode) => positive(code)?.severity,
    onset: (code: SymptomCode) => positive(code)?.onset,
    loc: (code: SymptomCode) => positive(code)?.body_location,
    hours: (code: SymptomCode) => positive(code)?.duration_hours,
  };
}
type Facts = ReturnType<typeof facts>;
interface Rule {
  code: RedFlagCode;
  label: string;
  level: TriageLevel;
  when: (s: Facts) => boolean; // Facts = present symptom codes, severities, durations, sex, age, pregnancy
}
const RULES: Rule[] = [
  {
    code: "CHEST_PAIN_DYSPNEA",
    level: "EMERGENCY",
    label: "Chest pain with breathing difficulty",
    when: (f) => f.has("chest_pain") && f.has("breathlessness"),
  },
  {
    code: "CHEST_PAIN_CARDIAC_SIGNS",
    level: "EMERGENCY",
    label: "Chest pain with sweating, radiation or fainting",
    when: (f) =>
      f.has("chest_pain") &&
      (f.has("sweating") ||
        f.has("pain_radiating_arm_jaw") ||
        f.has("fainting")),
  },
  {
    code: "SEVERE_BREATHLESSNESS",
    level: "EMERGENCY",
    label: "Severe breathing difficulty",
    when: (f) => f.sev("breathlessness") === "severe",
  },
  {
    code: "UNCONSCIOUS",
    level: "EMERGENCY",
    label: "Unconscious / unresponsive",
    when: (f) => f.has("unconscious"),
  },
  {
    code: "SEIZURE",
    level: "EMERGENCY",
    label: "Seizure / fits",
    when: (f) => f.has("seizure"),
  },
  {
    code: "STROKE_SIGNS",
    level: "EMERGENCY",
    label: "Possible stroke signs (face/limb/speech)",
    when: (f) =>
      f.has("face_droop") ||
      f.has("slurred_speech") ||
      (f.has("limb_weakness") && f.onset("limb_weakness") === "sudden"),
  },
  {
    code: "SEVERE_BLEEDING",
    level: "EMERGENCY",
    label: "Severe uncontrolled bleeding",
    when: (f) => f.has("severe_bleeding"),
  },
  {
    code: "ANAPHYLAXIS_SIGNS",
    level: "EMERGENCY",
    label: "Allergic swelling with breathing difficulty",
    when: (f) =>
      f.has("allergic_swelling") &&
      (f.has("breathlessness") ||
        f.loc("allergic_swelling")?.match(/face|lip|throat|tongue/) != null),
  },
  {
    code: "PREGNANCY_BLEEDING",
    level: "EMERGENCY",
    label: "Bleeding in pregnancy",
    when: (f) =>
      ["pregnant", "possible"].includes(f.pregnancy) &&
      f.has("vaginal_bleeding"),
  },
  {
    code: "MAJOR_TRAUMA",
    level: "EMERGENCY",
    label: "Serious injury",
    when: (f) => f.has("major_injury"),
  },
  {
    code: "SEVERE_DEHYDRATION",
    level: "EMERGENCY",
    label: "Unable to drink with drowsiness/confusion",
    when: (f) =>
      f.has("unable_to_drink") && (f.has("confusion") || f.has("fainting")),
  },
  {
    code: "FEVER_WITH_CONFUSION",
    level: "EMERGENCY",
    label: "Fever with confusion",
    when: (f) => f.has("fever") && f.has("confusion"),
  },
  {
    code: "CHEST_PAIN",
    level: "HIGH",
    label: "Chest pain",
    when: (f) => f.has("chest_pain"),
  },
  {
    code: "SEVERE_ABDOMINAL_PAIN",
    level: "HIGH",
    label: "Severe abdominal pain with vomiting",
    when: (f) => f.sev("abdominal_pain") === "severe" && f.has("vomiting"),
  },
  {
    code: "PREGNANCY_ABDOMINAL_PAIN",
    level: "HIGH",
    label: "Abdominal pain, pregnancy not excluded",
    when: (f) =>
      f.has("abdominal_pain") &&
      f.sex === "female" &&
      f.age !== null &&
      f.age >= 12 &&
      f.age <= 50 &&
      ["pregnant", "possible", "unknown"].includes(f.pregnancy),
  },
  {
    code: "PROLONGED_FEVER",
    level: "MEDIUM",
    label: "Fever lasting 5 days or more",
    when: (f) => f.has("fever") && (f.hours("fever") ?? 0) >= 120,
  },
];
export function evaluateRedFlags(
  symptoms: Symptom[],
  patient: PatientSnapshot,
  pregnancy: PregnancyStatus,
  source: RedFlag["source"],
): RedFlag[] {
  const state = facts(symptoms, patient, pregnancy);
  return RULES.filter((rule) => rule.when(state)).map((rule) => {
    // Keep a minimal set that still triggers this rule; unrelated symptoms are not evidence.
    let evidence = symptoms.filter((s) => s.present);
    for (const candidate of [...evidence]) {
      const rest = evidence.filter((s) => s !== candidate);
      if (rule.when(facts(rest, patient, pregnancy))) evidence = rest;
    }
    return {
      code: rule.code,
      label: rule.label,
      level: rule.level,
      source,
      evidence: evidence.map((s) => s.code),
    };
  });
}
