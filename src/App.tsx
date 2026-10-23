/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { BIBLE_EPISODES } from './data/stories';
import {
  ReaderSettings,
  DEFAULT_READER_SETTINGS,
  getNextEpisode,
} from './utils/storybookLogic';
import { Navbar, ActiveRoute } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { EpisodesCatalogView } from './components/EpisodesCatalogView';
import { EpisodeReaderView } from './components/EpisodeReaderView';
import { AdminDirectorStudio } from './components/AdminDirectorStudio';
import { AboutView } from './components/AboutView';
import { SettingsModal } from './components/SettingsModal';
import { SubscribeModal } from './components/SubscribeModal';
import { Footer } from './components/Footer';

const STORAGE_KEYS = {
  SETTINGS: 'bibleverse_reader_settings_v1',
  REFLECTIONS: 'bibleverse_reflections_v1',
  COMPLETED: 'bibleverse_completed_chapters_v1',
  BOOKMARKS: 'bibleverse_bookmarks_v1',
};

export default function App() {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('route') === 'director') {
        return 'director';
      }
      if (params.get('autostart') === '1' || params.get('episode')) {
        return 'reader';
      }
    }
    return 'home';
  });

  const [currentEpisodeId, setCurrentEpisodeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const epParam = params.get('episode');
      if (epParam && BIBLE_EPISODES.some((e) => e.id === epParam)) {
        return epParam;
      }
    }
    return BIBLE_EPISODES[0].id;
  });

  const [initialChapterIndex, setInitialChapterIndex] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ch = Number(params.get('chapter'));
      if (!Number.isNaN(ch) && ch > 0) return ch - 1;
    }
    return 0;
  });
  const [autoPlayOnOpen, setAutoPlayOnOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('autoplay') === '1' || params.get('autostart') === '1';
    }
    return false;
  });
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [subscribeOpen, setSubscribeOpen] = useState<boolean>(false);

  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? { ...DEFAULT_READER_SETTINGS, ...JSON.parse(raw) } : DEFAULT_READER_SETTINGS;
    } catch {
      return DEFAULT_READER_SETTINGS;
    }
  });

  const [reflectionNotes, setReflectionNotes] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [completedChaptersByEpisode, setCompletedChaptersByEpisode] = useState<
    Record<string, number[]>
  >(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMPLETED);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(readerSettings));
    } catch {
      // Ignore storage quota issues
    }
  }, [readerSettings]);

  const handleSaveReflection = useCallback((key: string, note: string) => {
    setReflectionNotes((prev) => {
      const updated = { ...prev, [key]: note };
      try {
        localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const handleMarkChapterRead = useCallback((episodeId: string, chapterNumber: number) => {
    setCompletedChaptersByEpisode((prev) => {
      const existing = prev[episodeId] || [];
      if (existing.includes(chapterNumber)) return prev;
      const updated = { ...prev, [episodeId]: [...existing, chapterNumber] };
      try {
        localStorage.setItem(STORAGE_KEYS.COMPLETED, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const handleToggleBookmark = useCallback((episodeId: string) => {
    setBookmarkedIds((prev) => {
      const updated = prev.includes(episodeId)
        ? prev.filter((id) => id !== episodeId)
        : [...prev, episodeId];
      try {
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const handleNavigate = useCallback((route: ActiveRoute, episodeId?: string) => {
    if (episodeId) {
      setCurrentEpisodeId(episodeId);
      setInitialChapterIndex(0);
      setAutoPlayOnOpen(false);
    }
    setActiveRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenEpisode = useCallback(
    (episodeId: string, autoPlay = false, chapterIdx = 0) => {
      setCurrentEpisodeId(episodeId);
      setInitialChapterIndex(chapterIdx);
      setAutoPlayOnOpen(autoPlay);
      setActiveRoute('reader');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const activeEpisode =
    BIBLE_EPISODES.find((ep) => ep.id === currentEpisodeId) || BIBLE_EPISODES[0];
  const nextEpisode = getNextEpisode(BIBLE_EPISODES, activeEpisode.id);

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10] text-[#F4EFE6] selection:bg-[#D4A853]/30">
      <Navbar
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSubscribe={() => setSubscribeOpen(true)}
      />

      <main className="flex-1">
        {activeRoute === 'home' && (
          <HomeView
            episodes={BIBLE_EPISODES}
            completedChaptersByEpisode={completedChaptersByEpisode}
            onOpenEpisode={handleOpenEpisode}
            onViewAllEpisodes={() => handleNavigate('episodes')}
          />
        )}

        {activeRoute === 'episodes' && (
          <EpisodesCatalogView
            episodes={BIBLE_EPISODES}
            completedChaptersByEpisode={completedChaptersByEpisode}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onOpenEpisode={handleOpenEpisode}
          />
        )}

        {activeRoute === 'about' && (
          <AboutView
            onStartReading={() => handleOpenEpisode(BIBLE_EPISODES[0].id, false, 0)}
          />
        )}

        {activeRoute === 'reader' && (
          <EpisodeReaderView
            episode={activeEpisode}
            allEpisodes={BIBLE_EPISODES}
            completedChaptersByEpisode={completedChaptersByEpisode}
            nextEpisode={nextEpisode}
            initialChapterIndex={initialChapterIndex}
            initialAutoPlay={autoPlayOnOpen}
            readerSettings={readerSettings}
            reflectionNotes={reflectionNotes}
            onSaveReflection={handleSaveReflection}
            onMarkChapterRead={handleMarkChapterRead}
            onBackToEpisodes={() => handleNavigate('episodes')}
            onSelectEpisode={(epId, chIdx = 0) => handleOpenEpisode(epId, false, chIdx)}
            onOpenDirectorStudio={(epId, chIdx) => {
              setCurrentEpisodeId(epId);
              setInitialChapterIndex(chIdx);
              setActiveRoute('director');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeRoute === 'director' && (
          <AdminDirectorStudio
            episodes={BIBLE_EPISODES}
            initialEpisodeId={activeEpisode.id}
            initialChapterIndex={initialChapterIndex}
            onOpenInReader={(epId, chIdx) => handleOpenEpisode(epId, false, chIdx)}
          />
        )}
      </main>

      {activeRoute !== 'reader' && activeRoute !== 'director' && (
        <Footer onNavigate={handleNavigate} />
      )}

      <SettingsModal
        isOpen={settingsOpen}
        settings={readerSettings}
        onUpdateSettings={setReaderSettings}
        onClose={() => setSettingsOpen(false)}
      />

      <SubscribeModal
        isOpen={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
      />
    </div>
  );
}
