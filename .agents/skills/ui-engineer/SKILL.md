---
name: "ui-engineer"
description: >
  Senior UI/UX Engineer & Anti-Slop Design System Skill (synthesizing
  anthropics/skills@frontend-design, Leonxlnx/taste-skill, and
  vercel-labs/web-interface-guidelines). Enforces editorial typography,
  zero-pill metadata discipline, single-elevation spatial hierarchy, and
  WCAG AA interactive ergonomics across Tales That Shaped Humanity (BIBLEVERSE).
---

# UI Engineer & Anti-Slop Architecture Skill

This skill governs all frontend architecture, visual hierarchy, typography, and interaction design in this repository. It synthesizes best practices from:
- **`anthropics/skills@frontend-design`** (Intentional aesthetic direction, domain-authentic atmosphere, typographic craft)
- **`Leonxlnx/taste-skill`** (Strict eradication of AI-generated template clichés, sparkle icons, SaaS icon-bubble grids, and pill soup)
- **`vercel-labs/agent-skills` (`web-design-guidelines`)** (WCAG AA contrast, keyboard accessibility, focus-visible rings, single-line controls, touch target geometry)

---

## 1. Anti-Slop Bans (Zero Tolerance)

1. **No Sparkle Icons (`PiSparkle`, `Sparkles`)**:
   - Never use sparkle icons to signify features, reflections, animations, or scenes. Use clean editorial typography or domain-accurate functional icons (`PiBookOpenText`, `PiNotePencil`, `PiWaveform`, `PiEye`).
2. **Zero Static Pill Enclosures**:
   - Never wrap static metadata (scripture references, chapter counts, completion percentages, Hebrew anchors, timestamps, or categories) in `rounded-full` pills or bordered chips.
   - Render all metadata as **clean, unboxed inline text** separated by middle dots (`·`) or em-dashes (`—`).
3. **No SaaS Icon-Bubble Feature Grids**:
   - Do not render 3-column rounded cards topped with circular colored icon badges (`w-11 h-11 rounded-full bg-accent/10`).
   - Use editorial architectural columns separated by hairline rules (`border-t` or `border-l border-[#FAF6EE]/10`) and numbered editorial indices (`01.`, `02.`, `03.`).
4. **No Thick Left Accent Borders (`border-l-2`, `border-l-4`)**:
   - Never style paragraphs, callouts, or blockquotes with a thick vertical left stripe.
   - Differentiate active or illuminated scripture passages using subtle surface luminance (`bg-[#D4A853]/[0.07]`) or all-around hairline borders (`border border-[#D4A853]/25 rounded-lg`).
5. **No Decorative Scroll Mice or Pulsing Telemetry Dots**:
   - Do not render fake mouse-wheel scroll graphics or pulsing status dots next to static text.

---

## 2. Typographic & Spatial Hierarchy

1. **2+1 Font System**:
   - **Editorial Display & Sacred Prose**: `Cormorant Garamond` (`font-serif-editorial`) for chapter titles, scripture narrative, Hebrew/Greek pull-quotes, and contemplative prompts.
   - **UI Controls & Navigation**: Clean human sans-serif (`font-sans-ui`) for toolbars, segmented controls, and form labels.
   - **Tabular Numerals**: `font-mono-tabular` (`tabular-nums`) for chapter indices, progress percentages, Strong's concordance numbers, and durations.
2. **Single-Elevation Surface Discipline**:
   - **Canvas Field (60%)**: Deep obsidian sanctuary (`#080B10` / `#0A0A0A`) allowing the real-time WebGL/Canvas 2D scene to breathe.
   - **Structural Surfaces (30%)**: Quiet translucent or matte slate (`bg-[#0B0E14]/90`) with a single `1px solid rgba(250, 246, 238, 0.08)` hairline border. Never nest bordered boxes inside bordered boxes.
   - **Sacred Gold Accent (10%)**: `#D4A853` reserved strictly for the primary focal anchor (Play/Pause narrator CTA, active tab indicator, and Gold Leaf manuscript highlights).

---

## 3. Web Interface Guidelines (Vercel Standard)

1. **Single-Line Controls**: All buttons, tabs, and navigation links must use `whitespace-nowrap shrink-0` so labels never wrap awkwardly across lines.
2. **Touch Targets & Focus Rings**: Interactive controls must maintain `>= 36px` desktop (`>= 44px` mobile) target height and visible `:focus-visible` outlines.
3. **Toolbar Consolidation**: Group secondary workspace/study controls into a unified, low-noise segmented strip rather than scattering 8+ separate bordered buttons across the header.
