import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import {
  DEFAULT_CHAPTER_CONFIGS,
  getDefaultChapterVisualConfig,
} from './src/data/defaultChapterConfigs';
import {
  ChapterVisualConfig,
  makeChapterConfigKey,
  SimulationMode,
} from './src/types/visualConfig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const CONFIGS_FILE_PATH = path.join(DATA_DIR, 'chapter-configs.json');

function loadPersistedChapterConfigs(): Record<string, ChapterVisualConfig> {
  const defaults: Record<string, ChapterVisualConfig> = JSON.parse(
    JSON.stringify(DEFAULT_CHAPTER_CONFIGS)
  );
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(CONFIGS_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIGS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, ChapterVisualConfig>;
      const merged = { ...defaults, ...parsed };
      return merged;
    } else {
      fs.writeFileSync(
        CONFIGS_FILE_PATH,
        JSON.stringify(defaults, null, 2),
        'utf-8'
      );
    }
  } catch {
    // Fallback to in-memory defaults if filesystem is read-only
  }
  return defaults;
}

function savePersistedChapterConfigs(
  configs: Record<string, ChapterVisualConfig>
): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      CONFIGS_FILE_PATH,
      JSON.stringify(configs, null, 2),
      'utf-8'
    );
  } catch {
    // Ignore write failure on read-only fs
  }
}

function synthesizeDeterministicPresetFromPrompt(
  prompt: string,
  paragraphs: string[] = []
): Partial<ChapterVisualConfig> {
  const lower = prompt.toLowerCase();
  const isStorm = /\b(storm|flood|deluge|tempest|waves|ocean|deep|rain|thunder)\b/.test(lower);
  const isFire = /\b(fire|flame|sword|ember|ash|burn|cherubim|altar|blaze)\b/.test(lower);
  const isDawn = /\b(light|dawn|sun|gold|glory|burst|shockwave|morning|rainbow)\b/.test(lower);
  const isFlora = /\b(garden|eden|tree|olive|forest|leaf|branch|botanical|river)\b/.test(lower);
  const isBoids = /\b(dove|bird|flock|eagle|wings|swarm|creatures|fish|shoal)\b/.test(lower);
  const isCosmos = /\b(star|cosmos|nebula|heaven|night|tent|galaxy|orbital)\b/.test(lower);

  let mode: SimulationMode = 'curl-flow';
  let secondaryOverlay: SimulationMode | 'none' = 'radial-shockwave';

  if (isBoids) {
    mode = 'boids-flock';
    secondaryOverlay = isFlora ? 'lsystem-flora' : 'verlet-ribbons';
  } else if (isFlora) {
    mode = 'lsystem-flora';
    secondaryOverlay = 'curl-flow';
  } else if (isCosmos) {
    mode = 'celestial-orbital';
    secondaryOverlay = 'verlet-ribbons';
  } else if (isStorm) {
    mode = 'voronoi-fracture';
    secondaryOverlay = 'curl-flow';
  } else if (isDawn) {
    mode = 'radial-shockwave';
    secondaryOverlay = 'curl-flow';
  } else if (isFire) {
    mode = 'curl-flow';
    secondaryOverlay = 'voronoi-fracture';
  }

  return {
    directorNotes: `Synthesized from direction: "${prompt}"`,
    shader: {
      tintZenith: isFire
        ? [0.18, 0.03, 0.02]
        : isDawn
          ? [0.22, 0.14, 0.04]
          : isFlora
            ? [0.03, 0.09, 0.06]
            : [0.02, 0.04, 0.1],
      tintHorizon: isFire
        ? [0.92, 0.35, 0.12]
        : isDawn
          ? [0.96, 0.74, 0.28]
          : isFlora
            ? [0.18, 0.46, 0.34]
            : isStorm
              ? [0.16, 0.28, 0.4]
              : [0.24, 0.22, 0.48],
      tintAbyss: isFire
        ? [0.08, 0.02, 0.02]
        : isFlora
          ? [0.02, 0.05, 0.04]
          : [0.02, 0.03, 0.07],
      accentColor: isFire
        ? [1.0, 0.52, 0.2]
        : isFlora
          ? [0.55, 0.9, 0.65]
          : isStorm
            ? [0.58, 0.82, 0.98]
            : [0.98, 0.82, 0.42],
      godRayIntensity: isDawn ? 0.94 : isFlora ? 0.78 : isStorm ? 0.25 : 0.6,
      godRayAngle: isStorm ? -0.32 : 0.08,
      domainWarpStrength: isStorm || isFire ? 1.75 : 0.95,
      domainWarpSpeed: isStorm || isFire ? 0.68 : 0.28,
      waveDisplacement: isStorm ? 0.96 : 0.38,
      nebulaDensity: isCosmos ? 0.95 : 0.38,
      bloomStrength: isDawn || isFire ? 0.88 : 0.6,
      vignetteIntensity: isStorm ? 0.7 : 0.48,
      grainIntensity: 0.04,
    },
    physics: {
      mode,
      particleCount: isStorm || isFire ? 220 : 150,
      speedMultiplier: isStorm || isFire ? 1.55 : 0.85,
      turbulence: isStorm || isFire ? 1.5 : 0.65,
      gravityVector: isFire
        ? [0.06, -0.35]
        : isStorm
          ? [-0.2, 0.55]
          : [0, -0.06],
      cohesion: isBoids ? 0.82 : 0.65,
      separation: isBoids ? 0.55 : 0.48,
      scaleMultiplier: 1.25,
      secondaryOverlay,
    },
    paragraphKeyframes:
      paragraphs.length > 0
        ? {
            0: {
              paragraphIndex: 0,
              cueLabel: `Opening Cue: ${prompt.slice(0, 38)}`,
              transitionDuration: 1.2,
              triggerShockwave: isDawn || isStorm,
            },
          }
        : {},
  };
}

function sanitizeTextForNeuralTts(raw: string): string {
  return raw
    .replace(/&/g, ' and ')
    .replace(/[<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Synthesizes warm, deep, natural baritone narration using Edge Neural TTS
 * ('en-US-ChristopherNeural' at +6% brisk pace and -8Hz resonant baritone pitch)
 * so every chapter of every episode uses the exact same speaker with zero quota cutoff.
 */
async function synthesizeWithEdgeBaritone(text: string): Promise<string> {
  const cleanText = sanitizeTextForNeuralTts(text);
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(
      'en-US-ChristopherNeural',
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );
    const { audioStream } = tts.toStream(cleanText, {
      rate: '+6%',
      pitch: '-8Hz',
    });
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const mp3Buffer = Buffer.concat(chunks);
    if (mp3Buffer.length < 128) {
      throw new Error('Empty audio stream from neural baritone synthesizer');
    }
    return mp3Buffer.toString('base64');
  } finally {
    try {
      tts.close();
    } catch {
      // Ignore close cleanup
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  // Persistent Chapter Visual Choreography Store
  let chapterConfigsStore = loadPersistedChapterConfigs();

  app.get('/api/chapter-configs', (_req, res) => {
    res.json({ configs: chapterConfigsStore });
  });

  app.put('/api/chapter-configs/:episodeId/:chapterNumber', (req, res) => {
    const { episodeId, chapterNumber } = req.params;
    const chNum = Number(chapterNumber);
    if (!episodeId || Number.isNaN(chNum)) {
      res.status(400).json({ error: 'Invalid episodeId or chapterNumber' });
      return;
    }

    const key = makeChapterConfigKey(episodeId, chNum);
    const existing =
      chapterConfigsStore[key] ||
      getDefaultChapterVisualConfig(episodeId, chNum);

    const incoming = req.body as Partial<ChapterVisualConfig>;
    const updated: ChapterVisualConfig = {
      ...existing,
      ...incoming,
      id: key,
      episodeId,
      chapterNumber: chNum,
      shader: {
        ...existing.shader,
        ...(incoming.shader || {}),
      },
      physics: {
        ...existing.physics,
        ...(incoming.physics || {}),
      },
      audioReactive: {
        ...existing.audioReactive,
        ...(incoming.audioReactive || {}),
      },
      paragraphKeyframes:
        incoming.paragraphKeyframes !== undefined
          ? incoming.paragraphKeyframes
          : existing.paragraphKeyframes,
      updatedAt: new Date().toISOString(),
    };

    chapterConfigsStore[key] = updated;
    savePersistedChapterConfigs(chapterConfigsStore);
    res.json({ config: updated });
  });

  app.post('/api/chapter-configs/reset', (req, res) => {
    const { episodeId, chapterNumber } = req.body as {
      episodeId?: string;
      chapterNumber?: number;
    };

    if (episodeId && typeof chapterNumber === 'number') {
      const key = makeChapterConfigKey(episodeId, chapterNumber);
      const resetCfg = getDefaultChapterVisualConfig(episodeId, chapterNumber);
      chapterConfigsStore[key] = resetCfg;
      savePersistedChapterConfigs(chapterConfigsStore);
      res.json({ config: resetCfg });
      return;
    }

    chapterConfigsStore = JSON.parse(JSON.stringify(DEFAULT_CHAPTER_CONFIGS));
    savePersistedChapterConfigs(chapterConfigsStore);
    res.json({ configs: chapterConfigsStore });
  });

  app.post('/api/director/generate-preset', async (req, res) => {
    const {
      prompt = '',
      episodeTitle = '',
      chapterTitle = '',
      scriptureText = '',
      paragraphs = [],
    } = req.body as {
      prompt?: string;
      episodeTitle?: string;
      chapterTitle?: string;
      scriptureText?: string;
      paragraphs?: string[];
    };

    if (!prompt.trim()) {
      res.status(400).json({ error: 'A visual direction prompt is required.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (
      !apiKey ||
      apiKey === 'MY_GEMINI_API_KEY' ||
      apiKey.trim().length < 10
    ) {
      const fallbackRecipe = synthesizeDeterministicPresetFromPrompt(
        prompt,
        paragraphs
      );
      res.json({ recipe: fallbackRecipe });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemPrompt = `You are a Senior WebGL Shader & Physics Visual Director for a contemplative biblical interactive edition.
Given the user's visual direction and chapter context, output a JSON recipe containing volumetric GLSL shader uniforms and multi-physics simulation settings.
Allowed simulation modes: "curl-flow", "boids-flock", "lsystem-flora", "verlet-ribbons", "voronoi-fracture", "radial-shockwave", "celestial-orbital".
RGB color arrays must contain 3 floats between 0.0 and 1.0.`;

      const userPrompt = `Episode: ${episodeTitle}
Chapter: ${chapterTitle}
Scripture: ${scriptureText}
Paragraph Count: ${paragraphs.length}
Director Prompt: "${prompt}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              directorNotes: { type: Type.STRING },
              shader: {
                type: Type.OBJECT,
                properties: {
                  tintZenith: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                  },
                  tintHorizon: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                  },
                  tintAbyss: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                  },
                  accentColor: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                  },
                  godRayIntensity: { type: Type.NUMBER },
                  godRayAngle: { type: Type.NUMBER },
                  domainWarpStrength: { type: Type.NUMBER },
                  domainWarpSpeed: { type: Type.NUMBER },
                  waveDisplacement: { type: Type.NUMBER },
                  nebulaDensity: { type: Type.NUMBER },
                  bloomStrength: { type: Type.NUMBER },
                  vignetteIntensity: { type: Type.NUMBER },
                  grainIntensity: { type: Type.NUMBER },
                },
              },
              physics: {
                type: Type.OBJECT,
                properties: {
                  mode: { type: Type.STRING },
                  particleCount: { type: Type.NUMBER },
                  speedMultiplier: { type: Type.NUMBER },
                  turbulence: { type: Type.NUMBER },
                  gravityVector: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                  },
                  cohesion: { type: Type.NUMBER },
                  separation: { type: Type.NUMBER },
                  scaleMultiplier: { type: Type.NUMBER },
                  secondaryOverlay: { type: Type.STRING },
                },
              },
            },
          },
        },
      });

      const textOut = response.text || '';
      const parsed = JSON.parse(textOut) as Partial<ChapterVisualConfig>;
      res.json({ recipe: parsed });
    } catch {
      const fallbackRecipe = synthesizeDeterministicPresetFromPrompt(
        prompt,
        paragraphs
      );
      res.json({ recipe: fallbackRecipe });
    }
  });

  // Server-side in-memory TTS cache and in-flight deduplication map
  const ttsMemoryCache = new Map<
    string,
    { audioBase64: string; mimeType: string }
  >();
  const inflightTts = new Map<
    string,
    Promise<{ audioBase64: string; mimeType: string } | null>
  >();

  // Server-side unified neural baritone TTS route
  app.post('/api/tts', async (req, res) => {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

    if (!text) {
      res.status(400).json({ error: 'Text is required for narration.' });
      return;
    }

    const cached = ttsMemoryCache.get(text);
    if (cached) {
      res.json(cached);
      return;
    }

    let synthesisPromise = inflightTts.get(text);
    if (!synthesisPromise) {
      synthesisPromise = (async () => {
        // 1. Primary Unlimited Neural Baritone ('en-US-ChristopherNeural') with automatic retry + backoff
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            if (attempt > 0) {
              await new Promise((r) => setTimeout(r, attempt * 220));
            }
            const audioBase64 = await synthesizeWithEdgeBaritone(text);
            const payload = {
              audioBase64,
              mimeType: 'audio/mpeg',
            };
            if (ttsMemoryCache.size > 600) {
              const firstKey = ttsMemoryCache.keys().next().value;
              if (firstKey) ttsMemoryCache.delete(firstKey);
            }
            ttsMemoryCache.set(text, payload);
            return payload;
          } catch {
            // Retry with backoff or fall through to secondary Gemini neural TTS
          }
        }
        return null;
      })();

      inflightTts.set(text, synthesisPromise);
    }

    try {
      const neuralPayload = await synthesisPromise;
      if (neuralPayload) {
        res.json(neuralPayload);
        return;
      }
    } finally {
      inflightTts.delete(text);
    }

    // 2. Secondary Server-Side AI Fallback: Gemini Neural TTS ('Charon')
    const apiKey = process.env.GEMINI_API_KEY;
    if (
      !apiKey ||
      apiKey === 'MY_GEMINI_API_KEY' ||
      apiKey.trim().length < 10
    ) {
      res.status(503).json({
        error: 'AI Neural TTS temporarily unavailable.',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style:
                    'Warm, clear, resonant baritone narrator like Morgan Freeman speaking at a brisk, natural storytelling pace',
                },
              } as Record<string, unknown>,
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Charon',
              },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        res.status(502).json({ error: 'No audio returned from TTS model.' });
        return;
      }

      const payload = {
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      };
      ttsMemoryCache.set(text, payload);
      res.json(payload);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'TTS synthesis failed';
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
