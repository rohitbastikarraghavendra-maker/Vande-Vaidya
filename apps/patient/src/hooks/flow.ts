export type PatientFlowState =
  | "WELCOME"
  | "READY"
  | "PERMISSION"
  | "LISTENING"
  | "TRANSCRIBING"
  | "EXTRACTING"
  | "QUESTION"
  | "RESULT"
  | "EMERGENCY"
  | "ERROR";
