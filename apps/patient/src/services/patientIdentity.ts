import { z } from "zod";
const identitySchema = z.object({
  patient_id: z.uuidv4(),
  display_id: z.string().regex(/^PAT-[0-9A-HJKMNP-TV-Z]{4}$/),
});
let current: z.infer<typeof identitySchema> | undefined;
export function identity(fresh = false) {
  if (!fresh && current) return current;
  if (!fresh)
    try {
      current = identitySchema.parse(
        JSON.parse(localStorage.getItem("rht.patient") ?? "null"),
      );
      return current;
    } catch {
      /* First visit, corrupt or unavailable storage. */
    }
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  current = {
    patient_id: crypto.randomUUID(),
    display_id:
      "PAT-" +
      Array.from(
        crypto.getRandomValues(new Uint8Array(4)),
        (n) => alphabet[n % 32],
      ).join(""),
  };
  try {
    localStorage.setItem("rht.patient", JSON.stringify(current));
  } catch {
    /* Session identity still usable. */
  }
  return current;
}
