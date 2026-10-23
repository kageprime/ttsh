import React, { useEffect, useRef } from 'react';
import {
  CanvasSimulationMode,
  ChapterAnimationConfig,
  SceneTheme,
} from '../data/stories';
import {
  ChapterVisualMotif,
  TextDrivenShaderState,
  computeTextDrivenShaderTargets,
  lerpShaderState,
} from '../utils/storybookLogic';
import {
  CanvasPointerRipple,
  renderChapterAnimationOverlay,
  renderInteractivePointerRipples,
} from '../utils/chapterAnimations';
import {
  ChapterVisualConfig,
  lerpShaderUniforms,
  resolveEffectiveVisualConfig,
  ShaderUniformConfig,
} from '../types/visualConfig';
import { getStoredChapterVisualConfig } from '../utils/visualConfigStore';
import { ChapterPhysicsEngine } from '../utils/chapterSimulations';
import { audioAnalyzerBus } from '../utils/audioAnalyzerBus';

export interface LivingStoryCanvasProps {
  theme: SceneTheme | 'hero-waterfall';
  canvasMode?: CanvasSimulationMode;
  episodeId?: string;
  chapterNumber?: number;
  animationConfig?: ChapterAnimationConfig;
  nextTheme?: SceneTheme;
  nextChapterNumber?: number;
  nextAnimationConfig?: ChapterAnimationConfig;
  chapterScrollProgress?: number;
  backgroundImageUrl?: string;
  activeText?: string;
  isSoundCueActive?: boolean;
  surgeCount?: number;
  readingProgress?: number;
  highContrast?: boolean;
  interactive?: boolean;
  inspectionMode?: boolean;
  customVisualConfig?: ChapterVisualConfig;
  activeParagraphIndex?: number;
  manualShockwaveTrigger?: number;
  onPointerAudioRipple?: (
    normX: number,
    normY: number,
    velocity: number
  ) => void;
  className?: string;
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;
varying vec2 v_uv;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_surge;
uniform vec4 u_weights; // x=ocean, y=dawn, z=forest, w=cosmos
uniform float u_windIntensity;
uniform float u_lightBloom;
uniform float u_waterParting;
uniform float u_subMode;
uniform vec3 u_tintTop;
uniform vec3 u_tintHorizon;
uniform vec3 u_tintGround;

// Volumetric Director Studio Uniforms
uniform vec3 u_accentColor;
uniform float u_godRayIntensity;
uniform float u_godRayAngle;
uniform float u_domainWarpStrength;
uniform float u_domainWarpSpeed;
uniform float u_waveDisplacement;
uniform float u_nebulaDensity;
uniform float u_bloomStrength;
uniform float u_vignetteIntensity;
uniform float u_grainIntensity;
uniform float u_shockwaveProgress;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.03 + vec2(17.1, 31.7);
    a *= 0.5;
  }
  return v;
}

vec3 renderVolumetricScene(vec2 uv, float aspect, float t) {
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  float warpTime = t * max(0.05, u_domainWarpSpeed);

  // 1. Multi-octave domain-warped FBM fluid atmosphere
  vec2 q = vec2(
    fbm(p * 2.2 + vec2(0.0, warpTime * 0.35)),
    fbm(p * 2.2 + vec2(5.2, 1.3 - warpTime * 0.28))
  );
  vec2 r = vec2(
    fbm(p * 3.1 + u_domainWarpStrength * 2.2 * q + vec2(1.7, 9.2 + warpTime * 0.45)),
    fbm(p * 3.1 + u_domainWarpStrength * 2.2 * q + vec2(8.3, 2.8 - warpTime * 0.38))
  );
  float fluidField = fbm(p * 2.6 + u_domainWarpStrength * 2.4 * r);

  // 2. Base 3-stop Liturgical Color Grading with Horizon Glow
  float horizonLine = 0.44 - u_waterParting * 0.08;
  float skyFactor = smoothstep(horizonLine - 0.15, 0.96, uv.y);
  float abyssFactor = 1.0 - smoothstep(0.02, horizonLine + 0.12, uv.y);
  float horizonBand = exp(-abs(uv.y - horizonLine) * (4.2 - u_bloomStrength * 1.6));

  vec3 col = mix(u_tintHorizon, u_tintTop, skyFactor);
  col = mix(col, u_tintGround, abyssFactor * 0.88);

  // Blend domain-warped atmospheric clouds & curl currents
  col += (u_tintHorizon * 0.55 + u_accentColor * 0.35) * (fluidField * fluidField * 0.62 * (0.4 + u_domainWarpStrength * 0.45));
  col += (u_tintHorizon * 0.75 + u_accentColor * 0.45) * horizonBand * (0.35 + u_bloomStrength * 0.65);

  // 3. Raymarched Crepuscular Volumetric God-Rays
  if (u_godRayIntensity > 0.01) {
    vec2 lightOrigin = vec2(0.5 + u_godRayAngle * 0.38 + (u_pointer.x - 0.5) * 0.16, horizonLine + 0.14);
    vec2 toLight = uv - lightOrigin;
    float angle = atan(toLight.y, toLight.x * aspect);
    float dist = length(vec2(toLight.x * aspect, toLight.y));
    float rayPattern =
      sin(angle * 14.0 + warpTime * 0.9) * 0.5 + 0.5;
    float rayFine =
      noise(vec2(angle * 9.5 + warpTime * 0.4, dist * 2.5));
    float rays = pow(max(0.0, rayPattern * 0.6 + rayFine * 0.55), 2.4);
    float radialAtten = exp(-dist * 1.45) * smoothstep(0.05, 0.95, uv.y + 0.15);
    col += (u_accentColor * 0.75 + vec3(1.0, 0.95, 0.82) * 0.45) *
           rays * radialAtten * u_godRayIntensity * (0.85 + u_surge * 0.45);
  }

  // 4. Gerstner Oceanic & Abyssal Wave Ridges below Horizon
  if (u_waveDisplacement > 0.02 && uv.y < horizonLine + 0.12) {
    float waterDepth = clamp((horizonLine + 0.08 - uv.y) / max(0.01, horizonLine + 0.08), 0.0, 1.0);
    float persp = 1.0 / (0.14 + waterDepth * 1.4);
    vec2 waterUv = vec2(p.x * persp * 3.2, waterDepth * 9.0 - t * (0.65 + u_waveDisplacement * 1.1));
    float w1 = sin(waterUv.x * 2.4 + waterUv.y * 1.9 + fbm(waterUv * 0.85) * 3.6);
    float w2 = cos(waterUv.x * 3.8 - waterUv.y * 2.5 + t * 1.1);
    float crest = smoothstep(0.35, 0.98, (w1 * 0.55 + w2 * 0.45) * 0.5 + 0.5);
    float waterMask = smoothstep(horizonLine + 0.06, horizonLine - 0.06, uv.y);

    vec3 specular = mix(u_tintHorizon, u_accentColor, 0.65) + vec3(0.22, 0.20, 0.16) * u_bloomStrength;
    col += specular * crest * u_waveDisplacement * waterMask * (0.35 + (1.0 - waterDepth) * 0.65);
  }

  // 5. Deep Parallax Celestial Starfield & Nebula Dust
  if (u_nebulaDensity > 0.02) {
    vec2 starUv = vec2(uv.x * aspect, uv.y) * 26.0 + vec2(t * 0.04, 0.0);
    vec2 cell = floor(starUv);
    vec2 local = fract(starUv) - 0.5;
    float rnd = hash(cell);
    float starMask = step(0.92 - u_nebulaDensity * 0.08, rnd);
    float d = length(local);
    float twinkle = 0.55 + 0.45 * sin(t * 3.2 + rnd * 62.8);
    float starBright = smoothstep(0.22, 0.0, d) * starMask * twinkle * smoothstep(horizonLine - 0.05, 0.88, uv.y);

    float nebulaCloud = fbm(p * 3.4 - vec2(t * 0.06, t * 0.03));
    col += u_accentColor * pow(nebulaCloud, 2.2) * u_nebulaDensity * 0.48;
    col += mix(vec3(1.0, 0.97, 0.9), u_accentColor, 0.35) * starBright * u_nebulaDensity * 1.25;
  }

  // 6. Pointer & Keyframe Shockwave Distortion Ring
  vec2 ptrDelta = vec2((uv.x - u_pointer.x) * aspect, uv.y - u_pointer.y);
  float ptrDist = length(ptrDelta);
  float ptrGlow = exp(-ptrDist * 3.8) * (0.16 + u_surge * 0.36) * (0.5 + u_bloomStrength * 0.7);
  col += u_accentColor * ptrGlow;

  if (u_shockwaveProgress > 0.005 && u_shockwaveProgress < 0.995) {
    vec2 center = vec2(0.5, 0.5);
    float sDist = length(vec2((uv.x - center.x) * aspect, uv.y - center.y));
    float ringRadius = u_shockwaveProgress * 1.25;
    float ringBand = exp(-abs(sDist - ringRadius) * 18.0) * (1.0 - u_shockwaveProgress);
    col += mix(u_accentColor, vec3(1.0, 0.96, 0.86), 0.6) * ringBand * 1.35;
  }

  // 7. Atmospheric Bloom Halation, Vignette & Film Grain
  col *= (0.88 + u_bloomStrength * 0.38);
  float vigDist = length(p * vec2(1.05, 1.25));
  float vig = smoothstep(1.15, 0.25, vigDist * (0.65 + u_vignetteIntensity * 0.75));
  col *= mix(1.0, vig, u_vignetteIntensity);

  if (u_grainIntensity > 0.001) {
    float grain = (hash(uv * u_resolution + fract(t * 17.3)) - 0.5) * u_grainIntensity;
    col += vec3(grain);
  }

  return clamp(col, 0.0, 1.0);
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / max(1.0, u_resolution.y);
  vec3 col = renderVolumetricScene(uv, aspect, u_time);
  gl_FragColor = vec4(col, 1.0);
}
`;

export const LivingStoryCanvas: React.FC<LivingStoryCanvasProps> = ({
  theme,
  canvasMode,
  episodeId = 'e1-before-the-beginning',
  chapterNumber = 1,
  animationConfig,
  nextTheme,
  nextChapterNumber,
  nextAnimationConfig,
  chapterScrollProgress = 0,
  backgroundImageUrl,
  activeText = '',
  isSoundCueActive = false,
  surgeCount = 0,
  highContrast = false,
  interactive = true,
  inspectionMode = false,
  customVisualConfig,
  activeParagraphIndex = 0,
  manualShockwaveTrigger = 0,
  onPointerAudioRipple,
  className = '',
}) => {
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const moteCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const pointerVelocityRef = useRef<{ vx: number; vy: number }>({
    vx: 0,
    vy: 0,
  });
  const ripplesRef = useRef<CanvasPointerRipple[]>([]);
  const elapsedRef = useRef<number>(4.2);
  const surgeEnergyRef = useRef<number>(0);
  const shockwaveProgressRef = useRef<number>(0);
  const physicsEngineRef = useRef<ChapterPhysicsEngine | null>(null);
  if (!physicsEngineRef.current) {
    physicsEngineRef.current = new ChapterPhysicsEngine();
  }

  // Resolve active ChapterVisualConfig (from prop or backend-synced store)
  const resolvedBaseConfig =
    customVisualConfig ||
    getStoredChapterVisualConfig(episodeId, chapterNumber);

  const effectiveResolved = resolveEffectiveVisualConfig(
    resolvedBaseConfig,
    activeParagraphIndex
  );

  const primaryTargetState = computeTextDrivenShaderTargets(
    theme,
    canvasMode,
    activeText,
    isSoundCueActive,
    episodeId,
    chapterNumber,
    animationConfig
  );

  const upcomingTargetState =
    nextAnimationConfig || typeof nextChapterNumber === 'number'
      ? computeTextDrivenShaderTargets(
          nextTheme || theme,
          canvasMode,
          '',
          false,
          episodeId,
          nextChapterNumber,
          nextAnimationConfig
        )
      : null;

  const scrollMorphFactor =
    upcomingTargetState && chapterScrollProgress > 0.72
      ? Math.min(0.48, ((chapterScrollProgress - 0.72) / 0.28) * 0.48)
      : 0;

  const liveTargetState =
    upcomingTargetState && scrollMorphFactor > 0.01
      ? lerpShaderState(primaryTargetState, upcomingTargetState, scrollMorphFactor)
      : primaryTargetState;

  const currentStateRef = useRef<TextDrivenShaderState>(liveTargetState);
  const targetStateRef = useRef<TextDrivenShaderState>(liveTargetState);

  const currentUniformsRef = useRef<ShaderUniformConfig>(
    effectiveResolved.shader
  );
  const targetUniformsRef = useRef<ShaderUniformConfig>(
    effectiveResolved.shader
  );
  const activePhysicsRef = useRef(effectiveResolved.physics);
  const activeAudioReactiveRef = useRef(effectiveResolved.audioReactive);
  const transitionDurationRef = useRef<number>(
    effectiveResolved.transitionDuration
  );

  const activeMotifRef = useRef<ChapterVisualMotif>(primaryTargetState.motif);
  const prevMotifRef = useRef<ChapterVisualMotif | null>(null);
  const nextMotifRef = useRef<ChapterVisualMotif | null>(
    upcomingTargetState ? upcomingTargetState.motif : null
  );
  const scrollMorphRef = useRef<number>(scrollMorphFactor);
  const motifBlendRef = useRef<number>(1.0);
  const lastTriggeredKeyframeRef = useRef<string>('');

  useEffect(() => {
    const baseCfg =
      customVisualConfig ||
      getStoredChapterVisualConfig(episodeId, chapterNumber);
    const resolved = resolveEffectiveVisualConfig(
      baseCfg,
      activeParagraphIndex
    );

    targetUniformsRef.current = resolved.shader;
    activePhysicsRef.current = resolved.physics;
    activeAudioReactiveRef.current = resolved.audioReactive;
    transitionDurationRef.current = resolved.transitionDuration;

    const kfKey = `${episodeId}:${chapterNumber}:${activeParagraphIndex}`;
    if (
      resolved.activeKeyframe?.triggerShockwave &&
      lastTriggeredKeyframeRef.current !== kfKey
    ) {
      lastTriggeredKeyframeRef.current = kfKey;
      shockwaveProgressRef.current = 0.01;
      surgeEnergyRef.current = Math.min(1.0, surgeEnergyRef.current + 0.85);
      audioAnalyzerBus.pulseImpulse(0.45, 0.55, 0.5);
    }
  }, [customVisualConfig, episodeId, chapterNumber, activeParagraphIndex]);

  useEffect(() => {
    if (manualShockwaveTrigger > 0) {
      shockwaveProgressRef.current = 0.01;
      surgeEnergyRef.current = 0.95;
      audioAnalyzerBus.pulseImpulse(0.5, 0.6, 0.55);
    }
  }, [manualShockwaveTrigger]);

  useEffect(() => {
    const primaryNext = computeTextDrivenShaderTargets(
      theme,
      canvasMode,
      activeText,
      isSoundCueActive,
      episodeId,
      chapterNumber,
      animationConfig
    );
    const upcomingNext =
      nextAnimationConfig || typeof nextChapterNumber === 'number'
        ? computeTextDrivenShaderTargets(
            nextTheme || theme,
            canvasMode,
            '',
            false,
            episodeId,
            nextChapterNumber,
            nextAnimationConfig
          )
        : null;

    const morphAmt =
      upcomingNext && chapterScrollProgress > 0.72
        ? Math.min(0.48, ((chapterScrollProgress - 0.72) / 0.28) * 0.48)
        : 0;

    if (primaryNext.motif !== activeMotifRef.current) {
      prevMotifRef.current = activeMotifRef.current;
      activeMotifRef.current = primaryNext.motif;
      motifBlendRef.current = 0.0;
    }

    nextMotifRef.current =
      upcomingNext && upcomingNext.motif !== primaryNext.motif
        ? upcomingNext.motif
        : null;
    scrollMorphRef.current = morphAmt;

    targetStateRef.current =
      upcomingNext && morphAmt > 0.01
        ? lerpShaderState(primaryNext, upcomingNext, morphAmt)
        : primaryNext;
  }, [
    theme,
    canvasMode,
    activeText,
    isSoundCueActive,
    episodeId,
    chapterNumber,
    animationConfig,
    nextTheme,
    nextChapterNumber,
    nextAnimationConfig,
    chapterScrollProgress,
  ]);

  useEffect(() => {
    if (surgeCount > 0) {
      surgeEnergyRef.current = Math.min(1.0, surgeEnergyRef.current + 0.75);
      audioAnalyzerBus.pulseImpulse(0.3, 0.35, 0.3);
    }
  }, [surgeCount]);

  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const moteCanvas = moteCanvasRef.current;
    if (!glCanvas || !moteCanvas) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const gl =
      (glCanvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: true,
      }) as WebGLRenderingContext | null) ||
      (glCanvas.getContext('experimental-webgl', {
        preserveDrawingBuffer: true,
      }) as WebGLRenderingContext | null);

    let program: WebGLProgram | null = null;
    let uTimeLoc: WebGLUniformLocation | null = null;
    let uResLoc: WebGLUniformLocation | null = null;
    let uPtrLoc: WebGLUniformLocation | null = null;
    let uSurgeLoc: WebGLUniformLocation | null = null;
    let uWeightsLoc: WebGLUniformLocation | null = null;
    let uWindLoc: WebGLUniformLocation | null = null;
    let uLightLoc: WebGLUniformLocation | null = null;
    let uPartingLoc: WebGLUniformLocation | null = null;
    let uSubModeLoc: WebGLUniformLocation | null = null;
    let uTintTopLoc: WebGLUniformLocation | null = null;
    let uTintHorizonLoc: WebGLUniformLocation | null = null;
    let uTintGroundLoc: WebGLUniformLocation | null = null;

    // Volumetric Director Studio locations
    let uAccentColorLoc: WebGLUniformLocation | null = null;
    let uGodRayIntensityLoc: WebGLUniformLocation | null = null;
    let uGodRayAngleLoc: WebGLUniformLocation | null = null;
    let uDomainWarpStrengthLoc: WebGLUniformLocation | null = null;
    let uDomainWarpSpeedLoc: WebGLUniformLocation | null = null;
    let uWaveDisplacementLoc: WebGLUniformLocation | null = null;
    let uNebulaDensityLoc: WebGLUniformLocation | null = null;
    let uBloomStrengthLoc: WebGLUniformLocation | null = null;
    let uVignetteIntensityLoc: WebGLUniformLocation | null = null;
    let uGrainIntensityLoc: WebGLUniformLocation | null = null;
    let uShockwaveProgressLoc: WebGLUniformLocation | null = null;

    if (gl) {
      const compileShader = (type: number, src: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
      const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
      if (vs && fs) {
        const prog = gl.createProgram();
        if (prog) {
          gl.attachShader(prog, vs);
          gl.attachShader(prog, fs);
          gl.linkProgram(prog);
          if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            program = prog;
            gl.useProgram(program);

            const buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
              gl.STATIC_DRAW
            );

            const posLoc = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            uTimeLoc = gl.getUniformLocation(program, 'u_time');
            uResLoc = gl.getUniformLocation(program, 'u_resolution');
            uPtrLoc = gl.getUniformLocation(program, 'u_pointer');
            uSurgeLoc = gl.getUniformLocation(program, 'u_surge');
            uWeightsLoc = gl.getUniformLocation(program, 'u_weights');
            uWindLoc = gl.getUniformLocation(program, 'u_windIntensity');
            uLightLoc = gl.getUniformLocation(program, 'u_lightBloom');
            uPartingLoc = gl.getUniformLocation(program, 'u_waterParting');
            uSubModeLoc = gl.getUniformLocation(program, 'u_subMode');
            uTintTopLoc = gl.getUniformLocation(program, 'u_tintTop');
            uTintHorizonLoc = gl.getUniformLocation(program, 'u_tintHorizon');
            uTintGroundLoc = gl.getUniformLocation(program, 'u_tintGround');

            uAccentColorLoc = gl.getUniformLocation(program, 'u_accentColor');
            uGodRayIntensityLoc = gl.getUniformLocation(
              program,
              'u_godRayIntensity'
            );
            uGodRayAngleLoc = gl.getUniformLocation(program, 'u_godRayAngle');
            uDomainWarpStrengthLoc = gl.getUniformLocation(
              program,
              'u_domainWarpStrength'
            );
            uDomainWarpSpeedLoc = gl.getUniformLocation(
              program,
              'u_domainWarpSpeed'
            );
            uWaveDisplacementLoc = gl.getUniformLocation(
              program,
              'u_waveDisplacement'
            );
            uNebulaDensityLoc = gl.getUniformLocation(
              program,
              'u_nebulaDensity'
            );
            uBloomStrengthLoc = gl.getUniformLocation(
              program,
              'u_bloomStrength'
            );
            uVignetteIntensityLoc = gl.getUniformLocation(
              program,
              'u_vignetteIntensity'
            );
            uGrainIntensityLoc = gl.getUniformLocation(
              program,
              'u_grainIntensity'
            );
            uShockwaveProgressLoc = gl.getUniformLocation(
              program,
              'u_shockwaveProgress'
            );
          }
        }
      }
    }

    const ctx2d = moteCanvas.getContext('2d');
    let width = glCanvas.clientWidth || window.innerWidth;
    let height = glCanvas.clientHeight || window.innerHeight;

    const resize = () => {
      width = glCanvas.clientWidth || window.innerWidth;
      height = glCanvas.clientHeight || window.innerHeight;
      const glScale = isHeadless
        ? 1
        : Math.min(window.devicePixelRatio || 1, 1.5);
      glCanvas.width = Math.max(1, Math.floor(width * glScale));
      glCanvas.height = Math.max(1, Math.floor(height * glScale));
      if (gl) {
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      }

      const moteDpr = isHeadless
        ? 1
        : Math.min(window.devicePixelRatio || 1, 1.5);
      moteCanvas.width = Math.max(1, Math.floor(width * moteDpr));
      moteCanvas.height = Math.max(1, Math.floor(height * moteDpr));
      if (ctx2d) {
        ctx2d.setTransform(moteDpr, 0, 0, moteDpr, 0, 0);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    let lastFrameMs = 0;
    const startMs = performance.now();
    const minFrameDelta = isHeadless ? 66 : 16;

    const renderFrame = (nowMs: number) => {
      if (!reducedMotion) {
        rafId = requestAnimationFrame(renderFrame);
      }
      if (nowMs - lastFrameMs < minFrameDelta && lastFrameMs !== 0) {
        return;
      }
      const dtSec =
        lastFrameMs === 0
          ? 0.016
          : Math.min(0.1, (nowMs - lastFrameMs) * 0.001);
      lastFrameMs = nowMs;

      const elapsed = (nowMs - startMs) * 0.001 + 4.2;
      elapsedRef.current = elapsed;
      surgeEnergyRef.current = Math.max(0, surgeEnergyRef.current * 0.96);
      pointerVelocityRef.current = {
        vx: pointerVelocityRef.current.vx * 0.9,
        vy: pointerVelocityRef.current.vy * 0.9,
      };

      if (shockwaveProgressRef.current > 0.001) {
        shockwaveProgressRef.current += dtSec * 0.72;
        if (shockwaveProgressRef.current >= 1.0) {
          shockwaveProgressRef.current = 0;
        }
      }

      if (ripplesRef.current.length > 0) {
        ripplesRef.current = ripplesRef.current.filter(
          (r) => elapsed - r.birthSec <= 2.4
        );
      }

      // Sample real-time audio metrics
      const audioMetrics = audioAnalyzerBus.sampleMetrics(elapsed);
      const ar = activeAudioReactiveRef.current;

      // Smoothly interpolate shader state & volumetric uniforms
      const interpSpeed = isHeadless
        ? 0.85
        : Math.min(1, dtSec / Math.max(0.25, transitionDurationRef.current * 0.45));

      currentStateRef.current = lerpShaderState(
        currentStateRef.current,
        targetStateRef.current,
        isHeadless ? 0.75 : dtSec * 1.65
      );

      currentUniformsRef.current = lerpShaderUniforms(
        currentUniformsRef.current,
        targetUniformsRef.current,
        interpSpeed
      );

      motifBlendRef.current = Math.min(
        1.0,
        motifBlendRef.current + (isHeadless ? 0.85 : dtSec * 1.2)
      );

      const st = currentStateRef.current;
      const u = currentUniformsRef.current;

      // Apply real-time audio-reactive modulations to uniforms
      const liveWaveDisplacement = Math.min(
        1.0,
        u.waveDisplacement +
          (ar.enabled ? audioMetrics.subBass * ar.subBassToWaveSwell * 0.38 : 0)
      );
      const liveGodRayIntensity = Math.min(
        1.0,
        u.godRayIntensity +
          (ar.enabled ? audioMetrics.mid * ar.midToGodRays * 0.35 : 0)
      );
      const liveBloomStrength = Math.min(
        1.0,
        u.bloomStrength +
          (ar.enabled
            ? audioMetrics.voiceEnvelope * ar.voiceEnvelopeToBloom * 0.42
            : 0)
      );

      if (gl && program) {
        gl.useProgram(program);
        gl.uniform1f(uTimeLoc, elapsed);
        gl.uniform2f(uResLoc, glCanvas.width, glCanvas.height);
        gl.uniform2f(uPtrLoc, pointerRef.current.x, 1.0 - pointerRef.current.y);
        gl.uniform1f(uSurgeLoc, surgeEnergyRef.current);
        gl.uniform4f(
          uWeightsLoc,
          st.weights.ocean,
          st.weights.dawn,
          st.weights.forest,
          st.weights.cosmos
        );
        gl.uniform1f(uWindLoc, st.windIntensity);
        gl.uniform1f(uLightLoc, st.lightBloom);
        gl.uniform1f(uPartingLoc, st.waterParting);
        gl.uniform1f(uSubModeLoc, st.subMode);
        gl.uniform3f(
          uTintTopLoc,
          u.tintZenith[0],
          u.tintZenith[1],
          u.tintZenith[2]
        );
        gl.uniform3f(
          uTintHorizonLoc,
          u.tintHorizon[0],
          u.tintHorizon[1],
          u.tintHorizon[2]
        );
        gl.uniform3f(
          uTintGroundLoc,
          u.tintAbyss[0],
          u.tintAbyss[1],
          u.tintAbyss[2]
        );
        gl.uniform3f(
          uAccentColorLoc,
          u.accentColor[0],
          u.accentColor[1],
          u.accentColor[2]
        );
        gl.uniform1f(uGodRayIntensityLoc, liveGodRayIntensity);
        gl.uniform1f(uGodRayAngleLoc, u.godRayAngle);
        gl.uniform1f(uDomainWarpStrengthLoc, u.domainWarpStrength);
        gl.uniform1f(uDomainWarpSpeedLoc, u.domainWarpSpeed);
        gl.uniform1f(uWaveDisplacementLoc, liveWaveDisplacement);
        gl.uniform1f(uNebulaDensityLoc, u.nebulaDensity);
        gl.uniform1f(uBloomStrengthLoc, liveBloomStrength);
        gl.uniform1f(uVignetteIntensityLoc, u.vignetteIntensity);
        gl.uniform1f(uGrainIntensityLoc, u.grainIntensity);
        gl.uniform1f(uShockwaveProgressLoc, shockwaveProgressRef.current);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (ctx2d) {
        const skyGrad = ctx2d.createLinearGradient(0, 0, 0, height);
        const topRgb = `rgb(${Math.round(u.tintZenith[0] * 255)}, ${Math.round(u.tintZenith[1] * 255)}, ${Math.round(u.tintZenith[2] * 255)})`;
        const horRgb = `rgb(${Math.round(u.tintHorizon[0] * 255)}, ${Math.round(u.tintHorizon[1] * 255)}, ${Math.round(u.tintHorizon[2] * 255)})`;
        const gndRgb = `rgb(${Math.round(u.tintAbyss[0] * 255)}, ${Math.round(u.tintAbyss[1] * 255)}, ${Math.round(u.tintAbyss[2] * 255)})`;
        skyGrad.addColorStop(0, topRgb);
        skyGrad.addColorStop(0.54, horRgb);
        skyGrad.addColorStop(1, gndRgb);
        ctx2d.fillStyle = skyGrad;
        ctx2d.fillRect(0, 0, width, height);
      }

      if (ctx2d) {
        if (gl && program) {
          ctx2d.clearRect(0, 0, width, height);
        }

        // 1. Render Multi-Physics Simulation Engine (Curl-Noise, Boids, L-System Flora, Verlet Ribbons, Voronoi, Orbitals)
        if (physicsEngineRef.current) {
          physicsEngineRef.current.render({
            ctx: ctx2d,
            width,
            height,
            dtSec,
            elapsed,
            physics: activePhysicsRef.current,
            accentRgb: u.accentColor,
            horizonRgb: u.tintHorizon,
            audio: audioMetrics,
            audioReactiveEnabled: ar.enabled,
            trebleSparkleDepth: ar.trebleToParticleSparkle,
            voiceBloomDepth: ar.voiceEnvelopeToBloom,
            pointer: pointerRef.current,
            pointerVelocity: pointerVelocityRef.current,
            shockwaveProgress: shockwaveProgressRef.current,
          });
        }

        // 2. Subtle chapter architectural motif geometry
        const activeAlpha =
          motifBlendRef.current * (1.0 - scrollMorphRef.current * 0.65) * 0.55;

        renderChapterAnimationOverlay({
          ctx: ctx2d,
          width,
          height,
          elapsed,
          motif: activeMotifRef.current,
          alpha: activeAlpha,
          surge: surgeEnergyRef.current,
          windIntensity: st.windIntensity,
          lightBloom: liveBloomStrength,
          pointer: pointerRef.current,
          pointerVelocity: pointerVelocityRef.current,
        });

        if (nextMotifRef.current && scrollMorphRef.current > 0.02) {
          renderChapterAnimationOverlay({
            ctx: ctx2d,
            width,
            height,
            elapsed,
            motif: nextMotifRef.current,
            alpha: scrollMorphRef.current * 0.55,
            surge: surgeEnergyRef.current,
            windIntensity: st.windIntensity,
            lightBloom: liveBloomStrength,
            pointer: pointerRef.current,
            pointerVelocity: pointerVelocityRef.current,
          });
        }

        // 3. Interactive pointer ripples
        if (ripplesRef.current.length > 0) {
          renderInteractivePointerRipples(
            ctx2d,
            width,
            height,
            elapsed,
            ripplesRef.current
          );
        }
      }
    };

    renderFrame(performance.now());

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [inspectionMode]);

  const spawnRippleAt = (normX: number, normY: number, strength = 0.85) => {
    ripplesRef.current = [
      ...ripplesRef.current.slice(-7),
      {
        x: normX,
        y: normY,
        birthSec: elapsedRef.current,
        strength,
      },
    ];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nextX = (e.clientX - rect.left) / rect.width;
    const nextY = (e.clientY - rect.top) / rect.height;
    const vx = nextX - pointerRef.current.x;
    const vy = nextY - pointerRef.current.y;
    const speed = Math.hypot(vx, vy);

    pointerVelocityRef.current = { vx, vy };
    pointerRef.current = { x: nextX, y: nextY };

    if (speed > 0.018 || e.buttons > 0) {
      surgeEnergyRef.current = Math.min(
        1.0,
        surgeEnergyRef.current + speed * 2.2
      );
      if (speed > 0.032 || e.buttons > 0) {
        spawnRippleAt(nextX, nextY, Math.min(0.95, 0.35 + speed * 8));
        if (onPointerAudioRipple) {
          onPointerAudioRipple(nextX, nextY, Math.min(1.0, speed * 12));
        }
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const nextX = (e.clientX - rect.left) / rect.width;
      const nextY = (e.clientY - rect.top) / rect.height;
      pointerRef.current = { x: nextX, y: nextY };
      spawnRippleAt(nextX, nextY, 1.0);
      if (onPointerAudioRipple) {
        onPointerAudioRipple(nextX, nextY, 0.9);
      }
    }
    surgeEnergyRef.current = 0.92;
  };

  const radialScrimOpacity = inspectionMode
    ? 0.06
    : highContrast
      ? 0.82
      : 0.56;

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      data-testid="living-story-canvas"
      data-chapter-motif={primaryTargetState.motif}
      data-chapter-label={primaryTargetState.motifLabel}
      data-simulation-mode={effectiveResolved.physics.mode}
      data-inspection-mode={inspectionMode ? 'true' : 'false'}
      className={`overflow-hidden select-none bg-[#06080E] ${
        inspectionMode ? 'cursor-crosshair' : ''
      } ${className}`}
      aria-hidden="true"
    >
      {backgroundImageUrl && (
        <div
          data-testid="chapter-background-image"
          className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-screen transition-all duration-1000 pointer-events-none"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      )}

      <canvas
        ref={glCanvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      <canvas
        ref={moteCanvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse 560px 760px at center, rgba(0, 0, 0, ${radialScrimOpacity}) 0%, rgba(0, 0, 0, ${
            radialScrimOpacity * 0.45
          }) 44%, rgba(0, 0, 0, 0.12) 100%)`,
        }}
      />
    </div>
  );
};
