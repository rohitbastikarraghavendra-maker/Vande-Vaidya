import { z } from "zod";
import { LanguageCodeSchema, type LanguageCode } from "@rht/shared";
import { ExtractionResultSchema } from "../../../../packages/triage-engine/src/extraction";
import type {
  ClinicalExtractor,
  ExtractInput,
} from "../../../../packages/triage-engine/src/mock";
const reply = z.object({
  text: z.string().trim().min(1),
  language: LanguageCodeSchema.nullable(),
  provider: z.string(),
});
export interface SpeechToTextProvider {
  transcribe(
    audio: Blob,
    language: LanguageCode,
    followUp?: boolean,
  ): Promise<z.infer<typeof reply>>;
}
export const speech: SpeechToTextProvider = {
  async transcribe(audio, language, followUp = false) {
    const data = new FormData();
    data.set(
      "audio",
      audio,
      "recording." + (audio.type.includes("mp4") ? "mp4" : "webm"),
    );
    data.set("language_hint", language);
    if (followUp) data.set("follow_up", "true");
    for (let i = 0; ; i++) {
      try {
        const r = await fetch("/api/stt", {
          method: "POST",
          body: data,
          signal: AbortSignal.timeout(12000),
        });
        if (!r.ok) throw Error("STT_FAILED");
        return reply.parse(await r.json());
      } catch (e) {
        if (i === 1) throw e;
      }
    }
  },
};
export const clinical: ClinicalExtractor = {
  async extract(input: ExtractInput) {
    // The BFF already retried provider errors. Retry a transport or invalid-body failure once.
    for (let attempt = 0; attempt < 2; attempt++) {
      let response: Response;
      try {
        response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(10000),
        });
      } catch (error) {
        if (attempt === 1) throw error;
        continue;
      }
      if (!response.ok) throw Error("LLM_FAILED");
      try {
        return ExtractionResultSchema.parse(await response.json());
      } catch (error) {
        if (attempt === 1) throw error;
      }
    }
    throw Error("LLM_INVALID");
  },
};
export interface TtsProvider {
  speak(text: string, lang: LanguageCode): void;
}
export class MockTtsProvider implements TtsProvider {
  speak() {}
}
export const tts: TtsProvider =
  import.meta.env.VITE_TTS === "browser"
    ? {
        speak(text, lang) {
          try {
            speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = lang;
            speechSynthesis.speak(msg);
          } catch {
            /* Visible guidance remains. */
          }
        },
      }
    : new MockTtsProvider();
