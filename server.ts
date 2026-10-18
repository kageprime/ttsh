import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Server-side Gemini TTS route for deep, resonant Morgan Freeman-style narration
  app.post('/api/tts', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const kind = typeof req.body?.kind === 'string' ? req.body.kind : 'paragraph';

    if (!text) {
      res.status(400).json({ error: 'Text is required for narration.' });
      return;
    }

    if (
      !apiKey ||
      apiKey === 'MY_GEMINI_API_KEY' ||
      apiKey.trim().length < 10
    ) {
      res.status(503).json({
        error: 'GEMINI_API_KEY not configured; using client baritone narrator.',
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

      const stylePrompt =
        kind === 'hebrew-quote'
          ? 'Deep, warm, resonant, ancient baritone voice like Morgan Freeman speaking sacred words slowly, reverently, with a long contemplative pause in the middle'
          : 'Deep, warm, resonant, gravelly, unhurried wise elder storyteller voice like Morgan Freeman narrating a cinematic documentary, with deliberate pauses, calm gravitas, and quiet wonder';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style: stylePrompt,
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

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'TTS synthesis failed';
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
