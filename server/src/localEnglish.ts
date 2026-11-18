import express from "express";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
const router = express.Router();
const script = fileURLToPath(new URL("./local-english.ps1", import.meta.url));
let active = 0;
router.post(
  "/local-english",
  express.raw({ type: "application/octet-stream", limit: "1mb" }),
  (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length || req.body.length % 2) {
      res.sendStatus(400);
      return;
    }
    if (process.platform !== "win32" || active >= 2) {
      res.sendStatus(503);
      return;
    }
    active++;
    const job = execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "RemoteSigned",
        "-File",
        script,
      ],
      { windowsHide: true, timeout: 45000 },
      (error, stdout) => {
        active--;
        if (res.destroyed) return;
        if (error) {
          res.status(503).json({ error: "LOCAL_STT_UNAVAILABLE" });
          return;
        }
        res.json({ text: stdout.trim().split(/\r?\n/).join(" ") });
      },
    );
    job.stdin?.on("error", () => {});
    job.stdin?.end(req.body);
    res.on("close", () => {
      if (!res.writableEnded) job.kill();
    });
  },
);
export default router;
