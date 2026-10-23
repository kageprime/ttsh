import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  app.use(express.json({ limit: '1mb' }));

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
