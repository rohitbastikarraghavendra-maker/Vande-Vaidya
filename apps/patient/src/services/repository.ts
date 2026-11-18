import type { AssessmentRepository } from "@rht/shared";
import { ConsoleAssessmentRepository } from "../../../../packages/shared/src/repositories/console";

let storage: Storage | undefined;
try {
  storage = window.localStorage;
} catch {
  /* Private browsing. */
}

const OUTBOX_KEY = "rht.outbox";

function outboxLoad(): Record<string, unknown> {
  try {
    return JSON.parse(storage?.getItem(OUTBOX_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function outboxSave(box: Record<string, unknown>) {
  try {
    storage?.setItem(OUTBOX_KEY, JSON.stringify(box));
  } catch {}
}

async function trySend(id: string, payload: unknown): Promise<boolean> {
  try {
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    // 200 = already stored (idempotent), 201 = newly stored, both = success.
    if (res.ok) return true;
    // 422 = server rejected schema — do not retry.
    if (res.status === 422) {
      console.error("[repository] server rejected assessment", id, await res.json());
      return true; // remove from outbox, it will never succeed
    }
    return false;
  } catch {
    return false;
  }
}

function startOutboxRetry() {
  async function flush() {
    const box = outboxLoad();
    if (!Object.keys(box).length) return;
    for (const [id, payload] of Object.entries(box)) {
      const sent = await trySend(id, payload);
      if (sent) {
        const current = outboxLoad();
        delete current[id];
        outboxSave(current);
      }
    }
  }
  setInterval(flush, 15_000);
  window.addEventListener("online", flush);
  // Attempt on startup in case items were left from a previous session.
  void flush();
}

const httpRepository: Pick<AssessmentRepository, "saveAssessment"> = {
  async saveAssessment(a) {
    const sent = await trySend(a.assessment_id, a);
    if (!sent) {
      // Store in outbox; retry loop will pick it up.
      const box = outboxLoad();
      box[a.assessment_id] = a;
      outboxSave(box);
      console.info("[repository] queued in outbox:", a.assessment_id);
    }
  },
};

const demo = new ConsoleAssessmentRepository(storage);

export const repository: Pick<AssessmentRepository, "saveAssessment"> =
  import.meta.env.VITE_REPO === "http" ? httpRepository : demo;

// Start the retry loop only when the HTTP repository is active.
if (import.meta.env.VITE_REPO === "http") startOutboxRetry();
