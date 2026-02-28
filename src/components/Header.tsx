import { motion } from 'framer-motion';
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
  return (
    <div className={`rounded-xl px-4 py-2 ${colorClass} relative group cursor-default border ${borderColor}`}>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </div>
      <div className="absolute top-full left-0 mt-2 z-30 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 group-hover:translate-y-0 translate-y-1">
        <div className={`bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 p-3 min-w-72`}>
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
      </div>
    </div>
  );
}

export default function Header() {
  const { round, maxRounds, humanTeam, aiTeam, resetGame } = useGameStore();
  const progress = (round / maxRounds) * 100;

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100/80">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <h1
            onClick={resetGame}
            className="text-lg font-black cursor-pointer hover:opacity-70 transition-opacity"
            title="返回首页"
          >
            <span className="text-blue-500">截码</span>
            <span className="text-red-400">战</span>
          </h1>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
              <span className="text-xs text-slate-400 font-medium">回合</span>
              <span className="text-sm font-bold text-slate-700">{round}</span>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-xs text-slate-400">{maxRounds}</span>
            </div>
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
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
