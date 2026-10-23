# Implementation Plan: Volumetric GLSL Visual Engine & Admin Visual Director Studio

## 1. Architectural Vision & Problem Statement

Currently, chapter visuals rely on four generic WebGL background gradients (`Ocean`, `Dawn`, `Forest`, `Cosmos`) paired with simple 2D wireframe primitives (`ctx.arc` and basic line strokes). Because every chapter shares the same underlying shader math and static loop structure, dramatic biblical moments—such as the pitch-black abyss bursting into *The First Light*, the organic blossoming of *Eden*, the violent swells of *The Great Flood*, or the fracturing of *The Tower of Babel*—feel repetitive and lack physical authenticity.

To transform the reading and listening experience into a living, choreographed visual edition—and give you full creative control over every chapter and paragraph—we will build:

1. **Volumetric GLSL Shader & Multi-Physics Engine**: A unified WebGL + Physics pipeline combining domain-warped FBM (Fractional Brownian Motion) atmospherics, raymarched crepuscular god-rays, Gerstner wave swells, curl-noise fluid advection, Craig Reynolds Boid flocking, recursive L-system botanical growth, Verlet ribbon physics, and Voronoi fracture dynamics.
2. **Backend Choreography Store & AI Recipe Endpoint (`server.ts`)**: Persistent server-side configuration storage (`/data/chapter-configs.json`) exposed via REST endpoints (`GET/PUT/POST /api/chapter-configs`) alongside a server-side Gemini endpoint (`POST /api/director/generate-preset`) that converts natural-language visual directions into shader and physics parameters.
3. **Split-Screen Admin Visual Director Studio (`AdminDirectorStudio.tsx`)**: A dedicated full-viewport studio route (`Director Studio`) featuring a live split-screen reader stage on the left and a precision parameter, audio-reactive, and paragraph-keyframe choreography deck on the right.

---

## 2. Visual & Interaction Design Paradigm

- **Aesthetic Philosophy**: High-craft dark UI (`#080706` carbon obsidian canvas, `1px solid rgba(214,199,178,0.12)` exposed hairlines, `JetBrains Mono` `tabular-nums` telemetry readouts) for the Admin Director Studio, juxtaposed with museum-grade atmospheric minimalism on the Live Stage Preview.
- **Bespoke Chapter Choreography Defaults**: Every episode and chapter will ship with a deeply tailored, multi-paragraph default choreography recipe stored in `/data/chapter-configs.json` so that out-of-the-box visuals feel immediately distinct, physical, and dramatic:
  - *Episode I, Chapter 1 (The First Light)*: Starts in near-total abyssal darkness (`godRayIntensity: 0.05`, `curlNoiseScale: 1.8`) on Paragraph 1, then triggers a blinding radial shockwave (`triggerShockwave: true`, `godRayIntensity: 0.95`, `bloomStrength: 0.85`) when Paragraph 3 (*"And God said, 'Let there be light'"*) is focused or narrated.
  - *Episode I, Chapter 2 (The Waters & The Sky)*: Gerstner wave displacement parting vertically between upper atmospheric vapor and lower oceanic swells (`waveDisplacement: 0.85`, `simulationMode: 'curl-flow'`).
  - *Episode I, Chapter 3 (The Dry Land & The Stars)*: Recursive L-system botanical flora sprouting across the lower horizon (`simulationMode: 'lsystem-flora'`) beneath a high-parallax celestial nebula field (`nebulaParallax: 0.9`).
  - *Episode I, Chapter 4 (Creatures & Humankind)*: True Craig Reynolds Boids flocking simulation (`simulationMode: 'boids-flock'`) with golden breath-of-life Verlet ribbons (`verlet-ribbons`) responding to pointer and voice envelope.
  - *Episode II–VI Chapters (Eden, The Fall, Cain & Abel, Noah's Ark, The Flood, The Covenant Rainbow, Tower of Babel)*: Each configured with bespoke color LUTs, Voronoi stone/ash fracture physics, rising ember thermals, or prismatic covenant refraction arcs.

---

## 3. System Architecture & Data Models

### 3.1. Visual Configuration & Paragraph Keyframe Schema (`/src/types/visualConfig.ts`)

Each chapter configuration is uniquely addressed by `"{episodeId}:{chapterNumber}"` and supports chapter-wide base parameters plus per-paragraph keyframe overrides:

```typescript
export type SimulationMode =
  | 'curl-flow'        // 2D divergence-free curl-noise fluid & ember advection
  | 'boids-flock'      // Craig Reynolds flocking (cohesion, alignment, separation)
  | 'lsystem-flora'    // Recursive wind-swaying botanical L-system trees & olive branches
  | 'verlet-ribbons'   // Verlet-integrated silk/breath filaments & sacred veil
  | 'voronoi-fracture' // Shattering stone/monolith shards with gravity & dust
  | 'radial-shockwave' // Concentric light/sound wave pulses & corona flares
  | 'celestial-orbital'; // Gravitational star clusters & astrolabe rings

export interface ShaderUniformConfig {
  tintZenith: [number, number, number];   // Top sky/void RGB (0-1)
  tintHorizon: [number, number, number];  // Mid-atmosphere/horizon RGB (0-1)
  tintAbyss: [number, number, number];    // Deep foreground/ground RGB (0-1)
  accentColor: [number, number, number];  // Liturgical highlight/particle RGB (0-1)
  godRayIntensity: number;                // Crepuscular volumetric rays (0.0 - 1.0)
  godRayAngle: number;                    // Light shaft angle (-1.0 to 1.0)
  domainWarpStrength: number;             // FBM fluid curl warping (0.0 - 2.0)
  domainWarpSpeed: number;                // Temporal evolution speed (0.05 - 2.0)
  waveDisplacement: number;               // Oceanic/horizon Gerstner swell (0.0 - 1.0)
  nebulaDensity: number;                  // Deep starfield & cosmic dust (0.0 - 1.0)
  bloomStrength: number;                  // Atmospheric halation & glow (0.0 - 1.0)
  vignetteIntensity: number;              // Edge darkening (0.0 - 1.0)
  grainIntensity: number;                 // Film/parchment optical grain (0.0 - 0.25)
}

export interface PhysicsSimulationConfig {
  mode: SimulationMode;
  particleCount: number;       // 20 - 400 active entities
  speedMultiplier: number;     // 0.1 - 3.0
  turbulence: number;          // Curl noise / wind force (0.0 - 2.0)
  gravityVector: [number, number]; // [gx, gy] (-1.0 to 1.0)
  cohesion: number;            // Boid / attractor cohesion (0.0 - 1.0)
  separation: number;          // Boid separation / scatter radius (0.0 - 1.0)
  scaleMultiplier: number;     // Element size scale (0.5 - 2.5)
  secondaryOverlay?: SimulationMode | 'none'; // Optional dual-layer physics
}

export interface AudioReactiveConfig {
  enabled: boolean;
  subBassToWaveSwell: number;      // 0.0 - 1.0 (maps 20-120Hz to waveDisplacement)
  midToGodRays: number;            // 0.0 - 1.0 (maps 200-1200Hz pad chords to godRayIntensity)
  voiceEnvelopeToBloom: number;    // 0.0 - 1.0 (maps active TTS voice amplitude to bloom & ripples)
  trebleToParticleSparkle: number; // 0.0 - 1.0 (maps >2.5kHz shimmer to particle brightness)
}

export interface ParagraphKeyframe {
  paragraphIndex: number;
  cueLabel: string;                // e.g. "Let there be light shockwave"
  transitionDuration: number;      // Interpolation time in seconds (0.3 - 5.0)
  triggerShockwave?: boolean;      // Fires an immediate radial light wave on entry
  shaderOverrides?: Partial<ShaderUniformConfig>;
  physicsOverrides?: Partial<PhysicsSimulationConfig>;
}

export interface ChapterVisualConfig {
  id: string;                      // e.g. "ep-1:1"
  episodeId: string;
  chapterNumber: number;
  title: string;
  directorNotes: string;
  shader: ShaderUniformConfig;
  physics: PhysicsSimulationConfig;
  audioReactive: AudioReactiveConfig;
  paragraphKeyframes: Record<number, ParagraphKeyframe>;
  updatedAt: string;
}
```

---

## 4. Key Implementation Components

### Phase 1: Backend Persistence & AI Director Recipe API (`/server.ts` & `/src/data/defaultChapterConfigs.ts`)
- **Seed Choreography Dataset (`/src/data/defaultChapterConfigs.ts`)**:
  - Author handcrafted, multi-paragraph `ChapterVisualConfig` recipes for every chapter across all 6 episodes so each chapter has unmistakable visual identity and narrative pacing out of the box.
- **Persistent JSON Store (`/data/chapter-configs.json`)**:
  - On server boot, initialize `/data/chapter-configs.json` from `defaultChapterConfigs` if not present, merging any missing chapter keys automatically.
- **REST Endpoints in `/server.ts`**:
  - `GET /api/chapter-configs`: Returns the complete map of `Record<string, ChapterVisualConfig>`.
  - `PUT /api/chapter-configs/:episodeId/:chapterNumber`: Validates and persists updated shader, physics, audio-reactive, and paragraph keyframe settings to `/data/chapter-configs.json`.
  - `POST /api/chapter-configs/reset`: Resets a specific chapter (or all chapters) back to factory choreography defaults.
  - `POST /api/director/generate-preset`: Uses `@google/genai` (`gemini-3-flash-preview` with `responseMimeType: "application/json"` and a strict `responseSchema`) to convert a natural-language prompt (plus chapter prose context) into a complete `ShaderUniformConfig`, `PhysicsSimulationConfig`, and suggested `ParagraphKeyframe` cues.

### Phase 2: Real-Time Audio Frequency Telemetry (`/src/utils/audioAnalyzerBus.ts`)
- Create a lightweight singleton `AudioAnalyzerBus` that taps into both:
  1. `soundscapeEngine.ts` (connecting the master output gain to an FFT `AnalyserNode`).
  2. `narrationEngine.ts` (computing RMS envelope / Web Audio FFT on the active AI TTS `HTMLAudioElement` or buffer).
- Expose a zero-allocation `getAudioMetrics(): { subBass: number; mid: number; treble: number; voiceEnvelope: number }` called once per `requestAnimationFrame` inside `LivingStoryCanvas.tsx`.

### Phase 3: Volumetric GLSL Shader & Multi-Physics Engine (`/src/components/LivingStoryCanvas.tsx` & `/src/utils/chapterSimulations.ts`)
- **Volumetric GLSL Fragment Shader Overhaul**:
  - Upgrade the WebGL shader in `LivingStoryCanvas.tsx` to accept all custom uniforms from `ShaderUniformConfig` (`u_tintZenith`, `u_tintHorizon`, `u_tintAbyss`, `u_accentColor`, `u_godRayIntensity`, `u_godRayAngle`, `u_domainWarpStrength`, `u_domainWarpSpeed`, `u_waveDisplacement`, `u_nebulaDensity`, `u_bloomStrength`, `u_vignetteIntensity`, `u_shockwaveProgress`, `u_audioBass`, `u_audioVoice`).
  - Implement multi-octave domain-warped FBM clouds/fluid, raymarched crepuscular light shafts from the horizon/zenith, Gerstner wave ridges, starfield/nebula parallax, and an expanding radial shockwave ring triggered by paragraph keyframes or pointer clicks.
- **True Physical Simulations (`/src/utils/chapterSimulations.ts`)**:
  - Replace the static wireframe shapes with stateful, smoothly crossfading simulation engines:
    1. **`curl-flow`**: 2D simplex curl-noise velocity field advecting glowing trails, embers, or abyssal currents with varying trail lengths.
    2. **`boids-flock`**: Autonomous flocking entities (birds, doves, luminous schools) obeying separation, alignment, cohesion, and pointer/horizon attractors with articulated wing/fin geometry.
    3. **`lsystem-flora`**: Procedural branching botanical structures (Eden trees, olive branches, reeds) that grow organically with chapter progress and sway with wind turbulence.
    4. **`verlet-ribbons`**: Multi-node Verlet-integrated silk filaments and atmospheric ribbons that ripple with wind and voice envelope.
    5. **`voronoi-fracture`**: Polygonal monolith shards and dust particles subject to gravity, uplift thermals, and rotational torque.
    6. **`radial-shockwave` & `celestial-orbital`**: Expanding liturgical light rings, astrolabe arcs, and N-body orbital star clusters.
- **Smooth Keyframe Interpolation**:
  - When `focusedParagraph` advances (either via user scroll/click or automatic AI TTS narration sync), `LivingStoryCanvas` merges any `paragraphKeyframes[focusedParagraph]` overrides into the target uniform and physics state, interpolating smoothly over `transitionDuration` seconds and firing `triggerShockwave` if flagged.

### Phase 4: Split-Screen Admin Visual Director Studio (`/src/components/AdminDirectorStudio.tsx`)
- Add a top-level `Director Studio` link in `Navbar.tsx` (alongside a quick *"Open in Director Studio"* button inside the Reader toolbar so you can jump straight to the active Episode & Chapter).
- **Left Pane — Live Interactive Stage & Narrative Monitor (58% width)**:
  - Live `LivingStoryCanvas` rendering the selected chapter's real-time configuration.
  - Overlay controls to toggle **Stage-Only View** vs. **Reader Prose Overlay**, step through individual paragraphs (`¶ 1`, `¶ 2`, `¶ 3`...), trigger AI TTS narration preview, and view a live 4-band **Audio-Reactive Telemetry Meter** (`Sub-Bass`, `Mid Harmonics`, `Treble`, `Voice Envelope`).
- **Right Pane — Precision Choreography Control Deck (42% width)**:
  - **Episode & Chapter Switcher + Persistence Bar**: Select any Episode/Chapter, see dirty-state indicator, **Save to Backend**, **Reset Chapter**, or **Copy/Export Config JSON**.
  - **AI Scene Recipe Generator**: Input box where you can describe a mood or effect in plain English (e.g., *"blinding golden dawn breaking through heavy violet storm clouds with flocking doves"*) and click **Synthesize Recipe** to populate uniforms and keyframes via Gemini.
  - **Tab 1: Volumetric Shader & Color Grading**:
    - 3-Stop Liturgical Color Pickers (`Zenith`, `Horizon`, `Abyss`, `Accent`) + curated biblical palette swatches.
    - Precision sliders (`JetBrains Mono` `tabular-nums`) for `God-Ray Intensity`, `Light Angle`, `FBM Domain Warp`, `Warp Speed`, `Gerstner Wave Swell`, `Nebula Density`, `Atmospheric Bloom`, and `Vignette`.
  - **Tab 2: Physics & Simulation Engine**:
    - Simulation Mode selector (`Curl-Noise Flow`, `Boids Flocking`, `L-System Flora`, `Verlet Ribbons`, `Voronoi Fracture`, `Radial Shockwave`, `Celestial Orbital`) + optional secondary layer.
    - Sliders for `Particle/Entity Count`, `Speed`, `Wind/Curl Turbulence`, `Gravity X/Y`, `Flock Cohesion`, `Separation`, and `Geometry Scale`.
  - **Tab 3: Paragraph & TTS Keyframe Sequencer**:
    - Displays every paragraph of the active chapter with its text snippet.
    - Click **+ Add Keyframe Cue** on any paragraph to override shader/physics values when that paragraph is reached or narrated (including a one-click **Trigger Radial Shockwave** toggle and custom `Transition Duration`).
  - **Tab 4: Audio-Reactive Matrix**:
    - Toggle live audio reactivity and dial in modulation depths (`Sub-Bass → Wave Swell`, `Mid Chords → God-Rays`, `AI Voice Envelope → Bloom & Ripples`, `Treble → Particle Sparkle`).

---

## 5. Verification & Quality Gates

1. **Backend & API Verification**:
   - Verify `GET /api/chapter-configs`, `PUT /api/chapter-configs/:episodeId/:chapterNumber`, `POST /api/chapter-configs/reset`, and `POST /api/director/generate-preset` in `server.ts`.
   - Confirm edits saved in the Admin Director Studio persist to `/data/chapter-configs.json` and immediately reflect in `EpisodeReaderView`.
2. **Visual & Physics Authenticity**:
   - Verify that switching between chapters—and advancing across paragraphs with keyframes during AI TTS playback—produces dramatic, smooth shader transitions and physical simulations at 60fps.
3. **Static Analysis & Build**:
   - Run `lint_applet` and `compile_applet` to ensure zero TypeScript or bundle errors.
