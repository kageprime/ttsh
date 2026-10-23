import React from 'react';
import { PiPlayFill, PiArrowRight } from 'react-icons/pi';
import { StoryEpisode } from '../data/stories';
import { LivingStoryCanvas } from './LivingStoryCanvas';

interface HomeViewProps {
  episodes: StoryEpisode[];
  completedChaptersByEpisode: Record<string, number[]>;
  onOpenEpisode: (
    episodeId: string,
    autoPlay?: boolean,
    chapterIndex?: number
  ) => void;
  onViewAllEpisodes: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  episodes,
  completedChaptersByEpisode,
  onOpenEpisode,
  onViewAllEpisodes,
}) => {
  const featured = episodes[0];

  return (
    <div className="bg-[#0a0a0a] text-[#FAF6EE]">
      {/* SECTION 1: FULL-VIEWPORT HERO WITH REAL ANIMATED WATERFALL & FOREST MIST */}
      <section className="relative min-h-[88svh] overflow-hidden flex items-center justify-center bg-[#0a0a0a] px-5 py-24">
        <LivingStoryCanvas
          theme="hero-waterfall"
          canvasMode="emerald-spores"
          interactive={true}
          className="absolute inset-0 z-0"
        />
        <div
          className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#0a0a0a]/65 via-transparent to-[#0a0a0a]"
          aria-hidden="true"
        />

        <div className="relative z-[2] text-center px-1 max-w-[820px] w-full">
          <p className="text-[0.68rem] tracking-[0.25em] uppercase text-[#D4A853] mb-6">
            BIBLEVERSE · A Listening Scripture
          </p>

          <h1 className="font-serif-editorial font-semibold text-[clamp(2.4rem,9vw,5.6rem)] leading-[1.04] tracking-tight text-[#FAF6EE] text-balance">
            Hear the Story.
            <br />
            <span className="font-light italic text-[#FAF6EE]/75">
              Read the Wonder.
            </span>
          </h1>

          <p className="font-serif-editorial font-light text-[1.08rem] md:text-[1.25rem] text-[#FAF6EE]/65 max-w-[540px] mx-auto mt-6 leading-[1.7] text-balance">
            Ancient Scripture as cinematic podcast episodes — neural baritone
            narration, living natural atmospheres, and chapters that follow
            along. Or read in quiet.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 mt-10">
            <button
              type="button"
              onClick={() => onOpenEpisode(featured.id, true, 0)}
              className="inline-flex items-center justify-center gap-2.5 font-medium text-[0.95rem] text-[#0A0A0A] bg-[#D4A853] min-h-[52px] px-8 py-4 rounded-lg hover:bg-[#E5BE6A] active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              <PiPlayFill className="w-4 h-4" />
              <span>Play featured episode</span>
            </button>

            <button
              type="button"
              onClick={onViewAllEpisodes}
              className="inline-flex items-center justify-center gap-2.5 text-[0.95rem] text-[#FAF6EE]/85 min-h-[52px] px-8 py-4 rounded-lg border border-[#FAF6EE]/20 hover:border-[#FAF6EE]/45 hover:text-[#FAF6EE] hover:bg-[#FAF6EE]/5 active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              <span>All episodes</span>
              <PiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: NOW SHOWING — FEATURED EPISODE WITH REAL ANIMATED WATER PREVIEW */}
      <section className="relative max-w-[1280px] mx-auto px-4 sm:px-8 py-20 md:py-28">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#D4A853]/80">
          Now showing
        </p>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
          <button
            type="button"
            onClick={() => onOpenEpisode(featured.id, false, 0)}
            aria-label={`Open ${featured.fullTitle}`}
            className="group block text-left w-full relative aspect-video rounded-xl overflow-hidden border border-[#FAF6EE]/10 cursor-pointer"
          >
            <LivingStoryCanvas
              theme="primordial-waters"
              canvasMode="void-ripples"
              interactive={false}
              className="absolute inset-0 group-hover:scale-[1.02] transition-transform duration-700"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-16 h-16 rounded-full bg-[#D4A853] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <PiPlayFill className="w-6 h-6 text-[#0A0A0A] ml-0.5" />
              </span>
            </span>
          </button>

          <div>
            <span
              className="inline-block text-[0.7rem] tracking-[0.2em] uppercase"
              style={{ color: featured.accentColor }}
            >
              {featured.series} · {featured.code}
            </span>

            <h2 className="font-serif-editorial font-semibold text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.1] text-[#FAF6EE] mt-3 text-balance">
              {featured.fullTitle}
            </h2>

            <p className="font-serif-editorial font-light italic text-[1.08rem] text-[#FAF6EE]/60 mt-3 leading-[1.7]">
              {featured.summary}
            </p>

            <p className="text-[0.75rem] tracking-[0.12em] uppercase text-[#FAF6EE]/40 mt-4">
              {featured.chapters.length} chapters · Podcast + Read
            </p>

            <button
              type="button"
              onClick={() => onOpenEpisode(featured.id, false, 0)}
              className="inline-flex items-center gap-2.5 font-medium text-[0.9rem] text-[#0A0A0A] bg-[#D4A853] px-7 py-3.5 rounded-lg hover:bg-[#E5BE6A] transition-colors duration-200 mt-7 cursor-pointer whitespace-nowrap"
            >
              <PiPlayFill className="w-3.5 h-3.5" />
              <span>Watch &amp; listen</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: EDITORIAL ARCHITECTURAL COLUMNS (ZERO ICON-BUBBLE SAAS CARDS) */}
      <section className="relative max-w-[1280px] mx-auto px-4 sm:px-8 py-20 md:py-28 border-t border-[#FAF6EE]/[0.08]">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#D4A853]/80">
          Three movements of reading
        </p>
        <h2 className="font-serif-editorial font-semibold text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.1] text-[#FAF6EE] mt-3 text-balance">
          Listen deeply. Read slowly.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
          <div className="border-t border-[#FAF6EE]/12 pt-6">
            <span className="font-mono-tabular text-xs text-[#D4A853] tracking-widest block mb-2">
              01
            </span>
            <h3 className="font-serif-editorial font-semibold text-[1.45rem] text-[#FAF6EE]">
              Podcast &amp; Acoustic Foley
            </h3>
            <p className="text-[0.94rem] text-[#FAF6EE]/60 mt-2.5 leading-[1.7]">
              Four-layer generative soundscapes over living water, dawn, and
              ember backdrops that crossfade with every chapter. Press play and
              be carried.
            </p>
          </div>

          <div className="border-t border-[#FAF6EE]/12 pt-6">
            <span className="font-mono-tabular text-xs text-[#D4A853] tracking-widest block mb-2">
              02
            </span>
            <h3 className="font-serif-editorial font-semibold text-[1.45rem] text-[#FAF6EE]">
              Chapter-Reactive Canvas
            </h3>
            <p className="text-[0.94rem] text-[#FAF6EE]/60 mt-2.5 leading-[1.7]">
              Every chapter constructs its own real-time visual physics — from
              the Abyssal Seashell Resonance to Jacob’s Ladder — morphing
              continuously as you scroll.
            </p>
          </div>

          <div className="border-t border-[#FAF6EE]/12 pt-6">
            <span className="font-mono-tabular text-xs text-[#D4A853] tracking-widest block mb-2">
              03
            </span>
            <h3 className="font-serif-editorial font-semibold text-[1.45rem] text-[#FAF6EE]">
              Lexicon &amp; Study Journal
            </h3>
            <p className="text-[0.94rem] text-[#FAF6EE]/60 mt-2.5 leading-[1.7]">
              Explore ancient Hebrew and Greek roots inline, illuminate verses
              with liturgical ink, record Lectio Divina notes, and export your
              manuscript as Markdown.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: GENESIS 1:1 PULL-QUOTE */}
      <section className="max-w-[900px] mx-auto px-5 py-20 md:py-28 text-center">
        <p className="font-serif-editorial italic font-light text-[clamp(1.6rem,3.4vw,2.5rem)] leading-[1.5] text-[#FAF6EE]/90 text-balance">
          “In the beginning, God created the heavens and the earth.”
        </p>
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#FAF6EE]/40 mt-5">
          Genesis 1 : 1
        </p>
      </section>

      {/* SECTION 5: THE SERIES — ALL EPISODES EDITORIAL INDEX */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 md:py-24">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#D4A853]/80">
              The series
            </p>
            <h2 className="font-serif-editorial font-semibold text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.1] text-[#FAF6EE] mt-2">
              All episodes
            </h2>
          </div>

          <button
            type="button"
            onClick={onViewAllEpisodes}
            className="hidden sm:inline-flex items-center gap-2 text-[0.85rem] text-[#FAF6EE]/60 hover:text-[#D4A853] transition-colors cursor-pointer"
          >
            <span>View all</span>
            <PiArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-[#FAF6EE]/[0.08] border-y border-[#FAF6EE]/[0.08]">
          {episodes.map((ep) => {
            const doneCount = (completedChaptersByEpisode[ep.id] || []).length;
            const pct =
              ep.chapters.length > 0
                ? Math.round((doneCount / ep.chapters.length) * 100)
                : 0;

            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => onOpenEpisode(ep.id, false, 0)}
                className="group w-full text-left flex items-center gap-5 md:gap-7 py-6 px-2 hover:bg-[#FAF6EE]/[0.02] transition-colors duration-200 cursor-pointer"
              >
                <span className="font-serif-editorial text-2xl md:text-3xl text-[#FAF6EE]/30 group-hover:text-[#D4A853] transition-colors w-9 shrink-0 font-mono-tabular">
                  {ep.number}
                </span>

                <div className="relative w-28 sm:w-36 aspect-video rounded-lg overflow-hidden border border-[#FAF6EE]/10 shrink-0 hidden xs:block">
                  <LivingStoryCanvas
                    theme={ep.heroTheme}
                    canvasMode={ep.heroCanvasMode}
                    interactive={false}
                    className="absolute inset-0"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[0.68rem] tracking-[0.16em] uppercase text-[#FAF6EE]/50">
                    <span style={{ color: ep.accentColor }}>
                      {ep.series} · {ep.code}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{ep.bookRef}</span>
                    {pct > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#D4A853] font-mono-tabular">
                          {pct}% read
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="font-serif-editorial font-semibold text-[1.25rem] md:text-[1.5rem] text-[#FAF6EE] group-hover:text-[#D4A853] transition-colors truncate mt-1">
                    {ep.fullTitle}
                  </h3>
                  <p className="text-[0.88rem] text-[#FAF6EE]/50 truncate mt-0.5">
                    {ep.summary}
                  </p>
                </div>

                <span className="text-xs tracking-[0.14em] uppercase text-[#FAF6EE]/50 group-hover:text-[#D4A853] flex items-center gap-1.5 transition-colors shrink-0">
                  <span className="hidden sm:inline">Open</span>
                  <PiArrowRight className="w-4 h-4" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 6: BEGIN AT THE BEGINNING */}
      <section className="max-w-[820px] mx-auto px-5 py-20 md:py-28 text-center border-t border-[#FAF6EE]/[0.06]">
        <h2 className="font-serif-editorial font-semibold text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.1] text-[#FAF6EE]">
          Begin at the beginning.
        </h2>
        <p className="text-[1rem] text-[#FAF6EE]/50 mt-4">
          12 chapters. One story. Press play.
        </p>
        <button
          type="button"
          onClick={() => onOpenEpisode(featured.id, true, 0)}
          className="mt-8 inline-flex w-full sm:w-auto items-center justify-center gap-2.5 font-medium text-[0.95rem] text-[#0A0A0A] bg-[#D4A853] min-h-[52px] px-8 py-4 rounded-full hover:bg-[#E5BE6A] transition-all duration-300 cursor-pointer"
        >
          <PiPlayFill className="w-4 h-4" />
          <span>Start listening</span>
        </button>
      </section>
    </div>
  );
};
