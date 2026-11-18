import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { spawn } from "node:child_process";
const api = spawn(
  process.execPath,
  ["--import", "tsx", "server/src/index.ts"],
  {
    env: {
      ...process.env,
      PORT: "18787",
      STT_PROVIDER: "mock",
      LLM_PROVIDER: "mock",
    },
    stdio: "inherit",
    windowsHide: true,
  },
);
const ui = await createServer({
  server: {
    host: "127.0.0.1",
    port: 15173,
    proxy: { "/api": "http://127.0.0.1:18787" },
  },
});
let browser;
try {
  await ui.listen();
  for (let n = 0; n < 50; n++) {
    try {
      if ((await fetch("http://127.0.0.1:18787/api/health")).ok) break;
    } catch {}
    await new Promise((ok) => setTimeout(ok, 100));
  }
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    permissions: ["microphone"],
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const open = async () => {
    await page.goto("http://127.0.0.1:15173");
    await page.getByRole("button", { name: "Continue" }).click();
  };
  const type = async (text) => {
    await page.getByRole("button", { name: "Type instead" }).click();
    await page.getByRole("textbox").fill(text);
    await page.getByRole("button", { name: "Continue" }).click();
  };
  const saved = async () => {
    await page.waitForFunction(() =>
      Object.keys(localStorage).some((k) => k.startsWith("rht.demo.")),
    );
    return page.evaluate(() =>
      Object.keys(localStorage)
        .filter((k) => k.startsWith("rht.demo."))
        .map((k) => JSON.parse(localStorage[k])),
    );
  };
  await open();
  await page.getByRole("button", { name: "Tap to speak" }).click();
  await expect(page.getByRole("button", { name: /Stop/ })).toBeVisible();
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: /Stop/ }).click();
  await expect(
    page.getByText("Mild headache since morning, no vomiting, no weakness."),
  ).toBeVisible();
  await page.getByRole("button", { name: "No", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Monitor your symptoms." }),
  ).toBeVisible();
  const first = (await saved())[0];
  assert.equal(first.transcript.turns[0].input_mode, "voice");
  assert.equal(first.pipeline.stt_provider, "mock");
  console.log(
    "PASS microphone → blob → mock STT → transcript → question → LOW → save",
  );
  await open();
  await page.route("**/api/stt", (r) => r.fulfill({ status: 502, body: "{}" }));
  await page.getByRole("button", { name: "Tap to speak" }).click();
  await expect(page.getByRole("button", { name: /Stop/ })).toBeVisible();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /Stop/ }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.route("**/api/extract", (r) =>
    r.fulfill({ status: 502, body: "{}" }),
  );
  await type("Nange thale novu ide");
  await expect(
    page.getByRole("heading", {
      name: "Please speak with a healthcare worker.",
    }),
  ).toBeVisible();
  const degraded = (await saved()).find(
    (a) => a.triage.decided_by === "FALLBACK",
  );
  assert.equal(degraded.transcript.original, "Nange thale novu ide");
  assert.equal(degraded.patient_id, first.patient_id);
  assert.notEqual(degraded.assessment_id, first.assessment_id);
  console.log(
    "PASS STT retry/type and extraction failure preserve original and patient identity",
  );
  await open();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error("quota");
    };
  });
  await page.unroute("**/api/extract");
  await page.route("**/api/extract", async (r) => {
    await new Promise((ok) => setTimeout(ok, 2200));
    await r.fulfill({ status: 502, body: "{}" });
  });
  await type("Nange chest pain ide, breathing kashta agtha ide, sweating ide.");
  await expect(page.getByRole("link", { name: "☎ Call 108" })).toBeVisible({
    timeout: 1000,
  });
  await page.getByText("Show to health worker").click();
  await expect(
    page.getByText("Save unavailable. Download this copy."),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  assert.match((await download).suggestedFilename(), /\.json$/);
  await open();
  let malformed = 0;
  await page.unroute("**/api/extract");
  await page.route("**/api/extract", (r) => {
    malformed++;
    return r.fulfill({
      contentType: "application/json",
      body: '{"unexpected":true}',
    });
  });
  await type("Mild headache since morning, no vomiting, no weakness.");
  await expect(
    page.getByRole("heading", {
      name: "Please speak with a healthcare worker.",
    }),
  ).toBeVisible();
  assert.equal(malformed, 2);
  await open();
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("denied", "NotAllowedError");
    };
  });
  await page.getByRole("button", { name: "Tap to speak" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Type instead" }),
  ).toBeVisible();
  console.log(
    "PASS malformed extraction retried once and mic denial offers typed input",
  );
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS emergency before extraction, failed persistence, downloadable handoff, no page errors",
  );
} finally {
  await browser?.close();
  await ui.close();
  api.kill();
}
