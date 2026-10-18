export type CanvasSimulationMode =
  | 'void-ripples'
  | 'ruach-wind'
  | 'yehi-or-dawn'
  | 'sky-vault'
  | 'tectonic-sea'
  | 'emerald-spores'
  | 'star-constellations'
  | 'living-shoals'
  | 'meadow-fireflies'
  | 'sacred-dust'
  | 'symphony-aurora'
  | 'sabbath-breath';

export interface ReaderSettings {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  fontFamily: 'serif' | 'sans';
  lineSpacing: 'normal' | 'relaxed' | 'loose';
  highContrast: boolean;
  ambientAudioEnabled: boolean;
  autoAdvance: boolean;
}

export const DEFAULT_READER_SETTINGS = {
  fontSize: 'md',
  fontFamily: 'serif',
  lineSpacing: 'relaxed',
  highContrast: false,
  ambientAudioEnabled: true,
  autoAdvance: true,
} as const satisfies ReaderSettings;

export type StudyDrawerKind = 'none' | 'reflect' | 'scripture' | 'lexicon';

/**
 * Discriminated union modeling the reader's visual stage state.
 * Quiet Read ('scroll') is the default mode so text flows and auto-scrolls seamlessly during narration.
 */
export type ReaderStageState =
  | { readonly kind: 'scroll'; readonly activeDrawer?: StudyDrawerKind }
  | { readonly kind: 'slides'; readonly activeDrawer: StudyDrawerKind }
  | { readonly kind: 'behold' };

export type ReaderStageEvent =
  | { readonly type: 'SET_MODE'; readonly mode: 'slides' | 'scroll' }
  | { readonly type: 'TOGGLE_BEHOLD' }
  | { readonly type: 'TOGGLE_DRAWER'; readonly drawer: Exclude<StudyDrawerKind, 'none'> }
  | { readonly type: 'RESET_FOR_CHAPTER' };

export const INITIAL_READER_STAGE_STATE: ReaderStageState = {
  kind: 'scroll',
  activeDrawer: 'none',
};

export function transitionReaderStage(
  state: ReaderStageState,
  event: ReaderStageEvent
): ReaderStageState {
  switch (event.type) {
    case 'SET_MODE':
      if (event.mode === 'scroll') {
        return { kind: 'scroll', activeDrawer: 'none' };
      }
      return { kind: 'slides', activeDrawer: 'none' };

    case 'TOGGLE_BEHOLD':
      if (state.kind === 'behold') {
        return { kind: 'scroll', activeDrawer: 'none' };
      }
      return { kind: 'behold' };

    case 'TOGGLE_DRAWER': {
      const currentDrawer =
        state.kind === 'behold' ? 'none' : state.activeDrawer ?? 'none';
      const nextDrawer = currentDrawer === event.drawer ? 'none' : event.drawer;
      if (state.kind === 'scroll') {
        return { kind: 'scroll', activeDrawer: nextDrawer };
      }
      return {
        kind: 'slides',
        activeDrawer: nextDrawer,
      };
    }

    case 'RESET_FOR_CHAPTER':
      if (state.kind === 'scroll') {
        return { kind: 'scroll', activeDrawer: 'none' };
      }
      return { kind: 'slides', activeDrawer: 'none' };
  }
}

export interface FilterableEpisode {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  bookRef: string;
  category: string;
}

export interface NarrativeSegment {
  text: string;
  isTrigger: boolean;
  sentenceIndex: number;
}

export interface EpisodeChapterCount {
  readonly id: string;
  readonly series: string;
  readonly chapters: readonly { readonly number: number }[];
}

export interface ReadingCompletionStats {
  readonly episodeCompletedCount: number;
  readonly episodeTotalCount: number;
  readonly episodePercent: number;
  readonly collectionCompletedCount: number;
  readonly collectionTotalCount: number;
  readonly collectionPercent: number;
}

export function clampChapterIndex(targetIndex: number, totalChapters: number): number {
  if (totalChapters <= 0) return 0;
  if (targetIndex < 0) return 0;
  if (targetIndex >= totalChapters) return totalChapters - 1;
  return targetIndex;
}

export function getNextChapterIndex(currentIndex: number, totalChapters: number): number | null {
  if (currentIndex + 1 < totalChapters) {
    return currentIndex + 1;
  }
  return null;
}

export function getPrevChapterIndex(currentIndex: number): number | null {
  if (currentIndex > 0) {
    return currentIndex - 1;
  }
  return null;
}

export function calculateProgressPercent(currentIndex: number, totalChapters: number): number {
  if (totalChapters <= 0) return 0;
  const boundedIndex = clampChapterIndex(currentIndex, totalChapters);
  return Math.round(((boundedIndex + 1) / totalChapters) * 100);
}

/**
 * Computes completion percentage for both the active book/episode and the entire collection.
 */
export function calculateReadingCompletionStats(
  episodes: readonly EpisodeChapterCount[],
  currentEpisodeId: string,
  activeChapterNumber: number,
  completedChaptersByEpisode: Readonly<Record<string, readonly number[]>>
): ReadingCompletionStats {
  let episodeCompletedCount = 0;
  let episodeTotalCount = 0;
  let collectionCompletedCount = 0;
  let collectionTotalCount = 0;

  for (const ep of episodes) {
    const validNumbers = new Set(ep.chapters.map((c) => c.number));
    const recorded = completedChaptersByEpisode[ep.id] ?? [];
    const uniqueCompleted = new Set<number>();

    for (const num of recorded) {
      if (validNumbers.has(num)) {
        uniqueCompleted.add(num);
      }
    }

    if (ep.id === currentEpisodeId && validNumbers.has(activeChapterNumber)) {
      uniqueCompleted.add(activeChapterNumber);
    }

    const epTotal = ep.chapters.length;
    const epDone = uniqueCompleted.size;

    collectionTotalCount += epTotal;
    collectionCompletedCount += epDone;

    if (ep.id === currentEpisodeId) {
      episodeTotalCount = epTotal;
      episodeCompletedCount = epDone;
    }
  }

  const episodePercent =
    episodeTotalCount > 0
      ? Math.min(100, Math.round((episodeCompletedCount / episodeTotalCount) * 100))
      : 0;

  const collectionPercent =
    collectionTotalCount > 0
      ? Math.min(100, Math.round((collectionCompletedCount / collectionTotalCount) * 100))
      : 0;

  return {
    episodeCompletedCount,
    episodeTotalCount,
    episodePercent,
    collectionCompletedCount,
    collectionTotalCount,
    collectionPercent,
  };
}

export function formatChapterNumber(num: number): string {
  if (num < 10) return `0${num}`;
  return `${num}`;
}

export function formatTimecode(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function filterEpisodes<T extends FilterableEpisode>(
  episodes: readonly T[],
  category: string,
  searchQuery: string
): T[] {
  const normalizedCategory = category.trim().toLowerCase();
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return episodes.filter((ep) => {
    const matchesCategory =
      normalizedCategory === 'all' ||
      normalizedCategory === '' ||
      ep.category.toLowerCase() === normalizedCategory;

    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    return (
      ep.title.toLowerCase().includes(normalizedQuery) ||
      ep.subtitle.toLowerCase().includes(normalizedQuery) ||
      ep.summary.toLowerCase().includes(normalizedQuery) ||
      ep.bookRef.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function getNextEpisode<T extends { id: string }>(
  episodes: readonly T[],
  currentEpisodeId: string
): T | null {
  const idx = episodes.findIndex((e) => e.id === currentEpisodeId);
  if (idx === -1) return null;
  if (idx + 1 < episodes.length) {
    return episodes[idx + 1];
  }
  return episodes[0] || null;
}

const PROSE_SIZE_MAP = {
  sm: 'text-lg sm:text-xl md:text-2xl',
  md: 'text-xl sm:text-2xl md:text-[28px]',
  lg: 'text-2xl sm:text-3xl md:text-[32px]',
  xl: 'text-3xl sm:text-4xl md:text-[38px]',
} as const satisfies Record<ReaderSettings['fontSize'], string>;

const PROSE_LEADING_MAP = {
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
} as const satisfies Record<ReaderSettings['lineSpacing'], string>;

export function getReaderProseClasses(settings: ReaderSettings): string {
  const fontClass = settings.fontFamily === 'sans' ? 'font-sans-ui' : 'font-serif-editorial';
  const contrastClass = settings.highContrast ? 'text-white font-medium' : 'text-[#F4EFE6]';

  return `${fontClass} ${PROSE_SIZE_MAP[settings.fontSize]} ${PROSE_LEADING_MAP[settings.lineSpacing]} ${contrastClass}`;
}

export function splitNarrativeWithTrigger(
  narrative: string,
  triggerPhrase: string
): NarrativeSegment[] {
  if (!triggerPhrase || !narrative.includes(triggerPhrase)) {
    return [{ text: narrative, isTrigger: false, sentenceIndex: 0 }];
  }

  const idx = narrative.indexOf(triggerPhrase);
  const before = narrative.slice(0, idx);
  const after = narrative.slice(idx + triggerPhrase.length);

  const segments: NarrativeSegment[] = [];
  let sIdx = 0;

  if (before) {
    segments.push({ text: before, isTrigger: false, sentenceIndex: sIdx++ });
  }
  segments.push({ text: triggerPhrase, isTrigger: true, sentenceIndex: sIdx++ });
  if (after) {
    segments.push({ text: after, isTrigger: false, sentenceIndex: sIdx++ });
  }

  return segments;
}

export interface InteractiveSentencePart {
  text: string;
  isTrigger: boolean;
}

export interface InteractiveSentence {
  index: number;
  parts: InteractiveSentencePart[];
  hasTrigger: boolean;
}

export function splitNarrativeIntoSentences(
  narrative: string,
  triggerPhrase: string
): InteractiveSentence[] {
  const rawSentences = narrative
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawSentences.length === 0) {
    return [{ index: 0, parts: [{ text: narrative, isTrigger: false }], hasTrigger: false }];
  }

  return rawSentences.map((sentence, index) => {
    if (triggerPhrase && sentence.includes(triggerPhrase)) {
      const idx = sentence.indexOf(triggerPhrase);
      const before = sentence.slice(0, idx);
      const after = sentence.slice(idx + triggerPhrase.length);
      const parts: InteractiveSentencePart[] = [];
      if (before) parts.push({ text: before, isTrigger: false });
      parts.push({ text: triggerPhrase, isTrigger: true });
      if (after) parts.push({ text: after, isTrigger: false });
      return { index, parts, hasTrigger: true };
    }
    return {
      index,
      parts: [{ text: sentence, isTrigger: false }],
      hasTrigger: false,
    };
  });
}

export function getActiveSentenceIndex(
  elapsedSec: number,
  durationSec: number,
  sentenceCount: number
): number {
  if (sentenceCount <= 1 || durationSec <= 0) return 0;
  const ratio = Math.max(0, Math.min(0.999, elapsedSec / durationSec));
  return Math.floor(ratio * sentenceCount);
}

export interface CanvasPalette {
  readonly primaryRgb: string;
  readonly secondaryRgb: string;
  readonly glowHex: string;
}

export const CANVAS_PALETTE_MAP = {
  'yehi-or-dawn': {
    primaryRgb: '245, 194, 107',
    secondaryRgb: '254, 243, 199',
    glowHex: '#F5C26B',
  },
  'sabbath-breath': {
    primaryRgb: '245, 194, 107',
    secondaryRgb: '254, 243, 199',
    glowHex: '#F5C26B',
  },
  'emerald-spores': {
    primaryRgb: '110, 231, 183',
    secondaryRgb: '212, 168, 83',
    glowHex: '#6EE7B7',
  },
  'meadow-fireflies': {
    primaryRgb: '110, 231, 183',
    secondaryRgb: '212, 168, 83',
    glowHex: '#6EE7B7',
  },
  'star-constellations': {
    primaryRgb: '253, 230, 138',
    secondaryRgb: '165, 180, 252',
    glowHex: '#FDE68A',
  },
  'symphony-aurora': {
    primaryRgb: '253, 230, 138',
    secondaryRgb: '165, 180, 252',
    glowHex: '#FDE68A',
  },
  'sacred-dust': {
    primaryRgb: '217, 155, 102',
    secondaryRgb: '245, 208, 138',
    glowHex: '#D99B66',
  },
  'living-shoals': {
    primaryRgb: '125, 211, 252',
    secondaryRgb: '226, 232, 240',
    glowHex: '#7DD3FC',
  },
  'sky-vault': {
    primaryRgb: '125, 211, 252',
    secondaryRgb: '226, 232, 240',
    glowHex: '#7DD3FC',
  },
  'tectonic-sea': {
    primaryRgb: '125, 211, 252',
    secondaryRgb: '226, 232, 240',
    glowHex: '#7DD3FC',
  },
  'void-ripples': {
    primaryRgb: '203, 213, 225',
    secondaryRgb: '212, 168, 83',
    glowHex: '#CBD5E1',
  },
  'ruach-wind': {
    primaryRgb: '203, 213, 225',
    secondaryRgb: '212, 168, 83',
    glowHex: '#CBD5E1',
  },
} as const satisfies Record<CanvasSimulationMode, CanvasPalette>;

export function getCanvasPalette(mode: CanvasSimulationMode): CanvasPalette {
  return CANVAS_PALETTE_MAP[mode];
}

// ============================================================================
// TEXT-DRIVEN SEAMLESS WEBGL SHADER STATE & INTERPOLATION
// ============================================================================

export interface ShaderSceneWeights {
  readonly ocean: number;
  readonly dawn: number;
  readonly forest: number;
  readonly cosmos: number;
}

export interface TextDrivenShaderState {
  readonly weights: ShaderSceneWeights;
  readonly windIntensity: number;
  readonly lightBloom: number;
  readonly waterParting: number;
  readonly subMode: number;
}

export function normalizeSceneWeights(w: ShaderSceneWeights): ShaderSceneWeights {
  const o = Math.max(0, w.ocean);
  const d = Math.max(0, w.dawn);
  const f = Math.max(0, w.forest);
  const c = Math.max(0, w.cosmos);
  const sum = o + d + f + c;
  if (sum <= 0.0001) {
    return { ocean: 1, dawn: 0, forest: 0, cosmos: 0 };
  }
  return {
    ocean: o / sum,
    dawn: d / sum,
    forest: f / sum,
    cosmos: c / sum,
  };
}

/**
 * Pure function that ties the real-time WebGL shader parameters directly to both
 * the chapter theme/mode AND the live narrative text or sound cue being read/spoken.
 */
export function computeTextDrivenShaderTargets(
  theme: string,
  canvasMode?: CanvasSimulationMode,
  activeText = '',
  isSoundCueActive = false
): TextDrivenShaderState {
  let ocean = 0.0;
  let dawn = 0.0;
  let forest = 0.0;
  let cosmos = 0.0;

  let windIntensity = 0.25;
  let lightBloom = 0.2;
  let waterParting = 0.0;
  let subMode = 0.0;

  // 1. Base scene weights from chapter theme / simulation mode
  if (
    theme === 'hero-waterfall' ||
    theme === 'ancient-forest' ||
    theme === 'eden-mist' ||
    canvasMode === 'emerald-spores' ||
    canvasMode === 'meadow-fireflies'
  ) {
    forest = 1.0;
    lightBloom = 0.35;
  } else if (
    theme === 'first-light' ||
    theme === 'sabbath-stillness' ||
    canvasMode === 'yehi-or-dawn' ||
    canvasMode === 'sabbath-breath'
  ) {
    dawn = 0.85;
    ocean = 0.15;
    lightBloom = 0.78;
  } else if (
    theme === 'celestial-spheres' ||
    theme === 'desert-stars' ||
    canvasMode === 'star-constellations' ||
    canvasMode === 'symphony-aurora'
  ) {
    cosmos = 0.9;
    ocean = 0.1;
    lightBloom = 0.45;
  } else if (theme === 'sacred-breath' || canvasMode === 'sacred-dust') {
    dawn = 0.65;
    cosmos = 0.35;
    lightBloom = 0.55;
    subMode = 1.0;
  } else if (theme === 'parted-sky' || canvasMode === 'sky-vault') {
    ocean = 0.72;
    dawn = 0.28;
    waterParting = 0.75;
    windIntensity = 0.55;
  } else {
    // Primordial waters, living waters, deluge ark, tectonic sea
    ocean = 1.0;
    if (canvasMode === 'ruach-wind') {
      windIntensity = 0.85;
      subMode = 1.0;
    } else if (theme === 'living-waters' || canvasMode === 'living-shoals') {
      subMode = 2.0;
      lightBloom = 0.4;
    }
  }

  // 2. Semantic modulation from the live narrative text or active sound cue
  const lower = activeText.toLowerCase();
  if (lower.length > 0) {
    if (
      /\b(water|waters|deep|tehom|sea|seas|ocean|wave|waves|flood|rain|streams|rivers)\b/.test(
        lower
      )
    ) {
      ocean += 0.45;
    }
    if (
      /\b(wind|ruach|breath|breathing|hovering|hovered|storm|tempest|fluttering|moving over)\b/.test(
        lower
      )
    ) {
      windIntensity = Math.min(1.0, windIntensity + 0.48);
      subMode = 1.0;
      ocean += 0.25;
    }
    if (
      /\b(light|yehi or|dawn|morning|sun|shone|glow|golden|tov|good|blessed|sabbath|radiance)\b/.test(
        lower
      )
    ) {
      dawn += 0.52;
      lightBloom = Math.min(1.0, lightBloom + 0.48);
    }
    if (
      /\b(sky|firmament|vault|horizon|parted|separated|above|below|clouds|mist)\b/.test(
        lower
      )
    ) {
      waterParting = Math.min(1.0, waterParting + 0.58);
      ocean += 0.2;
      dawn += 0.15;
    }
    if (
      /\b(forest|trees|tree|garden|eden|green|seed|fruit|leaves|branches|earth|land|meadow|living)\b/.test(
        lower
      )
    ) {
      forest += 0.52;
    }
    if (
      /\b(stars|star|moon|heavens|galaxy|galaxies|universe|cosmos|night|darkness|tent|dust)\b/.test(
        lower
      )
    ) {
      cosmos += 0.45;
    }
  }

  if (isSoundCueActive) {
    windIntensity = Math.min(1.0, windIntensity + 0.22);
    lightBloom = Math.min(1.0, lightBloom + 0.18);
  }

  return {
    weights: normalizeSceneWeights({ ocean, dawn, forest, cosmos }),
    windIntensity: Math.max(0.1, Math.min(1.0, windIntensity)),
    lightBloom: Math.max(0.05, Math.min(1.0, lightBloom)),
    waterParting: Math.max(0.0, Math.min(1.0, waterParting)),
    subMode,
  };
}

/**
 * Smoothly interpolates between two TextDrivenShaderState snapshots so WebGL transitions
 * are always gradual and seamless rather than abrupt.
 */
export function lerpShaderState(
  current: TextDrivenShaderState,
  target: TextDrivenShaderState,
  alpha: number
): TextDrivenShaderState {
  const t = Math.max(0, Math.min(1, alpha));
  const lerp = (a: number, b: number) => a + (b - a) * t;

  const rawWeights: ShaderSceneWeights = {
    ocean: lerp(current.weights.ocean, target.weights.ocean),
    dawn: lerp(current.weights.dawn, target.weights.dawn),
    forest: lerp(current.weights.forest, target.weights.forest),
    cosmos: lerp(current.weights.cosmos, target.weights.cosmos),
  };

  return {
    weights: normalizeSceneWeights(rawWeights),
    windIntensity: lerp(current.windIntensity, target.windIntensity),
    lightBloom: lerp(current.lightBloom, target.lightBloom),
    waterParting: lerp(current.waterParting, target.waterParting),
    subMode: lerp(current.subMode, target.subMode),
  };
}

// ============================================================================
// MORGAN FREEMAN NARRATION TIMELINE & SOUND-CUE PACING ENGINE
// ============================================================================

export type NarrationBlockKind = 'sound-cue' | 'hebrew-quote' | 'paragraph';

export interface NarrationBlock {
  readonly id: string;
  readonly chapterNumber: number;
  readonly kind: NarrationBlockKind;
  readonly paragraphIndex: number | null;
  readonly displayText: string;
  readonly spokenText: string;
  readonly prePauseMs: number;
  readonly postPauseMs: number;
  readonly estimatedDurationMs: number;
  readonly speechRate: number;
  readonly speechPitch: number;
}

export interface NarratableChapter {
  readonly number: number;
  readonly narrative: string;
  readonly paragraphs?: readonly string[];
  readonly soundCue?: string;
  readonly hebrewQuote?: string;
  readonly hebrewTranslation?: string;
}

/**
 * Formats narrative text for unhurried, resonant storytelling delivery with natural pauses.
 */
export function formatSpokenTextForPacing(rawText: string): string {
  return rawText
    .replace(/\s*—\s*/g, ' ... ')
    .replace(/\.{3,}/g, ' ... ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Estimates spoken duration in milliseconds for Morgan Freeman's unhurried ~112 WPM cadence,
 * accounting for dramatic punctuation pauses (`...`, `—`, `.`, `?`, `!`).
 */
export function estimateSpokenDurationMs(text: string, prePauseMs = 0, postPauseMs = 0): number {
  const trimmed = text.trim();
  if (!trimmed) return prePauseMs + postPauseMs;

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const ellipsisCount = (trimmed.match(/\.{3}|—/g) || []).length;
  const sentenceEndCount = (trimmed.match(/[.!?](?!\.)/g) || []).length;
  const commaCount = (trimmed.match(/[,;:]/g) || []).length;

  const wordTimeMs = words * 490; // ~122 WPM base speech + pauses = ~110 effective WPM
  const pauseTimeMs =
    ellipsisCount * 620 + sentenceEndCount * 420 + commaCount * 220;

  return Math.max(1800, prePauseMs + wordTimeMs + pauseTimeMs + postPauseMs);
}

/**
 * Builds an ordered list of NarrationBlocks for a chapter that respects:
 * 1. Atmospheric [sound cues] (giving the soundscape 3.8s of dedicated breathing room before speech begins)
 * 2. Sacred Hebrew pull-quotes (slow, reverent delivery with pre/post contemplation pauses)
 * 3. Poetic narrative paragraphs (deep, unhurried cadence with natural sentence pauses)
 */
export function buildChapterNarrationBlocks(
  chapter: NarratableChapter
): NarrationBlock[] {
  const blocks: NarrationBlock[] = [];

  if (chapter.soundCue && chapter.soundCue.trim().length > 0) {
    const cueText = chapter.soundCue.trim();
    // Longer sound cues get slightly longer atmospheric immersion (3.6s - 4.5s)
    const cueWords = cueText.split(/\s+/).length;
    const cueDuration = Math.min(4600, Math.max(3500, 2600 + cueWords * 75));
    blocks.push({
      id: `ch-${chapter.number}-sound-cue`,
      chapterNumber: chapter.number,
      kind: 'sound-cue',
      paragraphIndex: null,
      displayText: cueText,
      spokenText: '', // Pure acoustic sound cue — narrator lets the atmosphere speak first
      prePauseMs: 300,
      postPauseMs: 600,
      estimatedDurationMs: cueDuration,
      speechRate: 0.8,
      speechPitch: 0.72,
    });
  }

  if (chapter.hebrewQuote && chapter.hebrewQuote.trim().length > 0) {
    const quote = chapter.hebrewQuote.trim();
    const translation = chapter.hebrewTranslation?.trim() || '';
    const spoken = translation ? `${quote} ... ${translation}` : quote;
    const prePauseMs = 700;
    const postPauseMs = 1100;
    blocks.push({
      id: `ch-${chapter.number}-hebrew-quote`,
      chapterNumber: chapter.number,
      kind: 'hebrew-quote',
      paragraphIndex: null,
      displayText: quote,
      spokenText: formatSpokenTextForPacing(spoken),
      prePauseMs,
      postPauseMs,
      estimatedDurationMs: estimateSpokenDurationMs(spoken, prePauseMs, postPauseMs),
      speechRate: 0.78,
      speechPitch: 0.7,
    });
  }

  const paragraphs =
    chapter.paragraphs && chapter.paragraphs.length > 0
      ? chapter.paragraphs
      : [chapter.narrative];

  paragraphs.forEach((para, idx) => {
    const cleanPara = para.trim();
    if (!cleanPara) return;
    const prePauseMs = idx === 0 ? 450 : 350;
    const postPauseMs = 950;
    const spoken = formatSpokenTextForPacing(cleanPara);
    blocks.push({
      id: `ch-${chapter.number}-para-${idx}`,
      chapterNumber: chapter.number,
      kind: 'paragraph',
      paragraphIndex: idx,
      displayText: cleanPara,
      spokenText: spoken,
      prePauseMs,
      postPauseMs,
      estimatedDurationMs: estimateSpokenDurationMs(cleanPara, prePauseMs, postPauseMs),
      speechRate: 0.84,
      speechPitch: 0.72,
    });
  });

  return blocks;
}
