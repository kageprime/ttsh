export interface AudioFrequencyMetrics {
  subBass: number;
  mid: number;
  treble: number;
  voiceEnvelope: number;
}

class AudioAnalyzerBus {
  private soundscapeAnalyser: AnalyserNode | null = null;
  private soundscapeBins: Uint8Array<ArrayBuffer> | null = null;
  private voiceAnalyser: AnalyserNode | null = null;
  private voiceBins: Uint8Array<ArrayBuffer> | null = null;

  private syntheticSubBass = 0;
  private syntheticMid = 0;
  private syntheticTreble = 0;
  private syntheticVoice = 0;
  private isVoiceSpeaking = false;

  private smoothed: AudioFrequencyMetrics = {
    subBass: 0,
    mid: 0,
    treble: 0,
    voiceEnvelope: 0,
  };

  public attachSoundscapeNode(ctx: AudioContext, sourceNode: AudioNode): void {
    try {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      sourceNode.connect(analyser);
      this.soundscapeAnalyser = analyser;
      this.soundscapeBins = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      // Ignore analyser attachment failures in headless/restricted environments
    }
  }

  public attachVoiceNode(ctx: AudioContext, sourceNode: AudioNode): void {
    try {
      if (
        !this.voiceAnalyser ||
        this.voiceAnalyser.context !== (ctx as BaseAudioContext)
      ) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        this.voiceAnalyser = analyser;
        this.voiceBins = new Uint8Array(analyser.frequencyBinCount);
      }
      sourceNode.connect(this.voiceAnalyser);
    } catch {
      // Ignore
    }
  }

  public setVoiceActive(active: boolean): void {
    this.isVoiceSpeaking = active;
  }

  public pulseImpulse(
    subBassBoost = 0.35,
    midBoost = 0.45,
    trebleBoost = 0.4
  ): void {
    this.syntheticSubBass = Math.min(1, this.syntheticSubBass + subBassBoost);
    this.syntheticMid = Math.min(1, this.syntheticMid + midBoost);
    this.syntheticTreble = Math.min(1, this.syntheticTreble + trebleBoost);
  }

  public sampleMetrics(elapsedSec = 0): AudioFrequencyMetrics {
    let rawBass = 0;
    let rawMid = 0;
    let rawTreble = 0;
    let rawVoice = 0;

    if (this.soundscapeAnalyser && this.soundscapeBins) {
      try {
        this.soundscapeAnalyser.getByteFrequencyData(this.soundscapeBins);
        const bins = this.soundscapeBins;
        // Bins 0..5: Sub-bass & low drone
        let bSum = 0;
        for (let i = 0; i < 6; i++) bSum += bins[i] || 0;
        rawBass = bSum / (6 * 255);

        // Bins 6..20: Mid harmonic pads
        let mSum = 0;
        for (let i = 6; i < 21; i++) mSum += bins[i] || 0;
        rawMid = mSum / (15 * 255);

        // Bins 21..48: Treble & shimmer
        let tSum = 0;
        for (let i = 21; i < 48; i++) tSum += bins[i] || 0;
        rawTreble = tSum / (27 * 255);
      } catch {
        // Fallback
      }
    }

    if (this.voiceAnalyser && this.voiceBins && this.isVoiceSpeaking) {
      try {
        this.voiceAnalyser.getByteFrequencyData(this.voiceBins);
        let vSum = 0;
        for (let i = 2; i < 24; i++) vSum += this.voiceBins[i] || 0;
        rawVoice = Math.min(1, (vSum / (22 * 255)) * 1.65);
      } catch {
        // Fallback
      }
    } else if (this.isVoiceSpeaking) {
      // Syllabic baritone cadence modulation if HTMLAudioElement fallback is used
      rawVoice =
        0.38 +
        0.28 * Math.sin(elapsedSec * 6.8) +
        0.18 * Math.cos(elapsedSec * 11.3);
    }

    // Decay synthetic impulses
    this.syntheticSubBass *= 0.92;
    this.syntheticMid *= 0.92;
    this.syntheticTreble *= 0.9;
    this.syntheticVoice *= 0.9;

    const targetBass = Math.min(1, Math.max(rawBass, this.syntheticSubBass));
    const targetMid = Math.min(1, Math.max(rawMid, this.syntheticMid));
    const targetTreble = Math.min(1, Math.max(rawTreble, this.syntheticTreble));
    const targetVoice = Math.min(1, Math.max(rawVoice, this.syntheticVoice));

    this.smoothed.subBass += (targetBass - this.smoothed.subBass) * 0.22;
    this.smoothed.mid += (targetMid - this.smoothed.mid) * 0.22;
    this.smoothed.treble += (targetTreble - this.smoothed.treble) * 0.25;
    this.smoothed.voiceEnvelope +=
      (targetVoice - this.smoothed.voiceEnvelope) * 0.28;

    return this.smoothed;
  }
}

export const audioAnalyzerBus = new AudioAnalyzerBus();
