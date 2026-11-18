import type { Symptom, SymptomCode } from "@rht/shared";
// P0 keyword evidence is deliberately inclusive. Negated emergency phrases may over-triage.
// Native-script and romanized entries require native-speaker review before field use.
const phrases: Partial<Record<SymptomCode, string[]>> = {
  chest_pain: [
    "chest pain",
    "chest mein pain",
    "chest alli pain",
    "chest alli tumba pain",
    "seene mein dard",
    "chhati mein dard",
    "ede novu",
    "ಎದೆ ನೋವು",
    "सीने में दर्द",
    "छाती में दर्द",
    "nenju vali",
    "நெஞ்சு வலி",
  ],
  breathlessness: [
    "difficulty breathing",
    "breathing difficulty",
    "shortness of breath",
    "breathing kashta",
    "breathing problem",
    "can't breathe",
    "cannot breathe",
    "struggling to breathe",
    "breathless",
    "saans lene mein taklif",
    "सांस लेने में तकलीफ",
    "usiraata kashta",
    "usiru kashta",
    "ಉಸಿರಾಟದ ತೊಂದರೆ",
    "ಉಸಿರಾಡಲು ಕಷ್ಟ",
    "moochu vida kashtam",
    "மூச்சுத் திணறல்",
  ],
  sweating: ["sweating", "pasina", "पसीना", "bevaru", "ಬೆವರು", "வியர்வை"],
  pain_radiating_arm_jaw: [
    "pain going to my arm",
    "pain going to my jaw",
    "pain radiating to",
  ],
  unconscious: [
    "unconscious",
    "unresponsive",
    "behosh",
    "बेहोश",
    "prajne illa",
    "ಪ್ರಜ್ಞೆ ಇಲ್ಲ",
    "மயக்கம்",
  ],
  fainting: ["fainted", "fainting", "passed out"],
  seizure: ["seizure", "having fits", "daura", "दौरा", "ಫಿಟ್ಸ್", "வலிப்பு"],
  face_droop: ["facial droop", "face droop", "face is drooping", "चेहरा टेढ़ा"],
  slurred_speech: ["slurred speech", "speech is slurred", "बोली लड़खड़ा"],
  limb_weakness: [
    "sudden arm weakness",
    "sudden leg weakness",
    "sudden one-sided weakness",
  ],
  severe_bleeding: [
    "severe bleeding",
    "uncontrolled bleeding",
    "heavy bleeding",
    "lots of blood",
    "bahut khoon",
    "बहुत खून",
    "ತುಂಬಾ ರಕ್ತ",
    "tumba rakta",
    "niraya ratham",
  ],
  vaginal_bleeding: ["vaginal bleeding", "bleeding from vagina"],
  allergic_swelling: [
    "throat swelling",
    "swollen tongue",
    "swollen lips",
    "allergic swelling",
  ],
  major_injury: [
    "major injury",
    "major trauma",
    "serious injury",
    "serious accident",
    "गंभीर चोट",
    "ಗಂಭೀರ ಗಾಯ",
    "பலத்த காயம்",
  ],
  unable_to_drink: ["unable to drink", "cannot drink", "can't drink"],
  confusion: ["confused", "confusion"],
  fever: ["fever", "bukhar", "बुखार", "ಜ್ವರ", "காய்ச்சல்"],
  abdominal_pain: [
    "abdominal pain",
    "stomach pain",
    "pet mein",
    "ಹೊಟ್ಟೆ ನೋವು",
    "पेट दर्द",
  ],
  vomiting: ["vomiting", "ulti", "उल्टी", "ವಾಂತಿ"],
  headache: ["headache", "thale novu", "ತಲೆ ನೋವು", "सिर दर्द"],
  runny_nose: ["runny nose", "naak beh", "sardi"],
  body_ache: ["body pain", "body ache"],
  loss_of_appetite: ["appetite illa", "loss of appetite"],
};
export const emptyPatient = {
  age: null,
  name: null,
  sex: "unknown",
  phone: null,
  village: null,
} as const;
export const unknownHistory = {
  conditions: [],
  medications: [],
  pregnancy_status: "unknown",
} as const;
export function symptom(
  code: SymptomCode,
  present = true,
  words: string | null = null,
): Symptom {
  return {
    code,
    name: code.replaceAll("_", " "),
    present,
    patient_words: words,
    source: "REPORTED",
    duration: null,
    duration_hours: null,
    body_location: null,
    onset: "unknown",
    severity: "unknown",
  };
}
export function keywordSymptoms(raw: string): Symptom[] {
  const text = raw
    .normalize("NFC")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ");
  const result: Symptom[] = [];
  for (const [key, entries] of Object.entries(phrases)) {
    const match = entries.find((word) => text.includes(word));
    if (!match) continue;
    const s = symptom(key as SymptomCode, true, match);
    if (
      key === "breathlessness" &&
      /cannot breathe|can't breathe|struggling to breathe|severe (breathing difficulty|breathlessness|difficulty breathing)/.test(
        text,
      )
    )
      s.severity = "severe";
    if (key === "allergic_swelling")
      s.body_location = match.match(/throat|tongue|lip/)?.[0] ?? null;
    if (key === "limb_weakness") s.onset = "sudden";
    result.push(s);
  }
  return result;
}
export function keywordPregnancy(text: string): "pregnant" | "unknown" {
  return /\b(i am pregnant|i'?m pregnant|currently pregnant|pregnant|garbhini|garbhavati)\b|मैं गर्भवती|गर्भवती हूँ|ಗರ್ಭಿಣಿ|ನಾನು ಗರ್ಭಿಣಿ|கர்ப்பமாக|கர்ப்பிணி/.test(
    text.toLowerCase(),
  )
    ? "pregnant"
    : "unknown";
}
