import { recordAudio } from "../hooks/recorder";
import type { SpeechProvider } from "./speech";
export const localEnglish: SpeechProvider = {
  start(handlers) {
    const controller = new AbortController();
    let stop: (() => void) | undefined;
    function fail(message: string) {
      if (!controller.signal.aborted) handlers.error(message);
    }
    void recordAudio(
      async (blob) => {
        if (controller.signal.aborted) return;
        handlers.processing?.();
        try {
          const context = new OfflineAudioContext(1, 1, 16000);
          const audio = await context.decodeAudioData(await blob.arrayBuffer());
          const samples = audio.getChannelData(0);
          const pcm = Int16Array.from(
            samples,
            (s) => Math.max(-1, Math.min(1, s)) * 32767,
          );
          const reply = await fetch("/api/local-english", {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: pcm,
            signal: controller.signal,
          });
          if (!reply.ok) throw Error();
          const { text } = await reply.json();
          if (controller.signal.aborted) return;
          if (typeof text === "string" && text.trim()) handlers.success(text);
          else fail("No speech detected. Try again.");
        } catch {
          fail(
            "Local recognition is unavailable. Check the local server and Windows English speech pack.",
          );
        }
      },
      () => fail("Recording was interrupted. Try speaking again."),
    )
      .then((end) => {
        stop = end;
        if (controller.signal.aborted) end();
        else handlers.listening();
      })
      .catch(() => fail("Allow microphone access and retry."));
    return {
      stop() {
        stop?.();
      },
      cancel() {
        controller.abort();
        stop?.();
      },
    };
  },
};
