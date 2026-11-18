import { languages, phrase } from "../i18n/messages";
import type { LanguageCode, PatientSnapshot } from "@rht/shared";
export function Welcome({
  lang,
  choose,
  patient,
  change,
  id,
  newPatient,
  start,
}: {
  lang: LanguageCode;
  choose: (l: LanguageCode) => void;
  patient: PatientSnapshot;
  change: (p: PatientSnapshot) => void;
  id: string;
  newPatient: () => void;
  start: () => void;
}) {
  const t = (...s: [string, string, string, string]) => phrase(lang, ...s);
  return (
    <>
      <h1>
        {t(
          "Choose your language",
          "ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ",
          "अपनी भाषा चुनें",
          "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
        )}
      </h1>
      <div className="tiles">
        {Object.entries(languages)
          .filter(([k]) => k !== "ta-IN")
          .map(([k, v]) => (
            <button
              key={k}
              lang={k}
              aria-pressed={lang === k}
              onClick={() => choose(k as LanguageCode)}
            >
              {v}
              <span>{lang === k ? "●" : "○"}</span>
            </button>
          ))}
      </div>
      <details>
        <summary>
          {t(
            "About you (optional)",
            "ನಿಮ್ಮ ಬಗ್ಗೆ (ಐಚ್ಛಿಕ)",
            "आपके बारे में (वैकल्पिक)",
            "உங்களைப் பற்றி",
          )}
        </summary>
        <label>
          {t("Age", "ವಯಸ್ಸು", "उम्र", "வயது")}{" "}
          <input
            type="number"
            min="0"
            max="120"
            value={patient.age ?? ""}
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              change({
                ...patient,
                age: Number.isInteger(n) && n >= 0 && n <= 120 ? n : null,
              });
            }}
          />
        </label>
        <label>
          {t("Sex", "ಲಿಂಗ", "लिंग", "பாலினம்")}{" "}
          <select
            value={patient.sex}
            onChange={(e) =>
              change({
                ...patient,
                sex: e.target.value as PatientSnapshot["sex"],
              })
            }
          >
            <option value="unknown">{t("Skip", "ಬಿಡಿ", "छोड़ें", "தவிர்")}</option>
            <option value="female">{t("Woman", "ಮಹಿಳೆ", "महिला", "பெண்")}</option>
            <option value="male">{t("Man", "ಪುರುಷ", "पुरुष", "ஆண்")}</option>
            <option value="other">{t("Other", "ಇತರೆ", "अन्य", "மற்றவை")}</option>
          </select>
        </label>
      </details>
      <button className="primary" onClick={start}>
        {t("Continue", "ಮುಂದುವರಿಸಿ", "आगे बढ़ें", "தொடரவும்")} →
      </button>
      <footer>
        {id} ·{" "}
        <button className="link" onClick={newPatient}>
          {t("New patient", "ಹೊಸ ರೋಗಿ", "नया मरीज़", "புதிய நோயாளி")}
        </button>
      </footer>
    </>
  );
}
