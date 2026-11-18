import { createContext, useContext } from "react";
import type { Language } from "./model";
export const Locale = createContext<Language>("en");
const labels: Record<string, [string, string]> = {
  "Type symptoms": ["ಲಕ್ಷಣಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ", "लक्षण लिखें"],
  "Describe your symptoms": ["ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ", "अपने लक्षण बताएँ"],
  "Speak for up to 30 seconds, then stop.": [
    "30 ಸೆಕೆಂಡುಗಳವರೆಗೆ ಮಾತನಾಡಿ, ನಂತರ ನಿಲ್ಲಿಸಿ.",
    "30 सेकंड तक बोलें, फिर रोकें।",
  ],
  "Listening…": ["ಆಲಿಸುತ್ತಿದ್ದೇವೆ…", "सुन रहे हैं…"],
  "Waiting for microphone access…": [
    "ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ…",
    "माइक्रोफ़ोन की अनुमति का इंतज़ार है…",
  ],
  "Transcribing…": ["ಮಾತನ್ನು ಬರಹಕ್ಕೆ ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ…", "आवाज़ को लिखा जा रहा है…"],
  "Stop recording": ["ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ", "रिकॉर्डिंग रोकें"],
  "Retry recording": ["ಮತ್ತೆ ರೆಕಾರ್ಡ್ ಮಾಡಿ", "फिर रिकॉर्ड करें"],
  "Tap to speak": ["ಮಾತನಾಡಲು ಒತ್ತಿ", "बोलने के लिए दबाएँ"],
  "No speech detected. Try again or type.": [
    "ಮಾತು ಕೇಳಿಸಲಿಲ್ಲ. ಮತ್ತೆ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.",
    "आवाज़ सुनाई नहीं दी। फिर बोलें या लिखें।",
  ],
  "Couldn’t transcribe the recording. Retry or type your symptoms.": [
    "ರೆಕಾರ್ಡಿಂಗ್ ಅನ್ನು ಬರಹಕ್ಕೆ ಪರಿವರ್ತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.",
    "रिकॉर्डिंग को लिख नहीं पाए। फिर बोलें या अपने लक्षण लिखें।",
  ],
  "Recording was interrupted. Try again or type.": [
    "ರೆಕಾರ್ಡಿಂಗ್ ಪೂರ್ಣವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.",
    "रिकॉर्डिंग अधूरी रही। फिर बोलें या लिखें।",
  ],
  "Allow microphone access, or type your symptoms.": [
    "ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ.",
    "माइक्रोफ़ोन की अनुमति दें या अपने लक्षण लिखें।",
  ],
  "Patient information": ["ರೋಗಿಯ ವಿವರಗಳು", "रोगी की जानकारी"],
  Name: ["ಹೆಸರು", "नाम"],
  "Age in years": ["ವಯಸ್ಸು (ವರ್ಷಗಳಲ್ಲಿ)", "उम्र (वर्षों में)"],
  Gender: ["ಲಿಂಗ", "लिंग"],
  Male: ["ಪುರುಷ", "पुरुष"],
  Female: ["ಮಹಿಳೆ", "महिला"],
  Other: ["ಇತರೆ", "अन्य"],
  "Phone number (optional)": ["ದೂರವಾಣಿ ಸಂಖ್ಯೆ (ಐಚ್ಛಿಕ)", "फ़ोन नंबर (वैकल्पिक)"],
  Continue: ["ಮುಂದುವರಿಸಿ", "आगे बढ़ें"],
  "Change language": ["ಭಾಷೆ ಬದಲಿಸಿ", "भाषा बदलें"],
  Back: ["ಹಿಂದೆ", "वापस"],
  "Enter your name": ["ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ", "अपना नाम दर्ज करें"],
  "Enter 7 to 15 digits, optionally starting with +": [
    "7 ರಿಂದ 15 ಅಂಕಿಗಳನ್ನು ನಮೂದಿಸಿ",
    "7 से 15 अंक दर्ज करें",
  ],
  "Enter an age from 1 to 125": [
    "1 ರಿಂದ 125 ವರ್ಷದೊಳಗಿನ ವಯಸ್ಸು ನಮೂದಿಸಿ",
    "1 से 125 वर्ष के बीच उम्र दर्ज करें",
  ],
  "Choose a gender": ["ಲಿಂಗ ಆಯ್ಕೆಮಾಡಿ", "लिंग चुनें"],
  "Tell us what you’re feeling": [
    "ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ ಎಂದು ಹೇಳಿ",
    "बताएँ, आपको कैसा महसूस हो रहा है?",
  ],
  "You can speak naturally.": ["ಸಹಜವಾಗಿ ಮಾತನಾಡಿ.", "आप अपने शब्दों में बोल सकते हैं।"],
  "Kannada speech recognition is not connected yet.": [
    "ಕನ್ನಡದಲ್ಲಿ ಧ್ವನಿಯನ್ನು ಬರಹಕ್ಕೆ ಪರಿವರ್ತಿಸುವ ಸೌಲಭ್ಯ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.",
    "कन्नड़ में बोलकर लिखने की सुविधा अभी उपलब्ध नहीं है।",
  ],
  "Hindi speech recognition is not connected yet.": [
    "ಹಿಂದಿಯಲ್ಲಿ ಧ್ವನಿಯನ್ನು ಬರಹಕ್ಕೆ ಪರಿವರ್ತಿಸುವ ಸೌಲಭ್ಯ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.",
    "हिंदी में बोलकर लिखने की सुविधा अभी उपलब्ध नहीं है।",
  ],
  "Here’s what we heard": ["ನಾವು ಕೇಳಿದ್ದು ಹೀಗಿದೆ", "हमने यह सुना"],
  "You can edit this if needed.": [
    "ಅಗತ್ಯವಿದ್ದರೆ ಇದನ್ನು ತಿದ್ದಬಹುದು.",
    "ज़रूरत हो तो इसे बदल सकते हैं।",
  ],
  "Speak again": ["ಮತ್ತೆ ಮಾತನಾಡಿ", "फिर से बोलें"],
  "Retry extraction": ["ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", "फिर कोशिश करें"],
  "We couldn’t identify symptoms. Try again.": [
    "ಲಕ್ಷಣಗಳನ್ನು ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    "लक्षण पहचान नहीं पाए। फिर कोशिश करें।",
  ],
  "Finding symptoms…": ["ಲಕ್ಷಣಗಳನ್ನು ಗುರುತಿಸಲಾಗುತ್ತಿದೆ…", "लक्षण पहचाने जा रहे हैं…"],
  "Did we get that right?": ["ಈ ಲಕ್ಷಣಗಳು ಸರಿಯೇ?", "क्या ये लक्षण सही हैं?"],
  "We couldn’t identify a symptom. Please add one or try speaking again.": [
    "ಲಕ್ಷಣವನ್ನು ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಒಂದನ್ನು ಸೇರಿಸಿ ಅಥವಾ ಮತ್ತೆ ಮಾತನಾಡಿ.",
    "कोई लक्षण पहचान नहीं पाए। एक लक्षण जोड़ें या फिर बोलें।",
  ],
  Remove: ["ತೆಗೆದುಹಾಕಿ", "हटाएँ"],
  "Missing symptom": ["ಬಿಟ್ಟುಹೋದ ಲಕ್ಷಣ", "छूटा हुआ लक्षण"],
  "Add symptom": ["ಲಕ್ಷಣ ಸೇರಿಸಿ", "लक्षण जोड़ें"],
  "Edit transcript": ["ಬರಹ ತಿದ್ದಿ", "लिखे हुए शब्द बदलें"],
  "Intake complete": ["ವಿವರಗಳನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ", "जानकारी दर्ज हो गई"],
  Started: ["ಪ್ರಾರಂಭ", "शुरुआत"],
  "Start new intake": ["ಹೊಸ ದಾಖಲೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ", "नई जानकारी दर्ज करें"],
  Symptom: ["ಲಕ್ಷಣ", "लक्षण"],
  "When did this start?": ["ಇದು ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು?", "यह कब शुरू हुआ?"],
  Today: ["ಇಂದು", "आज"],
  Yesterday: ["ನಿನ್ನೆ", "कल"],
  "2–3 days ago": ["2–3 ದಿನಗಳ ಹಿಂದೆ", "2–3 दिन पहले"],
  "More than 3 days ago": ["3 ದಿನಗಳಿಗಿಂತ ಮೊದಲು", "3 दिन से ज़्यादा पहले"],
  "Enter manually": ["ಸ್ವತಃ ನಮೂದಿಸಿ", "खुद लिखें"],
  "When it started": ["ಪ್ರಾರಂಭವಾದ ಸಮಯ", "कब शुरू हुआ"],
  "How bad is the pain?": ["ನೋವು ಎಷ್ಟಿದೆ?", "दर्द कितना है?"],
  "How severe does it feel?": ["ತೊಂದರೆ ಎಷ್ಟಿದೆ?", "तकलीफ़ कितनी है?"],
  Severity: ["ತೀವ್ರತೆ", "तीव्रता"],
  Mild: ["ಸೌಮ್ಯ", "हल्का"],
  Moderate: ["ಮಧ್ಯಮ", "मध्यम"],
  Severe: ["ತೀವ್ರ", "तेज़"],
  "Very severe": ["ಬಹಳ ತೀವ್ರ", "बहुत तेज़"],
  "Choose a number": ["ಒಂದು ಸಂಖ್ಯೆ ಆಯ್ಕೆಮಾಡಿ", "एक अंक चुनें"],
  Finish: ["ಮುಗಿಸಿ", "पूरा करें"],
  Fever: ["ಜ್ವರ", "बुखार"],
  Headache: ["ತಲೆನೋವು", "सिरदर्द"],
  "Abdominal pain": ["ಹೊಟ್ಟೆನೋವು", "पेट दर्द"],
  "Chest pain": ["ಎದೆನೋವು", "सीने में दर्द"],
  "Chest heaviness": ["ಎದೆ ಭಾರ", "सीने में भारीपन"],
  Cough: ["ಕೆಮ್ಮು", "खाँसी"],
  "Sore throat": ["ಗಂಟಲು ನೋವು", "गले में दर्द"],
  Nausea: ["ವಾಕರಿಕೆ", "मितली"],
  Vomiting: ["ವಾಂತಿ", "उल्टी"],
  Dizziness: ["ತಲೆಸುತ್ತು", "चक्कर"],
  Fatigue: ["ಆಯಾಸ", "थकान"],
};
export function translate(language: Language, text: string) {
  return language === "en"
    ? text
    : (labels[text]?.[language === "kn" ? 0 : 1] ?? text);
}
export function useText() {
  const lang = useContext(Locale);
  return (text: string) => translate(lang, text);
}
