import React, { useState, useEffect, useMemo } from 'react';
import {
  PiPlayFill,
  PiPauseFill,
  PiArrowCounterClockwise,
  PiFloppyDisk,
  PiCheck,
  PiEye,
  PiArticle,
  PiWaveform,
  PiPlus,
  PiTrash,
  PiLightning,
  PiArrowUpRight,
  PiDownloadSimple,
} from 'react-icons/pi';
import { StoryEpisode } from '../data/stories';
import {
  ChapterVisualConfig,
  hexToRgbTuple,
  ParagraphKeyframe,
  PhysicsSimulationConfig,
  resolveEffectiveVisualConfig,
  rgbTupleToHex,
  ShaderUniformConfig,
  SimulationMode,
} from '../types/visualConfig';
import { useVisualConfigs } from '../utils/visualConfigStore';
import { LivingStoryCanvas } from './LivingStoryCanvas';
import { ambientSound } from '../utils/ambientAudio';
import { narrationDirector } from '../utils/narrationEngine';
import {
  buildChapterNarrationBlocks,
  formatChapterNumber,
} from '../utils/storybookLogic';
import {
  audioAnalyzerBus,
  AudioFrequencyMetrics,
} from '../utils/audioAnalyzerBus';

interface AdminDirectorStudioProps {
  episodes: readonly StoryEpisode[];
  initialEpisodeId?: string;
  initialChapterIndex?: number;
  onOpenInReader: (episodeId: string, chapterIndex: number) => void;
}

type StudioTab = 'shader' | 'physics' | 'keyframes' | 'audio';

const SIMULATION_MODE_META: {
  id: SimulationMode;
  label: string;
  subtitle: string;
}[] = [
  {
    id: 'curl-flow',
    label: 'Curl-Noise Fluid & Embers',
    subtitle: 'Divergence-free 2D simplex curl field with velocity trails',
  },
  {
    id: 'boids-flock',
    label: 'Craig Reynolds Boids Flock',
    subtitle: 'Autonomous flocking birds, doves & shoals with wing physics',
  },
  {
    id: 'lsystem-flora',
    label: 'L-System Botanical Flora',
    subtitle: 'Recursive wind-swaying Edenic trees, canopies & olive shoots',
  },
  {
    id: 'verlet-ribbons',
    label: 'Verlet Silk & Breath Filaments',
    subtitle: 'Multi-node Verlet distance-constrained wind & water currents',
  },
  {
    id: 'voronoi-fracture',
    label: 'Voronoi Monolith Shards',
    subtitle: 'Polygonal stone/crystal fragments with torque & uplift',
  },
  {
    id: 'radial-shockwave',
    label: 'Radial Acoustic Resonance',
    subtitle: 'Concentric harmonic interference waves & crepuscular rings',
  },
  {
    id: 'celestial-orbital',
    label: 'Celestial N-Body Orbitals',
    subtitle: 'Elliptical star clusters, astrolabe rings & constellation links',
  },
];

const CURATED_LITURGICAL_PALETTES: {
  name: string;
  zenith: [number, number, number];
  horizon: [number, number, number];
  abyss: [number, number, number];
  accent: [number, number, number];
}[] = [
  {
    name: 'Abyssal Tehom',
    zenith: [0.01, 0.02, 0.06],
    horizon: [0.09, 0.16, 0.3],
    abyss: [0.01, 0.02, 0.05],
    accent: [0.5, 0.72, 0.92],
  },
  {
    name: 'Yehi Or Gold',
    zenith: [0.2, 0.13, 0.04],
    horizon: [0.95, 0.72, 0.28],
    abyss: [0.08, 0.05, 0.02],
    accent: [1.0, 0.88, 0.48],
  },
  {
    name: 'Edenic Emerald',
    zenith: [0.02, 0.08, 0.06],
    horizon: [0.16, 0.44, 0.32],
    abyss: [0.02, 0.05, 0.04],
    accent: [0.66, 0.88, 0.64],
  },
  {
    name: 'Cherubim Fire',
    zenith: [0.16, 0.03, 0.02],
    horizon: [0.88, 0.34, 0.12],
    abyss: [0.07, 0.02, 0.02],
    accent: [1.0, 0.56, 0.22],
  },
  {
    name: 'Deluge Slate',
    zenith: [0.03, 0.05, 0.09],
    horizon: [0.16, 0.26, 0.38],
    abyss: [0.02, 0.04, 0.08],
    accent: [0.58, 0.8, 0.96],
  },
  {
    name: 'Sinai Nocturne',
    zenith: [0.04, 0.03, 0.11],
    horizon: [0.26, 0.2, 0.46],
    abyss: [0.03, 0.03, 0.09],
    accent: [0.84, 0.68, 0.36],
  },
];

const QUICK_AI_PROMPTS = [
  'Blinding golden dawn shockwave breaking through pitch-black primordial waters',
  'Swaying emerald L-system botanical canopy with flocking white doves and golden mist',
  'Violent slate-grey deluge storm swells with shattering Voronoi debris and rain',
  'Whirling crimson and amber cherubim fire thermals rising into a dark sky',
  'Infinite nocturnal desert starfield with celestial orbital rings and warm watchfire embers',
];

export const AdminDirectorStudio: React.FC<AdminDirectorStudioProps> = ({
  episodes,
  initialEpisodeId,
  initialChapterIndex = 0,
  onOpenInReader,
}) => {
  const { getConfig, updateOptimistic, saveConfig, resetConfig, generateAiRecipe } =
    useVisualConfigs();

  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(
    initialEpisodeId || episodes[0].id
  );
  const selectedEpisode = useMemo(
    () =>
      episodes.find((ep) => ep.id === selectedEpisodeId) || episodes[0],
    [episodes, selectedEpisodeId]
  );

  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(() =>
    Math.max(
      0,
      Math.min(initialChapterIndex, selectedEpisode.chapters.length - 1)
    )
  );

  const activeChapter =
    selectedEpisode.chapters[
      Math.max(
        0,
        Math.min(selectedChapterIdx, selectedEpisode.chapters.length - 1)
      )
    ] || selectedEpisode.chapters[0];

  const storedConfig = getConfig(selectedEpisode.id, activeChapter.number);
  const [draftConfig, setDraftConfig] =
    useState<ChapterVisualConfig>(storedConfig);
  const [activeTab, setActiveTab] = useState<StudioTab>('shader');
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number>(0);
  const [showProseOverlay, setShowProseOverlay] = useState<boolean>(true);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [manualShockwaveCount, setManualShockwaveCount] = useState<number>(0);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessFlash, setSaveSuccessFlash] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);

  // Real-time 4-band audio telemetry meter state
  const [audioMetrics, setAudioMetrics] = useState<AudioFrequencyMetrics>({
    subBass: 0,
    mid: 0,
    treble: 0,
    voiceEnvelope: 0,
  });

  // Sync draftConfig when switching episode or chapter
  useEffect(() => {
    const fresh = getConfig(selectedEpisode.id, activeChapter.number);
    setDraftConfig(JSON.parse(JSON.stringify(fresh)));
    setActiveParagraphIndex(0);
    setIsPlayingPreview(false);
    narrationDirector.stop();
  }, [selectedEpisode.id, activeChapter.number]);

  // Live telemetry polling while inside Director Studio
  useEffect(() => {
    let raf = 0;
    let lastUpdate = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - lastUpdate < 80) return;
      lastUpdate = now;
      const m = audioAnalyzerBus.sampleMetrics(now * 0.001);
      setAudioMetrics({ ...m });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      narrationDirector.stop();
      ambientSound.stop();
    };
  }, []);

  const paragraphs = useMemo(
    () =>
      activeChapter.paragraphs && activeChapter.paragraphs.length > 0
        ? activeChapter.paragraphs
        : [activeChapter.narrative],
    [activeChapter]
  );

  // Live narration + soundscape preview inside Studio
  useEffect(() => {
    if (!isPlayingPreview) {
      narrationDirector.stop();
      ambientSound.stop();
      return;
    }

    ambientSound.start(
      activeChapter.sceneTheme,
      true,
      activeChapter.animationConfig?.motif
    );

    const blocks = buildChapterNarrationBlocks(activeChapter);
    const spokenBlocks = blocks.filter((b) => b.kind === 'paragraph');
    const targetBlock =
      spokenBlocks[Math.min(activeParagraphIndex, spokenBlocks.length - 1)] ||
      blocks[0];

    if (!targetBlock) {
      setIsPlayingPreview(false);
      return;
    }

    void narrationDirector.playBlock({
      block: targetBlock,
      sceneTheme: activeChapter.sceneTheme,
      muted: false,
      onComplete: () => {
        if (activeParagraphIndex + 1 < paragraphs.length) {
          setActiveParagraphIndex((p) => p + 1);
        } else {
          setIsPlayingPreview(false);
        }
      },
    });
  }, [isPlayingPreview, activeParagraphIndex, activeChapter, paragraphs.length]);

  const applyDraftChange = (updater: (prev: ChapterVisualConfig) => ChapterVisualConfig) => {
    setDraftConfig((prev) => {
      const next = updater(prev);
      updateOptimistic(next);
      return next;
    });
  };

  const updateShaderField = <K extends keyof ShaderUniformConfig>(
    key: K,
    value: ShaderUniformConfig[K]
  ) => {
    applyDraftChange((prev) => ({
      ...prev,
      shader: {
        ...prev.shader,
        [key]: value,
      },
    }));
  };

  const updatePhysicsField = <K extends keyof PhysicsSimulationConfig>(
    key: K,
    value: PhysicsSimulationConfig[K]
  ) => {
    applyDraftChange((prev) => ({
      ...prev,
      physics: {
        ...prev.physics,
        [key]: value,
      },
    }));
  };

  const handleSaveToBackend = async () => {
    setIsSaving(true);
    try {
      const saved = await saveConfig(draftConfig);
      setDraftConfig(saved);
      setSaveSuccessFlash(true);
      window.setTimeout(() => setSaveSuccessFlash(false), 2200);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChapter = async () => {
    const reset = await resetConfig(selectedEpisode.id, activeChapter.number);
    setDraftConfig(JSON.parse(JSON.stringify(reset)));
    setAiStatusMessage('Restored factory choreography for this chapter.');
    window.setTimeout(() => setAiStatusMessage(null), 2500);
  };

  const handleSynthesizeAiRecipe = async (promptOverride?: string) => {
    const targetPrompt = (promptOverride ?? aiPrompt).trim();
    if (!targetPrompt) return;
    setIsGeneratingAi(true);
    setAiStatusMessage('Synthesizing shader & physics recipe...');
    try {
      const recipe = await generateAiRecipe({
        prompt: targetPrompt,
        episodeTitle: selectedEpisode.title,
        chapterTitle: activeChapter.title,
        scriptureText: activeChapter.scriptureText,
        paragraphs,
        currentConfig: draftConfig,
      });

      applyDraftChange((prev) => ({
        ...prev,
        directorNotes: recipe.directorNotes || prev.directorNotes,
        shader: {
          ...prev.shader,
          ...(recipe.shader || {}),
        },
        physics: {
          ...prev.physics,
          ...(recipe.physics || {}),
        },
        paragraphKeyframes: recipe.paragraphKeyframes
          ? { ...prev.paragraphKeyframes, ...recipe.paragraphKeyframes }
          : prev.paragraphKeyframes,
      }));
      setManualShockwaveCount((c) => c + 1);
      setAiStatusMessage('Applied synthesized recipe. Click Save to persist.');
    } catch (err) {
      setAiStatusMessage(
        err instanceof Error ? err.message : 'Recipe synthesis failed'
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleExportConfigJson = () => {
    const blob = new Blob([JSON.stringify(draftConfig, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `choreography-${selectedEpisode.code.toLowerCase()}-ch${activeChapter.number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddParagraphKeyframe = (paraIdx: number) => {
    applyDraftChange((prev) => {
      const existing = prev.paragraphKeyframes[paraIdx];
      if (existing) return prev;
      const newKf: ParagraphKeyframe = {
        paragraphIndex: paraIdx,
        cueLabel: `Paragraph ${paraIdx + 1} Visual Shift`,
        transitionDuration: 1.4,
        triggerShockwave: false,
        shaderOverrides: {
          godRayIntensity: Math.min(1, prev.shader.godRayIntensity + 0.25),
          bloomStrength: Math.min(1, prev.shader.bloomStrength + 0.2),
        },
        physicsOverrides: {
          speedMultiplier: Number(
            Math.min(3, prev.physics.speedMultiplier * 1.25).toFixed(2)
          ),
        },
      };
      return {
        ...prev,
        paragraphKeyframes: {
          ...prev.paragraphKeyframes,
          [paraIdx]: newKf,
        },
      };
    });
    setActiveParagraphIndex(paraIdx);
  };

  const handleUpdateKeyframe = (
    paraIdx: number,
    updater: (kf: ParagraphKeyframe) => ParagraphKeyframe
  ) => {
    applyDraftChange((prev) => {
      const existing = prev.paragraphKeyframes[paraIdx];
      if (!existing) return prev;
      return {
        ...prev,
        paragraphKeyframes: {
          ...prev.paragraphKeyframes,
          [paraIdx]: updater(existing),
        },
      };
    });
  };

  const handleDeleteKeyframe = (paraIdx: number) => {
    applyDraftChange((prev) => {
      const nextMap = { ...prev.paragraphKeyframes };
      delete nextMap[paraIdx];
      return {
        ...prev,
        paragraphKeyframes: nextMap,
      };
    });
  };

  const effectiveLiveState = useMemo(
    () => resolveEffectiveVisualConfig(draftConfig, activeParagraphIndex),
    [draftConfig, activeParagraphIndex]
  );

  return (
    <div
      data-testid="admin-director-studio"
      className="min-h-[calc(100dvh-3.5rem)] bg-[#080706] text-[#F4EFE6] flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[#FAF6EE]/10"
    >
      {/* LEFT PANE (58%): Live Interactive Stage & Narrative Monitor */}
      <section className="lg:w-[58%] flex flex-col justify-between relative min-h-[480px] lg:h-[calc(100dvh-3.5rem)] lg:sticky lg:top-14 overflow-hidden bg-[#050609]">
        {/* Live Volumetric GLSL + Multi-Physics Stage */}
        <LivingStoryCanvas
          theme={activeChapter.sceneTheme}
          canvasMode={activeChapter.canvasMode}
          episodeId={selectedEpisode.id}
          chapterNumber={activeChapter.number}
          animationConfig={activeChapter.animationConfig}
          customVisualConfig={draftConfig}
          activeParagraphIndex={activeParagraphIndex}
          manualShockwaveTrigger={manualShockwaveCount}
          inspectionMode={!showProseOverlay}
          onPointerAudioRipple={(nx, ny, vel) => {
            ambientSound.triggerPointerRipple(
              nx,
              ny,
              vel,
              activeChapter.sceneTheme,
              true
            );
          }}
          className="absolute inset-0 z-0"
        />

        {/* Top Stage Monitor Overlay Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#080706]/82 backdrop-blur-md border-b border-[#FAF6EE]/10">
          <div className="flex items-center gap-3">
            <span className="font-mono-tabular text-[11px] uppercase tracking-[0.18em] text-[#D4A853]">
              Live Stage Monitor
            </span>
            <span className="text-[#FAF6EE]/20">·</span>
            <span className="font-mono-tabular text-[11px] text-[#FAF6EE]/70">
              {effectiveLiveState.physics.mode.toUpperCase()}
              {effectiveLiveState.physics.secondaryOverlay !== 'none'
                ? ` + ${effectiveLiveState.physics.secondaryOverlay.toUpperCase()}`
                : ''}
            </span>
          </div>

          {/* 4-Band Real-Time Audio Telemetry Meter */}
          <div className="flex items-center gap-4">
            <div
              title="Real-time Web Audio FFT & Voice Envelope Telemetry"
              className="hidden sm:flex items-center gap-2.5 px-2.5 py-1 rounded border border-[#FAF6EE]/10 bg-black/50 font-mono-tabular text-[10px] text-[#FAF6EE]/65"
            >
              <span className="uppercase tracking-wider text-[#FAF6EE]/45">
                FFT
              </span>
              <div className="flex items-end gap-1 h-3.5">
                <div
                  className="w-1.5 bg-[#7FA8D8] transition-all duration-75"
                  style={{
                    height: `${Math.max(18, Math.round(audioMetrics.subBass * 100))}%`,
                  }}
                  title="Sub-Bass"
                />
                <div
                  className="w-1.5 bg-[#D4A853] transition-all duration-75"
                  style={{
                    height: `${Math.max(18, Math.round(audioMetrics.mid * 100))}%`,
                  }}
                  title="Mid Chords"
                />
                <div
                  className="w-1.5 bg-[#A8D5A2] transition-all duration-75"
                  style={{
                    height: `${Math.max(18, Math.round(audioMetrics.treble * 100))}%`,
                  }}
                  title="Treble"
                />
                <div
                  className="w-1.5 bg-[#F4A261] transition-all duration-75"
                  style={{
                    height: `${Math.max(18, Math.round(audioMetrics.voiceEnvelope * 100))}%`,
                  }}
                  title="AI Voice Envelope"
                />
              </div>
            </div>

            <div className="flex items-center rounded-lg border border-[#FAF6EE]/12 bg-black/50 divide-x divide-[#FAF6EE]/10 overflow-hidden">
              <button
                type="button"
                onClick={() => setManualShockwaveCount((c) => c + 1)}
                title="Fire radial shockwave pulse on stage"
                className="px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[#FAF6EE]/80 hover:text-[#D4A853] hover:bg-white/5 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <PiLightning className="w-3.5 h-3.5 text-[#D4A853]" />
                <span>Pulse</span>
              </button>

              <button
                type="button"
                onClick={() => setShowProseOverlay((v) => !v)}
                className={`px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] flex items-center gap-1.5 cursor-pointer transition-colors ${
                  !showProseOverlay
                    ? 'bg-[#D4A853]/20 text-[#F5D78E]'
                    : 'text-[#FAF6EE]/75 hover:text-[#FAF6EE]'
                }`}
              >
                {showProseOverlay ? (
                  <>
                    <PiEye className="w-3.5 h-3.5" />
                    <span>Raw Canvas</span>
                  </>
                ) : (
                  <>
                    <PiArticle className="w-3.5 h-3.5" />
                    <span>Show Prose</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  narrationDirector.unlockAudio();
                  setIsPlayingPreview((p) => !p);
                }}
                className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isPlayingPreview
                    ? 'bg-[#D4A853] text-[#080706]'
                    : 'text-[#D4A853] hover:bg-[#D4A853]/15'
                }`}
              >
                {isPlayingPreview ? (
                  <>
                    <PiPauseFill className="w-3.5 h-3.5" />
                    <span>Stop Audio</span>
                  </>
                ) : (
                  <>
                    <PiPlayFill className="w-3.5 h-3.5" />
                    <span>Test TTS &amp; Audio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Center Narrative Prose Preview Overlay */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-8 pointer-events-none">
          {showProseOverlay && (
            <div className="max-w-[60ch] w-full space-y-5 text-center">
              <div className="space-y-1.5">
                <p className="font-mono-tabular text-[11px] uppercase tracking-[0.2em] text-[#D4A853]">
                  {selectedEpisode.code} · Chapter{' '}
                  {formatChapterNumber(activeChapter.number)} ·{' '}
                  {activeChapter.scriptureRef}
                </p>
                <h2 className="font-serif-editorial text-2xl sm:text-4xl text-[#FAF6EE] font-normal tracking-tight">
                  {activeChapter.title}
                </h2>
              </div>

              <blockquote className="font-serif-editorial italic text-base sm:text-lg text-[#FAF6EE]/80 border-y border-[#FAF6EE]/12 py-3 px-4">
                “{activeChapter.scriptureText}”
              </blockquote>

              <p className="font-serif-editorial text-lg sm:text-xl leading-relaxed text-[#FAF6EE]/92">
                {paragraphs[activeParagraphIndex] || paragraphs[0]}
              </p>

              {effectiveLiveState.activeKeyframe && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#D4A853]/40 bg-[#080706]/80 text-[11px] font-mono-tabular text-[#F5D78E]">
                  <PiLightning className="w-3.5 h-3.5 text-[#D4A853]" />
                  <span>
                    Active Keyframe Cue:{' '}
                    {effectiveLiveState.activeKeyframe.cueLabel} (
                    {effectiveLiveState.activeKeyframe.transitionDuration}s)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Paragraph Timeline Scrubber */}
        <div className="relative z-10 px-5 py-3.5 bg-[#080706]/88 backdrop-blur-md border-t border-[#FAF6EE]/10">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#FAF6EE]/55">
              Paragraph &amp; Narration Keyframe Scrubber (Click ¶ to preview
              state)
            </span>
            <span className="font-mono-tabular text-[11px] text-[#FAF6EE]/65">
              Paragraph {activeParagraphIndex + 1} of {paragraphs.length}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {paragraphs.map((para, idx) => {
              const hasKf = Boolean(draftConfig.paragraphKeyframes[idx]);
              const isSelected = idx === activeParagraphIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveParagraphIndex(idx)}
                  className={`px-3 py-1.5 rounded text-left transition-colors shrink-0 border cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#D4A853]/20 border-[#D4A853] text-[#FAF6EE]'
                      : hasKf
                        ? 'bg-[#FAF6EE]/[0.06] border-[#D4A853]/40 text-[#FAF6EE]/85 hover:border-[#D4A853]'
                        : 'bg-black/40 border-[#FAF6EE]/10 text-[#FAF6EE]/60 hover:text-[#FAF6EE]'
                  }`}
                >
                  <span className="font-mono-tabular text-xs font-medium text-[#D4A853]">
                    ¶{idx + 1}
                  </span>
                  <span className="text-xs max-w-[140px] truncate">
                    {para}
                  </span>
                  {hasKf && (
                    <span
                      title="Has Paragraph Keyframe Override"
                      className="w-2 h-2 rounded-full bg-[#D4A853]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* RIGHT PANE (42%): Precision Choreography Control Deck */}
      <section className="lg:w-[42%] flex flex-col bg-[#080706] overflow-y-auto">
        {/* 1. Episode & Chapter Selector + Save/Reset Persistence Header */}
        <div className="p-5 border-b border-[#FAF6EE]/10 space-y-4 bg-[#0B0D12]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono-tabular text-[10px] uppercase tracking-[0.2em] text-[#D4A853]">
                Visual Choreography Backend Studio
              </p>
              <h1 className="font-serif-editorial text-xl text-[#FAF6EE] font-medium">
                Chapter Animation Director
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onOpenInReader(selectedEpisode.id, selectedChapterIdx)
                }
                title="Open this chapter in Reader View"
                className="px-2.5 py-1.5 rounded border border-[#FAF6EE]/15 text-xs text-[#FAF6EE]/80 hover:text-[#FAF6EE] hover:border-[#FAF6EE]/30 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Reader</span>
                <PiArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleExportConfigJson}
                title="Export Chapter Config JSON"
                className="p-1.5 rounded border border-[#FAF6EE]/15 text-[#FAF6EE]/75 hover:text-[#FAF6EE] cursor-pointer transition-colors"
              >
                <PiDownloadSimple className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleResetChapter}
                title="Reset chapter to factory choreography defaults"
                className="px-2.5 py-1.5 rounded border border-[#FAF6EE]/15 text-xs text-[#FAF6EE]/75 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <PiArrowCounterClockwise className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                data-testid="save-chapter-config-btn"
                onClick={handleSaveToBackend}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded bg-[#D4A853] hover:bg-[#E2B764] text-[#080706] text-xs font-semibold uppercase tracking-[0.12em] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {saveSuccessFlash ? (
                  <>
                    <PiCheck className="w-4 h-4" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <PiFloppyDisk className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Config'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Episode & Chapter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#FAF6EE]/55 mb-1">
                Episode
              </label>
              <select
                aria-label="Select Episode"
                value={selectedEpisode.id}
                onChange={(e) => {
                  setSelectedEpisodeId(e.target.value);
                  setSelectedChapterIdx(0);
                }}
                className="w-full px-3 py-2 rounded bg-[#080706] border border-[#FAF6EE]/15 text-xs text-[#FAF6EE] focus:outline-none focus:border-[#D4A853]"
              >
                {episodes.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.code} — {ep.title} ({ep.chapters.length} ch)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#FAF6EE]/55 mb-1">
                Chapter
              </label>
              <select
                aria-label="Select Chapter"
                value={selectedChapterIdx}
                onChange={(e) => setSelectedChapterIdx(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-[#080706] border border-[#FAF6EE]/15 text-xs text-[#FAF6EE] focus:outline-none focus:border-[#D4A853]"
              >
                {selectedEpisode.chapters.map((ch, idx) => (
                  <option key={ch.number} value={idx}>
                    Ch {formatChapterNumber(ch.number)}: {ch.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Natural-Language Scene Recipe Synthesizer */}
          <div className="pt-2 border-t border-[#FAF6EE]/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#D4A853]">
                AI Scene Recipe Synthesizer
              </label>
              {aiStatusMessage && (
                <span className="font-mono-tabular text-[10px] text-[#A8D5A2]">
                  {aiStatusMessage}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSynthesizeAiRecipe();
                  }
                }}
                placeholder="Describe atmospheric lighting, shader fluid motion, or physics..."
                className="flex-1 px-3 py-1.5 rounded bg-[#080706] border border-[#FAF6EE]/15 text-xs text-[#FAF6EE] placeholder:text-[#FAF6EE]/35 focus:outline-none focus:border-[#D4A853]"
              />
              <button
                type="button"
                disabled={isGeneratingAi || !aiPrompt.trim()}
                onClick={() => void handleSynthesizeAiRecipe()}
                className="px-3 py-1.5 rounded border border-[#D4A853]/50 bg-[#D4A853]/15 hover:bg-[#D4A853]/25 disabled:opacity-40 text-xs font-medium text-[#F5D78E] whitespace-nowrap cursor-pointer transition-colors"
              >
                {isGeneratingAi ? 'Synthesizing...' : 'Synthesize'}
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {QUICK_AI_PROMPTS.map((presetPrompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setAiPrompt(presetPrompt);
                    void handleSynthesizeAiRecipe(presetPrompt);
                  }}
                  className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.09] border border-[#FAF6EE]/10 text-[10px] text-[#FAF6EE]/65 hover:text-[#FAF6EE] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  {presetPrompt.slice(0, 42)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Control Deck Navigation Tabs */}
        <div className="grid grid-cols-4 border-b border-[#FAF6EE]/10 bg-[#0A0C10] font-mono-tabular text-[11px] uppercase tracking-[0.12em]">
          {(
            [
              { id: 'shader', label: '1. GLSL Shader' },
              { id: 'physics', label: '2. Physics' },
              {
                id: 'keyframes',
                label: `3. Cues (${Object.keys(draftConfig.paragraphKeyframes).length})`,
              },
              { id: 'audio', label: '4. Audio Sync' },
            ] as { id: StudioTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#D4A853] text-[#D4A853] bg-[#D4A853]/[0.06]'
                  : 'border-transparent text-[#FAF6EE]/55 hover:text-[#FAF6EE]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3. Active Tab Inspector Content */}
        <div className="p-5 space-y-6 flex-1">
          {/* TAB 1: VOLUMETRIC GLSL SHADER & COLOR GRADING */}
          {activeTab === 'shader' && (
            <div className="space-y-6">
              {/* Curated Liturgical Palette Swatches */}
              <div className="space-y-2">
                <span className="block font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#FAF6EE]/55">
                  Liturgical Color LUT Presets
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CURATED_LITURGICAL_PALETTES.map((pal) => (
                    <button
                      key={pal.name}
                      type="button"
                      onClick={() => {
                        applyDraftChange((prev) => ({
                          ...prev,
                          shader: {
                            ...prev.shader,
                            tintZenith: [...pal.zenith],
                            tintHorizon: [...pal.horizon],
                            tintAbyss: [...pal.abyss],
                            accentColor: [...pal.accent],
                          },
                        }));
                      }}
                      className="p-2 rounded border border-[#FAF6EE]/10 hover:border-[#D4A853]/60 bg-white/[0.02] flex items-center gap-2 text-left cursor-pointer transition-colors"
                    >
                      <div className="flex -space-x-1 shrink-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/50"
                          style={{ backgroundColor: rgbTupleToHex(pal.zenith) }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/50"
                          style={{ backgroundColor: rgbTupleToHex(pal.horizon) }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/50"
                          style={{ backgroundColor: rgbTupleToHex(pal.accent) }}
                        />
                      </div>
                      <span className="text-[11px] text-[#FAF6EE]/85 truncate">
                        {pal.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4-Channel Color Pickers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#FAF6EE]/10">
                {(
                  [
                    { key: 'tintZenith', label: 'Zenith Sky' },
                    { key: 'tintHorizon', label: 'Horizon Glow' },
                    { key: 'tintAbyss', label: 'Abyssal Ground' },
                    { key: 'accentColor', label: 'Accent & Rays' },
                  ] as const
                ).map(({ key, label }) => {
                  const hex = rgbTupleToHex(draftConfig.shader[key]);
                  return (
                    <div
                      key={key}
                      className="p-2.5 rounded border border-[#FAF6EE]/10 bg-black/40 space-y-1.5"
                    >
                      <span className="block font-mono-tabular text-[10px] uppercase tracking-wider text-[#FAF6EE]/60">
                        {label}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          aria-label={label}
                          value={hex}
                          onChange={(e) =>
                            updateShaderField(key, hexToRgbTuple(e.target.value))
                          }
                          className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                        />
                        <span className="font-mono-tabular text-[11px] text-[#FAF6EE]/80">
                          {hex}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Volumetric Uniform Sliders */}
              <div className="space-y-4 pt-2 border-t border-[#FAF6EE]/10">
                <SliderControl
                  label="Crepuscular God-Ray Intensity"
                  value={draftConfig.shader.godRayIntensity}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) => updateShaderField('godRayIntensity', v)}
                />
                <SliderControl
                  label="God-Ray Shaft Angle"
                  value={draftConfig.shader.godRayAngle}
                  min={-0.8}
                  max={0.8}
                  step={0.02}
                  onChange={(v) => updateShaderField('godRayAngle', v)}
                />
                <SliderControl
                  label="FBM Fluid Domain Warp Strength"
                  value={draftConfig.shader.domainWarpStrength}
                  min={0}
                  max={2}
                  step={0.05}
                  onChange={(v) => updateShaderField('domainWarpStrength', v)}
                />
                <SliderControl
                  label="Atmospheric Warp Evolution Speed"
                  value={draftConfig.shader.domainWarpSpeed}
                  min={0.05}
                  max={1.5}
                  step={0.02}
                  onChange={(v) => updateShaderField('domainWarpSpeed', v)}
                />
                <SliderControl
                  label="Gerstner Wave Swell & Parting"
                  value={draftConfig.shader.waveDisplacement}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) => updateShaderField('waveDisplacement', v)}
                />
                <SliderControl
                  label="Celestial Starfield & Nebula Density"
                  value={draftConfig.shader.nebulaDensity}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) => updateShaderField('nebulaDensity', v)}
                />
                <SliderControl
                  label="Atmospheric Halation & Bloom"
                  value={draftConfig.shader.bloomStrength}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) => updateShaderField('bloomStrength', v)}
                />
                <SliderControl
                  label="Edge Vignette Framing"
                  value={draftConfig.shader.vignetteIntensity}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) => updateShaderField('vignetteIntensity', v)}
                />
                <SliderControl
                  label="Optical Film Grain"
                  value={draftConfig.shader.grainIntensity}
                  min={0}
                  max={0.18}
                  step={0.005}
                  onChange={(v) => updateShaderField('grainIntensity', v)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-PHYSICS SIMULATION ENGINE */}
          {activeTab === 'physics' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="block font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#FAF6EE]/55">
                  Primary Physics Simulation Engine
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {SIMULATION_MODE_META.map((sim) => {
                    const selected = draftConfig.physics.mode === sim.id;
                    return (
                      <button
                        key={sim.id}
                        type="button"
                        onClick={() => updatePhysicsField('mode', sim.id)}
                        className={`p-3 rounded border text-left transition-colors cursor-pointer flex items-center justify-between ${
                          selected
                            ? 'border-[#D4A853] bg-[#D4A853]/12 text-[#FAF6EE]'
                            : 'border-[#FAF6EE]/10 bg-white/[0.02] text-[#FAF6EE]/75 hover:border-[#FAF6EE]/25'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium text-[#FAF6EE]">
                            {sim.label}
                          </div>
                          <div className="text-[11px] text-[#FAF6EE]/55">
                            {sim.subtitle}
                          </div>
                        </div>
                        <span className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#D4A853]">
                          {selected ? 'Active' : 'Select'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Composite Layer */}
              <div className="pt-2 border-t border-[#FAF6EE]/10">
                <label className="block font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#FAF6EE]/55 mb-1.5">
                  Secondary Composite Physics Overlay
                </label>
                <select
                  value={draftConfig.physics.secondaryOverlay}
                  onChange={(e) =>
                    updatePhysicsField(
                      'secondaryOverlay',
                      e.target.value as SimulationMode | 'none'
                    )
                  }
                  className="w-full px-3 py-2 rounded bg-[#080706] border border-[#FAF6EE]/15 text-xs text-[#FAF6EE]"
                >
                  <option value="none">None (Single Layer)</option>
                  {SIMULATION_MODE_META.map((s) => (
                    <option key={s.id} value={s.id}>
                      + {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Physics Constants Sliders */}
              <div className="space-y-4 pt-2 border-t border-[#FAF6EE]/10">
                <SliderControl
                  label="Active Entity / Particle Count"
                  value={draftConfig.physics.particleCount}
                  min={25}
                  max={320}
                  step={5}
                  onChange={(v) => updatePhysicsField('particleCount', v)}
                />
                <SliderControl
                  label="Simulation Velocity Multiplier"
                  value={draftConfig.physics.speedMultiplier}
                  min={0.15}
                  max={2.8}
                  step={0.05}
                  onChange={(v) => updatePhysicsField('speedMultiplier', v)}
                />
                <SliderControl
                  label="Curl-Noise & Wind Turbulence"
                  value={draftConfig.physics.turbulence}
                  min={0}
                  max={2.0}
                  step={0.05}
                  onChange={(v) => updatePhysicsField('turbulence', v)}
                />
                <SliderControl
                  label="Horizontal Drift / Wind Force (Gx)"
                  value={draftConfig.physics.gravityVector[0]}
                  min={-0.8}
                  max={0.8}
                  step={0.02}
                  onChange={(v) =>
                    updatePhysicsField('gravityVector', [
                      v,
                      draftConfig.physics.gravityVector[1],
                    ])
                  }
                />
                <SliderControl
                  label="Vertical Buoyancy / Gravity (Gy)"
                  value={draftConfig.physics.gravityVector[1]}
                  min={-0.8}
                  max={0.8}
                  step={0.02}
                  onChange={(v) =>
                    updatePhysicsField('gravityVector', [
                      draftConfig.physics.gravityVector[0],
                      v,
                    ])
                  }
                />
                <SliderControl
                  label="Flock Cohesion & Attractor Pull"
                  value={draftConfig.physics.cohesion}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) => updatePhysicsField('cohesion', v)}
                />
                <SliderControl
                  label="Flock Separation & Scatter Radius"
                  value={draftConfig.physics.separation}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) => updatePhysicsField('separation', v)}
                />
                <SliderControl
                  label="Geometry & Filament Scale"
                  value={draftConfig.physics.scaleMultiplier}
                  min={0.5}
                  max={2.4}
                  step={0.05}
                  onChange={(v) => updatePhysicsField('scaleMultiplier', v)}
                />
              </div>
            </div>
          )}

          {/* TAB 3: PARAGRAPH & TTS KEYFRAME SEQUENCER */}
          {activeTab === 'keyframes' && (
            <div className="space-y-4">
              <p className="text-xs text-[#FAF6EE]/65 leading-relaxed">
                Attach visual keyframe overrides to specific paragraphs. When the
                reader scrolls to—or the AI Baritone Narrator speaks—that
                paragraph, the shader and physics engine smoothly morphs into
                your cue.
              </p>

              <div className="space-y-3">
                {paragraphs.map((para, idx) => {
                  const kf = draftConfig.paragraphKeyframes[idx];
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded border transition-colors ${
                        activeParagraphIndex === idx
                          ? 'border-[#D4A853]/70 bg-[#D4A853]/[0.05]'
                          : 'border-[#FAF6EE]/10 bg-black/35'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveParagraphIndex(idx)}
                          className="text-left flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono-tabular text-xs font-semibold text-[#D4A853]">
                              Paragraph ¶{idx + 1}
                            </span>
                            {kf && (
                              <span className="font-mono-tabular text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#D4A853]/20 text-[#F5D78E]">
                                Active Cue
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#FAF6EE]/70 line-clamp-2 mt-1 font-serif-editorial">
                            “{para}”
                          </p>
                        </button>

                        {!kf ? (
                          <button
                            type="button"
                            onClick={() => handleAddParagraphKeyframe(idx)}
                            className="px-2.5 py-1 rounded border border-[#FAF6EE]/15 hover:border-[#D4A853] text-[11px] text-[#FAF6EE]/80 hover:text-[#D4A853] flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                          >
                            <PiPlus className="w-3.5 h-3.5" />
                            <span>Add Cue</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteKeyframe(idx)}
                            title="Remove Keyframe Cue"
                            className="p-1.5 rounded border border-[#FAF6EE]/15 text-[#FAF6EE]/60 hover:text-rose-400 cursor-pointer"
                          >
                            <PiTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {kf && (
                        <div className="mt-3 pt-3 border-t border-[#FAF6EE]/10 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block font-mono-tabular text-[10px] uppercase text-[#FAF6EE]/50 mb-1">
                                Cue Label
                              </label>
                              <input
                                type="text"
                                value={kf.cueLabel}
                                onChange={(e) =>
                                  handleUpdateKeyframe(idx, (old) => ({
                                    ...old,
                                    cueLabel: e.target.value,
                                  }))
                                }
                                className="w-full px-2.5 py-1 rounded bg-[#080706] border border-[#FAF6EE]/15 text-xs text-[#FAF6EE]"
                              />
                            </div>

                            <div className="flex items-end">
                              <label className="flex items-center gap-2 text-xs text-[#FAF6EE]/85 cursor-pointer py-1">
                                <input
                                  type="checkbox"
                                  checked={Boolean(kf.triggerShockwave)}
                                  onChange={(e) =>
                                    handleUpdateKeyframe(idx, (old) => ({
                                      ...old,
                                      triggerShockwave: e.target.checked,
                                    }))
                                  }
                                  className="accent-[#D4A853]"
                                />
                                <span>Trigger Radial Shockwave on Entry</span>
                              </label>
                            </div>
                          </div>

                          <SliderControl
                            label="Transition Duration (seconds)"
                            value={kf.transitionDuration}
                            min={0.3}
                            max={4.5}
                            step={0.1}
                            onChange={(v) =>
                              handleUpdateKeyframe(idx, (old) => ({
                                ...old,
                                transitionDuration: v,
                              }))
                            }
                          />

                          <SliderControl
                            label="Override God-Ray Intensity"
                            value={
                              kf.shaderOverrides?.godRayIntensity ??
                              draftConfig.shader.godRayIntensity
                            }
                            min={0}
                            max={1}
                            step={0.02}
                            onChange={(v) =>
                              handleUpdateKeyframe(idx, (old) => ({
                                ...old,
                                shaderOverrides: {
                                  ...(old.shaderOverrides || {}),
                                  godRayIntensity: v,
                                },
                              }))
                            }
                          />

                          <SliderControl
                            label="Override Atmospheric Bloom"
                            value={
                              kf.shaderOverrides?.bloomStrength ??
                              draftConfig.shader.bloomStrength
                            }
                            min={0}
                            max={1}
                            step={0.02}
                            onChange={(v) =>
                              handleUpdateKeyframe(idx, (old) => ({
                                ...old,
                                shaderOverrides: {
                                  ...(old.shaderOverrides || {}),
                                  bloomStrength: v,
                                },
                              }))
                            }
                          />

                          <SliderControl
                            label="Override Physics Speed Multiplier"
                            value={
                              kf.physicsOverrides?.speedMultiplier ??
                              draftConfig.physics.speedMultiplier
                            }
                            min={0.2}
                            max={2.8}
                            step={0.05}
                            onChange={(v) =>
                              handleUpdateKeyframe(idx, (old) => ({
                                ...old,
                                physicsOverrides: {
                                  ...(old.physicsOverrides || {}),
                                  speedMultiplier: v,
                                },
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: AUDIO-REACTIVE BINDING MATRIX */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3.5 rounded border border-[#FAF6EE]/10 bg-black/40">
                <div className="flex items-center gap-2.5">
                  <PiWaveform className="w-5 h-5 text-[#D4A853]" />
                  <div>
                    <div className="text-xs font-medium text-[#FAF6EE]">
                      Real-Time Web Audio FFT &amp; Voice Reactivity
                    </div>
                    <div className="text-[11px] text-[#FAF6EE]/55">
                      Modulates GLSL uniforms &amp; particle energy from live
                      soundscape &amp; AI narration
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={draftConfig.audioReactive.enabled}
                  onChange={(e) =>
                    applyDraftChange((prev) => ({
                      ...prev,
                      audioReactive: {
                        ...prev.audioReactive,
                        enabled: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 accent-[#D4A853] cursor-pointer"
                />
              </div>

              <div className="space-y-4">
                <SliderControl
                  label="Sub-Bass (20–120Hz) → Gerstner Wave Swell"
                  value={draftConfig.audioReactive.subBassToWaveSwell}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) =>
                    applyDraftChange((prev) => ({
                      ...prev,
                      audioReactive: {
                        ...prev.audioReactive,
                        subBassToWaveSwell: v,
                      },
                    }))
                  }
                />
                <SliderControl
                  label="Harmonic Mid Chords (200–1200Hz) → God-Rays"
                  value={draftConfig.audioReactive.midToGodRays}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) =>
                    applyDraftChange((prev) => ({
                      ...prev,
                      audioReactive: {
                        ...prev.audioReactive,
                        midToGodRays: v,
                      },
                    }))
                  }
                />
                <SliderControl
                  label="AI Baritone Voice Envelope → Bloom & Ribbon Ripple"
                  value={draftConfig.audioReactive.voiceEnvelopeToBloom}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) =>
                    applyDraftChange((prev) => ({
                      ...prev,
                      audioReactive: {
                        ...prev.audioReactive,
                        voiceEnvelopeToBloom: v,
                      },
                    }))
                  }
                />
                <SliderControl
                  label="High Shimmer (>2.5kHz) → Particle Sparkle"
                  value={draftConfig.audioReactive.trebleToParticleSparkle}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(v) =>
                    applyDraftChange((prev) => ({
                      ...prev,
                      audioReactive: {
                        ...prev.audioReactive,
                        trebleToParticleSparkle: v,
                      },
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#FAF6EE]/80">{label}</span>
        <span className="font-mono-tabular text-[#D4A853]">
          {Number.isInteger(step) ? value : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-[#FAF6EE]/15 rounded-lg appearance-none cursor-pointer accent-[#D4A853]"
      />
    </div>
  );
};
