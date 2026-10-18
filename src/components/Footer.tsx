import React from 'react';
import { PiArrowRight } from 'react-icons/pi';
import { ActiveRoute } from './Navbar';

interface FooterProps {
  onNavigate: (route: ActiveRoute, episodeId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-white/10 bg-[#07090D] pb-20 md:pb-12 pt-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          <div className="md:col-span-5">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="text-left font-serif-editorial text-2xl text-[#F4EFE6] mb-2 block"
            >
              <span>Hear the Story.</span>{' '}
              <span className="italic text-stone-300">Read the Wonder.</span>
            </button>
            <p className="text-xs sm:text-sm text-stone-400 max-w-sm leading-relaxed">
              Ancient Scripture as cinematic audio chapters and living visual
              meditations — listen deeply, or read slowly.
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-stone-400 mb-3">
              Explore
            </div>
            <div className="flex flex-col items-start gap-2 text-xs sm:text-sm text-stone-300">
              <button
                type="button"
                onClick={() => onNavigate('episodes')}
                className="hover:text-[#D4A853] transition-colors"
              >
                All episodes
              </button>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="hover:text-[#D4A853] transition-colors"
              >
                About
              </button>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-stone-400 mb-3">
              Latest
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reader', 'e1-before-the-beginning')}
              className="text-left group"
            >
              <span className="text-xs text-[#D4A853] font-mono-tabular block mb-0.5">
                E1
              </span>
              <span className="text-xs sm:text-sm text-stone-300 group-hover:text-white transition-colors">
                Before the Beginning — A Hollow and a Hum
              </span>
            </button>
          </div>

          <div className="md:col-span-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-stone-400 mb-3">
              Begin
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reader', 'e1-before-the-beginning')}
              className="text-xs sm:text-sm text-[#D4A853] hover:text-[#E0B663] inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Start listening</span>
              <PiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div>© 2026 Tales That Shaped Humanity. All rights reserved.</div>
          <div className="uppercase tracking-[0.18em] text-[11px]">
            Audio · Living Canvas · Scripture
          </div>
        </div>
      </div>
    </footer>
  );
};
