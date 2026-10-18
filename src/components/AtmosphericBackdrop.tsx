import React from 'react';
import { SceneTheme } from '../data/stories';

interface AtmosphericBackdropProps {
  theme: SceneTheme | 'hero-waterfall';
  className?: string;
  dimming?: 'light' | 'medium' | 'heavy';
}

export const AtmosphericBackdrop: React.FC<AtmosphericBackdropProps> = ({
  theme,
  className = '',
  dimming = 'medium',
}) => {
  const scrimClass =
    dimming === 'heavy'
      ? 'bg-gradient-to-b from-[#06090E]/82 via-[#06090E]/58 to-[#06090E]/94'
      : dimming === 'light'
      ? 'bg-gradient-to-b from-[#06090E]/50 via-[#06090E]/20 to-[#06090E]/82'
      : 'bg-gradient-to-b from-[#06090E]/65 via-[#06090E]/35 to-[#06090E]/90';

  return (
    <div
      className={`pointer-events-none overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* Scene 1: Hero Primordial Misty Forest Waterfall (Painterly organic mist & emerald ridges) */}
      {(theme === 'hero-waterfall' || theme === 'ancient-forest' || theme === 'eden-mist') && (
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full object-cover"
        >
          <defs>
            <filter id="mistBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="38" />
            </filter>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
            <linearGradient id="forestBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#07130E" />
              <stop offset="42%" stopColor="#122C22" />
              <stop offset="78%" stopColor="#0C1E17" />
              <stop offset="100%" stopColor="#050A08" />
            </linearGradient>
            <radialGradient id="lightShaft" cx="62%" cy="18%" r="58%">
              <stop
                offset="0%"
                stopColor={theme === 'eden-mist' ? '#F3D088' : '#E2E8F0'}
                stopOpacity="0.46"
              />
              <stop offset="45%" stopColor="#4E8772" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#07120E" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="waterfallMist" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#F1F5F9" stopOpacity="0.38" />
              <stop offset="55%" stopColor="#94A3B8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="mossRidge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#234B37" />
              <stop offset="55%" stopColor="#12291E" />
              <stop offset="100%" stopColor="#07110C" />
            </linearGradient>
          </defs>

          <rect width="1440" height="900" fill="url(#forestBg)" />
          <rect width="1440" height="900" fill="url(#lightShaft)" />

          {/* Softly diffused celestial light beam & waterfall mist */}
          <g filter="url(#mistBlur)">
            <polygon
              points="760,0 1120,0 890,820 480,820"
              fill="url(#waterfallMist)"
            />
            <ellipse cx="860" cy="410" rx="135" ry="250" fill="url(#waterfallMist)" />
            <ellipse cx="845" cy="590" rx="220" ry="45" fill="#CBD5E1" opacity="0.22" />
          </g>

          {/* Subtle organic waterfall streams */}
          <g filter="url(#softGlow)" opacity="0.45">
            <path
              d="M795 160 Q815 380 785 620 M845 150 Q865 390 835 620 M895 165 Q910 390 885 620"
              stroke="#F8FAFC"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Layered mossy cliffs and lush emerald ridges */}
          <path
            d="M0 410 Q280 430 540 545 Q700 615 800 650 L0 685 Z"
            fill="url(#mossRidge)"
          />
          <path
            d="M1440 350 Q1140 410 920 540 Q820 605 740 650 L1440 685 Z"
            fill="#0F241B"
          />
          <path
            d="M0 565 Q340 590 650 690 L650 900 L0 900 Z"
            fill="#11291D"
          />

          {/* Dark reflective river pool & soft water ripples at bottom */}
          <rect x="0" y="645" width="1440" height="255" fill="#060E0B" opacity="0.9" />
          <g filter="url(#softGlow)">
            <ellipse cx="780" cy="685" rx="340" ry="16" fill="#E2E8F0" opacity="0.2" />
            <ellipse cx="740" cy="740" rx="260" ry="10" fill="#CBD5E1" opacity="0.15" />
            <ellipse cx="700" cy="805" rx="380" ry="12" fill="#94A3B8" opacity="0.12" />
          </g>

          {/* Deep forest canopy framing left and right */}
          <path
            d="M0 0 L380 0 Q270 180 150 340 Q60 450 0 510 Z"
            fill="#040907"
            opacity="0.85"
          />
          <path
            d="M1440 0 L1080 0 Q1200 185 1310 340 Q1390 465 1440 520 Z"
            fill="#040907"
            opacity="0.85"
          />
        </svg>
      )}

      {/* Scene 2: Primordial Cosmic Waters & Starlit Horizon */}
      {(theme === 'primordial-waters' ||
        theme === 'living-waters' ||
        theme === 'deluge-ark' ||
        theme === 'parted-sky') && (
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full object-cover"
        >
          <defs>
            <filter id="oceanBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="20" />
            </filter>
            <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#060A14" />
              <stop offset="36%" stopColor="#142638" />
              <stop offset="52%" stopColor="#334959" />
              <stop offset="59%" stopColor="#7E92A6" />
              <stop offset="65%" stopColor="#1E2C3A" />
              <stop offset="100%" stopColor="#04070D" />
            </linearGradient>
            <radialGradient id="moonGlow" cx="65%" cy="22%" r="38%">
              <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.62" />
              <stop offset="30%" stopColor="#CBD5E1" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="waterShimmer" cx="64%" cy="66%" r="45%">
              <stop offset="0%" stopColor="#F1F5F9" stopOpacity="0.42" />
              <stop offset="45%" stopColor="#94A3B8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#050811" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="1440" height="900" fill="url(#nightSky)" />
          <rect width="1440" height="600" fill="url(#moonGlow)" />

          {/* Subtle Starfield */}
          <g fill="#F8FAFC" opacity="0.7">
            <circle cx="180" cy="90" r="1.3" />
            <circle cx="320" cy="140" r="1.6" fill="#FDE68A" />
            <circle cx="490" cy="75" r="1.1" />
            <circle cx="640" cy="110" r="1.4" />
            <circle cx="1080" cy="85" r="1.3" />
            <circle cx="1250" cy="150" r="1.6" fill="#FDE68A" />
            <circle cx="1340" cy="70" r="1.1" />
            <circle cx="95" cy="210" r="1.4" />
            <circle cx="410" cy="230" r="1.1" />
          </g>

          {/* Soft brooding cloud banks */}
          <g filter="url(#oceanBlur)">
            <path
              d="M0 240 Q280 180 560 220 T1120 200 T1440 250 L1440 510 L0 510 Z"
              fill="#0E1926"
              opacity="0.55"
            />
            <path
              d="M0 340 Q380 290 760 330 T1440 310 L1440 515 L0 515 Z"
              fill="#1A2A3B"
              opacity="0.5"
            />
          </g>

          {/* Distant mountain silhouettes for deluge-ark or parted-sky */}
          {(theme === 'deluge-ark' || theme === 'parted-sky') && (
            <path
              d="M0 512 L240 512 L390 425 L540 512 L820 512 L980 410 L1140 512 L1440 512 Z"
              fill="#0B1320"
              opacity="0.9"
            />
          )}

          {/* Deep primordial ocean below horizon */}
          <rect x="0" y="510" width="1440" height="390" fill="#060B14" />
          <rect x="0" y="510" width="1440" height="390" fill="url(#waterShimmer)" />

          {/* Softened luminous silver-gold ocean swells */}
          <g filter="url(#oceanBlur)">
            <ellipse cx="890" cy="525" rx="500" ry="10" fill="#F1F5F9" opacity="0.48" />
            <ellipse cx="860" cy="560" rx="540" ry="14" fill="#CBD5E1" opacity="0.34" />
            <ellipse cx="820" cy="605" rx="600" ry="18" fill="#94A3B8" opacity="0.26" />
            <path
              d="M0 660 Q360 640 720 660 T1440 655 L1440 690 Q1080 705 720 685 T0 695 Z"
              fill="#E2E8F0"
              opacity="0.22"
            />
            <path
              d="M0 755 Q420 735 840 758 T1440 750 L1440 790 Q960 810 480 785 T0 795 Z"
              fill="#CBD5E1"
              opacity="0.18"
            />
          </g>
        </svg>
      )}

      {/* Scene 3: First Light, Celestial Spheres, Desert Stars, Sacred Breath & Sabbath Stillness */}
      {(theme === 'first-light' ||
        theme === 'celestial-spheres' ||
        theme === 'desert-stars' ||
        theme === 'sacred-breath' ||
        theme === 'sabbath-stillness') && (
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full object-cover"
        >
          <defs>
            <linearGradient id="celestialBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#090B16" />
              <stop offset="45%" stopColor="#1B2038" />
              <stop offset="75%" stopColor="#35282C" />
              <stop offset="100%" stopColor="#0B0C12" />
            </linearGradient>
            <radialGradient id="amberOrb" cx="50%" cy="42%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.42" />
              <stop offset="42%" stopColor="#D97706" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#070810" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="1440" height="900" fill="url(#celestialBg)" />
          <rect width="1440" height="900" fill="url(#amberOrb)" />

          {/* Rich constellation field */}
          <g fill="#FEF3C7" opacity="0.85">
            <circle cx="210" cy="120" r="1.6" />
            <circle cx="290" cy="160" r="1.3" />
            <circle cx="370" cy="105" r="2.0" />
            <circle cx="520" cy="190" r="1.3" />
            <circle cx="690" cy="95" r="2.2" />
            <circle cx="840" cy="145" r="1.5" />
            <circle cx="1010" cy="110" r="2.0" />
            <circle cx="1190" cy="175" r="1.4" />
            <circle cx="1310" cy="120" r="1.8" />
            <circle cx="150" cy="290" r="1.4" />
            <circle cx="440" cy="280" r="1.6" />
            <circle cx="960" cy="260" r="1.6" />
            <circle cx="1260" cy="310" r="1.4" />
          </g>

          {/* Sweeping desert dunes / serene horizon hills */}
          <path
            d="M0 640 Q360 560 720 630 T1440 590 L1440 900 L0 900 Z"
            fill="#18141D"
          />
          <path
            d="M0 710 Q480 640 920 715 T1440 690 L1440 900 L0 900 Z"
            fill="#0D0B11"
          />
        </svg>
      )}

      {/* Measured contrast scrim overlay for 4.5:1+ legibility */}
      <div className={`absolute inset-0 ${scrimClass}`} />
    </div>
  );
};
