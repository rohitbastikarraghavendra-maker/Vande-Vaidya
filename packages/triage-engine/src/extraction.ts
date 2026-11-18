import { z } from "zod";
import { SymptomCodeSchema } from "@rht/shared";
// packages/triage-engine/src/extraction.ts  (Team 1 internal — NOT part of the shared contract)
export const ExtractionResultSchema = z.strictObject({
  normalized_english: z.string(), // whole conversation, patient turns only
  turn_translations: z.array(
    z.strictObject({ turn_id: z.string(), text_english: z.string() }),
  ),
  language_detected: z.array(z.enum(["kn-IN", "hi-IN", "ta-IN", "en-IN"])),
  code_mixed: z.boolean(),
  chief_complaint: z.string(), // short English phrase
  complaint_group: z.enum([
    "chest_pain",
    "breathing",
    "abdominal_pain",
    "fever",
    "headache",
    "bleeding_pregnancy",
    "injury",
    "neuro",
    "general",
  ]),
  symptoms: z.array(
    z.strictObject({
      code: SymptomCodeSchema,
      name: z.string(),
      present: z.boolean(),
      duration: z.string().nullable(),
      duration_hours: z.number().nullable(),
      severity: z.enum(["mild", "moderate", "severe", "unknown"]),
      body_location: z.string().nullable(),
      onset: z.enum(["sudden", "gradual", "unknown"]),
      explicitly_stated: z.boolean(), // → source REPORTED / INFERRED
      patient_words: z.string().nullable(),
    }),
  ),
  patient: z.strictObject({
    // ONLY if explicitly said; else null
    name: z.string().nullable(),
    age: z.number().int().min(0).max(120).nullable(),
    sex: z.enum(["male", "female", "other", "unknown"]),
  }),
  history: z.strictObject({
    conditions: z.array(z.string()),
    medications: z.array(z.string()),
    pregnancy_status: z.enum([
      "pregnant",
      "possible",
      "not_pregnant",
      "unknown",
      "not_applicable",
    ]),
  }),
  missing_information: z.array(z.string()), // English, human-readable
  suggested_level: z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]),
  suggested_reason: z.string(),
  suggested_red_flags: z.array(
    z.strictObject({ code: z.string(), label: z.string() }),
  ),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
