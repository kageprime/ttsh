import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampChapterIndex,
  getNextChapterIndex,
  getPrevChapterIndex,
  calculateProgressPercent,
  calculateReadingCompletionStats,
  formatChapterNumber,
  formatTimecode,
  filterEpisodes,
  getNextEpisode,
  getReaderProseClasses,
  splitNarrativeWithTrigger,
  splitNarrativeIntoSentences,
  getActiveSentenceIndex,
  getCanvasPalette,
  transitionReaderStage,
  INITIAL_READER_STAGE_STATE,
  DEFAULT_READER_SETTINGS,
  computeTextDrivenShaderTargets,
  lerpShaderState,
  buildChapterNarrationBlocks,
} from './storybookLogic.ts';

test('clampChapterIndex keeps index within valid chapter bounds', () => {
  assert.equal(clampChapterIndex(-3, 12), 0);
  assert.equal(clampChapterIndex(0, 12), 0);
  assert.equal(clampChapterIndex(5, 12), 5);
  assert.equal(clampChapterIndex(15, 12), 11);
  assert.equal(clampChapterIndex(0, 0), 0);
});

test('getNextChapterIndex and getPrevChapterIndex navigate accurately', () => {
  assert.equal(getPrevChapterIndex(0), null);
  assert.equal(getPrevChapterIndex(3), 2);
  assert.equal(getNextChapterIndex(0, 12), 1);
  assert.equal(getNextChapterIndex(10, 12), 11);
  assert.equal(getNextChapterIndex(11, 12), null);
});

test('calculateProgressPercent computes accurate percentage from chapter index', () => {
  assert.equal(calculateProgressPercent(0, 12), 8);
  assert.equal(calculateProgressPercent(5, 12), 50);
  assert.equal(calculateProgressPercent(11, 12), 100);
  assert.equal(calculateProgressPercent(0, 0), 0);
});

test('calculateReadingCompletionStats computes book and collection completion percentages', () => {
  const mockCollection = [
    {
      id: 'e1',
      series: 'BIBLEVERSE',
      chapters: [{ number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }],
    },
    {
      id: 'e2',
      series: 'BIBLEVERSE',
      chapters: [{ number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }],
    },
  ];

  const stats = calculateReadingCompletionStats(
    mockCollection,
    'e1',
    2,
    {
      e1: [1],
      e2: [1, 2],
    }
  );

  assert.equal(stats.episodeCompletedCount, 2);
  assert.equal(stats.episodeTotalCount, 4);
  assert.equal(stats.episodePercent, 50);

  assert.equal(stats.collectionCompletedCount, 4);
  assert.equal(stats.collectionTotalCount, 8);
  assert.equal(stats.collectionPercent, 50);
});

test('formatChapterNumber and formatTimecode format values cleanly', () => {
  assert.equal(formatChapterNumber(1), '01');
  assert.equal(formatChapterNumber(9), '09');
  assert.equal(formatChapterNumber(12), '12');

  assert.equal(formatTimecode(0), '0:00');
  assert.equal(formatTimecode(9), '0:09');
  assert.equal(formatTimecode(65), '1:05');
  assert.equal(formatTimecode(720), '12:00');
});

test('filterEpisodes filters by category and search query', () => {
  const sample = [
    {
      id: 'e1',
      title: 'Before the Beginning',
      subtitle: 'A Hollow and a Hum',
      summary: 'Genesis creation story',
      bookRef: 'Genesis 1:1',
      category: 'Primeval History',
    },
    {
      id: 'e4',
      title: 'Stars Over the Tent',
      subtitle: 'The Call of Abraham',
      summary: 'Desert stars and covenant',
      bookRef: 'Genesis 12:1',
      category: 'Covenant & Promise',
    },
  ];

  assert.equal(filterEpisodes(sample, 'all', '').length, 2);
  assert.equal(filterEpisodes(sample, 'Primeval History', '').length, 1);
  assert.equal(filterEpisodes(sample, 'all', 'abraham').length, 1);
  assert.equal(filterEpisodes(sample, 'Covenant & Promise', 'Genesis 1:1').length, 0);
});

test('getNextEpisode resolves the following episode or loops to first', () => {
  const list = [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }];
  assert.deepEqual(getNextEpisode(list, 'e1'), { id: 'e2' });
  assert.deepEqual(getNextEpisode(list, 'e2'), { id: 'e3' });
  assert.deepEqual(getNextEpisode(list, 'e3'), { id: 'e1' });
  assert.equal(getNextEpisode(list, 'unknown'), null);
});

test('getReaderProseClasses returns expected typography classes', () => {
  const classes = getReaderProseClasses({
    ...DEFAULT_READER_SETTINGS,
    fontSize: 'lg',
    fontFamily: 'sans',
    highContrast: true,
  });
  assert.ok(classes.includes('font-sans-ui'));
  assert.ok(classes.includes('text-2xl'));
  assert.ok(classes.includes('text-white'));
});

test('splitNarrativeWithTrigger isolates interactive trigger phrase', () => {
  const narrative = 'Four words in the ancient tongue: Yehi Or — Let light be. Notice how darkness is named.';
  const parts = splitNarrativeWithTrigger(narrative, 'Yehi Or — Let light be');
  assert.equal(parts.length, 3);
  assert.equal(parts[1].isTrigger, true);
  assert.equal(parts[1].text, 'Yehi Or — Let light be');
});

test('splitNarrativeIntoSentences splits sentences and flags trigger sentence', () => {
  const narrative = 'First sentence here. Four words: Yehi Or — Let light be! Final thought.';
  const sentences = splitNarrativeIntoSentences(narrative, 'Yehi Or — Let light be');
  assert.equal(sentences.length, 3);
  assert.equal(sentences[0].hasTrigger, false);
  assert.equal(sentences[1].hasTrigger, true);
  assert.equal(sentences[1].parts.some((p) => p.isTrigger), true);
});

test('getActiveSentenceIndex maps playback time to sentence index', () => {
  assert.equal(getActiveSentenceIndex(0, 60, 4), 0);
  assert.equal(getActiveSentenceIndex(20, 60, 4), 1);
  assert.equal(getActiveSentenceIndex(59, 60, 4), 3);
});

test('getCanvasPalette returns distinct color palettes for simulation modes', () => {
  const dawn = getCanvasPalette('yehi-or-dawn');
  const emerald = getCanvasPalette('emerald-spores');
  assert.notEqual(dawn.glowHex, emerald.glowHex);
});

test('INITIAL_READER_STAGE_STATE defaults to Quiet Read scroll mode and supports drawer toggles', () => {
  assert.equal(INITIAL_READER_STAGE_STATE.kind, 'scroll');

  const s1 = transitionReaderStage(INITIAL_READER_STAGE_STATE, {
    type: 'TOGGLE_DRAWER',
    drawer: 'reflect',
  });
  assert.deepEqual(s1, { kind: 'scroll', activeDrawer: 'reflect' });

  const s2 = transitionReaderStage(s1, { type: 'SET_MODE', mode: 'slides' });
  assert.deepEqual(s2, { kind: 'slides', activeDrawer: 'none' });

  const s3 = transitionReaderStage(s2, { type: 'SET_MODE', mode: 'scroll' });
  assert.deepEqual(s3, { kind: 'scroll', activeDrawer: 'none' });
});

test('computeTextDrivenShaderTargets and lerpShaderState smoothly blend WebGL scene parameters from text', () => {
  const oceanState = computeTextDrivenShaderTargets(
    'primordial-waters',
    'void-ripples',
    'Dark waters of the deep tehom waiting in silence.',
    false
  );
  assert.ok(oceanState.weights.ocean > 0.85);

  // When the text mentions "Yehi or — Let there be light", dawn weight & lightBloom smoothly increase
  const lightTextState = computeTextDrivenShaderTargets(
    'primordial-waters',
    'void-ripples',
    'Yehi or. Let there be light shining over the waters and dawn broke.',
    false
  );
  assert.ok(lightTextState.weights.dawn > oceanState.weights.dawn);
  assert.ok(lightTextState.lightBloom > oceanState.lightBloom);

  // Interpolating halfway produces normalized weights between oceanState and lightTextState
  const midState = lerpShaderState(oceanState, lightTextState, 0.5);
  const weightSum =
    midState.weights.ocean +
    midState.weights.dawn +
    midState.weights.forest +
    midState.weights.cosmos;
  assert.ok(Math.abs(weightSum - 1.0) < 0.0001);
  assert.ok(midState.weights.dawn > oceanState.weights.dawn);
  assert.ok(midState.weights.dawn < lightTextState.weights.dawn);
});

test('buildChapterNarrationBlocks sequences sound cues, Hebrew quotes, and paced paragraphs', () => {
  const blocks = buildChapterNarrationBlocks({
    number: 5,
    soundCue: 'The hum resolves into a single, clear, sustained note — pure and gentle.',
    hebrewQuote: 'Yehi or.',
    hebrewTranslation: 'Let there be light.',
    narrative: 'Not the light of sun or star.',
    paragraphs: [
      'Not the light of sun or star — not yet.',
      'And God saw that the light was good. Tov.',
    ],
  });

  assert.equal(blocks.length, 4);
  assert.equal(blocks[0].kind, 'sound-cue');
  assert.equal(blocks[0].spokenText, '');
  assert.ok(blocks[0].estimatedDurationMs >= 3500);

  assert.equal(blocks[1].kind, 'hebrew-quote');
  assert.ok(blocks[1].spokenText.includes('Yehi or'));
  assert.ok(blocks[1].spokenText.includes('Let there be light'));

  assert.equal(blocks[2].kind, 'paragraph');
  assert.equal(blocks[2].paragraphIndex, 0);
  assert.equal(blocks[3].kind, 'paragraph');
  assert.equal(blocks[3].paragraphIndex, 1);
});
