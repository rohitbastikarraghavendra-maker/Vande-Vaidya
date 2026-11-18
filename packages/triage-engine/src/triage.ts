import {
  TRIAGE_ORDER,
  type TriageLevel,
  type TriageResult,
  type RedFlag,
} from "@rht/shared";
import type { ExtractionResult } from "./extraction";
export const actions = {
  LOW: "Monitor your symptoms.",
  MEDIUM: "Speak with a healthcare worker.",
  HIGH: "Seek prompt medical evaluation.",
  EMERGENCY: "Seek emergency medical care immediately. Call 108.",
};
export function resolveTriage(
  flags: RedFlag[],
  extraction: ExtractionResult | null,
  missing: string[],
): TriageResult {
  const rule = flags
    .filter((f) => f.source !== "LLM_SUGGESTED")
    .reduce<TriageLevel | null>(
      (top, f) =>
        !top || TRIAGE_ORDER[f.level] > TRIAGE_ORDER[top] ? f.level : top,
      null,
    );
  const model = extraction?.suggested_level ?? null;
  const ruleWins =
    rule !== null && (!model || TRIAGE_ORDER[rule] >= TRIAGE_ORDER[model]);
  let level = (ruleWins ? rule : model) ?? "MEDIUM";
  const confidence = extraction?.confidence ?? "LOW";
  if (level === "LOW" && (confidence === "LOW" || missing.length))
    level = "MEDIUM";
  return {
    level,
    rule_level: rule,
    model_level: model,
    confidence,
    requires_escalation: level === "EMERGENCY",
    decided_by:
      rule && model === rule
        ? "RULE_AND_MODEL"
        : ruleWins
          ? "RULE"
          : model
            ? "MODEL"
            : "FALLBACK",
    reason:
      flags
        .filter((f) => f.level === level)
        .map((f) => f.label)
        .join("; ") ||
      (level === "MEDIUM"
        ? "Clinical consultation recommended."
        : "Based on reported symptoms."),
    recommended_action: actions[level],
    recommended_facility_type: (
      {
        LOW: null,
        MEDIUM: "PHC",
        HIGH: "CHC",
        EMERGENCY: "EMERGENCY_HOSPITAL",
      } as const
    )[level],
  };
}
