import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PiArrowLeft,
  PiPlayFill,
  PiPauseFill,
  PiCaretLeft,
  PiCaretRight,
  PiSparkle,
  PiSpeakerHigh,
  PiSpeakerSlash,
  PiArticle,
  PiSlideshow,
  PiWaveform,
  PiX,
  PiEye,
  PiBookOpenText,
  PiGitCommit,
  PiBellRinging,
  PiBookmarkSimple,
  PiBookmarkSimpleFill,
  PiNotePencil,
} from 'react-icons/pi';
import { StoryEpisode } from '../data/stories';
import {
  ReaderSettings,
  ReaderStageState,
  INITIAL_READER_STAGE_STATE,
  transitionReaderStage,
  clampChapterIndex,
  getNextChapterIndex,
  getPrevChapterIndex,
  calculateReadingCompletionStats,
  formatChapterNumber,
  getReaderProseClasses,
  buildChapterNarrationBlocks,
  getChapterTransitionDirection,
  getChapterVisualSpec,
} from '../utils/storybookLogic';
import { LivingStoryCanvas } from './LivingStoryCanvas';
import {
  LiturgicalReflectionJournal,
  HighlightInkColor,
  VerseHighlightRecord,
  HIGHLIGHT_INK_STYLES,
  loadStoredHighlights,
  saveStoredHighlights,
} from './LiturgicalReflectionJournal';
import { ambientSound } from '../utils/ambientAudio';
import { narrationDirector } from '../utils/narrationEngine';
import {
  LEXICON_ENTRIES,
  LexiconEntry,
  THEOLOGICAL_THREADS,
  tokenizeParagraphWithLexicon,
} from '../data/lexicon';

const CINEMATIC_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type { HighlightInkColor, VerseHighlightRecord };

interface EpisodeReaderViewProps {
  episode: StoryEpisode;
  allEpisodes: readonly StoryEpisode[];
  completedChaptersByEpisode: Readonly<Record<string, readonly number[]>>;
  nextEpisode: StoryEpisode | null;
  initialChapterIndex?: number;
  initialAutoPlay?: boolean;
  readerSettings: ReaderSettings;
  reflectionNotes: Record<string, string>;
  onSaveReflection: (key: string, note: string) => void;
  onMarkChapterRead: (episodeId: string, chapterNumber: number) => void;
  onBackToEpisodes: () => void;
  onSelectEpisode: (episodeId: string, chapterIndex?: number) => void;
}

export const EpisodeReaderView: React.FC<EpisodeReaderViewProps> = ({
  episode,
  allEpisodes,
  completedChaptersByEpisode,
  nextEpisode,
  initialChapterIndex = 0,
  initialAutoPlay = false,
  readerSettings,
  reflectionNotes,
  onSaveReflection,
  onMarkChapterRead,
  onBackToEpisodes,
  onSelectEpisode,
}) => {
  const [chapterIndex, setChapterIndex] = useState<number>(() =>
    clampChapterIndex(initialChapterIndex, episode.chapters.length)
  );
  const [chapterDirection, setChapterDirection] = useState<1 | -1>(1);
  const [stageState, setStageState] = useState<ReaderStageState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'slides') {
        return { kind: 'slides', activeDrawer: 'none' };
      }
    }
    return INITIAL_READER_STAGE_STATE;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(initialAutoPlay);
  const [soundscapeActive, setSoundscapeActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [blockIndex, setBlockIndex] = useState<number>(0);
  const [surgeCount, setSurgeCount] = useState<number>(0);
  const [chapterScrollProgress, setChapterScrollProgress] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Contemplative Study Suite states
  const [lexiconLensActive, setLexiconLensActive] = useState<boolean>(true);
  const [activeLexiconEntry, setActiveLexiconEntry] =
    useState<LexiconEntry | null>(null);
  const [activeInkColor, setActiveInkColor] =
    useState<HighlightInkColor>('amber');
  const [highlights, setHighlights] = useState<
    Record<string, VerseHighlightRecord>
  >(() => loadStoredHighlights());

  const isProgrammaticScrollRef = useRef<boolean>(false);
  const prevChapterNumberRef = useRef<number | null>(null);

  const totalChapters = episode.chapters.length;
  const safeIndex = clampChapterIndex(chapterIndex, totalChapters);
  const currentChapter = episode.chapters[safeIndex];
  const nextChapterIdx = getNextChapterIndex(safeIndex, totalChapters);
  const nextChapter =
    nextChapterIdx !== null ? episode.chapters[nextChapterIdx] : undefined;

  // Build cue-respecting narration timeline for the active chapter
  const chapterBlocks = useMemo(
    () => buildChapterNarrationBlocks(currentChapter),
    [currentChapter]
  );

  const safeBlockIndex = Math.max(
    0,
    Math.min(blockIndex, Math.max(0, chapterBlocks.length - 1))
  );
  const activeBlock = chapterBlocks[safeBlockIndex] || null;

  const completionStats = calculateReadingCompletionStats(
    allEpisodes,
    episode.id,
    currentChapter.number,
    completedChaptersByEpisode
  );

  const paragraphs =
    currentChapter.paragraphs && currentChapter.paragraphs.length > 0
      ? currentChapter.paragraphs
      : [currentChapter.narrative];

  const currentAnimationConfig =
    currentChapter.animationConfig ||
    getChapterVisualSpec(
      episode.id,
      currentChapter.number,
      currentChapter.sceneTheme,
      currentChapter.canvasMode
    );

  const nextAnimationConfig = nextChapter
    ? nextChapter.animationConfig ||
      getChapterVisualSpec(
        episode.id,
        nextChapter.number,
        nextChapter.sceneTheme,
        nextChapter.canvasMode
      )
    : undefined;

  // Pre-fetch single-speaker neural TTS audio for current chapter AND next chapter blocks
  useEffect(() => {
    const nextChIdx = getNextChapterIndex(safeIndex, totalChapters);
    const nextChapterBlocks =
      nextChIdx !== null
        ? buildChapterNarrationBlocks(episode.chapters[nextChIdx]).slice(0, 2)
        : [];
    narrationDirector.prefetchChapterBlocks([
      ...chapterBlocks,
      ...nextChapterBlocks,
    ]);
  }, [chapterBlocks, safeIndex, totalChapters, episode.chapters]);

  // Reset when episode or initialChapterIndex changes
  useEffect(() => {
    narrationDirector.stop();
    const validIdx = clampChapterIndex(
      initialChapterIndex,
      episode.chapters.length
    );
    setChapterDirection(1);
    setChapterIndex(validIdx);
    setBlockIndex(0);
    setChapterScrollProgress(0);
    setSurgeCount(0);
    const isSlidesParam =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('mode') === 'slides';
    setStageState(
      isSlidesParam
        ? { kind: 'slides', activeDrawer: 'none' }
        : INITIAL_READER_STAGE_STATE
    );
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [episode.id, initialChapterIndex, episode.chapters.length]);

  // Mark chapter read and ring subtle binaural liturgical bell on chapter milestone
  useEffect(() => {
    onMarkChapterRead(episode.id, currentChapter.number);

    if (
      prevChapterNumberRef.current !== null &&
      prevChapterNumberRef.current !== currentChapter.number &&
      (isPlaying || soundscapeActive) &&
      !isMuted &&
      readerSettings.ambientAudioEnabled
    ) {
      ambientSound.triggerLiturgicalBell(currentChapter.sceneTheme, true);
    }
    prevChapterNumberRef.current = currentChapter.number;
  }, [
    episode.id,
    currentChapter.number,
    currentChapter.sceneTheme,
    onMarkChapterRead,
    isPlaying,
    soundscapeActive,
    isMuted,
    readerSettings.ambientAudioEnabled,
  ]);

  // 4-Layer Generative Soundscape (Foley + Harmonic Pad)
  useEffect(() => {
    if (
      (isPlaying || soundscapeActive) &&
      !isMuted &&
      readerSettings.ambientAudioEnabled
    ) {
      ambientSound.start(
        currentChapter.sceneTheme,
        true,
        currentAnimationConfig.motif
      );
    } else {
      ambientSound.stop();
    }
  }, [
    isPlaying,
    soundscapeActive,
    isMuted,
    readerSettings.ambientAudioEnabled,
    currentChapter.sceneTheme,
    currentAnimationConfig.motif,
  ]);

  // Modulate harmonic chord emotional tension as active text or scroll progress changes
  const activeTextForShader = activeBlock
    ? activeBlock.displayText
    : currentChapter.narrative;

  useEffect(() => {
    if (
      (isPlaying || soundscapeActive) &&
      !isMuted &&
      readerSettings.ambientAudioEnabled
    ) {
      ambientSound.modulateEmotionalTension(
        activeTextForShader,
        chapterScrollProgress,
        true
      );
    }
  }, [
    activeTextForShader,
    chapterScrollProgress,
    isPlaying,
    soundscapeActive,
    isMuted,
    readerSettings.ambientAudioEnabled,
  ]);

  // Stop audio & speech on unmount
  useEffect(() => {
    return () => {
      narrationDirector.stop();
      ambientSound.stop();
    };
  }, []);

  // Single-Speaker Narration Director + Auto-Scroll in Quiet Read Mode
  useEffect(() => {
    if (!isPlaying || !activeBlock) {
      narrationDirector.stop();
      return;
    }

    setSurgeCount((c) => c + 1);
    if (chapterBlocks.length > 1) {
      setChapterScrollProgress(safeBlockIndex / (chapterBlocks.length - 1));
    }

    if (
      stageState.kind === 'scroll' &&
      (safeIndex > 0 || safeBlockIndex > 0) &&
      typeof document !== 'undefined' &&
      typeof window !== 'undefined'
    ) {
      const targetEl = document.querySelector<HTMLElement>(
        `[data-narration-id="${activeBlock.id}"]`
      );
      if (targetEl) {
        isProgrammaticScrollRef.current = true;
        const rect = targetEl.getBoundingClientRect();
        const targetTop = Math.max(
          0,
          window.scrollY + rect.top - window.innerHeight * 0.36
        );
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
        window.setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 700);
      }
    }

    narrationDirector.playBlock({
      block: activeBlock,
      sceneTheme: currentChapter.sceneTheme,
      muted: isMuted,
      onComplete: () => {
        if (safeBlockIndex + 1 < chapterBlocks.length) {
          setBlockIndex(safeBlockIndex + 1);
        } else {
          const nextChIdx = getNextChapterIndex(safeIndex, totalChapters);
          if (nextChIdx !== null) {
            setChapterDirection(1);
            setChapterIndex(nextChIdx);
            setBlockIndex(0);
            setChapterScrollProgress(0);
          } else {
            setIsPlaying(false);
          }
        }
      },
    });
  }, [
    isPlaying,
    activeBlock,
    safeBlockIndex,
    chapterBlocks.length,
    safeIndex,
    totalChapters,
    currentChapter.sceneTheme,
    isMuted,
    stageState.kind,
  ]);

  // Continuous Scroll-Linked Dual-Motif Morphing when user scrolls in Quiet Read mode
  useEffect(() => {
    if (stageState.kind !== 'scroll') return;

    let ticking = false;
    const handleScroll = () => {
      if (isPlaying || isProgrammaticScrollRef.current || ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const viewportCenterY = window.innerHeight * 0.44;
        const chapterEls = Array.from(
          document.querySelectorAll<HTMLElement>('[data-chapter-index]')
        );
        let closestChIdx = safeIndex;
        let minChDist = Infinity;
        let activeProgress = 0;

        for (const el of chapterEls) {
          const rect = el.getBoundingClientRect();
          const dist =
            rect.top <= viewportCenterY && rect.bottom >= viewportCenterY
              ? 0
              : Math.min(
                  Math.abs(rect.top - viewportCenterY),
                  Math.abs(rect.bottom - viewportCenterY)
                );
          if (dist < minChDist) {
            minChDist = dist;
            const parsed = Number(el.getAttribute('data-chapter-index'));
            if (!Number.isNaN(parsed)) {
              closestChIdx = parsed;
              const heightSpan = Math.max(1, rect.height);
              activeProgress = Math.max(
                0,
                Math.min(1, (viewportCenterY - rect.top) / heightSpan)
              );
            }
          }
        }

        setChapterScrollProgress(activeProgress);

        if (closestChIdx !== safeIndex) {
          setChapterDirection(
            getChapterTransitionDirection(safeIndex, closestChIdx)
          );
          setChapterIndex(closestChIdx);
          setBlockIndex(0);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stageState.kind, isPlaying, safeIndex]);

  // Keyboard navigation for left/right arrows & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'INPUT'
      ) {
        return;
      }
      if (e.key === 'Escape') {
        if (activeLexiconEntry) {
          setActiveLexiconEntry(null);
          return;
        }
        if (stageState.kind === 'behold') {
          setStageState((prev) =>
            transitionReaderStage(prev, { type: 'TOGGLE_BEHOLD' })
          );
          return;
        }
      }
      if (e.key === 'ArrowRight') {
        const next = getNextChapterIndex(safeIndex, totalChapters);
        if (next !== null) {
          handleGoToChapter(next);
        }
      } else if (e.key === 'ArrowLeft') {
        const prev = getPrevChapterIndex(safeIndex);
        if (prev !== null) {
          handleGoToChapter(prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeIndex, totalChapters, stageState.kind, activeLexiconEntry]);

  const handleGoToChapter = (idx: number, targetBlockIdx = 0) => {
    const clamped = clampChapterIndex(idx, totalChapters);
    setChapterDirection(getChapterTransitionDirection(safeIndex, clamped));
    setChapterIndex(clamped);
    setBlockIndex(targetBlockIdx);
    setChapterScrollProgress(0);
    setSurgeCount((c) => c + 1);
    setStageState((prev) =>
      transitionReaderStage(prev, { type: 'RESET_FOR_CHAPTER' })
    );

    if (stageState.kind === 'scroll' && typeof document !== 'undefined') {
      const chEl = document.querySelector<HTMLElement>(
        `[data-chapter-index="${clamped}"]`
      );
      if (chEl) {
        isProgrammaticScrollRef.current = true;
        chEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 850);
      }
    }
  };

  const handleSelectBlock = (chIdx: number, blockId: string) => {
    const clampedCh = clampChapterIndex(chIdx, totalChapters);
    const targetChapter = episode.chapters[clampedCh];
    const blocksForCh = buildChapterNarrationBlocks(targetChapter);
    const foundIdx = blocksForCh.findIndex((b) => b.id === blockId);

    setChapterDirection(getChapterTransitionDirection(safeIndex, clampedCh));
    setChapterIndex(clampedCh);
    setBlockIndex(foundIdx >= 0 ? foundIdx : 0);
    if (blocksForCh.length > 1 && foundIdx >= 0) {
      setChapterScrollProgress(foundIdx / (blocksForCh.length - 1));
    }
    setSurgeCount((c) => c + 1);

    if (!isPlaying && !isMuted && readerSettings.ambientAudioEnabled) {
      ambientSound.triggerLiturgicalBell(targetChapter.sceneTheme, true);
    }
  };

  const handleToggleParagraphHighlight = (
    chNumber: number,
    chTitle: string,
    paraIdx: number,
    text: string
  ) => {
    const key = `${episode.id}:ch-${chNumber}:p-${paraIdx}`;
    setHighlights((prev) => {
      const next = { ...prev };
      if (next[key] && next[key].color === activeInkColor) {
        delete next[key];
      } else {
        next[key] = {
          id: key,
          episodeId: episode.id,
          chapterNumber: chNumber,
          chapterTitle: chTitle,
          paragraphIndex: paraIdx,
          text,
          color: activeInkColor,
          personalNote: next[key]?.personalNote,
          createdAt: next[key]?.createdAt || new Date().toISOString(),
        };
      }
      saveStoredHighlights(next);
      return next;
    });
  };

  const handleToggleHighlight = (
    chNumber: number,
    chTitle: string,
    paraIdx: number,
    text: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    handleToggleParagraphHighlight(chNumber, chTitle, paraIdx, text);
  };

  const handleUpdateHighlightColor = (
    highlightId: string,
    color: HighlightInkColor
  ) => {
    setHighlights((prev) => {
      const existing = prev[highlightId];
      if (!existing) return prev;
      const next = {
        ...prev,
        [highlightId]: {
          ...existing,
          color,
        },
      };
      saveStoredHighlights(next);
      return next;
    });
  };

  const handleUpdateHighlightNote = (
    highlightId: string,
    personalNote: string
  ) => {
    setHighlights((prev) => {
      const existing = prev[highlightId];
      if (!existing) return prev;
      const next = {
        ...prev,
        [highlightId]: {
          ...existing,
          personalNote: personalNote || undefined,
        },
      };
      saveStoredHighlights(next);
      return next;
    });
  };

  const handleRemoveHighlight = (highlightId: string) => {
    setHighlights((prev) => {
      if (!prev[highlightId]) return prev;
      const next = { ...prev };
      delete next[highlightId];
      saveStoredHighlights(next);
      return next;
    });
  };

  const handlePrev = () => {
    const prev = getPrevChapterIndex(safeIndex);
    if (prev !== null) handleGoToChapter(prev);
  };

  const handleNext = () => {
    const next = getNextChapterIndex(safeIndex, totalChapters);
    if (next !== null) handleGoToChapter(next);
  };

  const proseClasses = getReaderProseClasses(readerSettings);
  const isScroll = stageState.kind === 'scroll';
  const isBehold = stageState.kind === 'behold';
  const activeDrawer =
    stageState.kind === 'behold' ? 'none' : stageState.activeDrawer ?? 'none';

  const isSoundCueActive = Boolean(
    isPlaying && activeBlock && activeBlock.kind === 'sound-cue'
  );

  const soundLayersSummary = ambientSound.getActiveLayersSummary(
    currentChapter.sceneTheme,
    currentAnimationConfig.motif
  );

  const episodeHighlights = useMemo(
    () =>
      (Object.values(highlights) as VerseHighlightRecord[]).filter(
        (h) => h.episodeId === episode.id
      ),
    [highlights, episode.id]
  );

  const renderInteractiveParagraphContent = (paraText: string) => {
    const tokens = tokenizeParagraphWithLexicon(paraText, lexiconLensActive);
    return tokens.map((token, idx) => {
      if (!token.entry) {
        return <React.Fragment key={idx}>{token.text}</React.Fragment>;
      }
      const entry = token.entry;
      return (
        <span
          key={`${entry.id}-${idx}`}
          role="button"
          tabIndex={0}
          data-testid={`lexicon-word-${entry.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setActiveLexiconEntry(entry);
            if (!isMuted && readerSettings.ambientAudioEnabled) {
              ambientSound.triggerLexiconPronunciationTone(
                entry.resonantFrequencyHz,
                true
              );
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              setActiveLexiconEntry(entry);
            }
          }}
          title={`${entry.originalScript} (${entry.transliteration}) — ${entry.primaryMeaning}`}
          className="inline-flex items-baseline gap-1 border-b border-dotted border-[#D4A853]/75 text-[#F7DF9C] hover:text-[#FFE9A8] hover:border-[#D4A853] transition-colors cursor-pointer px-0.5 rounded-sm hover:bg-[#D4A853]/12"
        >
          <span>{token.text}</span>
          <sup className="text-[0.58em] font-serif-editorial text-[#D4A853]/90 select-none">
            {entry.originalScript}
          </sup>
        </span>
      );
    });
  };

  return (
    <div
      data-state={stageState.kind}
      data-chapter={currentChapter.number}
      data-chapter-motif={currentAnimationConfig.motif}
      data-active-block={activeBlock?.id || ''}
      className="relative isolate min-h-[calc(100dvh-3.5rem)] text-[#FAF6EE]"
    >
      {/* Persistent Real-Time WebGL Backdrop & Continuous Scroll-Linked Dual-Motif Animation */}
      <LivingStoryCanvas
        theme={currentChapter.sceneTheme}
        canvasMode={currentChapter.canvasMode}
        episodeId={episode.id}
        chapterNumber={currentChapter.number}
        animationConfig={currentChapter.animationConfig}
        nextTheme={nextChapter?.sceneTheme}
        nextChapterNumber={nextChapter?.number}
        nextAnimationConfig={nextAnimationConfig}
        chapterScrollProgress={chapterScrollProgress}
        backgroundImageUrl={currentChapter.backgroundImageUrl}
        activeText={activeTextForShader}
        isSoundCueActive={isSoundCueActive}
        surgeCount={surgeCount}
        highContrast={readerSettings.highContrast}
        inspectionMode={isBehold}
        onPointerAudioRipple={(nx, ny, vel) => {
          if (!isMuted && readerSettings.ambientAudioEnabled) {
            ambientSound.triggerPointerRipple(
              nx,
              ny,
              vel,
              currentChapter.sceneTheme,
              true
            );
          }
        }}
        className="fixed inset-0 z-0"
      />

      {/* Top Atmospheric Fade Mask so scrolled Quiet Read prose dissolves cleanly beneath the top bar */}
      {!isBehold && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-32 z-20 pointer-events-none bg-gradient-to-b from-[#06080E] via-[#06080E]/80 to-transparent"
        />
      )}

      {/* Minimal, Sleek Stage Container */}
      <div className="relative z-10 max-w-[880px] mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-24">
        {/* Sticky Minimal Transparent Reader Header with Contemplative Study Controls */}
        <header className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-2.5 min-h-[54px] py-2.5 px-3.5 -mx-3 mb-8 md:mb-10 rounded-2xl bg-[#080B10]/80 backdrop-blur-xl border border-[#FAF6EE]/10">
          <button
            type="button"
            onClick={onBackToEpisodes}
            className="inline-flex items-center gap-2 text-[0.82rem] text-[#FAF6EE]/65 hover:text-[#D4A853] transition-colors shrink-0 min-h-[38px] px-1 cursor-pointer"
          >
            <PiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All episodes</span>
            <span className="sm:hidden">Episodes</span>
          </button>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Live Narration Status Cue */}
            <AnimatePresence mode="wait">
              {isPlaying && activeBlock && (
                <motion.div
                  key={`${activeBlock.kind}-${currentChapter.number}`}
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.28, ease: CINEMATIC_EASE }}
                  data-testid="narration-status-badge"
                  className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#D4A853]/12 border border-[#D4A853]/30 text-[#D4A853] text-[0.66rem] tracking-[0.15em] uppercase"
                >
                  <PiWaveform className="w-3.5 h-3.5 animate-pulse" />
                  <span>
                    {activeBlock.kind === 'sound-cue'
                      ? `Sound Cue · Ch ${formatChapterNumber(currentChapter.number)}`
                      : `Narrating · Ch ${formatChapterNumber(currentChapter.number)}`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Single Unified Visual Progress Indicator for Current Book & Collection */}
            <div
              data-testid="reader-completion-header"
              title={`${episode.title}: ${completionStats.episodePercent}% complete (${completionStats.episodeCompletedCount}/${completionStats.episodeTotalCount} chapters) · ${episode.series} Collection: ${completionStats.collectionPercent}% (${completionStats.collectionCompletedCount}/${completionStats.collectionTotalCount})`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/40 border border-[#FAF6EE]/10"
            >
              <span
                className="text-[0.66rem] tracking-[0.16em] uppercase font-medium whitespace-nowrap"
                style={{ color: episode.accentColor }}
              >
                {episode.code}
              </span>
              <div
                role="progressbar"
                aria-label={`${episode.title} completion`}
                aria-valuenow={completionStats.episodePercent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-10 sm:w-16 h-1 bg-[#FAF6EE]/15 rounded-full overflow-hidden shrink-0"
              >
                <motion.div
                  className="h-full bg-[#D4A853]"
                  initial={false}
                  animate={{ width: `${completionStats.episodePercent}%` }}
                  transition={{ duration: 0.55, ease: CINEMATIC_EASE }}
                />
              </div>
              <span className="font-mono-tabular text-[0.68rem] text-[#FAF6EE]/75 whitespace-nowrap">
                {completionStats.episodePercent}%
              </span>
            </div>

            {/* Hebrew/Greek Root Word Lexicon Lens Toggle */}
            <button
              type="button"
              data-testid="toggle-lexicon-lens"
              onClick={() => setLexiconLensActive((prev) => !prev)}
              aria-pressed={lexiconLensActive}
              title="Toggle inline Hebrew & Greek Root Word Lexicon Lens"
              className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-[0.68rem] tracking-[0.12em] uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                lexiconLensActive
                  ? 'border-[#D4A853]/45 bg-[#D4A853]/15 text-[#F5D78E]'
                  : 'border-[#FAF6EE]/10 bg-black/40 text-[#FAF6EE]/65 hover:text-[#FAF6EE]'
              }`}
            >
              <PiBookOpenText className="w-3.5 h-3.5 text-[#D4A853]" />
              <span className="hidden md:inline">Lexicon</span>
            </button>

            {/* Cross-Reference Theological Timeline Button */}
            <button
              type="button"
              data-testid="toggle-theological-timeline"
              onClick={() =>
                setStageState((prev) =>
                  transitionReaderStage(prev, {
                    type: 'TOGGLE_DRAWER',
                    drawer: 'timeline',
                  })
                )
              }
              title="Open Cross-Reference Theological Timeline across Scripture"
              className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-[0.68rem] tracking-[0.12em] uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeDrawer === 'timeline'
                  ? 'border-[#D4A853]/45 bg-[#D4A853]/15 text-[#F5D78E]'
                  : 'border-[#FAF6EE]/10 bg-black/40 text-[#FAF6EE]/70 hover:text-[#FAF6EE]'
              }`}
            >
              <PiGitCommit className="w-3.5 h-3.5 text-[#D4A853]" />
              <span className="hidden md:inline">Timeline</span>
            </button>

            {/* Liturgical Reflection Journal Button */}
            <button
              type="button"
              data-testid="toggle-reflection-journal"
              onClick={() =>
                setStageState((prev) =>
                  transitionReaderStage(prev, {
                    type: 'TOGGLE_DRAWER',
                    drawer: 'reflect',
                  })
                )
              }
              title="Open Liturgical Reflection Journal, Verse Highlights & Markdown Export"
              className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-[0.68rem] tracking-[0.12em] uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeDrawer === 'reflect'
                  ? 'border-[#D4A853]/45 bg-[#D4A853]/15 text-[#F5D78E]'
                  : 'border-[#FAF6EE]/10 bg-black/40 text-[#FAF6EE]/70 hover:text-[#FAF6EE]'
              }`}
            >
              <PiNotePencil className="w-3.5 h-3.5 text-[#D4A853]" />
              <span className="hidden md:inline">Journal</span>
              {episodeHighlights.length > 0 && (
                <span className="font-mono-tabular text-[0.62rem] text-[#D4A853]">
                  ({episodeHighlights.length})
                </span>
              )}
            </button>

            {/* Canvas Inspection Mode ("Contemplate Scene") Toggle */}
            <button
              type="button"
              data-testid="toggle-canvas-inspection"
              onClick={() =>
                setStageState((prev) =>
                  transitionReaderStage(prev, { type: 'TOGGLE_BEHOLD' })
                )
              }
              aria-pressed={isBehold}
              title={
                isBehold
                  ? 'Return to Scripture text'
                  : 'Contemplate Scene — Hide text and explore the interactive canvas'
              }
              className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-[0.68rem] tracking-[0.12em] uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                isBehold
                  ? 'border-[#D4A853] bg-[#D4A853] text-[#0A0A0A] font-semibold'
                  : 'border-[#FAF6EE]/10 bg-black/40 text-[#FAF6EE]/75 hover:text-[#FAF6EE]'
              }`}
            >
              <PiEye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isBehold ? 'Exit Scene' : 'Scene'}
              </span>
            </button>

            {/* Ambient Soundscape Toggle (for silent reading with generative foley + chords) */}
            <button
              type="button"
              data-testid="toggle-ambient-soundscape"
              onClick={() => {
                const nextState = !soundscapeActive;
                setSoundscapeActive(nextState);
                if (nextState) {
                  ambientSound.triggerLiturgicalBell(
                    currentChapter.sceneTheme,
                    true
                  );
                }
              }}
              aria-pressed={soundscapeActive || isPlaying}
              title={`4-Layer Generative Soundscape (${soundLayersSummary.foley} foley + ${soundLayersSummary.harmonicMode})`}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-[0.68rem] tracking-[0.12em] uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                soundscapeActive || isPlaying
                  ? 'border-[#D4A853]/45 bg-[#D4A853]/15 text-[#F5D78E]'
                  : 'border-[#FAF6EE]/10 bg-black/40 text-[#FAF6EE]/65 hover:text-[#FAF6EE]'
              }`}
            >
              <PiWaveform className="w-3.5 h-3.5 text-[#D4A853]" />
              <span className="hidden lg:inline capitalize">
                {soundLayersSummary.foley}
              </span>
            </button>

            {/* Quiet Read (Default) / Chapter Slides Toggle */}
            {!isBehold && (
              <button
                type="button"
                onClick={() =>
                  setStageState((prev) =>
                    transitionReaderStage(prev, {
                      type: 'SET_MODE',
                      mode: isScroll ? 'slides' : 'scroll',
                    })
                  )
                }
                aria-label={
                  isScroll
                    ? 'Switch to single chapter view'
                    : 'Switch to quiet scroll mode'
                }
                title={
                  isScroll
                    ? 'Switch to single chapter view'
                    : 'Switch to quiet scroll mode'
                }
                className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-[#FAF6EE]/10 bg-black/40 text-[0.68rem] tracking-[0.12em] uppercase text-[#FAF6EE]/75 hover:text-[#FAF6EE] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isScroll ? (
                  <>
                    <PiSlideshow className="w-3.5 h-3.5 text-[#D4A853]" />
                    <span className="hidden sm:inline">Chapters</span>
                  </>
                ) : (
                  <>
                    <PiArticle className="w-3.5 h-3.5 text-[#D4A853]" />
                    <span className="hidden sm:inline">Quiet Read</span>
                  </>
                )}
              </button>
            )}

            {/* Mute toggle when playing or soundscape active */}
            {(isPlaying || soundscapeActive) && (
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                className="w-9 h-9 rounded-full border border-[#FAF6EE]/15 bg-black/40 flex items-center justify-center text-[#D4A853] shrink-0 cursor-pointer"
              >
                {isMuted ? (
                  <PiSpeakerSlash className="w-4 h-4" />
                ) : (
                  <PiSpeakerHigh className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Primary Circular Gold Play/Pause Narrator Button */}
            <button
              type="button"
              onClick={() => {
                narrationDirector.unlockAudio();
                setIsPlaying((prev) => !prev);
              }}
              aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
              className="w-10 h-10 rounded-full bg-[#D4A853] hover:bg-[#E5BE6A] text-[#0A0A0A] flex items-center justify-center shadow-[0_8px_28px_rgba(212,168,83,0.3)] active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              {isPlaying ? (
                <PiPauseFill className="w-4 h-4" />
              ) : (
                <PiPlayFill className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
        </header>

        {/* CANVAS INSPECTION MODE ("CONTEMPLATE SCENE") FLOATING HUD */}
        <AnimatePresence mode="wait">
          {isBehold ? (
            <motion.div
              key="canvas-inspection-hud"
              data-testid="canvas-inspection-hud"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: CINEMATIC_EASE }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,680px)] rounded-2xl bg-[#080B10]/85 backdrop-blur-xl border border-[#D4A853]/35 p-4 sm:p-5 shadow-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[0.65rem] tracking-[0.2em] uppercase text-[#D4A853] mb-1">
                    <PiSparkle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Chapter {formatChapterNumber(currentChapter.number)} ·{' '}
                      {currentAnimationConfig.label}
                    </span>
                  </div>
                  <p className="font-serif-editorial text-lg text-[#FAF6EE] leading-snug">
                    {currentChapter.title}
                  </p>
                  <p className="text-xs text-[#FAF6EE]/55 mt-1">
                    Drag or click anywhere on the living canvas to stir the
                    elements &amp; stereo harp ripples.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={safeIndex === 0}
                    aria-label="Previous chapter scene"
                    className="w-9 h-9 rounded-full border border-[#FAF6EE]/15 bg-black/50 flex items-center justify-center text-[#FAF6EE]/80 hover:border-[#D4A853] disabled:opacity-30 cursor-pointer"
                  >
                    <PiCaretLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={safeIndex >= totalChapters - 1}
                    aria-label="Next chapter scene"
                    className="w-9 h-9 rounded-full border border-[#FAF6EE]/15 bg-black/50 flex items-center justify-center text-[#FAF6EE]/80 hover:border-[#D4A853] disabled:opacity-30 cursor-pointer"
                  >
                    <PiCaretRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    data-testid="ring-sanctuary-bell"
                    onClick={() => {
                      setSurgeCount((c) => c + 1);
                      ambientSound.triggerLiturgicalBell(
                        currentChapter.sceneTheme,
                        true
                      );
                    }}
                    className="min-h-[36px] px-3 py-1.5 rounded-full border border-[#D4A853]/40 bg-[#D4A853]/15 text-[#F5D78E] text-xs flex items-center gap-1.5 hover:bg-[#D4A853]/25 transition-colors cursor-pointer"
                  >
                    <PiBellRinging className="w-3.5 h-3.5" />
                    <span>Sanctuary Bell</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStageState((prev) =>
                        transitionReaderStage(prev, { type: 'TOGGLE_BEHOLD' })
                      )
                    }
                    className="min-h-[36px] px-4 py-1.5 rounded-full bg-[#D4A853] text-[#0A0A0A] text-xs font-semibold tracking-wider uppercase hover:bg-[#E5BE6A] transition-colors cursor-pointer"
                  >
                    Return to Text
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* STANDARD PROSE STAGE (QUIET READ OR CHAPTER SLIDES) */
            <motion.div
              key={`${episode.id}-${stageState.kind}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.48, ease: CINEMATIC_EASE }}
            >
              {isScroll ? (
                /* DEFAULT VIEW: QUIET READ CONTINUOUS AUTO-SCROLLING STAGE */
                <div className="max-w-[740px] mx-auto w-full py-2">
                  {/* Episode Title Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.46, ease: CINEMATIC_EASE }}
                    className="mb-12 pb-8 border-b border-[#FAF6EE]/10"
                  >
                    <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#D4A853] mb-2">
                      {episode.series} · {episode.code} · {episode.bookRef}
                    </p>
                    <h1 className="font-serif-editorial text-3xl sm:text-5xl text-[#FAF6EE] font-semibold mb-3 text-balance">
                      {episode.fullTitle}
                    </h1>
                    <p className="font-serif-editorial italic text-base sm:text-lg text-[#FAF6EE]/55 leading-relaxed">
                      {episode.summary}
                    </p>
                  </motion.div>

                  {/* Flowing Chapters with Sound-Cue, Lexicon Lens & Paragraph Highlighting */}
                  <div className="space-y-16">
                    {episode.chapters.map((ch, chIdx) => {
                      const isCurrentCh = chIdx === safeIndex;
                      const chVisualSpec =
                        ch.animationConfig ||
                        getChapterVisualSpec(
                          episode.id,
                          ch.number,
                          ch.sceneTheme,
                          ch.canvasMode
                        );
                      const chParas =
                        ch.paragraphs && ch.paragraphs.length > 0
                          ? ch.paragraphs
                          : [ch.narrative];
                      const soundCueId = `ch-${ch.number}-sound-cue`;
                      const quoteId = `ch-${ch.number}-hebrew-quote`;
                      const isSoundCueHighlighted =
                        isCurrentCh && activeBlock?.id === soundCueId;
                      const isQuoteHighlighted =
                        isCurrentCh && activeBlock?.id === quoteId;

                      return (
                        <motion.section
                          key={ch.number}
                          data-chapter-index={chIdx}
                          data-chapter-scene={chVisualSpec.motif}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{
                            opacity: isPlaying && !isCurrentCh ? 0.55 : 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.45,
                            delay: Math.min(chIdx * 0.035, 0.2),
                            ease: CINEMATIC_EASE,
                          }}
                          className="pb-14 border-b border-[#FAF6EE]/10 last:border-b-0"
                        >
                          {/* Chapter Header + Interactive Chapter Visual Construction Trigger */}
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                            <div className="flex items-baseline gap-3">
                              <span
                                className={`font-serif-editorial text-2xl md:text-3xl transition-colors duration-500 ${
                                  isCurrentCh
                                    ? 'text-[#D4A853]'
                                    : 'text-[#FAF6EE]/35'
                                }`}
                              >
                                {formatChapterNumber(ch.number)}
                              </span>
                              <span
                                className={`text-[0.7rem] tracking-[0.2em] uppercase transition-colors duration-500 ${
                                  isCurrentCh
                                    ? 'text-[#D4A853]/90'
                                    : 'text-[#FAF6EE]/35'
                                }`}
                              >
                                Chapter {ch.number} of {totalChapters} ·{' '}
                                {ch.title}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                handleGoToChapter(chIdx);
                                setSurgeCount((c) => c + 1);
                              }}
                              title={
                                chVisualSpec.description || chVisualSpec.label
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.66rem] tracking-[0.12em] uppercase border transition-all cursor-pointer ${
                                isCurrentCh
                                  ? 'bg-[#D4A853]/12 border-[#D4A853]/35 text-[#D4A853]'
                                  : 'bg-black/25 border-[#FAF6EE]/10 text-[#FAF6EE]/45 hover:text-[#FAF6EE]/80'
                              }`}
                            >
                              <PiSparkle className="w-3 h-3 shrink-0" />
                              <span>{chVisualSpec.label}</span>
                            </button>
                          </div>

                          {isCurrentCh && chVisualSpec.description && (
                            <p
                              data-testid="active-chapter-animation-desc"
                              className="text-[0.76rem] text-[#FAF6EE]/48 italic mb-5"
                            >
                              Scene Animation · {chVisualSpec.description}
                            </p>
                          )}

                          {/* Atmospheric Sound Cue */}
                          {ch.soundCue && (
                            <div
                              data-narration-id={soundCueId}
                              onClick={() => handleSelectBlock(chIdx, soundCueId)}
                              className={`my-7 text-center py-3 px-4 rounded-xl transition-all duration-700 cursor-pointer ${
                                isSoundCueHighlighted
                                  ? 'bg-[#D4A853]/10 border border-[#D4A853]/30 shadow-[0_0_32px_rgba(212,168,83,0.12)]'
                                  : 'border border-transparent hover:border-[#FAF6EE]/10'
                              }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`mx-auto mb-3 block h-1.5 w-1.5 rotate-45 transition-all duration-500 ${
                                  isSoundCueHighlighted
                                    ? 'bg-[#D4A853] scale-125'
                                    : 'bg-[#D4A853]/65'
                                }`}
                              />
                              <p
                                className={`font-serif-editorial italic font-light text-[1.02rem] md:text-[1.12rem] leading-[1.7] max-w-[560px] mx-auto transition-colors duration-500 ${
                                  isSoundCueHighlighted
                                    ? 'text-[#D4A853]'
                                    : 'text-[#FAF6EE]/55'
                                }`}
                              >
                                [{ch.soundCue}]
                              </p>
                            </div>
                          )}

                          {/* Unboxed Sacred Hebrew Pull-Quote */}
                          {ch.hebrewQuote && (
                            <blockquote
                              data-narration-id={quoteId}
                              onClick={() => handleSelectBlock(chIdx, quoteId)}
                              className={`my-7 py-3 pl-4 border-y transition-all duration-500 cursor-pointer ${
                                isQuoteHighlighted
                                  ? 'border-[#D4A853]/50 bg-[#D4A853]/8'
                                  : 'border-[#FAF6EE]/10 hover:border-[#FAF6EE]/20'
                              }`}
                            >
                              <p
                                className={`font-serif-editorial text-[1.35rem] md:text-[1.6rem] leading-[1.5] transition-colors duration-500 ${
                                  isQuoteHighlighted
                                    ? 'text-[#D4A853]'
                                    : 'text-[#FAF6EE]/92'
                                }`}
                              >
                                {ch.hebrewQuote}
                              </p>
                              {ch.hebrewTranslation && (
                                <p className="font-serif-editorial font-light text-[1rem] text-[#FAF6EE]/55 mt-1.5 italic leading-relaxed">
                                  “{ch.hebrewTranslation}”
                                </p>
                              )}
                            </blockquote>
                          )}

                          {/* Poetic Narrative Paragraphs with Lexicon Lens & Verse Highlighting */}
                          <div className="space-y-6 mt-5">
                            {chParas.map((p, pIdx) => {
                              const paraId = `ch-${ch.number}-para-${pIdx}`;
                              const isParaActive =
                                isCurrentCh && activeBlock?.id === paraId;
                              const hlKey = `${episode.id}:ch-${ch.number}:p-${pIdx}`;
                              const hlRecord = highlights[hlKey];
                              const hlStyle = hlRecord
                                ? HIGHLIGHT_INK_STYLES[hlRecord.color]
                                : null;

                              return (
                                <div
                                  key={pIdx}
                                  className={`group relative rounded-r-xl transition-all duration-500 ${
                                    hlStyle ? `${hlStyle.bg} py-2 pr-3` : ''
                                  }`}
                                >
                                  <p
                                    data-narration-id={paraId}
                                    onClick={() =>
                                      handleSelectBlock(chIdx, paraId)
                                    }
                                    className={`${proseClasses} font-medium transition-all duration-500 text-balance cursor-pointer pl-3 border-l-2 ${
                                      isParaActive
                                        ? 'border-[#D4A853] text-[#FAF6EE]'
                                        : hlStyle
                                          ? `${hlStyle.border} text-[#FAF6EE]`
                                          : 'border-transparent text-[#FAF6EE]/82 hover:text-[#FAF6EE]'
                                    }`}
                                  >
                                    {renderInteractiveParagraphContent(p)}
                                  </p>

                                  {hlRecord?.personalNote && (
                                    <p className="mt-1.5 pl-3 text-xs italic text-[#D4A853]/90 font-serif-editorial">
                                      Marginalia: “{hlRecord.personalNote}”
                                    </p>
                                  )}

                                  {/* Subtle Margin Verse Highlight Button */}
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleToggleHighlight(
                                        ch.number,
                                        ch.title,
                                        pIdx,
                                        p,
                                        e
                                      )
                                    }
                                    aria-label={
                                      hlRecord
                                        ? 'Remove passage highlight'
                                        : 'Highlight passage in study journal'
                                    }
                                    title={
                                      hlRecord
                                        ? 'Highlighted in Study Journal (click to remove)'
                                        : 'Highlight passage for Study Journal'
                                    }
                                    className={`absolute -left-7 top-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-opacity cursor-pointer ${
                                      hlRecord
                                        ? 'opacity-100 text-[#D4A853]'
                                        : 'opacity-0 group-hover:opacity-70 hover:!opacity-100 text-[#FAF6EE]/50'
                                    }`}
                                  >
                                    {hlRecord ? (
                                      <PiBookmarkSimpleFill className="w-3.5 h-3.5" />
                                    ) : (
                                      <PiBookmarkSimple className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Chapter Reflect & Study Actions */}
                          <div className="mt-6 pl-3 flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setChapterDirection(
                                  getChapterTransitionDirection(safeIndex, chIdx)
                                );
                                setChapterIndex(chIdx);
                                setStageState((prev) =>
                                  transitionReaderStage(prev, {
                                    type: 'TOGGLE_DRAWER',
                                    drawer: 'reflect',
                                  })
                                );
                              }}
                              className="inline-flex items-center gap-2 px-4 min-h-[38px] py-1.5 rounded-full text-[0.8rem] transition-all duration-300 cursor-pointer group"
                              style={{
                                backgroundColor: `${episode.accentColor}18`,
                                color: episode.accentColor,
                              }}
                            >
                              <PiSparkle className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                              <span>Reflect &amp; Journal</span>
                            </button>
                          </div>
                        </motion.section>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* VIEW 2: SINGLE CHAPTER-BY-CHAPTER STAGE WITH CINEMATIC DIRECTIONAL PAGE TRANSITIONS */
                <div
                  onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                  onTouchEnd={(e) => {
                    if (touchStartX === null) return;
                    const deltaX = e.changedTouches[0].clientX - touchStartX;
                    if (deltaX < -50) handleNext();
                    if (deltaX > 50) handlePrev();
                    setTouchStartX(null);
                  }}
                  className="w-full"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.article
                      key={`${episode.id}-ch-${currentChapter.number}`}
                      initial={{
                        opacity: 0,
                        x: chapterDirection * 32,
                        y: 6,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        x: chapterDirection * -32,
                        y: -6,
                      }}
                      transition={{
                        duration: 0.36,
                        ease: CINEMATIC_EASE,
                      }}
                      data-testid="chapter-transition-stage"
                      className="w-full max-w-[760px] mx-auto px-1 md:px-4 py-2"
                    >
                      {/* Chapter Number, Counter & Bespoke Animated Scene Motif */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-baseline gap-3">
                          <span
                            aria-hidden="true"
                            className={`font-serif-editorial leading-none select-none transition-all duration-500 ${
                              isPlaying
                                ? 'text-[2.4rem] md:text-[2.8rem] text-[#D4A853]/90'
                                : 'text-[2.2rem] md:text-[2.5rem] text-[#FAF6EE]/20'
                            }`}
                          >
                            {formatChapterNumber(currentChapter.number)}
                          </span>
                          <span
                            className={`text-[0.7rem] tracking-[0.2em] uppercase ${
                              isPlaying ? 'text-[#D4A853]' : 'text-[#FAF6EE]/35'
                            }`}
                          >
                            Chapter {currentChapter.number} of {totalChapters} ·{' '}
                            {currentChapter.title}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSurgeCount((c) => c + 1)}
                          title={
                            currentAnimationConfig.description ||
                            currentAnimationConfig.label
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.66rem] tracking-[0.12em] uppercase bg-[#D4A853]/12 border border-[#D4A853]/35 text-[#D4A853] cursor-pointer"
                        >
                          <PiSparkle className="w-3 h-3 shrink-0" />
                          <span>{currentAnimationConfig.label}</span>
                        </button>
                      </div>

                      {currentAnimationConfig.description && (
                        <p
                          data-testid="active-chapter-animation-desc"
                          className="text-[0.76rem] text-[#FAF6EE]/48 italic mb-5"
                        >
                          Scene Animation · {currentAnimationConfig.description}
                        </p>
                      )}

                      {/* Atmospheric Stage Direction Cue */}
                      {currentChapter.soundCue && (
                        <div
                          data-narration-id={`ch-${currentChapter.number}-sound-cue`}
                          onClick={() =>
                            handleSelectBlock(
                              safeIndex,
                              `ch-${currentChapter.number}-sound-cue`
                            )
                          }
                          className={`my-8 md:my-10 text-center py-3 px-4 rounded-xl transition-all duration-500 cursor-pointer ${
                            activeBlock?.kind === 'sound-cue'
                              ? 'bg-[#D4A853]/10 border border-[#D4A853]/30'
                              : 'border border-transparent'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className="mx-auto mb-4 block h-1.5 w-1.5 rotate-45 bg-[#D4A853]/70"
                          />
                          <p
                            className={`font-serif-editorial italic font-light text-[1.02rem] md:text-[1.12rem] leading-[1.7] max-w-[560px] mx-auto transition-colors duration-500 ${
                              activeBlock?.kind === 'sound-cue'
                                ? 'text-[#D4A853]'
                                : 'text-[#FAF6EE]/55'
                            }`}
                          >
                            [{currentChapter.soundCue}]
                          </p>
                        </div>
                      )}

                      {/* Unboxed Sacred Hebrew Pull-Quote */}
                      {currentChapter.hebrewQuote && (
                        <blockquote
                          data-narration-id={`ch-${currentChapter.number}-hebrew-quote`}
                          onClick={() =>
                            handleSelectBlock(
                              safeIndex,
                              `ch-${currentChapter.number}-hebrew-quote`
                            )
                          }
                          className={`my-7 py-2 pl-4 border-y transition-all duration-500 cursor-pointer ${
                            activeBlock?.kind === 'hebrew-quote'
                              ? 'border-[#D4A853]/50 bg-[#D4A853]/8'
                              : 'border-[#FAF6EE]/10'
                          }`}
                        >
                          <p
                            className={`font-serif-editorial text-[1.35rem] md:text-[1.6rem] leading-[1.5] ${
                              activeBlock?.kind === 'hebrew-quote'
                                ? 'text-[#D4A853]'
                                : 'text-[#FAF6EE]/92'
                            }`}
                          >
                            {currentChapter.hebrewQuote}
                          </p>
                          {currentChapter.hebrewTranslation && (
                            <p className="font-serif-editorial font-light text-[1rem] text-[#FAF6EE]/55 mt-2 italic leading-relaxed">
                              “{currentChapter.hebrewTranslation}”
                            </p>
                          )}
                        </blockquote>
                      )}

                      {/* Poetic Narrative Paragraphs */}
                      <div className="mt-6">
                        {paragraphs.map((para, idx) => {
                          const paraId = `ch-${currentChapter.number}-para-${idx}`;
                          const isActivePara = activeBlock?.id === paraId;
                          const hlKey = `${episode.id}:ch-${currentChapter.number}:p-${idx}`;
                          const hlRecord = highlights[hlKey];
                          const hlStyle = hlRecord
                            ? HIGHLIGHT_INK_STYLES[hlRecord.color]
                            : null;

                          return (
                            <div
                              key={idx}
                              className={`group relative mb-6 last:mb-0 rounded-r-xl ${
                                hlStyle ? `${hlStyle.bg} py-2 pr-3` : ''
                              }`}
                            >
                              <p
                                data-narration-id={paraId}
                                onClick={() => handleSelectBlock(safeIndex, paraId)}
                                className={`${proseClasses} font-medium transition-all duration-500 text-balance cursor-pointer pl-3 border-l-2 ${
                                  isActivePara
                                    ? 'border-[#D4A853] text-[#FAF6EE]'
                                    : hlStyle
                                      ? `${hlStyle.border} text-[#FAF6EE]`
                                      : 'border-transparent text-[#FAF6EE]/85 hover:text-[#FAF6EE]'
                                }`}
                              >
                                {renderInteractiveParagraphContent(para)}
                              </p>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleToggleHighlight(
                                    currentChapter.number,
                                    currentChapter.title,
                                    idx,
                                    para,
                                    e
                                  )
                                }
                                aria-label={
                                  hlRecord
                                    ? 'Remove passage highlight'
                                    : 'Highlight passage in study journal'
                                }
                                className={`absolute -left-7 top-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-opacity cursor-pointer ${
                                  hlRecord
                                    ? 'opacity-100 text-[#D4A853]'
                                    : 'opacity-0 group-hover:opacity-70 hover:!opacity-100 text-[#FAF6EE]/50'
                                }`}
                              >
                                {hlRecord ? (
                                  <PiBookmarkSimpleFill className="w-3.5 h-3.5" />
                                ) : (
                                  <PiBookmarkSimple className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Single Quiet Reflect Button */}
                      <div className="mt-6 pl-3">
                        <button
                          type="button"
                          onClick={() =>
                            setStageState((prev) =>
                              transitionReaderStage(prev, {
                                type: 'TOGGLE_DRAWER',
                                drawer: 'reflect',
                              })
                            )
                          }
                          className="inline-flex items-center gap-2 mt-4 px-5 min-h-[44px] py-2 rounded-full text-[0.85rem] transition-all duration-300 cursor-pointer group"
                          style={{
                            backgroundColor: `${episode.accentColor}18`,
                            color: episode.accentColor,
                          }}
                        >
                          <PiSparkle className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
                          <span>Reflect &amp; Journal</span>
                        </button>
                      </div>
                    </motion.article>
                  </AnimatePresence>

                  {/* Minimal Chapter Dots Scrubber (Desktop) */}
                  <div className="hidden md:flex items-center justify-center gap-1 mt-8">
                    <div
                      role="tablist"
                      aria-label="Chapters"
                      className="flex items-center justify-center"
                    >
                      {episode.chapters.map((ch, idx) => {
                        const isSelected = idx === safeIndex;
                        return (
                          <button
                            key={ch.number}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            aria-label={`Go to chapter ${ch.number}`}
                            onClick={() => handleGoToChapter(idx)}
                            className="min-w-[36px] min-h-[44px] flex items-center justify-center cursor-pointer bg-transparent p-0"
                          >
                            <span
                              aria-hidden="true"
                              className={`block h-1.5 rounded-full transition-all duration-300 ${
                                isSelected
                                  ? 'w-7 bg-[#D4A853]'
                                  : 'w-1.5 bg-[#FAF6EE]/25 hover:bg-[#FAF6EE]/50'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Non-Overlapping Mobile Chapter Navigation Bar */}
                  <div className="flex md:hidden items-center justify-between gap-3 mt-10 pt-4 border-t border-[#FAF6EE]/10">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={safeIndex === 0}
                      aria-label="Previous chapter"
                      className={`min-h-[44px] px-4 py-2 rounded-full border border-[#FAF6EE]/15 bg-black/40 backdrop-blur-md flex items-center gap-1.5 text-xs text-[#FAF6EE]/80 transition-all cursor-pointer ${
                        safeIndex === 0
                          ? 'opacity-25 pointer-events-none'
                          : 'active:scale-95'
                      }`}
                    >
                      <PiCaretLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <span className="text-[0.68rem] tracking-[0.2em] uppercase text-[#FAF6EE]/50 font-mono-tabular">
                      {currentChapter.number} / {totalChapters}
                    </span>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={safeIndex >= totalChapters - 1}
                      aria-label="Next chapter"
                      className={`min-h-[44px] px-4 py-2 rounded-full border border-[#FAF6EE]/15 bg-black/40 backdrop-blur-md flex items-center gap-1.5 text-xs text-[#FAF6EE]/80 transition-all cursor-pointer ${
                        safeIndex >= totalChapters - 1
                          ? 'opacity-25 pointer-events-none'
                          : 'active:scale-95'
                      }`}
                    >
                      <span>Next</span>
                      <PiCaretRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Desktop Left/Right Chapter Navigation Arrows */}
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={safeIndex === 0}
                    aria-label="Previous chapter"
                    className={`hidden md:flex fixed left-[max(0.75rem,calc(50%-480px))] top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full items-center justify-center border border-[#FAF6EE]/15 text-[#FAF6EE]/70 hover:text-[#FAF6EE] hover:border-[#D4A853]/50 hover:bg-black/60 transition-all cursor-pointer bg-black/40 backdrop-blur-md ${
                      safeIndex === 0 ? 'opacity-25 cursor-not-allowed' : ''
                    }`}
                  >
                    <PiCaretLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={safeIndex >= totalChapters - 1}
                    aria-label="Next chapter"
                    className={`hidden md:flex fixed right-[max(0.75rem,calc(50%-480px))] top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full items-center justify-center border border-[#FAF6EE]/15 text-[#FAF6EE]/70 hover:text-[#FAF6EE] hover:border-[#D4A853]/50 hover:bg-black/60 transition-all cursor-pointer bg-black/40 backdrop-blur-md ${
                      safeIndex >= totalChapters - 1
                        ? 'opacity-25 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <PiCaretRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Next Episode Card */}
              {nextEpisode && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: CINEMATIC_EASE }}
                  className="relative z-10 mt-16 md:mt-24 pb-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-5 rounded-2xl overflow-hidden bg-black/40 hover:bg-black/60 transition-all duration-500 border border-[#FAF6EE]/10 hover:border-[#FAF6EE]/20 p-5 md:p-8 backdrop-blur-md">
                    <div className="flex-1 min-w-0">
                      <span className="block text-[0.68rem] tracking-[0.2em] uppercase text-[#FAF6EE]/35 mb-2">
                        Next Episode
                      </span>
                      <span className="block text-[0.68rem] tracking-[0.2em] uppercase text-[#D4A853]/70">
                        {nextEpisode.series} · {nextEpisode.code}
                      </span>
                      <span className="block font-serif-editorial font-semibold text-[1.4rem] md:text-[1.9rem] text-[#FAF6EE] mt-2 leading-[1.15] text-balance">
                        {nextEpisode.fullTitle}
                      </span>
                      <span className="block text-[0.92rem] text-[#FAF6EE]/50 mt-2 line-clamp-2">
                        {nextEpisode.summary}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectEpisode(nextEpisode.id, 0)}
                      className="inline-flex w-full md:w-auto items-center justify-center gap-2 font-medium text-[0.95rem] text-[#0A0A0A] bg-[#D4A853] min-h-[52px] px-8 py-4 rounded-full hover:bg-[#E5BE6A] active:scale-[0.98] transition-all duration-300 shrink-0 cursor-pointer"
                    >
                      <PiPlayFill className="w-4 h-4" />
                      <span>Continue</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FLOATING HEBREW & GREEK ROOT WORD LEXICON LENS MODAL */}
      <AnimatePresence>
        {activeLexiconEntry && (
          <motion.div
            key="lexicon-entry-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={`Lexicon study: ${activeLexiconEntry.transliteration}`}
            data-testid="lexicon-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveLexiconEntry(null);
              }
            }}
            className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.32, ease: CINEMATIC_EASE }}
              className="relative w-full max-w-[540px] rounded-2xl p-6 sm:p-8 bg-[#0C0F17] border border-[#D4A853]/40 shadow-2xl overflow-hidden"
            >
              <button
                type="button"
                aria-label="Close lexicon card"
                onClick={() => setActiveLexiconEntry(null)}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#FAF6EE]/10 text-[#FAF6EE]/65 hover:text-[#FAF6EE] cursor-pointer"
              >
                <PiX className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-[0.68rem] tracking-[0.2em] uppercase text-[#D4A853] mb-3">
                <span>{activeLexiconEntry.language} Root Lexicon</span>
                <span>·</span>
                <span className="font-mono-tabular">
                  Strong’s {activeLexiconEntry.strongsNumber}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-4 pb-5 border-b border-[#FAF6EE]/10">
                <div>
                  <div className="font-serif-editorial text-4xl sm:text-5xl text-[#F5D78E] mb-1">
                    {activeLexiconEntry.originalScript}
                  </div>
                  <div className="font-serif-editorial text-xl text-[#FAF6EE]">
                    {activeLexiconEntry.transliteration}{' '}
                    <span className="text-sm text-[#FAF6EE]/50 italic">
                      ({activeLexiconEntry.pronunciation})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    ambientSound.triggerLexiconPronunciationTone(
                      activeLexiconEntry.resonantFrequencyHz,
                      true
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#D4A853]/15 border border-[#D4A853]/40 text-[#F5D78E] text-xs hover:bg-[#D4A853]/25 transition-colors cursor-pointer"
                >
                  <PiSpeakerHigh className="w-3.5 h-3.5" />
                  <span>Resonant Tone</span>
                </button>
              </div>

              <div className="space-y-4 mt-5">
                <div>
                  <span className="block text-[0.66rem] tracking-[0.18em] uppercase text-[#FAF6EE]/45 mb-1">
                    Primary Meaning
                  </span>
                  <p className="font-serif-editorial text-lg text-[#FAF6EE]">
                    {activeLexiconEntry.primaryMeaning}
                  </p>
                </div>

                <div>
                  <span className="block text-[0.66rem] tracking-[0.18em] uppercase text-[#FAF6EE]/45 mb-1">
                    Ancient Root Metaphor
                  </span>
                  <p className="text-sm text-[#FAF6EE]/80 leading-relaxed">
                    {activeLexiconEntry.literalMetaphor}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#D4A853]/8 border border-[#D4A853]/25">
                  <span className="block text-[0.64rem] tracking-[0.18em] uppercase text-[#D4A853] mb-1">
                    Contemplative Commentary
                  </span>
                  <p className="font-serif-editorial italic text-[0.98rem] text-[#FAF6EE]/90 leading-relaxed">
                    {activeLexiconEntry.contemplativeNote}
                  </p>
                </div>
              </div>

              {/* Quick Root Word Switcher */}
              <div className="mt-6 pt-4 border-t border-[#FAF6EE]/10">
                <span className="block text-[0.62rem] tracking-[0.18em] uppercase text-[#FAF6EE]/40 mb-2">
                  Explore Sacred Roots in This Collection
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {LEXICON_ENTRIES.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveLexiconEntry(item)}
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                        item.id === activeLexiconEntry.id
                          ? 'bg-[#D4A853] text-[#0A0A0A] font-medium'
                          : 'bg-[#FAF6EE]/8 text-[#FAF6EE]/70 hover:text-[#FAF6EE]'
                      }`}
                    >
                      {item.transliteration} ({item.originalScript})
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CROSS-REFERENCE THEOLOGICAL TIMELINE MODAL */}
      <AnimatePresence>
        {activeDrawer === 'timeline' && (
          <motion.div
            key="timeline-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Cross-Reference Theological Timeline"
            data-testid="theological-timeline-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: CINEMATIC_EASE }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setStageState((prev) =>
                  transitionReaderStage(prev, {
                    type: 'TOGGLE_DRAWER',
                    drawer: 'timeline',
                  })
                );
              }
            }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.36, ease: CINEMATIC_EASE }}
              className="relative w-full max-w-[780px] max-h-[86vh] overflow-y-auto rounded-2xl p-6 sm:p-8 bg-[#0A0D14] border border-[#D4A853]/35 shadow-2xl"
            >
              <button
                type="button"
                aria-label="Close theological timeline"
                onClick={() =>
                  setStageState((prev) =>
                    transitionReaderStage(prev, {
                      type: 'TOGGLE_DRAWER',
                      drawer: 'timeline',
                    })
                  )
                }
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#FAF6EE]/10 text-[#FAF6EE]/65 hover:text-[#FAF6EE] cursor-pointer"
              >
                <PiX className="w-4 h-4" />
              </button>

              <div className="mb-6">
                <p className="text-[0.68rem] tracking-[0.2em] uppercase text-[#D4A853] mb-1">
                  Canonical Architecture · Cross-Reference Timeline
                </p>
                <h2 className="font-serif-editorial text-2xl sm:text-3xl text-[#FAF6EE]">
                  Thematic Threads Across Scripture
                </h2>
                <p className="text-sm text-[#FAF6EE]/60 mt-1">
                  Trace how each visual motif in Genesis echoes across the Old
                  and New Testaments. Select any node to jump directly to that
                  chapter’s living scene.
                </p>
              </div>

              <div className="space-y-6">
                {THEOLOGICAL_THREADS.map((thread) => (
                  <div
                    key={thread.id}
                    className="rounded-xl p-4 sm:p-5 bg-black/45 border border-[#FAF6EE]/10"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <h3 className="font-serif-editorial text-xl text-[#FAF6EE]">
                        {thread.title}
                      </h3>
                      <span
                        className="text-xs font-serif-editorial px-2.5 py-0.5 rounded-full border"
                        style={{
                          color: thread.accentColor,
                          borderColor: `${thread.accentColor}40`,
                          backgroundColor: `${thread.accentColor}12`,
                        }}
                      >
                        {thread.hebrewAnchor}
                      </span>
                    </div>
                    <p className="text-xs text-[#FAF6EE]/55 mb-4">
                      {thread.subtitle}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {thread.nodes.map((node) => {
                        const isHere =
                          node.episodeId === episode.id &&
                          node.chapterNumber === currentChapter.number;
                        return (
                          <button
                            key={`${node.episodeId}-${node.chapterNumber}`}
                            type="button"
                            onClick={() => {
                              setStageState((prev) =>
                                transitionReaderStage(prev, {
                                  type: 'TOGGLE_DRAWER',
                                  drawer: 'timeline',
                                })
                              );
                              if (node.episodeId === episode.id) {
                                handleGoToChapter(node.chapterIndex);
                              } else {
                                onSelectEpisode(
                                  node.episodeId,
                                  node.chapterIndex
                                );
                              }
                            }}
                            className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                              isHere
                                ? 'bg-[#D4A853]/15 border-[#D4A853] shadow-[0_0_20px_rgba(212,168,83,0.15)]'
                                : 'bg-[#0E131D]/80 border-[#FAF6EE]/10 hover:border-[#D4A853]/45'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[0.65rem] tracking-[0.14em] uppercase text-[#D4A853] mb-1">
                              <span>{node.scripturalRef}</span>
                              <span>{node.motifName}</span>
                            </div>
                            <div className="font-serif-editorial text-base text-[#FAF6EE] font-medium">
                              {node.title}
                            </div>
                            <p className="text-xs text-[#FAF6EE]/55 mt-1 line-clamp-2">
                              {node.summary}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#FAF6EE]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="text-[#D4A853] font-medium">
                        Canonical Fulfillment ({thread.canonicalEcho.ref}):
                      </span>
                      <span className="text-[#FAF6EE]/65 italic">
                        {thread.canonicalEcho.fulfillment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LITURGICAL REFLECTION JOURNAL WITH LECTIO DIVINA, VERSE HIGHLIGHTS & EXPORT */}
      <LiturgicalReflectionJournal
        isOpen={activeDrawer === 'reflect'}
        episode={episode}
        currentChapter={currentChapter}
        activeInkColor={activeInkColor}
        onSelectInkColor={setActiveInkColor}
        highlights={highlights}
        onToggleParagraphHighlight={handleToggleParagraphHighlight}
        onUpdateHighlightColor={handleUpdateHighlightColor}
        onUpdateHighlightNote={handleUpdateHighlightNote}
        onRemoveHighlight={handleRemoveHighlight}
        reflectionNotes={reflectionNotes}
        onSaveReflection={onSaveReflection}
        onNavigateToChapter={(chIdx, paraIdx) => {
          if (paraIdx !== undefined) {
            const targetChapter = episode.chapters[chIdx];
            if (targetChapter) {
              handleSelectBlock(
                chIdx,
                `ch-${targetChapter.number}-para-${paraIdx}`
              );
              return;
            }
          }
          handleGoToChapter(chIdx);
        }}
        onClose={() =>
          setStageState((prev) =>
            transitionReaderStage(prev, {
              type: 'TOGGLE_DRAWER',
              drawer: 'reflect',
            })
          )
        }
      />
    </div>
  );
};
