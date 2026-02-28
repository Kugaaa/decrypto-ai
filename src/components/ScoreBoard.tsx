import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

function ScoreToken({ filled, color }: { filled: boolean; color: 'green' | 'amber' }) {
  const filledBg = color === 'green' ? 'bg-green-400 shadow-green-200' : 'bg-amber-400 shadow-amber-200';
  const emptyBg = color === 'green' ? 'bg-green-100' : 'bg-amber-100';

  return (
    <motion.div
      initial={false}
      animate={filled ? { scale: [1, 1.3, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`w-5 h-5 rounded-full ${filled ? `${filledBg} shadow-sm` : emptyBg} transition-colors`}
    />
  );
}

function TeamScore({
  label,
  intercepts,
  miscomms,
  bgClass,
  textColor,
}: {
  label: string;
  intercepts: number;
  miscomms: number;
  bgClass: string;
  textColor: string;
}) {
  return (
    <div className={`flex-1 ${bgClass} rounded-xl p-4 border border-white/50`}>
      <p className={`text-sm font-bold ${textColor} mb-3`}>{label}</p>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 flex items-center gap-2 font-medium">
            <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            拦截
          </span>
          <div className="flex items-center gap-1.5">
            <ScoreToken filled={intercepts >= 1} color="green" />
            <ScoreToken filled={intercepts >= 2} color="green" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 flex items-center gap-2 font-medium">
            <span className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
            失误
          </span>
          <div className="flex items-center gap-1.5">
            <ScoreToken filled={miscomms >= 1} color="amber" />
            <ScoreToken filled={miscomms >= 2} color="amber" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScoreBoard() {
  const { humanTeam, aiTeam } = useGameStore();

  return (
    <div className="card-solid rounded-2xl shadow-sm p-3.5 flex gap-3">
      <TeamScore
        label="玩家队"
        intercepts={humanTeam.interceptCount}
        miscomms={humanTeam.miscommunicationCount}
        bgClass="bg-blue-50/60"
        textColor="text-blue-600"
      />
      <div className="flex items-center px-1">
        <span className="text-xl font-black text-slate-200">VS</span>
      </div>
      <TeamScore
        label="AI 队"
        intercepts={aiTeam.interceptCount}
        miscomms={aiTeam.miscommunicationCount}
        bgClass="bg-red-50/60"
        textColor="text-red-500"
      />
    </div>
  );
}
