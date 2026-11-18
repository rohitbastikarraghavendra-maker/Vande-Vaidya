import type { ExtractedSymptoms } from "./model";
export interface SymptomExtractor {
  extractSymptoms(confirmedTranscript: string): Promise<ExtractedSymptoms>;
}
const vocabulary: [string, string][] = [
  ["Fever", "fever|jwara|jvara|bukhar|bukhaar|ಜ್ವರ(?:ವಿದೆ|ವಿತ್ತು|ದಿಂದ)?|बुखार|बुख़ार"],
  [
    "Headache",
    "headache|head pain|my head hurts|tale novu|sir (?:mein )?dard|सिरदर्द|सिर में दर्द|सर दर्द|सिर दर्द|ತಲೆ ?ನೋವು|ತಲೆ ?ನೋವಿದೆ|ತಲೆ ?ನೋವುತ್ತಿದೆ",
  ],
  ["Chest heaviness", "chest (?:feels |is )?heavy|chest heaviness"],
  ["Chest pain", "chest pain|seene mein dard|ಎದೆ ನೋವು"],
  [
    "Abdominal pain",
    "stomach ache|stomachache|abdominal pain|stomach pain|pet dard|ಹೊಟ್ಟೆ ನೋವು|पेट दर्द",
  ],
  ["Cough", "cough(?:ing)?|khansi|ಕೆಮ್ಮು(?:ತ್ತಿದೆ)?|ಕೆಮ್ಮಿದೆ|खासी|खांसी|खाँसी"],
  ["Sore throat", "sore throat|throat pain"],
  ["Nausea", "nausea|nauseous|मतली|ವಾಕರಿಕೆ"],
  ["Vomiting", "vomiting|throwing up|ulti|उल्टी|ವಾಂತಿ"],
  ["Dizziness", "dizzy|dizziness|chakkar"],
  ["Fatigue", "fatigue|tired|weakness"],
];
export class TranscriptSymptomExtractor implements SymptomExtractor {
  async extractSymptoms(confirmedTranscript: string) {
    const symptoms = [];
    for (const [name, terms] of vocabulary) {
      const pattern = new RegExp(
        "(?<![\\p{L}\\p{M}])(?:" +
          terms +
          ")(?![\\p{L}\\p{M}])(?: (?:tumba )?ide)?",
        "giu",
      );
      for (const m of confirmedTranscript.matchAll(pattern)) {
        const before =
          confirmedTranscript
            .slice(0, m.index)
            .split(
              /[.,;!?।]|\b(?:but|however|lekin|aadre|i have|i feel)\b|लेकिन|ಆದರೆ/i,
            )
            .at(-1) ?? "";
        if (
          /\b(no|without|denies|never had|do not have|don't have)\b/i.test(
            before,
          ) ||
          /^\s*(?:illa|nahi|नहीं|ಇಲ್ಲ)/iu.test(
            confirmedTranscript.slice(m.index + m[0].length),
          )
        )
          continue;
        symptoms.push({ id: crypto.randomUUID(), name, sourceText: m[0] });
        break;
      }
    }
    return { symptoms };
  }
}
