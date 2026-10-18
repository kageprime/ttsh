import React, { useEffect, useRef } from 'react';
import { CanvasSimulationMode, SceneTheme } from '../data/stories';
import {
  TextDrivenShaderState,
  computeTextDrivenShaderTargets,
  lerpShaderState,
} from '../utils/storybookLogic';

export interface LivingStoryCanvasProps {
  theme: SceneTheme | 'hero-waterfall';
  canvasMode?: CanvasSimulationMode;
  activeText?: string;
  isSoundCueActive?: boolean;
  surgeCount?: number;
  readingProgress?: number;
  highContrast?: boolean;
  interactive?: boolean;
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

float starLayer(vec2 uv, float scale, float time, float density) {
  vec2 gv = fract(uv * scale) - 0.5;
  vec2 id = floor(uv * scale);
  float rnd = hash(id);
  if (rnd < density) return 0.0;
  vec2 offset = (vec2(hash(id + 1.3), hash(id + 7.1)) - 0.5) * 0.72;
  float d = length(gv - offset);
  float twinkle = 0.6 + 0.4 * sin(time * (1.2 + rnd * 2.5) + rnd * 6.283);
  float star = smoothstep(0.08, 0.0, d) * twinkle * smoothstep(density, 1.0, rnd);
  return star;
}

float waterWaves(vec2 p, float t, float windBoost, vec2 pointerUv, float horizonY, float aspect) {
  float speed = 1.0 + windBoost * 0.45;
  float w = 0.0;
  w += sin(p.x * 1.3 + p.y * 1.8 - t * 1.25 * speed) * 0.32;
  w += sin(p.x * -2.1 + p.y * 2.7 - t * 1.65 * speed) * 0.21;
  w += sin(p.x * 3.4 + p.y * 0.9 + t * 1.1 * speed) * 0.14;
  w += (fbm(p * 0.85 + vec2(t * 0.35 * speed, -t * 0.48 * speed)) - 0.5) * (0.85 + windBoost * 0.65);
  w += (noise(p * 3.2 - vec2(t * 0.8, t * 0.6)) - 0.5) * (0.18 + windBoost * 0.15);

  float ptrDepth = max(0.03, horizonY - min(horizonY - 0.02, pointerUv.y));
  float ptrZ = 0.32 / ptrDepth;
  float ptrX = (pointerUv.x - 0.5) * ptrZ * aspect;
  float distToPtr = length(p - vec2(ptrX, ptrZ));
  float ptrRipple = sin(distToPtr * 8.0 - t * 5.0) * exp(-distToPtr * 0.45) * (0.18 + u_surge * 0.45);

  return w + ptrRipple;
}

vec3 renderOceanScene(vec2 uv, float aspect, float t) {
  float horizon = 0.46 - u_waterParting * 0.04;
  vec2 lightPos = vec2(0.62 + sin(t * 0.08) * 0.03, 0.64 + u_waterParting * 0.05);
  float windBoost = u_windIntensity;
  vec3 col = vec3(0.03, 0.04, 0.07);

  if (uv.y >= horizon) {
    float skyT = (uv.y - horizon) / (1.0 - horizon);
    vec3 zenith = mix(vec3(0.025, 0.04, 0.085), vec3(0.04, 0.09, 0.18), u_waterParting);
    vec3 midSky = mix(vec3(0.08, 0.145, 0.23), vec3(0.14, 0.25, 0.38), u_waterParting);
    vec3 horizonGlow = mix(
      vec3(0.26, 0.35, 0.45),
      vec3(0.55, 0.62, 0.72),
      clamp(u_surge * 0.4 + u_lightBloom * 0.5 + u_waterParting * 0.3, 0.0, 1.0)
    );

    col = mix(horizonGlow, midSky, smoothstep(0.0, 0.42, skyT));
    col = mix(col, zenith, smoothstep(0.32, 1.0, skyT));

    vec2 sUv = vec2(uv.x * aspect, uv.y);
    float stars = starLayer(sUv, 24.0, t, 0.90) * smoothstep(0.18, 0.75, skyT);
    col += vec3(0.95, 0.93, 0.88) * stars * 0.65;

    vec2 dLight = vec2((uv.x - lightPos.x) * aspect, uv.y - lightPos.y);
    float distL = length(dLight);
    float moonCorona = exp(-distL * 4.2) * (0.48 + u_lightBloom * 0.35 + u_surge * 0.25);
    float moonCore = exp(-distL * 14.0) * 0.65;
    vec3 coronaTint = mix(vec3(0.84, 0.89, 0.95), vec3(0.98, 0.88, 0.68), u_lightBloom * 0.6);
    col += coronaTint * (moonCorona + moonCore);

    vec2 cloudUv = vec2(uv.x * aspect * 1.4 - t * (0.016 + windBoost * 0.02), uv.y * 3.2);
    float cNoise = fbm(cloudUv + fbm(cloudUv * 1.6));
    // Part clouds near the center when u_waterParting increases
    float partGap = 1.0 - u_waterParting * 0.45 * exp(-abs(uv.y - (horizon + 0.16)) * 8.0);
    float cloudMask = smoothstep(0.38, 0.78, cNoise * partGap) * smoothstep(0.92, 0.04, skyT);
    vec3 cloudDark = vec3(0.05, 0.09, 0.15);
    vec3 cloudLit = coronaTint * exp(-distL * 2.5);
    col = mix(col, cloudDark + cloudLit * 0.55, cloudMask * 0.68);

    float hMist = exp(-abs(uv.y - horizon) * 26.0);
    col = mix(col, vec3(0.45, 0.55, 0.66), hMist * (0.42 + u_waterParting * 0.2));
  } else {
    float dy = max(0.004, horizon - uv.y);
    float z = 0.32 / dy;
    float x = (uv.x - 0.5) * z * aspect;
    vec2 wp = vec2(x, z);

    float eps = 0.035;
    float h0 = waterWaves(wp, t, windBoost, u_pointer, horizon, aspect);
    float hx = waterWaves(wp + vec2(eps, 0.0), t, windBoost, u_pointer, horizon, aspect);
    float hz = waterWaves(wp + vec2(0.0, eps), t, windBoost, u_pointer, horizon, aspect);

    vec3 normal = normalize(vec3((h0 - hx) / eps * 0.14, 1.0, (h0 - hz) / eps * 0.18));

    float fresnel = pow(1.0 - clamp(dot(normal, vec3(0.0, 1.0, 0.0)), 0.0, 1.0), 3.2);
    fresnel = clamp(fresnel * 0.75 + 0.15, 0.0, 1.0);

    vec3 deepWater = (u_subMode > 1.5)
      ? vec3(0.02, 0.09, 0.14)
      : vec3(0.02, 0.04, 0.08);
    vec3 skyReflect = mix(vec3(0.18, 0.27, 0.37), vec3(0.28, 0.36, 0.46), u_waterParting) + normal.x * 0.06;

    col = mix(deepWater, skyReflect, fresnel);

    float lightDx = (uv.x - lightPos.x) * aspect + normal.x * 0.28;
    float shimmerPath = exp(-abs(lightDx) * (3.8 + dy * 5.0));
    float waveCrest = smoothstep(0.08, 0.52, h0 + normal.z * 1.4);
    float spec = shimmerPath * waveCrest * (0.75 + u_surge * 0.45 + u_lightBloom * 0.35);
    float sparkle = shimmerPath * pow(max(0.0, h0 * 0.9 + 0.3), 4.0) * 0.65;

    vec3 specColor = mix(
      vec3(0.82, 0.88, 0.96),
      vec3(0.98, 0.85, 0.55),
      clamp(u_lightBloom * 0.65 + u_surge * 0.35, 0.0, 1.0)
    );
    col += specColor * (spec + sparkle) * smoothstep(0.0, 0.04, dy);

    float swellFoam = smoothstep(0.32, 0.68, h0) * exp(-dy * 4.5) * (0.20 + windBoost * 0.18);
    col += vec3(0.65, 0.75, 0.85) * swellFoam;

    float hMist = exp(-dy * 24.0);
    col = mix(col, vec3(0.40, 0.50, 0.62), hMist * 0.52);
    col *= smoothstep(0.0, 0.18, uv.y + 0.08);
  }
  return col;
}

vec3 renderDawnScene(vec2 uv, float aspect, float t) {
  float horizon = 0.40;
  vec2 sunPos = vec2(0.5 + (u_pointer.x - 0.5) * 0.08, 0.44 + u_lightBloom * 0.04 + u_surge * 0.03);
  vec3 col = vec3(0.05, 0.04, 0.07);

  if (uv.y >= horizon) {
    float skyT = (uv.y - horizon) / (1.0 - horizon);
    vec3 nightZenith = vec3(0.04, 0.035, 0.08);
    vec3 violetMid = vec3(0.16, 0.11, 0.20);
    vec3 warmHorizon = mix(vec3(0.50, 0.31, 0.14), vec3(0.68, 0.44, 0.20), u_lightBloom);

    col = mix(warmHorizon, violetMid, smoothstep(0.0, 0.48, skyT));
    col = mix(col, nightZenith, smoothstep(0.42, 1.0, skyT));

    vec2 dSun = vec2((uv.x - sunPos.x) * aspect, uv.y - sunPos.y);
    float distS = length(dSun);
    float angle = atan(dSun.y, dSun.x);

    float rays = fbm(vec2(angle * 4.5 + t * 0.05, distS * 1.2 - t * 0.12));
    float rayMask = smoothstep(0.35, 0.75, rays) * exp(-distS * 1.65) * (0.42 + u_lightBloom * 0.38 + u_surge * 0.30);

    float sunBloom = exp(-distS * 2.8) * (0.55 + u_lightBloom * 0.35 + u_surge * 0.25);
    float sunCore = exp(-distS * 9.0) * 0.75;

    col += vec3(0.96, 0.74, 0.36) * (sunBloom + rayMask);
    col += vec3(1.0, 0.94, 0.78) * sunCore;

    vec2 mistUv = vec2(uv.x * aspect * 1.3 - t * 0.015, uv.y * 2.8);
    float mist = fbm(mistUv);
    col = mix(col, vec3(0.85, 0.62, 0.34) * exp(-distS * 1.8), mist * 0.32 * (1.0 - skyT));
  } else {
    float dy = max(0.005, horizon - uv.y);
    float z = 0.28 / dy;
    float x = (uv.x - 0.5) * z * aspect;
    vec2 wp = vec2(x, z);

    float w = waterWaves(wp * 0.85, t * 0.75, u_windIntensity * 0.5, u_pointer, horizon, aspect);
    vec3 deepAmberSea = vec3(0.05, 0.035, 0.06);
    vec3 goldReflect = vec3(0.48, 0.29, 0.14);

    float fresnel = exp(-dy * 3.2);
    col = mix(deepAmberSea, goldReflect, fresnel * 0.75);

    float sunDx = (uv.x - sunPos.x) * aspect + w * 0.12;
    float goldPath = exp(-abs(sunDx) * (3.2 + dy * 4.5));
    float crest = smoothstep(0.0, 0.48, w + 0.18);
    col += vec3(0.98, 0.82, 0.48) * goldPath * crest * (0.75 + u_lightBloom * 0.4 + u_surge * 0.35);

    float hMist = exp(-dy * 22.0);
    col = mix(col, vec3(0.75, 0.48, 0.22), hMist * 0.55);
  }
  return col;
}

vec3 renderForestScene(vec2 uv, float aspect, float t) {
  float poolHorizon = 0.28;
  vec3 topCanopy = vec3(0.025, 0.065, 0.045);
  vec3 midValley = vec3(0.07, 0.17, 0.125);
  vec3 col = mix(midValley, topCanopy, smoothstep(0.25, 1.0, uv.y));

  vec2 rayCoord = vec2((uv.x - 0.62) * aspect + (1.0 - uv.y) * 0.38, uv.y);
  float shaftNoise = fbm(vec2(rayCoord.x * 3.5 - t * 0.03, uv.y * 1.4));
  float shaftMask = exp(-rayCoord.x * rayCoord.x * 4.2) * smoothstep(0.15, 0.95, uv.y);
  vec3 shaftColor = mix(vec3(0.45, 0.68, 0.56), vec3(0.92, 0.78, 0.46), 0.32 + u_lightBloom * 0.4 + u_surge * 0.28);
  col += shaftColor * shaftMask * (0.28 + shaftNoise * 0.26);

  if (uv.y >= poolHorizon) {
    float wfX = (uv.x - 0.56) * aspect;
    float wfMask = exp(-wfX * wfX * 18.0) * smoothstep(0.86, 0.58, uv.y) * smoothstep(poolHorizon - 0.02, poolHorizon + 0.08, uv.y);
    float flow = fbm(vec2(wfX * 14.0, uv.y * 5.5 + t * 1.45));
    col += vec3(0.82, 0.90, 0.88) * wfMask * (0.28 + flow * 0.36);

    float r1 = 0.48 - 0.10 * sin(uv.x * 3.2 + 0.5) + 0.035 * fbm(vec2(uv.x * 5.0, 1.0));
    float mask1 = smoothstep(r1 + 0.018, r1 - 0.018, uv.y);
    col = mix(col, vec3(0.045, 0.11, 0.08), mask1 * 0.84);

    float mist1 = fbm(vec2(uv.x * aspect * 1.8 - t * (0.025 + u_windIntensity * 0.02), uv.y * 4.0));
    col += vec3(0.52, 0.70, 0.62) * exp(-abs(uv.y - poolHorizon - 0.07) * 11.0) * mist1 * 0.42;

    float r2 = 0.39 + 0.11 * cos(uv.x * 2.6 - 1.1) + 0.025 * fbm(vec2(uv.x * 7.0, 2.0));
    float mask2 = smoothstep(r2 + 0.016, r2 - 0.016, uv.y);
    col = mix(col, vec3(0.025, 0.068, 0.048), mask2 * 0.90);
  } else {
    float dy = max(0.005, poolHorizon - uv.y);
    float z = 0.22 / dy;
    float x = (uv.x - 0.5) * z * aspect;
    float w = waterWaves(vec2(x, z), t * 0.85, u_windIntensity * 0.45, u_pointer, poolHorizon, aspect);

    vec3 poolBase = vec3(0.02, 0.05, 0.04);
    vec3 poolReflect = vec3(0.14, 0.28, 0.22);
    col = mix(poolBase, poolReflect, exp(-dy * 4.5) * 0.75);

    float wfDx = (uv.x - 0.58) * aspect + w * 0.12;
    float poolShimmer = exp(-abs(wfDx) * 4.5) * smoothstep(0.0, 0.45, w + 0.18);
    col += mix(vec3(0.68, 0.84, 0.78), vec3(0.95, 0.82, 0.50), u_lightBloom * 0.5 + u_surge * 0.3) * poolShimmer * 0.55;

    float bankMist = exp(-dy * 24.0);
    col = mix(col, vec3(0.32, 0.48, 0.42), bankMist * 0.45);
  }
  return col;
}

vec3 renderCosmosScene(vec2 uv, float aspect, float t) {
  float horizon = 0.24;
  vec3 col = vec3(0.02, 0.025, 0.06);

  if (uv.y >= horizon) {
    float skyT = (uv.y - horizon) / (1.0 - horizon);
    vec3 spaceTop = vec3(0.02, 0.025, 0.06);
    vec3 spaceMid = vec3(0.08, 0.065, 0.16);
    vec3 duneGlow = mix(vec3(0.22, 0.15, 0.13), vec3(0.38, 0.26, 0.18), u_lightBloom);

    col = mix(duneGlow, spaceMid, smoothstep(0.0, 0.38, skyT));
    col = mix(col, spaceTop, smoothstep(0.35, 1.0, skyT));

    vec2 nUv = vec2(uv.x * aspect * 1.1 + t * 0.008, uv.y * 1.3);
    float neb = fbm(nUv + fbm(nUv * 1.5 - t * 0.01));
    float nebMask = smoothstep(0.35, 0.82, neb) * smoothstep(0.05, 0.85, skyT);
    col += mix(vec3(0.28, 0.22, 0.48), vec3(0.78, 0.58, 0.26), neb) * nebMask * (0.36 + u_lightBloom * 0.25 + u_surge * 0.25);

    vec2 sUv = vec2(uv.x * aspect, uv.y);
    float s1 = starLayer(sUv, 20.0, t, 0.84);
    float s2 = starLayer(sUv + 3.7, 36.0, t * 1.3, 0.88);
    col += vec3(0.98, 0.92, 0.76) * s1 * (0.85 + u_surge * 0.35);
    col += vec3(0.80, 0.86, 0.98) * s2 * 0.65;
  } else {
    float duneCurve = horizon + 0.03 * sin(uv.x * 4.5 + 0.8) + 0.015 * cos(uv.x * 9.0);
    float dy = max(0.0, duneCurve - uv.y);
    vec3 duneLit = vec3(0.11, 0.085, 0.09);
    vec3 duneShadow = vec3(0.03, 0.025, 0.04);
    float windSand = fbm(vec2(uv.x * aspect * 3.0 - t * (0.10 + u_windIntensity * 0.08), uv.y * 8.0));
    col = mix(duneLit, duneShadow, smoothstep(0.0, 0.18, dy));
    col += vec3(0.65, 0.48, 0.26) * exp(-dy * 24.0) * windSand * (0.25 + u_surge * 0.25);
  }
  return col;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / max(1.0, u_resolution.y);
  float t = u_time;

  vec3 totalCol = vec3(0.0);
  if (u_weights.x > 0.002) {
    totalCol += renderOceanScene(uv, aspect, t) * u_weights.x;
  }
  if (u_weights.y > 0.002) {
    totalCol += renderDawnScene(uv, aspect, t) * u_weights.y;
  }
  if (u_weights.z > 0.002) {
    totalCol += renderForestScene(uv, aspect, t) * u_weights.z;
  }
  if (u_weights.w > 0.002) {
    totalCol += renderCosmosScene(uv, aspect, t) * u_weights.w;
  }

  gl_FragColor = vec4(totalCol, 1.0);
}
`;

function getMoteColorsForTheme(theme: SceneTheme | 'hero-waterfall'): string[] {
  if (
    theme === 'hero-waterfall' ||
    theme === 'ancient-forest' ||
    theme === 'eden-mist'
  ) {
    return ['#A8D5A2', '#D4A853', '#87CEEB'];
  }
  if (theme === 'first-light' || theme === 'sabbath-stillness') {
    return ['#FFD700', '#D4A853', '#FFF8DC'];
  }
  if (theme === 'celestial-spheres' || theme === 'desert-stars') {
    return ['#D4A853', '#B0C4DE', '#FFF8DC'];
  }
  return ['#8B7EC8', '#D4A853', '#CBD5E1'];
}

interface SoftMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  targetAlpha: number;
  life: number;
  maxLife: number;
}

function createMote(w: number, h: number, colors: string[]): SoftMote {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.22,
    vy: -0.06 - Math.random() * 0.18,
    size: 1.0 + Math.random() * 1.8,
    color: colors[Math.floor(Math.random() * colors.length)] || '#D4A853',
    alpha: 0,
    targetAlpha: 0.2 + Math.random() * 0.45,
    life: Math.random() * 100,
    maxLife: 160 + Math.random() * 220,
  };
}

export const LivingStoryCanvas: React.FC<LivingStoryCanvasProps> = ({
  theme,
  canvasMode,
  activeText = '',
  isSoundCueActive = false,
  surgeCount = 0,
  highContrast = false,
  interactive = true,
  className = '',
}) => {
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const moteCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const surgeEnergyRef = useRef<number>(0);

  const initialShaderState = computeTextDrivenShaderTargets(
    theme,
    canvasMode,
    activeText,
    isSoundCueActive
  );
  const currentStateRef = useRef<TextDrivenShaderState>(initialShaderState);
  const targetStateRef = useRef<TextDrivenShaderState>(initialShaderState);
  const moteColorsRef = useRef<string[]>(getMoteColorsForTheme(theme));

  // Update target shader state whenever chapter theme, mode, or active text/cue changes
  // without restarting the WebGL context so transitions are 100% seamless
  useEffect(() => {
    targetStateRef.current = computeTextDrivenShaderTargets(
      theme,
      canvasMode,
      activeText,
      isSoundCueActive
    );
    moteColorsRef.current = getMoteColorsForTheme(theme);
  }, [theme, canvasMode, activeText, isSoundCueActive]);

  // Trigger smooth organic wave/light surge when surgeCount increments
  useEffect(() => {
    if (surgeCount > 0) {
      surgeEnergyRef.current = Math.min(1.0, surgeEnergyRef.current + 0.75);
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
      const glScale = isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      glCanvas.width = Math.max(1, Math.floor(width * glScale));
      glCanvas.height = Math.max(1, Math.floor(height * glScale));
      if (gl) {
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      }

      const moteDpr = isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      moteCanvas.width = Math.max(1, Math.floor(width * moteDpr));
      moteCanvas.height = Math.max(1, Math.floor(height * moteDpr));
      if (ctx2d) {
        ctx2d.setTransform(moteDpr, 0, 0, moteDpr, 0, 0);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const moteCount = isHeadless ? 14 : width < 640 ? 18 : 28;
    const motes: SoftMote[] = Array.from({ length: moteCount }, () =>
      createMote(width, height, moteColorsRef.current)
    );

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
      surgeEnergyRef.current = Math.max(0, surgeEnergyRef.current * 0.96);

      // Smoothly cross-dissolve WebGL scene weights and text-driven uniforms (~1.8s silk transition)
      currentStateRef.current = lerpShaderState(
        currentStateRef.current,
        targetStateRef.current,
        isHeadless ? 0.65 : dtSec * 1.45
      );

      const st = currentStateRef.current;

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
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (ctx2d) {
        const skyGrad = ctx2d.createLinearGradient(0, 0, 0, height);
        if (st.weights.forest > 0.45) {
          skyGrad.addColorStop(0, '#050D09');
          skyGrad.addColorStop(0.55, '#122B1F');
          skyGrad.addColorStop(1, '#050B08');
        } else if (st.weights.dawn > 0.45) {
          skyGrad.addColorStop(0, '#090812');
          skyGrad.addColorStop(0.52, '#4A2C18');
          skyGrad.addColorStop(1, '#08060A');
        } else {
          skyGrad.addColorStop(0, '#050811');
          skyGrad.addColorStop(0.54, '#243748');
          skyGrad.addColorStop(1, '#04070D');
        }
        ctx2d.fillStyle = skyGrad;
        ctx2d.fillRect(0, 0, width, height);
      }

      if (ctx2d) {
        if (gl && program) {
          ctx2d.clearRect(0, 0, width, height);
        }
        for (let i = 0; i < motes.length; i++) {
          const m = motes[i];
          m.x +=
            (m.vx + Math.sin(elapsed * 0.6 + i) * 0.08) *
            (1 + st.windIntensity * 0.8);
          m.y += m.vy;
          m.life += 1;
          m.alpha += (m.targetAlpha - m.alpha) * 0.03;

          if (
            m.life > m.maxLife ||
            m.x < -20 ||
            m.x > width + 20 ||
            m.y < -20 ||
            m.y > height + 20
          ) {
            const next = createMote(width, height, moteColorsRef.current);
            m.x = next.x;
            m.y = height + 10;
            m.vx = next.vx;
            m.vy = next.vy;
            m.size = next.size;
            m.color = next.color;
            m.alpha = 0;
            m.targetAlpha = next.targetAlpha;
            m.life = 0;
            m.maxLife = next.maxLife;
          }

          ctx2d.beginPath();
          ctx2d.arc(m.x, m.y, m.size, 0, Math.PI * 2);
          ctx2d.fillStyle = m.color;
          ctx2d.globalAlpha = m.alpha * 0.45;
          ctx2d.fill();
        }
        ctx2d.globalAlpha = 1;
      }
    };

    renderFrame(performance.now());

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    pointerRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    handlePointerMove(e);
    surgeEnergyRef.current = 0.85;
  };

  const radialScrimOpacity = highContrast ? 0.84 : 0.68;

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      className={`overflow-hidden select-none bg-[#06080E] ${className}`}
      aria-hidden="true"
    >
      {/* Persistent Real-time WebGL GLSL Water, Mist, Dawn & Sky Shader */}
      <canvas
        ref={glCanvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* Subtle atmospheric dust & light motes */}
      <canvas
        ref={moteCanvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />

      {/* Soft centered radial vignette matching talesthatshaped.me for effortless text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 640px 800px at center, rgba(0, 0, 0, ${radialScrimOpacity}) 0%, rgba(0, 0, 0, ${
            radialScrimOpacity * 0.56
          }) 42%, rgba(0, 0, 0, 0.22) 100%)`,
        }}
      />
    </div>
  );
};
