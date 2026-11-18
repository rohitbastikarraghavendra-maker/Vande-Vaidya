import localEnglish from "./localEnglish";
import express from "express";
import ai from "./routes/ai";
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "200kb" }));
app.get("/api/health", (_, res) =>
  res.json({ ok: true, time: new Date().toISOString() }),
);
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
