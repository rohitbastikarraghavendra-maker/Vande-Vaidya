import { readdirSync, readFileSync } from "node:fs";
import { AssessmentSchema, FacilitySchema } from "@rht/shared";
const files = readdirSync("packages/shared/mock").filter((f) =>
  f.endsWith(".json"),
);
for (const f of files) {
  const value = JSON.parse(readFileSync("packages/shared/mock/" + f, "utf8"));
  (f === "facilities.json" ? FacilitySchema.array() : AssessmentSchema).parse(
    value,
  );
  console.info("Valid", f);
}
