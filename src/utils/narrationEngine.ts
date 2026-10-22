import { SceneTheme } from '../data/stories';
import { NarrationBlock } from './storybookLogic';
import { ambientSound } from './ambientAudio';

interface PlayBlockOptions {
  block: NarrationBlock;
  sceneTheme: SceneTheme;
  muted: boolean;
  onComplete: () => void;
}

interface CachedAudioPayload {
  bytes: Uint8Array;
  dataUrl: string;
}

/**
 * Selects a single deep, natural male baritone voice available in the browser
 * when offline, locking onto that exact voice so the speaker never changes.
 */
function selectDeepBaritoneVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const englishVoices = voices.filter((v) =>
    /^en(-|_|$)/i.test(v.lang || '')
  );
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  const preferredPatterns = [
    /Christopher/i,
    /Guy/i,
    /Eric/i,
    /Roger/i,
    /Steffan/i,
    /Google UK English Male/i,
    /Google US English/i,
    /Aaron/i,
    /Arthur/i,
    /Daniel/i,
    /Alex/i,
    /Fred/i,
    /David/i,
    /Mark/i,
    /Matthew/i,
    /Male/i,
  ];

  for (const pattern of preferredPatterns) {
    const match = pool.find((v) => pattern.test(v.name));
    if (match) return match;
  }

  return pool[0] || null;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

class NarrationDirector {
  private audioCtx: AudioContext | null = null;
  private activeSourceNode: AudioBufferSourceNode | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private timers: number[] = [];
  private currentRunId = 0;
  private lockedWebVoice: SpeechSynthesisVoice | null = null;
  private audioCache = new Map<string, CachedAudioPayload>();
  private inflightRequests = new Map<string, Promise<CachedAudioPayload | null>>();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.lockedWebVoice = selectDeepBaritoneVoice();
      window.speechSynthesis.onvoiceschanged = () => {
        if (!this.lockedWebVoice) {
          this.lockedWebVoice = selectDeepBaritoneVoice();
        }
      };
    }
  }

  /**
   * Unlocks the persistent Web Audio API AudioContext and HTMLAudioElement on user click
   * so that audio playback across all chapters (Chapter 1 -> 2 -> 3 ... -> 12) is never
   * blocked by browser autoplay restrictions after async fetches or sound-cue pauses.
   */
  public unlockAudio(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass && !this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }
      if (!this.audioEl && typeof Audio !== 'undefined') {
        this.audioEl = new Audio();
      }
    } catch {
      // Ignore audio context init errors
    }
  }

  public stop() {
    this.currentRunId += 1;
    this.clearTimers();

    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.onended = null;
        this.activeSourceNode.stop();
        this.activeSourceNode.disconnect();
      } catch {
        // Ignore
      }
      this.activeSourceNode = null;
    }

    if (this.audioEl) {
      try {
        this.audioEl.onended = null;
        this.audioEl.onerror = null;
        this.audioEl.pause();
      } catch {
        // Ignore
      }
    }

    this.activeUtterance = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Sequentially pre-fetches neural TTS audio for upcoming chapter blocks in the background
   * so that when playback advances from block to block and chapter to chapter, the single
   * neural baritone voice plays immediately with zero latency.
   */
  public prefetchChapterBlocks(blocks: readonly NarrationBlock[]): void {
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    if (isHeadless) return;

    const spokenBlocks = blocks.filter(
      (b) => b.kind !== 'sound-cue' && b.spokenText.trim().length > 0
    );

    void (async () => {
      for (const block of spokenBlocks) {
        await this.fetchServerTts(block);
      }
    })();
  }

  private clearTimers() {
    for (const id of this.timers) {
      window.clearTimeout(id);
    }
    this.timers = [];
  }

  private schedule(fn: () => void, delayMs: number): number {
    const id = window.setTimeout(fn, delayMs);
    this.timers.push(id);
    return id;
  }

  /**
   * Plays a single NarrationBlock using strictly ONE consistent speaker across all chapters:
   * - If the block is a `sound-cue`, synthesizes the acoustic sound cue and holds silence
   *   for the cue duration so the listener hears the wind/hum/water before the voice enters.
   * - If the block is a `hebrew-quote` or `paragraph`, decodes and plays the neural baritone
   *   audio via the unlocked Web Audio API AudioContext so every chapter in the episode plays
   *   reliably and auto-scrolls only after the voice finishes speaking.
   */
  public async playBlock({
    block,
    sceneTheme,
    muted,
    onComplete,
  }: PlayBlockOptions): Promise<void> {
    this.stop();
    this.unlockAudio();
    const runId = this.currentRunId;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const timeScale = isHeadless ? 0.35 : 1.0;

    // 1. Pure Atmospheric Sound Cue Block
    if (block.kind === 'sound-cue' || !block.spokenText.trim()) {
      if (!muted) {
        ambientSound.playSoundCueEffect(
          block.displayText,
          sceneTheme,
          block.estimatedDurationMs,
          true
        );
      }
      this.schedule(() => {
        if (this.currentRunId === runId) {
          onComplete();
        }
      }, Math.max(900, Math.round(block.estimatedDurationMs * timeScale)));
      return;
    }

    if (muted) {
      this.schedule(() => {
        if (this.currentRunId === runId) {
          onComplete();
        }
      }, Math.max(1100, Math.round(block.estimatedDurationMs * timeScale)));
      return;
    }

    // 2. Single-Speaker Neural Baritone TTS (/api/tts) across all chapters
    if (!isHeadless) {
      const payload = await this.fetchServerTts(block);
      if (this.currentRunId !== runId) return;

      if (payload) {
        const playedViaWebAudio = await this.playViaWebAudio(
          payload,
          block,
          runId,
          onComplete
        );
        if (playedViaWebAudio || this.currentRunId !== runId) {
          return;
        }

        const playedViaElement = await this.playViaAudioElement(
          payload.dataUrl,
          block,
          runId,
          onComplete
        );
        if (playedViaElement || this.currentRunId !== runId) {
          return;
        }
      }
    }

    // 3. Offline / Headless Fallback: Single Locked Web Speech Synthesizer
    this.playWithSingleLockedWebSpeech(block, runId, timeScale, onComplete);
  }

  private async playViaWebAudio(
    payload: CachedAudioPayload,
    block: NarrationBlock,
    runId: number,
    onComplete: () => void
  ): Promise<boolean> {
    if (!this.audioCtx) return false;
    try {
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      // Copy buffer because decodeAudioData detaches the ArrayBuffer
      const bufferCopy = payload.bytes.buffer.slice(
        payload.bytes.byteOffset,
        payload.bytes.byteOffset + payload.bytes.byteLength
      ) as ArrayBuffer;

      const audioBuffer = await this.audioCtx.decodeAudioData(bufferCopy);
      if (this.currentRunId !== runId) return true;

      return await new Promise<boolean>((resolve) => {
        this.schedule(() => {
          if (this.currentRunId !== runId || !this.audioCtx) {
            resolve(true);
            return;
          }
          try {
            const source = this.audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            // Edge neural baritone is already synthesized at a brisk +6% rate; play at 1.04x for crisp clarity
            const rate = 1.04;
            source.playbackRate.value = rate;
            source.connect(this.audioCtx.destination);
            this.activeSourceNode = source;

            const exactDurationMs = Math.ceil(
              (audioBuffer.duration / rate) * 1000
            );

            let finished = false;
            const finishOnce = () => {
              if (finished || this.currentRunId !== runId) return;
              finished = true;
              this.activeSourceNode = null;
              this.schedule(() => {
                if (this.currentRunId === runId) {
                  onComplete();
                }
              }, block.postPauseMs);
            };

            source.onended = finishOnce;
            source.start(0);
            resolve(true);

            // Safety fallback based on exact decoded audio duration
            this.schedule(finishOnce, exactDurationMs + 1500);
          } catch {
            resolve(false);
          }
        }, block.prePauseMs);
      });
    } catch {
      return false;
    }
  }

  private async playViaAudioElement(
    dataUrl: string,
    block: NarrationBlock,
    runId: number,
    onComplete: () => void
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.schedule(() => {
        if (this.currentRunId !== runId) {
          resolve(true);
          return;
        }
        try {
          const audio = this.audioEl || new Audio();
          this.audioEl = audio;
          audio.src = dataUrl;
          audio.playbackRate = 1.04;
          audio.preservesPitch = true;

          let finished = false;
          const finishOnce = () => {
            if (finished || this.currentRunId !== runId) return;
            finished = true;
            this.schedule(() => {
              if (this.currentRunId === runId) {
                onComplete();
              }
            }, block.postPauseMs);
          };

          audio.onended = finishOnce;
          audio.onerror = () => resolve(false);

          audio
            .play()
            .then(() => {
              resolve(true);
              const durMs =
                Number.isFinite(audio.duration) && audio.duration > 0
                  ? Math.ceil((audio.duration / 1.04) * 1000)
                  : block.estimatedDurationMs;
              this.schedule(finishOnce, durMs + 2500);
            })
            .catch(() => {
              resolve(false);
            });
        } catch {
          resolve(false);
        }
      }, block.prePauseMs);
    });
  }

  private async fetchServerTts(
    block: NarrationBlock
  ): Promise<CachedAudioPayload | null> {
    const textKey = block.spokenText.trim();
    if (!textKey) return null;

    if (this.audioCache.has(textKey)) {
      return this.audioCache.get(textKey)!;
    }

    if (this.inflightRequests.has(textKey)) {
      return this.inflightRequests.get(textKey)!;
    }

    const requestPromise = (async (): Promise<CachedAudioPayload | null> => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 12000);
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: textKey,
            }),
            signal: controller.signal,
          });
          window.clearTimeout(timeout);

          if (!res.ok) {
            continue;
          }

          const data = (await res.json()) as {
            audioBase64?: string;
            mimeType?: string;
          };
          if (!data.audioBase64) continue;

          const mime = data.mimeType || 'audio/mpeg';
          const payload: CachedAudioPayload = {
            bytes: base64ToBytes(data.audioBase64),
            dataUrl: `data:${mime};base64,${data.audioBase64}`,
          };
          this.audioCache.set(textKey, payload);
          return payload;
        } catch {
          // Retry once
        }
      }
      return null;
    })();

    this.inflightRequests.set(textKey, requestPromise);
    try {
      return await requestPromise;
    } finally {
      this.inflightRequests.delete(textKey);
    }
  }

  private playWithSingleLockedWebSpeech(
    block: NarrationBlock,
    runId: number,
    timeScale: number,
    onComplete: () => void
  ) {
    const hasSpeech =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined';

    const totalFallbackMs = Math.max(
      1100,
      Math.round(block.estimatedDurationMs * timeScale)
    );

    if (!hasSpeech) {
      this.schedule(() => {
        if (this.currentRunId === runId) onComplete();
      }, totalFallbackMs);
      return;
    }

    if (!this.lockedWebVoice) {
      this.lockedWebVoice = selectDeepBaritoneVoice();
    }

    let completed = false;
    const completeOnce = () => {
      if (completed || this.currentRunId !== runId) return;
      completed = true;
      this.activeUtterance = null;
      onComplete();
    };

    // Deterministic safety timer in case speechSynthesis hangs in headless browsers
    this.schedule(completeOnce, totalFallbackMs + 1500);

    this.schedule(() => {
      if (this.currentRunId !== runId || completed) return;
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        const utterance = new SpeechSynthesisUtterance(block.spokenText);
        // Keep strong reference so V8 GC never collects the utterance mid-speech
        this.activeUtterance = utterance;
        if (this.lockedWebVoice) {
          utterance.voice = this.lockedWebVoice;
        }
        utterance.rate = block.speechRate;
        utterance.pitch = block.speechPitch;
        utterance.volume = 0.95;

        utterance.onend = () => {
          if (this.currentRunId !== runId || completed) return;
          this.schedule(
            completeOnce,
            Math.round(block.postPauseMs * timeScale)
          );
        };

        utterance.onerror = () => {
          if (this.currentRunId !== runId || completed) return;
          this.schedule(completeOnce, 250);
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        this.schedule(completeOnce, totalFallbackMs);
      }
    }, Math.round(block.prePauseMs * timeScale));
  }
}

export const narrationDirector = new NarrationDirector();
