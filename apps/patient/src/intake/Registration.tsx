import { useText } from "./locale";
import { identify, type Patient } from "./model";
export function Registration({
  patient,
  submit,
}: {
  patient?: Patient;
  submit: (p: Patient) => void;
}) {
  const t = useText();
  return (
    <form
      onInvalid={(e) => {
        const input = e.target as HTMLInputElement;
        const messages: Record<string, string> = {
          name: "Enter your name",
          age: "Enter an age from 1 to 125",
          gender: "Choose a gender",
          phone: "Enter 7 to 15 digits, optionally starting with +",
        };
        input.setCustomValidity(t(messages[input.name]));
      }}
      onInput={(e) => {
        for (const input of e.currentTarget.querySelectorAll("input"))
          input.setCustomValidity("");
      }}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const phone = String(data.get("phone")).trim();
        submit({
          ...(patient
            ? { patientId: patient.patientId, displayId: patient.displayId }
            : identify()),
          name: String(data.get("name")).trim(),
          age: Number(data.get("age")),
          gender: String(data.get("gender")),
          ...(phone ? { phone } : {}),
        });
      }}
    >
      <h1>{t("Patient information")}</h1>
      <label>
        {t("Name")}
        <input
          name="name"
          autoComplete="name"
          required
          pattern={".*\\S.*"}
          title={t("Enter your name")}
          defaultValue={patient?.name}
        />
      </label>
      <label>
        {t("Age in years")}
        <input
          name="age"
          type="number"
          min="1"
          max="125"
          required
          defaultValue={patient?.age}
        />
      </label>
      <fieldset>
        <legend>{t("Gender")}</legend>
        {["Male", "Female", "Other"].map((g) => (
          <label className="choice" key={g}>
            <input
              type="radio"
              name="gender"
              required
              value={g.toLowerCase()}
              defaultChecked={patient?.gender === g.toLowerCase()}
            />
            {t(g)}
          </label>
        ))}
      </fieldset>
      <label>
        {t("Phone number (optional)")}
        <input
          type="tel"
          autoComplete="tel"
          name="phone"
          pattern={"\\+?(?:[0-9] ?){6,14}[0-9]"}
          title={t("Enter 7 to 15 digits, optionally starting with +")}
          defaultValue={patient?.phone}
        />
      </label>
      <button className="primary">{t("Continue")}</button>
    </form>
  );
}
