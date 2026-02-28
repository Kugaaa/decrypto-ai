import { create } from 'zustand';
import type {
  GameState,
  GamePhase,
  Code,
  RoundData,
  PhaseResult,
  AIThinkingLog,
} from '../types/game';
import { generateCode, checkGuess, checkGameEnd } from '../utils/gameLogic';
import { pickRandomWords } from '../utils/wordList';

interface GameActions {
  setApiKey: (key: string) => void;
  setProvider: (id: string) => void;
  setCustomBaseUrl: (url: string) => void;
  setCustomModel: (model: string) => void;
  setUseThinking: (v: boolean) => void;
  startGame: () => void;
  resetGame: () => void;

  submitHumanClues: (clues: [string, string, string]) => void;
  submitHumanGuess: (guess: Code) => void;
  submitAIIntercept: (guess: Code, log: AIThinkingLog) => void;
  finishHumanPhase: () => void;

  submitAIClues: (clues: [string, string, string], log: AIThinkingLog) => void;
  submitAIGuess: (guess: Code, log: AIThinkingLog) => void;
  submitHumanIntercept: (guess: Code) => void;
  finishAIPhase: () => void;

  advanceToNextRound: () => void;
  addAIThinkingLog: (log: AIThinkingLog) => void;
  setAIThinking: (v: boolean) => void;
  setPhase: (phase: GamePhase) => void;
}

export type GameStore = GameState & GameActions;

const initialState: GameState = {
  phase: 'idle',
  round: 0,
  maxRounds: 8,
  humanTeam: {
    keywords: ['', '', '', ''],
    interceptCount: 0,
    miscommunicationCount: 0,
  },
  aiTeam: {
    keywords: ['', '', '', ''],
    interceptCount: 0,
    miscommunicationCount: 0,
  },
  currentHumanCode: null,
  currentAICode: null,
  currentHumanClues: null,
  currentAIClues: null,
  currentHumanGuess: null,
  currentAITeamGuess: null,
  currentAIInterceptGuess: null,
  currentHumanInterceptGuess: null,
  history: [],
  aiThinkingLogs: [],
  apiKey: '',
  providerId: 'deepseek',
  customBaseUrl: '',
  customModel: '',
  useThinking: false,
  winner: null,
  isAIThinking: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setApiKey: (key: string) => set({ apiKey: key }),
  setProvider: (id: string) => set({ providerId: id }),
  setCustomBaseUrl: (url: string) => set({ customBaseUrl: url }),
  setCustomModel: (model: string) => set({ customModel: model }),
  setUseThinking: (v: boolean) => set({ useThinking: v }),

  startGame: () => {
    const words = pickRandomWords(8);
    const humanCode = generateCode();
    const aiCode = generateCode();
    set({
      phase: 'humanEncrypt',
      round: 1,
      humanTeam: {
        keywords: [words[0], words[1], words[2], words[3]] as [string, string, string, string],
        interceptCount: 0,
        miscommunicationCount: 0,
      },
      aiTeam: {
        keywords: [words[4], words[5], words[6], words[7]] as [string, string, string, string],
        interceptCount: 0,
        miscommunicationCount: 0,
      },
      currentHumanCode: humanCode,
      currentAICode: aiCode,
      currentHumanClues: null,
      currentAIClues: null,
      currentHumanGuess: null,
      currentAITeamGuess: null,
      currentAIInterceptGuess: null,
      currentHumanInterceptGuess: null,
      history: [],
      aiThinkingLogs: [],
      winner: null,
      isAIThinking: false,
    });
  },

  resetGame: () => set(initialState),

  submitHumanClues: (clues) => {
    set({ currentHumanClues: clues, phase: 'humanGuess' });
  },

  submitHumanGuess: (guess) => {
    const { currentHumanCode } = get();
    if (!currentHumanCode) return;
    const correct = checkGuess(guess, currentHumanCode);
    set({
      currentHumanGuess: guess,
      phase: 'aiIntercept',
    });
    if (!correct) {
      set((s) => ({
        humanTeam: {
          ...s.humanTeam,
          miscommunicationCount: s.humanTeam.miscommunicationCount + 1,
        },
      }));
    }
  },

  submitAIIntercept: (guess, log) => {
    const { currentHumanCode } = get();
    if (!currentHumanCode) return;
    const correct = checkGuess(guess, currentHumanCode);
    set((s) => ({
      currentAIInterceptGuess: guess,
      phase: 'humanPhaseResult',
      aiThinkingLogs: [...s.aiThinkingLogs, log],
      aiTeam: correct
        ? { ...s.aiTeam, interceptCount: s.aiTeam.interceptCount + 1 }
        : s.aiTeam,
    }));
  },

  finishHumanPhase: () => {
    set({ phase: 'aiEncrypt', isAIThinking: true });
  },

  submitAIClues: (clues, log) => {
    set((s) => ({
      currentAIClues: clues,
      phase: 'aiGuess',
      aiThinkingLogs: [...s.aiThinkingLogs, log],
    }));
  },

  submitAIGuess: (guess, log) => {
    const { currentAICode } = get();
    if (!currentAICode) return;
    const correct = checkGuess(guess, currentAICode);
    set((s) => ({
      currentAITeamGuess: guess,
      phase: 'humanIntercept',
      isAIThinking: false,
      aiThinkingLogs: [...s.aiThinkingLogs, log],
      aiTeam: !correct
        ? { ...s.aiTeam, miscommunicationCount: s.aiTeam.miscommunicationCount + 1 }
        : s.aiTeam,
    }));
  },

  submitHumanIntercept: (guess) => {
    const { currentAICode } = get();
    if (!currentAICode) return;
    const correct = checkGuess(guess, currentAICode);
    set((s) => ({
      currentHumanInterceptGuess: guess,
      phase: 'aiPhaseResult',
      humanTeam: correct
        ? { ...s.humanTeam, interceptCount: s.humanTeam.interceptCount + 1 }
        : s.humanTeam,
    }));
  },

  finishAIPhase: () => {
    const state = get();
    const humanPhase: PhaseResult = {
      code: state.currentHumanCode!,
      clues: state.currentHumanClues!,
      teamGuess: state.currentHumanGuess,
      teamGuessCorrect: state.currentHumanGuess
        ? checkGuess(state.currentHumanGuess, state.currentHumanCode!)
        : null,
      interceptGuess: state.currentAIInterceptGuess,
      interceptCorrect: state.currentAIInterceptGuess
        ? checkGuess(state.currentAIInterceptGuess, state.currentHumanCode!)
        : null,
    };
    const aiPhase: PhaseResult = {
      code: state.currentAICode!,
      clues: state.currentAIClues!,
      teamGuess: state.currentAITeamGuess,
      teamGuessCorrect: state.currentAITeamGuess
        ? checkGuess(state.currentAITeamGuess, state.currentAICode!)
        : null,
      interceptGuess: state.currentHumanInterceptGuess,
      interceptCorrect: state.currentHumanInterceptGuess
        ? checkGuess(state.currentHumanInterceptGuess, state.currentAICode!)
        : null,
    };
    const roundData: RoundData = {
      round: state.round,
      humanPhase,
      aiPhase,
      aiLogs: [...state.aiThinkingLogs],
    };
    set((s) => ({
      history: [...s.history, roundData],
      phase: 'roundEnd',
    }));
  },

  advanceToNextRound: () => {
    const state = get();
    const nextRound = state.round + 1;
    const endResult = checkGameEnd(
      state.humanTeam,
      state.aiTeam,
      nextRound,
      state.maxRounds
    );
    if (endResult.ended) {
      set({ phase: 'gameOver', winner: endResult.winner, round: nextRound });
      return;
    }
    const humanCode = generateCode();
    const aiCode = generateCode();
    set({
      round: nextRound,
      phase: 'humanEncrypt',
      currentHumanCode: humanCode,
      currentAICode: aiCode,
      currentHumanClues: null,
      currentAIClues: null,
      currentHumanGuess: null,
      currentAITeamGuess: null,
      currentAIInterceptGuess: null,
      currentHumanInterceptGuess: null,
      aiThinkingLogs: [],
      isAIThinking: false,
    });
  },

  addAIThinkingLog: (log) =>
    set((s) => ({ aiThinkingLogs: [...s.aiThinkingLogs, log] })),

  setAIThinking: (v) => set({ isAIThinking: v }),

  setPhase: (phase) => set({ phase }),
}));
