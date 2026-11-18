import type { Assessment, LanguageCode, TriageLevel } from "@rht/shared";
import { guidance, phrase } from "../i18n/messages";
export function Result({
  lang,
  level,
  id,
  a,
  failed,
  restart,
}: {
  lang: LanguageCode;
  level: TriageLevel;
  id: string;
  a: Assessment | null;
  failed: boolean;
  restart: () => void;
}) {
  const t = (...s: [string, string, string, string]) => phrase(lang, ...s);
  function download() {
    if (!a) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(a, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = a.assessment_id + ".json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className={"outcome " + level}>
      <div className="symbol" aria-hidden>
        {level === "EMERGENCY" ? "⚠" : level === "LOW" ? "✓" : "✚"}
      </div>
      <small>
        {level === "EMERGENCY"
          ? t("Emergency", "ತುರ್ತು", "आपातकाल", "அவசரம்")
          : t("Your next step", "ಮುಂದಿನ ಹೆಜ್ಜೆ", "अगला कदम", "அடுத்த படி")}
      </small>
      <h1>{guidance(lang, level)}</h1>
      {level === "EMERGENCY" && (
        <a className="primary call" href="tel:108">
          ☎ {t("Call 108", "108ಕ್ಕೆ ಕರೆ ಮಾಡಿ", "108 पर कॉल करें", "108 அழைக்கவும்")}
        </a>
      )}
      <p>{id}</p>
      <details>
        <summary>
          {t(
            "Show to health worker",
            "ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರಿಗೆ ತೋರಿಸಿ",
            "स्वास्थ्य कर्मी को दिखाएँ",
            "சுகாதாரப் பணியாளரிடம் காட்டவும்",
          )}
        </summary>
        {a ? (
          <>
            <pre>{a.clinical_note.text}</pre>
            <p>
              {a.triage.decided_by} ·{" "}
              {a.red_flags
                .map((f) => f.code + " (" + f.source + ")")
                .join(", ")}
            </p>
            <p>{a.transcript.original}</p>
            {failed && <p>Save unavailable. Download this copy.</p>}
            <button onClick={download}>Download JSON</button>
          </>
        ) : (
          <p>Preparing handoff…</p>
        )}
      </details>
      <button className="link" disabled={!a} onClick={restart}>
        {t("Finish", "ಮುಗಿಸಿ", "समाप्त करें", "முடிக்கவும்")}
      </button>
    </section>
  );
}
