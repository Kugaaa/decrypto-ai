import type { Code, TeamState, RoundData } from '../types/game';

export function generateCode(): Code {
  const pool = [1, 2, 3, 4];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1], shuffled[2]] as Code;
}

export function checkGuess(guess: Code, code: Code): boolean {
  return guess[0] === code[0] && guess[1] === code[1] && guess[2] === code[2];
}

export type GameEndResult =
  | { ended: false }
  | { ended: true; winner: 'human' | 'ai' | 'draw'; reason: string };

export function checkGameEnd(
  humanTeam: TeamState,
  aiTeam: TeamState,
  round: number,
  maxRounds: number
): GameEndResult {
  if (humanTeam.miscommunicationCount >= 2 && aiTeam.miscommunicationCount >= 2) {
    return { ended: true, winner: 'draw', reason: '双方均出现2次沟通失败' };
  }
  if (humanTeam.miscommunicationCount >= 2) {
    return { ended: true, winner: 'ai', reason: '玩家队出现2次沟通失败' };
  }
  if (aiTeam.miscommunicationCount >= 2) {
    return { ended: true, winner: 'human', reason: 'AI队出现2次沟通失败' };
  }

  if (humanTeam.interceptCount >= 2 && aiTeam.interceptCount >= 2) {
    return { ended: true, winner: 'draw', reason: '双方均成功拦截2次' };
  }
  if (humanTeam.interceptCount >= 2) {
    return { ended: true, winner: 'human', reason: '玩家队成功拦截2次' };
  }
  if (aiTeam.interceptCount >= 2) {
    return { ended: true, winner: 'ai', reason: 'AI队成功拦截2次' };
  }

  if (round > maxRounds) {
    if (humanTeam.interceptCount > aiTeam.interceptCount) {
      return { ended: true, winner: 'human', reason: `${maxRounds}轮结束，玩家队拦截更多` };
    }
    if (aiTeam.interceptCount > humanTeam.interceptCount) {
      return { ended: true, winner: 'ai', reason: `${maxRounds}轮结束，AI队拦截更多` };
    }
    return { ended: true, winner: 'draw', reason: `${maxRounds}轮结束，双方拦截次数相同` };
  }

  return { ended: false };
}

export function parseCodeInput(input: string): Code | null {
  const nums = input
    .replace(/[,，\s-]+/g, ' ')
    .trim()
    .split(' ')
    .map(Number);
  if (nums.length !== 3) return null;
  if (nums.some((n) => n < 1 || n > 4 || !Number.isInteger(n))) return null;
  const unique = new Set(nums);
  if (unique.size !== 3) return null;
  return nums as unknown as Code;
}

export function formatCode(code: Code): string {
  return code.join(' - ');
}

export function buildClueHistoryTable(
  history: RoundData[],
  team: 'human' | 'ai'
): string {
  if (history.length === 0) return '暂无历史记录';
  const lines: string[] = ['回合 | 线索1 | 线索2 | 线索3 | 密码'];
  for (const r of history) {
    const phase = team === 'human' ? r.humanPhase : r.aiPhase;
    lines.push(
      `R${r.round}  | ${phase.clues[0]} | ${phase.clues[1]} | ${phase.clues[2]} | ${formatCode(phase.code)}`
    );
  }
  return lines.join('\n');
}

/**
 * Build a per-keyword clue history for roles that know the keywords (encryptor & guesser).
 * Groups all past clues by the keyword number they were given for.
 */
export function buildKeywordClueMap(
  history: RoundData[],
  team: 'human' | 'ai',
  keywords: [string, string, string, string]
): string {
  if (history.length === 0) return '暂无历史记录';

  const map: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };

  for (const r of history) {
    const phase = team === 'human' ? r.humanPhase : r.aiPhase;
    phase.code.forEach((num, idx) => {
      map[num].push(`R${r.round}:${phase.clues[idx]}`);
    });
  }

  const lines: string[] = [];
  for (let n = 1; n <= 4; n++) {
    const clueList = map[n].length > 0 ? map[n].join('、') : '(暂无)';
    lines.push(`编号${n}「${keywords[n - 1]}」← ${clueList}`);
  }
  return lines.join('\n');
}
