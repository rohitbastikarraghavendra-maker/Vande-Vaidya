import {
  AssessmentSchema,
  type Assessment,
  type AssessmentRepository,
} from "../index";

export class ConsoleAssessmentRepository implements AssessmentRepository {
  private memory = new Map<string, Assessment>();
  constructor(private storage?: Storage) {}
  async saveAssessment(input: Assessment) {
    const assessment = AssessmentSchema.parse(input);
    const id = assessment.assessment_id;
    if (!this.memory.has(id)) this.memory.set(id, assessment);
    const key = "rht.demo." + id;
    if (this.storage && !this.storage.getItem(key))
      this.storage.setItem(key, JSON.stringify(assessment));
  }
  async getAssessment(id: string) {
    const stored = this.storage?.getItem("rht.demo." + id);
    return (
      this.memory.get(id) ??
      (stored ? AssessmentSchema.parse(JSON.parse(stored)) : null)
    );
  }
  async getAllAssessments() {
    const records = new Map(this.memory);
    for (const key of Object.keys(this.storage ?? {})) {
      if (!key.startsWith("rht.demo.")) continue;
      const a = await this.getAssessment(key.slice(9));
      if (a) records.set(a.assessment_id, a);
    }
    return [...records.values()].sort((a, b) =>
      b.completed_at.localeCompare(a.completed_at),
    );
  }
  async getAssessmentsForPatient(id: string) {
    return (await this.getAllAssessments()).filter((a) => a.patient_id === id);
  }
}
