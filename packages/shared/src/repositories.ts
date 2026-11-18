import type { Assessment, Patient, Referral, Facility } from "./types";
// packages/shared/src/repositories.ts

export interface AssessmentRepository {
  saveAssessment(assessment: Assessment): Promise<void>; // idempotent on assessment_id
  getAssessment(id: string): Promise<Assessment | null>;
  getAssessmentsForPatient(patientId: string): Promise<Assessment[]>; // newest first
  getAllAssessments(): Promise<Assessment[]>;
}

export interface PatientRepository {
  upsertFromAssessment(a: Assessment): Promise<Patient>; // merge rule in C.5
  getPatient(patientId: string): Promise<Patient | null>;
  getAllPatients(): Promise<Patient[]>;
}

export interface ReferralRepository {
  createReferral(referral: Referral): Promise<void>;
  updateReferral(referral: Referral): Promise<void>;
  getReferralForAssessment(assessmentId: string): Promise<Referral | null>;
  getReferralsForPatient(patientId: string): Promise<Referral[]>;
}

export interface FacilityRepository {
  getAllFacilities(): Promise<Facility[]>;
  getFacility(id: string): Promise<Facility | null>;
}
