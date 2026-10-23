export type SimulationMode =
  | 'curl-flow'
  | 'boids-flock'
  | 'lsystem-flora'
  | 'verlet-ribbons'
  | 'voronoi-fracture'
  | 'radial-shockwave'
  | 'celestial-orbital';

export interface ShaderUniformConfig {
  tintZenith: [number, number, number];
  tintHorizon: [number, number, number];
  tintAbyss: [number, number, number];
  accentColor: [number, number, number];
  godRayIntensity: number;
  godRayAngle: number;
  domainWarpStrength: number;
  domainWarpSpeed: number;
  waveDisplacement: number;
  nebulaDensity: number;
  bloomStrength: number;
  vignetteIntensity: number;
  grainIntensity: number;
}

export interface PhysicsSimulationConfig {
  mode: SimulationMode;
  particleCount: number;
  speedMultiplier: number;
  turbulence: number;
  gravityVector: [number, number];
  cohesion: number;
  separation: number;
  scaleMultiplier: number;
  secondaryOverlay: SimulationMode | 'none';
}

export interface AudioReactiveConfig {
  enabled: boolean;
  subBassToWaveSwell: number;
  midToGodRays: number;
  voiceEnvelopeToBloom: number;
  trebleToParticleSparkle: number;
}

export interface ParagraphKeyframe {
  paragraphIndex: number;
  cueLabel: string;
  transitionDuration: number;
  triggerShockwave?: boolean;
  shaderOverrides?: Partial<ShaderUniformConfig>;
  physicsOverrides?: Partial<PhysicsSimulationConfig>;
}

export interface ChapterVisualConfig {
  id: string;
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

export function makeChapterConfigKey(
  episodeId: string,
  chapterNumber: number
): string {
  return `${episodeId}:${chapterNumber}`;
}

export function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return [
      Number.isFinite(r) ? r : 0.8,
      Number.isFinite(g) ? g : 0.65,
      Number.isFinite(b) ? b : 0.32,
    ];
  }
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [
    Number.isFinite(r) ? r : 0.8,
    Number.isFinite(g) ? g : 0.65,
    Number.isFinite(b) ? b : 0.32,
  ];
}

export function rgbTupleToHex(rgb: readonly [number, number, number]): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n * 255)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`.toUpperCase();
}

export function resolveEffectiveVisualConfig(
  base: ChapterVisualConfig,
  activeParagraphIndex = 0
): {
  shader: ShaderUniformConfig;
  physics: PhysicsSimulationConfig;
  audioReactive: AudioReactiveConfig;
  transitionDuration: number;
  activeKeyframe: ParagraphKeyframe | null;
} {
  let effectiveShader: ShaderUniformConfig = { ...base.shader };
  let effectivePhysics: PhysicsSimulationConfig = { ...base.physics };
  let transitionDuration = 1.4;
  let activeKeyframe: ParagraphKeyframe | null = null;

  // Apply keyframes in order up to activeParagraphIndex so cumulative dramatic progressions hold
  const sortedIndices = Object.keys(base.paragraphKeyframes || {})
    .map(Number)
    .filter((idx) => !Number.isNaN(idx) && idx <= activeParagraphIndex)
    .sort((a, b) => a - b);

  for (const idx of sortedIndices) {
    const kf = base.paragraphKeyframes[idx];
    if (!kf) continue;
    if (kf.shaderOverrides) {
      effectiveShader = {
        ...effectiveShader,
        ...kf.shaderOverrides,
      };
    }
    if (kf.physicsOverrides) {
      effectivePhysics = {
        ...effectivePhysics,
        ...kf.physicsOverrides,
      };
    }
    if (idx === activeParagraphIndex) {
      transitionDuration = Math.max(0.25, kf.transitionDuration || 1.2);
      activeKeyframe = kf;
    }
  }

  return {
    shader: effectiveShader,
    physics: effectivePhysics,
    audioReactive: base.audioReactive,
    transitionDuration,
    activeKeyframe,
  };
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): [number, number, number] {
  return [
    lerpNum(a[0], b[0], t),
    lerpNum(a[1], b[1], t),
    lerpNum(a[2], b[2], t),
  ];
}

export function lerpShaderUniforms(
  current: ShaderUniformConfig,
  target: ShaderUniformConfig,
  alpha: number
): ShaderUniformConfig {
  const t = Math.max(0, Math.min(1, alpha));
  return {
    tintZenith: lerpVec3(current.tintZenith, target.tintZenith, t),
    tintHorizon: lerpVec3(current.tintHorizon, target.tintHorizon, t),
    tintAbyss: lerpVec3(current.tintAbyss, target.tintAbyss, t),
    accentColor: lerpVec3(current.accentColor, target.accentColor, t),
    godRayIntensity: lerpNum(current.godRayIntensity, target.godRayIntensity, t),
    godRayAngle: lerpNum(current.godRayAngle, target.godRayAngle, t),
    domainWarpStrength: lerpNum(
      current.domainWarpStrength,
      target.domainWarpStrength,
      t
    ),
    domainWarpSpeed: lerpNum(current.domainWarpSpeed, target.domainWarpSpeed, t),
    waveDisplacement: lerpNum(
      current.waveDisplacement,
      target.waveDisplacement,
      t
    ),
    nebulaDensity: lerpNum(current.nebulaDensity, target.nebulaDensity, t),
    bloomStrength: lerpNum(current.bloomStrength, target.bloomStrength, t),
    vignetteIntensity: lerpNum(
      current.vignetteIntensity,
      target.vignetteIntensity,
      t
    ),
    grainIntensity: lerpNum(current.grainIntensity, target.grainIntensity, t),
  };
}
