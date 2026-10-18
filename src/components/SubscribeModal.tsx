import React, { useState } from 'react';
import { PiX, PiCheckCircle } from 'react-icons/pi';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#0C1017] p-6 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#D4A853] mb-1">
              BIBLEVERSE DISPATCH
            </p>
            <h2
              id="subscribe-modal-title"
              className="font-serif-editorial text-2xl sm:text-3xl text-[#F4EFE6] font-normal"
            >
              Receive New Episodes
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close subscribe dialog"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5"
          >
            <PiX className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-4 text-center">
            <PiCheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-serif-editorial text-2xl text-[#F4EFE6] mb-1">
              You’re on the list.
            </p>
            <p className="text-xs sm:text-sm text-stone-400 mb-6">
              We’ll send a quiet note whenever a new Scripture episode is
              released.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
                onClose();
              }}
              className="min-h-[42px] px-6 py-2 rounded-lg bg-[#D4A853] text-[#090C10] text-xs font-semibold uppercase tracking-wider"
            >
              Return to Storybook
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed mb-5">
              Join listeners and readers receiving weekly meditations on the
              stories of Scripture. No noise, ever.
            </p>

            <div className="mb-4">
              <label
                htmlFor="subscribe-email"
                className="block text-xs text-stone-300 mb-1.5"
              >
                Email address
              </label>
              <input
                id="subscribe-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="you@example.com"
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg border border-white/15 bg-black/50 text-sm text-[#F4EFE6] placeholder:text-stone-500 focus:outline-none focus:border-[#D4A853]"
              />
              {error && (
                <p role="alert" className="text-xs text-rose-400 mt-1.5">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[42px] px-4 py-2 rounded-lg text-xs text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[42px] px-6 py-2.5 rounded-lg bg-[#D4A853] hover:bg-[#E0B663] text-[#090C10] text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Subscribe
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
