import { ChapterVisualMotif } from '../utils/storybookLogic';

export interface LexiconEntry {
  readonly id: string;
  readonly language: 'Hebrew' | 'Greek';
  readonly originalScript: string;
  readonly transliteration: string;
  readonly pronunciation: string;
  readonly strongsNumber: string;
  readonly primaryMeaning: string;
  readonly literalMetaphor: string;
  readonly contemplativeNote: string;
  readonly matchKeywords: readonly string[];
  readonly resonantFrequencyHz: number;
}

export const LEXICON_ENTRIES: readonly LexiconEntry[] = [
  {
    id: 'bereshit',
    language: 'Hebrew',
    originalScript: 'בְּרֵאשִׁית',
    transliteration: 'Bereshit',
    pronunciation: 'beh-ray-SHEET',
    strongsNumber: 'H7225',
    primaryMeaning: 'In the beginning / At the head of unfolding time',
    literalMetaphor: 'From rosh (head/summit) and the open letter Bet (ב) — a home open toward the future.',
    contemplativeNote:
      'Creation does not begin as a closed philosophical system, but as a hospitable house with its front door wide open to history, love, and risk.',
    matchKeywords: ['beginning', 'bereshit', 'before'],
    resonantFrequencyHz: 293.66,
  },
  {
    id: 'tehom',
    language: 'Hebrew',
    originalScript: 'תְּהוֹם',
    transliteration: 'Tehom',
    pronunciation: 'teh-HOME',
    strongsNumber: 'H8415',
    primaryMeaning: 'The Deep / Primordial Abyss',
    literalMetaphor: 'Surging, unmeasured subterranean and cosmic waters.',
    contemplativeNote:
      'In Scripture, the deep is never an enemy to be violently slain; it is raw, untamed potential over which the Spirit hovers until order is sung into being.',
    matchKeywords: ['deep', 'depths', 'abyss', 'tohu', 'waters'],
    resonantFrequencyHz: 110.0,
  },
  {
    id: 'ruach',
    language: 'Hebrew',
    originalScript: 'רוּחַ',
    transliteration: 'Ruach',
    pronunciation: 'ROO-akh',
    strongsNumber: 'H7307',
    primaryMeaning: 'Spirit / Breath / Wind',
    literalMetaphor: 'Moving air — from a gentle maternal sigh to a parting gale.',
    contemplativeNote:
      'The same word names the wind over the chaotic sea, the breeze in the cool of the garden, and the divine breath inside human lungs.',
    matchKeywords: ['spirit', 'breath', 'wind', 'ruach', 'breathing', 'hovering'],
    resonantFrequencyHz: 261.63,
  },
  {
    id: 'or',
    language: 'Hebrew',
    originalScript: 'אוֹר',
    transliteration: 'Or',
    pronunciation: 'OHR',
    strongsNumber: 'H216',
    primaryMeaning: 'Light / Daybreak / Illumination',
    literalMetaphor: 'Firstborn radiance spoken before sun or stars existed.',
    contemplativeNote:
      'Light in Genesis is not merely optical physics; it is the condition for truth, visibility, and unashamed communion.',
    matchKeywords: ['light', 'dawn', 'morning', 'radiance', 'shone', 'glow'],
    resonantFrequencyHz: 329.63,
  },
  {
    id: 'tov',
    language: 'Hebrew',
    originalScript: 'טוֹב',
    transliteration: 'Tov',
    pronunciation: 'TOHV',
    strongsNumber: 'H2896',
    primaryMeaning: 'Good / Beautiful / Life-Giving',
    literalMetaphor: 'A well-tuned instrument resounding in right proportion.',
    contemplativeNote:
      'When God beholds creation and calls it Tov, it is the delight of an artist declaring that the work is harmonious and hospitable to life.',
    matchKeywords: ['good', 'beautiful', 'harmony', 'blessed'],
    resonantFrequencyHz: 392.0,
  },
  {
    id: 'tzelem',
    language: 'Hebrew',
    originalScript: 'צֶלֶם',
    transliteration: 'Tzelem',
    pronunciation: 'TSEH-lem',
    strongsNumber: 'H6754',
    primaryMeaning: 'Sacred Image / Living Likeness',
    literalMetaphor: 'A carved royal statue placed in a province to represent the sovereign.',
    contemplativeNote:
      'Every human being—not merely kings or priests—is crowned as a living icon of God, called to reflect divine tenderness into the earth.',
    matchKeywords: ['image', 'likeness', 'reflection', 'mirror', 'crown'],
    resonantFrequencyHz: 349.23,
  },
  {
    id: 'adamah',
    language: 'Hebrew',
    originalScript: 'אֲדָמָה',
    transliteration: 'Adamah',
    pronunciation: 'ah-dah-MAH',
    strongsNumber: 'H127',
    primaryMeaning: 'Red Earth / Living Soil',
    literalMetaphor: 'Warm, iron-rich terracotta clay from which humanity (Adam) is sculpted.',
    contemplativeNote:
      'We are dust kissed by divinity—forever bound to the humility of the soil and the majesty of heaven’s breath.',
    matchKeywords: ['dust', 'clay', 'earth', 'soil', 'ground'],
    resonantFrequencyHz: 220.0,
  },
  {
    id: 'shabbat',
    language: 'Hebrew',
    originalScript: 'שַׁבָּת',
    transliteration: 'Shabbat',
    pronunciation: 'shah-BAHT',
    strongsNumber: 'H7676',
    primaryMeaning: 'Sabbath / Sacred Ceasing',
    literalMetaphor: 'To stop, exhale, and inhabit a sanctuary built out of time.',
    contemplativeNote:
      'The climax of creation is not humanity’s labor, but God’s rest—an invitation to know that we are loved before we produce anything.',
    matchKeywords: ['sabbath', 'rest', 'rested', 'seventh', 'stillness', 'sanctuary'],
    resonantFrequencyHz: 246.94,
  },
  {
    id: 'eden',
    language: 'Hebrew',
    originalScript: 'עֵדֶן',
    transliteration: 'Eden',
    pronunciation: 'AY-den',
    strongsNumber: 'H5731',
    primaryMeaning: 'Delight / Lush Abundance',
    literalMetaphor: 'A well-watered mountain garden where heaven and earth overlap.',
    contemplativeNote:
      'Eden is the archetype of the cosmic temple—where rivers flow outward to nourish the world and work is joyful stewardship.',
    matchKeywords: ['garden', 'eden', 'rivers', 'trees', 'canopy'],
    resonantFrequencyHz: 277.18,
  },
  {
    id: 'ayekah',
    language: 'Hebrew',
    originalScript: 'אַיֶּכָּה',
    transliteration: 'Ayekah',
    pronunciation: 'ah-yeh-KAH',
    strongsNumber: 'H335',
    primaryMeaning: 'Where are you?',
    literalMetaphor: 'The lament of a seeking parent walking through the evening mist.',
    contemplativeNote:
      'God’s first word after human rebellion is not an indictment, but a vulnerable question inviting the hidden soul back into the light.',
    matchKeywords: ['where', 'hiding', 'footsteps', 'voice', 'called'],
    resonantFrequencyHz: 311.13,
  },
  {
    id: 'zera',
    language: 'Hebrew',
    originalScript: 'זֶרַע',
    transliteration: 'Zera',
    pronunciation: 'ZEH-rah',
    strongsNumber: 'H2233',
    primaryMeaning: 'Promised Seed / Offspring',
    literalMetaphor: 'A small grain buried in fractured soil that shatters the stone above it.',
    contemplativeNote:
      'Even in the ruins of the fall, a quiet botanical promise is planted—tracing a golden line from Eve’s seed to the empty tomb.',
    matchKeywords: ['seed', 'promise', 'offspring', 'bruise', 'shoot'],
    resonantFrequencyHz: 369.99,
  },
  {
    id: 'chen',
    language: 'Hebrew',
    originalScript: 'חֵן',
    transliteration: 'Chen',
    pronunciation: 'KHEN',
    strongsNumber: 'H2580',
    primaryMeaning: 'Grace / Unmerited Favor',
    literalMetaphor: 'To bend down in tender shelter over one who is weary.',
    contemplativeNote:
      'Reversed, the letters of Noah (נֹחַ) spell Chen (חֵן)—grace found in the eyes of God before the deluge ever begins.',
    matchKeywords: ['grace', 'favor', 'ark', 'noah', 'mercy'],
    resonantFrequencyHz: 440.0,
  },
  {
    id: 'qeshet',
    language: 'Hebrew',
    originalScript: 'קֶשֶׁת',
    transliteration: 'Qeshet',
    pronunciation: 'KEH-shet',
    strongsNumber: 'H7198',
    primaryMeaning: 'Covenant Bow / Rainbow',
    literalMetaphor: 'The warrior’s battle bow unstrung and hung in the storm clouds pointing upward.',
    contemplativeNote:
      'The rainbow is not mere decoration; it is God hanging up the weapon of judgment, Aimed toward heaven’s own heart rather than the earth.',
    matchKeywords: ['bow', 'rainbow', 'covenant', 'clouds', 'olive', 'dove'],
    resonantFrequencyHz: 493.88,
  },
  {
    id: 'kokhavim',
    language: 'Hebrew',
    originalScript: 'כּוֹכָבִים',
    transliteration: 'Kokhavim',
    pronunciation: 'koh-khah-VEEM',
    strongsNumber: 'H3556',
    primaryMeaning: 'Stars / Blazing Constellations',
    literalMetaphor: 'Pinpricks of eternal fire scattered across the desert night.',
    contemplativeNote:
      'When Abraham’s vision shrinks to the walls of his barren tent, God leads him outside to read covenantal fidelity written across the cosmos.',
    matchKeywords: ['stars', 'star', 'constellations', 'heavens', 'tent', 'count'],
    resonantFrequencyHz: 523.25,
  },
  {
    id: 'logos',
    language: 'Greek',
    originalScript: 'Λόγος',
    transliteration: 'Logos',
    pronunciation: 'LOH-goss',
    strongsNumber: 'G3056',
    primaryMeaning: 'The Living Word / Cosmic Meaning',
    literalMetaphor: 'The spoken melody and rational architecture holding all things together.',
    contemplativeNote:
      'John 1 echoes Genesis 1: the voice that whispered "Yehi Or" into the primordial dark eventually took on flesh and pitched His tent among us.',
    matchKeywords: ['word', 'spoken', 'voice', 'spoke', 'symphony', 'melody'],
    resonantFrequencyHz: 587.33,
  },
];

export interface LexiconTextToken {
  readonly text: string;
  readonly entry?: LexiconEntry;
}

/**
 * Tokenizes a narrative paragraph so that when the Lexicon Lens is active,
 * up to 3 distinct theological root words per paragraph are illuminated for inspection
 * without cluttering every single word.
 */
export function tokenizeParagraphWithLexicon(
  paragraph: string,
  enabled: boolean
): LexiconTextToken[] {
  if (!enabled || !paragraph) {
    return [{ text: paragraph }];
  }

  // Build lookup from lowercase keyword -> LexiconEntry
  const keywordMap = new Map<string, LexiconEntry>();
  for (const entry of LEXICON_ENTRIES) {
    for (const kw of entry.matchKeywords) {
      if (!keywordMap.has(kw.toLowerCase())) {
        keywordMap.set(kw.toLowerCase(), entry);
      }
    }
  }

  // Split by word boundaries while preserving punctuation and spaces
  const parts = paragraph.split(/(\b[A-Za-z']+\b)/g);
  const tokens: LexiconTextToken[] = [];
  const usedEntryIds = new Set<string>();

  for (const part of parts) {
    if (!part) continue;
    const cleanLower = part.toLowerCase();
    const matchedEntry = keywordMap.get(cleanLower);

    if (
      matchedEntry &&
      !usedEntryIds.has(matchedEntry.id) &&
      usedEntryIds.size < 4
    ) {
      usedEntryIds.add(matchedEntry.id);
      tokens.push({ text: part, entry: matchedEntry });
    } else {
      if (tokens.length > 0 && !tokens[tokens.length - 1].entry) {
        tokens[tokens.length - 1] = {
          text: tokens[tokens.length - 1].text + part,
        };
      } else {
        tokens.push({ text: part });
      }
    }
  }

  return tokens;
}

export interface LectioDivinaGuide {
  readonly lectio: string;
  readonly meditatio: string;
  readonly oratio: string;
  readonly contemplatio: string;
}

export function getLectioDivinaPromptsForChapter(
  chapterTitle: string,
  reflectionPrompt: string,
  hebrewQuote?: string
): LectioDivinaGuide {
  return {
    lectio: hebrewQuote
      ? `Read slowly aloud: "${hebrewQuote}" — let the cadence of "${chapterTitle}" settle in your ear.`
      : `Read the words of "${chapterTitle}" slowly, noticing which single phrase shimmers with quiet weight.`,
    meditatio: reflectionPrompt,
    oratio:
      'Turn your observation into an honest, unhurried conversation—naming where you feel hidden, weary, or hopeful.',
    contemplatio:
      'Release the need for words. Sit for thirty seconds in the ambient stillness and behold the living scene.',
  };
}

export interface TheologicalTimelineNode {
  readonly episodeId: string;
  readonly chapterNumber: number;
  readonly chapterIndex: number;
  readonly scripturalRef: string;
  readonly title: string;
  readonly motifName: string;
  readonly motif: ChapterVisualMotif;
  readonly summary: string;
}

export interface TheologicalThread {
  readonly id: string;
  readonly title: string;
  readonly hebrewAnchor: string;
  readonly subtitle: string;
  readonly accentColor: string;
  readonly nodes: readonly TheologicalTimelineNode[];
  readonly canonicalEcho: {
    readonly ref: string;
    readonly fulfillment: string;
  };
}

export const THEOLOGICAL_THREADS: readonly TheologicalThread[] = [
  {
    id: 'waters-and-chaos',
    title: 'From Primordial Waters to the Parted Deep',
    hebrewAnchor: 'תְּהוֹם · Tehom & Ruach',
    subtitle: 'How God hovers over chaotic waters and turns the abyss into a sanctuary of life.',
    accentColor: '#60A5FA',
    nodes: [
      {
        episodeId: 'e1-before-the-beginning',
        chapterNumber: 1,
        chapterIndex: 0,
        scripturalRef: 'Genesis 1:1–2',
        title: 'The Abyssal Seashell Resonance',
        motifName: 'Abyssal Resonance',
        motif: 'e1-ch1-abyssal-resonance',
        summary: 'Before light is spoken, the deep swells in darkness while the Spirit listens.',
      },
      {
        episodeId: 'e1-before-the-beginning',
        chapterNumber: 4,
        chapterIndex: 3,
        scripturalRef: 'Genesis 1:2b',
        title: 'The Hovering Wings of Ruach',
        motifName: 'Hovering Ruach',
        motif: 'e1-ch4-hovering-ruach',
        summary: 'Divine breath flutters tenderly over the waters like a mother eagle over her nest.',
      },
      {
        episodeId: 'e3-the-ark-and-the-olive-leaf',
        chapterNumber: 1,
        chapterIndex: 0,
        scripturalRef: 'Genesis 7:11–18',
        title: 'The Gathering Deluge & Floating Ark',
        motifName: 'Deluge & Ark',
        motif: 'e3-ch1-deluge-ark',
        summary: 'When the fountains of the great deep burst open, a timber sanctuary carries the seed of life.',
      },
      {
        episodeId: 'e3-the-ark-and-the-olive-leaf',
        chapterNumber: 2,
        chapterIndex: 1,
        scripturalRef: 'Genesis 8:1–4',
        title: 'God Remembered Noah — The Receding Wind',
        motifName: 'Receding Wind',
        motif: 'e3-ch2-receding-wind-ark',
        summary: 'Once again a Ruach wind sweeps across the floodwaters, revealing the peaks of Ararat.',
      },
    ],
    canonicalEcho: {
      ref: 'Exodus 14:21 · Mark 4:39 · Revelation 22:1',
      fulfillment:
        'Echoes forward to the parting of the Red Sea, Christ calming the Galilean storm with a word, and the crystal River of Life.',
    },
  },
  {
    id: 'uncreated-light-and-fire',
    title: 'The Architecture of Sacred Light & Fire',
    hebrewAnchor: 'יְהִי אוֹר · Yehi Or',
    subtitle: 'From the first dawn prism to the flaming sword and the cathedral of desert stars.',
    accentColor: '#F59E0B',
    nodes: [
      {
        episodeId: 'e1-before-the-beginning',
        chapterNumber: 5,
        chapterIndex: 4,
        scripturalRef: 'Genesis 1:3–5',
        title: 'Yehi Or — Firstborn Dawn',
        motifName: 'Yehi Or Burst',
        motif: 'e1-ch5-yehi-or-burst',
        summary: 'A single whispered command shatters the primordial night with golden-amber light.',
      },
      {
        episodeId: 'e2-the-garden-and-the-voice',
        chapterNumber: 7,
        chapterIndex: 6,
        scripturalRef: 'Genesis 3:24',
        title: 'Cherubim & The Flaming Sword',
        motifName: 'Flaming Sword',
        motif: 'e2-ch7-flaming-sword',
        summary: 'Fierce whirling fire guards the way to the Tree of Life until redemption is complete.',
      },
      {
        episodeId: 'e4-stars-over-the-desert',
        chapterNumber: 1,
        chapterIndex: 0,
        scripturalRef: 'Genesis 12:1 · 15:1',
        title: 'Pilgrim Tent & Campfire on the Dunes',
        motifName: 'Pilgrim Campfire',
        motif: 'e4-ch1-pilgrim-tent-fire',
        summary: 'A solitary hearth of warm embers accompanies the nomad called out into the unknown.',
      },
      {
        episodeId: 'e4-stars-over-the-desert',
        chapterNumber: 2,
        chapterIndex: 1,
        scripturalRef: 'Genesis 15:5–6',
        title: 'Beneath the Cathedral of Constellations',
        motifName: 'Counted Stars',
        motif: 'e4-ch2-counted-stars',
        summary: 'Countless star-nodes link overhead as an unbreakable oath of future family.',
      },
    ],
    canonicalEcho: {
      ref: 'Exodus 3:2 · Matthew 2:2 · John 1:4–5',
      fulfillment:
        'Culminates in the unconsumed Burning Bush at Horeb, the Star of Bethlehem, and the Light that darkness cannot overcome.',
    },
  },
  {
    id: 'garden-exile-and-return',
    title: 'The Sanctuary Garden, Exile & Healing Leaves',
    hebrewAnchor: 'עֵץ הַחַיִּים · Etz ha-Chayim',
    subtitle: 'The botanical arc from the Rivers of Eden to the Olive Leaf and the Healing of Nations.',
    accentColor: '#34D399',
    nodes: [
      {
        episodeId: 'e2-the-garden-and-the-voice',
        chapterNumber: 1,
        chapterIndex: 0,
        scripturalRef: 'Genesis 2:8–14',
        title: 'Constructing Eden & The Four Rivers',
        motifName: 'Constructing Eden',
        motif: 'e2-ch1-construct-eden',
        summary: 'Living canopies and four rivers rise from the watered earth to form a sacred garden.',
      },
      {
        episodeId: 'e2-the-garden-and-the-voice',
        chapterNumber: 5,
        chapterIndex: 4,
        scripturalRef: 'Genesis 3:8–9',
        title: 'Ayekah — Seeking Footsteps in the Mist',
        motifName: 'Ayekah Footsteps',
        motif: 'e2-ch5-ayekah-footsteps',
        summary: 'Even after the fracture, golden footsteps walk through the cool evening mist seeking the lost.',
      },
      {
        episodeId: 'e2-the-garden-and-the-voice',
        chapterNumber: 8,
        chapterIndex: 7,
        scripturalRef: 'Genesis 3:15 · Revelation 22:2',
        title: 'The River of Life & Healing Leaves',
        motifName: 'Healing River',
        motif: 'e2-ch8-healing-river',
        summary: 'The river from Eden flows onward into history carrying leaves for the healing of the nations.',
      },
      {
        episodeId: 'e3-the-ark-and-the-olive-leaf',
        chapterNumber: 3,
        chapterIndex: 2,
        scripturalRef: 'Genesis 8:11 · 9:13',
        title: 'The Returning Dove & Covenant Bow',
        motifName: 'Dove & Rainbow',
        motif: 'e3-ch3-dove-olive-rainbow',
        summary: 'A white dove returns over calm waters bearing a freshly plucked olive leaf beneath the bow.',
      },
    ],
    canonicalEcho: {
      ref: 'Isaiah 11:1 · John 19:41 · Revelation 22:2',
      fulfillment:
        'From the shoot of Jesse to the Garden of Gethsemane and the restored Tree of Life bearing fruit in every season.',
    },
  },
];
