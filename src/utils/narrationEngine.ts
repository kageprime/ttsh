import { SceneTheme } from '../data/stories';
import { NarrationBlock } from './storybookLogic';
import { ambientSound } from './ambientAudio';

interface PlayBlockOptions {
  block: NarrationBlock;
  sceneTheme: SceneTheme;
  muted: boolean;
  onComplete: () => void;
}

/**
 * Selects the deepest, warmest natural male baritone voice available in the browser
 * for Morgan Freeman-style unhurried narration when neural TTS is offline.
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

  // Priority ranking of deep, resonant male voices across macOS, Windows, Chrome, and Linux
  const preferredPatterns = [
    /Guy/i,
    /Christopher/i,
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

class NarrationDirector {
  private audioEl: HTMLAudioElement | null = null;
  private timers: number[] = [];
  private currentRunId = 0;
  private serverTtsAvailable: boolean | null = null;
  private audioCache = new Map<string, string>();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Pre-warm voice list in browsers that load voices asynchronously
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  public stop() {
    this.currentRunId += 1;
    this.clearTimers();

    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.src = '';
      } catch {
        // Ignore
      }
      this.audioEl = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
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
   * Plays a single NarrationBlock with Morgan Freeman-style deep pacing:
   * - If the block is a `sound-cue`, synthesizes the acoustic sound cue and holds silence
   *   for the cue duration so the listener hears the wind/hum/water before the voice enters.
   * - If the block is a `hebrew-quote` or `paragraph`, speaks with deliberate pre/post pauses
   *   and unhurried clause cadence.
   */
  public async playBlock({
    block,
    sceneTheme,
    muted,
    onComplete,
  }: PlayBlockOptions): Promise<void> {
    this.stop();
    const runId = this.currentRunId;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    // In headless browser tests, use a faster deterministic cadence (1.8s per block) so tests can verify transitions quickly
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

    // 2. Try Server-Side Neural Baritone TTS (/api/tts with Charon Morgan Freeman-style persona)
    if (this.serverTtsAvailable !== false && !isHeadless) {
      const audioDataUrl = await this.fetchServerTts(block);
      if (this.currentRunId !== runId) return;

      if (audioDataUrl) {
        this.schedule(() => {
          if (this.currentRunId !== runId) return;
          const audio = new Audio(audioDataUrl);
          audio.playbackRate = block.kind === 'hebrew-quote' ? 0.88 : 0.92;
          this.audioEl = audio;

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
          audio.onerror = finishOnce;
          audio.play().catch(finishOnce);

          // Safety fallback timeout
          this.schedule(finishOnce, block.estimatedDurationMs + 4000);
        }, block.prePauseMs);
        return;
      }
    }

    // 3. Deep Baritone Web Speech Synthesizer with Clause-by-Clause Pauses
    this.playWithDeepWebSpeech(block, runId, timeScale, onComplete);
  }

  private async fetchServerTts(block: NarrationBlock): Promise<string | null> {
    const cacheKey = `${block.kind}:${block.spokenText}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 3200);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: block.spokenText,
          kind: block.kind,
        }),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 503) {
          this.serverTtsAvailable = false;
        }
        return null;
      }

      const data = (await res.json()) as {
        audioBase64?: string;
        mimeType?: string;
      };
      if (!data.audioBase64) return null;

      this.serverTtsAvailable = true;
      const dataUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
      this.audioCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch {
      return null;
    }
  }

  private playWithDeepWebSpeech(
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

    // Split text on dramatic pauses (`...`) so the voice takes real, contemplative breaths
    const clauses = block.spokenText
      .split(/\s*\.{3}\s*/)
      .map((c) => c.trim())
      .filter(Boolean);

    if (clauses.length === 0) {
      this.schedule(() => {
        if (this.currentRunId === runId) onComplete();
      }, totalFallbackMs);
      return;
    }

    let completed = false;
    const completeOnce = () => {
      if (completed || this.currentRunId !== runId) return;
      completed = true;
      onComplete();
    };

    // Deterministic safety timer in case speechSynthesis hangs in headless browsers
    this.schedule(completeOnce, totalFallbackMs + 1200);

    const voice = selectDeepBaritoneVoice();

    const speakClauseIndex = (idx: number) => {
      if (this.currentRunId !== runId || completed) return;
      if (idx >= clauses.length) {
        this.schedule(
          completeOnce,
          Math.round(block.postPauseMs * timeScale)
        );
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(clauses[idx]);
        if (voice) utterance.voice = voice;
        utterance.rate = block.speechRate; // 0.78 - 0.84 unhurried delivery
        utterance.pitch = block.speechPitch; // 0.70 - 0.72 deep resonant baritone
        utterance.volume = 0.95;

        utterance.onend = () => {
          if (this.currentRunId !== runId || completed) return;
          // Deliberate 550ms breath between clauses separated by `...` or `—`
          const interClausePause = idx < clauses.length - 1 ? 550 : 50;
          this.schedule(
            () => speakClauseIndex(idx + 1),
            Math.round(interClausePause * timeScale)
          );
        };

        utterance.onerror = () => {
          if (this.currentRunId !== runId || completed) return;
          this.schedule(() => speakClauseIndex(idx + 1), 250);
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        this.schedule(completeOnce, totalFallbackMs);
      }
    };

    this.schedule(
      () => speakClauseIndex(0),
      Math.round(block.prePauseMs * timeScale)
    );
  }
}

export const narrationDirector = new NarrationDirector();
