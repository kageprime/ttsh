import React, { useState } from 'react';
import {
  PiPlayFill,
  PiClock,
  PiMagnifyingGlass,
  PiBookmarkSimple,
  PiBookmarkSimpleFill,
} from 'react-icons/pi';
import { StoryEpisode } from '../data/stories';
import { filterEpisodes } from '../utils/storybookLogic';
import { LivingStoryCanvas } from './LivingStoryCanvas';

interface EpisodesCatalogViewProps {
  episodes: StoryEpisode[];
  completedChaptersByEpisode: Record<string, number[]>;
  bookmarkedIds: string[];
  onToggleBookmark: (episodeId: string) => void;
  onOpenEpisode: (episodeId: string, autoPlay?: boolean, chapterIndex?: number) => void;
}

const CATEGORIES = [
  'All',
  'Primeval History',
  'Covenant & Promise',
] as const;

export const EpisodesCatalogView: React.FC<EpisodesCatalogViewProps> = ({
  episodes,
  completedChaptersByEpisode,
  bookmarkedIds,
  onToggleBookmark,
  onOpenEpisode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = filterEpisodes(episodes, selectedCategory, searchQuery);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 pt-10 pb-24 text-[#FAF6EE]">
      {/* Header */}
      <div className="mb-10 pb-8 border-b border-[#FAF6EE]/10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.24em] text-[#D4A853] mb-3 font-medium">
            BIBLEVERSE SERIES
          </p>
          <h1 className="font-serif-editorial text-4xl sm:text-5xl text-[#FAF6EE] font-semibold tracking-tight">
            All Episodes
          </h1>
          <p className="text-sm sm:text-base text-[#FAF6EE]/55 mt-2 max-w-xl">
            Listen deeply with ambient soundscapes and real-time natural water
            and sky shaders, or read slowly at your own pace.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <PiMagnifyingGlass className="w-4 h-4 text-[#FAF6EE]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories or Genesis ref…"
            aria-label="Search episodes"
            className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl border border-[#FAF6EE]/12 bg-[#111114] text-sm text-[#FAF6EE] placeholder:text-[#FAF6EE]/35 focus:outline-none focus:border-[#D4A853]"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-6 mb-8 border-b border-[#FAF6EE]/10">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[38px] pb-2.5 text-xs uppercase tracking-[0.16em] font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                active
                  ? 'border-[#D4A853] text-[#FAF6EE]'
                  : 'border-transparent text-[#FAF6EE]/45 hover:text-[#FAF6EE]/80'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Episodes List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#FAF6EE]/10 bg-[#0f0f0f] p-12 text-center">
          <p className="font-serif-editorial text-2xl text-[#FAF6EE] mb-2">
            No matching episodes found
          </p>
          <p className="text-sm text-[#FAF6EE]/50 mb-6">
            Try clearing your search query or selecting All categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-5 py-2.5 rounded-full bg-[#D4A853] text-[#0A0A0A] text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((ep) => {
            const completedCount = (completedChaptersByEpisode[ep.id] || []).length;
            const totalCount = ep.chapters.length;
            const percentDone =
              totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isBookmarked = bookmarkedIds.includes(ep.id);

            return (
              <article
                key={ep.id}
                className="flex items-stretch gap-0 rounded-2xl overflow-hidden border border-[#FAF6EE]/[0.08] bg-[#0f0f0f]/90 hover:bg-[#141414] hover:border-[#FAF6EE]/[0.16] transition-all duration-500 group"
              >
                {/* Live Procedural Shader Poster */}
                <div
                  onClick={() => onOpenEpisode(ep.id, false, 0)}
                  className="w-[100px] sm:w-[150px] md:w-[190px] shrink-0 overflow-hidden relative min-h-[112px] cursor-pointer"
                >
                  <LivingStoryCanvas
                    theme={ep.heroTheme}
                    canvasMode={ep.heroCanvasMode}
                    interactive={false}
                    className="absolute inset-0 w-full h-full"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to right, transparent 40%, #0f0f0f 100%)',
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 md:gap-7 p-4 md:p-6 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenEpisode(ep.id, true, 0)}
                    aria-label={`Play ${ep.title}`}
                    className="hidden sm:flex w-12 h-12 md:w-14 md:h-14 rounded-full items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: `${ep.accentColor}18` }}
                  >
                    <PiPlayFill
                      className="w-4 h-4 ml-0.5"
                      style={{ color: ep.accentColor }}
                    />
                  </button>

                  <div
                    onClick={() => onOpenEpisode(ep.id, false, 0)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className="text-[0.68rem] tracking-[0.2em] uppercase font-medium"
                        style={{ color: ep.accentColor }}
                      >
                        {ep.code}
                      </span>
                      <span className="text-[0.72rem] text-[#FAF6EE]/45">
                        · {ep.bookRef} · {totalCount} chapters
                      </span>
                      {percentDone > 0 && (
                        <span className="text-[0.7rem] text-[#D4A853] font-mono-tabular">
                          · {percentDone}% complete
                        </span>
                      )}
                    </div>

                    <h2 className="font-serif-editorial text-[1.2rem] md:text-[1.45rem] font-semibold tracking-tight text-[#FAF6EE] group-hover:text-[#D4A853] transition-colors leading-snug text-balance">
                      {ep.fullTitle}
                    </h2>

                    <p className="text-[0.88rem] font-light text-[#FAF6EE]/50 mt-1 line-clamp-2 leading-relaxed">
                      {ep.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 text-[#FAF6EE]/30 text-xs font-mono-tabular">
                      <PiClock className="w-3.5 h-3.5" />
                      <span>{ep.durationMin} min</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleBookmark(ep.id)}
                      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark episode'}
                      className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                        isBookmarked
                          ? 'border-[#D4A853]/50 bg-[#D4A853]/15 text-[#D4A853]'
                          : 'border-[#FAF6EE]/10 text-[#FAF6EE]/45 hover:text-[#FAF6EE]'
                      }`}
                    >
                      {isBookmarked ? (
                        <PiBookmarkSimpleFill className="w-4 h-4" />
                      ) : (
                        <PiBookmarkSimple className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
