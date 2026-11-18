import { useTriageSession } from "./hooks/useTriageSession";
import { Welcome } from "./screens/Welcome";
import { Result } from "./screens/Result";
import { questionText } from "../../../packages/triage-engine/src/questions";
export function PatientApp() {
  const {
    phase,
    lang,
    choose,
    id,
    patient,
    change,
    start,
    newPatient,
    restart,
    outcome,
    assessment,
    failed,
    q,
    t,
    s,
    busy,
    y,
    n,
    submit,
    typing,
    draft,
    edit,
    voiceAllowed,
    mic,
    seconds,
    type,
    lastClip,
    transcribe,
    config,
  } = useTriageSession();
  return (
    <main
      className={outcome?.triage.requires_escalation ? "emergency-shell" : ""}
    >
      <header>
        <span className="mark" aria-hidden>
          ✚
        </span>{" "}
        Patient Voice
      </header>
      {phase === "WELCOME" ? (
        <Welcome
          lang={lang}
          choose={choose}
          patient={patient}
          change={change}
          id={id.display_id}
          newPatient={newPatient}
          start={start}
        />
      ) : outcome ? (
        <Result
          lang={lang}
          level={outcome.triage.level}
          id={id.display_id}
          a={assessment}
          failed={failed}
          restart={restart}
        />
      ) : (
        <section aria-live="polite">
          <h1>
            {q
              ? questionText(q, lang)
              : t(
                  "How are you feeling?",
                  "ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ?",
                  "आप कैसा महसूस कर रहे हैं?",
                  "எப்படி உணர்கிறீர்கள்?",
                )}
          </h1>
          {s?.turns.some((t) => t.role === "patient") && (
            <blockquote>
              {s.turns.filter((t) => t.role === "patient").at(-1)?.text}
            </blockquote>
          )}
          {phase === "ERROR" && (
            <p role="alert">
              {t(
                "Couldn’t hear clearly. Try again or type.",
                "ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.",
                "सुनाई नहीं दिया। फिर बोलें या लिखें।",
                "மீண்டும் பேசவும் அல்லது எழுதவும்.",
              )}
            </p>
          )}
          {busy ? (
            <p role="status">
              {phase === "PERMISSION"
                ? t(
                    "Allow microphone access",
                    "ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿಸಿ",
                    "माइक की अनुमति दें",
                    "மைக் அனுமதி அளிக்கவும்",
                  )
                : t(
                    "Checking…",
                    "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…",
                    "जाँच जारी है…",
                    "சரிபார்க்கிறது…",
                  )}
            </p>
          ) : (
            <>
              {q && phase !== "LISTENING" && (
                <div className="answers">
                  {[
                    [y, "Yes"],
                    [n, "No"],
                    [t("Unsure", "ಗೊತ್ತಿಲ್ಲ", "पता नहीं", "தெரியவில்லை"), "Unsure"],
                  ].map(([v, en]) => (
                    <button
                      key={en}
                      onClick={() => void submit(v, "button", en)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
              {typing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit(draft, "text");
                  }}
                >
                  <textarea
                    autoFocus
                    aria-label="Symptoms or reply"
                    maxLength={4000}
                    value={draft}
                    onChange={(e) => edit(e.target.value)}
                  />
                  <button className="primary" disabled={!draft.trim()}>
                    {t("Continue", "ಮುಂದುವರಿಸಿ", "आगे बढ़ें", "தொடரவும்")}
                  </button>
                </form>
              ) : (
                <>
                  {voiceAllowed && (
                    <button
                      className={
                        "mic " + (phase === "LISTENING" ? "recording" : "")
                      }
                      onClick={() => void mic()}
                    >
                      <span aria-hidden>
                        {phase === "LISTENING" ? "■" : "🎙"}
                      </span>
                      {phase === "LISTENING"
                        ? t("Stop", "ನಿಲ್ಲಿಸಿ", "रोकें", "நிறுத்து") +
                          " · " +
                          seconds +
                          "s"
                        : t(
                            "Tap to speak",
                            "ಮಾತನಾಡಲು ಒತ್ತಿ",
                            "बोलने के लिए दबाएँ",
                            "பேசத் தொடவும்",
                          )}
                    </button>
                  )}
                  {phase !== "LISTENING" && (
                    <>
                      <button className="link" onClick={() => type(true)}>
                        {t("Type instead", "ಟೈಪ್ ಮಾಡಿ", "लिखें", "எழுதவும்")}
                      </button>
                      {lastClip.current && (
                        <button
                          onClick={() => void transcribe(lastClip.current!)}
                        >
                          Retry recording
                        </button>
                      )}
                    </>
                  )}
                  {config.stt !== "sarvam" && (
                    <small>
                      {t(
                        "Demo microphone uses a sample transcript. Type for your own words.",
                        "ಡೆಮೊ ಮೈಕ್ ಮಾದರಿ ಪಠ್ಯ ಬಳಸುತ್ತದೆ. ನಿಮ್ಮ ಮಾತು ಟೈಪ್ ಮಾಡಿ.",
                        "डेमो माइक उदाहरण दिखाता है। अपनी बात लिखें।",
                        "மாதிரி உரை பயன்படுத்தப்படும். உங்கள் சொற்களை எழுதவும்.",
                      )}
                    </small>
                  )}
                </>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}
