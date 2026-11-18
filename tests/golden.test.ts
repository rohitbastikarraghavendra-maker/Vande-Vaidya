import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ExtractionResultSchema } from "../packages/triage-engine/src/extraction";
import { evaluate } from "../packages/triage-engine/src/session";
import { scenario, scripts } from "./scenarios";
import { emptyPatient } from "../packages/triage-engine/src/lexicon";
for (const [key, level] of Object.entries({
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  emergency: "EMERGENCY",
  hinglish: "HIGH",
})) {
  it("replays the recorded extraction for " + key, async () => {
    const { state } = await scenario(
      scripts[key as keyof typeof scripts],
      "en-IN",
      { ...emptyPatient, sex: key === "high" ? "female" : "unknown" },
    );
    const x = ExtractionResultSchema.parse(
      JSON.parse(
        readFileSync("apps/patient/test/extractions/" + key + ".json", "utf8"),
      ),
    );
    expect(evaluate(state, x).triage.level).toBe(level);
  });
}
