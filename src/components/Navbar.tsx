import React, { useState } from 'react';
import {
  PiSlidersHorizontal,
  PiHouse,
  PiBooks,
  PiInfo,
  PiList,
  PiX,
} from 'react-icons/pi';

export type ActiveRoute = 'home' | 'episodes' | 'about' | 'reader';

interface NavbarProps {
  activeRoute: ActiveRoute;
  onNavigate: (route: ActiveRoute, episodeId?: string) => void;
  onOpenSettings: () => void;
  onOpenSubscribe: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRoute,
  onNavigate,
  onOpenSettings,
  onOpenSubscribe,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (route: ActiveRoute) => {
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  return (
    <>
      <header className="sticky top-0 z-40 px-3 sm:px-6 pt-2.5 sm:pt-4 pointer-events-none">
        <nav
          aria-label="Primary"
          className="pointer-events-auto max-w-[1380px] mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 h-12 sm:h-14 rounded-xl border border-white/10 bg-[#0B0F14]/88 backdrop-blur-md shadow-lg shadow-black/30"
        >
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-left font-serif-editorial text-lg sm:text-xl tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A853] rounded"
          >
            <span className="text-[#F4EFE6] font-medium">Tales That Shaped</span>{' '}
            <span className="text-[#D4A853] font-normal hidden xs:inline sm:inline">Humanity</span>
          </button>

          {/* Zone 2: Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs tracking-[0.2em] uppercase font-medium">
            <button
              type="button"
              onClick={() => onNavigate('episodes')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b ${
                activeRoute === 'episodes' || activeRoute === 'reader'
                  ? 'text-[#D4A853] border-[#D4A853]'
                  : 'text-stone-300 hover:text-white border-transparent'
              }`}
            >
              Episodes
            </button>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b ${
                activeRoute === 'about'
                  ? 'text-[#D4A853] border-[#D4A853]'
                  : 'text-stone-300 hover:text-white border-transparent'
              }`}
            >
              About
            </button>
          </div>

          {/* Zone 3: Primary Action & Reading Settings */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenSubscribe}
              className="px-4 py-2 rounded-lg bg-[#D4A853] hover:bg-[#E0B663] text-[#090C10] text-xs font-semibold tracking-[0.16em] uppercase transition-colors whitespace-nowrap shrink-0"
            >
              Subscribe
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open reading and accessibility settings"
              className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-stone-300 hover:text-[#F4EFE6] hover:bg-white/5 transition-colors"
            >
              <PiSlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu & Settings Triggers */}
          <div className="flex md:hidden items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open reading and accessibility settings"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-300 hover:text-white rounded-lg"
            >
              <PiSlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-200 hover:text-white rounded-lg"
            >
              {mobileMenuOpen ? <PiX className="w-5 h-5" /> : <PiList className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div
            role="dialog"
            aria-label="Mobile navigation menu"
            className="pointer-events-auto md:hidden mt-2 rounded-xl border border-white/15 bg-[#0C1017]/95 backdrop-blur-xl p-4 shadow-2xl"
          >
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleMobileNav('home')}
                className="w-full min-h-[44px] px-3 py-2.5 text-left text-sm font-medium text-stone-200 hover:bg-white/5 rounded-lg flex items-center justify-between"
              >
                <span>Home</span>
                {activeRoute === 'home' && (
                  <span className="text-[11px] uppercase tracking-widest text-[#D4A853]">
                    Current
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleMobileNav('episodes')}
                className="w-full min-h-[44px] px-3 py-2.5 text-left text-sm font-medium text-stone-200 hover:bg-white/5 rounded-lg flex items-center justify-between"
              >
                <span>Episodes</span>
                {activeRoute === 'episodes' && (
                  <span className="text-[11px] uppercase tracking-widest text-[#D4A853]">
                    Current
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleMobileNav('about')}
                className="w-full min-h-[44px] px-3 py-2.5 text-left text-sm font-medium text-stone-200 hover:bg-white/5 rounded-lg flex items-center justify-between"
              >
                <span>About</span>
                {activeRoute === 'about' && (
                  <span className="text-[11px] uppercase tracking-widest text-[#D4A853]">
                    Current
                  </span>
                )}
              </button>
              <div className="h-px bg-white/10 my-1.5" />
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full min-h-[44px] px-3 py-2.5 text-left text-sm font-medium text-stone-300 hover:bg-white/5 rounded-lg"
              >
                Reading & Accessibility
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSubscribe();
                }}
                className="w-full min-h-[44px] mt-1 px-4 py-2.5 rounded-lg bg-[#D4A853] text-[#090C10] text-xs font-semibold tracking-[0.14em] uppercase text-center"
              >
                Subscribe for New Episodes
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      {activeRoute !== 'reader' && (
        <nav
          aria-label="Mobile bottom navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#090C10]/95 backdrop-blur-md border-t border-white/10 grid grid-cols-3 items-center px-2"
        >
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={`min-h-[44px] flex flex-col items-center justify-center relative ${
              activeRoute === 'home' ? 'text-[#D4A853]' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <PiHouse className="w-4 h-4" />
            <span className="text-[10px] tracking-[0.14em] uppercase mt-1 font-medium">Home</span>
            {activeRoute === 'home' && (
              <span className="absolute bottom-0 w-6 h-0.5 bg-[#D4A853]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('episodes')}
            className={`min-h-[44px] flex flex-col items-center justify-center relative ${
              activeRoute === 'episodes' ? 'text-[#D4A853]' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <PiBooks className="w-4 h-4" />
            <span className="text-[10px] tracking-[0.14em] uppercase mt-1 font-medium">Episodes</span>
            {activeRoute === 'episodes' && (
              <span className="absolute bottom-0 w-6 h-0.5 bg-[#D4A853]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('about')}
            className={`min-h-[44px] flex flex-col items-center justify-center relative ${
              activeRoute === 'about' ? 'text-[#D4A853]' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <PiInfo className="w-4 h-4" />
            <span className="text-[10px] tracking-[0.14em] uppercase mt-1 font-medium">About</span>
            {activeRoute === 'about' && (
              <span className="absolute bottom-0 w-6 h-0.5 bg-[#D4A853]" />
            )}
          </button>
        </nav>
      )}
    </>
  );
};
