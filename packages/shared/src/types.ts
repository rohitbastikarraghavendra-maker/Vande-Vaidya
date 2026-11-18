// packages/shared/src/types.ts  (enums section)

export const SCHEMA_VERSION = "1.0" as const;

export type TriageLevel = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
export const TRIAGE_ORDER: Record<TriageLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  EMERGENCY: 3,
};

export type LanguageCode = "kn-IN" | "hi-IN" | "ta-IN" | "en-IN";
export type Sex = "male" | "female" | "other" | "unknown";
export type Severity = "mild" | "moderate" | "severe" | "unknown";
export type Onset = "sudden" | "gradual" | "unknown";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

/** REPORTED = patient said it. INFERRED = derived by the system (LLM or rule). */
export type InfoSource = "REPORTED" | "INFERRED";

/** DETERMINISTIC_RULE = structured rule on extracted symptoms.
 *  KEYWORD_RULE       = deterministic lexicon match on raw transcript (works without LLM).
 *  LLM_SUGGESTED      = model-suggested; can only RAISE triage, never lower it. */
export type RedFlagSource =
  "DETERMINISTIC_RULE" | "KEYWORD_RULE" | "LLM_SUGGESTED";

export type PregnancyStatus =
  "pregnant" | "possible" | "not_pregnant" | "unknown" | "not_applicable";

export type ReferralStatus =
  "NOT_REFERRED" | "PENDING" | "REFERRED" | "ACKNOWLEDGED" | "COMPLETED";

export type SyncStatus = "LOCAL_ONLY" | "PENDING" | "SYNCED" | "FAILED";

export type FacilityType =
  "SUB_CENTRE" | "PHC" | "CHC" | "DISTRICT_HOSPITAL" | "EMERGENCY_HOSPITAL";

export type FacilityService =
  | "general_opd"
  | "emergency_24x7"
  | "cardiac_care"
  | "obstetric_emergency"
  | "trauma"
  | "stroke_care"
  | "blood_transfusion"
  | "pediatrics"
  | "lab"
  | "ambulance";

/** Canonical symptom vocabulary. The LLM MUST map every symptom to one of these
 *  (or "other"). Deterministic rules only read these codes. */
export type SymptomCode =
  | "chest_pain"
  | "pain_radiating_arm_jaw"
  | "breathlessness"
  | "sweating"
  | "fainting"
  | "unconscious"
  | "seizure"
  | "face_droop"
  | "limb_weakness"
  | "slurred_speech"
  | "confusion"
  | "severe_bleeding"
  | "vaginal_bleeding"
  | "allergic_swelling"
  | "major_injury"
  | "unable_to_drink"
  | "vomiting"
  | "diarrhea"
  | "fever"
  | "cough"
  | "runny_nose"
  | "sore_throat"
  | "headache"
  | "abdominal_pain"
  | "body_ache"
  | "rash"
  | "dizziness"
  | "loss_of_appetite"
  | "burning_urination"
  | "other";

/** Red-flag codes used in v1.0. String type so new codes are an additive (minor) change. */
export type RedFlagCode = string;
export const RED_FLAG_CODES = [
  "CHEST_PAIN_DYSPNEA", // EMERGENCY
  "CHEST_PAIN_CARDIAC_SIGNS", // EMERGENCY (chest pain + sweating / radiation / fainting)
  "SEVERE_BREATHLESSNESS", // EMERGENCY
  "UNCONSCIOUS", // EMERGENCY
  "SEIZURE", // EMERGENCY
  "STROKE_SIGNS", // EMERGENCY
  "SEVERE_BLEEDING", // EMERGENCY
  "ANAPHYLAXIS_SIGNS", // EMERGENCY
  "PREGNANCY_BLEEDING", // EMERGENCY
  "MAJOR_TRAUMA", // EMERGENCY
  "SEVERE_DEHYDRATION", // EMERGENCY
  "FEVER_WITH_CONFUSION", // EMERGENCY
  "CHEST_PAIN", // HIGH (chest pain alone is never below HIGH)
  "SEVERE_ABDOMINAL_PAIN", // HIGH
  "PREGNANCY_ABDOMINAL_PAIN", // HIGH
  "PROLONGED_FEVER", // MEDIUM (fever >= 5 days)
] as const;

// packages/shared/src/types.ts  (entities section)

export interface Patient {
  patient_id: string; // UUID v4 — the ONLY join key
  display_id: string; // "PAT-7K2Q" — human-readable, NOT guaranteed unique
  name: string | null; // null unless the patient/ASHA provided it
  age: number | null; // null unless stated — never guessed
  sex: Sex;
  village: string | null;
  phone: string | null;
  created_at: string; // ISO-8601
  updated_at: string; // ISO-8601
}

/** Copy of what was known about the patient AT assessment time (Team 1 writes). */
export type PatientSnapshot = Pick<
  Patient,
  "name" | "age" | "sex" | "village" | "phone"
>;

export interface ConversationTurn {
  turn_id: string;
  role: "patient" | "assistant";
  text: string; // exactly as transcribed / shown
  text_english: string | null; // normalized English, if available
  input_mode: "voice" | "text" | "button";
  question_id: string | null; // set for assistant questions and button answers
  created_at: string;
}

export interface Symptom {
  code: SymptomCode;
  name: string; // English label: "chest pain"
  present: boolean; // false => relevant negative ("no fever")
  duration: string | null; // as reported: "30 minutes", "2 days"
  duration_hours: number | null; // normalized if derivable, else null
  severity: Severity;
  body_location: string | null;
  onset: Onset;
  source: InfoSource;
  patient_words: string | null; // original phrase, e.g. "chest alli tumba pain"
}

export interface RedFlag {
  code: RedFlagCode;
  label: string; // English, clinician-readable
  level: TriageLevel; // minimum triage level this flag forces
  source: RedFlagSource;
  evidence: string[]; // symptom codes and/or matched phrases
}

export interface TriageResult {
  level: TriageLevel; // FINAL level. Team 2 must never change it.
  reason: string; // one line, English
  requires_escalation: boolean; // true iff level === "EMERGENCY"
  confidence: Confidence;
  rule_level: TriageLevel | null; // max level from deterministic + keyword rules
  model_level: TriageLevel | null; // LLM suggestion; null if LLM unavailable
  decided_by: "RULE" | "MODEL" | "RULE_AND_MODEL" | "FALLBACK";
  recommended_action: string; // English, for ASHA/doctor
  recommended_facility_type: FacilityType | null; // minimum suitable facility type
}

export interface EscalationEvent {
  event_id: string; // UUID
  created_at: string;
  reason: string;
  red_flag_codes: RedFlagCode[];
  patient_instruction_shown: boolean; // emergency screen was displayed on device
  emergency_call_offered: boolean; // "Call 108" affordance was shown
}

export interface ClinicalNote {
  format: "SBAR";
  situation: string;
  background: string;
  assessment: string; // triage reasoning — NOT a diagnosis
  recommendation: string;
  relevant_positives: string[];
  relevant_negatives: string[];
  reported_information: string[]; // what the patient said
  inferred_information: string[]; // what the system derived (labelled as such)
  missing_information: string[];
  vitals: "NOT_RECORDED"; // v1.0 never records vitals — never fabricate
  disclaimer: string;
  generated_by: "TEMPLATE" | "TEMPLATE_PLUS_LLM";
  text: string; // pre-rendered plain-text note for display/copy
}

export interface ReferralSummary {
  // embedded in Assessment; TEAM 2 OWNS
  status: ReferralStatus;
  referral_id: string | null;
  facility_id: string | null;
  updated_at: string | null;
}

export interface SyncMetadata {
  // TEAM 2 OWNS (Team 1 only sets initial value)
  status: SyncStatus;
  last_synced_at: string | null;
  updated_at: string;
  origin: "patient_app" | "asha_app" | "mock";
}

export interface Assessment {
  schema_version: "1.0";
  assessment_id: string; // UUID v4
  patient_id: string; // UUID v4 (FK -> Patient)
  patient_display_id: string;
  created_at: string; // conversation start
  completed_at: string; // triage finalized

  language: {
    primary: LanguageCode;
    detected: LanguageCode[];
    code_mixed: boolean;
  };
  patient: PatientSnapshot;
  transcript: {
    original: string;
    normalized_english: string;
    turns: ConversationTurn[];
  };

  chief_complaint: string; // English, short
  symptoms: Symptom[];
  history: {
    conditions: string[];
    medications: string[];
    pregnancy_status: PregnancyStatus;
  };

  red_flags: RedFlag[];
  triage: TriageResult;
  escalation: EscalationEvent | null; // non-null iff triage.requires_escalation
  clinical_note: ClinicalNote;
  missing_information: string[];

  pipeline: {
    degraded: boolean; // true if STT/LLM failed and fallbacks were used
    stt_provider: string; // "sarvam" | "web-speech" | "typed" | "mock"
    llm_model: string | null;
    time_to_triage_ms: number | null;
    errors: string[]; // short codes: "LLM_TIMEOUT", "STT_FAILED"
  };

  // ---- TEAM 2 OWNED (Team 1 writes the defaults below and never touches again) ----
  referral: ReferralSummary; // default { status:"NOT_REFERRED", referral_id:null, facility_id:null, updated_at:null }
  sync: SyncMetadata; // default { status:"PENDING", last_synced_at:null, updated_at:<completed_at>, origin:"patient_app" }
}

export interface Referral {
  referral_id: string; // UUID
  assessment_id: string;
  patient_id: string;
  facility_id: string;
  triage_level: TriageLevel; // COPIED from assessment.triage.level — read-only
  status: ReferralStatus;
  reason: string;
  history: { status: ReferralStatus; at: string; note: string | null }[];
  created_at: string;
  updated_at: string;
  sync: SyncMetadata;
}

export interface Facility {
  facility_id: string; // "FAC-PHC-01"
  name: string;
  type: FacilityType;
  village: string;
  latitude: number;
  longitude: number;
  phone: string;
  emergency_capable: boolean;
  open_24x7: boolean;
  services: FacilityService[];
  is_demo_data: true; // v1.0 directory is fictional demo data
  last_verified: string | null;
}

export interface SyncOp {
  // TEAM 2 OWNS — ASHA offline queue item
  op_id: string; // UUID, idempotency key
  type: "REFERRAL_UPSERT" | "ASHA_NOTE_ADD" | "FOLLOWUP_UPDATE";
  entity_id: string;
  payload:
    Referral | AshaNote | { assessment_id: string; follow_up_done: boolean };
  created_at: string;
  attempts: number;
  status: "QUEUED" | "SENDING" | "FAILED";
  last_error: string | null;
}

export interface AshaNote {
  // P1, TEAM 2 OWNS
  note_id: string;
  patient_id: string;
  assessment_id: string | null;
  text: string;
  created_at: string;
  sync: SyncMetadata;
}
