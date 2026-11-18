import type {
  ConversationTurn,
  LanguageCode,
  PatientSnapshot,
  TriageLevel,
} from "@rht/shared";
import { ExtractionResultSchema, type ExtractionResult } from "./extraction";
import { keywordSymptoms, keywordPregnancy, symptom } from "./lexicon";
export type ExtractInput = {
  turns: ConversationTurn[];
  language_hint: LanguageCode;
  patient: PatientSnapshot;
  answered_question_ids: string[];
};
export interface ClinicalExtractor {
  extract(input: ExtractInput): Promise<ExtractionResult>;
}
export const scripts = {
  low: "Main Sunita, 28 saal. Mujhe kal se thoda sa sardi hai aur naak beh rahi hai, bukhar nahi hai.",
  medium:
    "Nanna hesaru Manjunath, thirty five. Nange one week inda fever ide, body pain ide, appetite illa.",
  high: "Mera naam Priya hai, 22 saal. Mere pet mein right side bahut tez dard hai since morning, ulti bhi ho rahi hai.",
  emergency:
    "Nange half an hour inda chest alli tumba pain ide, usiraata kashta aagtide, bevaru bartide. Nanage fifty four years.",
  hinglish: "Mereko kal se chest mein pain ho raha hai.",
  headache: "Mild headache since morning, no vomiting, no weakness.",
  fever: "Fever for three days and feeling weak.",
};
const translations = new Map(
  Object.entries(scripts).map(([k, v]) => [
    v,
    (
      {
        low: "I am Sunita, 28. I have had a mild cold and runny nose since yesterday, without fever.",
        medium:
          "I am Manjunath, 35. I have had a fever for a week, body aches and no appetite.",
        high: "I am Priya, 22. I have had severe right-sided abdominal pain since morning and vomiting.",
        emergency:
          "Severe chest pain for half an hour, difficulty breathing and sweating. I am 54 years old.",
        hinglish: "I have had chest pain since yesterday.",
        headache: scripts.headache,
        fever: scripts.fever,
      } as Record<string, string>
    )[k],
  ]),
);
export class MockClinicalExtractor implements ClinicalExtractor {
  async extract(input: ExtractInput) {
    const turns = input.turns.filter((t) => t.role === "patient");
    const first = turns[0]?.text ?? "";
    const text = turns.map((t) => t.text).join("\n");
    const symptoms = keywordSymptoms(text);
    const codes = symptoms.map((s) => s.code);
    let level: TriageLevel = "MEDIUM";
    let group: ExtractionResult["complaint_group"] = "general";
    const missing: string[] = [];
    const patient = {
      name: null as string | null,
      age: null as number | null,
      sex: input.patient.sex,
    };
    if (codes.includes("chest_pain")) group = "chest_pain";
    else if (codes.includes("abdominal_pain")) group = "abdominal_pain";
    else if (codes.includes("runny_nose")) group = "general";
    else if (codes.includes("fever")) group = "fever";
    else if (codes.includes("headache")) group = "headache";
    else if (codes.includes("breathlessness")) group = "breathing";
    else if (codes.includes("vaginal_bleeding")) group = "bleeding_pregnancy";
    else if (codes.includes("major_injury")) group = "injury";
    else if (codes.includes("limb_weakness")) group = "neuro";
    if (first === scripts.low) {
      level = "LOW";
      patient.name = "Sunita";
      patient.age = 28;
    }
    if (first === scripts.headache) {
      level = "LOW";
      symptoms.push(symptom("limb_weakness", false, "no weakness"));
    }
    if (first === scripts.medium) {
      patient.name = "Manjunath";
      patient.age = 35;
    }
    if (first === scripts.high) {
      patient.name = "Priya";
      patient.age = 22;
    }
    if (first === scripts.emergency) patient.age = 54;
    // Derive suggested_level from symptom codes so mock output matches rules engine.
    // Only override when no script-specific level was already set above.
    if (level === "MEDIUM") {
      const present = symptoms.filter((s) => s.present).map((s) => s.code);
      if (
        present.includes("chest_pain") &&
        (present.includes("breathlessness") ||
          present.includes("sweating") ||
          present.includes("fainting") ||
          present.includes("pain_radiating_arm_jaw"))
      ) {
        level = "EMERGENCY";
      } else if (
        present.includes("unconscious") ||
        present.includes("seizure") ||
        present.includes("face_droop") ||
        present.includes("slurred_speech") ||
        present.includes("major_injury") ||
        present.includes("severe_bleeding") ||
        (present.includes("breathlessness") &&
          symptoms.find((s) => s.code === "breathlessness")?.severity === "severe")
      ) {
        level = "EMERGENCY";
      } else if (
        present.includes("chest_pain") ||
        (present.includes("abdominal_pain") && present.includes("vomiting")) ||
        (present.includes("fever") && present.includes("confusion"))
      ) {
        level = "HIGH";
      }
    }
    for (const s of symptoms) {
      if (s.code === "fever" && /bukhar nahi|no fever/i.test(text))
        s.present = false;
      if (s.code === "vomiting" && /no vomiting/i.test(text)) s.present = false;
      if (s.code === "fever") {
        const duration = text.match(/one week|three days|two days/i)?.[0];
        if (duration) {
          s.duration = duration;
          s.duration_hours = (
            { "one week": 168, "three days": 72, "two days": 48 } as Record<
              string,
              number
            >
          )[duration.toLowerCase()];
        }
      }
      if (s.code === "abdominal_pain" && first === scripts.high) {
        s.severity = "severe";
        s.body_location = "right side";
        s.duration = "since morning";
      }
    }
    const extra = turns
      .slice(1)
      .filter(
        (t) =>
          t.input_mode !== "button" &&
          !/^(yes|no|haudu|haan|nahi|illa|haudu, kudeetini|pata nahi)[.! ]*$/i.test(
            t.text,
          ),
      );
    if (!translations.has(first) || extra.length)
      missing.push("Full symptom description requires clinical review");
    const translated = turns.flatMap((t) => {
      const line = translations.get(t.text) ?? t.text_english;
      return line ? [{ turn_id: t.turn_id, text_english: line }] : [];
    });
    return ExtractionResultSchema.parse({
      normalized_english: translated.map((t) => t.text_english).join("\n"),
      turn_translations: translated,
      language_detected: [input.language_hint],
      code_mixed: /nange|mereko|sardi|nanna|mera naam/i.test(text),
      chief_complaint:
        symptoms.find((s) => s.present)?.name ?? "Unclear complaint",
      complaint_group: group,
      symptoms: symptoms.map(({ source, ...s }) => ({
        ...s,
        explicitly_stated: true,
      })),
      patient,
      history: {
        conditions: [],
        medications: [],
        pregnancy_status: keywordPregnancy(text),
      },
      missing_information: missing,
      suggested_level: level,
      suggested_reason:
        level === "EMERGENCY"
          ? "Emergency symptom combination detected"
          : level === "HIGH"
            ? "High-priority symptom pattern"
            : level === "LOW"
              ? "Low-acuity symptoms — monitor"
              : "Symptoms warrant clinical review",
      suggested_red_flags: [],
      confidence: missing.length ? "LOW" : level === "LOW" ? "HIGH" : "MEDIUM",
    });
  }
}
