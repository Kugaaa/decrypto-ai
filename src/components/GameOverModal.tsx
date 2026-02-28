import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function GameOverModal() {
  const { winner, humanTeam, aiTeam, resetGame } = useGameStore();

  const config: Record<string, { title: string; color: string; gradient: string }> = {
    human: { title: '玩家队获胜！', color: 'text-blue-500', gradient: 'from-blue-500 to-blue-600' },
    ai: { title: 'AI 队获胜！', color: 'text-red-400', gradient: 'from-red-400 to-red-500' },
    draw: { title: '平局！', color: 'text-slate-600', gradient: 'from-slate-600 to-slate-700' },
  };

  const c = config[winner || 'draw'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="card rounded-2xl shadow-2xl shadow-slate-300/30 p-5 sm:p-8 w-full max-w-md mx-3 sm:mx-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center"
        >
          {winner === 'human' ? (
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          ) : winner === 'ai' ? (
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-2xl sm:text-3xl font-black mb-5 sm:mb-6 ${c.color}`}
        >
          {c.title}
        </motion.h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 rounded-xl p-4 border border-blue-100/50"
          >
            <p className="text-xs text-blue-400 font-semibold mb-2">玩家队</p>
            <div className="space-y-1">
              <p className="text-xs text-slate-600">
                拦截 <strong className="text-green-600 text-sm">{humanTeam.interceptCount}</strong>
              </p>
              <p className="text-xs text-slate-600">
                失误 <strong className="text-amber-600 text-sm">{humanTeam.miscommunicationCount}</strong>
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-red-50 rounded-xl p-4 border border-red-100/50"
          >
            <p className="text-xs text-red-400 font-semibold mb-2">AI 队</p>
            <div className="space-y-1">
              <p className="text-xs text-slate-600">
                拦截 <strong className="text-green-600 text-sm">{aiTeam.interceptCount}</strong>
              </p>
              <p className="text-xs text-slate-600">
                失误 <strong className="text-amber-600 text-sm">{aiTeam.miscommunicationCount}</strong>
              </p>
            </div>
          </motion.div>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={resetGame}
          className={`w-full py-3 bg-gradient-to-r ${c.gradient} text-white rounded-xl text-sm font-semibold shadow-md cursor-pointer`}
        >
          返回首页
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
