import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PiX,
  PiDownloadSimple,
  PiCheck,
  PiBookmarkSimple,
  PiBookmarkSimpleFill,
  PiTrash,
  PiCopy,
  PiArrowRight,
  PiNotePencil,
  PiFileText,
  PiBookOpenText,
} from 'react-icons/pi';
import { StoryEpisode, StoryChapter } from '../data/stories';
import { formatChapterNumber } from '../utils/storybookLogic';
import { getLectioDivinaPromptsForChapter } from '../data/lexicon';

const CINEMATIC_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const HIGHLIGHTS_STORAGE_KEY = 'bibleverse_verse_highlights_v1';

export type HighlightInkColor = 'amber' | 'rose' | 'sky';

export interface VerseHighlightRecord {
  readonly id: string;
  readonly episodeId: string;
  readonly chapterNumber: number;
  readonly chapterTitle: string;
  readonly paragraphIndex: number;
  readonly text: string;
  readonly color: HighlightInkColor;
  readonly personalNote?: string;
  readonly createdAt: string;
}

export const HIGHLIGHT_INK_STYLES: Record<
  HighlightInkColor,
  {
    border: string;
    bg: string;
    badge: string;
    textAccent: string;
    label: string;
    meaning: string;
  }
> = {
  amber: {
    border: 'border-[#D4A853]',
    bg: 'bg-[#D4A853]/10',
    badge: 'bg-[#D4A853]',
    textAccent: 'text-[#F5D78E]',
    label: 'Gold Leaf',
    meaning: 'Divine Presence & Promise',
  },
  rose: {
    border: 'border-rose-400/80',
    bg: 'bg-rose-500/10',
    badge: 'bg-rose-400',
    textAccent: 'text-rose-300',
    label: 'Covenant Crimson',
    meaning: 'Sacrifice, Mercy & Heart',
  },
  sky: {
    border: 'border-sky-400/80',
    bg: 'bg-sky-500/10',
    badge: 'bg-sky-400',
    textAccent: 'text-sky-300',
    label: 'Abyssal Sapphire',
    meaning: 'Creation, Waters & Ruach',
  },
};

export function loadStoredHighlights(): Record<string, VerseHighlightRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStoredHighlights(
  highlights: Record<string, VerseHighlightRecord>
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      HIGHLIGHTS_STORAGE_KEY,
      JSON.stringify(highlights)
    );
  } catch {
    // Ignore localStorage quota errors
  }
}

export function buildLiturgicalMarkdownExport(params: {
  episode: StoryEpisode;
  currentChapter: StoryChapter;
  draftNote: string;
  reflectionNotes: Readonly<Record<string, string>>;
  highlights: Readonly<Record<string, VerseHighlightRecord>>;
}): string {
  const {
    episode,
    currentChapter,
    draftNote,
    reflectionNotes,
    highlights,
  } = params;

  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines: string[] = [
    `# ${episode.fullTitle} — Liturgical Reflection & Study Journal`,
    '',
    `**Series:** ${episode.series} (${episode.code}) · **Scripture:** ${episode.bookRef} · **Exported:** ${exportDate}`,
    '',
    `> *${episode.summary}*`,
    '',
    '---',
    '',
  ];

  let hasAnyContent = false;

  episode.chapters.forEach((ch) => {
    const noteKey = `${episode.id}-ch-${ch.number}`;
    const rawChapterNote =
      ch.number === currentChapter.number && draftNote.trim().length > 0
        ? draftNote.trim()
        : (reflectionNotes[noteKey] || '').trim();

    const chHighlights = (Object.values(highlights) as VerseHighlightRecord[])
      .filter(
        (h) => h.episodeId === episode.id && h.chapterNumber === ch.number
      )
      .sort((a, b) => a.paragraphIndex - b.paragraphIndex);

    if (!rawChapterNote && chHighlights.length === 0) return;
    hasAnyContent = true;

    lines.push(`## Chapter ${formatChapterNumber(ch.number)}: ${ch.title}`);
    lines.push('');

    if (ch.hebrewQuote) {
      lines.push(`> **${ch.hebrewQuote}**`);
      if (ch.hebrewTranslation) {
        lines.push(`> *“${ch.hebrewTranslation}”*`);
      }
      lines.push('');
    }

    if (chHighlights.length > 0) {
      lines.push('### Illuminated Passages');
      lines.push('');
      chHighlights.forEach((h) => {
        const inkMeta = HIGHLIGHT_INK_STYLES[h.color];
        lines.push(
          `- **[${inkMeta.label} · ¶${h.paragraphIndex + 1}]** “${h.text}”`
        );
        if (h.personalNote && h.personalNote.trim()) {
          lines.push(`  - *Marginalia:* ${h.personalNote.trim()}`);
        }
      });
      lines.push('');
    }

    if (rawChapterNote) {
      lines.push('### Personal Reflection & Prayer');
      lines.push(`*Contemplative Prompt: “${ch.reflectionPrompt}”*`);
      lines.push('');
      lines.push(rawChapterNote);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  });

  if (!hasAnyContent) {
    lines.push(
      `## Chapter ${formatChapterNumber(currentChapter.number)}: ${currentChapter.title}`,
      '',
      `*Contemplative Prompt: “${currentChapter.reflectionPrompt}”*`,
      '',
      draftNote.trim() || '*(No saved reflections or illuminated passages yet.)*',
      ''
    );
  }

  return lines.join('\n');
}

type JournalTab = 'reflect' | 'highlights' | 'markdown';

interface LiturgicalReflectionJournalProps {
  isOpen: boolean;
  episode: StoryEpisode;
  currentChapter: StoryChapter;
  activeInkColor: HighlightInkColor;
  onSelectInkColor: (color: HighlightInkColor) => void;
  highlights: Record<string, VerseHighlightRecord>;
  onToggleParagraphHighlight: (
    chapterNumber: number,
    chapterTitle: string,
    paragraphIndex: number,
    text: string
  ) => void;
  onUpdateHighlightColor: (highlightId: string, color: HighlightInkColor) => void;
  onUpdateHighlightNote: (highlightId: string, personalNote: string) => void;
  onRemoveHighlight: (highlightId: string) => void;
  reflectionNotes: Record<string, string>;
  onSaveReflection: (key: string, note: string) => void;
  onNavigateToChapter: (chapterIndex: number, paragraphIndex?: number) => void;
  onClose: () => void;
}

export const LiturgicalReflectionJournal: React.FC<
  LiturgicalReflectionJournalProps
> = ({
  isOpen,
  episode,
  currentChapter,
  activeInkColor,
  onSelectInkColor,
  highlights,
  onToggleParagraphHighlight,
  onUpdateHighlightColor,
  onUpdateHighlightNote,
  onRemoveHighlight,
  reflectionNotes,
  onSaveReflection,
  onNavigateToChapter,
  onClose,
}) => {
  const reflectionKey = `${episode.id}-ch-${currentChapter.number}`;
  const [activeTab, setActiveTab] = useState<JournalTab>('reflect');
  const [inkFilter, setInkFilter] = useState<HighlightInkColor | 'all'>('all');
  const [draftNote, setDraftNote] = useState<string>(
    reflectionNotes[reflectionKey] || ''
  );
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(
    null
  );
  const [highlightNoteDraft, setHighlightNoteDraft] = useState<string>('');
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [exportedToast, setExportedToast] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Sync draft reflection note when chapter or saved notes change
  useEffect(() => {
    setDraftNote(reflectionNotes[reflectionKey] || '');
    setSavedToast(false);
  }, [reflectionKey, reflectionNotes]);

  const lectioDivina = useMemo(
    () =>
      getLectioDivinaPromptsForChapter(
        currentChapter.title,
        currentChapter.reflectionPrompt,
        currentChapter.hebrewQuote
      ),
    [
      currentChapter.title,
      currentChapter.reflectionPrompt,
      currentChapter.hebrewQuote,
    ]
  );

  const chapterParagraphs = useMemo(
    () =>
      currentChapter.paragraphs && currentChapter.paragraphs.length > 0
        ? currentChapter.paragraphs
        : [currentChapter.narrative],
    [currentChapter]
  );

  const episodeHighlights = useMemo(
    () =>
      (Object.values(highlights) as VerseHighlightRecord[])
        .filter((h) => h.episodeId === episode.id)
        .sort((a, b) =>
          a.chapterNumber !== b.chapterNumber
            ? a.chapterNumber - b.chapterNumber
            : a.paragraphIndex - b.paragraphIndex
        ),
    [highlights, episode.id]
  );

  const filteredHighlights = useMemo(
    () =>
      inkFilter === 'all'
        ? episodeHighlights
        : episodeHighlights.filter((h) => h.color === inkFilter),
    [episodeHighlights, inkFilter]
  );

  const savedChapterNotesCount = useMemo(() => {
    return episode.chapters.filter((ch) => {
      const key = `${episode.id}-ch-${ch.number}`;
      if (ch.number === currentChapter.number && draftNote.trim()) return true;
      return Boolean(reflectionNotes[key]?.trim());
    }).length;
  }, [episode, currentChapter.number, draftNote, reflectionNotes]);

  const markdownPreview = useMemo(
    () =>
      buildLiturgicalMarkdownExport({
        episode,
        currentChapter,
        draftNote,
        reflectionNotes,
        highlights,
      }),
    [episode, currentChapter, draftNote, reflectionNotes, highlights]
  );

  const handleSaveNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReflection(reflectionKey, draftNote.trim());
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2600);
  };

  const handleDownloadMarkdown = () => {
    // Also persist any unsaved draft note so exported markdown and localStorage stay in sync
    if (draftNote.trim() !== (reflectionNotes[reflectionKey] || '').trim()) {
      onSaveReflection(reflectionKey, draftNote.trim());
    }

    try {
      const blob = new Blob([markdownPreview], {
        type: 'text/markdown;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${episode.id}-study-journal.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback if download is restricted in iframe
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(markdownPreview).catch(() => {});
    }

    setExportedToast(true);
    window.setTimeout(() => setExportedToast(false), 2800);
  };

  const handleCopyMarkdown = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(markdownPreview).catch(() => {});
    }
    setCopiedToast(true);
    window.setTimeout(() => setCopiedToast(false), 2400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="reflection-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Liturgical Reflection Journal"
          data-testid="liturgical-reflection-journal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: CINEMATIC_EASE }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            key="reflection-modal-card"
            initial={{ opacity: 0, y: 18, scale: 0.96, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(4px)' }}
            transition={{ duration: 0.36, ease: CINEMATIC_EASE }}
            className="relative w-full max-w-[680px] max-h-[90vh] flex flex-col rounded-2xl bg-[#0B0E14] border border-[#FAF6EE]/12 shadow-2xl overflow-hidden"
          >
            {/* Journal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#FAF6EE]/10 flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[0.66rem] tracking-[0.18em] uppercase text-[#D4A853]">
                  <span>Liturgical Reflection Journal</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Chapter {formatChapterNumber(currentChapter.number)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#FAF6EE]/55 font-mono-tabular">
                    {episodeHighlights.length} Illuminated ·{' '}
                    {savedChapterNotesCount} Notes
                  </span>
                </div>
                <h2 className="font-serif-editorial text-xl sm:text-2xl text-[#FAF6EE] truncate mt-1">
                  {currentChapter.title}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close reflection"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FAF6EE]/10 text-[#FAF6EE]/65 hover:text-[#FAF6EE] transition-colors cursor-pointer shrink-0"
              >
                <PiX className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Segmented Navigation Bar */}
            <div className="px-6 py-3 bg-black/35 border-b border-[#FAF6EE]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div
                role="tablist"
                aria-label="Journal Sections"
                className="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-[#FAF6EE]/10"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'reflect'}
                  data-testid="journal-tab-reflect"
                  onClick={() => setActiveTab('reflect')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'reflect'
                      ? 'bg-[#D4A853] text-[#0A0A0A]'
                      : 'text-[#FAF6EE]/70 hover:text-[#FAF6EE]'
                  }`}
                >
                  <PiNotePencil className="w-3.5 h-3.5" />
                  <span>Lectio &amp; Notes</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'highlights'}
                  data-testid="journal-tab-highlights"
                  onClick={() => setActiveTab('highlights')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'highlights'
                      ? 'bg-[#D4A853] text-[#0A0A0A]'
                      : 'text-[#FAF6EE]/70 hover:text-[#FAF6EE]'
                  }`}
                >
                  <PiBookOpenText className="w-3.5 h-3.5" />
                  <span>Illuminated ({episodeHighlights.length})</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'markdown'}
                  data-testid="journal-tab-markdown"
                  onClick={() => setActiveTab('markdown')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'markdown'
                      ? 'bg-[#D4A853] text-[#0A0A0A]'
                      : 'text-[#FAF6EE]/70 hover:text-[#FAF6EE]'
                  }`}
                >
                  <PiFileText className="w-3.5 h-3.5" />
                  <span>Markdown Preview</span>
                </button>
              </div>

              {/* Active Margin Ink Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[0.64rem] tracking-[0.15em] uppercase text-[#FAF6EE]/45 mr-1 hidden sm:inline">
                  Ink:
                </span>
                {(['amber', 'rose', 'sky'] as const).map((colorKey) => {
                  const st = HIGHLIGHT_INK_STYLES[colorKey];
                  const isSel = activeInkColor === colorKey;
                  return (
                    <button
                      key={colorKey}
                      type="button"
                      data-testid={`journal-ink-${colorKey}`}
                      onClick={() => onSelectInkColor(colorKey)}
                      title={`${st.label} — ${st.meaning}`}
                      className={`px-2.5 py-1 rounded-lg text-[0.66rem] flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isSel
                          ? 'border-[#FAF6EE]/55 bg-[#FAF6EE]/15 text-[#FAF6EE]'
                          : 'border-transparent bg-black/35 text-[#FAF6EE]/50 hover:text-[#FAF6EE]/80'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${st.badge}`} />
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {activeTab === 'reflect' && (
                <>
                  {/* Chapter Contemplative Prompt */}
                  <div>
                    <p className="font-serif-editorial text-[1.24rem] sm:text-[1.4rem] leading-[1.45] text-[#FAF6EE]/95">
                      “{currentChapter.reflectionPrompt}”
                    </p>
                  </div>

                  {/* Four-Fold Lectio Divina Contemplative Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-black/40 border border-[#FAF6EE]/10 text-xs">
                    <div>
                      <span className="text-[#D4A853] uppercase tracking-wider font-medium block mb-0.5">
                        1. Lectio (Read)
                      </span>
                      <p className="text-[#FAF6EE]/70 leading-relaxed">
                        {lectioDivina.lectio}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#D4A853] uppercase tracking-wider font-medium block mb-0.5">
                        2. Meditatio (Ponder)
                      </span>
                      <p className="text-[#FAF6EE]/70 leading-relaxed">
                        {lectioDivina.meditatio}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#D4A853] uppercase tracking-wider font-medium block mb-0.5">
                        3. Oratio (Respond)
                      </span>
                      <p className="text-[#FAF6EE]/70 leading-relaxed">
                        {lectioDivina.oratio}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#D4A853] uppercase tracking-wider font-medium block mb-0.5">
                        4. Contemplatio (Rest)
                      </span>
                      <p className="text-[#FAF6EE]/70 leading-relaxed">
                        {lectioDivina.contemplatio}
                      </p>
                    </div>
                  </div>

                  {/* Personal Note Input for Current Chapter */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label
                        htmlFor="chapter-reflection-input"
                        className="text-[0.68rem] tracking-[0.18em] uppercase text-[#D4A853]"
                      >
                        Personal Reflection &amp; Prayer · Chapter{' '}
                        {formatChapterNumber(currentChapter.number)}
                      </label>
                      <span className="text-[0.68rem] text-[#FAF6EE]/45">
                        Persisted in browser journal
                      </span>
                    </div>
                    <textarea
                      id="chapter-reflection-input"
                      data-testid="chapter-reflection-input"
                      rows={4}
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      placeholder="Write a quiet thought, observation, or liturgical prayer from this chapter…"
                      className="w-full rounded-xl border border-[#FAF6EE]/15 bg-black/45 px-4 py-3 text-sm text-[#FAF6EE] placeholder:text-[#FAF6EE]/30 focus:outline-none focus:border-[#D4A853] leading-relaxed"
                    />
                  </div>

                  {/* Quick Chapter Passage Illumination Picker */}
                  <div className="pt-3 border-t border-[#FAF6EE]/10">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[0.66rem] tracking-[0.18em] uppercase text-[#FAF6EE]/55">
                        Chapter {formatChapterNumber(currentChapter.number)}{' '}
                        Passages — Click to Illuminate with{' '}
                        {HIGHLIGHT_INK_STYLES[activeInkColor].label}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {chapterParagraphs.map((para, pIdx) => {
                        const hlKey = `${episode.id}:ch-${currentChapter.number}:p-${pIdx}`;
                        const hlRecord = highlights[hlKey];
                        const hlStyle = hlRecord
                          ? HIGHLIGHT_INK_STYLES[hlRecord.color]
                          : null;
                        return (
                          <div
                            key={pIdx}
                            onClick={() =>
                              onToggleParagraphHighlight(
                                currentChapter.number,
                                currentChapter.title,
                                pIdx,
                                para
                              )
                            }
                            data-testid={`journal-quick-highlight-${pIdx}`}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              hlStyle
                                ? `${hlStyle.bg} ${hlStyle.border}`
                                : 'bg-black/35 border-[#FAF6EE]/10 hover:border-[#FAF6EE]/25'
                            }`}
                          >
                            <p className="font-serif-editorial text-xs sm:text-sm text-[#FAF6EE]/85 leading-relaxed line-clamp-2">
                              <span className="font-mono-tabular text-[0.65rem] text-[#D4A853] mr-2">
                                ¶{pIdx + 1}
                              </span>
                              {para}
                            </p>
                            <span className="shrink-0 mt-0.5 text-[#D4A853]">
                              {hlRecord ? (
                                <PiBookmarkSimpleFill className="w-4 h-4" />
                              ) : (
                                <PiBookmarkSimple className="w-4 h-4 text-[#FAF6EE]/35" />
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'highlights' && (
                <div className="space-y-4">
                  {/* Ink Filter Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-[#FAF6EE]/60">
                      Showing {filteredHighlights.length} illuminated{' '}
                      {filteredHighlights.length === 1 ? 'passage' : 'passages'}{' '}
                      in {episode.title}
                    </span>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-black/40 border border-[#FAF6EE]/10">
                      <button
                        type="button"
                        onClick={() => setInkFilter('all')}
                        className={`px-2.5 py-1 rounded-md text-[0.66rem] transition-colors cursor-pointer ${
                          inkFilter === 'all'
                            ? 'bg-[#FAF6EE]/15 text-[#FAF6EE] font-medium'
                            : 'text-[#FAF6EE]/55 hover:text-[#FAF6EE]'
                        }`}
                      >
                        All Inks
                      </button>
                      {(['amber', 'rose', 'sky'] as const).map((cKey) => (
                        <button
                          key={cKey}
                          type="button"
                          onClick={() => setInkFilter(cKey)}
                          className={`px-2.5 py-1 rounded-md text-[0.66rem] flex items-center gap-1 transition-colors cursor-pointer ${
                            inkFilter === cKey
                              ? 'bg-[#FAF6EE]/15 text-[#FAF6EE] font-medium'
                              : 'text-[#FAF6EE]/55 hover:text-[#FAF6EE]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${HIGHLIGHT_INK_STYLES[cKey].badge}`}
                          />
                          <span>{HIGHLIGHT_INK_STYLES[cKey].label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredHighlights.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-black/35 border border-[#FAF6EE]/10 text-center">
                      <PiBookmarkSimple className="w-7 h-7 text-[#D4A853]/60 mx-auto mb-2" />
                      <p className="font-serif-editorial text-base text-[#FAF6EE]/85">
                        No illuminated passages yet
                      </p>
                      <p className="text-xs text-[#FAF6EE]/50 mt-1 max-w-md mx-auto">
                        Bookmark any verse in the reader margin or select a
                        passage in the Lectio &amp; Notes tab to preserve it
                        with Gold Leaf, Covenant Crimson, or Abyssal Sapphire
                        ink.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredHighlights.map((hl) => {
                        const st = HIGHLIGHT_INK_STYLES[hl.color];
                        const isEditingNote = editingHighlightId === hl.id;
                        return (
                          <div
                            key={hl.id}
                            data-testid={`saved-highlight-${hl.id}`}
                            className={`p-4 rounded-xl border ${st.bg} ${st.border} transition-all`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 text-[0.66rem] tracking-[0.15em] uppercase text-[#FAF6EE]/65">
                                <span className={st.textAccent}>{st.label}</span>
                                <span aria-hidden="true">·</span>
                                <span>
                                  Ch {formatChapterNumber(hl.chapterNumber)}:{' '}
                                  {hl.chapterTitle}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono-tabular">
                                  ¶{hl.paragraphIndex + 1}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {(['amber', 'rose', 'sky'] as const).map(
                                  (cKey) => (
                                    <button
                                      key={cKey}
                                      type="button"
                                      onClick={() =>
                                        onUpdateHighlightColor(hl.id, cKey)
                                      }
                                      aria-label={`Change ink to ${HIGHLIGHT_INK_STYLES[cKey].label}`}
                                      className={`w-4 h-4 rounded-full flex items-center justify-center border cursor-pointer ${
                                        hl.color === cKey
                                          ? 'border-[#FAF6EE] scale-110'
                                          : 'border-transparent opacity-60 hover:opacity-100'
                                      }`}
                                    >
                                      <span
                                        className={`w-2.5 h-2.5 rounded-full ${HIGHLIGHT_INK_STYLES[cKey].badge}`}
                                      />
                                    </button>
                                  )
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    const chIdx = episode.chapters.findIndex(
                                      (c) => c.number === hl.chapterNumber
                                    );
                                    if (chIdx >= 0) {
                                      onNavigateToChapter(
                                        chIdx,
                                        hl.paragraphIndex
                                      );
                                      onClose();
                                    }
                                  }}
                                  title="Jump to this passage in the reader"
                                  className="px-2 py-0.5 rounded text-[0.65rem] bg-black/40 text-[#FAF6EE]/75 hover:text-[#D4A853] inline-flex items-center gap-1 cursor-pointer ml-1"
                                >
                                  <span>Go</span>
                                  <PiArrowRight className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onRemoveHighlight(hl.id)}
                                  aria-label="Delete highlight"
                                  title="Remove highlight"
                                  className="p-1 rounded text-[#FAF6EE]/45 hover:text-rose-300 cursor-pointer"
                                >
                                  <PiTrash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="font-serif-editorial italic text-sm sm:text-base text-[#FAF6EE]/95 leading-relaxed">
                              “{hl.text}”
                            </p>

                            {/* Marginalia Personal Annotation for this Highlight */}
                            {isEditingNote ? (
                              <div className="mt-3 pt-2.5 border-t border-[#FAF6EE]/10 space-y-2">
                                <input
                                  type="text"
                                  value={highlightNoteDraft}
                                  onChange={(e) =>
                                    setHighlightNoteDraft(e.target.value)
                                  }
                                  placeholder="Add a personal marginalia note for this verse…"
                                  className="w-full rounded-lg bg-black/50 border border-[#FAF6EE]/20 px-3 py-1.5 text-xs text-[#FAF6EE] focus:outline-none focus:border-[#D4A853]"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateHighlightNote(
                                        hl.id,
                                        highlightNoteDraft.trim()
                                      );
                                      setEditingHighlightId(null);
                                    }}
                                    className="px-3 py-1 rounded-md bg-[#D4A853] text-[#0A0A0A] text-xs font-medium cursor-pointer"
                                  >
                                    Save Marginalia
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingHighlightId(null)}
                                    className="px-2.5 py-1 rounded-md text-xs text-[#FAF6EE]/60 hover:text-[#FAF6EE] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2.5 flex items-center justify-between gap-2">
                                {hl.personalNote ? (
                                  <p className="text-xs text-[#FAF6EE]/75">
                                    <span className="text-[#D4A853] uppercase tracking-wider text-[0.62rem] mr-1.5">
                                      Marginalia:
                                    </span>
                                    {hl.personalNote}
                                  </p>
                                ) : (
                                  <span className="text-[0.68rem] text-[#FAF6EE]/40 italic">
                                    No marginalia note attached
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingHighlightId(hl.id);
                                    setHighlightNoteDraft(
                                      hl.personalNote || ''
                                    );
                                  }}
                                  className="text-[0.68rem] text-[#D4A853]/85 hover:text-[#D4A853] underline underline-offset-2 cursor-pointer shrink-0"
                                >
                                  {hl.personalNote
                                    ? 'Edit Marginalia'
                                    : '+ Add Marginalia'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'markdown' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-[#FAF6EE]/65">
                      Formatted Markdown manuscript including all illuminated
                      passages, marginalia, and chapter reflections
                    </span>
                    <button
                      type="button"
                      data-testid="copy-markdown-button"
                      onClick={handleCopyMarkdown}
                      className="px-3 py-1.5 rounded-lg bg-black/50 border border-[#FAF6EE]/15 hover:border-[#D4A853]/50 text-xs text-[#FAF6EE]/85 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <PiCopy className="w-3.5 h-3.5 text-[#D4A853]" />
                      <span>
                        {copiedToast ? 'Copied to Clipboard' : 'Copy Markdown'}
                      </span>
                    </button>
                  </div>
                  <pre
                    data-testid="markdown-export-preview"
                    className="p-4 rounded-xl bg-black/60 border border-[#FAF6EE]/12 text-xs text-[#FAF6EE]/85 font-mono overflow-x-auto whitespace-pre-wrap max-h-72 leading-relaxed"
                  >
                    {markdownPreview}
                  </pre>
                </div>
              )}
            </div>

            {/* Persistent Action Footer */}
            <form
              onSubmit={handleSaveNoteSubmit}
              className="px-6 py-4 bg-black/50 border-t border-[#FAF6EE]/10 flex flex-wrap items-center justify-between gap-3 shrink-0"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="submit"
                  data-testid="save-reflection-note-button"
                  className="min-h-[40px] px-5 py-2 rounded-full bg-[#D4A853] hover:bg-[#E5BE6A] text-[#0A0A0A] text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Save Note
                </button>
                <button
                  type="button"
                  data-testid="export-journal-button"
                  onClick={handleDownloadMarkdown}
                  className="min-h-[40px] px-4 py-2 rounded-full border border-[#FAF6EE]/20 bg-black/40 hover:border-[#D4A853]/50 text-[#FAF6EE]/85 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PiDownloadSimple className="w-4 h-4 text-[#D4A853]" />
                  <span>Export Journal (.md)</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {savedToast && (
                  <span
                    data-testid="journal-saved-toast"
                    className="text-xs text-emerald-300 flex items-center gap-1"
                  >
                    <PiCheck className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
                {exportedToast && (
                  <span
                    data-testid="journal-exported-toast"
                    className="text-xs text-[#F5D78E] flex items-center gap-1"
                  >
                    <PiCheck className="w-3.5 h-3.5" />
                    Exported (.md)
                  </span>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
