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

export type ChapterVisualMotif =
  | 'hero-sanctuary'
  // Episode 1: Before the Beginning (12 Chapters)
  | 'e1-ch1-abyssal-resonance'
  | 'e1-ch2-bereshit-arch'
  | 'e1-ch3-tohu-vortex'
  | 'e1-ch4-hovering-ruach'
  | 'e1-ch5-yehi-or-burst'
  | 'e1-ch6-sky-and-shoals'
  | 'e1-ch7-imago-dei-grove'
  | 'e1-ch8-sacred-dust-breath'
  | 'e1-ch9-sabbath-sanctuary'
  | 'e1-ch10-symphony-nebula'
  | 'e1-ch11-dawn-over-depths'
  | 'e1-ch12-forest-of-grace'
  // Episode 2: The Garden and the Voice (9 Chapters)
  | 'e2-ch1-construct-eden'
  | 'e2-ch2-two-trees'
  | 'e2-ch3-coiling-serpent'
  | 'e2-ch4-fig-leaves-fall'
  | 'e2-ch5-ayekah-footsteps'
  | 'e2-ch6-promised-seed'
  | 'e2-ch7-flaming-sword'
  | 'e2-ch8-healing-river'
  | 'e2-ch9-east-of-eden-grace'
  // Episode 3: The Deep Unbound (3 Chapters)
  | 'e3-ch1-deluge-ark'
  | 'e3-ch2-receding-wind-ark'
  | 'e3-ch3-dove-olive-rainbow'
  // Episode 4: Stars Over the Tent (2 Chapters)
  | 'e4-ch1-pilgrim-tent-fire'
  | 'e4-ch2-counted-stars';

export interface ShaderSceneWeights {
  readonly ocean: number;
  readonly dawn: number;
  readonly forest: number;
  readonly cosmos: number;
}

export interface ChapterVisualSpec {
  readonly motif: ChapterVisualMotif;
  readonly label: string;
  readonly description?: string;
  readonly tintTop: readonly [number, number, number];
  readonly tintHorizon: readonly [number, number, number];
  readonly tintGround: readonly [number, number, number];
  readonly weights: ShaderSceneWeights;
  readonly windIntensity: number;
  readonly lightBloom: number;
  readonly waterParting: number;
  readonly accentGlow?: string;
}

const CHAPTER_VISUAL_SPECS: Record<string, ChapterVisualSpec> = {
  // EPISODE 1: BEFORE THE BEGINNING (12 distinct chapters)
  'e1-before-the-beginning:1': {
    motif: 'e1-ch1-abyssal-resonance',
    label: 'The Abyssal Seashell Resonance',
    tintTop: [0.02, 0.03, 0.08],
    tintHorizon: [0.16, 0.22, 0.38],
    tintGround: [0.02, 0.04, 0.10],
    weights: { ocean: 0.92, dawn: 0.0, forest: 0.0, cosmos: 0.08 },
    windIntensity: 0.18,
    lightBloom: 0.16,
    waterParting: 0.0,
  },
  'e1-before-the-beginning:2': {
    motif: 'e1-ch2-bereshit-arch',
    label: 'The Open House of Bereshit (ב)',
    tintTop: [0.04, 0.03, 0.12],
    tintHorizon: [0.28, 0.22, 0.48],
    tintGround: [0.04, 0.05, 0.14],
    weights: { ocean: 0.65, dawn: 0.05, forest: 0.0, cosmos: 0.30 },
    windIntensity: 0.24,
    lightBloom: 0.32,
    waterParting: 0.10,
  },
  'e1-before-the-beginning:3': {
    motif: 'e1-ch3-tohu-vortex',
    label: 'Tohu va-Vohu — Yearning Deep Swells',
    tintTop: [0.03, 0.06, 0.13],
    tintHorizon: [0.22, 0.36, 0.48],
    tintGround: [0.02, 0.08, 0.16],
    weights: { ocean: 0.95, dawn: 0.0, forest: 0.0, cosmos: 0.05 },
    windIntensity: 0.72,
    lightBloom: 0.24,
    waterParting: 0.15,
  },
  'e1-before-the-beginning:4': {
    motif: 'e1-ch4-hovering-ruach',
    label: 'Ruach Elohim — The Hovering Wings of Breath',
    tintTop: [0.04, 0.09, 0.16],
    tintHorizon: [0.36, 0.52, 0.62],
    tintGround: [0.04, 0.12, 0.20],
    weights: { ocean: 0.78, dawn: 0.22, forest: 0.0, cosmos: 0.0 },
    windIntensity: 0.92,
    lightBloom: 0.48,
    waterParting: 0.45,
  },
  'e1-before-the-beginning:5': {
    motif: 'e1-ch5-yehi-or-burst',
    label: 'Yehi Or — Firstborn Dawn Prism',
    tintTop: [0.08, 0.05, 0.14],
    tintHorizon: [0.95, 0.68, 0.26],
    tintGround: [0.32, 0.20, 0.08],
    weights: { ocean: 0.15, dawn: 0.85, forest: 0.0, cosmos: 0.0 },
    windIntensity: 0.30,
    lightBloom: 0.95,
    waterParting: 0.35,
  },
  'e1-before-the-beginning:6': {
    motif: 'e1-ch6-sky-and-shoals',
    label: 'Parted Firmament, Soaring Birds & Living Shoals',
    tintTop: [0.05, 0.14, 0.24],
    tintHorizon: [0.34, 0.68, 0.72],
    tintGround: [0.03, 0.22, 0.26],
    weights: { ocean: 0.62, dawn: 0.20, forest: 0.18, cosmos: 0.0 },
    windIntensity: 0.55,
    lightBloom: 0.62,
    waterParting: 0.92,
  },
  'e1-before-the-beginning:7': {
    motif: 'e1-ch7-imago-dei-grove',
    label: 'Imago Dei — Ancient Grove & Living Reflection',
    tintTop: [0.03, 0.09, 0.06],
    tintHorizon: [0.46, 0.68, 0.48],
    tintGround: [0.04, 0.16, 0.11],
    weights: { ocean: 0.10, dawn: 0.20, forest: 0.70, cosmos: 0.0 },
    windIntensity: 0.32,
    lightBloom: 0.68,
    waterParting: 0.20,
  },
  'e1-before-the-beginning:8': {
    motif: 'e1-ch8-sacred-dust-breath',
    label: 'Nishmat Chayim — Sacred Breath in Terracotta Dust',
    tintTop: [0.09, 0.05, 0.09],
    tintHorizon: [0.78, 0.46, 0.24],
    tintGround: [0.24, 0.12, 0.07],
    weights: { ocean: 0.0, dawn: 0.65, forest: 0.0, cosmos: 0.35 },
    windIntensity: 0.48,
    lightBloom: 0.75,
    waterParting: 0.10,
  },
  'e1-before-the-beginning:9': {
    motif: 'e1-ch9-sabbath-sanctuary',
    label: 'Shabbat — The Sanctuary Palace in Time',
    tintTop: [0.06, 0.04, 0.14],
    tintHorizon: [0.74, 0.56, 0.36],
    tintGround: [0.14, 0.10, 0.22],
    weights: { ocean: 0.25, dawn: 0.55, forest: 0.0, cosmos: 0.20 },
    windIntensity: 0.12,
    lightBloom: 0.72,
    waterParting: 0.05,
  },
  'e1-before-the-beginning:10': {
    motif: 'e1-ch10-symphony-nebula',
    label: 'Theological Overture — Cosmic Nebula & Harmonic Chords',
    tintTop: [0.03, 0.02, 0.09],
    tintHorizon: [0.48, 0.32, 0.66],
    tintGround: [0.06, 0.05, 0.16],
    weights: { ocean: 0.22, dawn: 0.08, forest: 0.0, cosmos: 0.70 },
    windIntensity: 0.28,
    lightBloom: 0.64,
    waterParting: 0.25,
  },
  'e1-before-the-beginning:11': {
    motif: 'e1-ch11-dawn-over-depths',
    label: 'Or va-Tov — Sunrise Hovering Over the Deep',
    tintTop: [0.05, 0.06, 0.14],
    tintHorizon: [0.84, 0.58, 0.28],
    tintGround: [0.06, 0.12, 0.22],
    weights: { ocean: 0.52, dawn: 0.48, forest: 0.0, cosmos: 0.0 },
    windIntensity: 0.36,
    lightBloom: 0.82,
    waterParting: 0.40,
  },
  'e1-before-the-beginning:12': {
    motif: 'e1-ch12-forest-of-grace',
    label: 'Chen va-Shalom — Lantern Walk Through the Forests of Scripture',
    tintTop: [0.02, 0.06, 0.07],
    tintHorizon: [0.42, 0.58, 0.46],
    tintGround: [0.03, 0.09, 0.07],
    weights: { ocean: 0.12, dawn: 0.24, forest: 0.44, cosmos: 0.20 },
    windIntensity: 0.16,
    lightBloom: 0.58,
    waterParting: 0.10,
  },

  // EPISODE 2: THE GARDEN AND THE VOICE (9 distinct chapters)
  'e2-the-garden-and-the-voice:1': {
    motif: 'e2-ch1-construct-eden',
    label: 'Gan be-Eden — Constructing the Garden & Four Rivers',
    tintTop: [0.02, 0.08, 0.05],
    tintHorizon: [0.38, 0.72, 0.52],
    tintGround: [0.04, 0.18, 0.12],
    weights: { ocean: 0.12, dawn: 0.18, forest: 0.70, cosmos: 0.0 },
    windIntensity: 0.28,
    lightBloom: 0.65,
    waterParting: 0.25,
  },
  'e2-the-garden-and-the-voice:2': {
    motif: 'e2-ch2-two-trees',
    label: 'Etz ha-Chayim — The Tree of Life & The First Boundary',
    tintTop: [0.04, 0.08, 0.05],
    tintHorizon: [0.76, 0.64, 0.32],
    tintGround: [0.06, 0.15, 0.09],
    weights: { ocean: 0.05, dawn: 0.35, forest: 0.60, cosmos: 0.0 },
    windIntensity: 0.22,
    lightBloom: 0.78,
    waterParting: 0.15,
  },
  'e2-the-garden-and-the-voice:3': {
    motif: 'e2-ch3-coiling-serpent',
    label: 'Arum — The Coiling Serpent on the Shadowed Bough',
    tintTop: [0.02, 0.04, 0.04],
    tintHorizon: [0.24, 0.38, 0.26],
    tintGround: [0.03, 0.07, 0.05],
    weights: { ocean: 0.25, dawn: 0.05, forest: 0.60, cosmos: 0.10 },
    windIntensity: 0.42,
    lightBloom: 0.28,
    waterParting: 0.05,
  },
  'e2-the-garden-and-the-voice:4': {
    motif: 'e2-ch4-fig-leaves-fall',
    label: 'Eirummim — Fractured Light & Drifting Fig Leaves',
    tintTop: [0.04, 0.05, 0.07],
    tintHorizon: [0.28, 0.32, 0.30],
    tintGround: [0.05, 0.07, 0.06],
    weights: { ocean: 0.20, dawn: 0.12, forest: 0.52, cosmos: 0.16 },
    windIntensity: 0.35,
    lightBloom: 0.22,
    waterParting: 0.0,
  },
  'e2-the-garden-and-the-voice:5': {
    motif: 'e2-ch5-ayekah-footsteps',
    label: 'Ayekah — Seeking Footsteps in the Cool of the Day',
    tintTop: [0.03, 0.06, 0.11],
    tintHorizon: [0.36, 0.48, 0.58],
    tintGround: [0.04, 0.10, 0.12],
    weights: { ocean: 0.38, dawn: 0.14, forest: 0.48, cosmos: 0.0 },
    windIntensity: 0.68,
    lightBloom: 0.44,
    waterParting: 0.55,
  },
  'e2-the-garden-and-the-voice:6': {
    motif: 'e2-ch6-promised-seed',
    label: 'Zera — The Crushed Serpent & The Promised Seed in the Ruins',
    tintTop: [0.06, 0.04, 0.08],
    tintHorizon: [0.72, 0.48, 0.24],
    tintGround: [0.12, 0.08, 0.06],
    weights: { ocean: 0.10, dawn: 0.58, forest: 0.22, cosmos: 0.10 },
    windIntensity: 0.46,
    lightBloom: 0.72,
    waterParting: 0.20,
  },
  'e2-the-garden-and-the-voice:7': {
    motif: 'e2-ch7-flaming-sword',
    label: 'Kotnot Or — Cherubim & The Flaming Sword East of Eden',
    tintTop: [0.07, 0.03, 0.06],
    tintHorizon: [0.85, 0.42, 0.20],
    tintGround: [0.16, 0.07, 0.06],
    weights: { ocean: 0.30, dawn: 0.50, forest: 0.10, cosmos: 0.10 },
    windIntensity: 0.58,
    lightBloom: 0.80,
    waterParting: 0.65,
  },
  'e2-the-garden-and-the-voice:8': {
    motif: 'e2-ch8-healing-river',
    label: 'Refuah — The River of Life & Leaves for the Healing of Nations',
    tintTop: [0.02, 0.07, 0.06],
    tintHorizon: [0.46, 0.74, 0.56],
    tintGround: [0.04, 0.18, 0.14],
    weights: { ocean: 0.28, dawn: 0.22, forest: 0.50, cosmos: 0.0 },
    windIntensity: 0.30,
    lightBloom: 0.74,
    waterParting: 0.35,
  },
  'e2-the-garden-and-the-voice:9': {
    motif: 'e2-ch9-east-of-eden-grace',
    label: 'Ruach ha-Yom — Still Loved East of Eden',
    tintTop: [0.05, 0.04, 0.11],
    tintHorizon: [0.68, 0.52, 0.34],
    tintGround: [0.10, 0.09, 0.14],
    weights: { ocean: 0.20, dawn: 0.52, forest: 0.14, cosmos: 0.14 },
    windIntensity: 0.22,
    lightBloom: 0.68,
    waterParting: 0.15,
  },

  // EPISODE 3: THE DEEP UNBOUND (3 distinct chapters)
  'e3-the-ark-and-the-olive-leaf:1': {
    motif: 'e3-ch1-deluge-ark',
    label: 'Chen — The Gathering Deluge & The Floating Ark Sanctuary',
    tintTop: [0.02, 0.04, 0.08],
    tintHorizon: [0.24, 0.34, 0.46],
    tintGround: [0.02, 0.06, 0.12],
    weights: { ocean: 0.90, dawn: 0.10, forest: 0.0, cosmos: 0.0 },
    windIntensity: 0.88,
    lightBloom: 0.30,
    waterParting: 0.55,
  },
  'e3-the-ark-and-the-olive-leaf:2': {
    motif: 'e3-ch2-receding-wind-ark',
    label: 'Vayizkor Elohim — Receding Wind & Emergent Peaks of Ararat',
    tintTop: [0.03, 0.07, 0.14],
    tintHorizon: [0.42, 0.56, 0.68],
    tintGround: [0.03, 0.10, 0.18],
    weights: { ocean: 0.75, dawn: 0.25, forest: 0.0, cosmos: 0.0 },
    windIntensity: 0.76,
    lightBloom: 0.54,
    waterParting: 0.78,
  },
  'e3-the-ark-and-the-olive-leaf:3': {
    motif: 'e3-ch3-dove-olive-rainbow',
    label: 'Qeshet be-Anan — The Returning Dove with Olive Leaf & Covenant Bow',
    tintTop: [0.06, 0.08, 0.16],
    tintHorizon: [0.88, 0.66, 0.36],
    tintGround: [0.12, 0.20, 0.24],
    weights: { ocean: 0.28, dawn: 0.62, forest: 0.10, cosmos: 0.0 },
    windIntensity: 0.26,
    lightBloom: 0.88,
    waterParting: 0.45,
  },

  // EPISODE 4: STARS OVER THE TENT (2 distinct chapters)
  'e4-stars-over-the-desert:1': {
    motif: 'e4-ch1-pilgrim-tent-fire',
    label: 'Lekh-Lekha — Nomad Tent & Pilgrim Campfire on the Dunes',
    tintTop: [0.06, 0.04, 0.09],
    tintHorizon: [0.76, 0.46, 0.22],
    tintGround: [0.22, 0.12, 0.07],
    weights: { ocean: 0.0, dawn: 0.55, forest: 0.0, cosmos: 0.45 },
    windIntensity: 0.38,
    lightBloom: 0.66,
    waterParting: 0.10,
  },
  'e4-stars-over-the-desert:2': {
    motif: 'e4-ch2-counted-stars',
    label: 'Ha-Kokhavim — Abraham Beneath the Cathedral of Constellations',
    tintTop: [0.02, 0.02, 0.07],
    tintHorizon: [0.38, 0.28, 0.56],
    tintGround: [0.08, 0.06, 0.12],
    weights: { ocean: 0.05, dawn: 0.05, forest: 0.0, cosmos: 0.90 },
    windIntensity: 0.24,
    lightBloom: 0.72,
    waterParting: 0.15,
  },
};

export function getChapterVisualSpec(
  episodeId?: string,
  chapterNumber?: number,
  fallbackTheme = 'primordial-waters',
  fallbackMode?: CanvasSimulationMode,
  chapterAnimationConfig?: ChapterVisualSpec
): ChapterVisualSpec {
  if (chapterAnimationConfig) {
    return chapterAnimationConfig;
  }
  if (episodeId && typeof chapterNumber === 'number') {
    const key = `${episodeId}:${chapterNumber}`;
    if (CHAPTER_VISUAL_SPECS[key]) {
      return CHAPTER_VISUAL_SPECS[key];
    }
  }

  // Fallback for Home Hero or generic theme preview
  if (
    fallbackTheme === 'hero-waterfall' ||
    fallbackTheme === 'ancient-forest' ||
    fallbackTheme === 'eden-mist' ||
    fallbackMode === 'emerald-spores' ||
    fallbackMode === 'meadow-fireflies'
  ) {
    return {
      motif: 'hero-sanctuary',
      label: 'Sanctuary Waterfall & Emerald Mist',
      tintTop: [0.025, 0.065, 0.045],
      tintHorizon: [0.45, 0.68, 0.56],
      tintGround: [0.04, 0.14, 0.10],
      weights: { ocean: 0.0, dawn: 0.0, forest: 1.0, cosmos: 0.0 },
      windIntensity: 0.28,
      lightBloom: 0.42,
      waterParting: 0.15,
    };
  }
  if (
    fallbackTheme === 'first-light' ||
    fallbackTheme === 'sabbath-stillness' ||
    fallbackMode === 'yehi-or-dawn' ||
    fallbackMode === 'sabbath-breath'
  ) {
    return {
      motif: 'e1-ch5-yehi-or-burst',
      label: 'First Light Dawn',
      tintTop: [0.05, 0.04, 0.09],
      tintHorizon: [0.85, 0.60, 0.26],
      tintGround: [0.24, 0.16, 0.08],
      weights: { ocean: 0.15, dawn: 0.85, forest: 0.0, cosmos: 0.0 },
      windIntensity: 0.25,
      lightBloom: 0.78,
      waterParting: 0.20,
    };
  }
  if (
    fallbackTheme === 'celestial-spheres' ||
    fallbackTheme === 'desert-stars' ||
    fallbackMode === 'star-constellations'
  ) {
    return {
      motif: 'e4-ch2-counted-stars',
      label: 'Celestial Constellations',
      tintTop: [0.02, 0.025, 0.06],
      tintHorizon: [0.38, 0.26, 0.48],
      tintGround: [0.09, 0.07, 0.10],
      weights: { ocean: 0.10, dawn: 0.0, forest: 0.0, cosmos: 0.90 },
      windIntensity: 0.25,
      lightBloom: 0.48,
      waterParting: 0.10,
    };
  }
  return {
    motif: 'e1-ch1-abyssal-resonance',
    label: 'Primordial Waters',
    tintTop: [0.025, 0.04, 0.085],
    tintHorizon: [0.26, 0.35, 0.45],
    tintGround: [0.02, 0.05, 0.10],
    weights: { ocean: 1.0, dawn: 0.0, forest: 0.0, cosmos: 0.0 },
    windIntensity: 0.30,
    lightBloom: 0.25,
    waterParting: 0.10,
  };
}

export interface TextDrivenShaderState {
  readonly weights: ShaderSceneWeights;
  readonly windIntensity: number;
  readonly lightBloom: number;
  readonly waterParting: number;
  readonly subMode: number;
  readonly tintTop: readonly [number, number, number];
  readonly tintHorizon: readonly [number, number, number];
  readonly tintGround: readonly [number, number, number];
  readonly motif: ChapterVisualMotif;
  readonly motifLabel: string;
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
 * Pure function that ties the real-time WebGL shader parameters directly to:
 * 1. The chapter's animationConfig from the StoryEpisode data structure (or episodeId + chapterNumber fallback)
 * 2. The live narrative text or sound cue being read/spoken.
 */
export function computeTextDrivenShaderTargets(
  theme: string,
  canvasMode?: CanvasSimulationMode,
  activeText = '',
  isSoundCueActive = false,
  episodeId?: string,
  chapterNumber?: number,
  chapterAnimationConfig?: ChapterVisualSpec
): TextDrivenShaderState {
  const spec = getChapterVisualSpec(
    episodeId,
    chapterNumber,
    theme,
    canvasMode,
    chapterAnimationConfig
  );

  let ocean = spec.weights.ocean;
  let dawn = spec.weights.dawn;
  let forest = spec.weights.forest;
  let cosmos = spec.weights.cosmos;

  let windIntensity = spec.windIntensity;
  let lightBloom = spec.lightBloom;
  let waterParting = spec.waterParting;
  let subMode =
    theme === 'living-waters' || canvasMode === 'living-shoals'
      ? 2.0
      : canvasMode === 'ruach-wind' || theme === 'sacred-breath'
        ? 1.0
        : 0.0;

  // Semantic modulation from the live narrative text or active sound cue
  const lower = activeText.toLowerCase();
  if (lower.length > 0) {
    if (
      /\b(water|waters|deep|tehom|sea|seas|ocean|wave|waves|flood|rain|streams|rivers)\b/.test(
        lower
      )
    ) {
      ocean += 0.28;
    }
    if (
      /\b(wind|ruach|breath|breathing|hovering|hovered|storm|tempest|fluttering|moving over|breeze|cool of the day)\b/.test(
        lower
      )
    ) {
      windIntensity = Math.min(1.0, windIntensity + 0.38);
      subMode = 1.0;
    }
    if (
      /\b(light|yehi or|dawn|morning|sun|shone|glow|golden|tov|good|blessed|sabbath|radiance|flaming|fire)\b/.test(
        lower
      )
    ) {
      dawn += 0.32;
      lightBloom = Math.min(1.0, lightBloom + 0.35);
    }
    if (
      /\b(sky|firmament|vault|horizon|parted|separated|above|below|clouds|mist|bow|rainbow)\b/.test(
        lower
      )
    ) {
      waterParting = Math.min(1.0, waterParting + 0.42);
    }
    if (
      /\b(forest|trees|tree|garden|eden|green|seed|fruit|leaves|branches|earth|land|meadow|living|serpent|fig|olive)\b/.test(
        lower
      )
    ) {
      forest += 0.32;
    }
    if (
      /\b(stars|star|moon|heavens|galaxy|galaxies|universe|cosmos|night|darkness|tent|dust)\b/.test(
        lower
      )
    ) {
      cosmos += 0.32;
    }
  }

  if (isSoundCueActive) {
    windIntensity = Math.min(1.0, windIntensity + 0.2);
    lightBloom = Math.min(1.0, lightBloom + 0.16);
  }

  return {
    weights: normalizeSceneWeights({ ocean, dawn, forest, cosmos }),
    windIntensity: Math.max(0.1, Math.min(1.0, windIntensity)),
    lightBloom: Math.max(0.05, Math.min(1.0, lightBloom)),
    waterParting: Math.max(0.0, Math.min(1.0, waterParting)),
    subMode,
    tintTop: spec.tintTop,
    tintHorizon: spec.tintHorizon,
    tintGround: spec.tintGround,
    motif: spec.motif,
    motifLabel: spec.label,
  };
}

/**
 * Smoothly interpolates between two TextDrivenShaderState snapshots so WebGL transitions
 * and per-chapter color palettes are always gradual and seamless rather than abrupt.
 */
export function lerpShaderState(
  current: TextDrivenShaderState,
  target: TextDrivenShaderState,
  alpha: number
): TextDrivenShaderState {
  const t = Math.max(0, Math.min(1, alpha));
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const lerpVec3 = (
    a: readonly [number, number, number],
    b: readonly [number, number, number]
  ): readonly [number, number, number] => [
    lerp(a[0], b[0]),
    lerp(a[1], b[1]),
    lerp(a[2], b[2]),
  ];

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
    tintTop: lerpVec3(current.tintTop, target.tintTop),
    tintHorizon: lerpVec3(current.tintHorizon, target.tintHorizon),
    tintGround: lerpVec3(current.tintGround, target.tintGround),
    motif: target.motif,
    motifLabel: target.motifLabel,
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
  readonly neuralPlaybackRate: number;
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
 * Computes the horizontal/vertical transition direction (+1 forward, -1 backward)
 * when navigating between chapters or episodes in EpisodeReaderView.
 */
export function getChapterTransitionDirection(
  previousIndex: number,
  nextIndex: number
): 1 | -1 {
  return nextIndex >= previousIndex ? 1 : -1;
}

/**
 * Formats narrative text for clean, natural, single-speaker storytelling delivery
 * without injecting artificial multi-second ellipsis stalls.
 */
export function formatSpokenTextForPacing(rawText: string): string {
  return rawText
    .replace(/\s*—\s*/g, ', ')
    .replace(/\.{3,}/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Estimates spoken duration in milliseconds for natural, brisk ~150 WPM narration cadence.
 */
export function estimateSpokenDurationMs(
  text: string,
  prePauseMs = 0,
  postPauseMs = 0
): number {
  const trimmed = text.trim();
  if (!trimmed) return prePauseMs + postPauseMs;

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const sentenceEndCount = (trimmed.match(/[.!?](?!\.)/g) || []).length;
  const commaCount = (trimmed.match(/[,;:]/g) || []).length;

  const wordTimeMs = words * 340; // ~175 WPM base speech + punctuation = ~150 effective WPM
  const pauseTimeMs = sentenceEndCount * 240 + commaCount * 110;

  return Math.max(1400, prePauseMs + wordTimeMs + pauseTimeMs + postPauseMs);
}

// Single consistent speaker voice parameters across all blocks so the narrator never sounds like two different speakers
const UNIFIED_SPEECH_RATE = 1.02;
const UNIFIED_SPEECH_PITCH = 0.82;
const UNIFIED_NEURAL_PLAYBACK_RATE = 1.15;

/**
 * Builds an ordered list of NarrationBlocks for a chapter that respects:
 * 1. Atmospheric [sound cues] (giving the soundscape dedicated breathing room before speech begins)
 * 2. Sacred Hebrew pull-quotes (spoken by the same unified narrator at a natural, clear pace)
 * 3. Poetic narrative paragraphs (spoken by the same unified narrator with brisk, engaging flow)
 */
export function buildChapterNarrationBlocks(
  chapter: NarratableChapter
): NarrationBlock[] {
  const blocks: NarrationBlock[] = [];

  if (chapter.soundCue && chapter.soundCue.trim().length > 0) {
    const cueText = chapter.soundCue.trim();
    const cueWords = cueText.split(/\s+/).length;
    const cueDuration = Math.min(4200, Math.max(3500, 2500 + cueWords * 65));
    blocks.push({
      id: `ch-${chapter.number}-sound-cue`,
      chapterNumber: chapter.number,
      kind: 'sound-cue',
      paragraphIndex: null,
      displayText: cueText,
      spokenText: '', // Pure acoustic sound cue — narrator lets the atmosphere speak first
      prePauseMs: 180,
      postPauseMs: 320,
      estimatedDurationMs: cueDuration,
      speechRate: UNIFIED_SPEECH_RATE,
      speechPitch: UNIFIED_SPEECH_PITCH,
      neuralPlaybackRate: UNIFIED_NEURAL_PLAYBACK_RATE,
    });
  }

  if (chapter.hebrewQuote && chapter.hebrewQuote.trim().length > 0) {
    const quote = chapter.hebrewQuote.trim();
    const translation = chapter.hebrewTranslation?.trim() || '';
    const spoken = translation ? `${quote}. ${translation}` : quote;
    const prePauseMs = 180;
    const postPauseMs = 340;
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
      speechRate: UNIFIED_SPEECH_RATE,
      speechPitch: UNIFIED_SPEECH_PITCH,
      neuralPlaybackRate: UNIFIED_NEURAL_PLAYBACK_RATE,
    });
  }

  const paragraphs =
    chapter.paragraphs && chapter.paragraphs.length > 0
      ? chapter.paragraphs
      : [chapter.narrative];

  paragraphs.forEach((para, idx) => {
    const cleanPara = para.trim();
    if (!cleanPara) return;
    const prePauseMs = idx === 0 ? 160 : 140;
    const postPauseMs = 320;
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
      speechRate: UNIFIED_SPEECH_RATE,
      speechPitch: UNIFIED_SPEECH_PITCH,
      neuralPlaybackRate: UNIFIED_NEURAL_PLAYBACK_RATE,
    });
  });

  return blocks;
}
