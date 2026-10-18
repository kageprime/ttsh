import React from 'react';
import { PiX, PiArrowCounterClockwise } from 'react-icons/pi';
import { ReaderSettings, DEFAULT_READER_SETTINGS } from '../utils/storybookLogic';

interface SettingsModalProps {
  isOpen: boolean;
  settings: ReaderSettings;
  onUpdateSettings: (next: ReaderSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#0C1017] p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
          <div>
            <h2
              id="settings-modal-title"
              className="font-serif-editorial text-2xl text-[#F4EFE6] font-normal"
            >
              Reading & Accessibility
            </h2>
            <p className="text-xs text-stone-400">
              Customize typography, pacing, and ambient sound
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5"
          >
            <PiX className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Font Size */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              Text Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, fontSize: size })}
                  className={`min-h-[40px] rounded-lg border text-xs font-medium uppercase transition-colors ${
                    settings.fontSize === size
                      ? 'border-[#D4A853] bg-[#D4A853]/15 text-[#D4A853]'
                      : 'border-white/10 bg-black/40 text-stone-300 hover:bg-white/5'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              Typeface
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, fontFamily: 'serif' })}
                className={`min-h-[42px] rounded-lg border text-sm font-serif-editorial transition-colors ${
                  settings.fontFamily === 'serif'
                    ? 'border-[#D4A853] bg-[#D4A853]/15 text-[#D4A853]'
                    : 'border-white/10 bg-black/40 text-stone-300 hover:bg-white/5'
                }`}
              >
                Editorial Serif
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, fontFamily: 'sans' })}
                className={`min-h-[42px] rounded-lg border text-xs font-sans-ui font-medium transition-colors ${
                  settings.fontFamily === 'sans'
                    ? 'border-[#D4A853] bg-[#D4A853]/15 text-[#D4A853]'
                    : 'border-white/10 bg-black/40 text-stone-300 hover:bg-white/5'
                }`}
              >
                Clean Sans
              </button>
            </div>
          </div>

          {/* Line Spacing */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              Line Spacing
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'relaxed', 'loose'] as const).map((spacing) => (
                <button
                  key={spacing}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ ...settings, lineSpacing: spacing })
                  }
                  className={`min-h-[40px] rounded-lg border text-xs font-medium capitalize transition-colors ${
                    settings.lineSpacing === spacing
                      ? 'border-[#D4A853] bg-[#D4A853]/15 text-[#D4A853]'
                      : 'border-white/10 bg-black/40 text-stone-300 hover:bg-white/5'
                  }`}
                >
                  {spacing}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
              <span className="text-sm text-stone-200">High-Contrast Scrim & Text</span>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, highContrast: e.target.checked })
                }
                className="w-4 h-4 accent-[#D4A853] rounded"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
              <span className="text-sm text-stone-200">Ambient Harmonic Soundscape</span>
              <input
                type="checkbox"
                checked={settings.ambientAudioEnabled}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    ambientAudioEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-[#D4A853] rounded"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
              <span className="text-sm text-stone-200">Auto-Advance Chapters on Play</span>
              <input
                type="checkbox"
                checked={settings.autoAdvance}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, autoAdvance: e.target.checked })
                }
                className="w-4 h-4 accent-[#D4A853] rounded"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => onUpdateSettings(DEFAULT_READER_SETTINGS)}
            className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1.5 py-2"
          >
            <PiArrowCounterClockwise className="w-3.5 h-3.5" />
            <span>Reset defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-6 py-2 rounded-lg bg-[#D4A853] text-[#090C10] text-xs font-semibold uppercase tracking-wider"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
