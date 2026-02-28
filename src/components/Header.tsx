import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

function CodeCard({
  label,
  keywords,
  colorClass,
  textColor,
  borderColor,
}: {
  label: string;
  keywords: [string, string, string, string];
  colorClass: string;
  textColor: string;
  borderColor: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 ${colorClass} border ${borderColor} cursor-pointer transition-colors ${open ? 'ring-2 ring-offset-1 ring-blue-200' : ''}`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`text-xs sm:text-sm font-semibold ${textColor}`}>{label}</span>
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 z-30"
          >
            <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 p-3 min-w-[16rem] sm:min-w-72">
              <p className="text-xs text-slate-400 mb-2 font-medium">关键词</p>
              <div className="grid grid-cols-2 gap-1.5">
                {keywords.map((w, i) => (
                  <div
                    key={i}
                    className={`${colorClass} rounded-lg px-2.5 py-1.5 flex items-center gap-2`}
                  >
                    <span className={`w-5 h-5 rounded-md ${i % 2 === 0 ? 'bg-white/80' : 'bg-white/60'} flex items-center justify-center text-xs font-bold ${textColor}`}>
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-700">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Header() {
  const { round, maxRounds, humanTeam, aiTeam, resetGame } = useGameStore();
  const progress = (round / maxRounds) * 100;

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1
            onClick={resetGame}
            className="text-base sm:text-lg font-black cursor-pointer hover:opacity-70 transition-opacity"
            title="返回首页"
          >
            <span className="text-blue-500">截码</span>
            <span className="text-red-400">战</span>
          </h1>
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 border border-slate-100">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">回合</span>
              <span className="text-xs sm:text-sm font-bold text-slate-700">{round}</span>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-xs text-slate-400">{maxRounds}</span>
            </div>
            <div className="w-12 sm:w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2.5">
          <CodeCard
            label="玩家队"
            keywords={humanTeam.keywords}
            colorClass="bg-blue-50"
            textColor="text-blue-600"
            borderColor="border-blue-100/80"
          />
          <CodeCard
            label="AI 队"
            keywords={aiTeam.keywords}
            colorClass="bg-red-50"
            textColor="text-red-500"
            borderColor="border-red-100/80"
          />
        </div>
      </div>
    </header>
  );
}
