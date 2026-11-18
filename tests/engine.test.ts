import { describe, it, expect, expectTypeOf } from "vitest";
import {
  AssessmentSchema,
  type Assessment,
  type SymptomCode,
  type TriageLevel,
  type PregnancyStatus,
} from "@rht/shared";
import { ConsoleAssessmentRepository } from "../packages/shared/src/repositories/console";
import { scenario, scripts } from "./scenarios";
import {
  keywordSymptoms,
  symptom,
  emptyPatient,
} from "../packages/triage-engine/src/lexicon";
import { resolveTriage } from "../packages/triage-engine/src/triage";
import { evaluateRedFlags } from "../packages/triage-engine/src/rules";
import { ExtractionResultSchema } from "../packages/triage-engine/src/extraction";
import { evaluate, turn } from "../packages/triage-engine/src/session";
describe("assessment handoff", () => {
  for (const [key, level] of Object.entries({
    low: "LOW",
    medium: "MEDIUM",
    high: "HIGH",
    emergency: "EMERGENCY",
    hinglish: "HIGH",
    headache: "LOW",
    fever: "MEDIUM",
  }))
    it(key, async () => {
      const { a } = await scenario(
        scripts[key as keyof typeof scripts],
        "en-IN",
        { ...emptyPatient, sex: key === "high" ? "female" : "unknown" },
      );
      expectTypeOf<
        ReturnType<typeof AssessmentSchema.parse>
      >().toEqualTypeOf<Assessment>();
      expect(a.triage.level).toBe(level);
      expect(!!a.escalation).toBe(level === "EMERGENCY");
      expect(
        a.transcript.turns.filter((t) => t.role === "assistant").length,
      ).toBeLessThanOrEqual(level === "EMERGENCY" ? 0 : 4);
      if (key === "medium")
        expect(a.symptoms.find((s) => s.code === "fever")?.duration_hours).toBe(
          168,
        );
      if (key === "high")
        expect(a.red_flags.map((f) => f.code)).toEqual(
          expect.arrayContaining([
            "PREGNANCY_ABDOMINAL_PAIN",
            "SEVERE_ABDOMINAL_PAIN",
          ]),
        );
      if (key === "low")
        expect(a.symptoms.find((s) => s.code === "fever")?.present).toBe(false);
      const repo = new ConsoleAssessmentRepository();
      await repo.saveAssessment(a);
      await repo.saveAssessment(a);
      expect(await repo.getAssessmentsForPatient(a.patient_id)).toEqual([a]);
      expect(a.clinical_note.vitals).toBe("NOT_RECORDED");
    });
  it("blocks invalid outputs and deterministic downgrades", async () => {
    const { e, x, a } = await scenario(scripts.emergency);
    expect(
      resolveTriage(e.red_flags, { ...x, suggested_level: "LOW" }, []),
    ).toMatchObject({
      level: "EMERGENCY",
      decided_by: "RULE",
      requires_escalation: true,
    });
    expect(AssessmentSchema.safeParse({ ...a, escalation: null }).success).toBe(
      false,
    );
    expect(ExtractionResultSchema.safeParse({ symptoms: [] }).success).toBe(
      false,
    );
    expect(AssessmentSchema.safeParse({ ...a, extra: 1 }).success).toBe(false);
  });
  it("raises uncertain LOW and retains original on extraction failure", async () => {
    const { state, x } = await scenario(scripts.headache);
    expect(
      resolveTriage([], { ...x, suggested_level: "LOW" }, ["duration"]).level,
    ).toBe("MEDIUM");
    const e = evaluate(state, null);
    expect(e.triage).toMatchObject({
      level: "MEDIUM",
      confidence: "LOW",
      decided_by: "FALLBACK",
    });
    expect(state.turns[0].text).toBe(scripts.headache);
  });
  it.each([
    "Nange chest pain ide, breathing kashta agtha ide, sweating ide.",
    "ಎದೆ ನೋವು ಉಸಿರಾಡಲು ಕಷ್ಟ",
    "सीने में दर्द सांस लेने में तकलीफ",
    "நெஞ்சு வலி மூச்சுத் திணறல்",
  ])("offline emergency %s", (text) => {
    const flags = evaluateRedFlags(
      keywordSymptoms(text),
      emptyPatient,
      "unknown",
      "KEYWORD_RULE",
    );
    expect(flags).toContainEqual(
      expect.objectContaining({
        code: "CHEST_PAIN_DYSPNEA",
        source: "KEYWORD_RULE",
      }),
    );
    expect(resolveTriage(flags, null, []).level).toBe("EMERGENCY");
  });
  it("local button answer escalates even if model previously denied the symptom", async () => {
    const { state, x } = await scenario(scripts.hinglish);
    state.turns = state.turns.slice(0, 1);
    state.turns.push(turn("patient", "हाँ", "button", "cp_breath", "Yes"));
    expect(evaluate(state, x).triage.level).toBe("EMERGENCY");
  });
});
const cases: [string, SymptomCode[], TriageLevel][] = [
  ["CHEST_PAIN_DYSPNEA", ["chest_pain", "breathlessness"], "EMERGENCY"],
  ["CHEST_PAIN_CARDIAC_SIGNS", ["chest_pain", "sweating"], "EMERGENCY"],
  ["SEVERE_BREATHLESSNESS", ["breathlessness"], "EMERGENCY"],
  ["UNCONSCIOUS", ["unconscious"], "EMERGENCY"],
  ["SEIZURE", ["seizure"], "EMERGENCY"],
  ["STROKE_SIGNS", ["face_droop"], "EMERGENCY"],
  ["SEVERE_BLEEDING", ["severe_bleeding"], "EMERGENCY"],
  ["ANAPHYLAXIS_SIGNS", ["allergic_swelling", "breathlessness"], "EMERGENCY"],
  ["PREGNANCY_BLEEDING", ["vaginal_bleeding"], "EMERGENCY"],
  ["MAJOR_TRAUMA", ["major_injury"], "EMERGENCY"],
  ["SEVERE_DEHYDRATION", ["unable_to_drink", "confusion"], "EMERGENCY"],
  ["FEVER_WITH_CONFUSION", ["fever", "confusion"], "EMERGENCY"],
  ["CHEST_PAIN", ["chest_pain"], "HIGH"],
  ["SEVERE_ABDOMINAL_PAIN", ["abdominal_pain", "vomiting"], "HIGH"],
  ["PREGNANCY_ABDOMINAL_PAIN", ["abdominal_pain"], "HIGH"],
  ["PROLONGED_FEVER", ["fever"], "MEDIUM"],
];
it.each(cases)(
  "%s enforces floor on present symptoms only",
  (code, codes, level) => {
    const symptoms = codes.map((c) => ({
      ...symptom(c),
      severity: "severe" as const,
      duration_hours: 120,
    }));
    const p = { ...emptyPatient, age: 24, sex: "female" as const };
    const pregnancy: PregnancyStatus = "possible";
    expect(
      evaluateRedFlags(symptoms, p, pregnancy, "DETERMINISTIC_RULE"),
    ).toContainEqual(expect.objectContaining({ code, level }));
    expect(
      evaluateRedFlags(
        symptoms.map((s) => ({ ...s, present: false })),
        p,
        pregnancy,
        "DETERMINISTIC_RULE",
      ),
    ).toEqual([]);
  },
);
