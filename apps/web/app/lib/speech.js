// apps/web/app/lib/speech.js
export function speak(text) {
  if (!text) return;
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  u.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function startSpeechToText({ onText, onError }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onError?.(new Error("SpeechRecognition not supported in this browser. Use Chrome/Edge."));
    return null;
  }

  const rec = new SR();
  rec.lang = "en-US";
  rec.interimResults = true;     // helps catch speech earlier
  rec.continuous = false;
  rec.maxAlternatives = 1;

  let finalTranscript = "";

  rec.onresult = (e) => {
    let t = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      t += e.results[i][0].transcript;
      if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
    }
  };

  rec.onend = () => {
    const out = (finalTranscript || "").trim();
    if (out) onText?.(out);
  };

  rec.onerror = (e) => {
    // e.error can be: "no-speech", "not-allowed", "audio-capture", ...
    onError?.(new Error(e?.error || "speech error"));
  };

  try {
    rec.start();
  } catch (err) {
    onError?.(err);
    return null;
  }

  return rec;
}