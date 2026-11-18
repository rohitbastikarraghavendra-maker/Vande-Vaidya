export async function recordAudio(
  onStop: (audio: Blob) => void,
  onFail: () => void,
) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, sampleRate: 16000, noiseSuppression: true },
  });
  const release = () => stream.getTracks().forEach((t) => t.stop());
  try {
    const mime = [
      "audio/webm;codecs=opus",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ].find((t) => MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(
      stream,
      mime ? { mimeType: mime } : undefined,
    );
    const chunks: Blob[] = [];
    const start = performance.now();
    let failed = false;
    const stop = () => {
      if (recorder.state !== "inactive") recorder.stop();
    };
    const timer = setTimeout(stop, 30000);
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onerror = () => {
      failed = true;
      clearTimeout(timer);
      release();
      onFail();
    };
    recorder.onstop = () => {
      clearTimeout(timer);
      release();
      if (failed) return;
      if (performance.now() - start < 700 || !chunks.length) onFail();
      else onStop(new Blob(chunks, { type: recorder.mimeType }));
    };
    recorder.start();
    return stop;
  } catch (e) {
    release();
    throw e;
  }
}
