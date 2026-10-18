import { SceneTheme } from '../data/stories';

const THEME_FREQUENCIES: Record<SceneTheme, [number, number, number]> = {
  'primordial-waters': [110.0, 164.81, 220.0], // A2, E3, A3
  'first-light': [146.83, 220.0, 293.66], // D3, A3, D4
  'parted-sky': [130.81, 196.0, 261.63], // C3, G3, C4
  'ancient-forest': [123.47, 185.0, 246.94], // B2, F#3, B3
  'celestial-spheres': [164.81, 246.94, 329.63], // E3, B3, E4
  'living-waters': [146.83, 207.65, 293.66], // D3, G#3, D4
  'sacred-breath': [130.81, 164.81, 261.63], // C3, E3, C4
  'sabbath-stillness': [110.0, 138.59, 220.0], // A2, C#3, A3
  'eden-mist': [130.81, 196.0, 246.94], // Cmaj7
  'deluge-ark': [98.0, 146.83, 196.0], // G2, D3, G3
  'desert-stars': [110.0, 164.81, 207.65], // A2, E3, G#3
};

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private currentTheme: SceneTheme = 'primordial-waters';

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public start(theme: SceneTheme = 'primordial-waters', enabled = true) {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // If already playing, smoothly glide harmonic frequencies instead of restarting
    if (this.isPlaying && this.oscillators.length > 0) {
      this.updateTheme(theme, enabled);
      return;
    }

    try {
      this.stopOscillators();
      this.currentTheme = theme;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.038, ctx.currentTime + 2.4);
      master.connect(ctx.destination);
      this.masterGain = master;

      const freqs =
        THEME_FREQUENCIES[theme] || THEME_FREQUENCIES['primordial-waters'];
      this.oscillators = freqs.map((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        oscGain.gain.setValueAtTime(idx === 0 ? 0.5 : 0.18, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(master);
        osc.start();
        return osc;
      });

      this.isPlaying = true;
    } catch {
      // Ignore Web Audio blocks in automated headless contexts
    }
  }

  /**
   * Synthesizes an expressive acoustic soundscape tailored to the chapter's [sound cue]
   * so the narrator respects the cue and lets the atmosphere speak before the prose.
   */
  public playSoundCueEffect(
    soundCueText: string,
    theme: SceneTheme = 'primordial-waters',
    durationMs = 3800,
    enabled = true
  ) {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const lower = soundCueText.toLowerCase();
    const durSec = Math.max(2.0, durationMs / 1000);
    const now = ctx.currentTime;

    try {
      const freqs =
        THEME_FREQUENCIES[theme] || THEME_FREQUENCIES['primordial-waters'];

      // 1. Wind / Open Water / Seashell / Breath cue -> Filtered Pink-Noise Ocean Swell
      if (
        /\b(wind|water|seashell|breath|sigh|mist|rain|waves|deep)\b/.test(lower)
      ) {
        const bufferSize = Math.floor(ctx.sampleRate * durSec);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0,
          b1 = 0,
          b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.997 * b0 + white * 0.029;
          b1 = 0.985 * b1 + white * 0.032;
          b2 = 0.95 * b2 + white * 0.048;
          output[i] = (b0 + b1 + b2) * 0.35;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(220, now);
        filter.frequency.exponentialRampToValueAtTime(540, now + durSec * 0.48);
        filter.frequency.exponentialRampToValueAtTime(180, now + durSec);
        filter.Q.setValueAtTime(1.8, now);

        const swellGain = ctx.createGain();
        swellGain.gain.setValueAtTime(0.0001, now);
        swellGain.gain.exponentialRampToValueAtTime(0.065, now + durSec * 0.42);
        swellGain.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

        whiteNoise.connect(filter);
        filter.connect(swellGain);
        swellGain.connect(ctx.destination);

        whiteNoise.start(now);
        whiteNoise.stop(now + durSec);
      }

      // 2. Sustained Note / Tuning / Hum / Light cue -> Pure Harmonic Resolution
      if (/\b(note|hum|tuning|clear|pure|light|chord|stillness)\b/.test(lower)) {
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          // Start slightly detuned ("universe tuning itself") and resolve to pure interval
          const startFreq = idx === 0 ? f : f * (idx === 1 ? 0.985 : 1.015);
          const targetFreq = idx === 2 ? f * 2 : f;
          osc.frequency.setValueAtTime(startFreq, now);
          osc.frequency.exponentialRampToValueAtTime(
            targetFreq,
            now + durSec * 0.45
          );

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(
            idx === 0 ? 0.045 : 0.028,
            now + durSec * 0.35
          );
          gain.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + durSec + 0.05);
        });
      }

      // 3. Heartbeat / Silence / Waiting cue -> Soft Sub-Bass Double Pulse
      if (/\b(heartbeats|heartbeat|waiting|silence|hollow)\b/.test(lower)) {
        [0.4, 0.85, 1.9, 2.35].forEach((offset) => {
          if (offset >= durSec - 0.3) return;
          const pulse = ctx.createOscillator();
          const pGain = ctx.createGain();
          pulse.type = 'sine';
          pulse.frequency.setValueAtTime(62, now + offset);
          pulse.frequency.exponentialRampToValueAtTime(42, now + offset + 0.32);

          pGain.gain.setValueAtTime(0.0001, now + offset);
          pGain.gain.exponentialRampToValueAtTime(0.06, now + offset + 0.06);
          pGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.36);

          pulse.connect(pGain);
          pGain.connect(ctx.destination);
          pulse.start(now + offset);
          pulse.stop(now + offset + 0.38);
        });
      }
    } catch {
      // Ignore in headless environments
    }
  }

  public triggerWonderChime(theme: SceneTheme = 'first-light', enabled = true) {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const freqs = THEME_FREQUENCIES[theme] || THEME_FREQUENCIES['first-light'];
      freqs.forEach((baseFreq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * 2, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(
          0.032,
          ctx.currentTime + i * 0.08 + 0.15
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + i * 0.08 + 2.2
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 2.3);
      });
    } catch {
      // Ignore in headless browser
    }
  }

  public updateTheme(theme: SceneTheme, enabled = true) {
    if (!this.isPlaying || !enabled || !this.ctx) return;
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;
    const freqs =
      THEME_FREQUENCIES[theme] || THEME_FREQUENCIES['primordial-waters'];
    this.oscillators.forEach((osc, idx) => {
      try {
        osc.frequency.exponentialRampToValueAtTime(
          freqs[idx] || 110,
          this.ctx!.currentTime + 2.2
        );
      } catch {
        // Ignore transition errors
      }
    });
  }

  public stop() {
    this.isPlaying = false;
    this.stopOscillators();
  }

  private stopOscillators() {
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      } catch {
        // Ignore
      }
    }
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore
      }
    });
    this.oscillators = [];
  }
}

export const ambientSound = new AmbientSoundEngine();
