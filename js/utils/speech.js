// speech.js — Web Speech API wrapper

let currentUtterance = null;

export function speak(text, rate = 1, onEnd = null) {
  stop();
  if (!window.speechSynthesis) {
    console.warn('Web Speech API not supported');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  utterance.pitch = 1;

  // Try to find a good English voice
  const voices = speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'))
    || voices.find(v => v.lang === 'en-US')
    || voices.find(v => v.lang.startsWith('en'));
  if (enVoice) utterance.voice = enVoice;

  if (onEnd) utterance.onend = onEnd;
  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
}

export function stop() {
  if (window.speechSynthesis) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking() {
  return window.speechSynthesis && speechSynthesis.speaking;
}

// Preload voices (some browsers load them async)
export function preloadVoices() {
  return new Promise(resolve => {
    if (!window.speechSynthesis) return resolve([]);
    let voices = speechSynthesis.getVoices();
    if (voices.length > 0) return resolve(voices);
    speechSynthesis.onvoiceschanged = () => {
      voices = speechSynthesis.getVoices();
      resolve(voices);
    };
    // Fallback timeout
    setTimeout(() => resolve(speechSynthesis.getVoices()), 1000);
  });
}
