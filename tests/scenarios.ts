import type { LanguageCode, PatientSnapshot } from "@rht/shared";
import {
  MockClinicalExtractor,
  scripts,
} from "../packages/triage-engine/src/mock";
import { emptyPatient } from "../packages/triage-engine/src/lexicon";
import {
  evaluate,
  turn,
  type Session,
} from "../packages/triage-engine/src/session";
import { buildAssessment } from "../packages/triage-engine/src/assessment";
export async function scenario(
  text: string,
  lang: LanguageCode = "en-IN",
  patient: PatientSnapshot = { ...emptyPatient },
) {
  const state: Session = {
    assessment_id: crypto.randomUUID(),
    patient_id: crypto.randomUUID(),
    display_id: "PAT-7K2Q",
    created_at: new Date().toISOString(),
    patient,
    language: lang,
    provider: "mock",
    model: "mock",
    detected: [lang],
    errors: [],
    turns: [turn("patient", text, "voice")],
  };
  const x = await new MockClinicalExtractor().extract({
    turns: state.turns,
    patient,
    language_hint: lang,
    answered_question_ids: [],
  });
  let e = evaluate(state, x);
  while (e.question) {
    const q = e.question;
    const answer =
      q.about === "pregnancy" ? "Unsure" : q.inverse ? "Yes" : "No";
    state.turns.push(
      turn("assistant", q.text[0], "text", q.id),
      turn("patient", answer, "button", q.id, answer),
    );
    e = evaluate(state, x);
  }
  return { state, x, e, a: buildAssessment(state, e, x) };
}
export { scripts };
