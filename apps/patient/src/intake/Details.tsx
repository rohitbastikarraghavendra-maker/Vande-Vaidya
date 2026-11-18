import { useText } from "./locale";
import { type AssessedSymptom, type ExtractedSymptom } from "./model";
export type Draft = ExtractedSymptom &
  Partial<Pick<AssessedSymptom, "onset" | "severity">> & {
    manual?: boolean;
  };
export function Details({
  item,
  index,
  total,
  field,
  update,
  next,
}: {
  item: Draft;
  index: number;
  total: number;
  field: number;
  update: (d: Partial<Draft>) => void;
  next: () => void;
}) {
  const t = useText();
  const severity = item.severity;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
    >
      <p>
        {t("Symptom")} {index + 1} {t("Symptom") === "Symptom" ? "of" : "/"}{" "}
        {total}
      </p>
      <strong>{t(item.name)}</strong>
      {field === 0 ? (
        <>
          <h1>{t("When did this start?")}</h1>
          <div className="tiles">
            {[
              "Today",
              "Yesterday",
              "2–3 days ago",
              "More than 3 days ago",
              "Enter manually",
            ].map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={
                  v === "Enter manually"
                    ? !!item.manual
                    : !item.manual && item.onset === v
                }
                onClick={() =>
                  update(
                    v === "Enter manually"
                      ? { manual: true, onset: item.manual ? item.onset : "" }
                      : { manual: false, onset: v },
                  )
                }
              >
                {t(v)}
              </button>
            ))}
          </div>
          {item.manual && (
            <label>
              {t("When it started")}
              <input
                required
                value={item.onset ?? ""}
                onChange={(e) => update({ onset: e.target.value })}
              />
            </label>
          )}
        </>
      ) : (
        <>
          <h1>
            {/pain|ache|sore/i.test(item.name)
              ? t("How bad is the pain?")
              : t("How severe does it feel?")}
          </h1>
          <div className="scale">
            <span>{t("Mild")} · 1</span>
            <span>10 · {t("Severe")}</span>
          </div>
          <input
            aria-label={t("Severity")}
            type="range"
            min="1"
            max="10"
            step="1"
            value={severity ?? 1}
            onPointerUp={(e) =>
              update({ severity: e.currentTarget.valueAsNumber })
            }
            onKeyDown={(e) => {
              if (e.key === "Home") update({ severity: 1 });
            }}
            onChange={(e) => update({ severity: e.target.valueAsNumber })}
          />
          <p aria-live="polite">
            {severity
              ? severity +
                " / 10 · " +
                (severity <= 3
                  ? t("Mild")
                  : severity <= 6
                    ? t("Moderate")
                    : severity <= 8
                      ? t("Severe")
                      : t("Very severe"))
              : t("Choose a number")}
          </p>
        </>
      )}
      <button
        className="primary"
        disabled={field === 0 ? !item.onset?.trim() : !severity}
      >
        {index + 1 === total && field === 1 ? t("Finish") : t("Continue")}
      </button>
    </form>
  );
}
