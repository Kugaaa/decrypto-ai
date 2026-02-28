import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { formatCode } from '../utils/gameLogic';
import type { PhaseResult, RoundData, AIThinkingLog } from '../types/game';

const ROLE_LABELS: Record<AIThinkingLog['role'], string> = {
  encryptor: 'AI 加密者',
  guesser: 'AI 接收者',
  interceptor: 'AI 拦截者',
};

function PhaseRow({
  label,
  phase,
  colorClass,
  dotColor,
}: {
  label: string;
  phase: PhaseResult;
  colorClass: string;
  dotColor: string;
}) {
  return (
    <div className={`rounded-lg p-2 ${colorClass} text-xs space-y-1 border border-white/40`}>
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="font-semibold text-slate-600">{label}</span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {phase.clues.map((c, i) => (
          <span key={i} className="bg-white/70 px-1.5 py-0.5 rounded text-slate-700 font-medium">
            {c}
          </span>
        ))}
      </div>
      <p className="text-slate-500">
        密码 <strong>{formatCode(phase.code)}</strong>
        {' · '}
        <span className={phase.teamGuessCorrect ? 'text-green-600' : 'text-amber-500'}>
          队友{phase.teamGuessCorrect ? '✓' : '✗'}
        </span>
        {' · '}
        <span className={phase.interceptCorrect ? 'text-red-500' : 'text-slate-400'}>
          拦截{phase.interceptCorrect ? '✓' : '✗'}
        </span>
      </p>
    </div>
  );
}

function RoundDetailModal({
  round,
  onClose,
}: {
  round: RoundData;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="card rounded-2xl shadow-2xl shadow-slate-300/30 p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-black text-slate-500">{round.round}</span>
            第 {round.round} 轮详情
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50/60 rounded-xl p-4 space-y-3 border border-blue-100/50">
            <h4 className="text-sm font-bold text-blue-600 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-blue-400 rounded-full" />
              玩家队
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400 mb-0.5">密码</p>
                <p className="font-bold text-slate-700 text-sm">{formatCode(round.humanPhase.code)}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">线索</p>
                <p className="font-medium text-slate-700">{round.humanPhase.clues.join(' / ')}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">接收者猜测</p>
                <p className="font-medium text-slate-700">
                  {round.humanPhase.teamGuess ? formatCode(round.humanPhase.teamGuess) : '-'}
                  {round.humanPhase.teamGuessCorrect !== null && (
                    <span className={`ml-1 ${round.humanPhase.teamGuessCorrect ? 'text-green-600' : 'text-amber-600'}`}>
                      {round.humanPhase.teamGuessCorrect ? '✓' : '✗ 沟通失败'}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">AI 拦截</p>
                <p className="font-medium text-slate-700">
                  {round.humanPhase.interceptGuess ? formatCode(round.humanPhase.interceptGuess) : '-'}
                  {round.humanPhase.interceptCorrect !== null && (
                    <span className={`ml-1 ${round.humanPhase.interceptCorrect ? 'text-red-500' : 'text-slate-400'}`}>
                      {round.humanPhase.interceptCorrect ? '⚡ 拦截成功' : '拦截失败'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50/60 rounded-xl p-4 space-y-3 border border-red-100/50">
            <h4 className="text-sm font-bold text-red-500 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-red-400 rounded-full" />
              AI 队
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400 mb-0.5">密码</p>
                <p className="font-bold text-slate-700 text-sm">{formatCode(round.aiPhase.code)}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">线索</p>
                <p className="font-medium text-slate-700">{round.aiPhase.clues.join(' / ')}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">AI 接收者猜测</p>
                <p className="font-medium text-slate-700">
                  {round.aiPhase.teamGuess ? formatCode(round.aiPhase.teamGuess) : '-'}
                  {round.aiPhase.teamGuessCorrect !== null && (
                    <span className={`ml-1 ${round.aiPhase.teamGuessCorrect ? 'text-green-600' : 'text-amber-600'}`}>
                      {round.aiPhase.teamGuessCorrect ? '✓' : '✗ 沟通失败'}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">玩家拦截</p>
                <p className="font-medium text-slate-700">
                  {round.aiPhase.interceptGuess ? formatCode(round.aiPhase.interceptGuess) : '-'}
                  {round.aiPhase.interceptCorrect !== null && (
                    <span className={`ml-1 ${round.aiPhase.interceptCorrect ? 'text-green-600' : 'text-slate-400'}`}>
                      {round.aiPhase.interceptCorrect ? '⚡ 拦截成功' : '拦截失败'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {round.aiLogs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-slate-300 rounded-full" />
                AI 思考详情
              </h4>
              {round.aiLogs.map((log, i) => (
                <AILogDetail key={i} log={log} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AILogDetail({ log }: { log: AIThinkingLog }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-100/80 transition-colors"
      >
        <span className="text-xs font-semibold text-red-400">{ROLE_LABELS[log.role]}</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          className="w-3.5 h-3.5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {log.reasoning && (
                <div>
                  <p className="text-xs text-slate-400 mb-1 font-medium">推理过程</p>
                  <pre className="text-xs text-slate-600 bg-white rounded-lg p-2.5 whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-100">
                    {log.reasoning}
                  </pre>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 mb-1 font-medium">输入</p>
                <pre className="text-xs text-slate-600 bg-white rounded-lg p-2.5 whitespace-pre-wrap max-h-32 overflow-y-auto border border-slate-100">
                  {log.input}
                </pre>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1 font-medium">输出</p>
                <pre className="text-xs text-slate-600 bg-white rounded-lg p-2.5 whitespace-pre-wrap max-h-32 overflow-y-auto border border-slate-100">
                  {log.output}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RoundHistory() {
  const { history } = useGameStore();
  const [expanded, setExpanded] = useState(true);
  const [selectedRound, setSelectedRound] = useState<RoundData | null>(null);

  if (history.length === 0) {
    return (
      <div className="card-solid rounded-2xl shadow-sm p-4">
        <h3 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          历史记录
        </h3>
        <p className="text-xs text-slate-400">暂无记录</p>
      </div>
    );
  }

  return (
    <>
      <div className="card-solid rounded-2xl shadow-sm p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex justify-between items-center cursor-pointer"
        >
          <h3 className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            历史记录
          </h3>
          <motion.svg
            animate={{ rotate: expanded ? 180 : 0 }}
            className="w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto">
                {[...history].reverse().map((r, idx) => (
                  <motion.button
                    key={r.round}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    onClick={() => setSelectedRound(r)}
                    className="w-full text-left space-y-1.5 cursor-pointer hover:bg-slate-50 rounded-xl p-2 -mx-1 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-xs">{r.round}</span>
                        第 {r.round} 轮
                      </p>
                      <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">详情 →</span>
                    </div>
                    <PhaseRow label="玩家队" phase={r.humanPhase} colorClass="bg-blue-50/50" dotColor="bg-blue-400" />
                    <PhaseRow label="AI 队" phase={r.aiPhase} colorClass="bg-red-50/50" dotColor="bg-red-400" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedRound && (
          <RoundDetailModal
            round={selectedRound}
            onClose={() => setSelectedRound(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
