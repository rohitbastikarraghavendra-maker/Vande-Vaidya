import { recordAudio } from "../hooks/recorder";
import type { Language } from "./model";
interface Handlers {
  processing?(): void;
  listening(): void;
  success(text: string): void;
  error(message: string): void;
}
export interface SpeechProvider {
  localFallback?: boolean;
  start(handlers: Handlers): { stop(): void; cancel(): void };
}
export function speechProvider(language: Language): SpeechProvider {
  return {
    localFallback: language === "en",
    start(handlers) {
      const controller = new AbortController();
      let end: (() => void) | undefined;
      function fail(message: string) {
        if (!controller.signal.aborted) handlers.error(message);
      }
      void recordAudio(
        async (audio) => {
          if (controller.signal.aborted) return;
          handlers.processing?.();
          const form = new FormData();
          const extension = audio.type.includes("mp4")
            ? "mp4"
            : audio.type.includes("ogg")
              ? "ogg"
              : "webm";
          form.set("audio", audio, "speech." + extension);
          form.set("language_hint", language + "-IN");
          try {
            const response = await fetch("/api/stt", {
              method: "POST",
              body: form,
              signal: AbortSignal.any([
                controller.signal,
                AbortSignal.timeout(55000),
              ]),
            });
            if (!response.ok) throw Error();
            const body = await response.json();
            if (controller.signal.aborted) return;
            if (typeof body.text !== "string" || !body.text.trim())
              throw Error();
            if (!body.text.trim()) {
              fail("No speech detected. Try again or type.");
              return;
            }
            handlers.success(body.text);
          } catch {
            fail(
              "Couldn’t transcribe the recording. Retry or type your symptoms.",
            );
          }
        },
        () => fail("Recording was interrupted. Try again or type."),
      )
        .then((stop) => {
          end = stop;
          if (controller.signal.aborted) stop();
          else handlers.listening();
        })
        .catch(() => fail("Allow microphone access, or type your symptoms."));
      return {
        stop() {
          end?.();
        },
        cancel() {
          controller.abort();
          end?.();
        },
      };
    },
  };
}
