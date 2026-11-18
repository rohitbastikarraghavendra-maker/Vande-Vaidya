import { useText } from "./locale";
import { localEnglish } from "./localSpeech";
import { useEffect, useRef, useState } from "react";
import type { SpeechProvider } from "./speech";
export function Voice({
  provider,
  success,
  typeInstead,
  back,
}: {
  provider: SpeechProvider;
  success: (s: string) => void;
  typeInstead: () => void;
  back: () => void;
}) {
  const t = useText();
  const [state, set] = useState<
      "idle" | "permission" | "listening" | "processing" | "error"
    >("idle"),
    [error, fail] = useState("");
  const session = useRef<ReturnType<SpeechProvider["start"]>>(undefined);
  useEffect(() => () => session.current?.cancel(), []);
  function report(message: string) {
    fail(message);
    set("error");
  }
  function start(engine = provider) {
    set("permission");
    try {
      session.current = engine.start({
        processing: () => set("processing"),
        listening: () => set("listening"),
        success,
        error: report,
      });
    } catch {
      report(
        "Couldn’t start speech recognition. Check microphone access and retry.",
      );
    }
  }
  return (
    <section>
      <h1>{t("Tell us what you’re feeling")}</h1>
      <>
        <p>{t("Speak for up to 30 seconds, then stop.")}</p>
        {state === "error" && <p role="alert">{t(error)}</p>}
        {state === "permission" || state === "processing" ? (
          <p role="status">
            {state === "permission"
              ? t("Waiting for microphone access…")
              : t("Transcribing…")}
          </p>
        ) : state === "listening" ? (
          <>
            <p role="status">{t("Listening…")}</p>
            <button
              className="mic recording"
              onClick={() => {
                set("processing");
                session.current?.stop();
              }}
            >
              {t("Stop recording")}
            </button>
          </>
        ) : (
          <button className="mic" onClick={() => start()}>
            <span aria-hidden>🎙</span>
            {state === "error" ? t("Retry recording") : t("Tap to speak")}
          </button>
        )}
      </>

      {provider.localFallback && state === "error" && (
        <button onClick={() => start(localEnglish)}>
          Use local English recognition
        </button>
      )}
      <button onClick={typeInstead}>{t("Type symptoms")}</button>
      <button className="link" onClick={back}>
        {t("Back")}
      </button>
    </section>
  );
}
