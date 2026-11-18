export interface Patient {
  patientId: string;
  displayId: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
}
export interface TranscriptState {
  raw: string;
  confirmed: string;
}
export interface ExtractedSymptom {
  id: string;
  name: string;
  sourceText?: string;
}
export interface ExtractedSymptoms {
  symptoms: ExtractedSymptom[];
}
export type Language = "en" | "kn" | "hi";
export interface AssessedSymptom extends ExtractedSymptom {
  onset: string;
  severity: number;
}
export interface PatientIntake {
  patient: Patient;
  language: Language;
  transcript: TranscriptState;
  symptoms: AssessedSymptom[];
}
export function identify() {
  const patientId = crypto.randomUUID();
  return { patientId, displayId: "PAT-" + patientId.slice(0, 6).toUpperCase() };
}
