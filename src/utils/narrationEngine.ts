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
  private timers: number[] = [];
  private currentRunId = 0;
  private prefetchGeneration = 0;
  private audioCache = new Map<string, CachedAudioPayload>();
  private inflightRequests = new Map<
    string,
    Promise<CachedAudioPayload | null>
  >();

  /**
   * Unlocks the persistent Web Audio API AudioContext and HTMLAudioElement on user click
   * so that AI neural audio playback across all chapters (Chapter 1 -> 2 -> 3 ... -> 12) is never
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
  }

  /**
   * Sequentially pre-fetches AI neural TTS audio for upcoming chapter blocks in the background
   * so that when playback advances from block to block and chapter to chapter, the AI
   * neural baritone voice plays immediately with zero latency.
   */
  public prefetchChapterBlocks(blocks: readonly NarrationBlock[]): void {
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    if (isHeadless) return;

    this.prefetchGeneration += 1;
    const generation = this.prefetchGeneration;

    const spokenBlocks = blocks.filter(
      (b) => b.kind !== 'sound-cue' && b.spokenText.trim().length > 0
    );

    void (async () => {
      for (const block of spokenBlocks) {
        if (this.prefetchGeneration !== generation) return;
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
   * Plays a single NarrationBlock using strictly the AI neural baritone voice across all chapters:
   * - If the block is a `sound-cue`, synthesizes the acoustic sound cue and holds silence
   *   for the cue duration so the listener hears the wind/hum/water before the voice enters.
   * - If the block is a `hebrew-quote` or `paragraph`, decodes and plays the AI neural baritone
   *   audio via the unlocked Web Audio API AudioContext so every block uses the exact same AI voice
   *   and never falls back to browser robotic speechSynthesis.
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

    if (muted || isHeadless) {
      this.schedule(() => {
        if (this.currentRunId === runId) {
          onComplete();
        }
      }, Math.max(1100, Math.round(block.estimatedDurationMs * timeScale)));
      return;
    }

    // 2. Exclusive AI Neural Baritone TTS (/api/tts) across all blocks and chapters
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

    // If audio output device is unavailable or unreachable after retries, advance silently
    // after reading pause—never invoke default robotic browser TTS.
    this.schedule(() => {
      if (this.currentRunId === runId) {
        onComplete();
      }
    }, Math.max(1100, Math.round(block.estimatedDurationMs * timeScale)));
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
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, attempt * 250));
          }
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 15000);
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
          // Retry with backoff
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
}

export const narrationDirector = new NarrationDirector();
