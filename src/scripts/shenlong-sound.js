// Call start only from a user gesture; no audio context is created on import.
export function createShenlongSound(makeContext = () => {
  const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
  return AudioContext ? new AudioContext() : null;
}) {
  let context = null;
  let enabled = false;
  let generation = 0;
  const voices = new Set();

  function stop() {
    generation++;
    enabled = false;
    for (const voice of voices) {
      try { voice.stop(); } catch { /* Already stopped. */ }
    }
    voices.clear();
    const old = context;
    context = null;
    if (old) Promise.resolve(old.close()).catch(() => {});
  }

  return {
    async start() {
      if (enabled) return true;
      const current = ++generation;
      try {
        context ||= makeContext();
        if (!context) return false;
        if (context.state === 'suspended') await context.resume();
        if (current !== generation) return false;
        enabled = context.state === 'running';
        return enabled;
      } catch {
        if (current === generation) stop();
        return false;
      }
    },
    stop,
    play(event) {
      const settings = {
        arrival: [85, 240, 1.8, 'sawtooth'],
        wish: [330, 660, 0.8, 'sine'],
        collect: [550, 880, 0.25, 'sine'],
      }[event];
      if (!enabled || !context || !settings) return false;
      try {
        const [from, to, duration, type] = settings;
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(from, now);
        oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(event === 'arrival' ? 0.045 : 0.07, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        voices.add(oscillator);
        oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now);
        oscillator.stop(now + duration + 0.01);
        return true;
      } catch { return false; }
    },
  };
}
