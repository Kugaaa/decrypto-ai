import { motion } from 'framer-motion';
import { formatCode } from '../utils/gameLogic';
import type { Code } from '../types/game';

interface PhaseResultCardProps {
  teamLabel: string;
  colorClass: string;
  code: Code;
  clues: [string, string, string];
  teamGuess: Code | null;
  teamGuessCorrect: boolean | null;
  interceptGuess: Code | null;
  interceptCorrect: boolean | null;
  interceptorLabel: string;
  onContinue: () => void;
  buttonLabel: string;
}

export default function PhaseResultCard({
  teamLabel,
  colorClass,
  code,
  clues,
  teamGuess,
  teamGuessCorrect,
  interceptGuess,
  interceptCorrect,
  interceptorLabel,
  onContinue,
  buttonLabel,
}: PhaseResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-solid rounded-2xl shadow-sm p-6"
    >
      <h3 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
        <span className={`w-1.5 h-5 rounded-full ${colorClass === 'bg-blue-50' ? 'bg-blue-400' : 'bg-red-400'}`} />
        {teamLabel} — 阶段结果
      </h3>

      <div className={`${colorClass} rounded-xl p-4 space-y-4 border border-white/50`}>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">密码</p>
            <p className="text-xl font-black text-slate-700 tracking-wider">{formatCode(code)}</p>
          </div>
          <div className="h-8 w-px bg-slate-200/60" />
          <div className="flex-1">
            <p className="text-xs text-slate-400 mb-1">线索</p>
            <div className="flex gap-1.5">
              {clues.map((c, i) => (
                <span key={i} className="bg-white/70 px-2 py-0.5 rounded-md text-xs font-medium text-slate-700 border border-white/50">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 rounded-xl p-3 border border-white/50"
          >
            <p className="text-xs text-slate-400 mb-1.5">接收者猜测</p>
            <p className="text-sm font-bold text-slate-700 mb-1.5">
              {teamGuess ? formatCode(teamGuess) : '-'}
            </p>
            {teamGuessCorrect !== null && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.4 }}
                className={`text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                  teamGuessCorrect
                    ? 'bg-green-100 text-green-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {teamGuessCorrect ? '✓ 正确' : '✗ 沟通失败'}
              </motion.span>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 rounded-xl p-3 border border-white/50"
          >
            <p className="text-xs text-slate-400 mb-1.5">{interceptorLabel}拦截</p>
            <p className="text-sm font-bold text-slate-700 mb-1.5">
              {interceptGuess ? formatCode(interceptGuess) : '-'}
            </p>
            {interceptCorrect !== null && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.5 }}
                className={`text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                  interceptCorrect
                    ? 'bg-red-100 text-red-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {interceptCorrect ? '⚡ 拦截成功' : '— 拦截失败'}
              </motion.span>
            )}
          </motion.div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onContinue}
        className="mt-4 w-full py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm cursor-pointer"
      >
        {buttonLabel}
      </motion.button>
    </motion.div>
  );
}
