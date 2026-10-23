import { BIBLE_EPISODES, ChapterVisualMotif, StoryChapter } from './stories';
import {
  ChapterVisualConfig,
  hexToRgbTuple,
  makeChapterConfigKey,
  ParagraphKeyframe,
  PhysicsSimulationConfig,
  ShaderUniformConfig,
} from '../types/visualConfig';

interface MotifVisualPreset {
  directorNotes: string;
  shader: Partial<ShaderUniformConfig>;
  physics: PhysicsSimulationConfig;
  paragraphKeyframes?: Record<number, ParagraphKeyframe>;
}

const MOTIF_PRESETS: Record<ChapterVisualMotif, MotifVisualPreset> = {
  'hero-sanctuary': {
    directorNotes:
      'Sanctuary threshold with golden crepuscular rays over still primordial waters.',
    shader: {
      godRayIntensity: 0.55,
      godRayAngle: 0.12,
      domainWarpStrength: 0.75,
      domainWarpSpeed: 0.28,
      waveDisplacement: 0.45,
      nebulaDensity: 0.35,
      bloomStrength: 0.5,
      vignetteIntensity: 0.55,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'curl-flow',
      particleCount: 110,
      speedMultiplier: 0.7,
      turbulence: 0.65,
      gravityVector: [0, -0.08],
      cohesion: 0.4,
      separation: 0.5,
      scaleMultiplier: 1.1,
      secondaryOverlay: 'radial-shockwave',
    },
  },

  // Episode 1: Before the Beginning (12 Chapters)
  'e1-ch1-abyssal-resonance': {
    directorNotes:
      'Deep oceanic stillness in near-total pitch darkness; bioluminescent acoustic waves pulse from the deep.',
    shader: {
      tintZenith: [0.01, 0.02, 0.05],
      tintHorizon: [0.08, 0.14, 0.26],
      tintAbyss: [0.01, 0.02, 0.06],
      godRayIntensity: 0.08,
      godRayAngle: 0.0,
      domainWarpStrength: 0.9,
      domainWarpSpeed: 0.18,
      waveDisplacement: 0.62,
      nebulaDensity: 0.15,
      bloomStrength: 0.25,
      vignetteIntensity: 0.78,
      grainIntensity: 0.05,
    },
    physics: {
      mode: 'radial-shockwave',
      particleCount: 95,
      speedMultiplier: 0.45,
      turbulence: 0.35,
      gravityVector: [0, -0.02],
      cohesion: 0.6,
      separation: 0.4,
      scaleMultiplier: 1.2,
      secondaryOverlay: 'curl-flow',
    },
    paragraphKeyframes: {
      0: {
        paragraphIndex: 0,
        cueLabel: 'The Dark of Waiting — Sub-Bass Seashell Hum',
        transitionDuration: 1.8,
        shaderOverrides: {
          godRayIntensity: 0.06,
          waveDisplacement: 0.65,
          bloomStrength: 0.22,
        },
      },
    },
  },

  'e1-ch2-bereshit-arch': {
    directorNotes:
      'Indigo cosmic architectural ribbons arch across the horizon like the open house of the Hebrew letter Bet.',
    shader: {
      godRayIntensity: 0.28,
      godRayAngle: -0.18,
      domainWarpStrength: 1.05,
      domainWarpSpeed: 0.24,
      waveDisplacement: 0.48,
      nebulaDensity: 0.48,
      bloomStrength: 0.38,
      vignetteIntensity: 0.65,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'verlet-ribbons',
      particleCount: 90,
      speedMultiplier: 0.65,
      turbulence: 0.55,
      gravityVector: [0, -0.04],
      cohesion: 0.7,
      separation: 0.35,
      scaleMultiplier: 1.15,
      secondaryOverlay: 'celestial-orbital',
    },
    paragraphKeyframes: {
      1: {
        paragraphIndex: 1,
        cueLabel: 'Haunting Line — Horizon Deepens',
        transitionDuration: 1.5,
        shaderOverrides: {
          godRayIntensity: 0.42,
          nebulaDensity: 0.65,
          bloomStrength: 0.52,
        },
      },
    },
  },

  'e1-ch3-tohu-vortex': {
    directorNotes:
      'Formless and void (Tohu Vavohu): high-turbulence divergence-free curl-noise vortex swirling in primordial yearning.',
    shader: {
      godRayIntensity: 0.14,
      godRayAngle: 0.25,
      domainWarpStrength: 1.65,
      domainWarpSpeed: 0.52,
      waveDisplacement: 0.55,
      nebulaDensity: 0.58,
      bloomStrength: 0.34,
      vignetteIntensity: 0.72,
      grainIntensity: 0.06,
    },
    physics: {
      mode: 'curl-flow',
      particleCount: 185,
      speedMultiplier: 1.15,
      turbulence: 1.55,
      gravityVector: [0, 0],
      cohesion: 0.82,
      separation: 0.3,
      scaleMultiplier: 1.05,
      secondaryOverlay: 'voronoi-fracture',
    },
  },

  'e1-ch4-hovering-ruach': {
    directorNotes:
      'Ruach Elohim hovering like a mother eagle over the face of the waters: Verlet wind filaments + gentle boid wing currents.',
    shader: {
      godRayIntensity: 0.36,
      godRayAngle: 0.08,
      domainWarpStrength: 1.15,
      domainWarpSpeed: 0.38,
      waveDisplacement: 0.72,
      nebulaDensity: 0.28,
      bloomStrength: 0.44,
      vignetteIntensity: 0.58,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'verlet-ribbons',
      particleCount: 130,
      speedMultiplier: 0.95,
      turbulence: 0.88,
      gravityVector: [0.12, -0.03],
      cohesion: 0.75,
      separation: 0.45,
      scaleMultiplier: 1.25,
      secondaryOverlay: 'boids-flock',
    },
    paragraphKeyframes: {
      1: {
        paragraphIndex: 1,
        cueLabel: 'Fluttering Eagle Wings Over the Deep',
        transitionDuration: 1.4,
        physicsOverrides: {
          speedMultiplier: 1.35,
          turbulence: 1.15,
        },
        shaderOverrides: {
          godRayIntensity: 0.52,
          waveDisplacement: 0.82,
        },
      },
    },
  },

  'e1-ch5-yehi-or-burst': {
    directorNotes:
      'Yehi Or ("Let there be light"): starts in suspended silence, then detonates a blinding golden volumetric shockwave and god-ray corona.',
    shader: {
      tintZenith: [0.22, 0.14, 0.04],
      tintHorizon: [0.95, 0.72, 0.28],
      tintAbyss: [0.09, 0.06, 0.03],
      accentColor: [1.0, 0.88, 0.48],
      godRayIntensity: 0.94,
      godRayAngle: 0.0,
      domainWarpStrength: 0.85,
      domainWarpSpeed: 0.45,
      waveDisplacement: 0.35,
      nebulaDensity: 0.42,
      bloomStrength: 0.92,
      vignetteIntensity: 0.42,
      grainIntensity: 0.03,
    },
    physics: {
      mode: 'radial-shockwave',
      particleCount: 210,
      speedMultiplier: 1.45,
      turbulence: 0.9,
      gravityVector: [0, -0.15],
      cohesion: 0.3,
      separation: 0.85,
      scaleMultiplier: 1.45,
      secondaryOverlay: 'curl-flow',
    },
    paragraphKeyframes: {
      0: {
        paragraphIndex: 0,
        cueLabel: 'Yehi Or — Blinding Radial Dawn Shockwave',
        transitionDuration: 0.9,
        triggerShockwave: true,
        shaderOverrides: {
          godRayIntensity: 0.98,
          bloomStrength: 0.95,
        },
      },
      1: {
        paragraphIndex: 1,
        cueLabel: 'Golden Crepuscular Rays Expand Across the Waters',
        transitionDuration: 1.6,
        triggerShockwave: true,
        shaderOverrides: {
          godRayIntensity: 1.0,
          domainWarpStrength: 1.1,
        },
      },
    },
  },

  'e1-ch6-sky-and-shoals': {
    directorNotes:
      'Parting of the firmament above and teeming shoals below: high Gerstner wave displacement paired with autonomous Craig Reynolds Boid flocks.',
    shader: {
      godRayIntensity: 0.62,
      godRayAngle: -0.15,
      domainWarpStrength: 0.92,
      domainWarpSpeed: 0.36,
      waveDisplacement: 0.88,
      nebulaDensity: 0.32,
      bloomStrength: 0.55,
      vignetteIntensity: 0.48,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'boids-flock',
      particleCount: 160,
      speedMultiplier: 1.2,
      turbulence: 0.65,
      gravityVector: [0.05, 0.0],
      cohesion: 0.72,
      separation: 0.58,
      scaleMultiplier: 1.15,
      secondaryOverlay: 'curl-flow',
    },
  },

  'e1-ch7-imago-dei-grove': {
    directorNotes:
      'Ancient emerald grove and sacred dry land: recursive wind-swaying L-system botanical trees with bioluminescent pollen.',
    shader: {
      godRayIntensity: 0.68,
      godRayAngle: 0.22,
      domainWarpStrength: 0.72,
      domainWarpSpeed: 0.22,
      waveDisplacement: 0.24,
      nebulaDensity: 0.25,
      bloomStrength: 0.58,
      vignetteIntensity: 0.52,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'lsystem-flora',
      particleCount: 140,
      speedMultiplier: 0.75,
      turbulence: 0.55,
      gravityVector: [0, -0.12],
      cohesion: 0.65,
      separation: 0.45,
      scaleMultiplier: 1.3,
      secondaryOverlay: 'curl-flow',
    },
  },

  'e1-ch8-sacred-dust-breath': {
    directorNotes:
      'Sacred dust of the ground (Adamah) lifted and braided into living breath: rising curl-noise amber dust + Verlet breath filaments.',
    shader: {
      godRayIntensity: 0.76,
      godRayAngle: -0.08,
      domainWarpStrength: 1.1,
      domainWarpSpeed: 0.34,
      waveDisplacement: 0.2,
      nebulaDensity: 0.45,
      bloomStrength: 0.72,
      vignetteIntensity: 0.5,
      grainIntensity: 0.05,
    },
    physics: {
      mode: 'curl-flow',
      particleCount: 195,
      speedMultiplier: 0.9,
      turbulence: 1.05,
      gravityVector: [0, -0.22],
      cohesion: 0.78,
      separation: 0.4,
      scaleMultiplier: 1.2,
      secondaryOverlay: 'verlet-ribbons',
    },
    paragraphKeyframes: {
      0: {
        paragraphIndex: 0,
        cueLabel: 'Breath of Life Enters the Dust',
        transitionDuration: 1.3,
        triggerShockwave: true,
        shaderOverrides: {
          bloomStrength: 0.84,
          godRayIntensity: 0.85,
        },
      },
    },
  },

  'e1-ch9-sabbath-sanctuary': {
    directorNotes:
      'Cathedral in time (Shabbat): serene golden-violet harmonic rings and slow-drifting sanctuary embers.',
    shader: {
      godRayIntensity: 0.72,
      godRayAngle: 0.0,
      domainWarpStrength: 0.58,
      domainWarpSpeed: 0.14,
      waveDisplacement: 0.18,
      nebulaDensity: 0.68,
      bloomStrength: 0.68,
      vignetteIntensity: 0.48,
      grainIntensity: 0.03,
    },
    physics: {
      mode: 'celestial-orbital',
      particleCount: 120,
      speedMultiplier: 0.42,
      turbulence: 0.28,
      gravityVector: [0, -0.05],
      cohesion: 0.85,
      separation: 0.5,
      scaleMultiplier: 1.25,
      secondaryOverlay: 'radial-shockwave',
    },
  },

  'e1-ch10-symphony-nebula': {
    directorNotes:
      'Cosmic symphony and deep-field stellar nebula: N-body celestial orbital clusters with aurora ribbons.',
    shader: {
      godRayIntensity: 0.54,
      godRayAngle: 0.3,
      domainWarpStrength: 1.35,
      domainWarpSpeed: 0.28,
      waveDisplacement: 0.25,
      nebulaDensity: 0.95,
      bloomStrength: 0.74,
      vignetteIntensity: 0.52,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'celestial-orbital',
      particleCount: 175,
      speedMultiplier: 0.65,
      turbulence: 0.6,
      gravityVector: [0, 0],
      cohesion: 0.8,
      separation: 0.45,
      scaleMultiplier: 1.2,
      secondaryOverlay: 'verlet-ribbons',
    },
  },

  'e1-ch11-dawn-over-depths': {
    directorNotes:
      'First sunrise mirrored across crystal primordial waters with crepuscular horizon rays and gliding water birds.',
    shader: {
      godRayIntensity: 0.88,
      godRayAngle: 0.05,
      domainWarpStrength: 0.8,
      domainWarpSpeed: 0.26,
      waveDisplacement: 0.76,
      nebulaDensity: 0.3,
      bloomStrength: 0.8,
      vignetteIntensity: 0.44,
      grainIntensity: 0.03,
    },
    physics: {
      mode: 'boids-flock',
      particleCount: 115,
      speedMultiplier: 0.85,
      turbulence: 0.45,
      gravityVector: [0.04, -0.02],
      cohesion: 0.75,
      separation: 0.55,
      scaleMultiplier: 1.15,
      secondaryOverlay: 'radial-shockwave',
    },
  },

  'e1-ch12-forest-of-grace': {
    directorNotes:
      'Lush canopy bathed in golden Sabbath mist: full L-system botanical forest with rising firefly curl-flow.',
    shader: {
      godRayIntensity: 0.82,
      godRayAngle: -0.18,
      domainWarpStrength: 0.68,
      domainWarpSpeed: 0.2,
      waveDisplacement: 0.22,
      nebulaDensity: 0.35,
      bloomStrength: 0.66,
      vignetteIntensity: 0.46,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'lsystem-flora',
      particleCount: 150,
      speedMultiplier: 0.6,
      turbulence: 0.48,
      gravityVector: [0, -0.1],
      cohesion: 0.7,
      separation: 0.5,
      scaleMultiplier: 1.35,
      secondaryOverlay: 'curl-flow',
    },
  },

  // Episode 2: The Garden and the Voice (9 Chapters)
  'e2-ch1-construct-eden': {
    directorNotes:
      'Four-river Edenic sanctuary garden springing from mist with L-system trees and luminous dew streams.',
    shader: {
      godRayIntensity: 0.74,
      godRayAngle: 0.14,
      domainWarpStrength: 0.88,
      domainWarpSpeed: 0.24,
      waveDisplacement: 0.42,
      nebulaDensity: 0.25,
      bloomStrength: 0.62,
      vignetteIntensity: 0.48,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'lsystem-flora',
      particleCount: 145,
      speedMultiplier: 0.7,
      turbulence: 0.52,
      gravityVector: [0, -0.08],
      cohesion: 0.68,
      separation: 0.48,
      scaleMultiplier: 1.3,
      secondaryOverlay: 'verlet-ribbons',
    },
  },

  'e2-ch2-two-trees': {
    directorNotes:
      'The Tree of Life and the Tree of Knowledge at the heart of the garden: dual L-system canopies with contrasting gold and crimson pollen.',
    shader: {
      godRayIntensity: 0.78,
      godRayAngle: 0.0,
      domainWarpStrength: 0.95,
      domainWarpSpeed: 0.26,
      waveDisplacement: 0.2,
      nebulaDensity: 0.38,
      bloomStrength: 0.68,
      vignetteIntensity: 0.54,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'lsystem-flora',
      particleCount: 165,
      speedMultiplier: 0.75,
      turbulence: 0.62,
      gravityVector: [0, -0.06],
      cohesion: 0.74,
      separation: 0.52,
      scaleMultiplier: 1.45,
      secondaryOverlay: 'curl-flow',
    },
  },

  'e2-ch3-coiling-serpent': {
    directorNotes:
      'The subtle whisper in the shadows: sinuous Verlet ribbons coiling through emerald-violet twilight and tense curl-noise eddies.',
    shader: {
      godRayIntensity: 0.26,
      godRayAngle: -0.32,
      domainWarpStrength: 1.48,
      domainWarpSpeed: 0.42,
      waveDisplacement: 0.3,
      nebulaDensity: 0.22,
      bloomStrength: 0.38,
      vignetteIntensity: 0.74,
      grainIntensity: 0.06,
    },
    physics: {
      mode: 'verlet-ribbons',
      particleCount: 125,
      speedMultiplier: 1.1,
      turbulence: 1.25,
      gravityVector: [0.05, 0.02],
      cohesion: 0.85,
      separation: 0.3,
      scaleMultiplier: 1.3,
      secondaryOverlay: 'curl-flow',
    },
  },

  'e2-ch4-fig-leaves-fall': {
    directorNotes:
      'The fracturing of innocence: Voronoi shards and falling autumn leaves drifting downward in cooling twilight.',
    shader: {
      godRayIntensity: 0.22,
      godRayAngle: 0.28,
      domainWarpStrength: 1.15,
      domainWarpSpeed: 0.32,
      waveDisplacement: 0.25,
      nebulaDensity: 0.18,
      bloomStrength: 0.3,
      vignetteIntensity: 0.76,
      grainIntensity: 0.06,
    },
    physics: {
      mode: 'voronoi-fracture',
      particleCount: 140,
      speedMultiplier: 0.85,
      turbulence: 0.95,
      gravityVector: [-0.08, 0.32],
      cohesion: 0.35,
      separation: 0.7,
      scaleMultiplier: 1.2,
      secondaryOverlay: 'curl-flow',
    },
    paragraphKeyframes: {
      0: {
        paragraphIndex: 0,
        cueLabel: 'Sudden Rupture — Eyes Opened in Fear',
        transitionDuration: 0.8,
        triggerShockwave: true,
      },
    },
  },

  'e2-ch5-ayekah-footsteps': {
    directorNotes:
      'Ayekah ("Where are you?"): acoustic footsteps and concentric calling ripples echoing through the cool evening breeze of the garden.',
    shader: {
      godRayIntensity: 0.48,
      godRayAngle: -0.12,
      domainWarpStrength: 0.82,
      domainWarpSpeed: 0.22,
      waveDisplacement: 0.38,
      nebulaDensity: 0.42,
      bloomStrength: 0.5,
      vignetteIntensity: 0.62,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'radial-shockwave',
      particleCount: 110,
      speedMultiplier: 0.6,
      turbulence: 0.5,
      gravityVector: [0, -0.03],
      cohesion: 0.7,
      separation: 0.5,
      scaleMultiplier: 1.25,
      secondaryOverlay: 'lsystem-flora',
    },
  },

  'e2-ch6-promised-seed': {
    directorNotes:
      'A thread of golden promise woven through the dark soil: luminous L-system shoots emerging from fractured earth.',
    shader: {
      godRayIntensity: 0.58,
      godRayAngle: 0.04,
      domainWarpStrength: 0.9,
      domainWarpSpeed: 0.25,
      waveDisplacement: 0.22,
      nebulaDensity: 0.45,
      bloomStrength: 0.6,
      vignetteIntensity: 0.58,
      grainIntensity: 0.05,
    },
    physics: {
      mode: 'lsystem-flora',
      particleCount: 135,
      speedMultiplier: 0.7,
      turbulence: 0.6,
      gravityVector: [0, -0.14],
      cohesion: 0.75,
      separation: 0.45,
      scaleMultiplier: 1.2,
      secondaryOverlay: 'voronoi-fracture',
    },
  },

  'e2-ch7-flaming-sword': {
    directorNotes:
      'Cherubim and the whirling flaming sword at the eastern gate: intense crimson-gold curl-noise ember thermals and Voronoi sparks.',
    shader: {
      tintZenith: [0.16, 0.04, 0.03],
      tintHorizon: [0.85, 0.34, 0.12],
      tintAbyss: [0.08, 0.02, 0.02],
      accentColor: [1.0, 0.55, 0.22],
      godRayIntensity: 0.84,
      godRayAngle: 0.18,
      domainWarpStrength: 1.72,
      domainWarpSpeed: 0.68,
      waveDisplacement: 0.28,
      nebulaDensity: 0.3,
      bloomStrength: 0.85,
      vignetteIntensity: 0.6,
      grainIntensity: 0.05,
    },
    physics: {
      mode: 'curl-flow',
      particleCount: 220,
      speedMultiplier: 1.55,
      turbulence: 1.65,
      gravityVector: [0.08, -0.38],
      cohesion: 0.45,
      separation: 0.65,
      scaleMultiplier: 1.3,
      secondaryOverlay: 'voronoi-fracture',
    },
  },

  'e2-ch8-healing-river': {
    directorNotes:
      'The river flowing out of Eden toward the dry lands: luminous Verlet water currents and Boid schools.',
    shader: {
      godRayIntensity: 0.64,
      godRayAngle: -0.1,
      domainWarpStrength: 0.95,
      domainWarpSpeed: 0.35,
      waveDisplacement: 0.74,
      nebulaDensity: 0.32,
      bloomStrength: 0.58,
      vignetteIntensity: 0.48,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'verlet-ribbons',
      particleCount: 140,
      speedMultiplier: 0.95,
      turbulence: 0.72,
      gravityVector: [0.18, 0.02],
      cohesion: 0.78,
      separation: 0.45,
      scaleMultiplier: 1.15,
      secondaryOverlay: 'boids-flock',
    },
  },

  'e2-ch9-east-of-eden-grace': {
    directorNotes:
      'Walking East of Eden clothed in mercy beneath a vast, star-strewn desert horizon.',
    shader: {
      godRayIntensity: 0.52,
      godRayAngle: 0.22,
      domainWarpStrength: 0.78,
      domainWarpSpeed: 0.2,
      waveDisplacement: 0.24,
      nebulaDensity: 0.75,
      bloomStrength: 0.56,
      vignetteIntensity: 0.52,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'celestial-orbital',
      particleCount: 135,
      speedMultiplier: 0.55,
      turbulence: 0.45,
      gravityVector: [0.06, -0.04],
      cohesion: 0.72,
      separation: 0.5,
      scaleMultiplier: 1.15,
      secondaryOverlay: 'curl-flow',
    },
  },

  // Episode 3: The Deep Unbound (3 Chapters)
  'e3-ch1-deluge-ark': {
    directorNotes:
      'Fountains of the great deep burst open and windows of heaven pour down: violent Gerstner storm swells and diagonal rain/debris physics.',
    shader: {
      tintZenith: [0.03, 0.05, 0.09],
      tintHorizon: [0.16, 0.26, 0.36],
      tintAbyss: [0.02, 0.04, 0.08],
      accentColor: [0.55, 0.78, 0.95],
      godRayIntensity: 0.22,
      godRayAngle: -0.38,
      domainWarpStrength: 1.85,
      domainWarpSpeed: 0.78,
      waveDisplacement: 0.98,
      nebulaDensity: 0.12,
      bloomStrength: 0.36,
      vignetteIntensity: 0.7,
      grainIntensity: 0.06,
    },
    physics: {
      mode: 'voronoi-fracture',
      particleCount: 240,
      speedMultiplier: 1.85,
      turbulence: 1.6,
      gravityVector: [-0.25, 0.65],
      cohesion: 0.25,
      separation: 0.75,
      scaleMultiplier: 1.15,
      secondaryOverlay: 'curl-flow',
    },
    paragraphKeyframes: {
      0: {
        paragraphIndex: 0,
        cueLabel: 'Fountains of the Great Deep Burst Open',
        transitionDuration: 1.0,
        triggerShockwave: true,
        shaderOverrides: {
          waveDisplacement: 1.0,
          domainWarpStrength: 1.95,
        },
      },
    },
  },

  'e3-ch2-receding-wind-ark': {
    directorNotes:
      'God remembered Noah and sent a wind over the earth: sweeping Verlet wind currents parting the dark storm clouds as waves subside.',
    shader: {
      godRayIntensity: 0.56,
      godRayAngle: 0.16,
      domainWarpStrength: 1.25,
      domainWarpSpeed: 0.44,
      waveDisplacement: 0.68,
      nebulaDensity: 0.34,
      bloomStrength: 0.54,
      vignetteIntensity: 0.52,
      grainIntensity: 0.04,
    },
    physics: {
      mode: 'verlet-ribbons',
      particleCount: 150,
      speedMultiplier: 1.15,
      turbulence: 0.95,
      gravityVector: [0.22, -0.04],
      cohesion: 0.7,
      separation: 0.5,
      scaleMultiplier: 1.2,
      secondaryOverlay: 'boids-flock',
    },
  },

  'e3-ch3-dove-olive-rainbow': {
    directorNotes:
      'The returning dove with a fresh olive leaf and the prismatic Covenant Bow in the clouds: Boid dove flock + L-system olive shoot + golden-emerald god-rays.',
    shader: {
      godRayIntensity: 0.9,
      godRayAngle: 0.08,
      domainWarpStrength: 0.76,
      domainWarpSpeed: 0.24,
      waveDisplacement: 0.36,
      nebulaDensity: 0.4,
      bloomStrength: 0.82,
      vignetteIntensity: 0.42,
      grainIntensity: 0.03,
    },
    physics: {
      mode: 'boids-flock',
      particleCount: 135,
      speedMultiplier: 0.9,
      turbulence: 0.5,
      gravityVector: [0.05, -0.05],
      cohesion: 0.82,
      separation: 0.55,
      scaleMultiplier: 1.35,
      secondaryOverlay: 'lsystem-flora',
    },
    paragraphKeyframes: {
      0: {
        paragraphIndex: 0,
        cueLabel: 'Covenant Bow Appears in the Clouds',
        transitionDuration: 1.5,
        triggerShockwave: true,
        shaderOverrides: {
          godRayIntensity: 0.95,
          bloomStrength: 0.88,
        },
      },
    },
  },

  // Episode 4: Stars Over the Tent (2 Chapters)
  'e4-ch1-pilgrim-tent-fire': {
    directorNotes:
      'Abram by the desert watchfire: warm rising ember curl-flow against a deep indigo nocturnal horizon.',
    shader: {
      godRayIntensity: 0.42,
      godRayAngle: 0.0,
      domainWarpStrength: 1.05,
      domainWarpSpeed: 0.32,
      waveDisplacement: 0.14,
      nebulaDensity: 0.72,
      bloomStrength: 0.64,
      vignetteIntensity: 0.58,
      grainIntensity: 0.05,
    },
    physics: {
      mode: 'curl-flow',
      particleCount: 175,
      speedMultiplier: 0.95,
      turbulence: 1.1,
      gravityVector: [0.04, -0.34],
      cohesion: 0.6,
      separation: 0.5,
      scaleMultiplier: 1.15,
      secondaryOverlay: 'celestial-orbital',
    },
  },

  'e4-ch2-counted-stars': {
    directorNotes:
      '"Look toward heaven and number the stars": high-density celestial orbital star clusters and luminous constellation arcs.',
    shader: {
      godRayIntensity: 0.62,
      godRayAngle: -0.06,
      domainWarpStrength: 0.92,
      domainWarpSpeed: 0.2,
      waveDisplacement: 0.12,
      nebulaDensity: 1.0,
      bloomStrength: 0.84,
      vignetteIntensity: 0.44,
      grainIntensity: 0.03,
    },
    physics: {
      mode: 'celestial-orbital',
      particleCount: 230,
      speedMultiplier: 0.55,
      turbulence: 0.4,
      gravityVector: [0, 0],
      cohesion: 0.88,
      separation: 0.45,
      scaleMultiplier: 1.3,
      secondaryOverlay: 'radial-shockwave',
    },
    paragraphKeyframes: {
      0: {
        paragraphIndex: 0,
        cueLabel: 'Canopy of Uncountable Stars Unfolds',
        transitionDuration: 1.6,
        triggerShockwave: true,
        shaderOverrides: {
          nebulaDensity: 1.0,
          bloomStrength: 0.9,
        },
      },
    },
  },
};

function buildConfigForChapter(
  episodeId: string,
  chapter: StoryChapter
): ChapterVisualConfig {
  const motif = chapter.animationConfig?.motif || 'hero-sanctuary';
  const preset = MOTIF_PRESETS[motif] || MOTIF_PRESETS['hero-sanctuary'];
  const anim = chapter.animationConfig;

  const baseZenith: [number, number, number] = anim?.tintTop
    ? [anim.tintTop[0], anim.tintTop[1], anim.tintTop[2]]
    : [0.03, 0.04, 0.09];
  const baseHorizon: [number, number, number] = anim?.tintHorizon
    ? [anim.tintHorizon[0], anim.tintHorizon[1], anim.tintHorizon[2]]
    : [0.22, 0.28, 0.42];
  const baseAbyss: [number, number, number] = anim?.tintGround
    ? [anim.tintGround[0], anim.tintGround[1], anim.tintGround[2]]
    : [0.02, 0.03, 0.06];
  const baseAccent = hexToRgbTuple(anim?.accentGlow || '#D4A853');

  const shader: ShaderUniformConfig = {
    tintZenith: preset.shader.tintZenith || baseZenith,
    tintHorizon: preset.shader.tintHorizon || baseHorizon,
    tintAbyss: preset.shader.tintAbyss || baseAbyss,
    accentColor: preset.shader.accentColor || baseAccent,
    godRayIntensity: preset.shader.godRayIntensity ?? 0.5,
    godRayAngle: preset.shader.godRayAngle ?? 0.0,
    domainWarpStrength: preset.shader.domainWarpStrength ?? 0.9,
    domainWarpSpeed: preset.shader.domainWarpSpeed ?? 0.3,
    waveDisplacement: preset.shader.waveDisplacement ?? 0.4,
    nebulaDensity: preset.shader.nebulaDensity ?? 0.4,
    bloomStrength: preset.shader.bloomStrength ?? 0.55,
    vignetteIntensity: preset.shader.vignetteIntensity ?? 0.55,
    grainIntensity: preset.shader.grainIntensity ?? 0.04,
  };

  return {
    id: makeChapterConfigKey(episodeId, chapter.number),
    episodeId,
    chapterNumber: chapter.number,
    title: chapter.title,
    directorNotes: preset.directorNotes || anim?.description || chapter.title,
    shader,
    physics: { ...preset.physics },
    audioReactive: {
      enabled: true,
      subBassToWaveSwell: 0.45,
      midToGodRays: 0.5,
      voiceEnvelopeToBloom: 0.65,
      trebleToParticleSparkle: 0.55,
    },
    paragraphKeyframes: preset.paragraphKeyframes
      ? JSON.parse(JSON.stringify(preset.paragraphKeyframes))
      : {},
    updatedAt: '2026-10-23T00:00:00.000Z',
  };
}

export function buildAllDefaultChapterConfigs(): Record<
  string,
  ChapterVisualConfig
> {
  const map: Record<string, ChapterVisualConfig> = {};
  for (const ep of BIBLE_EPISODES) {
    for (const ch of ep.chapters) {
      const cfg = buildConfigForChapter(ep.id, ch);
      map[cfg.id] = cfg;
    }
  }
  return map;
}

export const DEFAULT_CHAPTER_CONFIGS: Record<string, ChapterVisualConfig> =
  buildAllDefaultChapterConfigs();

export function getDefaultChapterVisualConfig(
  episodeId: string,
  chapterNumber: number
): ChapterVisualConfig {
  const key = makeChapterConfigKey(episodeId, chapterNumber);
  if (DEFAULT_CHAPTER_CONFIGS[key]) {
    return JSON.parse(JSON.stringify(DEFAULT_CHAPTER_CONFIGS[key]));
  }
  const fallbackEp = BIBLE_EPISODES[0];
  const fallbackCh = fallbackEp.chapters[0];
  return buildConfigForChapter(episodeId, fallbackCh);
}
