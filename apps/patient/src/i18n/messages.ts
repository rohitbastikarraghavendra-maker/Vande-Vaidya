import type { LanguageCode, TriageLevel } from "@rht/shared";
export const languages = {
  "en-IN": "English",
  "kn-IN": "ಕನ್ನಡ",
  "hi-IN": "हिन्दी",
  "ta-IN": "தமிழ்",
};
export const phrase = (
  lang: LanguageCode,
  en: string,
  kn: string,
  hi: string,
  ta: string,
) => ({ "en-IN": en, "kn-IN": kn, "hi-IN": hi, "ta-IN": ta })[lang];
export function guidance(l: LanguageCode, level: TriageLevel) {
  return {
    LOW: phrase(
      l,
      "Monitor your symptoms.",
      "ನಿಮ್ಮ ಲಕ್ಷಣಗಳ ಮೇಲೆ ಗಮನವಿರಲಿ.",
      "अपने लक्षणों पर नज़र रखें।",
      "உங்கள் அறிகுறிகளைக் கவனியுங்கள்.",
    ),
    MEDIUM: phrase(
      l,
      "Please speak with a healthcare worker.",
      "ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರೊಂದಿಗೆ ಮಾತನಾಡಿ.",
      "स्वास्थ्य कर्मी से बात करें।",
      "சுகாதாரப் பணியாளரிடம் பேசுங்கள்.",
    ),
    HIGH: phrase(
      l,
      "Please seek medical care promptly.",
      "ಬೇಗ ವೈದ್ಯಕೀಯ ನೆರವು ಪಡೆಯಿರಿ.",
      "जल्द चिकित्सा सहायता लें।",
      "விரைவாக மருத்துவ உதவி பெறுங்கள்.",
    ),
    EMERGENCY: phrase(
      l,
      "Seek emergency medical care immediately.",
      "ತಕ್ಷಣ ತುರ್ತು ವೈದ್ಯಕೀಯ ನೆರವು ಪಡೆಯಿರಿ.",
      "तुरंत आपात चिकित्सा सहायता लें।",
      "உடனே அவசர மருத்துவ உதவி பெறுங்கள்.",
    ),
  }[level];
}
