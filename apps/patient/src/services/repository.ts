import type { AssessmentRepository } from "@rht/shared";
import { ConsoleAssessmentRepository } from "../../../../packages/shared/src/repositories/console";
let storage: Storage | undefined;
try {
  storage = window.localStorage;
} catch {
  /* Private browsing. */
}
const demo = new ConsoleAssessmentRepository(storage);
export const repository: Pick<AssessmentRepository, "saveAssessment"> =
  import.meta.env.VITE_REPO === "http"
    ? {
        async saveAssessment(a) {
          const res = await fetch("/api/assessments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(a),
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw Error("SAVE_FAILED");
        },
      }
    : demo;
