import React from 'react';
import {
  PiPlayFill,
  PiArrowRight,
  PiBookOpenText,
  PiWaveform,
  PiSubtitles,
} from 'react-icons/pi';
import { StoryEpisode } from '../data/stories';
import { LivingStoryCanvas } from './LivingStoryCanvas';

interface HomeViewProps {
  episodes: StoryEpisode[];
  completedChaptersByEpisode: Record<string, number[]>;
  onOpenEpisode: (episodeId: string, autoPlay?: boolean, chapterIndex?: number) => void;
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
      <section className="relative min-h-[92svh] overflow-hidden flex items-center justify-center bg-[#0a0a0a] px-5 py-24">
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

          <p className="font-serif-editorial font-light text-[1.08rem] md:text-[1.25rem] text-[#FAF6EE]/60 max-w-[540px] mx-auto mt-6 leading-[1.7] text-balance">
            Ancient Scripture as cinematic podcast episodes — narration, living
            natural atmospheres, and chapters that follow along. Or read in quiet.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 mt-10">
            <button
              type="button"
              onClick={() => onOpenEpisode(featured.id, true, 0)}
              className="inline-flex items-center justify-center gap-2.5 font-medium text-[0.95rem] text-[#0A0A0A] bg-[#D4A853] min-h-[52px] px-8 py-4 rounded-full hover:bg-[#E5BE6A] hover:shadow-[0_8px_30px_rgba(212,168,83,0.3)] active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              <PiPlayFill className="w-4 h-4" />
              <span>Play featured episode</span>
            </button>

            <button
              type="button"
              onClick={onViewAllEpisodes}
              className="inline-flex items-center justify-center gap-2.5 text-[0.95rem] text-[#FAF6EE]/85 min-h-[52px] px-8 py-4 rounded-full border border-[#FAF6EE]/20 hover:border-[#FAF6EE]/45 hover:text-[#FAF6EE] hover:bg-[#FAF6EE]/5 active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              <span>All episodes</span>
              <PiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtle Bottom Scroll Indicator */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2] hidden sm:flex flex-col items-center gap-2 pointer-events-none"
          aria-hidden="true"
        >
          <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#FAF6EE]/30">
            Scroll
          </span>
          <div className="w-6 h-10 rounded-full border border-[#FAF6EE]/20 flex items-start justify-center pt-2">
            <div className="w-1 h-2.5 rounded-full bg-[#FAF6EE]/60" />
          </div>
        </div>
      </section>

      {/* SECTION 2: NOW SHOWING — FEATURED EPISODE WITH REAL ANIMATED WATER PREVIEW */}
      <section className="relative max-w-[1280px] mx-auto px-4 sm:px-8 py-20 md:py-28">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#D4A853]/80">
          Now showing
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
          <button
            type="button"
            onClick={() => onOpenEpisode(featured.id, false, 0)}
            aria-label={`Open ${featured.fullTitle}`}
            className="group block text-left w-full relative aspect-video rounded-2xl overflow-hidden border border-[#FAF6EE]/10 shadow-2xl cursor-pointer"
          >
            <LivingStoryCanvas
              theme="primordial-waters"
              canvasMode="void-ripples"
              interactive={false}
              className="absolute inset-0 group-hover:scale-[1.03] transition-transform duration-700"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-20 h-20 rounded-full bg-[#D4A853] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_8px_32px_rgba(212,168,83,0.45)]">
                <PiPlayFill className="w-7 h-7 text-[#0A0A0A] ml-1" />
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

            <p className="font-serif-editorial font-light italic text-[1.08rem] text-[#FAF6EE]/55 mt-3 leading-[1.7]">
              {featured.summary}
            </p>

            <p className="text-[0.75rem] tracking-[0.12em] uppercase text-[#FAF6EE]/35 mt-4">
              {featured.chapters.length} chapters · Podcast + Read
            </p>

            <button
              type="button"
              onClick={() => onOpenEpisode(featured.id, false, 0)}
              className="inline-flex items-center gap-2.5 font-medium text-[0.9rem] text-[#0A0A0A] bg-[#D4A853] px-7 py-3.5 rounded-full hover:bg-[#E5BE6A] transition-all duration-300 mt-7 cursor-pointer"
            >
              <PiPlayFill className="w-3.5 h-3.5" />
              <span>Watch & listen</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: TWO WAYS IN — LISTEN DEEPLY. READ SLOWLY. */}
      <section className="relative max-w-[1280px] mx-auto px-4 sm:px-8 py-20 md:py-28 border-t border-[#FAF6EE]/[0.06]">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#D4A853]/80">
          Two ways in
        </p>
        <h2 className="font-serif-editorial font-semibold text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.1] text-[#FAF6EE] mt-3">
          Listen deeply. Read slowly.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="p-6 rounded-2xl border border-[#FAF6EE]/[0.08] bg-[#111113]/80">
            <div className="w-11 h-11 rounded-full bg-[#D4A853]/12 flex items-center justify-center text-[#D4A853]">
              <PiWaveform className="w-5 h-5" />
            </div>
            <h3 className="font-serif-editorial font-semibold text-[1.35rem] text-[#FAF6EE] mt-5">
              Podcast
            </h3>
            <p className="text-[0.92rem] text-[#FAF6EE]/55 mt-2 leading-[1.7]">
              Ambient soundscapes over living natural water, dawn, and mist
              backdrops that shift with every chapter. Press play and be carried.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#FAF6EE]/[0.08] bg-[#111113]/80">
            <div className="w-11 h-11 rounded-full bg-[#D4A853]/12 flex items-center justify-center text-[#D4A853]">
              <PiSubtitles className="w-5 h-5" />
            </div>
            <h3 className="font-serif-editorial font-semibold text-[1.35rem] text-[#FAF6EE] mt-5">
              Chapters
            </h3>
            <p className="text-[0.92rem] text-[#FAF6EE]/55 mt-2 leading-[1.7]">
              Every spoken line, synced and centered — step through chapters at
              your own pace or tap any paragraph to ripple the scene.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#FAF6EE]/[0.08] bg-[#111113]/80">
            <div className="w-11 h-11 rounded-full bg-[#D4A853]/12 flex items-center justify-center text-[#D4A853]">
              <PiBookOpenText className="w-5 h-5" />
            </div>
            <h3 className="font-serif-editorial font-semibold text-[1.35rem] text-[#FAF6EE] mt-5">
              Read
            </h3>
            <p className="text-[0.92rem] text-[#FAF6EE]/55 mt-2 leading-[1.7]">
              The same chapters as a flowing sacred text: serif body, Hebrew
              pull-quotes, quiet reflection prompts, zero autoplay.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: GENESIS 1:1 PULL-QUOTE */}
      <section className="max-w-[900px] mx-auto px-5 py-20 md:py-28 text-center">
        <p className="font-serif-editorial italic font-light text-[clamp(1.6rem,3.4vw,2.5rem)] leading-[1.5] text-[#FAF6EE]/90 text-balance">
          “In the beginning, God created the heavens and the earth.”
        </p>
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#FAF6EE]/35 mt-5">
          Genesis 1 : 1
        </p>
      </section>

      {/* SECTION 5: THE SERIES — ALL EPISODES */}
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
            className="hidden sm:inline-flex items-center gap-2 text-[0.85rem] text-[#FAF6EE]/55 hover:text-[#D4A853] transition-colors cursor-pointer"
          >
            <span>View all</span>
            <PiArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-4">
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
                className="group w-full text-left flex items-center gap-5 md:gap-6 p-4 md:p-5 rounded-2xl bg-black/45 hover:bg-black/70 border border-[#FAF6EE]/[0.08] hover:border-[#FAF6EE]/20 transition-all duration-300 cursor-pointer"
              >
                <span className="font-serif-editorial text-2xl md:text-3xl text-[#FAF6EE]/25 group-hover:text-[#D4A853] transition-colors w-9 shrink-0 font-mono-tabular">
                  {ep.number}
                </span>

                <div className="relative w-24 sm:w-32 aspect-video rounded-xl overflow-hidden border border-[#FAF6EE]/10 shrink-0 hidden xs:block">
                  <LivingStoryCanvas
                    theme={ep.heroTheme}
                    canvasMode={ep.heroCanvasMode}
                    interactive={false}
                    className="absolute inset-0"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[0.68rem] tracking-[0.18em] uppercase">
                    <span style={{ color: ep.accentColor }}>
                      {ep.series} · {ep.code}
                    </span>
                    {pct > 0 && (
                      <span className="text-[#D4A853] font-mono-tabular">
                        · {pct}% read
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif-editorial font-semibold text-[1.2rem] md:text-[1.45rem] text-[#FAF6EE] group-hover:text-[#D4A853] transition-colors truncate mt-0.5">
                    {ep.fullTitle}
                  </h3>
                  <p className="text-[0.88rem] text-[#FAF6EE]/45 truncate mt-0.5">
                    {ep.summary}
                  </p>
                </div>

                <span className="w-11 h-11 rounded-full bg-[#FAF6EE]/[0.06] group-hover:bg-[#D4A853] text-[#FAF6EE] group-hover:text-[#0A0A0A] flex items-center justify-center transition-all shrink-0">
                  <PiPlayFill className="w-4 h-4 ml-0.5" />
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
