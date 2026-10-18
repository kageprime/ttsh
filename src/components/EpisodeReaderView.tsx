import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PiArrowLeft,
  PiPlayFill,
  PiPauseFill,
  PiCaretLeft,
  PiCaretRight,
  PiSparkle,
  PiSpeakerHigh,
  PiSpeakerSlash,
  PiCheck,
  PiArticle,
  PiSlideshow,
  PiWaveform,
  PiX,
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
} from '../utils/storybookLogic';
import { LivingStoryCanvas } from './LivingStoryCanvas';
import { ambientSound } from '../utils/ambientAudio';
import { narrationDirector } from '../utils/narrationEngine';

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
  onSelectEpisode: (episodeId: string) => void;
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
  const [stageState, setStageState] = useState<ReaderStageState>(
    INITIAL_READER_STAGE_STATE
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(initialAutoPlay);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [blockIndex, setBlockIndex] = useState<number>(0);
  const [surgeCount, setSurgeCount] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  const isProgrammaticScrollRef = useRef<boolean>(false);

  const totalChapters = episode.chapters.length;
  const safeIndex = clampChapterIndex(chapterIndex, totalChapters);
  const currentChapter = episode.chapters[safeIndex];
  const reflectionKey = `${episode.id}-ch-${currentChapter.number}`;
  const [draftNote, setDraftNote] = useState<string>(
    reflectionNotes[reflectionKey] || ''
  );

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

  // Reset when episode changes
  useEffect(() => {
    narrationDirector.stop();
    const validIdx = clampChapterIndex(
      initialChapterIndex,
      episode.chapters.length
    );
    setChapterIndex(validIdx);
    setBlockIndex(0);
    setSurgeCount(0);
    setStageState(INITIAL_READER_STAGE_STATE);
  }, [episode.id, initialChapterIndex, episode.chapters.length]);

  // Sync draft reflection note & mark chapter read when chapter changes
  useEffect(() => {
    setDraftNote(reflectionNotes[reflectionKey] || '');
    setSavedToast(false);
    onMarkChapterRead(episode.id, currentChapter.number);
  }, [
    reflectionKey,
    reflectionNotes,
    episode.id,
    currentChapter.number,
    onMarkChapterRead,
  ]);

  // Background ambient drone (smoothly glides frequencies across chapter themes)
  useEffect(() => {
    if (isPlaying && !isMuted && readerSettings.ambientAudioEnabled) {
      ambientSound.start(currentChapter.sceneTheme, true);
    } else {
      ambientSound.stop();
    }
  }, [
    isPlaying,
    isMuted,
    readerSettings.ambientAudioEnabled,
    currentChapter.sceneTheme,
  ]);

  // Stop audio & speech on unmount
  useEffect(() => {
    return () => {
      narrationDirector.stop();
      ambientSound.stop();
    };
  }, []);

  // Morgan Freeman Narration Director + Auto-Scroll in Quiet Read Mode
  useEffect(() => {
    if (!isPlaying || !activeBlock) {
      narrationDirector.stop();
      return;
    }

    // Trigger subtle WebGL water/light response whenever a new cue or paragraph begins
    setSurgeCount((c) => c + 1);

    // Smoothly auto-scroll the active block into the center of the viewport in Quiet Read mode
    if (stageState.kind === 'scroll' && typeof document !== 'undefined') {
      const targetEl = document.querySelector<HTMLElement>(
        `[data-narration-id="${activeBlock.id}"]`
      );
      if (targetEl) {
        isProgrammaticScrollRef.current = true;
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 900);
      }
    }

    narrationDirector.playBlock({
      block: activeBlock,
      sceneTheme: currentChapter.sceneTheme,
      muted: isMuted || !readerSettings.ambientAudioEnabled,
      onComplete: () => {
        if (safeBlockIndex + 1 < chapterBlocks.length) {
          setBlockIndex(safeBlockIndex + 1);
        } else {
          const nextChIdx = getNextChapterIndex(safeIndex, totalChapters);
          if (nextChIdx !== null) {
            setChapterIndex(nextChIdx);
            setBlockIndex(0);
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
    readerSettings.ambientAudioEnabled,
    stageState.kind,
  ]);

  // Scroll-linked WebGL transitions when user scrolls manually in Quiet Read mode
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

        for (const el of chapterEls) {
          const rect = el.getBoundingClientRect();
          // Distance from viewport center to chapter bounds
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
            }
          }
        }

        if (closestChIdx !== safeIndex) {
          setChapterIndex(closestChIdx);
          setBlockIndex(0);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stageState.kind, isPlaying, safeIndex]);

  // Keyboard navigation for left/right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'INPUT'
      ) {
        return;
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
  }, [safeIndex, totalChapters, stageState.kind]);

  const handleGoToChapter = (idx: number, targetBlockIdx = 0) => {
    const clamped = clampChapterIndex(idx, totalChapters);
    setChapterIndex(clamped);
    setBlockIndex(targetBlockIdx);
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

    setChapterIndex(clampedCh);
    setBlockIndex(foundIdx >= 0 ? foundIdx : 0);
    setSurgeCount((c) => c + 1);

    if (!isPlaying && !isMuted && readerSettings.ambientAudioEnabled) {
      ambientSound.triggerWonderChime(targetChapter.sceneTheme, true);
    }
  };

  const handlePrev = () => {
    const prev = getPrevChapterIndex(safeIndex);
    if (prev !== null) handleGoToChapter(prev);
  };

  const handleNext = () => {
    const next = getNextChapterIndex(safeIndex, totalChapters);
    if (next !== null) handleGoToChapter(next);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReflection(reflectionKey, draftNote.trim());
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2500);
  };

  const proseClasses = getReaderProseClasses(readerSettings);
  const isScroll = stageState.kind === 'scroll';
  const activeDrawer =
    stageState.kind === 'behold' ? 'none' : stageState.activeDrawer ?? 'none';

  const activeTextForShader = activeBlock
    ? activeBlock.displayText
    : currentChapter.narrative;
  const isSoundCueActive = Boolean(
    isPlaying && activeBlock && activeBlock.kind === 'sound-cue'
  );

  return (
    <div
      data-state={stageState.kind}
      data-chapter={currentChapter.number}
      data-active-block={activeBlock?.id || ''}
      className="relative isolate min-h-[calc(100dvh-3.5rem)] text-[#FAF6EE]"
    >
      {/* Persistent Real-Time WebGL Water, Mist, Dawn & Sky Backdrop Tied to Active Text */}
      <LivingStoryCanvas
        theme={currentChapter.sceneTheme}
        canvasMode={currentChapter.canvasMode}
        activeText={activeTextForShader}
        isSoundCueActive={isSoundCueActive}
        surgeCount={surgeCount}
        highContrast={readerSettings.highContrast}
        className="fixed inset-0 z-0"
      />

      {/* Top Atmospheric Fade Mask so scrolled Quiet Read prose dissolves cleanly beneath the top bar */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-32 z-20 pointer-events-none bg-gradient-to-b from-[#06080E] via-[#06080E]/80 to-transparent"
      />

      {/* Minimal, Sleek Stage Container */}
      <div className="relative z-10 max-w-[880px] mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-20">
        {/* Sticky Minimal Transparent Reader Header with Unified Progress Indicator */}
        <header className="sticky top-16 z-30 flex items-center justify-between gap-3 min-h-[54px] py-2.5 px-3.5 -mx-3 mb-8 md:mb-10 rounded-2xl bg-[#080B10]/75 backdrop-blur-xl border border-[#FAF6EE]/10">
          <button
            type="button"
            onClick={onBackToEpisodes}
            className="inline-flex items-center gap-2 text-[0.85rem] text-[#FAF6EE]/65 hover:text-[#D4A853] transition-colors shrink-0 min-h-[40px] px-1 cursor-pointer"
          >
            <PiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All episodes</span>
            <span className="sm:hidden">Episodes</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Live Narration Status Cue */}
            {isPlaying && activeBlock && (
              <div
                data-testid="narration-status-badge"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#D4A853]/12 border border-[#D4A853]/30 text-[#D4A853] text-[0.68rem] tracking-[0.16em] uppercase"
              >
                <PiWaveform className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  {activeBlock.kind === 'sound-cue'
                    ? `Sound Cue · Ch ${formatChapterNumber(currentChapter.number)}`
                    : `Narrating · Ch ${formatChapterNumber(currentChapter.number)}`}
                </span>
              </div>
            )}

            {/* Single Unified Visual Progress Indicator for Current Book & Collection */}
            <div
              data-testid="reader-completion-header"
              title={`${episode.title}: ${completionStats.episodePercent}% complete (${completionStats.episodeCompletedCount}/${completionStats.episodeTotalCount} chapters) · ${episode.series} Collection: ${completionStats.collectionPercent}% (${completionStats.collectionCompletedCount}/${completionStats.collectionTotalCount})`}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-black/40 border border-[#FAF6EE]/10"
            >
              <span
                className="text-[0.68rem] tracking-[0.18em] uppercase font-medium whitespace-nowrap"
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
                className="w-12 sm:w-20 h-1 bg-[#FAF6EE]/15 rounded-full overflow-hidden shrink-0"
              >
                <div
                  className="h-full bg-[#D4A853] transition-all duration-500"
                  style={{ width: `${completionStats.episodePercent}%` }}
                />
              </div>
              <span className="font-mono-tabular text-[0.7rem] text-[#FAF6EE]/75 whitespace-nowrap">
                {completionStats.episodePercent}%
              </span>
            </div>

            {/* Quiet Read (Default) / Chapter Slides Toggle */}
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
              className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#FAF6EE]/10 bg-black/40 text-[0.7rem] tracking-[0.14em] uppercase text-[#FAF6EE]/75 hover:text-[#FAF6EE] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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

            {/* Mute toggle when playing */}
            {isPlaying && (
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                aria-label={
                  isMuted ? 'Unmute narration' : 'Mute narration'
                }
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
              onClick={() => setIsPlaying((prev) => !prev)}
              aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#D4A853] hover:bg-[#E5BE6A] text-[#0A0A0A] flex items-center justify-center shadow-[0_8px_28px_rgba(212,168,83,0.3)] active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              {isPlaying ? (
                <PiPauseFill className="w-4 h-4" />
              ) : (
                <PiPlayFill className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
        </header>

        {/* DEFAULT VIEW: QUIET READ CONTINUOUS AUTO-SCROLLING STAGE */}
        {isScroll ? (
          <div className="max-w-[740px] mx-auto w-full py-2">
            {/* Episode Title Banner */}
            <div className="mb-12 pb-8 border-b border-[#FAF6EE]/10">
              <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#D4A853] mb-2">
                {episode.series} · {episode.code} · {episode.bookRef}
              </p>
              <h1 className="font-serif-editorial text-3xl sm:text-5xl text-[#FAF6EE] font-semibold mb-3 text-balance">
                {episode.fullTitle}
              </h1>
              <p className="font-serif-editorial italic text-base sm:text-lg text-[#FAF6EE]/55 leading-relaxed">
                {episode.summary}
              </p>
            </div>

            {/* Flowing Chapters with Sound-Cue & Paragraph Illumination */}
            <div className="space-y-16">
              {episode.chapters.map((ch, chIdx) => {
                const isCurrentCh = chIdx === safeIndex;
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
                  <section
                    key={ch.number}
                    data-chapter-index={chIdx}
                    className={`pb-14 border-b border-[#FAF6EE]/10 last:border-b-0 transition-opacity duration-700 ${
                      isPlaying && !isCurrentCh ? 'opacity-55' : 'opacity-100'
                    }`}
                  >
                    {/* Chapter Header */}
                    <div className="flex items-baseline gap-3 mb-6">
                      <span
                        className={`font-serif-editorial text-2xl md:text-3xl transition-colors duration-500 ${
                          isCurrentCh ? 'text-[#D4A853]' : 'text-[#FAF6EE]/35'
                        }`}
                      >
                        {formatChapterNumber(ch.number)}
                      </span>
                      <span
                        className={`text-[0.7rem] tracking-[0.2em] uppercase transition-colors duration-500 ${
                          isCurrentCh ? 'text-[#D4A853]/90' : 'text-[#FAF6EE]/35'
                        }`}
                      >
                        Chapter {ch.number} of {totalChapters}
                      </span>
                    </div>

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

                    {/* Poetic Narrative Paragraphs */}
                    <div className="space-y-6 mt-5">
                      {chParas.map((p, pIdx) => {
                        const paraId = `ch-${ch.number}-para-${pIdx}`;
                        const isParaActive =
                          isCurrentCh && activeBlock?.id === paraId;
                        return (
                          <p
                            key={pIdx}
                            data-narration-id={paraId}
                            onClick={() => handleSelectBlock(chIdx, paraId)}
                            className={`${proseClasses} font-medium transition-all duration-500 text-balance cursor-pointer pl-3 border-l-2 ${
                              isParaActive
                                ? 'border-[#D4A853] text-[#FAF6EE]'
                                : 'border-transparent text-[#FAF6EE]/82 hover:text-[#FAF6EE]'
                            }`}
                          >
                            {p}
                          </p>
                        );
                      })}
                    </div>

                    {/* Chapter Reflect Action */}
                    <div className="mt-6 pl-3">
                      <button
                        type="button"
                        onClick={() => {
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
                        <span>Reflect</span>
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          /* VIEW 2: SINGLE CHAPTER-BY-CHAPTER STAGE */
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
            <div className="w-full max-w-[760px] mx-auto px-1 md:px-4 py-2">
              {/* Chapter Number & Counter */}
              <div className="flex items-baseline gap-3 mb-4">
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
                  Chapter {currentChapter.number} of {totalChapters}
                </span>
              </div>

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
                  return (
                    <p
                      key={idx}
                      data-narration-id={paraId}
                      onClick={() => handleSelectBlock(safeIndex, paraId)}
                      className={`${proseClasses} font-medium mb-6 last:mb-0 transition-all duration-500 text-balance cursor-pointer pl-3 border-l-2 ${
                        isActivePara
                          ? 'border-[#D4A853] text-[#FAF6EE]'
                          : 'border-transparent text-[#FAF6EE]/85 hover:text-[#FAF6EE]'
                      }`}
                    >
                      {para}
                    </p>
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
                  <span>Reflect</span>
                </button>
              </div>
            </div>

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
          <div className="relative z-10 mt-16 md:mt-24 pb-6">
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
                onClick={() => onSelectEpisode(nextEpisode.id)}
                className="inline-flex w-full md:w-auto items-center justify-center gap-2 font-medium text-[0.95rem] text-[#0A0A0A] bg-[#D4A853] min-h-[52px] px-8 py-4 rounded-full hover:bg-[#E5BE6A] active:scale-[0.98] transition-all duration-300 shrink-0 cursor-pointer"
              >
                <PiPlayFill className="w-4 h-4" />
                <span>Continue</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Serene Centered Reflection Modal */}
      {activeDrawer === 'reflect' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chapter reflection"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setStageState((prev) =>
                transitionReaderStage(prev, {
                  type: 'TOGGLE_DRAWER',
                  drawer: 'reflect',
                })
              );
            }
          }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <div
            className="relative w-full max-w-[500px] rounded-2xl p-7 md:p-9 overflow-hidden shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${episode.accentColor}22 0%, rgba(12, 14, 20, 0.96) 100%)`,
              border: `1px solid ${episode.accentColor}40`,
            }}
          >
            <button
              type="button"
              aria-label="Close reflection"
              onClick={() =>
                setStageState((prev) =>
                  transitionReaderStage(prev, {
                    type: 'TOGGLE_DRAWER',
                    drawer: 'reflect',
                  })
                )
              }
              className="absolute top-3.5 right-3.5 w-10 h-10 flex items-center justify-center rounded-full bg-[#FAF6EE]/10 text-[#FAF6EE]/60 hover:text-[#FAF6EE] transition-colors cursor-pointer"
            >
              <PiX className="w-4 h-4" />
            </button>

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: `${episode.accentColor}25` }}
            >
              <PiSparkle
                className="w-5 h-5"
                style={{ color: episode.accentColor }}
              />
            </div>

            <p className="font-serif-editorial text-[1.35rem] md:text-[1.55rem] leading-[1.45] text-[#FAF6EE]/95">
              “{currentChapter.reflectionPrompt}”
            </p>
            <p className="font-serif-editorial text-[0.95rem] text-[#FAF6EE]/45 mt-4 italic">
              Take a moment. Sit with the question.
            </p>

            <form
              onSubmit={handleSaveNote}
              className="mt-6 pt-5 border-t border-[#FAF6EE]/10"
            >
              <textarea
                id="chapter-reflection-input"
                rows={2}
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Write a quiet thought from this chapter (optional)…"
                className="w-full rounded-xl border border-[#FAF6EE]/15 bg-black/40 px-3.5 py-2.5 text-sm text-[#FAF6EE] placeholder:text-[#FAF6EE]/30 focus:outline-none focus:border-[#D4A853] mb-3"
              />
              <div className="flex items-center justify-between gap-3">
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 rounded-full bg-[#D4A853] hover:bg-[#E5BE6A] text-[#0A0A0A] text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Save Note
                </button>
                {savedToast && (
                  <span className="text-xs text-emerald-300 flex items-center gap-1">
                    <PiCheck className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
