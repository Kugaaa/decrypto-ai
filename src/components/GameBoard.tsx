import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import Header from './Header';
import ScoreBoard from './ScoreBoard';
import RoundHistory from './RoundHistory';
import ClueInput from './ClueInput';
import CodeGuess from './CodeGuess';
import PhaseResultCard from './PhaseResultCard';
import GameOverModal from './GameOverModal';
import RoleBadge from './RoleBadge';
import { aiEncrypt, aiGuess, aiIntercept, type AICallContext } from '../services/aiPlayer';
import { checkGuess } from '../utils/gameLogic';

function LoadingSpinner({ text, color = 'red' }: { text: string; color?: 'red' | 'blue' }) {
  const ringColor = color === 'red' ? 'border-red-200 border-t-red-500' : 'border-blue-200 border-t-blue-500';
  const dotColor = color === 'red' ? 'bg-red-400' : 'bg-blue-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-solid rounded-2xl shadow-sm p-8 flex flex-col items-center gap-4"
    >
      <div className="relative">
        <div className={`w-10 h-10 border-[3px] ${ringColor} rounded-full animate-spin`} />
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse-ring`} />
        </div>
      </div>
      <p className="text-sm text-slate-500 font-medium">{text}</p>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function GameBoard() {
  const store = useGameStore();
  const {
    phase,
    round,
    apiKey,
    providerId,
    customBaseUrl,
    customModel,
    useThinking,
    humanTeam,
    aiTeam,
    currentHumanCode,
    currentAICode,
    currentHumanClues,
    currentAIClues,
    currentHumanGuess,
    currentAITeamGuess,
    currentAIInterceptGuess,
    currentHumanInterceptGuess,
    history,
    submitAIIntercept,
    finishHumanPhase,
    submitAIClues,
    submitAIGuess,
    finishAIPhase,
    advanceToNextRound,
    setAIThinking,
  } = store;

  const aiCtx: AICallContext = { providerId, apiKey, useThinking, customBaseUrl, customModel };

  const runAIIntercept = useCallback(async () => {
    if (phase !== 'aiIntercept' || !currentHumanClues) return;
    setAIThinking(true);
    try {
      const result = await aiIntercept(aiCtx, currentHumanClues, history, 'ai');
      submitAIIntercept(result.guess, result.log);
    } catch (err) {
      console.error('AI intercept failed:', err);
      submitAIIntercept([1, 2, 3], {
        role: 'interceptor',
        input: '',
        output: `错误: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      });
    } finally {
      setAIThinking(false);
    }
  }, [phase, aiCtx, currentHumanClues, history, submitAIIntercept, setAIThinking]);

  const runAIEncryptAndGuess = useCallback(async () => {
    if (phase !== 'aiEncrypt' || !currentAICode) return;
    try {
      const encResult = await aiEncrypt(aiCtx, aiTeam.keywords, currentAICode, history);
      submitAIClues(encResult.clues, encResult.log);
    } catch (err) {
      console.error('AI encrypt failed:', err);
      submitAIClues(['线索1', '线索2', '线索3'], {
        role: 'encryptor',
        input: '',
        output: `错误: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      });
    }
  }, [phase, aiCtx, aiTeam.keywords, currentAICode, history, submitAIClues]);

  const runAIGuess = useCallback(async () => {
    if (phase !== 'aiGuess' || !currentAIClues) return;
    try {
      const guessResult = await aiGuess(aiCtx, aiTeam.keywords, currentAIClues, history);
      submitAIGuess(guessResult.guess, guessResult.log);
    } catch (err) {
      console.error('AI guess failed:', err);
      submitAIGuess([1, 2, 3], {
        role: 'guesser',
        input: '',
        output: `错误: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      });
    }
  }, [phase, aiCtx, aiTeam.keywords, currentAIClues, history, submitAIGuess]);

  useEffect(() => {
    if (phase === 'aiIntercept') runAIIntercept();
  }, [phase, runAIIntercept]);

  useEffect(() => {
    if (phase === 'aiEncrypt') runAIEncryptAndGuess();
  }, [phase, runAIEncryptAndGuess]);

  useEffect(() => {
    if (phase === 'aiGuess') runAIGuess();
  }, [phase, runAIGuess]);

  const renderPhaseContent = () => {
    switch (phase) {
      case 'humanEncrypt':
        return (
          <div>
            <PhaseIndicator step={1} total={6} label="玩家队加密" color="blue" />
            <ClueInput />
          </div>
        );

      case 'humanGuess':
        return (
          <div>
            <PhaseIndicator step={2} total={6} label="玩家队猜测" color="blue" />
            {currentHumanClues && (
              <CodeGuess
                title={<><RoleBadge role="humanReceiver" /> <span>— 猜测密码</span></>}
                subtitle="根据队友给出的线索，推断本轮密码"
                clues={currentHumanClues}
                colorAccent="bg-blue-50/80"
                buttonColor="bg-gradient-to-r from-blue-500 to-blue-600"
                onSubmit={store.submitHumanGuess}
              />
            )}
          </div>
        );

      case 'aiIntercept':
        return (
          <div>
            <PhaseIndicator step={3} total={6} label="AI 拦截" color="red" />
            <LoadingSpinner text="AI 拦截者正在分析线索..." />
          </div>
        );

      case 'humanPhaseResult':
        return (
          <div>
            <PhaseIndicator step={3} total={6} label="玩家队结果" color="blue" />
            {currentHumanCode && currentHumanClues && (
              <PhaseResultCard
                teamLabel="玩家队"
                colorClass="bg-blue-50"
                code={currentHumanCode}
                clues={currentHumanClues}
                teamGuess={currentHumanGuess}
                teamGuessCorrect={
                  currentHumanGuess ? checkGuess(currentHumanGuess, currentHumanCode) : null
                }
                interceptGuess={currentAIInterceptGuess}
                interceptCorrect={
                  currentAIInterceptGuess ? checkGuess(currentAIInterceptGuess, currentHumanCode) : null
                }
                interceptorLabel="AI"
                onContinue={finishHumanPhase}
                buttonLabel="进入 AI 队回合"
              />
            )}
          </div>
        );

      case 'aiEncrypt':
      case 'aiGuess':
        return (
          <div>
            <PhaseIndicator step={phase === 'aiEncrypt' ? 4 : 5} total={6} label="AI 队回合" color="red" />
            <LoadingSpinner text="AI 队正在进行中，请稍候..." />
          </div>
        );

      case 'humanIntercept':
        return (
          <div>
            <PhaseIndicator step={5} total={6} label="玩家拦截" color="blue" />
            {currentAIClues && (
              <CodeGuess
                title={<><RoleBadge role="humanReceiver" /> <span>— 拦截 AI 队密码</span></>}
                subtitle="根据 AI 的线索，尝试推断它们的密码"
                clues={currentAIClues}
                colorAccent="bg-red-50/80"
                buttonColor="bg-gradient-to-r from-red-400 to-red-500"
                onSubmit={store.submitHumanIntercept}
              />
            )}
          </div>
        );

      case 'aiPhaseResult':
        return (
          <div>
            <PhaseIndicator step={6} total={6} label="AI 队结果" color="red" />
            {currentAICode && currentAIClues && (
              <PhaseResultCard
                teamLabel="AI 队"
                colorClass="bg-red-50"
                code={currentAICode}
                clues={currentAIClues}
                teamGuess={currentAITeamGuess}
                teamGuessCorrect={
                  currentAITeamGuess ? checkGuess(currentAITeamGuess, currentAICode) : null
                }
                interceptGuess={currentHumanInterceptGuess}
                interceptCorrect={
                  currentHumanInterceptGuess ? checkGuess(currentHumanInterceptGuess, currentAICode) : null
                }
                interceptorLabel="玩家"
                onContinue={finishAIPhase}
                buttonLabel="查看本轮总结"
              />
            )}
          </div>
        );

      case 'roundEnd':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-solid rounded-2xl shadow-sm p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-100"
            >
              <span className="text-2xl font-black text-slate-400">{round}</span>
            </motion.div>
            <h3 className="text-xl font-bold text-slate-700 mb-1">
              第 {round} 轮结束
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              玩家队：拦截 {humanTeam.interceptCount} · 失误 {humanTeam.miscommunicationCount}
              {'　|　'}
              AI 队：拦截 {aiTeam.interceptCount} · 失误 {aiTeam.miscommunicationCount}
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={advanceToNextRound}
              className="px-10 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-200/50 cursor-pointer"
            >
              下一轮
            </motion.button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const [showMobileHistory, setShowMobileHistory] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 flex gap-5">
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <RoundHistory />
        </aside>
        <main className="flex-1 space-y-4">
          <ScoreBoard />
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileHistory(!showMobileHistory)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-2"
            >
              {showMobileHistory ? '隐藏历史记录' : '查看历史记录'}
            </button>
            <AnimatePresence>
              {showMobileHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <RoundHistory />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {renderPhaseContent()}
        </main>
      </div>
      {phase === 'gameOver' && <GameOverModal />}
    </div>
  );
}

function PhaseIndicator({
  step,
  total,
  label,
  color,
}: {
  step: number;
  total: number;
  label: string;
  color: 'blue' | 'red';
}) {
  const bg = color === 'blue' ? 'bg-blue-500' : 'bg-red-400';
  const bgLight = color === 'blue' ? 'bg-blue-100' : 'bg-red-100';
  const textColor = color === 'blue' ? 'text-blue-600' : 'text-red-500';

  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex gap-0.5">
        {Array.from({ length: total }, (_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={i < step ? { scaleX: 1 } : { scaleX: 1 }}
            className={`h-1.5 w-6 rounded-full ${i < step ? bg : bgLight} transition-colors duration-300`}
          />
        ))}
      </div>
      <span className={`text-sm font-bold ${textColor}`}>{label}</span>
    </div>
  );
}
