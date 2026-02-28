export type GamePhase =
  | 'idle'
  | 'humanEncrypt'
  | 'humanGuess'
  | 'aiIntercept'
  | 'humanPhaseResult'
  | 'aiEncrypt'
  | 'aiGuess'
  | 'humanIntercept'
  | 'aiPhaseResult'
  | 'roundEnd'
  | 'gameOver';

export type Code = [number, number, number];

export interface TeamState {
  keywords: [string, string, string, string];
  interceptCount: number;
  miscommunicationCount: number;
}

export interface PhaseResult {
  code: Code;
  clues: [string, string, string];
  teamGuess: Code | null;
  teamGuessCorrect: boolean | null;
  interceptGuess: Code | null;
  interceptCorrect: boolean | null;
}

export interface AIThinkingLog {
  role: 'encryptor' | 'guesser' | 'interceptor';
  input: string;
  output: string;
  reasoning?: string;
  timestamp: number;
}

export interface RoundData {
  round: number;
  humanPhase: PhaseResult;
  aiPhase: PhaseResult;
  aiLogs: AIThinkingLog[];
}

export interface GameState {
  phase: GamePhase;
  round: number;
  maxRounds: number;
  humanTeam: TeamState;
  aiTeam: TeamState;
  currentHumanCode: Code | null;
  currentAICode: Code | null;
  currentHumanClues: [string, string, string] | null;
  currentAIClues: [string, string, string] | null;
  currentHumanGuess: Code | null;
  currentAITeamGuess: Code | null;
  currentAIInterceptGuess: Code | null;
  currentHumanInterceptGuess: Code | null;
  history: RoundData[];
  aiThinkingLogs: AIThinkingLog[];
  apiKey: string;
  providerId: string;
  customBaseUrl: string;
  customModel: string;
  useThinking: boolean;
  winner: 'human' | 'ai' | 'draw' | null;
  isAIThinking: boolean;
}
