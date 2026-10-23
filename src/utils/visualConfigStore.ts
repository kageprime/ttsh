import { useState, useEffect, useCallback } from 'react';
import {
  ChapterVisualConfig,
  makeChapterConfigKey,
} from '../types/visualConfig';
import {
  DEFAULT_CHAPTER_CONFIGS,
  getDefaultChapterVisualConfig,
} from '../data/defaultChapterConfigs';

const LOCAL_CACHE_KEY = 'bibleverse_visual_configs_cache_v1';

let memoryConfigs: Record<string, ChapterVisualConfig> = (() => {
  const base: Record<string, ChapterVisualConfig> = JSON.parse(
    JSON.stringify(DEFAULT_CHAPTER_CONFIGS)
  );
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, ChapterVisualConfig>;
        return { ...base, ...parsed };
      }
    } catch {
      // Ignore storage read errors
    }
  }
  return base;
})();

let hasFetchedServer = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(memoryConfigs));
    }
  } catch {
    // Ignore storage write errors
  }
  for (const fn of listeners) {
    fn();
  }
}

export async function fetchServerChapterConfigs(): Promise<
  Record<string, ChapterVisualConfig>
> {
  try {
    const res = await fetch('/api/chapter-configs');
    if (res.ok) {
      const data = (await res.json()) as {
        configs?: Record<string, ChapterVisualConfig>;
      };
      if (data.configs && typeof data.configs === 'object') {
        memoryConfigs = {
          ...JSON.parse(JSON.stringify(DEFAULT_CHAPTER_CONFIGS)),
          ...data.configs,
        };
        hasFetchedServer = true;
        notifyListeners();
      }
    }
  } catch {
    // Fallback to cached/default configs if offline
  }
  return memoryConfigs;
}

export function getStoredChapterVisualConfig(
  episodeId: string,
  chapterNumber: number
): ChapterVisualConfig {
  const key = makeChapterConfigKey(episodeId, chapterNumber);
  return (
    memoryConfigs[key] ||
    getDefaultChapterVisualConfig(episodeId, chapterNumber)
  );
}

export function updateChapterVisualConfigOptimistic(
  config: ChapterVisualConfig
): void {
  const key = makeChapterConfigKey(config.episodeId, config.chapterNumber);
  memoryConfigs = {
    ...memoryConfigs,
    [key]: {
      ...config,
      id: key,
      updatedAt: new Date().toISOString(),
    },
  };
  notifyListeners();
}

export async function saveChapterVisualConfigToServer(
  config: ChapterVisualConfig
): Promise<ChapterVisualConfig> {
  const key = makeChapterConfigKey(config.episodeId, config.chapterNumber);
  const updated: ChapterVisualConfig = {
    ...config,
    id: key,
    updatedAt: new Date().toISOString(),
  };
  memoryConfigs = {
    ...memoryConfigs,
    [key]: updated,
  };
  notifyListeners();

  try {
    const res = await fetch(
      `/api/chapter-configs/${encodeURIComponent(config.episodeId)}/${config.chapterNumber}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }
    );
    if (res.ok) {
      const data = (await res.json()) as { config?: ChapterVisualConfig };
      if (data.config) {
        memoryConfigs = {
          ...memoryConfigs,
          [key]: data.config,
        };
        notifyListeners();
        return data.config;
      }
    }
  } catch {
    // Saved optimistically in local cache even if request fails
  }
  return updated;
}

export async function resetChapterVisualConfigOnServer(
  episodeId: string,
  chapterNumber: number
): Promise<ChapterVisualConfig> {
  const key = makeChapterConfigKey(episodeId, chapterNumber);
  const defaultCfg = getDefaultChapterVisualConfig(episodeId, chapterNumber);
  memoryConfigs = {
    ...memoryConfigs,
    [key]: defaultCfg,
  };
  notifyListeners();

  try {
    const res = await fetch('/api/chapter-configs/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ episodeId, chapterNumber }),
    });
    if (res.ok) {
      const data = (await res.json()) as { config?: ChapterVisualConfig };
      if (data.config) {
        memoryConfigs = {
          ...memoryConfigs,
          [key]: data.config,
        };
        notifyListeners();
        return data.config;
      }
    }
  } catch {
    // Ignore
  }
  return defaultCfg;
}

export async function generateAiSceneRecipe(params: {
  prompt: string;
  episodeTitle: string;
  chapterTitle: string;
  scriptureText: string;
  paragraphs: string[];
  currentConfig: ChapterVisualConfig;
}): Promise<Partial<ChapterVisualConfig>> {
  const res = await fetch('/api/director/generate-preset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      (errBody as { error?: string }).error ||
        'Failed to synthesize AI scene recipe'
    );
  }

  const data = (await res.json()) as { recipe: Partial<ChapterVisualConfig> };
  return data.recipe;
}

export function useVisualConfigs() {
  const [configs, setConfigs] =
    useState<Record<string, ChapterVisualConfig>>(memoryConfigs);

  useEffect(() => {
    const handleUpdate = () => {
      setConfigs({ ...memoryConfigs });
    };
    listeners.add(handleUpdate);

    if (!hasFetchedServer) {
      void fetchServerChapterConfigs();
    }

    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const getConfig = useCallback(
    (episodeId: string, chapterNumber: number): ChapterVisualConfig => {
      const key = makeChapterConfigKey(episodeId, chapterNumber);
      return (
        configs[key] || getDefaultChapterVisualConfig(episodeId, chapterNumber)
      );
    },
    [configs]
  );

  return {
    configs,
    getConfig,
    updateOptimistic: updateChapterVisualConfigOptimistic,
    saveConfig: saveChapterVisualConfigToServer,
    resetConfig: resetChapterVisualConfigOnServer,
    generateAiRecipe: generateAiSceneRecipe,
  };
}
