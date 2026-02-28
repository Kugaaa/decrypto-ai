import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Code } from '../types/game';

interface CodeGuessProps {
  title: ReactNode;
  subtitle: string;
  clues: [string, string, string];
  colorAccent: string;
  buttonColor: string;
  onSubmit: (code: Code) => void;
}

function NumberPicker({
  value,
  onChange,
  disabled,
  accent,
}: {
  value: number | null;
  onChange: (n: number) => void;
  disabled: number[];
  accent: string;
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
        className={`w-14 h-14 rounded-xl border-2 text-lg font-black flex items-center justify-center cursor-pointer transition-all ${
          value
            ? `${accent} border-transparent shadow-sm`
            : 'bg-slate-50 border-dashed border-slate-300 text-slate-300 hover:border-slate-400'
        }`}
      >
        {value ?? '?'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 bg-white rounded-xl shadow-xl shadow-slate-200/60 border border-slate-100 p-1.5 flex gap-1"
          >
            {[1, 2, 3, 4].map((n) => {
              const isDisabled = disabled.includes(n);
              return (
                <button
                  key={n}
                  disabled={isDisabled}
                  onClick={() => { onChange(n); setOpen(false); }}
                  className={`w-10 h-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isDisabled
                      ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                      : n === value
                        ? `${accent} shadow-sm`
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CodeGuess({
  title,
  subtitle,
  clues,
  colorAccent,
  buttonColor,
  onSubmit,
}: CodeGuessProps) {
  const [picks, setPicks] = useState<(number | null)[]>([null, null, null]);
  const [error, setError] = useState('');

  const handlePick = (idx: number, n: number) => {
    const next = [...picks];
    next[idx] = n;
    setPicks(next);
    setError('');
  };

  const usedNumbers = picks.filter((p): p is number => p !== null);

  const handleSubmit = () => {
    if (picks.some((p) => p === null)) {
      setError('请选择完整的 3 位密码');
      return;
    }
    const code = picks as [number, number, number];
    const unique = new Set(code);
    if (unique.size !== 3) {
      setError('密码数字不能重复');
      return;
    }
    onSubmit(code as Code);
    setPicks([null, null, null]);
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-solid rounded-2xl shadow-sm p-6"
    >
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-700 mb-1 flex items-center gap-2">{title}</h3>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="flex gap-2 mb-5">
        {clues.map((clue, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className={`flex-1 ${colorAccent} rounded-xl px-3 py-3 text-center border border-white/50`}
          >
            <p className="text-xs text-slate-400 mb-1">线索 {i + 1}</p>
            <p className="text-sm font-bold text-slate-700">{clue}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <p className="text-xs text-slate-400 flex-shrink-0">密码</p>
        <div className="flex items-center gap-3">
          {picks.map((val, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <NumberPicker
                value={val}
                onChange={(n) => handlePick(idx, n)}
                disabled={usedNumbers.filter((_, i) => i !== usedNumbers.indexOf(val!))}
                accent={colorAccent.includes('red') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}
              />
              {idx < 2 && <span className="text-slate-300 font-bold">-</span>}
            </div>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className={`ml-auto px-6 py-2.5 ${buttonColor} text-white rounded-xl text-sm font-semibold shadow-sm cursor-pointer`}
        >
          确认
        </motion.button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </motion.div>
  );
}
