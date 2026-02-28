import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { formatCode } from '../utils/gameLogic';
import RoleBadge from './RoleBadge';

export default function ClueInput() {
  const { currentHumanCode, humanTeam, submitHumanClues } = useGameStore();
  const [clues, setClues] = useState(['', '', '']);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(false);

  if (!currentHumanCode) return null;

  const targetKeywords = currentHumanCode.map(
    (n) => humanTeam.keywords[n - 1]
  );

  const handleSubmit = () => {
    if (clues.some((c) => !c.trim())) {
      setError('请填写所有线索');
      return;
    }
    submitHumanClues(clues.map((c) => c.trim()) as [string, string, string]);
    setClues(['', '', '']);
    setError('');
    setRevealed(false);
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {!revealed && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-20 backdrop-blur-xl bg-white/40 rounded-2xl flex flex-col items-center justify-center gap-5 border border-white/60"
          >
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 mb-1">
                请确认 <RoleBadge role="humanReceiver" /> 已回避屏幕
              </p>
              <p className="text-xs text-slate-400">接下来将展示本轮密码与关键词</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setRevealed(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-200/50 cursor-pointer"
            >
              接收者已回避，开始出题
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-solid rounded-2xl shadow-sm p-6 min-h-[300px]"
      >
        <div className="mb-5">
          <h3 className="text-base font-bold text-slate-700 mb-2 flex items-center gap-2">
            <RoleBadge role="humanEncryptor" />
            <span>— 给出线索</span>
          </h3>
          <div className="inline-flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5 border border-blue-100/60">
            <span className="text-xs text-blue-400">本轮密码</span>
            <span className="text-sm font-black text-blue-600 tracking-wider">{formatCode(currentHumanCode)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {currentHumanCode.map((_num, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: revealed ? 0.1 * i : 0 }}
              className="flex items-center gap-3"
            >
              <div className="flex-shrink-0 w-[7.5rem]">
                <span className="inline-flex items-center justify-center w-full text-xs bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg border border-blue-100/60 font-medium truncate">
                  {targetKeywords[i]}
                </span>
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={`第 ${i + 1} 条线索...`}
                  value={clues[i]}
                  onChange={(e) => {
                    const next = [...clues];
                    next[i] = e.target.value;
                    setClues(next);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white focus:border-blue-200 transition-all"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSubmit}
          className="mt-5 w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-200/50 cursor-pointer"
        >
          提交线索
        </motion.button>
      </motion.div>
    </div>
  );
}
