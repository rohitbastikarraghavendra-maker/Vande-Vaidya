import localEnglish from "./localEnglish";
import express from "express";
import ai from "./routes/ai";
import { AssessmentSchema } from "../../packages/shared/src/index";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "200kb" }));

// In-memory store keyed by assessment_id (idempotent).
const assessments = new Map<string, unknown>();

app.get("/api/health", (_, res) =>
  res.json({ ok: true, time: new Date().toISOString() }),
);

// POST /api/assessments — receive a finished Assessment from the patient app.
app.post("/api/assessments", (req, res) => {
  const result = AssessmentSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({
      error: "INVALID_ASSESSMENT",
      issues: result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }
  const a = result.data;
  const existing = assessments.has(a.assessment_id);
  assessments.set(a.assessment_id, a);
  console.info(
    `[assessments] ${existing ? "duplicate" : "saved"} ${a.assessment_id} level=${a.triage.level}`,
  );
  res.status(existing ? 200 : 201).json({ assessment_id: a.assessment_id });
});

// GET /api/assessments?since=<ISO> — ASHA dashboard poll.
app.get("/api/assessments", (req, res) => {
  const since = req.query.since as string | undefined;
  const sinceMs = since ? Date.parse(since) : 0;
  const list = [...assessments.values()].filter((a) => {
    const completed = (a as { completed_at: string }).completed_at;
    return !since || Date.parse(completed) > sinceMs;
  });
  res.json({ assessments: list, server_time: new Date().toISOString() });
});

app.use("/api", localEnglish);
app.use("/api", ai);
app.use(((err, req, res, next) => {
  res
    .status(err.code === "LIMIT_FILE_SIZE" ? 413 : 502)
    .json({ error: "REQUEST_FAILED" });
}) as express.ErrorRequestHandler);
app.listen(Number(process.env.PORT ?? 8787), "127.0.0.1", () =>
  console.info("Team 1 API ready"),
);
