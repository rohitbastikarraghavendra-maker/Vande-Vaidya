import { z } from "zod";

import { TRIAGE_ORDER } from "./types";

export const TriageLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "EMERGENCY"]);

export const LanguageCodeSchema = z.enum(["kn-IN", "hi-IN", "ta-IN", "en-IN"]);

export const SexSchema = z.enum(["male", "female", "other", "unknown"]);

export const SeveritySchema = z.enum(["mild", "moderate", "severe", "unknown"]);

export const OnsetSchema = z.enum(["sudden", "gradual", "unknown"]);

export const ConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const InfoSourceSchema = z.enum(["REPORTED", "INFERRED"]);

export const RedFlagSourceSchema = z.enum([
  "DETERMINISTIC_RULE",
  "KEYWORD_RULE",
  "LLM_SUGGESTED",
]);

export const PregnancyStatusSchema = z.enum([
  "pregnant",
  "possible",
  "not_pregnant",
  "unknown",
  "not_applicable",
]);

export const ReferralStatusSchema = z.enum([
  "NOT_REFERRED",
  "PENDING",
  "REFERRED",
  "ACKNOWLEDGED",
  "COMPLETED",
]);

export const SyncStatusSchema = z.enum([
  "LOCAL_ONLY",
  "PENDING",
  "SYNCED",
  "FAILED",
]);

export const FacilityTypeSchema = z.enum([
  "SUB_CENTRE",
  "PHC",
  "CHC",
  "DISTRICT_HOSPITAL",
  "EMERGENCY_HOSPITAL",
]);

export const FacilityServiceSchema = z.enum([
  "general_opd",
  "emergency_24x7",
  "cardiac_care",
  "obstetric_emergency",
  "trauma",
  "stroke_care",
  "blood_transfusion",
  "pediatrics",
  "lab",
  "ambulance",
]);

export const SymptomCodeSchema = z.enum([
  "chest_pain",
  "pain_radiating_arm_jaw",
  "breathlessness",
  "sweating",
  "fainting",
  "unconscious",
  "seizure",
  "face_droop",
  "limb_weakness",
  "slurred_speech",
  "confusion",
  "severe_bleeding",
  "vaginal_bleeding",
  "allergic_swelling",
  "major_injury",
  "unable_to_drink",
  "vomiting",
  "diarrhea",
  "fever",
  "cough",
  "runny_nose",
  "sore_throat",
  "headache",
  "abdominal_pain",
  "body_ache",
  "rash",
  "dizziness",
  "loss_of_appetite",
  "burning_urination",
  "other",
]);

export const RedFlagCodeSchema = z.string();

export const PatientSchema = z.strictObject({
  patient_id: z.uuidv4(),
  display_id: z.string().regex(/^PAT-[0-9A-HJKMNP-TV-Z]{4}$/),
  name: z.string().nullable(),
  age: z.number().int().min(0).max(120).nullable(),
  sex: SexSchema,
  village: z.string().nullable(),
  phone: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const PatientSnapshotSchema = PatientSchema.pick({
  name: true,
  age: true,
  sex: true,
  village: true,
  phone: true,
});

export const ConversationTurnSchema = z.strictObject({
  turn_id: z.uuidv4(),
  role: z.union([z.literal("patient"), z.literal("assistant")]),
  text: z.string(),
  text_english: z.string().nullable(),
  input_mode: z.union([
    z.literal("voice"),
    z.literal("text"),
    z.literal("button"),
  ]),
  question_id: z.string().nullable(),
  created_at: z.iso.datetime(),
});

export const SymptomSchema = z.strictObject({
  code: SymptomCodeSchema,
  name: z.string(),
  present: z.boolean(),
  duration: z.string().nullable(),
  duration_hours: z.number().nullable(),
  severity: SeveritySchema,
  body_location: z.string().nullable(),
  onset: OnsetSchema,
  source: InfoSourceSchema,
  patient_words: z.string().nullable(),
});

export const RedFlagSchema = z.strictObject({
  code: RedFlagCodeSchema,
  label: z.string(),
  level: TriageLevelSchema,
  source: RedFlagSourceSchema,
  evidence: z.array(z.string()),
});

export const TriageResultSchema = z.strictObject({
  level: TriageLevelSchema,
  reason: z.string(),
  requires_escalation: z.boolean(),
  confidence: ConfidenceSchema,
  rule_level: TriageLevelSchema.nullable(),
  model_level: TriageLevelSchema.nullable(),
  decided_by: z.union([
    z.literal("RULE"),
    z.literal("MODEL"),
    z.literal("RULE_AND_MODEL"),
    z.literal("FALLBACK"),
  ]),
  recommended_action: z.string(),
  recommended_facility_type: FacilityTypeSchema.nullable(),
});

export const EscalationEventSchema = z.strictObject({
  event_id: z.uuidv4(),
  created_at: z.iso.datetime(),
  reason: z.string(),
  red_flag_codes: z.array(RedFlagCodeSchema),
  patient_instruction_shown: z.boolean(),
  emergency_call_offered: z.boolean(),
});

export const ClinicalNoteSchema = z.strictObject({
  format: z.literal("SBAR"),
  situation: z.string(),
  background: z.string(),
  assessment: z.string(),
  recommendation: z.string(),
  relevant_positives: z.array(z.string()),
  relevant_negatives: z.array(z.string()),
  reported_information: z.array(z.string()),
  inferred_information: z.array(z.string()),
  missing_information: z.array(z.string()),
  vitals: z.literal("NOT_RECORDED"),
  disclaimer: z.string(),
  generated_by: z.union([
    z.literal("TEMPLATE"),
    z.literal("TEMPLATE_PLUS_LLM"),
  ]),
  text: z.string(),
});

export const ReferralSummarySchema = z.strictObject({
  status: ReferralStatusSchema,
  referral_id: z.uuidv4().nullable(),
  facility_id: z.string().nullable(),
  updated_at: z.iso.datetime().nullable(),
});

export const SyncMetadataSchema = z.strictObject({
  status: SyncStatusSchema,
  last_synced_at: z.iso.datetime().nullable(),
  updated_at: z.iso.datetime(),
  origin: z.union([
    z.literal("patient_app"),
    z.literal("asha_app"),
    z.literal("mock"),
  ]),
});

export const AssessmentSchema = z
  .strictObject({
    schema_version: z.literal("1.0"),
    assessment_id: z.uuidv4(),
    patient_id: z.uuidv4(),
    patient_display_id: z.string().regex(/^PAT-[0-9A-HJKMNP-TV-Z]{4}$/),
    created_at: z.iso.datetime(),
    completed_at: z.iso.datetime(),
    language: z.strictObject({
      primary: LanguageCodeSchema,
      detected: z.array(LanguageCodeSchema),
      code_mixed: z.boolean(),
    }),
    patient: PatientSnapshotSchema,
    transcript: z.strictObject({
      original: z.string(),
      normalized_english: z.string(),
      turns: z.array(ConversationTurnSchema),
    }),
    chief_complaint: z.string(),
    symptoms: z.array(SymptomSchema),
    history: z.strictObject({
      conditions: z.array(z.string()),
      medications: z.array(z.string()),
      pregnancy_status: PregnancyStatusSchema,
    }),
    red_flags: z.array(RedFlagSchema),
    triage: TriageResultSchema,
    escalation: EscalationEventSchema.nullable(),
    clinical_note: ClinicalNoteSchema,
    missing_information: z.array(z.string()),
    pipeline: z.strictObject({
      degraded: z.boolean(),
      stt_provider: z.string(),
      llm_model: z.string().nullable(),
      time_to_triage_ms: z.number().nullable(),
      errors: z.array(z.string()),
    }),
    referral: ReferralSummarySchema,
    sync: SyncMetadataSchema,
  })
  .refine(
    (a) =>
      a.triage.requires_escalation === (a.triage.level === "EMERGENCY") &&
      !!a.escalation === a.triage.requires_escalation,
    "Invalid escalation",
  )
  .refine(
    (a) =>
      a.triage.rule_level === null ||
      TRIAGE_ORDER[a.triage.level] >= TRIAGE_ORDER[a.triage.rule_level],
    "Below rule floor",
  )
  .refine(
    (a) => a.assessment_id !== a.patient_id,
    "Patient and assessment IDs must differ",
  )
  .refine(
    (a) =>
      a.red_flags
        .filter((f) => f.source !== "LLM_SUGGESTED")
        .every(
          (f) =>
            a.triage.rule_level !== null &&
            TRIAGE_ORDER[a.triage.rule_level] >= TRIAGE_ORDER[f.level],
        ),
    "Rule level must cover every deterministic flag",
  );

export const ReferralSchema = z.strictObject({
  referral_id: z.uuidv4(),
  assessment_id: z.uuidv4(),
  patient_id: z.uuidv4(),
  facility_id: z.string(),
  triage_level: TriageLevelSchema,
  status: ReferralStatusSchema,
  reason: z.string(),
  history: z.array(
    z.strictObject({
      status: ReferralStatusSchema,
      at: z.iso.datetime(),
      note: z.string().nullable(),
    }),
  ),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  sync: SyncMetadataSchema,
});

export const FacilitySchema = z.strictObject({
  facility_id: z.string(),
  name: z.string(),
  type: FacilityTypeSchema,
  village: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string(),
  emergency_capable: z.boolean(),
  open_24x7: z.boolean(),
  services: z.array(FacilityServiceSchema),
  is_demo_data: z.literal(true),
  last_verified: z.string().nullable(),
});

export const AshaNoteSchema = z.strictObject({
  note_id: z.uuidv4(),
  patient_id: z.uuidv4(),
  assessment_id: z.uuidv4().nullable(),
  text: z.string(),
  created_at: z.iso.datetime(),
  sync: SyncMetadataSchema,
});

export const SyncOpSchema = z.strictObject({
  op_id: z.uuidv4(),
  type: z.union([
    z.literal("REFERRAL_UPSERT"),
    z.literal("ASHA_NOTE_ADD"),
    z.literal("FOLLOWUP_UPDATE"),
  ]),
  entity_id: z.string(),
  payload: z.union([
    ReferralSchema,
    AshaNoteSchema,
    z.strictObject({
      assessment_id: z.uuidv4(),
      follow_up_done: z.boolean(),
    }),
  ]),
  created_at: z.iso.datetime(),
  attempts: z.number(),
  status: z.union([
    z.literal("QUEUED"),
    z.literal("SENDING"),
    z.literal("FAILED"),
  ]),
  last_error: z.string().nullable(),
});
