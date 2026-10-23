import {
  PhysicsSimulationConfig,
  rgbTupleToHex,
  SimulationMode,
} from '../types/visualConfig';
import { AudioFrequencyMetrics } from './audioAnalyzerBus';

interface FlowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hueShift: number;
  history: { x: number; y: number }[];
}

interface BoidEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  wingPhase: number;
  scale: number;
  depth: number;
}

interface VerletRibbon {
  nodes: { x: number; y: number; oldX: number; oldY: number }[];
  segLen: number;
  thickness: number;
  alpha: number;
  phaseOffset: number;
}

interface VoronoiShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  radius: number;
  vertices: { r: number; theta: number }[];
  alpha: number;
}

interface OrbitalStar {
  orbitRadius: number;
  angle: number;
  angularSpeed: number;
  eccentricity: number;
  tilt: number;
  size: number;
  twinklePhase: number;
}

// Fast 2D pseudo-simplex curl noise field
function hash2d(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return h - Math.floor(h);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash2d(ix, iy);
  const b = hash2d(ix + 1, iy);
  const c = hash2d(ix, iy + 1);
  const d = hash2d(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function sampleCurlNoise(
  x: number,
  y: number,
  t: number
): { vx: number; vy: number } {
  const eps = 0.04;
  const n1 = smoothNoise(x, y + eps + t * 0.25);
  const n2 = smoothNoise(x, y - eps + t * 0.25);
  const n3 = smoothNoise(x + eps + t * 0.2, y);
  const n4 = smoothNoise(x - eps + t * 0.2, y);
  const dx = (n1 - n2) / (2 * eps);
  const dy = (n3 - n4) / (2 * eps);
  return { vx: dx, vy: -dy };
}

export class ChapterPhysicsEngine {
  private flowParticles: FlowParticle[] = [];
  private boids: BoidEntity[] = [];
  private ribbons: VerletRibbon[] = [];
  private shards: VoronoiShard[] = [];
  private orbitals: OrbitalStar[] = [];
  private lastWidth = 0;
  private lastHeight = 0;

  private ensureInitialized(
    width: number,
    height: number,
    targetCount: number
  ): void {
    const clampedCount = Math.max(20, Math.min(350, Math.round(targetCount)));
    const resized =
      Math.abs(width - this.lastWidth) > 80 ||
      Math.abs(height - this.lastHeight) > 80;

    if (resized) {
      this.lastWidth = width;
      this.lastHeight = height;
    }

    // 1. Curl-flow particles
    while (this.flowParticles.length < clampedCount) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      this.flowParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: 1.1 + Math.random() * 2.2,
        life: Math.random() * 180,
        maxLife: 160 + Math.random() * 200,
        hueShift: (Math.random() - 0.5) * 35,
        history: [{ x, y }],
      });
    }
    if (this.flowParticles.length > clampedCount) {
      this.flowParticles.length = clampedCount;
    }

    // 2. Boids flock
    const boidCount = Math.max(16, Math.min(110, Math.round(clampedCount * 0.45)));
    while (this.boids.length < boidCount) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 1.4;
      this.boids.push({
        x: Math.random() * width,
        y: height * (0.18 + Math.random() * 0.62),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.4,
        wingPhase: Math.random() * Math.PI * 2,
        scale: 0.65 + Math.random() * 0.85,
        depth: 0.4 + Math.random() * 0.6,
      });
    }
    if (this.boids.length > boidCount) {
      this.boids.length = boidCount;
    }

    // 3. Verlet ribbons
    const ribbonCount = Math.max(5, Math.min(20, Math.round(clampedCount / 12)));
    if (this.ribbons.length !== ribbonCount || resized) {
      this.ribbons = Array.from({ length: ribbonCount }, (_, idx) => {
        const startX = width * (0.08 + (idx / ribbonCount) * 0.84);
        const startY = height * (0.24 + ((idx * 37) % 100) * 0.005);
        const nodeCount = 16;
        const segLen = Math.max(10, Math.min(26, width / 58));
        const nodes = Array.from({ length: nodeCount }, (__, nIdx) => ({
          x: startX + nIdx * segLen * 0.65,
          y: startY + Math.sin(nIdx * 0.4 + idx) * 8,
          oldX: startX + nIdx * segLen * 0.65,
          oldY: startY + Math.sin(nIdx * 0.4 + idx) * 8,
        }));
        return {
          nodes,
          segLen,
          thickness: 1.2 + (idx % 3) * 0.75,
          alpha: 0.24 + (idx % 4) * 0.12,
          phaseOffset: idx * 1.17,
        };
      });
    }

    // 4. Voronoi fracture shards
    const shardCount = Math.max(18, Math.min(120, Math.round(clampedCount * 0.55)));
    while (this.shards.length < shardCount) {
      const vCount = 4 + Math.floor(Math.random() * 3);
      const vertices = Array.from({ length: vCount }, (_, k) => ({
        r: 0.65 + Math.random() * 0.55,
        theta: (k / vCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35,
      }));
      this.shards.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.035,
        radius: 3.5 + Math.random() * 9.5,
        vertices,
        alpha: 0.25 + Math.random() * 0.55,
      });
    }
    if (this.shards.length > shardCount) {
      this.shards.length = shardCount;
    }

    // 5. Celestial orbitals
    const orbitalCount = Math.max(28, Math.min(160, Math.round(clampedCount * 0.75)));
    while (this.orbitals.length < orbitalCount) {
      const idx = this.orbitals.length;
      const norm = (idx + 1) / orbitalCount;
      this.orbitals.push({
        orbitRadius: 0.06 + Math.pow(norm, 0.82) * 0.48,
        angle: idx * 2.39996, // golden angle distribution
        angularSpeed: (0.08 + (1 - norm) * 0.28) * (idx % 2 === 0 ? 1 : -0.65),
        eccentricity: 0.55 + (idx % 5) * 0.09,
        tilt: ((idx % 7) - 3) * 0.14,
        size: 1.0 + (idx % 4) * 0.85,
        twinklePhase: idx * 0.73,
      });
    }
    if (this.orbitals.length > orbitalCount) {
      this.orbitals.length = orbitalCount;
    }
  }

  public render(options: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    dtSec: number;
    elapsed: number;
    physics: PhysicsSimulationConfig;
    accentRgb: readonly [number, number, number];
    horizonRgb: readonly [number, number, number];
    audio: AudioFrequencyMetrics;
    audioReactiveEnabled: boolean;
    trebleSparkleDepth: number;
    voiceBloomDepth: number;
    pointer: { x: number; y: number };
    pointerVelocity: { vx: number; vy: number };
    shockwaveProgress: number; // 0..1 when a paragraph keyframe or click triggers shockwave
  }): void {
    const {
      ctx,
      width,
      height,
      dtSec,
      elapsed,
      physics,
      accentRgb,
      horizonRgb,
      audio,
      audioReactiveEnabled,
      trebleSparkleDepth,
      voiceBloomDepth,
      pointer,
      pointerVelocity,
      shockwaveProgress,
    } = options;

    this.ensureInitialized(width, height, physics.particleCount);

    const accentHex = rgbTupleToHex(accentRgb);
    const horizonHex = rgbTupleToHex(horizonRgb);
    const audioSparkle = audioReactiveEnabled
      ? 1 + audio.treble * trebleSparkleDepth * 0.9 + audio.voiceEnvelope * voiceBloomDepth * 0.6
      : 1;

    // Render optional secondary simulation layer at softer opacity behind primary
    if (
      physics.secondaryOverlay &&
      physics.secondaryOverlay !== 'none' &&
      physics.secondaryOverlay !== physics.mode
    ) {
      ctx.save();
      ctx.globalAlpha = 0.46;
      this.renderMode(physics.secondaryOverlay, {
        ctx,
        width,
        height,
        dtSec,
        elapsed,
        physics,
        accentRgb,
        accentHex,
        horizonHex,
        audio,
        audioSparkle,
        pointer,
        pointerVelocity,
      });
      ctx.restore();
    }

    // Render primary simulation mode
    ctx.save();
    ctx.globalAlpha = 0.92;
    this.renderMode(physics.mode, {
      ctx,
      width,
      height,
      dtSec,
      elapsed,
      physics,
      accentRgb,
      accentHex,
      horizonHex,
      audio,
      audioSparkle,
      pointer,
      pointerVelocity,
    });
    ctx.restore();

    // Render dramatic keyframe / pointer radial shockwave ring if active
    if (shockwaveProgress > 0.005 && shockwaveProgress < 0.995) {
      this.renderShockwavePulse(
        ctx,
        width,
        height,
        shockwaveProgress,
        accentRgb,
        pointer
      );
    }
  }

  private renderMode(
    mode: SimulationMode,
    env: {
      ctx: CanvasRenderingContext2D;
      width: number;
      height: number;
      dtSec: number;
      elapsed: number;
      physics: PhysicsSimulationConfig;
      accentRgb: readonly [number, number, number];
      accentHex: string;
      horizonHex: string;
      audio: AudioFrequencyMetrics;
      audioSparkle: number;
      pointer: { x: number; y: number };
      pointerVelocity: { vx: number; vy: number };
    }
  ): void {
    switch (mode) {
      case 'curl-flow':
        this.renderCurlFlow(env);
        break;
      case 'boids-flock':
        this.renderBoidsFlock(env);
        break;
      case 'lsystem-flora':
        this.renderLSystemFlora(env);
        break;
      case 'verlet-ribbons':
        this.renderVerletRibbons(env);
        break;
      case 'voronoi-fracture':
        this.renderVoronoiFracture(env);
        break;
      case 'radial-shockwave':
        this.renderRadialResonance(env);
        break;
      case 'celestial-orbital':
        this.renderCelestialOrbital(env);
        break;
    }
  }

  private renderCurlFlow(env: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    dtSec: number;
    elapsed: number;
    physics: PhysicsSimulationConfig;
    accentRgb: readonly [number, number, number];
    accentHex: string;
    audio: AudioFrequencyMetrics;
    audioSparkle: number;
    pointer: { x: number; y: number };
    pointerVelocity: { vx: number; vy: number };
  }): void {
    const {
      ctx,
      width,
      height,
      elapsed,
      physics,
      accentRgb,
      pointer,
      pointerVelocity,
      audioSparkle,
    } = env;

    const speed = physics.speedMultiplier * (0.9 + ( audioSparkle - 1 ) * 0.45);
    const turb = Math.max(0.1, physics.turbulence);
    const gx = physics.gravityVector[0] * 1.4;
    const gy = physics.gravityVector[1] * 1.4;
    const px = pointer.x * width;
    const py = pointer.y * height;

    const r = Math.round(accentRgb[0] * 255);
    const g = Math.round(accentRgb[1] * 255);
    const b = Math.round(accentRgb[2] * 255);

    ctx.lineCap = 'round';

    for (const p of this.flowParticles) {
      const curl = sampleCurlNoise(
        (p.x / Math.max(1, width)) * 2.8 * turb,
        (p.y / Math.max(1, height)) * 2.8 * turb,
        elapsed * 0.45
      );

      // Pointer vortex interaction
      const dx = p.x - px;
      const dy = p.y - py;
      const distSq = dx * dx + dy * dy + 900;
      const ptrForce = Math.min(2.2, 6500 / distSq);

      p.vx =
        p.vx * 0.88 +
        (curl.vx * 1.35 * turb +
          gx +
          pointerVelocity.vx * ptrForce * 14 -
          (dy / Math.sqrt(distSq)) * ptrForce * 0.35 * physics.cohesion) *
          0.18 *
          speed;
      p.vy =
        p.vy * 0.88 +
        (curl.vy * 1.35 * turb +
          gy +
          pointerVelocity.vy * ptrForce * 14 +
          (dx / Math.sqrt(distSq)) * ptrForce * 0.35 * physics.cohesion) *
          0.18 *
          speed;

      p.x += p.vx * 2.4;
      p.y += p.vy * 2.4;
      p.life += 1;

      p.history.push({ x: p.x, y: p.y });
      if (p.history.length > 9) {
        p.history.shift();
      }

      if (
        p.x < -30 ||
        p.x > width + 30 ||
        p.y < -30 ||
        p.y > height + 30 ||
        p.life >= p.maxLife
      ) {
        p.x = Math.random() * width;
        p.y = gy < -0.15 ? height + 10 : gy > 0.15 ? -10 : Math.random() * height;
        p.life = 0;
        p.history = [{ x: p.x, y: p.y }];
      }

      const lifeRatio = p.life / p.maxLife;
      const alpha =
        Math.sin(lifeRatio * Math.PI) * 0.72 * Math.min(1.5, audioSparkle);

      if (p.history.length > 2) {
        ctx.beginPath();
        ctx.moveTo(p.history[0].x, p.history[0].y);
        for (let i = 1; i < p.history.length; i++) {
          ctx.lineTo(p.history[i].x, p.history[i].y);
        }
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 0.65).toFixed(3)})`;
        ctx.lineWidth = p.size * physics.scaleMultiplier * 0.85;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(
        p.x,
        p.y,
        p.size * physics.scaleMultiplier * 0.9,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(${Math.min(255, r + 35)}, ${Math.min(255, g + 35)}, ${Math.min(255, b + 35)}, ${Math.min(0.95, alpha).toFixed(3)})`;
      ctx.fill();
    }
  }

  private renderBoidsFlock(env: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    elapsed: number;
    physics: PhysicsSimulationConfig;
    accentRgb: readonly [number, number, number];
    audioSparkle: number;
    pointer: { x: number; y: number };
  }): void {
    const { ctx, width, height, elapsed, physics, accentRgb, pointer, audioSparkle } =
      env;
    const boids = this.boids;
    const neighborDist = 95;
    const desiredSep = 28 + physics.separation * 32;
    const maxSpeed = 2.8 * physics.speedMultiplier;
    const maxForce = 0.085;

    const r = Math.round(accentRgb[0] * 255);
    const g = Math.round(accentRgb[1] * 255);
    const b = Math.round(accentRgb[2] * 255);

    const targetX =
      width * (0.5 + Math.sin(elapsed * 0.28) * 0.28) * 0.7 +
      pointer.x * width * 0.3;
    const targetY =
      height * (0.42 + Math.cos(elapsed * 0.22) * 0.18) * 0.7 +
      pointer.y * height * 0.3;

    for (let i = 0; i < boids.length; i++) {
      const boid = boids[i];
      let sepX = 0,
        sepY = 0,
        sepCount = 0;
      let aliX = 0,
        aliY = 0,
        aliCount = 0;
      let cohX = 0,
        cohY = 0,
        cohCount = 0;

      for (let j = 0; j < boids.length; j++) {
        if (i === j) continue;
        const other = boids[j];
        const dx = boid.x - other.x;
        const dy = boid.y - other.y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < desiredSep) {
          sepX += dx / (d * d);
          sepY += dy / (d * d);
          sepCount++;
        }
        if (d > 0 && d < neighborDist) {
          aliX += other.vx;
          aliY += other.vy;
          aliCount++;
          cohX += other.x;
          cohY += other.y;
          cohCount++;
        }
      }

      let fx = 0;
      let fy = 0;

      if (sepCount > 0) {
        fx += (sepX / sepCount) * 1.8 * physics.separation;
        fy += (sepY / sepCount) * 1.8 * physics.separation;
      }
      if (aliCount > 0) {
        fx += ((aliX / aliCount - boid.vx) * 0.06);
        fy += ((aliY / aliCount - boid.vy) * 0.06);
      }
      if (cohCount > 0) {
        const cx = cohX / cohCount - boid.x;
        const cy = cohY / cohCount - boid.y;
        fx += cx * 0.0015 * physics.cohesion;
        fy += cy * 0.0015 * physics.cohesion;
      }

      // Gentle attractor toward horizon / pointer
      fx += (targetX - boid.x) * 0.00045 * physics.cohesion;
      fy += (targetY - boid.y) * 0.00045 * physics.cohesion;

      // Curl turbulence
      const curl = sampleCurlNoise(boid.x * 0.003, boid.y * 0.003, elapsed * 0.3);
      fx += curl.vx * 0.04 * physics.turbulence;
      fy += curl.vy * 0.04 * physics.turbulence;

      const fMag = Math.hypot(fx, fy);
      if (fMag > maxForce) {
        fx = (fx / fMag) * maxForce;
        fy = (fy / fMag) * maxForce;
      }

      boid.vx += fx + physics.gravityVector[0] * 0.04;
      boid.vy += fy + physics.gravityVector[1] * 0.04;

      const speed = Math.hypot(boid.vx, boid.vy);
      if (speed > maxSpeed) {
        boid.vx = (boid.vx / speed) * maxSpeed;
        boid.vy = (boid.vy / speed) * maxSpeed;
      } else if (speed < maxSpeed * 0.4) {
        boid.vx *= 1.05;
        boid.vy *= 1.05;
      }

      boid.x += boid.vx;
      boid.y += boid.vy;
      boid.wingPhase += 0.16 * physics.speedMultiplier + speed * 0.04;

      if (boid.x < -40) boid.x = width + 40;
      if (boid.x > width + 40) boid.x = -40;
      if (boid.y < 40) boid.vy += 0.12;
      if (boid.y > height - 60) boid.vy -= 0.12;

      // Draw articulated luminous bird / dove / shoal silhouette
      const heading = Math.atan2(boid.vy, boid.vx);
      const wingSpan =
        11 * boid.scale * physics.scaleMultiplier * (0.7 + boid.depth * 0.5);
      const flap = Math.sin(boid.wingPhase) * wingSpan * 0.65;
      const alpha = (0.35 + boid.depth * 0.52) * Math.min(1.3, audioSparkle);

      ctx.save();
      ctx.translate(boid.x, boid.y);
      ctx.rotate(heading);

      ctx.beginPath();
      ctx.moveTo(wingSpan * 0.65, 0);
      ctx.quadraticCurveTo(
        -wingSpan * 0.1,
        -flap * 0.85,
        -wingSpan * 0.75,
        -wingSpan * 0.55 - flap * 0.45
      );
      ctx.quadraticCurveTo(-wingSpan * 0.25, 0, -wingSpan * 0.55, 0);
      ctx.quadraticCurveTo(
        -wingSpan * 0.25,
        0,
        -wingSpan * 0.75,
        wingSpan * 0.55 + flap * 0.45
      );
      ctx.quadraticCurveTo(
        -wingSpan * 0.1,
        flap * 0.85,
        wingSpan * 0.65,
        0
      );
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(0.92, alpha).toFixed(3)})`;
      ctx.fill();

      ctx.restore();
    }
  }

  private renderLSystemFlora(env: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    elapsed: number;
    physics: PhysicsSimulationConfig;
    accentRgb: readonly [number, number, number];
    audio: AudioFrequencyMetrics;
    audioSparkle: number;
    pointer: { x: number; y: number };
  }): void {
    const {
      ctx,
      width,
      height,
      elapsed,
      physics,
      accentRgb,
      audio,
      audioSparkle,
      pointer,
    } = env;

    const r = Math.round(accentRgb[0] * 255);
    const g = Math.round(accentRgb[1] * 255);
    const b = Math.round(accentRgb[2] * 255);

    const treeSpecs = [
      { xNorm: 0.22, baseLen: height * 0.165, maxDepth: 6, seed: 1.1 },
      { xNorm: 0.5, baseLen: height * 0.21, maxDepth: 7, seed: 2.7 },
      { xNorm: 0.78, baseLen: height * 0.155, maxDepth: 6, seed: 4.3 },
    ];

    const windBend =
      (pointer.x - 0.5) * 0.18 +
      Math.sin(elapsed * 0.85 * physics.speedMultiplier) *
        0.075 *
        physics.turbulence;

    const drawBranch = (
      x: number,
      y: number,
      len: number,
      angle: number,
      depth: number,
      seed: number
    ) => {
      if (depth <= 0 || len < 3) return;

      const sway =
        Math.sin(elapsed * 1.2 * physics.speedMultiplier + depth * 0.7 + seed) *
          0.045 *
          physics.turbulence +
        windBend * (1 - depth / 8);

      const nextAngle = angle + sway;
      const nx = x + Math.cos(nextAngle) * len;
      const ny = y + Math.sin(nextAngle) * len;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      const branchAlpha = 0.18 + (depth / 7) * 0.45;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${branchAlpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(0.75, depth * 1.15 * physics.scaleMultiplier);
      ctx.stroke();

      if (depth <= 2) {
        // Luminous botanical leaf / blossom node
        const leafRadius =
          (2.2 + audio.mid * 3.5) * physics.scaleMultiplier * Math.min(1.3, audioSparkle);
        ctx.beginPath();
        ctx.arc(nx, ny, leafRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, r + 40)}, ${Math.min(255, g + 45)}, ${Math.min(255, b + 25)}, 0.55)`;
        ctx.fill();
      }

      const spread = 0.36 + (1 - physics.cohesion) * 0.22;
      drawBranch(
        nx,
        ny,
        len * 0.74,
        nextAngle - spread,
        depth - 1,
        seed + 1.3
      );
      drawBranch(
        nx,
        ny,
        len * 0.74,
        nextAngle + spread,
        depth - 1,
        seed + 2.9
      );
    };

    ctx.lineCap = 'round';
    for (const tree of treeSpecs) {
      drawBranch(
        width * tree.xNorm,
        height * 0.98,
        tree.baseLen * physics.scaleMultiplier * 0.88,
        -Math.PI / 2,
        tree.maxDepth,
        tree.seed
      );
    }
  }

  private renderVerletRibbons(env: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    elapsed: number;
    physics: PhysicsSimulationConfig;
    accentRgb: readonly [number, number, number];
    audio: AudioFrequencyMetrics;
    audioSparkle: number;
    pointer: { x: number; y: number };
    pointerVelocity: { vx: number; vy: number };
  }): void {
    const {
      ctx,
      width,
      height,
      elapsed,
      physics,
      accentRgb,
      audio,
      audioSparkle,
      pointer,
      pointerVelocity,
    } = env;

    const r = Math.round(accentRgb[0] * 255);
    const g = Math.round(accentRgb[1] * 255);
    const b = Math.round(accentRgb[2] * 255);

    const px = pointer.x * width;
    const py = pointer.y * height;

    for (let rIdx = 0; rIdx < this.ribbons.length; rIdx++) {
      const ribbon = this.ribbons[rIdx];
      const nodes = ribbon.nodes;
      if (nodes.length < 3) continue;

      // Pin/drive head node along harmonic wave trajectory
      const t = elapsed * 0.45 * physics.speedMultiplier + ribbon.phaseOffset;
      const headX =
        ((t * 95 + rIdx * (width / this.ribbons.length)) % (width + 260)) - 130;
      const headY =
        height * (0.28 + 0.44 * ((rIdx * 29) % 10) * 0.1) +
        Math.sin(t * 1.8 + rIdx) * 48 * physics.turbulence +
        audio.voiceEnvelope * 32 * Math.sin(t * 5);

      if (headX < -120) {
        for (let n = 0; n < nodes.length; n++) {
          nodes[n].x = headX - n * ribbon.segLen;
          nodes[n].oldX = nodes[n].x;
          nodes[n].y = headY;
          nodes[n].oldY = headY;
        }
      } else {
        nodes[0].x = headX;
        nodes[0].y = headY;
      }

      // Verlet integration for trailing nodes
      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        const vx = (node.x - node.oldX) * 0.92;
        const vy = (node.y - node.oldY) * 0.92;
        node.oldX = node.x;
        node.oldY = node.y;

        const waveLift =
          Math.sin(elapsed * 2.2 + i * 0.45 + ribbon.phaseOffset) *
          0.65 *
          physics.turbulence;

        // Pointer displacement
        const dx = node.x - px;
        const dy = node.y - py;
        const dist = Math.hypot(dx, dy) + 40;
        const ptrPush = dist < 180 ? (180 - dist) * 0.015 : 0;

        node.x +=
          vx +
          physics.gravityVector[0] * 0.4 +
          pointerVelocity.vx * ptrPush * 12;
        node.y +=
          vy +
          waveLift +
          physics.gravityVector[1] * 0.4 +
          pointerVelocity.vy * ptrPush * 12;
      }

      // Distance constraint relaxation
      for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < nodes.length - 1; i++) {
          const n1 = nodes[i];
          const n2 = nodes[i + 1];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const diff = (ribbon.segLen - dist) / dist;
          if (i > 0) {
            n1.x -= dx * diff * 0.5;
            n1.y -= dy * diff * 0.5;
          }
          n2.x += dx * diff * (i === 0 ? 1.0 : 0.5);
          n2.y += dy * diff * (i === 0 ? 1.0 : 0.5);
        }
      }

      // Draw smooth ribbon curve
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i < nodes.length - 1; i++) {
        const xc = (nodes[i].x + nodes[i + 1].x) * 0.5;
        const yc = (nodes[i].y + nodes[i + 1].y) * 0.5;
        ctx.quadraticCurveTo(nodes[i].x, nodes[i].y, xc, yc);
      }
      const alpha = Math.min(0.88, ribbon.alpha * audioSparkle);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = ribbon.thickness * physics.scaleMultiplier;
      ctx.stroke();
    }
  }

  private renderVoronoiFracture(env: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    elapsed: number;
    physics: PhysicsSimulationConfig;
    accentRgb: readonly [number, number, number];
    audioSparkle: number;
    pointer: { x: number; y: number };
  }): void {
    const { ctx, width, height, elapsed, physics, accentRgb, pointer, audioSparkle } =
      env;

    const r = Math.round(accentRgb[0] * 255);
    const g = Math.round(accentRgb[1] * 255);
    const b = Math.round(accentRgb[2] * 255);

    const px = pointer.x * width;
    const py = pointer.y * height;

    for (const s of this.shards) {
      const curl = sampleCurlNoise(
        s.x * 0.0025,
        s.y * 0.0025,
        elapsed * 0.35
      );

      // Repel from pointer
      const dx = s.x - px;
      const dy = s.y - py;
      const dist = Math.hypot(dx, dy) + 25;
      const repel =
        dist < 170
          ? ((170 - dist) / 170) * 0.45 * physics.separation
          : 0;

      s.vx =
        s.vx * 0.94 +
        (curl.vx * physics.turbulence * 0.35 +
          physics.gravityVector[0] * 0.65 +
          (dx / dist) * repel) *
          physics.speedMultiplier;
      s.vy =
        s.vy * 0.94 +
        (curl.vy * physics.turbulence * 0.35 +
          physics.gravityVector[1] * 0.65 +
          (dy / dist) * repel) *
          physics.speedMultiplier;

      s.x += s.vx * 1.8;
      s.y += s.vy * 1.8;
      s.angle += s.vAngle * physics.speedMultiplier * (1 + physics.turbulence * 0.4);

      if (s.x < -30) s.x = width + 30;
      if (s.x > width + 30) s.x = -30;
      if (s.y < -30) s.y = height + 30;
      if (s.y > height + 30) s.y = -30;

      const rad = s.radius * physics.scaleMultiplier;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.beginPath();
      for (let i = 0; i < s.vertices.length; i++) {
        const v = s.vertices[i];
        const vx = Math.cos(v.theta) * v.r * rad;
        const vy = Math.sin(v.theta) * v.r * rad;
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();

      const alpha = Math.min(0.85, s.alpha * audioSparkle);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(alpha * 0.28).toFixed(3)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)}, ${(alpha * 0.78).toFixed(3)})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderRadialResonance(env: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    elapsed: number;
    physics: PhysicsSimulationConfig;
    accentRgb: readonly [number, number, number];
    audio: AudioFrequencyMetrics;
    audioSparkle: number;
    pointer: { x: number; y: number };
  }): void {
    const {
      ctx,
      width,
      height,
      elapsed,
      physics,
      accentRgb,
      audio,
      audioSparkle,
      pointer,
    } = env;

    const r = Math.round(accentRgb[0] * 255);
    const g = Math.round(accentRgb[1] * 255);
    const b = Math.round(accentRgb[2] * 255);

    const cx = width * (0.5 + (pointer.x - 0.5) * 0.25);
    const cy = height * (0.48 + (pointer.y - 0.5) * 0.22);
    const maxR = Math.hypot(width, height) * 0.56 * physics.scaleMultiplier;
    const ringCount = 9;

    for (let i = 0; i < ringCount; i++) {
      const phase =
        ((elapsed * 0.24 * physics.speedMultiplier + i / ringCount) % 1 + 1) % 1;
      const radius =
        phase * maxR * (1 + audio.subBass * 0.18 + audio.voiceEnvelope * 0.15);
      const alpha =
        Math.sin(phase * Math.PI) * 0.48 * Math.min(1.4, audioSparkle);

      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2, radius), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = (1.5 + (1 - phase) * 2.2) * physics.scaleMultiplier;
      ctx.stroke();
    }
  }

  private renderCelestialOrbital(env: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    elapsed: number;
    physics: PhysicsSimulationConfig;
    accentRgb: readonly [number, number, number];
    audioSparkle: number;
    pointer: { x: number; y: number };
  }): void {
    const { ctx, width, height, elapsed, physics, accentRgb, pointer, audioSparkle } =
      env;

    const r = Math.round(accentRgb[0] * 255);
    const g = Math.round(accentRgb[1] * 255);
    const b = Math.round(accentRgb[2] * 255);

    const cx = width * (0.5 + (pointer.x - 0.5) * 0.14);
    const cy = height * (0.42 + (pointer.y - 0.5) * 0.14);
    const span = Math.min(width, height) * physics.scaleMultiplier;

    // Subtle astrolabe celestial rings
    for (let ring = 1; ring <= 4; ring++) {
      const rx = span * 0.14 * ring;
      const ry = rx * 0.62;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(elapsed * 0.03 * (ring % 2 === 0 ? 1 : -1));
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.14)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    const screenPts: { x: number; y: number }[] = [];

    for (const star of this.orbitals) {
      const ang =
        star.angle + elapsed * star.angularSpeed * physics.speedMultiplier;
      const rx = star.orbitRadius * span;
      const ry = rx * star.eccentricity;

      const cosT = Math.cos(star.tilt);
      const sinT = Math.sin(star.tilt);
      const ox = Math.cos(ang) * rx;
      const oy = Math.sin(ang) * ry;

      const sx = cx + ox * cosT - oy * sinT;
      const sy = cy + ox * sinT + oy * cosT;

      const twinkle =
        0.45 + 0.55 * Math.sin(elapsed * 2.4 + star.twinklePhase);
      const alpha = Math.min(0.95, twinkle * 0.85 * audioSparkle);

      ctx.beginPath();
      ctx.arc(
        sx,
        sy,
        star.size * physics.scaleMultiplier * (0.7 + twinkle * 0.5),
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(${Math.min(255, r + 45)}, ${Math.min(255, g + 45)}, ${Math.min(255, b + 45)}, ${alpha.toFixed(3)})`;
      ctx.fill();

      if (screenPts.length < 36) {
        screenPts.push({ x: sx, y: sy });
      }
    }

    // Connect nearby stars into subtle constellation filaments
    const maxLinkDist = 90 * physics.cohesion;
    if (maxLinkDist > 20) {
      ctx.lineWidth = 0.75;
      for (let i = 0; i < screenPts.length; i++) {
        for (let j = i + 1; j < screenPts.length; j++) {
          const d = Math.hypot(
            screenPts[i].x - screenPts[j].x,
            screenPts[i].y - screenPts[j].y
          );
          if (d < maxLinkDist) {
            const linkAlpha = (1 - d / maxLinkDist) * 0.24;
            ctx.beginPath();
            ctx.moveTo(screenPts[i].x, screenPts[i].y);
            ctx.lineTo(screenPts[j].x, screenPts[j].y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${linkAlpha.toFixed(3)})`;
            ctx.stroke();
          }
        }
      }
    }
  }

  private renderShockwavePulse(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number,
    accentRgb: readonly [number, number, number],
    pointer: { x: number; y: number }
  ): void {
    const cx = width * (0.5 + (pointer.x - 0.5) * 0.25);
    const cy = height * (0.45 + (pointer.y - 0.5) * 0.25);
    const maxR = Math.hypot(width, height) * 0.85;
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const radius = Math.max(8, easeOut * maxR);
    const alpha = Math.pow(1 - progress, 1.6) * 0.85;

    const r = Math.round(accentRgb[0] * 255);
    const g = Math.round(accentRgb[1] * 255);
    const b = Math.round(accentRgb[2] * 255);

    ctx.save();
    const grad = ctx.createRadialGradient(
      cx,
      cy,
      Math.max(1, radius * 0.65),
      cx,
      cy,
      radius * 1.08
    );
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    grad.addColorStop(
      0.8,
      `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)}, ${(alpha * 0.55).toFixed(3)})`
    );
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 248, 225, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 2.5 + (1 - progress) * 5;
    ctx.stroke();
    ctx.restore();
  }
}
