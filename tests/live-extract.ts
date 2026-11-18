import { scripts } from "./scenarios";
import { ExtractionResultSchema } from "../packages/triage-engine/src/extraction";
import { emptyPatient } from "../packages/triage-engine/src/lexicon";
import { turn } from "../packages/triage-engine/src/session";
for (const [name, text] of Object.entries(scripts)) {
  const language_hint =
    name === "hinglish" || name === "high" || name === "low"
      ? "hi-IN"
      : name === "medium" || name === "emergency"
        ? "kn-IN"
        : "en-IN";
  const response = await fetch("http://127.0.0.1:8787/api/extract", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      turns: [turn("patient", text, "text")],
      patient: emptyPatient,
      language_hint,
      answered_question_ids: [],
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw Error(name + " extraction failed: " + response.status);
  const extraction = ExtractionResultSchema.parse(await response.json());
  console.info(
    name,
    extraction.suggested_level,
    extraction.symptoms.map((s) => s.code),
  );
}
