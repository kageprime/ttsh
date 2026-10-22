export type SceneTheme =
  | 'primordial-waters'
  | 'first-light'
  | 'parted-sky'
  | 'ancient-forest'
  | 'celestial-spheres'
  | 'living-waters'
  | 'sacred-breath'
  | 'sabbath-stillness'
  | 'eden-mist'
  | 'deluge-ark'
  | 'desert-stars';

export type CanvasSimulationMode =
  | 'void-ripples'
  | 'ruach-wind'
  | 'yehi-or-dawn'
  | 'sky-vault'
  | 'tectonic-sea'
  | 'emerald-spores'
  | 'star-constellations'
  | 'living-shoals'
  | 'meadow-fireflies'
  | 'sacred-dust'
  | 'symphony-aurora'
  | 'sabbath-breath';

export type ChapterVisualMotif =
  | 'hero-sanctuary'
  // Episode 1: Before the Beginning (12 Chapters)
  | 'e1-ch1-abyssal-resonance'
  | 'e1-ch2-bereshit-arch'
  | 'e1-ch3-tohu-vortex'
  | 'e1-ch4-hovering-ruach'
  | 'e1-ch5-yehi-or-burst'
  | 'e1-ch6-sky-and-shoals'
  | 'e1-ch7-imago-dei-grove'
  | 'e1-ch8-sacred-dust-breath'
  | 'e1-ch9-sabbath-sanctuary'
  | 'e1-ch10-symphony-nebula'
  | 'e1-ch11-dawn-over-depths'
  | 'e1-ch12-forest-of-grace'
  // Episode 2: The Garden and the Voice (9 Chapters)
  | 'e2-ch1-construct-eden'
  | 'e2-ch2-two-trees'
  | 'e2-ch3-coiling-serpent'
  | 'e2-ch4-fig-leaves-fall'
  | 'e2-ch5-ayekah-footsteps'
  | 'e2-ch6-promised-seed'
  | 'e2-ch7-flaming-sword'
  | 'e2-ch8-healing-river'
  | 'e2-ch9-east-of-eden-grace'
  // Episode 3: The Deep Unbound (3 Chapters)
  | 'e3-ch1-deluge-ark'
  | 'e3-ch2-receding-wind-ark'
  | 'e3-ch3-dove-olive-rainbow'
  // Episode 4: Stars Over the Tent (2 Chapters)
  | 'e4-ch1-pilgrim-tent-fire'
  | 'e4-ch2-counted-stars';

export interface ShaderSceneWeights {
  readonly ocean: number;
  readonly dawn: number;
  readonly forest: number;
  readonly cosmos: number;
}

export interface ChapterAnimationConfig {
  readonly motif: ChapterVisualMotif;
  readonly label: string;
  readonly description: string;
  readonly tintTop: readonly [number, number, number];
  readonly tintHorizon: readonly [number, number, number];
  readonly tintGround: readonly [number, number, number];
  readonly weights: ShaderSceneWeights;
  readonly windIntensity: number;
  readonly lightBloom: number;
  readonly waterParting: number;
  readonly accentGlow: string;
}

export interface HebrewLexiconEntry {
  hebrew: string;
  transliteration: string;
  meaning: string;
  insight: string;
}

export interface StoryChapter {
  number: number;
  title: string;
  scriptureRef: string;
  scriptureText: string;
  hebrewQuote?: string;
  hebrewTranslation?: string;
  soundCue: string;
  paragraphs: string[];
  narrative: string;
  triggerPhrase: string;
  triggerActionLabel: string;
  interactiveEffectDescription: string;
  hebrewLexicon: HebrewLexiconEntry;
  reflectionPrompt: string;
  reflectionContext: string;
  durationSec: number;
  sceneTheme: SceneTheme;
  canvasMode: CanvasSimulationMode;
  backgroundImageUrl?: string;
  animationConfig: ChapterAnimationConfig;
}

export interface StoryEpisode {
  id: string;
  code: string;
  number: string;
  series: string;
  category: 'Primeval History' | 'Covenant & Promise' | 'Wisdom & Wonder';
  title: string;
  subtitle: string;
  fullTitle: string;
  summary: string;
  bookRef: string;
  durationMin: number;
  accentColor: string;
  badgeTextColor: string;
  heroTheme: SceneTheme;
  heroCanvasMode: CanvasSimulationMode;
  chapters: StoryChapter[];
}

export const BIBLE_EPISODES: StoryEpisode[] = [
  {
    id: 'e1-before-the-beginning',
    code: 'E1',
    number: '01',
    series: 'BIBLEVERSE',
    category: 'Primeval History',
    title: 'Before the Beginning',
    subtitle: 'A Hollow and a Hum',
    fullTitle: 'Before the Beginning — A Hollow and a Hum',
    summary: 'A meditation on the first lines of Genesis, where silence gives way to light.',
    bookRef: 'Genesis 1:1–2:3',
    durationMin: 12,
    accentColor: '#8B7EC8',
    badgeTextColor: 'text-[#B8A8E8]',
    heroTheme: 'primordial-waters',
    heroCanvasMode: 'void-ripples',
    chapters: [
      {
        number: 1,
        title: 'The Dark of Waiting',
        scriptureRef: 'Genesis 1:1',
        scriptureText: 'In the beginning, God created the heavens and the earth.',
        soundCue:
          'Sound of slow, deep, resonant silence. Not empty, but full — like listening to the inside of a seashell, or the space between heartbeats. A low, soft hum begins, almost imperceptible at first, like the universe tuning itself.',
        paragraphs: [
          'Have you ever stood in a forest so ancient, the trees seem to hold their breath? Or listened to the dark before dawn — not the dark of fear, but the dark of waiting? That is where this story begins. Not with a bang, not with a blaze… but with a longing.',
        ],
        narrative:
          'Have you ever stood in a forest so ancient, the trees seem to hold their breath? Or listened to the dark before dawn — not the dark of fear, but the dark of waiting? That is where this story begins. Not with a bang, not with a blaze… but with a longing.',
        triggerPhrase: 'the dark of waiting',
        triggerActionLabel: 'Ripple the Primordial Waters',
        interactiveEffectDescription:
          'Sends organic acoustic water waves rippling across the dark primordial sea.',
        hebrewLexicon: {
          hebrew: 'בְּרֵאשִׁית',
          transliteration: 'Bereshit',
          meaning: 'In the beginning / At the headwaters',
          insight:
            'The first letter of the Bible is Bet, shaped like a three-walled house open toward the forward reading direction — inviting the reader into a hospitable cosmos.',
        },
        reflectionPrompt:
          'Before words, before light — there was stillness. When was the last time you sat in true silence?',
        reflectionContext:
          'The Hebrew word "Bereshit" (In the beginning) opens Scripture not with a philosophical proof, but with an invitation into stillness and intention.',
        durationSec: 48,
        sceneTheme: 'primordial-waters',
        canvasMode: 'void-ripples',
        animationConfig: {
          motif: 'e1-ch1-abyssal-resonance',
          label: 'The Abyssal Seashell Resonance',
          description:
            'Concentric acoustic waves and bioluminescent depth filaments pulse across the waiting primordial waters.',
          tintTop: [0.02, 0.03, 0.08],
          tintHorizon: [0.16, 0.22, 0.38],
          tintGround: [0.02, 0.04, 0.10],
          weights: { ocean: 0.92, dawn: 0.0, forest: 0.0, cosmos: 0.08 },
          windIntensity: 0.18,
          lightBloom: 0.16,
          waterParting: 0.0,
          accentGlow: '#7FA8D8',
        },
      },
      {
        number: 2,
        title: 'A Mystery, Not a Diagram',
        scriptureRef: 'Genesis 1:1',
        scriptureText: 'In the beginning, God created the heavens and the earth.',
        hebrewQuote: "Bereshit bara Elohim et hashamayim ve'et ha'aretz.",
        hebrewTranslation: 'In the beginning, God created the heavens and the earth.',
        soundCue: '',
        paragraphs: [
          'The Hebrew poets who wrote this down did not begin with dates or diagrams. They began with a mystery.',
          'But the next line is the one that haunts me:',
        ],
        narrative:
          'The Hebrew poets who wrote this down did not begin with dates or diagrams. They began with a mystery. But the next line is the one that haunts me:',
        triggerPhrase: 'began with a mystery',
        triggerActionLabel: 'Stir the Deep Horizon',
        interactiveEffectDescription:
          'Drifts deep indigo mist across the moonlit horizon water.',
        hebrewLexicon: {
          hebrew: 'בָּרָא אֱלֹהִים',
          transliteration: 'Bara Elohim',
          meaning: 'God created out of freedom and love',
          insight:
            'In biblical Hebrew, the verb "bara" is reserved exclusively for divine creation — effortless artistic bringing-forth.',
        },
        reflectionPrompt:
          'Mystery is the birthplace of wonder. How do you sit with questions that have no easy answers?',
        reflectionContext:
          'Genesis opens as a liturgical poem inviting awe rather than a technical manual.',
        durationSec: 44,
        sceneTheme: 'primordial-waters',
        canvasMode: 'void-ripples',
        animationConfig: {
          motif: 'e1-ch2-bereshit-arch',
          label: 'The Open House of Bereshit (ב)',
          description:
            'Luminous calligraphic geometry forms the three-walled sanctuary arch of the Hebrew letter Bet over the deep.',
          tintTop: [0.04, 0.03, 0.12],
          tintHorizon: [0.28, 0.22, 0.48],
          tintGround: [0.04, 0.05, 0.14],
          weights: { ocean: 0.65, dawn: 0.05, forest: 0.0, cosmos: 0.30 },
          windIntensity: 0.24,
          lightBloom: 0.32,
          waterParting: 0.10,
          accentGlow: '#B8A8E8',
        },
      },
      {
        number: 3,
        title: 'A Hollow Waiting for a Hymn',
        scriptureRef: 'Genesis 1:2',
        scriptureText: 'And the earth was formless and void.',
        hebrewQuote: "Veha'aretz hayetah tohu vavohu.",
        hebrewTranslation: 'And the earth was formless and void.',
        soundCue: '',
        paragraphs: [
          'Some translations say “wild and waste.” Others, “chaos and emptiness.” But the ancient rabbis listened deeper. They heard in “tohu vavohu” a kind of primordial yearning — a hollow waiting to be filled. A hum waiting to become a hymn.',
        ],
        narrative:
          'Some translations say “wild and waste.” Others, “chaos and emptiness.” But the ancient rabbis listened deeper. They heard in “tohu vavohu” a kind of primordial yearning — a hollow waiting to be filled. A hum waiting to become a hymn.',
        triggerPhrase: 'tohu vavohu',
        triggerActionLabel: 'Awaken the Deep Swells',
        interactiveEffectDescription:
          'Swells the untamed ocean surface with silver-indigo moonlight reflections.',
        hebrewLexicon: {
          hebrew: 'תֹהוּ וָבֹהוּ',
          transliteration: 'Tohu va-Vohu',
          meaning: 'Formless and void / Unshaped potential',
          insight:
            'A rhyming Hebrew phrase evoking an unformed wilderness waiting for the Maker’s voice.',
        },
        reflectionPrompt:
          '“Tohu vavohu” — formless and void. Where in your life right now feels like waiting for form?',
        reflectionContext:
          'Before God shapes the cosmos, Scripture honors the reality of unformed waiting.',
        durationSec: 50,
        sceneTheme: 'primordial-waters',
        canvasMode: 'tectonic-sea',
        animationConfig: {
          motif: 'e1-ch3-tohu-vortex',
          label: 'Tohu va-Vohu — Yearning Deep Swells',
          description:
            'Untamed silver-indigo tidal currents and rising mist spirals swirl in an unshaped sea of potential.',
          tintTop: [0.03, 0.06, 0.13],
          tintHorizon: [0.22, 0.36, 0.48],
          tintGround: [0.02, 0.08, 0.16],
          weights: { ocean: 0.95, dawn: 0.0, forest: 0.0, cosmos: 0.05 },
          windIntensity: 0.72,
          lightBloom: 0.24,
          waterParting: 0.15,
          accentGlow: '#6BA3C8',
        },
      },
      {
        number: 4,
        title: 'The Hovering Breath',
        scriptureRef: 'Genesis 1:2',
        scriptureText:
          'And the Spirit of God was hovering over the face of the waters.',
        soundCue: 'The hum grows subtly, layered with a faint, whispering wind.',
        paragraphs: [
          'And then — the ruach Elohim — the breath, the wind, the Spirit of God — hovering. Not fixing, not forcing. Hovering. Like a mother bird over unhatched eggs. Like a poet over a blank page.',
          'What was God doing in that hovering? Perhaps listening. Perhaps loving what was not yet seen. Perhaps making space — not just in the cosmos, but in the very nature of creation — for potential. For relationship.',
          'This is the first truth of the Bible: Before God speaks light — God attends. God dwells in the depth. Even the void is held.',
        ],
        narrative:
          'And then — the ruach Elohim — the breath, the wind, the Spirit of God — hovering. Not fixing, not forcing. Hovering. Like a mother bird over unhatched eggs. Like a poet over a blank page. What was God doing in that hovering? Perhaps listening. Perhaps loving what was not yet seen. This is the first truth of the Bible: Before God speaks light — God attends. God dwells in the depth. Even the void is held.',
        triggerPhrase: 'ruach Elohim',
        triggerActionLabel: 'Breathe the Hovering Wind',
        interactiveEffectDescription:
          'Sweeps warm wind currents across the water waves and parts the surface mist.',
        hebrewLexicon: {
          hebrew: 'רוּחַ אֱלֹהִים',
          transliteration: 'Ruach Elohim',
          meaning: 'Breath / Wind / Spirit of God',
          insight:
            'Paired with "merachefet" (hovering/fluttering), creation begins with maternal tenderness brooding over the dark waters.',
        },
        reflectionPrompt:
          'The Spirit hovers — not fixing, not forcing. What would it mean to let yourself be hovered over today?',
        reflectionContext:
          'Before speaking a single command, God attends closely to the dark waters.',
        durationSec: 64,
        sceneTheme: 'primordial-waters',
        canvasMode: 'ruach-wind',
        animationConfig: {
          motif: 'e1-ch4-hovering-ruach',
          label: 'Ruach Elohim — The Hovering Wings of Breath',
          description:
            'Sweeping wind ribbons and luminous wing-arcs brood gently just above the dark surface of the waters.',
          tintTop: [0.04, 0.09, 0.16],
          tintHorizon: [0.36, 0.52, 0.62],
          tintGround: [0.04, 0.12, 0.20],
          weights: { ocean: 0.78, dawn: 0.22, forest: 0.0, cosmos: 0.0 },
          windIntensity: 0.92,
          lightBloom: 0.48,
          waterParting: 0.45,
          accentGlow: '#93C5FD',
        },
      },
      {
        number: 5,
        title: 'Let There Be Light',
        scriptureRef: 'Genesis 1:3–5',
        scriptureText:
          'And God said, “Let there be light,” and there was light. God saw that the light was good.',
        hebrewQuote: 'Yehi or.',
        hebrewTranslation: 'Let there be light.',
        soundCue:
          'The hum resolves into a single, clear, sustained note — pure and gentle.',
        paragraphs: [
          'Not the light of sun or star — not yet. This is the light before light. The firstborn of creation. A light that does not cast shadows. A light that reveals not shapes, but sacredness.',
          'And God saw that the light was good. Tov. The first sacred word of value in the universe. Good. Beautiful. Whole.',
          'But here is the wonder — the darkness was not cursed. It was named night. Given its place in the rhythm of all things. The first act of creation, then, is not destruction of dark, but ordering of it. Making room for both — day and night — and calling the rhythm good.',
        ],
        narrative:
          'Not the light of sun or star — not yet. This is the light before light. The firstborn of creation. A light that does not cast shadows. A light that reveals not shapes, but sacredness. And God saw that the light was good. Tov. The first sacred word of value in the universe. Good. Beautiful. Whole. But here is the wonder — the darkness was not cursed. It was named night. Given its place in the rhythm of all things.',
        triggerPhrase: 'light before light',
        triggerActionLabel: 'Ignite the First Dawn',
        interactiveEffectDescription:
          'Radiates volumetric golden dawn shafts through the mist and illuminates the water below.',
        hebrewLexicon: {
          hebrew: 'יְהִי אוֹר',
          transliteration: 'Yehi Or',
          meaning: 'Let there be light',
          insight:
            'Two quiet Hebrew words bring forth the first dawn without struggle or violence.',
        },
        reflectionPrompt:
          '“Let there be light.” What needs light spoken into it in your life today?',
        reflectionContext:
          'The first act of creation does not curse the darkness, but names it and gives it a boundary within the rhythm of evening and morning.',
        durationSec: 65,
        sceneTheme: 'first-light',
        canvasMode: 'yehi-or-dawn',
        animationConfig: {
          motif: 'e1-ch5-yehi-or-burst',
          label: 'Yehi Or — Firstborn Dawn Prism',
          description:
            'Volumetric golden rays and expanding dawn halos break across the horizon, dividing night from morning.',
          tintTop: [0.08, 0.05, 0.14],
          tintHorizon: [0.95, 0.68, 0.26],
          tintGround: [0.32, 0.20, 0.08],
          weights: { ocean: 0.15, dawn: 0.85, forest: 0.0, cosmos: 0.0 },
          windIntensity: 0.30,
          lightBloom: 0.95,
          waterParting: 0.35,
          accentGlow: '#F5B942',
        },
      },
      {
        number: 6,
        title: 'Separation and Saturation',
        scriptureRef: 'Genesis 1:6–25',
        scriptureText: 'And God saw that it was good.',
        soundCue: 'A slow, cosmic tide — waves of light and darkness breathing.',
        paragraphs: [
          'And so it unfolds — not as a lecture, but as a liturgy. A six-day poem of separation and saturation. Sky from waters. Land from seas. Vegetation reaching up from the soil. Sun, moon, stars — not as gods, as some ancient peoples believed — but as lamps. Timekeepers. Gifts.',
          'Then — life. Swarming, swimming, soaring life. Each after its kind. Not random emergence, but called-out, blessed abundance. And God saw that it was tov me’od — very good.',
        ],
        narrative:
          'And so it unfolds — not as a lecture, but as a liturgy. A six-day poem of separation and saturation. Sky from waters. Land from seas. Vegetation reaching up from the soil. Sun, moon, stars — not as gods, as some ancient peoples believed — but as lamps. Timekeepers. Gifts. Then — life. Swarming, swimming, soaring life. Each after its kind. Not random emergence, but called-out, blessed abundance. And God saw that it was tov me’od — very good.',
        triggerPhrase: 'tov me’od — very good',
        triggerActionLabel: 'Part the Waters & Sky',
        interactiveEffectDescription:
          'Parts the upper cloud vault from the shimmering turquoise-emerald sea below.',
        hebrewLexicon: {
          hebrew: 'טוֹב מְאֹד',
          transliteration: 'Tov Me’od',
          meaning: 'Very good / Overflowing harmony',
          insight:
            'The whole chorus of sky, sea, land, and living creatures resonates in harmony.',
        },
        reflectionPrompt:
          'God called it “good.” What if you could hear that word spoken over your own life?',
        reflectionContext:
          'Days 1–3 form the realms of light, sky/sea, and land; Days 4–6 fill them with life and beauty.',
        durationSec: 62,
        sceneTheme: 'living-waters',
        canvasMode: 'living-shoals',
        animationConfig: {
          motif: 'e1-ch6-sky-and-shoals',
          label: 'Parted Firmament, Soaring Birds & Living Shoals',
          description:
            'The upper cloud vault parts from the sea as winged birds soar overhead and bioluminescent shoals swim below.',
          tintTop: [0.05, 0.14, 0.24],
          tintHorizon: [0.34, 0.68, 0.72],
          tintGround: [0.03, 0.22, 0.26],
          weights: { ocean: 0.62, dawn: 0.20, forest: 0.18, cosmos: 0.0 },
          windIntensity: 0.55,
          lightBloom: 0.62,
          waterParting: 0.92,
          accentGlow: '#4FD1C5',
        },
      },
      {
        number: 7,
        title: 'In Our Image',
        scriptureRef: 'Genesis 1:26–27',
        scriptureText: 'Let us make humankind in our image.',
        hebrewQuote: "Na'aseh adam betsalmenu.",
        hebrewTranslation: 'Let us make humankind in our image.',
        soundCue: 'Birdsong emerges, water splashes, a gentle rustling of leaves.',
        paragraphs: [
          'Imago Dei. The divine imprint. Not in a statue’s form, but in a breath’s potential. To create. To choose. To love. To steward. To walk with God in the cool of the day.',
        ],
        narrative:
          'Imago Dei. The divine imprint. Not in a statue’s form, but in a breath’s potential. To create. To choose. To love. To steward. To walk with God in the cool of the day.',
        triggerPhrase: 'Imago Dei',
        triggerActionLabel: 'Kindle the Sacred Imprint',
        interactiveEffectDescription:
          'Illuminates warm golden light shafts filtering through ancient forest mist over still water.',
        hebrewLexicon: {
          hebrew: 'בְּצַלְמֵנוּ',
          transliteration: 'Betsalmenu',
          meaning: 'In our image / Living reflection',
          insight:
            'Every human being is crowned as a living bearer of divine dignity and creative love.',
        },
        reflectionPrompt:
          'You bear the image of the Creator. What does that change about how you see yourself?',
        reflectionContext:
          'The divine image is not a stone monument, but a living capacity to love, create, and steward.',
        durationSec: 52,
        sceneTheme: 'ancient-forest',
        canvasMode: 'emerald-spores',
        animationConfig: {
          motif: 'e1-ch7-imago-dei-grove',
          label: 'Imago Dei — Ancient Grove & Living Reflection',
          description:
            'Ancient forest canopies frame a tranquil mirror pool where a golden crown of light reflects upon the water.',
          tintTop: [0.03, 0.09, 0.06],
          tintHorizon: [0.46, 0.68, 0.48],
          tintGround: [0.04, 0.16, 0.11],
          weights: { ocean: 0.10, dawn: 0.20, forest: 0.70, cosmos: 0.0 },
          windIntensity: 0.32,
          lightBloom: 0.68,
          waterParting: 0.20,
          accentGlow: '#74C69D',
        },
      },
      {
        number: 8,
        title: 'Holy Animation',
        scriptureRef: 'Genesis 2:7',
        scriptureText: 'God breathed into his nostrils the breath of life.',
        hebrewQuote: "Vayipach be'apav nishmat chayim.",
        hebrewTranslation: 'God breathed into his nostrils the breath of life.',
        soundCue: '',
        paragraphs: [
          'The same breath that hovered over the waters — now dwells within dust. Holy animation. Heaven in earth.',
        ],
        narrative:
          'The same breath that hovered over the waters — now dwells within dust. Holy animation. Heaven in earth.',
        triggerPhrase: 'Holy animation',
        triggerActionLabel: 'Breathe Living Light',
        interactiveEffectDescription:
          'Lifts warm golden dust motes and gentle breath waves across the twilight horizon.',
        hebrewLexicon: {
          hebrew: 'נִשְׁמַת חַיִּים',
          transliteration: 'Nishmat Chayim',
          meaning: 'The breath of life',
          insight:
            'Humanity is formed of humble earth (adamah) and animated by intimate divine breath.',
        },
        reflectionPrompt:
          'God’s breath in your lungs. Right now. Take a breath and feel it — holy animation.',
        reflectionContext:
          'Every breath we take is a quiet echo of the first breath spoken into the dust.',
        durationSec: 46,
        sceneTheme: 'sacred-breath',
        canvasMode: 'sacred-dust',
        animationConfig: {
          motif: 'e1-ch8-sacred-dust-breath',
          label: 'Nishmat Chayim — Sacred Breath in Terracotta Dust',
          description:
            'Ascending streams of warm terracotta and gold dust spiral upward as divine breath animates the earth.',
          tintTop: [0.09, 0.05, 0.09],
          tintHorizon: [0.78, 0.46, 0.24],
          tintGround: [0.24, 0.12, 0.07],
          weights: { ocean: 0.0, dawn: 0.65, forest: 0.0, cosmos: 0.35 },
          windIntensity: 0.48,
          lightBloom: 0.75,
          waterParting: 0.10,
          accentGlow: '#E08E45',
        },
      },
      {
        number: 9,
        title: 'A Sanctuary in Time',
        scriptureRef: 'Genesis 2:1–3',
        scriptureText: 'And on the seventh day God rested from all his work.',
        soundCue: 'A heartbeat emerges softly beneath the music.',
        paragraphs: [
          'And God rested. The seventh day — not because God was tired, but because rest is part of the pattern. A sanctuary in time. A reminder that being precedes doing. That the world is not a machine to run, but a gift to receive.',
        ],
        narrative:
          'And God rested. The seventh day — not because God was tired, but because rest is part of the pattern. A sanctuary in time. A reminder that being precedes doing. That the world is not a machine to run, but a gift to receive.',
        triggerPhrase: 'A sanctuary in time',
        triggerActionLabel: 'Enter Sabbath Stillness',
        interactiveEffectDescription:
          'Calms the water surface into a glass-like golden mirror under soft twilight.',
        hebrewLexicon: {
          hebrew: 'שַׁבָּת',
          transliteration: 'Shabbat',
          meaning: 'Rest / Ceasing / Delight',
          insight:
            'Creation reaches its summit not in another product, but in sacred rest and delight.',
        },
        reflectionPrompt:
          'Rest is not the pause between work. Rest is the point. What would it take to truly rest?',
        reflectionContext:
          'Before any temple in space was built, Genesis consecrated a palace in time.',
        durationSec: 54,
        sceneTheme: 'sabbath-stillness',
        canvasMode: 'sabbath-breath',
        animationConfig: {
          motif: 'e1-ch9-sabbath-sanctuary',
          label: 'Shabbat — The Sanctuary Palace in Time',
          description:
            'Seven luminous colonnade arches and a tranquil golden Sabbath menora glow above glass-still waters.',
          tintTop: [0.06, 0.04, 0.14],
          tintHorizon: [0.74, 0.56, 0.36],
          tintGround: [0.14, 0.10, 0.22],
          weights: { ocean: 0.25, dawn: 0.55, forest: 0.0, cosmos: 0.20 },
          windIntensity: 0.12,
          lightBloom: 0.72,
          waterParting: 0.05,
          accentGlow: '#E6C275',
        },
      },
      {
        number: 10,
        title: 'A Theological Overture',
        scriptureRef: 'Genesis 1:31',
        scriptureText: 'God saw all that he had made, and behold, it was very good.',
        soundCue: 'Music swells gently, then settles into a quiet, melodic refrain.',
        paragraphs: [
          'So what is this story? A science text? No. A myth? Not in the way we use the word. It is a theological overture — the first notes in a symphony that will span betrayal and redemption, exile and return, crucifixion and resurrection.',
          'It tells us: The world is not an accident. Life is not a burden. Darkness is not final. And you — you are not a cosmic afterthought. You are breathed on by the same Spirit that hovered over the first hollow. You carry the image of the One who called light out of waiting.',
        ],
        narrative:
          'So what is this story? A science text? No. A myth? Not in the way we use the word. It is a theological overture — the first notes in a symphony that will span betrayal and redemption, exile and return, crucifixion and resurrection. It tells us: The world is not an accident. Life is not a burden. Darkness is not final. And you — you are not a cosmic afterthought.',
        triggerPhrase: 'not a cosmic afterthought',
        triggerActionLabel: 'Illuminate the Starlit Sea',
        interactiveEffectDescription:
          'Reveals a deep starlit nebula reflecting across the tranquil ocean below.',
        hebrewLexicon: {
          hebrew: 'כּוֹכָבִים',
          transliteration: 'Kokhavim',
          meaning: 'Stars / Timeless witnesses',
          insight:
            'The same Voice that kindled the galaxies knows every human heart by name.',
        },
        reflectionPrompt:
          'The world is not an accident. You are not a cosmic afterthought. How does that change your story?',
        reflectionContext:
          'Genesis 1 is the opening movement of a symphony of grace that spans all of Scripture.',
        durationSec: 60,
        sceneTheme: 'celestial-spheres',
        canvasMode: 'star-constellations',
        animationConfig: {
          motif: 'e1-ch10-symphony-nebula',
          label: 'Theological Overture — Cosmic Nebula & Harmonic Chords',
          description:
            'Harmonic string waves and constellation arcs weave across a deep starlit nebula.',
          tintTop: [0.03, 0.02, 0.09],
          tintHorizon: [0.48, 0.32, 0.66],
          tintGround: [0.06, 0.05, 0.16],
          weights: { ocean: 0.22, dawn: 0.08, forest: 0.0, cosmos: 0.70 },
          windIntensity: 0.28,
          lightBloom: 0.64,
          waterParting: 0.25,
          accentGlow: '#C4B5FD',
        },
      },
      {
        number: 11,
        title: 'Over Your Depths',
        scriptureRef: 'Genesis 1:2–3',
        scriptureText: 'And the Spirit of God was hovering over the face of the waters.',
        soundCue: 'Sound returns to the soft, deep hum from the beginning.',
        paragraphs: [
          'So if you today are in a season of tohu vavohu — formlessness, void, waiting — remember: the Spirit hovers over your depths, too. And the first word God speaks into chaos is not “Fix yourself,” but “Let there be light.”',
          'And it is good.',
        ],
        narrative:
          'So if you today are in a season of tohu vavohu — formlessness, void, waiting — remember: the Spirit hovers over your depths, too. And the first word God speaks into chaos is not “Fix yourself,” but “Let there be light.” And it is good.',
        triggerPhrase: 'the Spirit hovers over your depths',
        triggerActionLabel: 'Send Dawn Across the Deep',
        interactiveEffectDescription:
          'Warms the dark waters with a gentle golden sunrise glow.',
        hebrewLexicon: {
          hebrew: 'אוֹר וָטוֹב',
          transliteration: 'Or va-Tov',
          meaning: 'Light and Goodness',
          insight:
            'Grace meets us in our unformed places before we ever have ourselves together.',
        },
        reflectionPrompt:
          '“Let there be light” is still being spoken over your chaos. Can you hear it?',
        reflectionContext:
          'The God of creation does not wait for chaos to resolve itself before drawing near.',
        durationSec: 50,
        sceneTheme: 'primordial-waters',
        canvasMode: 'yehi-or-dawn',
        animationConfig: {
          motif: 'e1-ch11-dawn-over-depths',
          label: 'Or va-Tov — Sunrise Hovering Over the Deep',
          description:
            'A warm golden sunrise hovers over deep ocean swells, casting liquid amber reflections across the dark.',
          tintTop: [0.05, 0.06, 0.14],
          tintHorizon: [0.84, 0.58, 0.28],
          tintGround: [0.06, 0.12, 0.22],
          weights: { ocean: 0.52, dawn: 0.48, forest: 0.0, cosmos: 0.0 },
          windIntensity: 0.36,
          lightBloom: 0.82,
          waterParting: 0.40,
          accentGlow: '#F59E0B',
        },
      },
      {
        number: 12,
        title: 'There Is Grace',
        scriptureRef: 'Genesis 1:1–2:3',
        scriptureText: 'In the beginning — and even now — there is grace.',
        soundCue: 'Music fades to silence for three full seconds.',
        paragraphs: [
          'Until next time, this is Kuki Sage of Light, walking with you through the forests of Scripture. In the beginning — and even now — there is grace.',
        ],
        narrative:
          'Until next time, this is Kuki Sage of Light, walking with you through the forests of Scripture. In the beginning — and even now — there is grace.',
        triggerPhrase: 'there is grace',
        triggerActionLabel: 'Rest in Quiet Stillness',
        interactiveEffectDescription:
          'Settles the night water and stars into serene, contemplative stillness.',
        hebrewLexicon: {
          hebrew: 'חֵן וָשָׁלוֹם',
          transliteration: 'Chen va-Shalom',
          meaning: 'Grace and Peace',
          insight:
            'Every beginning in Scripture is anchored in the unhurried grace of the Creator.',
        },
        reflectionPrompt:
          'In the beginning — and even now — there is grace. How will you carry that forward?',
        reflectionContext:
          'Take a quiet breath before stepping back into the rhythm of your day.',
        durationSec: 42,
        sceneTheme: 'sabbath-stillness',
        canvasMode: 'sabbath-breath',
        animationConfig: {
          motif: 'e1-ch12-forest-of-grace',
          label: 'Chen va-Shalom — Lantern Walk Through the Forests of Scripture',
          description:
            'Cathedral redwoods and floating golden lantern spores settle into serene, starlit stillness.',
          tintTop: [0.02, 0.06, 0.07],
          tintHorizon: [0.42, 0.58, 0.46],
          tintGround: [0.03, 0.09, 0.07],
          weights: { ocean: 0.12, dawn: 0.24, forest: 0.44, cosmos: 0.20 },
          windIntensity: 0.16,
          lightBloom: 0.58,
          waterParting: 0.10,
          accentGlow: '#84CC16',
        },
      },
    ],
  },
  {
    id: 'e2-the-garden-and-the-voice',
    code: 'E2',
    number: '02',
    series: 'BIBLEVERSE',
    category: 'Primeval History',
    title: 'The Garden and the Voice',
    subtitle: 'Trust, Trees, and the Tear',
    fullTitle: 'The Garden and the Voice — Trust, Trees, and the Tear',
    summary: 'A meditation on Eden, the fracture of trust, and the first thread of redemption.',
    bookRef: 'Genesis 2:4–3:24',
    durationMin: 12,
    accentColor: '#5B8C5A',
    badgeTextColor: 'text-[#A8D5A2]',
    heroTheme: 'eden-mist',
    heroCanvasMode: 'emerald-spores',
    chapters: [
      {
        number: 1,
        title: 'East, in Eden',
        scriptureRef: 'Genesis 2:7–8',
        scriptureText:
          'And the LORD God planted a garden eastward in Eden; and there he put the man whom he had formed.',
        soundCue:
          'Gentle, warm, living ambience — birdsong, soft breeze through leaves, distant flowing water. The air feels close, alive, safe.',
        paragraphs: [
          'After the cosmos — intimacy. God did not place the human in a fortress, a factory, or a frontier. He planted a garden.',
          'East, in Eden — a name that in Hebrew whispers delight, or perhaps place of abundant water. And there, in that curated wildness, God placed the human — ha’adam — formed from the soil — ha’adamah. Earthling from earth. Named for his origin. And into his keeping was given every tree pleasing to the sight and good for food.',
        ],
        narrative:
          'After the cosmos — intimacy. God did not place the human in a fortress, a factory, or a frontier. He planted a garden. East, in Eden — a name that in Hebrew whispers delight, or perhaps place of abundant water. And there, in that curated wildness, God placed the human — ha’adam — formed from the soil — ha’adamah.',
        triggerPhrase: 'place of abundant water',
        triggerActionLabel: 'Awaken the Garden Streams',
        interactiveEffectDescription:
          'Sends sunlit mist and gentle ripples across the emerald forest river.',
        hebrewLexicon: {
          hebrew: 'גַּן־בְּעֵדֶן',
          transliteration: 'Gan be-Eden',
          meaning: 'Garden of Delight & Abundant Water',
          insight:
            'Eden is an intimate sanctuary of living waters and fruiting trees rather than a fortress.',
        },
        reflectionPrompt:
          'God planted a garden, not a fortress. What kind of space is God cultivating in your life?',
        reflectionContext:
          'The wordplay between ha’adam (human) and ha’adamah (soil) roots humanity in tender stewardship.',
        durationSec: 65,
        sceneTheme: 'eden-mist',
        canvasMode: 'emerald-spores',
        animationConfig: {
          motif: 'e2-ch1-construct-eden',
          label: 'Gan be-Eden — Constructing the Garden & Four Rivers',
          description:
            'Constructs five-tier emerald-and-gold botanical trees along both valley banks while the Four Rivers of Eden flow in luminous currents.',
          tintTop: [0.02, 0.08, 0.05],
          tintHorizon: [0.38, 0.72, 0.52],
          tintGround: [0.04, 0.18, 0.12],
          weights: { ocean: 0.12, dawn: 0.18, forest: 0.70, cosmos: 0.0 },
          windIntensity: 0.28,
          lightBloom: 0.65,
          waterParting: 0.25,
          accentGlow: '#52B788',
        },
      },
      {
        number: 2,
        title: 'The First Boundary',
        scriptureRef: 'Genesis 2:9, 16–17',
        scriptureText:
          'Of every tree of the garden you may freely eat; but of the tree of the knowledge of good and evil you shall not eat.',
        soundCue: 'The garden hums with life — leaves rustling, water flowing.',
        paragraphs: [
          'Every tree, save two. One, in the very heart of the garden: The Tree of Life. The other, close by: The Tree of the Knowledge of Good and Evil.',
          'This was the first boundary. Not a wall, but a word. Not a restriction, but a definition of relationship: “You may freely eat of every tree. But of this one tree, you shall not eat, for in the day that you eat of it, you shall surely die.”',
          'What was death to a being who had only known breath? Perhaps it was not a threat, but a loving warning — like a father saying to a child, “Do not touch the fire, for it will burn you.” The boundary was not to withhold good, but to preserve life. To make space for trust. For obedience is the language of love when you cannot yet see the reason.',
        ],
        narrative:
          'Every tree, save two. One, in the very heart of the garden: The Tree of Life. The other, close by: The Tree of the Knowledge of Good and Evil. This was the first boundary. Not a wall, but a word. The boundary was not to withhold good, but to preserve life. To make space for trust.',
        triggerPhrase: 'make space for trust',
        triggerActionLabel: 'Illuminate the Canopy',
        interactiveEffectDescription:
          'Filters warm golden shafts of sunlight through the emerald canopy mist.',
        hebrewLexicon: {
          hebrew: 'עֵץ הַחַיִּים',
          transliteration: 'Etz ha-Chayim',
          meaning: 'The Tree of Life',
          insight:
            'Love requires the freedom to trust; without a choice, relationship would be mechanical.',
        },
        reflectionPrompt:
          'Boundaries given in love — not walls, but words. What boundaries in your life might actually be signs of love?',
        reflectionContext:
          'Notice how God’s command begins with extravagant permission: “You may freely eat of every tree.”',
        durationSec: 70,
        sceneTheme: 'eden-mist',
        canvasMode: 'meadow-fireflies',
        animationConfig: {
          motif: 'e2-ch2-two-trees',
          label: 'Etz ha-Chayim — The Tree of Life & The First Boundary',
          description:
            'Contrasts the radiant golden Tree of Life on the left with the shadowed Tree of Knowledge and its pulsing boundary ring on the right.',
          tintTop: [0.04, 0.08, 0.05],
          tintHorizon: [0.76, 0.64, 0.32],
          tintGround: [0.06, 0.15, 0.09],
          weights: { ocean: 0.05, dawn: 0.35, forest: 0.60, cosmos: 0.0 },
          windIntensity: 0.22,
          lightBloom: 0.78,
          waterParting: 0.15,
          accentGlow: '#D4A853',
        },
      },
      {
        number: 3,
        title: 'The Twisted Question',
        scriptureRef: 'Genesis 3:1–5',
        scriptureText:
          'Did God really say, “You shall not eat of any tree in the garden”?',
        soundCue:
          'The garden ambience continues, but a subtle, almost imperceptible shift — a faint, dry rustle, like scales on stone.',
        paragraphs: [
          'Enter the serpent. Arum — cunning. More subtle than any beast of the field. And it does not roar. It questions.',
          '“Did God really say, ‘You shall not eat of any tree in the garden’?” Notice the twist — already, the generous “eat from every tree” becomes “you cannot eat from any tree.” The serpent paints God as withholding, suspicious, severe.',
          'The woman — isha — answers, but her memory is already bending. She adds to God’s command: “Neither shall you touch it.” God never said “touch.” Had the man, in his care, added that protection? Had love become a fence, and the fence become a distortion?',
          'Then the serpent’s lie, wrapped in a truth: “You will not surely die. For God knows that in the day you eat of it, your eyes will be opened, and you will be like God, knowing good and evil.”',
          'The temptation was not to wickedness, but to divinity. Not to rebel against God, but to become God — to no longer need to trust, to no longer need to receive, to seize wisdom without dependence.',
        ],
        narrative:
          'Enter the serpent. Arum — cunning. More subtle than any beast of the field. And it does not roar. It questions. “Did God really say, ‘You shall not eat of any tree in the garden’?” The temptation was not to wickedness, but to divinity — to seize wisdom without dependence.',
        triggerPhrase: 'seize wisdom without dependence',
        triggerActionLabel: 'Stir the Shadowed Mist',
        interactiveEffectDescription:
          'Drifts brooding twilight fog across the forest water.',
        hebrewLexicon: {
          hebrew: 'עָרוּם',
          transliteration: 'Arum',
          meaning: 'Cunning / Subtle / Shrewd',
          insight:
            'The fracture of trust begins when God’s generous heart is painted as withholding.',
        },
        reflectionPrompt:
          'The serpent questioned, not roared. When have you heard truth twisted just enough to make you doubt God’s goodness?',
        reflectionContext:
          'Doubt about the Giver’s generosity always precedes grasping for control.',
        durationSec: 78,
        sceneTheme: 'ancient-forest',
        canvasMode: 'void-ripples',
        animationConfig: {
          motif: 'e2-ch3-coiling-serpent',
          label: 'Arum — The Coiling Serpent on the Shadowed Bough',
          description:
            'Animates a sinuous, iridescent serpent coiling along a shadowed branch with slitted amber eyes, flickering forked tongue, and whispering rings.',
          tintTop: [0.02, 0.04, 0.04],
          tintHorizon: [0.24, 0.38, 0.26],
          tintGround: [0.03, 0.07, 0.05],
          weights: { ocean: 0.25, dawn: 0.05, forest: 0.60, cosmos: 0.10 },
          windIntensity: 0.42,
          lightBloom: 0.28,
          waterParting: 0.05,
          accentGlow: '#84A98C',
        },
      },
      {
        number: 4,
        title: 'Fig Leaves and Exposure',
        scriptureRef: 'Genesis 3:6–7',
        scriptureText:
          'Then the eyes of both of them were opened, and they realized they were naked; so they sewed fig leaves together.',
        soundCue:
          'A moment of absolute silence — no birds, no breeze. Then a soft, decisive pluck, and a chew. Then a sharp intake of breath.',
        paragraphs: [
          'She ate. She gave to her man, who was with her. And he ate. And their eyes were opened — but not to glory. To nakedness. To vulnerability. To the terrifying awareness of their own exposure.',
          'And they sewed fig leaves together. The first human industry — not stewardship, but shame-management.',
        ],
        narrative:
          'She ate. She gave to her man, who was with her. And he ate. And their eyes were opened — but not to glory. To nakedness. To vulnerability. To the terrifying awareness of their own exposure. And they sewed fig leaves together. The first human industry — not stewardship, but shame-management.',
        triggerPhrase: 'shame-management',
        triggerActionLabel: 'Still the Dusk Waters',
        interactiveEffectDescription:
          'Dims the canopy light into a hushed twilight reflection.',
        hebrewLexicon: {
          hebrew: 'עֵירֻמִּים',
          transliteration: 'Eirummim',
          meaning: 'Exposed / Uncovered',
          insight:
            'Seeking autonomy apart from love leaves the human heart feeling fragile and exposed.',
        },
        reflectionPrompt:
          'Fig leaves. Shame-management. What are you using to cover what only grace can clothe?',
        reflectionContext:
          'Hiding behind self-made coverings is the oldest human reflex.',
        durationSec: 55,
        sceneTheme: 'ancient-forest',
        canvasMode: 'sacred-dust',
        animationConfig: {
          motif: 'e2-ch4-fig-leaves-fall',
          label: 'Eirummim — Fractured Light & Drifting Fig Leaves',
          description:
            'Drifts falling five-lobed fig leaves and rising ground mist across a darkened, fractured twilight forest.',
          tintTop: [0.04, 0.05, 0.07],
          tintHorizon: [0.28, 0.32, 0.30],
          tintGround: [0.05, 0.07, 0.06],
          weights: { ocean: 0.20, dawn: 0.12, forest: 0.52, cosmos: 0.16 },
          windIntensity: 0.35,
          lightBloom: 0.22,
          waterParting: 0.0,
          accentGlow: '#94A3B8',
        },
      },
      {
        number: 5,
        title: 'Where Are You?',
        scriptureRef: 'Genesis 3:8–10',
        scriptureText: 'Then the LORD God called to the man, “Where are you?”',
        hebrewQuote: 'Ayekah?',
        hebrewTranslation: 'Where are you?',
        soundCue: 'A cool wind rises. The garden sounds are distant now, thinner.',
        paragraphs: [
          'Then — the sound of the LORD God walking in the garden in the cool of the day. “Where are you?”',
          'Not an interrogator’s demand. A father’s call to a hiding child. The voice that once said “Let there be light” now speaks three of the most heartbreaking words in all of Scripture: “Where are you?”',
          'The man answers: “I heard your voice in the garden, and I was afraid, because I was naked, and I hid.”',
          'Fear. Nakedness. Hiding. Three new realities in a world that once knew only safety, intimacy, and presence.',
        ],
        narrative:
          'Then — the sound of the LORD God walking in the garden in the cool of the day. “Where are you?” Not an interrogator’s demand. A father’s call to a hiding child. The voice that once said “Let there be light” now speaks three of the most heartbreaking words in all of Scripture: “Where are you?”',
        triggerPhrase: 'Where are you?',
        triggerActionLabel: 'Echo the Seeking Breeze',
        interactiveEffectDescription:
          'Sends a gentle evening wind across the misty river surface.',
        hebrewLexicon: {
          hebrew: 'אַיֶּכָּה',
          transliteration: 'Ayekah',
          meaning: 'Where are you?',
          insight:
            'The first question in the Bible is a seeking father’s call to draw His children out of hiding.',
        },
        reflectionPrompt:
          '“Where are you?” — not an accusation, but a father’s call. Where are you hiding from Love right now?',
        reflectionContext:
          'God walks into the fractured garden not in wrath, but in longing for relationship.',
        durationSec: 65,
        sceneTheme: 'parted-sky',
        canvasMode: 'ruach-wind',
        animationConfig: {
          motif: 'e2-ch5-ayekah-footsteps',
          label: 'Ayekah — Seeking Footsteps in the Cool of the Day',
          description:
            'Sequential golden footsteps and acoustic calling ripples walk gently through the shadowed evening grove.',
          tintTop: [0.03, 0.06, 0.11],
          tintHorizon: [0.36, 0.48, 0.58],
          tintGround: [0.04, 0.10, 0.12],
          weights: { ocean: 0.38, dawn: 0.14, forest: 0.48, cosmos: 0.0 },
          windIntensity: 0.68,
          lightBloom: 0.44,
          waterParting: 0.55,
          accentGlow: '#7DD3FC',
        },
      },
      {
        number: 6,
        title: 'A Promise in the Ruins',
        scriptureRef: 'Genesis 3:12–15',
        scriptureText:
          'He shall bruise your head, and you shall bruise his heel.',
        soundCue: 'The wind grows steady, mournful.',
        paragraphs: [
          'And then — the first blame. “The woman whom you gave to be with me — she gave me fruit, and I ate.” It is not just, “The woman did it.” It is, “The woman you gave me did it.” The rebellion completes itself: now God’s own gift is used as an accusation against Him.',
          'The woman, in turn, blames the serpent. But the serpent does not speak again.',
          'And so the unraveling — the curse, yes, but also the mercy within it. The serpent is humbled, but a promise is planted in the curse itself: “He will bruise your head, and you will bruise his heel.” A proto-gospel, whispered in the ruins.',
          'Pain in childbearing, yes — but also multiplied conception. Life will continue. Toil and thorns, yes — but the ground will still yield. You will eat. And death — yes, you will return to dust.',
        ],
        narrative:
          'And then — the first blame. “The woman whom you gave to be with me — she gave me fruit, and I ate.” And so the unraveling — the curse, yes, but also the mercy within it. The serpent is humbled, but a promise is planted in the curse itself: “He will bruise your head, and you will bruise his heel.” A proto-gospel, whispered in the ruins.',
        triggerPhrase: 'whispered in the ruins',
        triggerActionLabel: 'Kindle the Hidden Promise',
        interactiveEffectDescription:
          'Breaks a warm amber ray through the dusk clouds.',
        hebrewLexicon: {
          hebrew: 'זֶרַע',
          transliteration: 'Zera',
          meaning: 'Seed / Promised Offspring',
          insight:
            'Even inside the consequences of the fall, God plants the first promise of a Redeemer.',
        },
        reflectionPrompt:
          'Even in the curse, a promise was planted: the serpent’s head would be bruised. Where do you see hope hiding inside your hardest places?',
        reflectionContext:
          'Genesis 3:15 is the first glimmer of redemptive hope in Scripture.',
        durationSec: 72,
        sceneTheme: 'first-light',
        canvasMode: 'sacred-dust',
        animationConfig: {
          motif: 'e2-ch6-promised-seed',
          label: 'Zera — The Crushed Serpent & The Promised Seed in the Ruins',
          description:
            'A vertical beam of golden light pierces dark thorns and a recoiling serpent as a living shoot sprouts from the soil.',
          tintTop: [0.06, 0.04, 0.08],
          tintHorizon: [0.72, 0.48, 0.24],
          tintGround: [0.12, 0.08, 0.06],
          weights: { ocean: 0.10, dawn: 0.58, forest: 0.22, cosmos: 0.10 },
          windIntensity: 0.46,
          lightBloom: 0.72,
          waterParting: 0.20,
          accentGlow: '#FBBF24',
        },
      },
      {
        number: 7,
        title: 'Clothed in Grace, East of Eden',
        scriptureRef: 'Genesis 3:21–24',
        scriptureText:
          'The LORD God made garments of skin for Adam and his wife, and clothed them.',
        soundCue:
          'A slow, heavy, resonant sound — like a great gate closing, but far away.',
        paragraphs: [
          'But even here, a mercy: God makes them garments of skin. Something had to die to cover their shame. An innocent life given, so they could be clothed in grace.',
          'This is the first sacrifice. The first glimpse of redemption — that God will kill to cover, will shed blood to make modest the ones who rebelled.',
          'And then — exile. God sends them out from the garden, lest they eat of the Tree of Life and live forever in brokenness. East of Eden. Away from the presence. Cherubim and a flaming sword guard the way back.',
          'This is not merely punishment. It is protection. Eternal life in a state of separation from God would be hell. So God in His mercy closes the way — and begins the long, patient work of opening another.',
        ],
        narrative:
          'But even here, a mercy: God makes them garments of skin. Something had to die to cover their shame. An innocent life given, so they could be clothed in grace. And then — exile. This is not merely punishment. It is protection. So God in His mercy closes the way — and begins the long, patient work of opening another.',
        triggerPhrase: 'clothed in grace',
        triggerActionLabel: 'Part the Evening Rain',
        interactiveEffectDescription:
          'Parts the rain and mist to reveal a quiet horizon of hope.',
        hebrewLexicon: {
          hebrew: 'כָּתְנוֹת עוֹר',
          transliteration: 'Kotnot Or',
          meaning: 'Garments of skin / Covering of grace',
          insight:
            'Before sending them out, God tenderly clothes their vulnerability Himself.',
        },
        reflectionPrompt:
          'Exile as protection — mercy in the closing of a door. What closed door might actually be saving you?',
        reflectionContext:
          'Even judgment in Genesis is tempered with protective mercy.',
        durationSec: 74,
        sceneTheme: 'deluge-ark',
        canvasMode: 'sky-vault',
        animationConfig: {
          motif: 'e2-ch7-flaming-sword',
          label: 'Kotnot Or — Cherubim & The Flaming Sword East of Eden',
          description:
            'Animates the eastern Gate of Eden, sweeping Cherubim wings, and a whirling Flaming Sword casting embers into the night.',
          tintTop: [0.07, 0.03, 0.06],
          tintHorizon: [0.85, 0.42, 0.20],
          tintGround: [0.16, 0.07, 0.06],
          weights: { ocean: 0.30, dawn: 0.50, forest: 0.10, cosmos: 0.10 },
          windIntensity: 0.58,
          lightBloom: 0.80,
          waterParting: 0.65,
          accentGlow: '#FB923C',
        },
      },
      {
        number: 8,
        title: 'The First Thread of a Promise',
        scriptureRef: 'Genesis 3:22–24',
        scriptureText:
          'The leaves of the tree are for the healing of the nations.',
        soundCue:
          'The mournful wind remains, but underneath, a faint, steady, deep pulse — like a distant, slow heartbeat.',
        paragraphs: [
          'So the story of the Garden is not merely about a “fall.” It is about the fracture of trust. It is about the choice to seize rather than receive. It is about the immediate consequence: not thunderbolts from heaven, but hiding from Love.',
          'And it is about the first thread of a promise — that the One who walked in the garden will walk into the dust again. That the voice that called “Where are you?” will one day call “Lazarus, come forth!” And that the way to the Tree of Life, though guarded, is not forgotten. It will reopen, in a city where leaves are for the healing of the nations.',
        ],
        narrative:
          'So the story of the Garden is not merely about a “fall.” It is about the fracture of trust. And it is about the first thread of a promise — that the One who walked in the garden will walk into the dust again. And that the way to the Tree of Life, though guarded, is not forgotten. It will reopen, in a city where leaves are for the healing of the nations.',
        triggerPhrase: 'healing of the nations',
        triggerActionLabel: 'Awaken the Living River',
        interactiveEffectDescription:
          'Illuminates emerald and gold reflections across the flowing river.',
        hebrewLexicon: {
          hebrew: 'רְפוּאָה',
          transliteration: 'Refuah',
          meaning: 'Healing / Restoration',
          insight:
            'The story that begins in a garden ultimately leads to a restored garden-city where the Tree of Life heals the nations.',
        },
        reflectionPrompt:
          'The Tree of Life is not forgotten. The leaves are for the healing of the nations. What hope does that stir in you?',
        reflectionContext:
          'Scripture’s arc bends from the guarded tree of Genesis 3 to the open Tree of Life in Revelation 22.',
        durationSec: 68,
        sceneTheme: 'eden-mist',
        canvasMode: 'emerald-spores',
        animationConfig: {
          motif: 'e2-ch8-healing-river',
          label: 'Refuah — The River of Life & Leaves for the Healing of Nations',
          description:
            'A crystal river of life flows between twin banks of luminous emerald healing trees.',
          tintTop: [0.02, 0.07, 0.06],
          tintHorizon: [0.46, 0.74, 0.56],
          tintGround: [0.04, 0.18, 0.14],
          weights: { ocean: 0.28, dawn: 0.22, forest: 0.50, cosmos: 0.0 },
          windIntensity: 0.30,
          lightBloom: 0.74,
          waterParting: 0.35,
          accentGlow: '#34D399',
        },
      },
      {
        number: 9,
        title: 'Footsteps in the Cool of the Day',
        scriptureRef: 'Genesis 3:8–9',
        scriptureText:
          'And they heard the sound of the LORD God walking in the garden in the cool of the day.',
        soundCue:
          'A slow, aching melody, with a single high note of hope that lingers above it.',
        paragraphs: [
          'Where are you hiding today? What fig leaves have you sewn? And can you hear, even now, the sound of footsteps in the garden — the God who still walks toward you in the cool of the day, still calling, still waiting to clothe you in something better than leaves?',
          'You are still loved, east of Eden.',
        ],
        narrative:
          'Where are you hiding today? What fig leaves have you sewn? And can you hear, even now, the sound of footsteps in the garden — the God who still walks toward you in the cool of the day, still calling, still waiting to clothe you in something better than leaves? You are still loved, east of Eden.',
        triggerPhrase: 'still loved, east of Eden',
        triggerActionLabel: 'Rest in Evening Grace',
        interactiveEffectDescription:
          'Settles the twilight water and stars into warm golden peace.',
        hebrewLexicon: {
          hebrew: 'רוּחַ הַיּוֹם',
          transliteration: 'Ruach ha-Yom',
          meaning: 'The breeze / cool of the day',
          insight:
            'Even east of Eden, God continues to walk toward humanity in the evening breeze.',
        },
        reflectionPrompt:
          'You are still loved, east of Eden. How will you walk forward knowing that?',
        reflectionContext:
          'Grace always takes the first step toward those who are hiding.',
        durationSec: 56,
        sceneTheme: 'sabbath-stillness',
        canvasMode: 'sabbath-breath',
        animationConfig: {
          motif: 'e2-ch9-east-of-eden-grace',
          label: 'Ruach ha-Yom — Still Loved East of Eden',
          description:
            'A warm golden pathway winds across twilight hills beneath the evening star and gentle breeze.',
          tintTop: [0.05, 0.04, 0.11],
          tintHorizon: [0.68, 0.52, 0.34],
          tintGround: [0.10, 0.09, 0.14],
          weights: { ocean: 0.20, dawn: 0.52, forest: 0.14, cosmos: 0.14 },
          windIntensity: 0.22,
          lightBloom: 0.68,
          waterParting: 0.15,
          accentGlow: '#EAB308',
        },
      },
    ],
  },
  {
    id: 'e3-the-ark-and-the-olive-leaf',
    code: 'E3',
    number: '03',
    series: 'BIBLEVERSE',
    category: 'Primeval History',
    title: 'The Deep Unbound',
    subtitle: 'Rain, Refuge, and the Olive Leaf',
    fullTitle: 'The Deep Unbound — Rain, Refuge, and the Olive Leaf',
    summary:
      'When violence unravels creation, a floating sanctuary carries a remnant of hope across the silent waters.',
    bookRef: 'Genesis 6:5–9:17',
    durationMin: 10,
    accentColor: '#38BDF8',
    badgeTextColor: 'text-sky-300',
    heroTheme: 'deluge-ark',
    heroCanvasMode: 'tectonic-sea',
    chapters: [
      {
        number: 1,
        title: 'The Grieving Heart',
        scriptureRef: 'Genesis 6:5–8',
        scriptureText:
          'The LORD regretted that he had made human beings on the earth, and his heart was deeply troubled… But Noah found favor in the eyes of the LORD.',
        hebrewQuote: 'Vayit’atzev el-libbo.',
        hebrewTranslation: 'And He was grieved to His heart.',
        soundCue:
          'Distant thunder rolling across darkened hills, accompanied by a low, mournful cello solo.',
        paragraphs: [
          'We often imagine judgment as cold anger, but Genesis pulls back the curtain to reveal something far more piercing: grief. God’s heart is “deeply pained” as human violence fills the earth.',
          'Yet in the gathering storm, one quiet life walks in step with grace.',
        ],
        narrative:
          'We often imagine judgment as cold anger, but Genesis pulls back the curtain to reveal something far more piercing: grief. God’s heart is “deeply pained” as human violence fills the earth. Yet in the gathering storm, one quiet life walks in step with grace.',
        triggerPhrase: 'walks in step with grace',
        triggerActionLabel: 'Part the Storm Clouds',
        interactiveEffectDescription:
          'Parts the heavy rain clouds with a quiet beam of silver grace over the swells.',
        hebrewLexicon: {
          hebrew: 'חֵן',
          transliteration: 'Chen',
          meaning: 'Grace / Unmerited favor',
          insight:
            'Genesis 6:8 is the first appearance of "chen" (grace) in the Bible — spelled backward in Hebrew, its letters form "Noach" (Noah).',
        },
        reflectionPrompt:
          'What does it mean to you that God experiences grief rather than indifference when the world is wounded?',
        reflectionContext:
          'The Hebrew phrase describes acute heartbreak — the sorrow of a parent watching beloved children harm one another.',
        durationSec: 65,
        sceneTheme: 'deluge-ark',
        canvasMode: 'sky-vault',
        animationConfig: {
          motif: 'e3-ch1-deluge-ark',
          label: 'Chen — The Gathering Deluge & The Floating Ark Sanctuary',
          description:
            'Slanting tempest rain and deep ocean swells cradle the timber Ark with its warm, lantern-lit window.',
          tintTop: [0.02, 0.04, 0.08],
          tintHorizon: [0.24, 0.34, 0.46],
          tintGround: [0.02, 0.06, 0.12],
          weights: { ocean: 0.90, dawn: 0.10, forest: 0.0, cosmos: 0.0 },
          windIntensity: 0.88,
          lightBloom: 0.30,
          waterParting: 0.55,
          accentGlow: '#38BDF8',
        },
      },
      {
        number: 2,
        title: 'God Remembered Noah',
        scriptureRef: 'Genesis 8:1',
        scriptureText:
          'But God remembered Noah and all the wild animals and the livestock that were with him in the ark, and he sent a wind over the earth, and the waters receded.',
        hebrewQuote: 'Vayizkor Elohim et-Noach.',
        hebrewTranslation: 'And God remembered Noah.',
        soundCue:
          'Heavy rain subsides into the creaking of timber on calm swells. Then a fresh, warm wind sweeps across the water.',
        paragraphs: [
          'At the exact midpoint of the flood narrative stands its hinge: “God remembered Noah.”',
          'And just as in Genesis 1, God sends His Ruach — His Wind, His Spirit — blowing across the chaotic deep to part the waters once again.',
        ],
        narrative:
          'At the exact midpoint of the flood narrative stands its hinge: “God remembered Noah.” And just as in Genesis 1, God sends His Ruach — His Wind, His Spirit — blowing across the chaotic deep to part the waters once again.',
        triggerPhrase: 'God remembered Noah',
        triggerActionLabel: 'Send the Receding Wind',
        interactiveEffectDescription:
          'Sweeps calming wind currents across the dark ocean swells.',
        hebrewLexicon: {
          hebrew: 'וַיִּזְכֹּר אֱלֹהִים',
          transliteration: 'Vayizkor Elohim',
          meaning: 'And God remembered with covenant action',
          insight:
            'In Hebrew, divine "remembering" always initiates rescue and renewal in history.',
        },
        reflectionPrompt:
          'In seasons when you feel adrift inside a closed ark with no horizon in sight, what helps you trust that you are remembered?',
        reflectionContext:
          'When God "remembers" (zakar), He acts decisively to fulfill His promise.',
        durationSec: 65,
        sceneTheme: 'primordial-waters',
        canvasMode: 'ruach-wind',
        animationConfig: {
          motif: 'e3-ch2-receding-wind-ark',
          label: 'Vayizkor Elohim — Receding Wind & Emergent Peaks of Ararat',
          description:
            'Sweeping wind currents part the floodwaters as the twin mountain peaks of Ararat emerge on the horizon.',
          tintTop: [0.03, 0.07, 0.14],
          tintHorizon: [0.42, 0.56, 0.68],
          tintGround: [0.03, 0.10, 0.18],
          weights: { ocean: 0.75, dawn: 0.25, forest: 0.0, cosmos: 0.0 },
          windIntensity: 0.76,
          lightBloom: 0.54,
          waterParting: 0.78,
          accentGlow: '#7DD3FC',
        },
      },
      {
        number: 3,
        title: 'A Freshly Plucked Olive Leaf',
        scriptureRef: 'Genesis 8:10–11',
        scriptureText:
          'When the dove returned to him in the evening, there in its beak was a freshly plucked olive leaf!',
        soundCue:
          'Soft flutter of dove wings landing on a wooden sill, and sunlight breaking through parting clouds.',
        paragraphs: [
          'After forty days of waiting, a small white bird returns at twilight carrying a single green leaf in its beak. New creation has begun quietly on the slopes below.',
          'And when the clouds clear, the Warrior hangs up His bow in the clouds — promising never again to let the floodwaters win.',
        ],
        narrative:
          'After forty days of waiting, a small white bird returns at twilight carrying a single green leaf in its beak. New creation has begun quietly on the slopes below. And when the clouds clear, the Warrior hangs up His bow in the clouds — promising never again to let the floodwaters win.',
        triggerPhrase: 'a single green leaf in its beak',
        triggerActionLabel: 'Unfurl the Covenant Dawn',
        interactiveEffectDescription:
          'Illuminates warm golden dawn rays over the tranquil receding sea.',
        hebrewLexicon: {
          hebrew: 'קֶשֶׁת בֶּעָנָן',
          transliteration: 'Qeshet be-Anan',
          meaning: 'Bow hung in the clouds',
          insight:
            'The warrior’s bow is unstrung and hung in the sky pointing away from earth as an eternal treaty of peace.',
        },
        reflectionPrompt:
          'What small “olive leaf” — a quiet sign of renewal after a long storm — have you noticed recently?',
        reflectionContext:
          'The rainbow (keshet) is hung in the sky as an emblem of peace with the earth.',
        durationSec: 65,
        sceneTheme: 'first-light',
        canvasMode: 'yehi-or-dawn',
        animationConfig: {
          motif: 'e3-ch3-dove-olive-rainbow',
          label: 'Qeshet be-Anan — The Returning Dove with Olive Leaf & Covenant Bow',
          description:
            'A white dove glides across the clearing sky with a fresh green olive leaf beneath a luminous covenant rainbow arc.',
          tintTop: [0.06, 0.08, 0.16],
          tintHorizon: [0.88, 0.66, 0.36],
          tintGround: [0.12, 0.20, 0.24],
          weights: { ocean: 0.28, dawn: 0.62, forest: 0.10, cosmos: 0.0 },
          windIntensity: 0.26,
          lightBloom: 0.88,
          waterParting: 0.45,
          accentGlow: '#FCD34D',
        },
      },
    ],
  },
  {
    id: 'e4-stars-over-the-desert',
    code: 'E4',
    number: '04',
    series: 'BIBLEVERSE',
    category: 'Covenant & Promise',
    title: 'Stars Over the Tent',
    subtitle: 'The Call and Covenant of Abraham',
    fullTitle: 'Stars Over the Tent — The Call and Covenant of Abraham',
    summary:
      'An aging nomad steps into the unknown and looks up at a desert sky brimming with impossible promise.',
    bookRef: 'Genesis 12:1–15:6',
    durationMin: 11,
    accentColor: '#D4A853',
    badgeTextColor: 'text-amber-300',
    heroTheme: 'desert-stars',
    heroCanvasMode: 'star-constellations',
    chapters: [
      {
        number: 1,
        title: 'Go to the Land I Will Show You',
        scriptureRef: 'Genesis 12:1–3',
        scriptureText:
          'Go from your country, your people and your father’s household to the land I will show you… and all peoples on earth will be blessed through you.',
        hebrewQuote: 'Lekh-lekha.',
        hebrewTranslation: 'Go forth — walk toward the land I will show you.',
        soundCue:
          'Crackling desert campfire, soft crunch of footsteps on warm sand, and a lone oud melody drifting into the night.',
        paragraphs: [
          'Redemption pivots from all humanity to one childless couple in Mesopotamia. Notice the invitation: not “Go to the land I have mapped out in advance,” but “the land I will show you as we walk.”',
          'And the goal of being blessed is never privilege — it is to become a blessing for every family on earth.',
        ],
        narrative:
          'Redemption pivots from all humanity to one childless couple in Mesopotamia. Notice the invitation: not “Go to the land I have mapped out in advance,” but “the land I will show you as we walk.” And the goal of being blessed is never privilege — it is to become a blessing for every family on earth.',
        triggerPhrase: 'the land I will show you as we walk',
        triggerActionLabel: 'Kindle the Pilgrim Horizon',
        interactiveEffectDescription:
          'Sparks warm campfire embers drifting upward toward the desert night sky.',
        hebrewLexicon: {
          hebrew: 'לֶךְ־לְךָ',
          transliteration: 'Lekh-Lekha',
          meaning: 'Go forth / Journey inward and outward',
          insight:
            'A call to leave behind the familiar security of Babel and step into a pilgrim life of blessing.',
        },
        reflectionPrompt:
          'Where is your life asking you to take the next step with a Guide rather than demanding the entire map upfront?',
        reflectionContext:
          'The fivefold blessing of Genesis 12:1–3 directly answers the fractures of Genesis 1–11.',
        durationSec: 68,
        sceneTheme: 'desert-stars',
        canvasMode: 'sacred-dust',
        animationConfig: {
          motif: 'e4-ch1-pilgrim-tent-fire',
          label: 'Lekh-Lekha — Nomad Tent & Pilgrim Campfire on the Dunes',
          description:
            'Desert sand dunes, a pitched nomad tent, and a crackling pilgrim campfire send glowing embers toward the night horizon.',
          tintTop: [0.06, 0.04, 0.09],
          tintHorizon: [0.76, 0.46, 0.22],
          tintGround: [0.22, 0.12, 0.07],
          weights: { ocean: 0.0, dawn: 0.55, forest: 0.0, cosmos: 0.45 },
          windIntensity: 0.38,
          lightBloom: 0.66,
          waterParting: 0.10,
          accentGlow: '#F59E0B',
        },
      },
      {
        number: 2,
        title: 'Look Up at the Sky and Count the Stars',
        scriptureRef: 'Genesis 15:5–6',
        scriptureText:
          'He took him outside and said, “Look up at the sky and count the stars—if indeed you can count them.” Then he said to him, “So shall your offspring be.”',
        hebrewQuote: 'Habet-na hashamaymah u-sefor hakokhavim.',
        hebrewTranslation: 'Look up now at the heavens and count the stars.',
        soundCue:
          'The tent flap opens to the vast, open acoustic space of the desert night, shimmering with high string harmonics.',
        paragraphs: [
          'Abram is old, his tent is quiet, and his hands are empty. So God leads him outside the small ceiling of his anxieties and points him to the galaxies overhead.',
          'Every night after that, the sky itself became a cathedral of reminders. And Abram “believed the LORD” — literally, he leaned his whole weight upon God’s promise.',
        ],
        narrative:
          'Abram is old, his tent is quiet, and his hands are empty. So God leads him outside the small ceiling of his anxieties and points him to the galaxies overhead. Every night after that, the sky itself became a cathedral of reminders. And Abram “believed the LORD” — literally, he leaned his whole weight upon God’s promise.',
        triggerPhrase: 'count the stars',
        triggerActionLabel: 'Illuminate the Desert Sky',
        interactiveEffectDescription:
          'Reveals a deep cosmic nebula and shimmering starlight over the desert dunes.',
        hebrewLexicon: {
          hebrew: 'וְהֶאֱמִן בַּיהוָה',
          transliteration: 'Ve-he’emin ba-Adonai',
          meaning: 'And he leaned his weight / trusted in the LORD',
          insight:
            'From the root "aman" (whence "Amen") — to find firm, unshakable footing in God’s word.',
        },
        reflectionPrompt:
          'What “tent ceiling” of worry do you need to step outside of tonight so you can look up at a larger horizon?',
        reflectionContext:
          'The Hebrew word "he’emin" (believed) is the root of our word "Amen."',
        durationSec: 70,
        sceneTheme: 'celestial-spheres',
        canvasMode: 'star-constellations',
        animationConfig: {
          motif: 'e4-ch2-counted-stars',
          label: 'Ha-Kokhavim — Abraham Beneath the Cathedral of Constellations',
          description:
            'Luminous constellation geometry and a vast galactic arch of stars wheel across the desert sky above the open tent.',
          tintTop: [0.02, 0.02, 0.07],
          tintHorizon: [0.38, 0.28, 0.56],
          tintGround: [0.08, 0.06, 0.12],
          weights: { ocean: 0.05, dawn: 0.05, forest: 0.0, cosmos: 0.90 },
          windIntensity: 0.24,
          lightBloom: 0.72,
          waterParting: 0.15,
          accentGlow: '#EAB308',
        },
      },
    ],
  },
];
