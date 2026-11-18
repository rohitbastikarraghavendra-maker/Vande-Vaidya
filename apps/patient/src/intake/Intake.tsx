import { Locale, translate } from "./locale";
import { useState } from "react";
import { Registration } from "./Registration";
import { Voice } from "./Voice";
import { Details, type Draft } from "./Details";
import { TranscriptSymptomExtractor, type SymptomExtractor } from "./services";
import { speechProvider } from "./speech";
import type {
  Language,
  Patient,
  PatientIntake,
  TranscriptState,
} from "./model";
import "./intake.css";
const symptomExtractor = new TranscriptSymptomExtractor();
type Step =
  | "info"
  | "language"
  | "voice"
  | "review"
  | "extracting"
  | "confirm"
  | "details"
  | "complete";
export function Intake({
  extractor = symptomExtractor,
  onComplete,
}: {
  extractor?: SymptomExtractor;
  onComplete?: (value: PatientIntake) => void;
}) {
  const [step, go] = useState<Step>("language"),
    [language, chooseLanguage] = useState<Language>("en"),
    [patient, register] = useState<Patient>(),
    [transcript, setTranscript] = useState<TranscriptState>({
      raw: "",
      confirmed: "",
    });
  const [items, setItems] = useState<Draft[]>([]),
    [index, at] = useState(0),
    [field, ask] = useState(0),
    [addition, add] = useState(""),
    [error, fail] = useState(""),
    [extracted, setExtracted] = useState<string>(),
    [result, finish] = useState<PatientIntake>();
  const t = (text: string) => translate(language, text);
  async function extract() {
    fail("");
    if (extracted === transcript.confirmed) {
      go("confirm");
      return;
    }
    go("extracting");
    try {
      const response = await extractor.extractSymptoms(transcript.confirmed);
      setItems(
        response.symptoms.map((s) => ({
          ...items.find((i) => i.name.toLowerCase() === s.name.toLowerCase()),
          ...s,
        })),
      );
      setExtracted(transcript.confirmed);
      go("confirm");
    } catch {
      fail("We couldn’t identify symptoms. Try again.");
      go("review");
    }
  }
  function advance() {
    if (field === 0) {
      ask(field + 1);
      return;
    }
    if (index + 1 < items.length) {
      at(index + 1);
      ask(0);
      return;
    }
    const intake: PatientIntake = {
      patient: patient!,
      language,
      transcript,
      symptoms: items.map(({ id, name, sourceText, onset, severity }) => ({
        id,
        name,
        ...(sourceText ? { sourceText } : {}),
        onset: onset!.trim(),
        severity: severity!,
      })),
    };
    finish(intake);
    go("complete");
    onComplete?.(intake);
  }
  function previous() {
    if (field > 0) ask(field - 1);
    else if (index > 0) {
      at(index - 1);
      ask(1);
    } else go("confirm");
  }
  return (
    <Locale.Provider value={language}>
      <main className="intake" lang={language}>
        <header>
          <span className="mark" aria-hidden>
            ✚
          </span>
          Patient Voice {patient && <small>{patient.displayId}</small>}
        </header>
        {step === "info" && (
          <>
            <Registration
              patient={patient}
              submit={(p) => {
                register(p);
                go(transcript.confirmed ? "review" : "voice");
              }}
            />
            <button className="link" onClick={() => go("language")}>
              {t("Change language")}
            </button>
          </>
        )}
        {step === "language" && (
          <>
            <h1>Choose your language</h1>
            <div className="tiles">
              {(
                [
                  ["en", "English"],
                  ["kn", "ಕನ್ನಡ Kannada"],
                  ["hi", "हिंदी Hindi"],
                ] as const
              ).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => {
                    chooseLanguage(code);
                    go("info");
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
        {step === "voice" && (
          <Voice
            provider={speechProvider(language)}
            typeInstead={() => {
              fail("");
              go("review");
            }}
            success={(raw) => {
              setTranscript({ raw, confirmed: raw });
              fail("");
              go("review");
            }}
            back={() => go(transcript.confirmed ? "review" : "info")}
          />
        )}
        {step === "review" && (
          <>
            <h1>
              {t(
                transcript.raw
                  ? "Here’s what we heard"
                  : "Describe your symptoms",
              )}
            </h1>
            <label>
              {t("You can edit this if needed.")}
              <textarea
                value={transcript.confirmed}
                onChange={(e) =>
                  setTranscript({ ...transcript, confirmed: e.target.value })
                }
              />
            </label>
            {error && <p role="alert">{t(error)}</p>}
            <button onClick={() => go("voice")}>{t("Speak again")}</button>
            <button
              className="primary"
              disabled={!transcript.confirmed.trim()}
              onClick={extract}
            >
              {error ? t("Retry extraction") : t("Continue")}
            </button>
            <button className="link" onClick={() => go("info")}>
              {t("Patient information")}
            </button>
          </>
        )}
        {step === "extracting" && <p role="status">{t("Finding symptoms…")}</p>}
        {step === "confirm" && (
          <>
            <h1>{t("Did we get that right?")}</h1>
            {!items.length && (
              <p>
                {t(
                  "We couldn’t identify a symptom. Please add one or try speaking again.",
                )}
              </p>
            )}
            {items.map((s) => (
              <div className="symptom" key={s.id}>
                <strong>{t(s.name)}</strong>
                <button
                  aria-label={t("Remove") + " " + t(s.name)}
                  onClick={() => setItems(items.filter((i) => i.id !== s.id))}
                >
                  {t("Remove")}
                </button>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setItems([
                  ...items,
                  { id: crypto.randomUUID(), name: addition.trim() },
                ]);
                add("");
              }}
            >
              <label>
                {t("Missing symptom")}
                <input value={addition} onChange={(e) => add(e.target.value)} />
              </label>
              <button
                disabled={
                  !addition.trim() ||
                  items.some(
                    (i) =>
                      i.name.toLowerCase() === addition.trim().toLowerCase(),
                  )
                }
              >
                {t("Add symptom")}
              </button>
            </form>
            <button
              className="primary"
              disabled={!items.length || !!addition.trim()}
              onClick={() => {
                at(0);
                ask(0);
                go("details");
              }}
            >
              {t("Continue")}
            </button>
            <button className="link" onClick={() => go("review")}>
              {t("Edit transcript")}
            </button>
            <button className="link" onClick={() => go("voice")}>
              {t("Speak again")}
            </button>
          </>
        )}
        {step === "details" && (
          <>
            <Details
              item={items[index]}
              index={index}
              total={items.length}
              field={field}
              update={(d) =>
                setItems(
                  items.map((s, i) => (i === index ? { ...s, ...d } : s)),
                )
              }
              next={advance}
            />
            <button className="link" onClick={previous}>
              {t("Back")}
            </button>
          </>
        )}
        {step === "complete" && result && (
          <>
            <h1>{t("Intake complete")}</h1>
            <p>
              {result.patient.name} · {result.patient.displayId}
            </p>
            {result.symptoms.map((s) => (
              <p key={s.id}>
                <strong>{t(s.name)}</strong>
                <br />
                {t("Started")} {t(s.onset)} ·{s.severity}/10
              </p>
            ))}
            <button onClick={() => go("details")}>{t("Back")}</button>
            <button
              className="link"
              onClick={() => {
                register(undefined);
                chooseLanguage("en");
                setTranscript({ raw: "", confirmed: "" });
                setItems([]);
                setExtracted(undefined);
                finish(undefined);
                add("");
                fail("");
                go("language");
              }}
            >
              {t("Start new intake")}
            </button>
          </>
        )}
      </main>
    </Locale.Provider>
  );
}
