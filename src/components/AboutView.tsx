import React from 'react';
import { PiArrowRight } from 'react-icons/pi';

interface AboutViewProps {
  onStartReading: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onStartReading }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-24">
      <p className="text-xs uppercase tracking-[0.24em] text-[#D4A853] font-medium mb-3">
        About the Project
      </p>

      <h1 className="font-serif-editorial text-4xl sm:text-6xl text-[#F4EFE6] font-normal leading-tight mb-6 text-balance">
        Why We Built a Listening Scripture
      </h1>

      <div className="space-y-6 text-stone-300/90 text-base sm:text-lg leading-relaxed font-serif-editorial">
        <p className="text-xl sm:text-2xl text-[#F4EFE6] leading-relaxed">
          For thousands of years before the printing press, the Scriptures were
          experienced primarily through the ear and the imagination — spoken
          around campfires, chanted in assemblies, and pondered in quiet
          vigils.
        </p>

        <p className="font-sans-ui text-sm sm:text-base text-stone-300/85 leading-relaxed">
          <strong className="text-[#F4EFE6] font-medium">
            Tales That Shaped Humanity (BIBLEVERSE)
          </strong>{' '}
          reimagines the ancient biblical narrative as an intimate,
          chapter-by-chapter storybook and contemplative listening experience.
          Each episode pairs evocative sound cues, meditative literary prose,
          original Hebrew word studies, and guided <em>Lectio Divina</em>{' '}
          reflections.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 my-12 border-y border-white/10 py-8">
        <div>
          <span className="font-mono-tabular text-xs text-[#D4A853] tracking-widest block mb-2">
            01
          </span>
          <h2 className="font-serif-editorial text-xl text-[#F4EFE6] mb-1.5">
            Acoustic Space
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
            Stage directions and Web Audio harmonic drones help quiet mental
            clutter before engaging the text.
          </p>
        </div>

        <div>
          <span className="font-mono-tabular text-xs text-[#D4A853] tracking-widest block mb-2">
            02
          </span>
          <h2 className="font-serif-editorial text-xl text-[#F4EFE6] mb-1.5">
            Chapter Rhythm
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
            Instead of walls of tiny verse numbers, stories unfold one breath
            and one living canvas scene at a time.
          </p>
        </div>

        <div>
          <span className="font-mono-tabular text-xs text-[#D4A853] tracking-widest block mb-2">
            03
          </span>
          <h2 className="font-serif-editorial text-xl text-[#F4EFE6] mb-1.5">
            Personal Journal
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
            Every chapter includes Hebrew literary context and space to record
            and export your own reflections.
          </p>
        </div>
      </div>

      <div className="p-7 sm:p-9 rounded-xl border border-white/10 bg-[#0D1219] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif-editorial text-2xl sm:text-3xl text-[#F4EFE6] mb-1">
            Ready to step into the story?
          </h2>
          <p className="text-sm text-stone-400">
            Begin with Episode 1: Before the Beginning — A Hollow and a Hum.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartReading}
          className="min-h-[46px] px-6 py-3 rounded-lg bg-[#D4A853] hover:bg-[#E0B663] text-[#090C10] text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 transition-colors shrink-0 self-start sm:self-center"
        >
          <span>Open Episode 1</span>
          <PiArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
