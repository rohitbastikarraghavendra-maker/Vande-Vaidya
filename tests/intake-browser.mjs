import { chromium, expect } from "@playwright/test";
import { createServer } from "vite";
import assert from "node:assert/strict";
const ui = await createServer({
  cacheDir: "node_modules/.vite-intake-test",
  server: { host: "127.0.0.1", port: 15173 },
});
let browser;
try {
  await ui.listen();
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "msedge",
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  const p = await browser.newPage({
    viewport: { width: 360, height: 800 },
    permissions: ["microphone"],
  });
  await p.goto("http://127.0.0.1:15173");
  const button = (name) => p.getByRole("button", { name, exact: true });
  const next = () => button("Continue").click();
  for (const [label, name, back] of [
    ["ಕನ್ನಡ Kannada", "ಹೆಸರು", "ಭಾಷೆ ಬದಲಿಸಿ"],
    ["हिंदी Hindi", "नाम", "भाषा बदलें"],
  ]) {
    await button(label).click();
    await expect(p.getByLabel(name, { exact: true })).toBeVisible();
    await button(back).click();
  }
  await button("English").click();
  await next();
  await expect(p.locator("input:invalid")).toHaveCount(5);
  await p.getByLabel("Name", { exact: true }).fill("  Ravi  ");
  await p.getByLabel("Age in years").fill("54");
  await p.getByLabel("Male", { exact: true }).check();
  await next();
  const id = await p.locator("header small").innerText();
  assert.match(id, /^PAT-/);
  async function record() {
    await button("Tap to speak").click();
    await expect(p.getByRole("status")).toContainText("Listening");
    await p.waitForTimeout(850);
    await button("Stop recording").click();
  }
  let responseText = "I have fever and headache",
    failSpeech = false;
  await p.route("**/api/stt", (route) =>
    route.fulfill({
      status: failSpeech ? 503 : 200,
      json: { text: responseText, provider: "sarvam" },
    }),
  );
  await button("Type symptoms").click();
  await p.getByRole("textbox").fill("fever");
  await next();
  await expect(button("Remove Fever")).toBeVisible();
  await button("Speak again").click();
  await record();
  const transcript = p.getByRole("textbox");
  await expect(transcript).toHaveValue("I have fever and headache");
  await transcript.fill("first edit");
  await button("Speak again").click();
  failSpeech = true;
  await record();
  await expect(p.getByRole("alert")).toBeVisible();
  failSpeech = false;
  await button("Back").click();
  await expect(transcript).toHaveValue("first edit");
  await button("Speak again").click();
  await record();
  await expect(transcript).toHaveValue("I have fever and headache");
  await next();
  await expect(button("Remove Fever")).toBeVisible();
  await expect(button("Remove Headache")).toBeVisible();
  await button("Edit transcript").click();
  await transcript.fill("no symptoms");
  await next();
  await expect(button("Continue")).toBeDisabled();
  await button("Edit transcript").click();
  await transcript.fill("Headache, cough and fever");
  await p.evaluate(async () => {
    const { TranscriptSymptomExtractor } =
      await import("/src/intake/services.ts");
    const original = TranscriptSymptomExtractor.prototype.extractSymptoms;
    TranscriptSymptomExtractor.prototype.extractSymptoms = async function () {
      TranscriptSymptomExtractor.prototype.extractSymptoms = original;
      throw Error();
    };
  });
  await next();
  await expect(p.getByRole("alert")).toBeVisible();
  await expect(transcript).toHaveValue("Headache, cough and fever");
  await button("Retry extraction").click();
  await button("Remove Cough").click();
  await p.getByLabel("Missing symptom").fill("Nausea");
  await button("Add symptom").click();
  await next();
  for (let i = 1; i <= 3; i++) {
    await expect(p.getByText("Symptom " + i + " of 3")).toBeVisible();
    await expect(button("Continue")).toBeDisabled();
    await button("Today").click();
    await next();

    const action = button(i === 3 ? "Finish" : "Continue");
    await expect(action).toBeDisabled();
    await p.getByRole("slider").fill("7");
    await expect(p.getByText("7 / 10 · Severe")).toBeVisible();
    await action.click();
  }
  await expect(
    p.getByRole("heading", { name: "Intake complete" }),
  ).toBeVisible();
  await expect(p.locator("header small")).toHaveText(id);
  await expect(p.getByText("Headache", { exact: true })).toBeVisible();
  await button("Back").click();
  await expect(p.getByRole("slider")).toHaveValue("7");
  console.log("Three-symptom browser recognition flow passed");
} finally {
  await browser?.close();
  await ui.close();
}
