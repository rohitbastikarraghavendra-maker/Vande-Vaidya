import type {
  LanguageCode,
  PatientSnapshot,
  Symptom,
  SymptomCode,
  TriageLevel,
  PregnancyStatus,
} from "@rht/shared";
type Group = import("./extraction").ExtractionResult["complaint_group"];
type Question = {
  id: string;
  groups: Group[];
  about: SymptomCode | "pregnancy";
  text: [string, string, string, string];
  inverse?: boolean;
};
export const bank: Question[] = [
  {
    id: "cp_breath",
    groups: ["chest_pain", "fever", "general", "breathing"],
    about: "breathlessness",
    text: [
      "Is breathing difficult?",
      "ಉಸಿರಾಡಲು ಕಷ್ಟವಾಗುತ್ತಿದೆಯೇ?",
      "क्या सांस लेने में तकलीफ है?",
      "மூச்சு விடச் சிரமமா?",
    ],
  },
  {
    id: "cp_sweat",
    groups: ["chest_pain"],
    about: "sweating",
    text: [
      "Are you sweating a lot?",
      "ತುಂಬಾ ಬೆವರು ಬರುತ್ತಿದೆಯೇ?",
      "क्या बहुत पसीना आ रहा है?",
      "அதிகமாக வியர்க்கிறதா?",
    ],
  },
  {
    id: "cp_radiate",
    groups: ["chest_pain"],
    about: "pain_radiating_arm_jaw",
    text: [
      "Does the pain spread to your arm or jaw?",
      "ನೋವು ಕೈ ಅಥವಾ ದವಡೆಗೆ ಹರಡುತ್ತಿದೆಯೇ?",
      "क्या दर्द हाथ या जबड़े तक जाता है?",
      "வலி கை அல்லது தாடைக்குப் பரவுகிறதா?",
    ],
  },
  {
    id: "ab_pregnancy",
    groups: ["abdominal_pain", "bleeding_pregnancy"],
    about: "pregnancy",
    text: [
      "Could you be pregnant?",
      "ನೀವು ಗರ್ಭಿಣಿಯಾಗಿರಬಹುದೇ?",
      "क्या आप गर्भवती हो सकती हैं?",
      "கர்ப்பமாக இருக்க வாய்ப்பு உள்ளதா?",
    ],
  },
  {
    id: "ab_bleed",
    groups: ["abdominal_pain", "bleeding_pregnancy"],
    about: "vaginal_bleeding",
    text: [
      "Are you having vaginal bleeding?",
      "ಯೋನಿಯಿಂದ ರಕ್ತಸ್ರಾವವಾಗುತ್ತಿದೆಯೇ?",
      "क्या योनि से रक्तस्राव हो रहा है?",
      "பிறப்புறுப்பில் இரத்தப்போக்கு உள்ளதா?",
    ],
  },
  {
    id: "fv_confusion",
    groups: ["fever", "neuro"],
    about: "confusion",
    text: [
      "Are you feeling confused?",
      "ಗೊಂದಲವಾಗುತ್ತಿದೆಯೇ?",
      "क्या भ्रम हो रहा है?",
      "குழப்பமாக இருக்கிறதா?",
    ],
  },
  {
    id: "fv_drinking",
    groups: ["fever"],
    about: "unable_to_drink",
    inverse: true,
    text: [
      "Can you drink fluids?",
      "ನೀರು ಕುಡಿಯಲು ಸಾಧ್ಯವೇ?",
      "क्या आप पानी पी पा रहे हैं?",
      "தண்ணீர் குடிக்க முடியுமா?",
    ],
  },
  {
    id: "ha_fever",
    groups: ["headache", "abdominal_pain"],
    about: "fever",
    text: ["Do you have a fever?", "ಜ್ವರ ಇದೆಯೇ?", "क्या बुखार है?", "காய்ச்சல் உள்ளதா?"],
  },
  {
    id: "ha_weak",
    groups: ["headache", "neuro"],
    about: "limb_weakness",
    text: [
      "Is an arm or leg weak?",
      "ಕೈ ಅಥವಾ ಕಾಲು ದುರ್ಬಲವಾಗಿದೆಯೇ?",
      "क्या हाथ या पैर कमजोर है?",
      "கை அல்லது காலில் பலவீனம் உள்ளதா?",
    ],
  },
  {
    id: "inj_bleed",
    groups: ["injury"],
    about: "severe_bleeding",
    text: [
      "Are you bleeding heavily?",
      "ತುಂಬಾ ರಕ್ತಸ್ರಾವವಾಗುತ್ತಿದೆಯೇ?",
      "क्या बहुत खून बह रहा है?",
      "அதிக இரத்தப்போக்கு உள்ளதா?",
    ],
  },
];
export const questionText = (q: Question, l: LanguageCode) =>
  q.text[{ "en-IN": 0, "kn-IN": 1, "hi-IN": 2, "ta-IN": 3 }[l]];
export function selectNextQuestion(
  level: TriageLevel,
  group: Group,
  symptoms: Symptom[],
  patient: PatientSnapshot,
  pregnancy: PregnancyStatus,
  asked: string[],
) {
  if (level === "EMERGENCY" || asked.length >= 4) return null;
  return (
    bank.find(
      (q) =>
        q.groups.includes(group) &&
        !asked.includes(q.id) &&
        (q.about === "pregnancy"
          ? patient.sex === "female" &&
            patient.age !== null &&
            patient.age >= 12 &&
            patient.age <= 50 &&
            pregnancy === "unknown"
          : (q.about !== "vaginal_bleeding" || patient.sex !== "male") &&
            !symptoms.some((s) => s.code === q.about)),
    ) ?? null
  );
}
