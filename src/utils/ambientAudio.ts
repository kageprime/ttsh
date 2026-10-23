import { SceneTheme } from '../data/stories';
import { ChapterVisualMotif } from './storybookLogic';

const THEME_FREQUENCIES: Record<SceneTheme, [number, number, number, number]> = {
  'primordial-waters': [110.0, 164.81, 220.0, 261.63], // A2, E3, A3, C4 (Aeolian deep)
  'first-light': [146.83, 220.0, 293.66, 369.99], // D3, A3, D4, F#4 (Lydian/Major dawn)
  'parted-sky': [130.81, 196.0, 261.63, 329.63], // C3, G3, C4, E4
  'ancient-forest': [123.47, 185.0, 246.94, 293.66], // B2, F#3, B3, D4 (Dorian grove)
  'celestial-spheres': [164.81, 246.94, 329.63, 415.3], // E3, B3, E4, G#4
  'living-waters': [146.83, 207.65, 293.66, 329.63], // D3, G#3, D4, E4
  'sacred-breath': [130.81, 164.81, 261.63, 392.0], // C3, E3, C4, G4
  'sabbath-stillness': [110.0, 138.59, 220.0, 277.18], // A2, C#3, A3, C#4
  'eden-mist': [130.81, 196.0, 246.94, 293.66], // Cmaj9
  'deluge-ark': [98.0, 146.83, 196.0, 233.08], // G2, D3, G3, Bb3 (Minor storm)
  'desert-stars': [110.0, 164.81, 207.65, 246.94], // A2, E3, G#3, B3
};

export type FoleyLayerKind = 'waves' | 'rain' | 'wind' | 'fire';

export function resolveFoleyLayerForChapter(
  theme: SceneTheme,
  motif?: ChapterVisualMotif
): FoleyLayerKind {
  if (
    motif === 'e3-ch1-deluge-ark' ||
    theme === 'deluge-ark'
  ) {
    return 'rain';
  }
  if (
    motif === 'e2-ch7-flaming-sword' ||
    motif === 'e4-ch1-pilgrim-tent-fire' ||
    motif === 'e1-ch5-yehi-or-burst'
  ) {
    return 'fire';
  }
  if (
    motif === 'e1-ch4-hovering-ruach' ||
    motif === 'e1-ch8-sacred-dust-breath' ||
    motif === 'e2-ch4-fig-leaves-fall' ||
    motif === 'e2-ch5-ayekah-footsteps' ||
    motif === 'e3-ch2-receding-wind-ark' ||
    motif === 'e4-ch2-counted-stars' ||
    theme === 'sacred-breath' ||
    theme === 'desert-stars'
  ) {
    return 'wind';
  }
  return 'waves';
}

export function computeEmotionalTensionFromText(text: string): number {
  if (!text) return 0.25;
  const lower = text.toLowerCase();
  let tension = 0.25;

  if (
    /\b(serpent|naked|hid|hiding|afraid|fear|flood|deluge|storm|sword|flaming|thorns|ruins|darkness|void|shattered|weeping|exile)\b/.test(
      lower
    )
  ) {
    tension += 0.45;
  }
  if (
    /\b(where are you|ayekah|question|wait|waiting|silence|deep|abyss|unformed)\b/.test(
      lower
    )
  ) {
    tension += 0.22;
  }
  if (
    /\b(peace|sabbath|rest|rested|stillness|dove|olive|grace|blessed|good|harmony|healing)\b/.test(
      lower
    )
  ) {
    tension -= 0.15;
  }

  return Math.max(0.05, Math.min(1.0, tension));
}

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private oscGains: GainNode[] = [];
  private padFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;

  // Continuous environmental foley nodes
  private foleySource: AudioBufferSourceNode | null = null;
  private foleyFilter: BiquadFilterNode | null = null;
  private foleyGain: GainNode | null = null;
  private foleyLfo: OscillatorNode | null = null;
  private foleyLfoGain: GainNode | null = null;
  private currentFoleyKind: FoleyLayerKind = 'waves';
  private crackleTimer: number | null = null;

  private isPlaying = false;
  private currentTheme: SceneTheme = 'primordial-waters';
  private currentTension = 0.25;
  private lastRippleTimeMs = 0;

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
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public getActiveLayersSummary(
    theme: SceneTheme,
    motif?: ChapterVisualMotif
  ): {
    foley: FoleyLayerKind;
    harmonicMode: string;
    tensionPercent: number;
  } {
    const foley = resolveFoleyLayerForChapter(theme, motif);
    const modeMap: Record<SceneTheme, string> = {
      'primordial-waters': 'A Aeolian Deep Drone',
      'first-light': 'D Lydian Dawn Fifths',
      'parted-sky': 'C Open Firmament Triad',
      'ancient-forest': 'B Dorian Botanical Choir',
      'celestial-spheres': 'E Celestial Maj7',
      'living-waters': 'D Acoustic Current',
      'sacred-breath': 'C Ruach Breath Harmonic',
      'sabbath-stillness': 'A Sanctuary Cathedral Pad',
      'eden-mist': 'C Edenic Ninth',
      'deluge-ark': 'G Minor Tempest Swell',
      'desert-stars': 'A Nocturnal Starlight Fifth',
    };
    return {
      foley,
      harmonicMode: modeMap[theme] || 'Sanctuary Harmonic Pad',
      tensionPercent: Math.round(this.currentTension * 100),
    };
  }

  public start(
    theme: SceneTheme = 'primordial-waters',
    enabled = true,
    motif?: ChapterVisualMotif
  ) {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const targetFoley = resolveFoleyLayerForChapter(theme, motif);

    // If already playing, smoothly crossfade harmonic frequencies & environmental foley
    if (this.isPlaying && this.oscillators.length > 0) {
      this.updateTheme(theme, enabled, motif);
      return;
    }

    try {
      this.stopOscillators();
      this.currentTheme = theme;
      this.currentFoleyKind = targetFoley;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.042, ctx.currentTime + 2.2);
      master.connect(ctx.destination);
      this.masterGain = master;

      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(420, ctx.currentTime);
      padFilter.Q.setValueAtTime(1.2, ctx.currentTime);
      padFilter.connect(master);
      this.padFilter = padFilter;

      const freqs =
        THEME_FREQUENCIES[theme] || THEME_FREQUENCIES['primordial-waters'];
      this.oscGains = [];
      this.oscillators = freqs.map((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : idx === 3 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        const baseGain =
          idx === 0 ? 0.48 : idx === 1 ? 0.22 : idx === 2 ? 0.16 : 0.06;
        oscGain.gain.setValueAtTime(baseGain, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(padFilter);
        osc.start();
        this.oscGains.push(oscGain);
        return osc;
      });

      this.startFoleyLayer(ctx, master, targetFoley);
      this.isPlaying = true;
    } catch {
      // Ignore Web Audio blocks in automated headless contexts
    }
  }

  private startFoleyLayer(
    ctx: AudioContext,
    destination: AudioNode,
    foleyKind: FoleyLayerKind
  ) {
    try {
      this.stopFoleyLayer();
      const durSec = 6.0;
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
        // Add subtle rain/fire micro-impulses into the buffer
        const impulse =
          Math.random() > 0.9985 ? (Math.random() * 2 - 1) * 0.55 : 0;
        output[i] = (b0 + b1 + b2) * 0.32 + impulse;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      const foleyGain = ctx.createGain();
      this.applyFoleyFilterSettings(ctx, filter, foleyGain, foleyKind);

      // Slow organic LFO to breathe wind / tidal waves
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(
        foleyKind === 'waves' ? 0.14 : foleyKind === 'wind' ? 0.22 : 0.35,
        ctx.currentTime
      );
      lfoGain.gain.setValueAtTime(
        foleyKind === 'waves' ? 140 : foleyKind === 'wind' ? 220 : 60,
        ctx.currentTime
      );
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      source.connect(filter);
      filter.connect(foleyGain);
      foleyGain.connect(destination);

      source.start();
      lfo.start();

      this.foleySource = source;
      this.foleyFilter = filter;
      this.foleyGain = foleyGain;
      this.foleyLfo = lfo;
      this.foleyLfoGain = lfoGain;

      // Schedule subtle procedural droplets or fire crackles
      if (typeof window !== 'undefined') {
        this.crackleTimer = window.setInterval(() => {
          if (!this.isPlaying || !this.ctx) return;
          if (
            this.currentFoleyKind === 'fire' ||
            this.currentFoleyKind === 'rain'
          ) {
            this.triggerMicroFoleyParticle(this.currentFoleyKind);
          }
        }, 420);
      }
    } catch {
      // Ignore in headless contexts
    }
  }

  private applyFoleyFilterSettings(
    ctx: AudioContext,
    filter: BiquadFilterNode,
    gainNode: GainNode,
    foleyKind: FoleyLayerKind
  ) {
    const now = ctx.currentTime;
    if (foleyKind === 'rain') {
      filter.type = 'bandpass';
      filter.frequency.setTargetAtTime(1150, now, 0.8);
      filter.Q.setTargetAtTime(0.9, now, 0.8);
      gainNode.gain.setTargetAtTime(0.28, now, 0.8);
    } else if (foleyKind === 'fire') {
      filter.type = 'lowpass';
      filter.frequency.setTargetAtTime(480, now, 0.8);
      filter.Q.setTargetAtTime(1.4, now, 0.8);
      gainNode.gain.setTargetAtTime(0.24, now, 0.8);
    } else if (foleyKind === 'wind') {
      filter.type = 'bandpass';
      filter.frequency.setTargetAtTime(520, now, 0.8);
      filter.Q.setTargetAtTime(2.8, now, 0.8);
      gainNode.gain.setTargetAtTime(0.26, now, 0.8);
    } else {
      // 'waves'
      filter.type = 'lowpass';
      filter.frequency.setTargetAtTime(280, now, 0.8);
      filter.Q.setTargetAtTime(1.1, now, 0.8);
      gainNode.gain.setTargetAtTime(0.22, now, 0.8);
    }
  }

  private triggerMicroFoleyParticle(kind: 'fire' | 'rain') {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      if (kind === 'rain') {
        // Delicate high-pitched water droplet ping
        const baseFreq = 1400 + Math.random() * 1200;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.045);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.035, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
      } else {
        // Warm hearth ember pop
        const baseFreq = 180 + Math.random() * 320;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.035);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.05, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.045);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Dynamically morphs harmonic chord tension & filter brightness as the reader scrolls
   * or moves through emotionally charged narrative passages.
   */
  public modulateEmotionalTension(
    activeText: string,
    scrollProgress = 0.5,
    enabled = true
  ) {
    const rawTension = computeEmotionalTensionFromText(activeText);
    this.currentTension = Math.max(
      0.05,
      Math.min(1.0, rawTension * 0.75 + scrollProgress * 0.25)
    );

    if (!this.isPlaying || !enabled || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      if (this.padFilter) {
        const targetCutoff = 280 + this.currentTension * 580;
        this.padFilter.frequency.setTargetAtTime(targetCutoff, now, 0.65);
      }
      // Subtle modal color voice swell on the 4th oscillator
      if (this.oscGains[3]) {
        const fourthVoiceGain = 0.04 + this.currentTension * 0.14;
        this.oscGains[3].gain.setTargetAtTime(fourthVoiceGain, now, 0.65);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Interactive Pointer Audio Ripples:
   * Touching or dragging across the canvas triggers stereo-panned water-harp harmonics.
   */
  public triggerPointerRipple(
    normX: number,
    normY: number,
    velocity = 0.5,
    theme: SceneTheme = 'primordial-waters',
    enabled = true
  ) {
    if (!enabled) return;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastRippleTimeMs < 135) return;
    this.lastRippleTimeMs = nowMs;

    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const baseFreqs =
        THEME_FREQUENCIES[theme] || THEME_FREQUENCIES['primordial-waters'];
      // Map vertical pointer position to octave/harmonic degree
      const scaleMultipliers = [1, 1.25, 1.5, 2, 2.5, 3, 4];
      const degIdx = Math.min(
        scaleMultipliers.length - 1,
        Math.max(0, Math.floor((1 - normY) * scaleMultipliers.length))
      );
      const freq =
        baseFreqs[degIdx % baseFreqs.length] *
        (degIdx >= 3 ? 2.0 : 1.0);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.006, now + 1.1);

      const amp = Math.min(0.036, 0.012 + velocity * 0.024);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(amp, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-0.8, Math.min(0.8, (normX - 0.5) * 1.6)), now);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start(now);
      osc.stop(now + 1.3);
    } catch {
      // Ignore
    }
  }

  /**
   * Subtle Binaural Liturgical Bells on Chapter Milestones:
   * Synthesizes a warm bronze sanctuary chime with a 4 Hz contemplative binaural beat offset.
   */
  public triggerLiturgicalBell(
    theme: SceneTheme = 'first-light',
    enabled = true
  ) {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = THEME_FREQUENCIES[theme] || THEME_FREQUENCIES['first-light'];
      const fundamental = freqs[0] * 2; // e.g., 220Hz - 330Hz warm bronze register
      const binauralOffsetHz = 4.0; // Contemplative 4Hz theta/alpha resonance

      const partials = [
        { ratio: 1.0, amp: 0.032, decay: 3.4, pan: -0.45, offset: 0 },
        { ratio: 1.0, amp: 0.032, decay: 3.4, pan: 0.45, offset: binauralOffsetHz },
        { ratio: 1.5, amp: 0.016, decay: 2.6, pan: -0.25, offset: 0 },
        { ratio: 2.0, amp: 0.012, decay: 2.1, pan: 0.25, offset: binauralOffsetHz * 0.5 },
        { ratio: 2.756, amp: 0.006, decay: 1.4, pan: 0, offset: 0 }, // Bronze bell shimmer partial
      ];

      partials.forEach((p) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * p.ratio + p.offset, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(p.amp, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

        if (typeof ctx.createStereoPanner === 'function' && p.pan !== 0) {
          const panner = ctx.createStereoPanner();
          panner.pan.setValueAtTime(p.pan, now);
          osc.connect(gain);
          gain.connect(panner);
          panner.connect(ctx.destination);
        } else {
          osc.connect(gain);
          gain.connect(ctx.destination);
        }

        osc.start(now);
        osc.stop(now + p.decay + 0.05);
      });
    } catch {
      // Ignore in headless browser
    }
  }

  /**
   * Plays a warm acoustic tuning note when inspecting a Hebrew or Greek root word in the Lexicon Lens.
   */
  public triggerLexiconPronunciationTone(freqHz = 293.66, enabled = true) {
    if (!enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [1, 1.5, 2].forEach((mult, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freqHz * mult, now + idx * 0.06);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(
          idx === 0 ? 0.028 : 0.014,
          now + idx * 0.06 + 0.05
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 1.55);
      });
    } catch {
      // Ignore
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
          const startFreq = idx === 0 ? f : f * (idx === 1 ? 0.985 : 1.015);
          const targetFreq = idx === 2 ? f * 2 : f;
          osc.frequency.setValueAtTime(startFreq, now);
          osc.frequency.exponentialRampToValueAtTime(
            targetFreq,
            now + durSec * 0.45
          );

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(
            idx === 0 ? 0.045 : 0.024,
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
    this.triggerLiturgicalBell(theme, enabled);
  }

  public updateTheme(
    theme: SceneTheme,
    enabled = true,
    motif?: ChapterVisualMotif
  ) {
    if (!this.isPlaying || !enabled || !this.ctx) return;
    const nextFoley = resolveFoleyLayerForChapter(theme, motif);
    if (nextFoley !== this.currentFoleyKind && this.foleyFilter && this.foleyGain) {
      this.currentFoleyKind = nextFoley;
      this.applyFoleyFilterSettings(
        this.ctx,
        this.foleyFilter,
        this.foleyGain,
        nextFoley
      );
    }

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
    this.stopFoleyLayer();
  }

  private stopFoleyLayer() {
    if (this.crackleTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.crackleTimer);
      this.crackleTimer = null;
    }
    if (this.foleySource) {
      try {
        this.foleySource.stop();
        this.foleySource.disconnect();
      } catch {
        // Ignore
      }
      this.foleySource = null;
    }
    if (this.foleyLfo) {
      try {
        this.foleyLfo.stop();
        this.foleyLfo.disconnect();
      } catch {
        // Ignore
      }
      this.foleyLfo = null;
    }
    this.foleyFilter = null;
    this.foleyGain = null;
    this.foleyLfoGain = null;
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
    this.oscGains = [];
    this.padFilter = null;
  }
}

export const ambientSound = new AmbientSoundEngine();
