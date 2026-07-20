/**
 * Gentle sound notification engine using the browser's Web Audio API.
 * Synthesizes organic chime/bell sounds without requiring any external audio asset files.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Plays a gentle, pleasant dual-tone chime notification (sine wave with exponential decay).
 * High-quality synthesis mimicking an organic bell.
 */
export function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser security policies)
  if (ctx.state === "suspended") {
    ctx.resume().catch((err) => {
      console.warn("Could not resume audio context due to user interaction policies:", err);
    });
    // If it's still suspended, we might not have permission to play yet, but we proceed or fail gracefully
  }

  try {
    const now = ctx.currentTime;

    // --- NOTE 1 (Higher, crystal tone) ---
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    
    osc1.type = "sine";
    // E5 (659.25 Hz) for a warm melodic lift
    osc1.frequency.setValueAtTime(659.25, now);
    
    // Very gentle envelope
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.04); // soft attack
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7); // smooth decay
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // --- NOTE 2 (A bit higher, sparkling accent, played with slight delay) ---
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    
    osc2.type = "sine";
    // B5 (987.77 Hz) for a perfect fifth harmony
    osc2.frequency.setValueAtTime(987.77, now + 0.08);
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.12); // soft attack delayed
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9); // long smooth decay
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    // Start and stop oscillators
    osc1.start(now);
    osc1.stop(now + 0.8);
    
    osc2.start(now + 0.08);
    osc2.stop(now + 1.0);
  } catch (error) {
    console.warn("Web Audio API notification playback failed:", error);
  }
}

/**
 * Plays an alternative subtle success click (lower frequency, quick decay).
 */
export function playSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // G5 (783.99 Hz) to C6 (1046.50 Hz) slide for uplifting positive reinforcement
    osc.frequency.setValueAtTime(783.99, now);
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (error) {
    // Ignore silent failure
  }
}
