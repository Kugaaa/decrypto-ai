import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import {
  AI_PROVIDERS,
  getProvider,
  loadSavedKeys,
  saveKeyForProvider,
  loadSavedProvider,
  saveProvider,
} from '../services/providers';

function DecorativeShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-blue-100/40 blur-3xl animate-float" />
      <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full bg-red-100/40 blur-3xl animate-float-delay" />
      <div className="absolute top-1/4 right-10 w-16 h-16 rounded-xl bg-blue-200/30 rotate-12 animate-float-slow" />
      <div className="absolute bottom-1/3 left-16 w-12 h-12 rounded-lg bg-red-200/30 -rotate-12 animate-float" />
      <div className="absolute top-20 left-1/3 w-8 h-8 rounded-full bg-amber-200/30 animate-float-delay" />
    </div>
  );
}

const titleLetters = '截码战'.split('');
const subtitleLetters = 'DECRYPTO'.split('');

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const savedKeys = loadSavedKeys();
  const [selectedProvider, setSelectedProvider] = useState(loadSavedProvider);
  const [key, setKey] = useState(() => savedKeys[loadSavedProvider()] || '');
  const [thinking, setThinking] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [error, setError] = useState('');
  const store = useGameStore();

  const currentProvider = getProvider(selectedProvider);
  const hasThinking = !!currentProvider.thinkingModel;

  const handleProviderChange = (id: string) => {
    setSelectedProvider(id);
    setKey(savedKeys[id] || '');
    setError('');
    const p = getProvider(id);
    if (!p.thinkingModel) setThinking(false);
  };

  const handleStart = () => {
    if (!key.trim()) {
      setError('请输入 API Key');
      return;
    }
    if (selectedProvider === 'custom' && !customBaseUrl.trim()) {
      setError('请输入自定义 Base URL');
      return;
    }
    if (selectedProvider === 'custom' && !customModel.trim()) {
      setError('请输入模型名称');
      return;
    }
    saveKeyForProvider(selectedProvider, key.trim());
    saveProvider(selectedProvider);
    store.setApiKey(key.trim());
    store.setProvider(selectedProvider);
    store.setCustomBaseUrl(customBaseUrl.trim());
    store.setCustomModel(customModel.trim());
    store.setUseThinking(thinking);
    store.startGame();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative">
      <DecorativeShapes />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl w-full relative z-10"
      >
        <div className="mb-6 sm:mb-10">
          <div className="flex justify-center gap-1 mb-3">
            {titleLetters.map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 * i, type: 'spring', stiffness: 120 }}
                className={`text-5xl sm:text-6xl font-black ${i < 2 ? 'text-blue-500' : 'text-red-400'}`}
              >
                {char}
              </motion.span>
            ))}
          </div>
          <div className="flex justify-center gap-0.5">
            {subtitleLetters.map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + 0.04 * i }}
                className="text-sm text-slate-400 tracking-[0.3em] font-medium"
              >
                {char}
              </motion.span>
            ))}
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="h-0.5 w-24 mx-auto mt-4 bg-gradient-to-r from-blue-300 via-slate-200 to-red-300 rounded-full"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="card rounded-2xl shadow-lg shadow-slate-200/50 p-5 sm:p-8 mb-6 sm:mb-8 text-left"
        >
          <h2 className="text-lg font-bold mb-5 text-slate-700 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-blue-400 to-red-300 rounded-full" />
            游戏规则
          </h2>
          <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
            <p>
              <strong className="text-blue-500">玩家队</strong> 和
              <strong className="text-red-400"> AI 队</strong>
              各拥有 4 个秘密关键词（编号 1-4），对方看不到。
            </p>
            <p>
              每轮，双方的
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-semibold mx-0.5 border border-blue-100">加密者</span>
              会抽到一个 3 位密码（如 2-4-1），需要为每个数字对应的关键词各给出一条线索。
            </p>
            <p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50/60 text-blue-500 text-xs font-semibold mx-0.5 border border-blue-100/60">接收者</span>
              根据线索猜测密码，对手也会尝试拦截破解你的密码。
            </p>

            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 mt-3 border border-slate-100">
              <p className="font-semibold text-slate-700 mb-2 text-xs uppercase tracking-wider">胜负条件</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>次成功拦截对方密码 → 获胜</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>次己方沟通失败 → 失败</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold flex-shrink-0">8</span>
                  <span>轮结束后比较拦截次数</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50/80 to-blue-50/30 rounded-xl p-4 mt-2 border border-blue-100/50">
              <p className="font-semibold text-slate-700 mb-2 text-xs uppercase tracking-wider">本局设定</p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-600 text-xs font-semibold border border-blue-200/50">加密者</span>
                  <span>固定给出线索</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-500 text-xs font-semibold border border-blue-100">接收者</span>
                  <span>负责猜测己方密码、拦截对方密码</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-red-50 text-red-400 text-xs font-semibold border border-red-100">AI</span>
                  <span>由 LLM 驱动，两个 AI 独立思考</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(59,130,246,0.25)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          className="px-8 sm:px-10 py-3 sm:py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-base sm:text-lg font-semibold shadow-md shadow-blue-200/50 cursor-pointer"
        >
          开始游戏
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="card rounded-2xl shadow-2xl shadow-slate-300/30 p-5 sm:p-8 w-full max-w-md mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg sm:text-xl font-bold mb-1 text-slate-700">设置 AI 对手</h3>
              <p className="text-sm text-slate-400 mb-4 sm:mb-5">选择 AI 厂商并输入 API Key</p>

              {/* Provider selector */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mb-4">
                {AI_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      selectedProvider === p.id
                        ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {/* Model info */}
              <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
                <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  {selectedProvider === 'custom' ? (customModel || '自定义模型') : currentProvider.model}
                </span>
                {hasThinking && (
                  <span className="bg-blue-50 text-blue-400 px-2 py-0.5 rounded border border-blue-100">
                    Thinking: {currentProvider.thinkingModel}
                  </span>
                )}
              </div>

              {/* Custom provider fields */}
              {selectedProvider === 'custom' && (
                <div className="space-y-2 mb-3">
                  <input
                    type="text"
                    placeholder="Base URL (如 https://api.example.com/v1)"
                    value={customBaseUrl}
                    onChange={(e) => { setCustomBaseUrl(e.target.value); setError(''); }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="模型名称 (如 gpt-4o)"
                    value={customModel}
                    onChange={(e) => { setCustomModel(e.target.value); setError(''); }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
                  />
                </div>
              )}

              {/* API Key */}
              <input
                type="password"
                placeholder={currentProvider.keyPlaceholder}
                value={key}
                onChange={(e) => { setKey(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors mb-3"
              />

              {/* Thinking toggle */}
              {hasThinking && (
                <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl cursor-pointer mb-2 border border-slate-100 hover:border-blue-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={thinking}
                    onChange={(e) => setThinking(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-300 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Thinking 模型</p>
                    <p className="text-xs text-slate-400">{currentProvider.thinkingModel} · 深度推理 · 较慢</p>
                  </div>
                </label>
              )}

              {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleStart}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-200/50 hover:shadow-md transition-shadow cursor-pointer"
                >
                  开始游戏
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
