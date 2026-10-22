import { ChapterVisualMotif } from './storybookLogic';

export interface ChapterAnimationRenderParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  elapsed: number;
  motif: ChapterVisualMotif;
  alpha: number;
  surge: number;
  windIntensity: number;
  lightBloom: number;
  pointer: { x: number; y: number };
}

/**
 * Renders a recursive botanical tree that organically grows/sways for Eden & Forest chapters.
 */
function drawBotanicalTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  angle: number,
  depth: number,
  growth: number,
  time: number,
  trunkColor: string,
  leafColor: string,
  fruitColor?: string
) {
  if (depth <= 0 || growth <= 0.01) return;

  const currentGrowth = Math.min(1, growth * 1.25);
  const sway =
    Math.sin(time * 0.85 + depth * 0.7 + x * 0.01) * 0.032 * (6 - depth);
  const finalAngle = angle + sway;

  const endX = x + Math.cos(finalAngle) * length * currentGrowth;
  const endY = y + Math.sin(finalAngle) * length * currentGrowth;
  const ctrlX =
    (x + endX) * 0.5 + Math.sin(finalAngle) * length * 0.12 * (depth % 2 === 0 ? 1 : -1);
  const ctrlY = (y + endY) * 0.5 - Math.cos(finalAngle) * length * 0.08;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
  ctx.strokeStyle = trunkColor;
  ctx.lineWidth = Math.max(1.1, Math.pow(depth, 1.35) * 1.25);
  ctx.lineCap = 'round';
  ctx.stroke();

  if (depth <= 3 && currentGrowth > 0.55) {
    const leafAlpha = Math.min(1, (currentGrowth - 0.55) * 2.2);
    const canopyRadius = 14 + (4 - depth) * 10;
    ctx.save();
    ctx.globalAlpha *= leafAlpha * 0.42;
    const grad = ctx.createRadialGradient(
      endX,
      endY,
      2,
      endX,
      endY,
      canopyRadius
    );
    grad.addColorStop(0, leafColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(endX, endY, canopyRadius, 0, Math.PI * 2);
    ctx.fill();

    if (fruitColor && depth === 1 && Math.sin(x * 13.7 + y * 7.3) > 0.25) {
      ctx.globalAlpha = Math.min(1, ctx.globalAlpha * 2.1);
      ctx.fillStyle = fruitColor;
      ctx.beginPath();
      ctx.arc(
        endX + Math.sin(time * 1.5 + x) * 2,
        endY + 4,
        3.2 + Math.sin(time * 2.2) * 0.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  if (currentGrowth > 0.32) {
    const nextGrowth = (growth - 0.15) / 0.85;
    drawBotanicalTree(
      ctx,
      endX,
      endY,
      length * 0.75,
      finalAngle - 0.38,
      depth - 1,
      nextGrowth,
      time,
      trunkColor,
      leafColor,
      fruitColor
    );
    drawBotanicalTree(
      ctx,
      endX,
      endY,
      length * 0.75,
      finalAngle + 0.35,
      depth - 1,
      nextGrowth,
      time,
      trunkColor,
      leafColor,
      fruitColor
    );
  }
}

/**
 * Draws a 5-lobed botanical fig leaf centered at (0,0)
 */
function drawFigLeafShape(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.moveTo(0, size * 0.55);
  // Left bottom lobe
  ctx.bezierCurveTo(-size * 0.65, size * 0.45, -size * 0.85, size * 0.05, -size * 0.35, -size * 0.05);
  // Left upper lobe
  ctx.bezierCurveTo(-size * 0.95, -size * 0.25, -size * 0.75, -size * 0.75, -size * 0.22, -size * 0.52);
  // Center top lobe
  ctx.bezierCurveTo(-size * 0.28, -size * 1.05, size * 0.28, -size * 1.05, size * 0.22, -size * 0.52);
  // Right upper lobe
  ctx.bezierCurveTo(size * 0.75, -size * 0.75, size * 0.95, -size * 0.25, size * 0.35, -size * 0.05);
  // Right bottom lobe
  ctx.bezierCurveTo(size * 0.85, size * 0.05, size * 0.65, size * 0.45, 0, size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Central leaf veins
  ctx.beginPath();
  ctx.moveTo(0, size * 0.65);
  ctx.lineTo(0, -size * 0.75);
  ctx.moveTo(0, -size * 0.1);
  ctx.lineTo(-size * 0.48, -size * 0.42);
  ctx.moveTo(0, -size * 0.1);
  ctx.lineTo(size * 0.48, -size * 0.42);
  ctx.stroke();
}

/**
 * Renders the bespoke chapter-specific narrative animation for the given motif.
 */
export function renderChapterAnimationOverlay({
  ctx,
  width,
  height,
  elapsed,
  motif,
  alpha,
  surge,
  windIntensity,
  lightBloom,
}: ChapterAnimationRenderParams): void {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  const cx = width * 0.5;
  const cy = height * 0.5;
  const t = elapsed;

  switch (motif) {
    // =========================================================================
    // EPISODE 1: BEFORE THE BEGINNING (12 DISTINCT CHAPTER SCENES)
    // =========================================================================
    case 'e1-ch1-abyssal-resonance': {
      // Slow concentric seashell/heartbeat acoustic resonance rings over the dark primordial water
      const horizonY = height * 0.56;
      for (let i = 0; i < 6; i++) {
        const phase = ((t * 0.22 + i / 6) % 1);
        const rx = phase * width * 0.46;
        const ry = phase * height * 0.15;
        const ringAlpha = (1 - phase) * Math.sin(phase * Math.PI) * (0.38 + surge * 0.25);
        ctx.strokeStyle = `rgba(148, 163, 218, ${ringAlpha})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(cx, horizonY + phase * height * 0.14, rx, Math.max(4, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case 'e1-ch2-bereshit-arch': {
      // Sacred open house of the Hebrew letter Bet (ב) traced in golden-violet starlight filaments
      const archW = Math.min(width * 0.36, 340);
      const archH = Math.min(height * 0.28, 220);
      const topY = height * 0.20;
      ctx.strokeStyle = `rgba(212, 168, 83, ${0.32 + Math.sin(t * 1.2) * 0.08 + surge * 0.2})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      // Top roof, right wall, and extended base open toward the left (forward in Hebrew)
      ctx.moveTo(cx - archW * 0.42, topY);
      ctx.quadraticCurveTo(cx + archW * 0.45, topY - 12, cx + archW * 0.45, topY + archH * 0.35);
      ctx.lineTo(cx + archW * 0.45, topY + archH);
      ctx.moveTo(cx - archW * 0.52, topY + archH);
      ctx.lineTo(cx + archW * 0.54, topY + archH);
      ctx.stroke();

      // Shimmering constellation nodes along the Bet arch
      const nodes = [
        [cx - archW * 0.42, topY],
        [cx + archW * 0.38, topY + 6],
        [cx + archW * 0.45, topY + archH * 0.5],
        [cx + archW * 0.45, topY + archH],
        [cx - archW * 0.52, topY + archH],
      ];
      for (let i = 0; i < nodes.length; i++) {
        const [nx, ny] = nodes[i];
        const r = 3 + Math.sin(t * 2 + i) * 1.2;
        ctx.fillStyle = 'rgba(245, 215, 142, 0.65)';
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'e1-ch3-tohu-vortex': {
      // Untamed Tohu va-Vohu deep swells and yearning mist tendrils rising from the abyss
      const baseH = height * 0.64;
      for (let i = 0; i < 5; i++) {
        const waveY = baseH + i * 26;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 24) {
          const y =
            waveY +
            Math.sin(x * 0.008 + t * (1.4 + i * 0.15) + i) * (18 + windIntensity * 14) +
            Math.cos(x * 0.019 - t * 1.1) * 9;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(165, 196, 230, ${0.22 - i * 0.03 + surge * 0.15})`;
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }
      // Rising yearning vapor spirals on left and right
      for (let s = 0; s < 4; s++) {
        const sx = width * (0.18 + s * 0.21);
        ctx.beginPath();
        for (let hStep = 0; hStep < 140; hStep += 10) {
          const px = sx + Math.sin(t * 1.5 + hStep * 0.05 + s) * (16 + hStep * 0.12);
          const py = baseH - hStep * 1.8;
          if (hStep === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(184, 168, 232, 0.18)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      break;
    }

    case 'e1-ch4-hovering-ruach': {
      // Maternal hovering wings of wind/Spirit (Ruach Elohim) fluttering above the face of the waters
      const hoverY = height * 0.42 + Math.sin(t * 1.6) * 10;
      for (let wIdx = 0; wIdx < 5; wIdx++) {
        const span = Math.min(width * 0.42, 460) * (1 - wIdx * 0.12);
        const flap = Math.sin(t * 2.1 - wIdx * 0.4) * 28;
        ctx.beginPath();
        ctx.moveTo(cx - span, hoverY + flap + wIdx * 10);
        ctx.quadraticCurveTo(cx - span * 0.4, hoverY - 38 - flap * 0.5, cx, hoverY + wIdx * 8);
        ctx.quadraticCurveTo(cx + span * 0.4, hoverY - 38 - flap * 0.5, cx + span, hoverY + flap + wIdx * 10);
        ctx.strokeStyle = `rgba(212, 230, 248, ${0.32 - wIdx * 0.05 + surge * 0.2})`;
        ctx.lineWidth = 2.4 - wIdx * 0.3;
        ctx.stroke();
      }
      break;
    }

    case 'e1-ch5-yehi-or-burst': {
      // Yehi Or: Volumetric golden dawn rays & expanding prism rings
      const sunY = height * 0.48;
      const rayCount = 14;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2 + t * 0.06;
        const len = Math.max(width, height) * (0.45 + 0.12 * Math.sin(t * 1.3 + i * 1.7));
        const grad = ctx.createLinearGradient(
          cx,
          sunY,
          cx + Math.cos(angle) * len,
          sunY + Math.sin(angle) * len
        );
        grad.addColorStop(0, `rgba(255, 224, 140, ${0.26 + lightBloom * 0.15 + surge * 0.2})`);
        grad.addColorStop(1, 'rgba(255, 224, 140, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 14 + (i % 3) * 8;
        ctx.beginPath();
        ctx.moveTo(cx, sunY);
        ctx.lineTo(cx + Math.cos(angle) * len, sunY + Math.sin(angle) * len);
        ctx.stroke();
      }
      break;
    }

    case 'e1-ch6-sky-and-shoals': {
      // Upper sky: Soaring birds under the parted vault. Lower sea: Swimming bioluminescent fish shoals
      const birdCount = 7;
      for (let b = 0; b < birdCount; b++) {
        const bx = ((t * (28 + b * 4) + b * 180) % (width + 120)) - 60;
        const by = height * (0.16 + (b % 3) * 0.05) + Math.sin(t * 1.8 + b) * 10;
        const wingY = Math.sin(t * 5.2 + b * 1.1) * 7;
        ctx.strokeStyle = 'rgba(240, 248, 255, 0.48)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(bx - 12, by + wingY);
        ctx.quadraticCurveTo(bx - 5, by - 4, bx, by);
        ctx.quadraticCurveTo(bx + 5, by - 4, bx + 12, by + wingY);
        ctx.stroke();
      }
      // Lower sea: Golden-turquoise living shoals
      const shoalCount = 10;
      for (let f = 0; f < shoalCount; f++) {
        const fx = width - (((t * (38 + f * 3) + f * 140) % (width + 100)) - 50);
        const fy = height * (0.68 + (f % 4) * 0.06) + Math.sin(t * 2.4 + f * 0.9) * 12;
        const tailWiggle = Math.sin(t * 7.5 + f) * 4;
        ctx.fillStyle = f % 2 === 0 ? 'rgba(212, 168, 83, 0.52)' : 'rgba(94, 234, 212, 0.46)';
        ctx.beginPath();
        ctx.ellipse(fx, fy, 9, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(fx + 8, fy);
        ctx.lineTo(fx + 15, fy - 4 + tailWiggle);
        ctx.lineTo(fx + 15, fy + 4 + tailWiggle);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'e1-ch7-imago-dei-grove': {
      // Ancient forest flanking trees + twin crowned reflections at the water's edge
      const groundY = height * 0.78;
      drawBotanicalTree(
        ctx,
        width * 0.15,
        groundY,
        height * 0.16,
        -Math.PI / 2 + 0.1,
        4,
        1.0,
        t,
        'rgba(62, 96, 74, 0.55)',
        'rgba(122, 196, 142, 0.26)'
      );
      drawBotanicalTree(
        ctx,
        width * 0.85,
        groundY,
        height * 0.16,
        -Math.PI / 2 - 0.1,
        4,
        1.0,
        t,
        'rgba(62, 96, 74, 0.55)',
        'rgba(122, 196, 142, 0.26)'
      );
      // Twin luminous human halos & reflections (Imago Dei)
      const pairs = [width * 0.26, width * 0.74];
      for (const px of pairs) {
        ctx.strokeStyle = 'rgba(245, 208, 122, 0.45)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(px, groundY - 48, 12 + Math.sin(t * 2) * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case 'e1-ch8-sacred-dust-breath': {
      // Spiraling double-helix stream of golden dust and divine breath rising from terracotta earth
      const particleCount = 34;
      for (let i = 0; i < particleCount; i++) {
        const p = (i / particleCount + t * 0.08) % 1;
        const y = height * 0.88 - p * height * 0.68;
        const strand = i % 2 === 0 ? 1 : -1;
        const radius = (1 - p * 0.5) * Math.min(width * 0.28, 220);
        const x = cx + Math.sin(p * 8.0 - t * 1.8) * radius * strand;
        const size = 2.2 + (1 - p) * 2.5;
        ctx.fillStyle =
          i % 3 === 0 ? 'rgba(250, 214, 130, 0.68)' : 'rgba(226, 149, 104, 0.52)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'e1-ch9-sabbath-sanctuary': {
      // Seven golden sanctuary arches ("a palace in time") reflected in still Sabbath waters
      const horizonY = height * 0.62;
      const archCount = 7;
      const totalSpan = Math.min(width * 0.76, 860);
      const archSpacing = totalSpan / archCount;
      const startX = cx - totalSpan * 0.5 + archSpacing * 0.5;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.05); // 60 BPM gentle pulse

      for (let i = 0; i < archCount; i++) {
        const ax = startX + i * archSpacing;
        const centerBoost = 1 - Math.abs(i - 3) * 0.12;
        const archH = height * 0.22 * centerBoost;
        const archW = archSpacing * 0.36;

        ctx.strokeStyle = `rgba(235, 195, 115, ${(0.28 + pulse * 0.14) * centerBoost})`;
        ctx.lineWidth = 1.6;
        // Upper sanctuary arch
        ctx.beginPath();
        ctx.moveTo(ax - archW, horizonY);
        ctx.lineTo(ax - archW, horizonY - archH * 0.6);
        ctx.quadraticCurveTo(ax, horizonY - archH, ax + archW, horizonY - archH * 0.6);
        ctx.lineTo(ax + archW, horizonY);
        ctx.stroke();

        // Mirror reflection in the still lake
        ctx.strokeStyle = `rgba(235, 195, 115, ${0.12 * centerBoost})`;
        ctx.beginPath();
        ctx.moveTo(ax - archW, horizonY);
        ctx.quadraticCurveTo(ax, horizonY + archH * 0.55, ax + archW, horizonY);
        ctx.stroke();
      }
      break;
    }

    case 'e1-ch10-symphony-nebula': {
      // Harmonic cosmic strings vibrating across the starlit sky
      for (let s = 0; s < 5; s++) {
        const baseY = height * (0.24 + s * 0.08);
        ctx.beginPath();
        for (let x = 0; x <= width; x += 28) {
          const env = Math.sin((x / width) * Math.PI);
          const y = baseY + Math.sin(x * 0.012 - t * (1.6 + s * 0.2) + s) * 22 * env;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle =
          s % 2 === 0
            ? `rgba(212, 168, 83, ${0.28 + surge * 0.2})`
            : `rgba(184, 168, 232, ${0.24 + surge * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      break;
    }

    case 'e1-ch11-dawn-over-depths': {
      // Descending golden halo hovering closely over dark churning waves
      const haloY = height * 0.44 + Math.sin(t * 1.2) * 8;
      const grad = ctx.createRadialGradient(cx, haloY, 8, cx, haloY, Math.min(width, height) * 0.32);
      grad.addColorStop(0, 'rgba(255, 215, 128, 0.35)');
      grad.addColorStop(0.5, 'rgba(212, 168, 83, 0.14)');
      grad.addColorStop(1, 'rgba(212, 168, 83, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, haloY, Math.min(width, height) * 0.32, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'e1-ch12-forest-of-grace':
    case 'hero-sanctuary': {
      // Lantern walk through the forests of Scripture
      const groundY = height * 0.84;
      drawBotanicalTree(
        ctx,
        width * 0.12,
        groundY,
        height * 0.17,
        -Math.PI / 2 + 0.08,
        4,
        1.0,
        t,
        'rgba(48, 82, 64, 0.5)',
        'rgba(168, 213, 162, 0.22)'
      );
      drawBotanicalTree(
        ctx,
        width * 0.88,
        groundY,
        height * 0.17,
        -Math.PI / 2 - 0.08,
        4,
        1.0,
        t,
        'rgba(48, 82, 64, 0.5)',
        'rgba(168, 213, 162, 0.22)'
      );
      for (let l = 0; l < 7; l++) {
        const depth = l / 6;
        const lx = cx + Math.sin(depth * 3.5 + t * 0.5) * (width * 0.18 * (1 - depth * 0.6));
        const ly = height * 0.82 - depth * height * 0.34 + Math.sin(t * 1.8 + l) * 5;
        const lr = (1 - depth * 0.55) * 6;
        ctx.fillStyle = 'rgba(250, 214, 130, 0.62)';
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // =========================================================================
    // EPISODE 2: THE GARDEN AND THE VOICE (9 DISTINCT CHAPTER CONSTRUCTIONS)
    // =========================================================================
    case 'e2-ch1-construct-eden': {
      // CONSTRUCTING EDEN: Full lush 5-tier botanical trees on both banks + 4 organic glowing rivers framing the sanctuary
      const growthProgress = Math.min(1, 0.94 + Math.sin(t * 0.9) * 0.06 + surge * 0.1);
      const groundY = height * 0.82;

      // Four Rivers of Eden flowing in organic S-curves along the left and right valley flanks
      const horizonY = height * 0.48;
      const riverSpreads = [-0.42, -0.27, 0.27, 0.42];
      for (let r = 0; r < riverSpreads.length; r++) {
        const spread = riverSpreads[r];
        const startX = cx + width * (spread * 0.45);
        ctx.beginPath();
        ctx.moveTo(startX, horizonY);
        ctx.bezierCurveTo(
          cx + width * (spread * 0.65) + Math.sin(t * 1.2 + r) * 16,
          horizonY + height * 0.16,
          cx + width * (spread * 0.85) - Math.cos(t * 1.1 + r) * 18,
          horizonY + height * 0.34,
          cx + width * spread,
          height
        );
        ctx.strokeStyle = `rgba(110, 231, 183, ${0.22 + Math.sin(t * 1.8 + r) * 0.06})`;
        ctx.lineWidth = 4.5;
        ctx.stroke();
      }

      // Constructing left and right Eden groves with full canopies & golden fruit
      drawBotanicalTree(
        ctx,
        width * 0.14,
        groundY,
        height * 0.16,
        -Math.PI / 2 + 0.10,
        5,
        growthProgress,
        t,
        'rgba(92, 138, 102, 0.62)',
        'rgba(110, 231, 183, 0.32)',
        'rgba(250, 204, 21, 0.82)'
      );
      drawBotanicalTree(
        ctx,
        width * 0.86,
        groundY,
        height * 0.16,
        -Math.PI / 2 - 0.10,
        5,
        growthProgress,
        t,
        'rgba(92, 138, 102, 0.62)',
        'rgba(110, 231, 183, 0.32)',
        'rgba(250, 204, 21, 0.82)'
      );
      break;
    }

    case 'e2-ch2-two-trees': {
      // THE TWO TREES: Tree of Life (left, golden-white) & Tree of Knowledge (right, crimson-amber + boundary ring)
      const groundY = height * 0.80;
      const leftTreeX = width * 0.16;
      const rightTreeX = width * 0.84;

      // Tree 1: The Tree of Life (radiant gold)
      drawBotanicalTree(
        ctx,
        leftTreeX,
        groundY,
        height * 0.19,
        -Math.PI / 2 + 0.06,
        5,
        1.0,
        t,
        'rgba(212, 168, 83, 0.65)',
        'rgba(253, 230, 138, 0.35)',
        'rgba(255, 251, 235, 0.85)'
      );

      // Tree 2: The Tree of Knowledge of Good & Evil (with glowing ruby fruit + First Boundary circle)
      drawBotanicalTree(
        ctx,
        rightTreeX,
        groundY,
        height * 0.18,
        -Math.PI / 2 - 0.06,
        5,
        1.0,
        t,
        'rgba(120, 90, 72, 0.68)',
        'rgba(74, 128, 96, 0.32)',
        'rgba(244, 63, 94, 0.88)'
      );

      // Pulsing golden boundary ring around the Tree of Knowledge
      const ringPulse = 1 + Math.sin(t * 2.2) * 0.08;
      ctx.strokeStyle = `rgba(244, 114, 114, ${0.42 + surge * 0.25})`;
      ctx.lineWidth = 2.0;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(rightTreeX, groundY, 74 * ringPulse, 18 * ringPulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }

    case 'e2-ch3-coiling-serpent': {
      // THE SERPENT (ARUM): Sleek continuous scaled serpent slithering along an upper-right bough toward the glowing fruit
      const branchY = height * 0.25;
      const branchStartX = width * 0.98;
      const branchEndX = width * 0.70;

      // 1. Draw the gnarled tree bough extending from the right margin
      ctx.strokeStyle = 'rgba(36, 52, 40, 0.88)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(branchStartX, branchY - 14);
      ctx.bezierCurveTo(
        width * 0.88,
        branchY + 12,
        width * 0.79,
        branchY - 10,
        branchEndX,
        branchY + 6
      );
      ctx.stroke();

      // 2. Draw the hanging forbidden fruit at the tip of the bough (clear of central text)
      const fruitX = branchEndX + 4;
      const fruitY = branchY + 32 + Math.sin(t * 2.0) * 2.5;
      ctx.strokeStyle = 'rgba(134, 168, 120, 0.65)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(branchEndX + 4, branchY + 6);
      ctx.lineTo(fruitX, fruitY - 8);
      ctx.stroke();

      const fruitGlow = ctx.createRadialGradient(fruitX, fruitY, 2, fruitX, fruitY, 26);
      fruitGlow.addColorStop(0, 'rgba(251, 113, 133, 0.92)');
      fruitGlow.addColorStop(0.45, 'rgba(225, 29, 72, 0.42)');
      fruitGlow.addColorStop(1, 'rgba(225, 29, 72, 0)');
      ctx.fillStyle = fruitGlow;
      ctx.beginPath();
      ctx.arc(fruitX, fruitY, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(244, 63, 94, 0.92)';
      ctx.beginPath();
      ctx.arc(fruitX, fruitY, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Continuous, sleek, densely sampled 85-point Serpent body coiling sinuously along the bough
      const segments = 85;
      const pts: Array<{ x: number; y: number; r: number }> = [];
      for (let i = 0; i < segments; i++) {
        const u = i / (segments - 1); // 0 = head (near fruit), 1 = tail (right)
        const baseSegX = branchEndX + 28 + u * (branchStartX - branchEndX - 34);
        const undulate =
          Math.sin(t * 2.6 - u * 11.5) * (12 + (1 - u) * 6 + surge * 8);
        const segY = branchY + Math.sin(u * Math.PI * 2) * 6 + undulate;
        const segX = baseSegX + Math.cos(t * 1.4 + u * 8.0) * 3;
        const radius =
          i === 0
            ? 7.5
            : Math.max(1.8, Math.sin(Math.pow(1 - u * 0.88, 0.75) * Math.PI) * 7.2);
        pts.push({ x: segX, y: segY, r: radius });
      }

      // Draw continuous dark-emerald under-shadow spine
      ctx.beginPath();
      pts.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.strokeStyle = 'rgba(6, 78, 59, 0.92)';
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw overlapping iridescent emerald-and-gold scale segments from tail to head
      for (let i = segments - 1; i >= 1; i--) {
        const pt = pts[i];
        ctx.fillStyle =
          i % 6 === 0
            ? 'rgba(212, 168, 83, 0.85)'
            : i % 2 === 0
              ? 'rgba(16, 185, 129, 0.85)'
              : 'rgba(5, 150, 105, 0.90)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Sculpted Serpent head, glinting amber eye & flickering forked tongue
      const head = pts[0];
      const neck = pts[3];
      const headAngle = Math.atan2(head.y - neck.y, head.x - neck.x);

      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(headAngle);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
      ctx.strokeStyle = 'rgba(212, 168, 83, 0.75)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(2, -7, -7, -5);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-7, 5);
      ctx.quadraticCurveTo(2, 7, 10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glinting golden-amber serpent eye
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(2, -2.5, 2.0, 0, Math.PI * 2);
      ctx.fill();

      // Flickering crimson forked tongue
      if (Math.sin(t * 4.5) > -0.1) {
        const tongueLen = 11 + Math.sin(t * 14) * 2.5;
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.92)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(10 + tongueLen, 0);
        ctx.lineTo(10 + tongueLen + 4, -3.5);
        ctx.moveTo(10 + tongueLen, 0);
        ctx.lineTo(10 + tongueLen + 4, 3.5);
        ctx.stroke();
      }
      ctx.restore();

      // 5. Subtle "question" ripple waves radiating from the serpent toward the fruit
      for (let q = 0; q < 3; q++) {
        const qp = (t * 0.35 + q / 3) % 1;
        ctx.strokeStyle = `rgba(167, 243, 208, ${(1 - qp) * 0.22})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(head.x - 6, head.y, 16 + qp * 72, 0.6 * Math.PI, 1.4 * Math.PI);
        ctx.stroke();
      }
      break;
    }

    case 'e2-ch4-fig-leaves-fall': {
      // FIG LEAVES & EXPOSURE: Dimming fractured halo + 8 drifting veined fig leaves
      const leafCount = 8;
      for (let i = 0; i < leafCount; i++) {
        const p = (t * 0.075 + i / leafCount) % 1;
        const side = i % 2 === 0 ? 0.14 + (i * 0.025) : 0.86 - (i * 0.025);
        const lx = width * side + Math.sin(t * 1.1 + i * 2.1) * 34;
        const ly = -40 + p * (height + 80);
        const rot = Math.sin(t * 0.9 + i * 1.7) * 0.65 + p * 1.4;
        const leafAlpha = Math.sin(p * Math.PI) * 0.58;

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(rot);
        ctx.globalAlpha *= leafAlpha;
        ctx.fillStyle = 'rgba(74, 124, 89, 0.55)';
        ctx.strokeStyle = 'rgba(187, 224, 192, 0.65)';
        ctx.lineWidth = 1.3;
        drawFigLeafShape(ctx, 18 + (i % 3) * 4);
        ctx.restore();
      }
      break;
    }

    case 'e2-ch5-ayekah-footsteps': {
      // WHERE ARE YOU (AYEKAH): Sequential golden footsteps stepping across the misty garden floor
      const stepCount = 6;
      const activeStepFloat = (t * 0.85) % stepCount;
      for (let s = 0; s < stepCount; s++) {
        const stepAge = (activeStepFloat - s + stepCount) % stepCount;
        if (stepAge > 3.5) continue;
        const fade = Math.max(0, 1 - stepAge / 3.5);
        const sx = width * (0.22 + s * 0.11);
        const sy = height * (0.76 + (s % 2 === 0 ? -0.025 : 0.025));

        // Golden footprint glow
        ctx.fillStyle = `rgba(245, 208, 122, ${fade * 0.55})`;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 11, 5, -0.15, 0, Math.PI * 2);
        ctx.fill();

        // Expanding seeking ripple ("Where are you?")
        const rippleR = 14 + stepAge * 28;
        ctx.strokeStyle = `rgba(212, 168, 83, ${fade * 0.38})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(sx, sy, rippleR, rippleR * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case 'e2-ch6-promised-seed': {
      // A PROMISE IN THE RUINS: Receding serpent in thorns below + piercing ray & sprouting golden Seed (Zera)
      const groundY = height * 0.82;

      // Piercing vertical ray of promise
      const beamGrad = ctx.createLinearGradient(cx, 0, cx, groundY);
      beamGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
      beamGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.14)');
      beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0.34)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(cx - 24, 0);
      ctx.lineTo(cx + 24, 0);
      ctx.lineTo(cx + 68, groundY);
      ctx.lineTo(cx - 68, groundY);
      ctx.closePath();
      ctx.fill();

      // Sprouting golden Seed & shoot at the center base
      const shootH = 42 + Math.sin(t * 1.5) * 6 + surge * 18;
      ctx.strokeStyle = 'rgba(250, 214, 115, 0.85)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx, groundY);
      ctx.quadraticCurveTo(cx - 6, groundY - shootH * 0.5, cx, groundY - shootH);
      ctx.stroke();

      // Two glowing golden leaves on the promised shoot
      ctx.fillStyle = 'rgba(253, 224, 71, 0.78)';
      ctx.beginPath();
      ctx.ellipse(cx - 10, groundY - shootH * 0.7, 9, 4, -0.5, 0, Math.PI * 2);
      ctx.ellipse(cx + 10, groundY - shootH * 0.85, 9, 4, 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'e2-ch7-flaming-sword': {
      // CHERUBIM & THE WHIRLING FLAMING SWORD guarding the upper-left threshold of Eden (clear of nav buttons)
      const gateX = width * 0.14;
      const gateY = height * 0.32;

      // Radiant fire halo behind the Cherubim gate
      const fireHalo = ctx.createRadialGradient(gateX, gateY, 4, gateX, gateY, 85);
      fireHalo.addColorStop(0, 'rgba(251, 191, 36, 0.38)');
      fireHalo.addColorStop(0.5, 'rgba(234, 88, 12, 0.18)');
      fireHalo.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = fireHalo;
      ctx.beginPath();
      ctx.arc(gateX, gateY, 85, 0, Math.PI * 2);
      ctx.fill();

      // Sweeping luminous Cherubim wings
      for (let w = 0; w < 3; w++) {
        const wingSpread = 62 + w * 22;
        const flap = Math.sin(t * 1.8 - w * 0.3) * 9;
        ctx.strokeStyle = `rgba(253, 224, 71, ${0.36 - w * 0.08})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(gateX, gateY);
        ctx.quadraticCurveTo(gateX - wingSpread * 0.55, gateY - 64 + flap, gateX - wingSpread, gateY - 20 + flap);
        ctx.moveTo(gateX, gateY);
        ctx.quadraticCurveTo(gateX + wingSpread * 0.55, gateY - 64 + flap, gateX + wingSpread, gateY - 20 + flap);
        ctx.stroke();
      }

      // Revolving Flaming Sword
      ctx.save();
      ctx.translate(gateX, gateY);
      ctx.rotate(t * 1.25);
      const swordGrad = ctx.createLinearGradient(0, -64, 0, 64);
      swordGrad.addColorStop(0, 'rgba(254, 249, 195, 0.98)');
      swordGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.92)');
      swordGrad.addColorStop(1, 'rgba(220, 38, 38, 0.25)');
      ctx.strokeStyle = swordGrad;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(0, -64);
      ctx.lineTo(0, 48);
      ctx.moveTo(-16, 15);
      ctx.lineTo(16, 15);
      ctx.stroke();

      // Whirling fire arcs
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.48)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 1.35);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'e2-ch8-healing-river': {
      // THE RIVER OF LIFE & FLOATING HEALING LEAVES
      const horizonY = height * 0.46;
      ctx.beginPath();
      for (let y = horizonY; y <= height; y += 12) {
        const p = (y - horizonY) / (height - horizonY);
        const rx = cx + Math.sin(p * 4.5 - t * 1.2) * (width * 0.16 * p);
        if (y === horizonY) ctx.moveTo(rx, y);
        else ctx.lineTo(rx, y);
      }
      ctx.strokeStyle = 'rgba(110, 231, 183, 0.34)';
      ctx.lineWidth = 18;
      ctx.stroke();

      // Floating golden-green healing leaves drifting down the river
      for (let l = 0; l < 7; l++) {
        const p = (t * 0.12 + l / 7) % 1;
        const ly = horizonY + p * (height - horizonY);
        const lx = cx + Math.sin(p * 4.5 - t * 1.2) * (width * 0.16 * p) + (l % 2 === 0 ? -14 : 14);
        ctx.fillStyle = 'rgba(167, 243, 208, 0.72)';
        ctx.beginPath();
        ctx.ellipse(lx, ly, 7 + p * 5, 3 + p * 2, Math.sin(t + l), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'e2-ch9-east-of-eden-grace': {
      // Warm evening star and golden firefly trail east of Eden
      const starX = width * 0.78;
      const starY = height * 0.22;
      const starGlow = ctx.createRadialGradient(starX, starY, 2, starX, starY, 36);
      starGlow.addColorStop(0, 'rgba(254, 243, 199, 0.92)');
      starGlow.addColorStop(1, 'rgba(254, 243, 199, 0)');
      ctx.fillStyle = starGlow;
      ctx.beginPath();
      ctx.arc(starX, starY, 36, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // =========================================================================
    // EPISODE 3: THE DEEP UNBOUND (NOAH'S ARK, RECEDING WIND, DOVE & RAINBOW)
    // =========================================================================
    case 'e3-ch1-deluge-ark': {
      // Heavy diagonal rain streaks + floating timber Ark with warm lantern window on the swells
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.26)';
      ctx.lineWidth = 1.2;
      for (let r = 0; r < 38; r++) {
        const rx = ((r * 97 + t * 260) % (width + 100)) - 50;
        const ry = ((r * 73 + t * 520) % (height + 100)) - 50;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 14, ry + 32);
        ctx.stroke();
      }

      // Noah's Ark silhouette pitching gently on the upper-right horizon swell
      const arkX = width * 0.82;
      const arkY = height * 0.44 + Math.sin(t * 1.5) * 7;
      const pitch = Math.sin(t * 1.5 + 0.5) * 0.05;
      ctx.save();
      ctx.translate(arkX, arkY);
      ctx.rotate(pitch);
      ctx.fillStyle = 'rgba(30, 27, 24, 0.88)';
      ctx.strokeStyle = 'rgba(212, 168, 83, 0.45)';
      ctx.lineWidth = 1.5;
      // Hull
      ctx.beginPath();
      ctx.moveTo(-58, 0);
      ctx.lineTo(58, 0);
      ctx.lineTo(44, 18);
      ctx.lineTo(-44, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Cabin roof
      ctx.beginPath();
      ctx.rect(-40, -14, 80, 14);
      ctx.fill();
      ctx.stroke();
      // Warm sanctuary lantern glow inside the Ark window
      ctx.fillStyle = 'rgba(251, 191, 36, 0.92)';
      ctx.beginPath();
      ctx.arc(0, -7, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'e3-ch2-receding-wind-ark': {
      // Sweeping receding wind ribbons (Ruach) + emerging twin peaks of Ararat + Ark resting
      const horizonY = height * 0.54;
      // Twin peaks of Ararat on right horizon
      ctx.fillStyle = 'rgba(30, 41, 59, 0.78)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width * 0.70, horizonY);
      ctx.lineTo(width * 0.77, horizonY - 58);
      ctx.lineTo(width * 0.83, horizonY);
      ctx.lineTo(width * 0.87, horizonY - 38);
      ctx.lineTo(width * 0.92, horizonY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sweeping wind currents
      for (let w = 0; w < 4; w++) {
        const wy = height * (0.30 + w * 0.06);
        ctx.beginPath();
        for (let x = 0; x <= width; x += 30) {
          const y = wy + Math.sin(x * 0.007 - t * 2.2 + w) * 14;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(186, 230, 253, ${0.28 - w * 0.05})`;
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }
      break;
    }

    case 'e3-ch3-dove-olive-rainbow': {
      // THE COVENANT RAINBOW (Qeshet) + SCULPTED RETURNING WHITE DOVE WITH FRESH OLIVE LEAF IN UPPER-RIGHT SKY
      const rainbowR = Math.min(width, height) * 0.45;
      const rainbowColors = [
        'rgba(248, 113, 113, 0.12)',
        'rgba(251, 191, 36, 0.13)',
        'rgba(163, 230, 53, 0.12)',
        'rgba(56, 189, 248, 0.12)',
        'rgba(168, 85, 247, 0.11)',
      ];
      for (let c = 0; c < rainbowColors.length; c++) {
        ctx.strokeStyle = rainbowColors[c];
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.arc(cx, height * 0.64, rainbowR - c * 9, Math.PI * 1.14, Math.PI * 1.86);
        ctx.stroke();
      }

      // Sculpted White Dove gliding gracefully in the open upper-right sky (clear of chapter heading)
      const doveX = width * 0.80 + Math.sin(t * 0.7) * 26;
      const doveY = height * 0.27 + Math.cos(t * 1.1) * 12;
      const wingFlap = Math.sin(t * 4.5) * 14;

      ctx.save();
      ctx.translate(doveX, doveY);
      ctx.scale(-1, 1); // Face left toward the center sanctuary

      // Soft celestial glow around the returning dove
      const doveGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 38);
      doveGlow.addColorStop(0, 'rgba(255, 251, 235, 0.35)');
      doveGlow.addColorStop(1, 'rgba(255, 251, 235, 0)');
      ctx.fillStyle = doveGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.fill();

      // Sculpted Dove silhouette (tail, breast, arched head, and swept wings)
      ctx.fillStyle = 'rgba(248, 250, 252, 0.94)';
      ctx.beginPath();
      ctx.moveTo(-22, -4); // fanned tail tip
      ctx.quadraticCurveTo(-8, -3, 4, -6); // back
      ctx.quadraticCurveTo(14, -10, 18, -3); // head & breast
      ctx.quadraticCurveTo(10, 8, -4, 5); // belly
      ctx.lineTo(-20, 4); // lower tail
      ctx.closePath();
      ctx.fill();

      // Swept primary wing
      ctx.beginPath();
      ctx.moveTo(-2, -3);
      ctx.quadraticCurveTo(-14, -28 + wingFlap, 4, -32 + wingFlap);
      ctx.quadraticCurveTo(12, -16 + wingFlap * 0.5, 6, -3);
      ctx.closePath();
      ctx.fill();

      // Freshly plucked green olive twig & leaves in beak
      ctx.strokeStyle = '#4ADE80';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(18, -3);
      ctx.quadraticCurveTo(26, 0, 33, 6);
      ctx.stroke();

      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(25, -2, 5.5, 2.5, -0.45, 0, Math.PI * 2);
      ctx.ellipse(30, 3, 5.5, 2.5, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    // =========================================================================
    // EPISODE 4: STARS OVER THE TENT (ABRAHAM'S TENT, CAMPFIRE & CONSTELLATIONS)
    // =========================================================================
    case 'e4-ch1-pilgrim-tent-fire': {
      // Nomad tent silhouette on the desert ridge + flickering campfire & rising embers
      const groundY = height * 0.78;
      const tentX = width * 0.18;
      const fireX = width * 0.26;

      // Nomad Tent
      ctx.fillStyle = 'rgba(28, 22, 20, 0.88)';
      ctx.strokeStyle = 'rgba(212, 168, 83, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(tentX - 54, groundY);
      ctx.lineTo(tentX - 18, groundY - 38);
      ctx.lineTo(tentX + 22, groundY - 34);
      ctx.lineTo(tentX + 56, groundY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Flickering Campfire glow
      const fireGlow = ctx.createRadialGradient(fireX, groundY - 8, 2, fireX, groundY - 8, 48);
      fireGlow.addColorStop(0, 'rgba(251, 191, 36, 0.90)');
      fireGlow.addColorStop(0.5, 'rgba(234, 88, 12, 0.42)');
      fireGlow.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = fireGlow;
      ctx.beginPath();
      ctx.arc(fireX, groundY - 8, 48, 0, Math.PI * 2);
      ctx.fill();

      // Rising campfire sparks
      for (let e = 0; e < 12; e++) {
        const ep = (t * 0.25 + e / 12) % 1;
        const ex = fireX + Math.sin(t * 2 + e * 1.7) * (8 + ep * 24);
        const ey = groundY - 8 - ep * 150;
        ctx.fillStyle = `rgba(253, 186, 116, ${(1 - ep) * 0.85})`;
        ctx.beginPath();
        ctx.arc(ex, ey, 2.2 * (1 - ep * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'e4-ch2-counted-stars': {
      // Cathedral of Constellations connecting across the desert sky
      const constellations = [
        [
          [0.14, 0.22],
          [0.20, 0.16],
          [0.27, 0.20],
          [0.32, 0.13],
          [0.25, 0.29],
        ],
        [
          [0.68, 0.18],
          [0.75, 0.14],
          [0.82, 0.21],
          [0.78, 0.29],
          [0.86, 0.15],
        ],
      ];

      for (let c = 0; c < constellations.length; c++) {
        const pts = constellations[c];
        ctx.strokeStyle = `rgba(245, 208, 122, ${0.28 + Math.sin(t + c) * 0.08 + surge * 0.25})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        pts.forEach(([px, py], idx) => {
          const sx = width * px;
          const sy = height * py;
          if (idx === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.stroke();

        pts.forEach(([px, py], idx) => {
          const sx = width * px;
          const sy = height * py;
          const r = 3.2 + Math.sin(t * 2.5 + idx) * 1.2;
          ctx.fillStyle = 'rgba(254, 243, 199, 0.88)';
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      break;
    }
  }

  ctx.restore();
}
