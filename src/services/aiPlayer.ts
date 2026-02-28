import type { Code, RoundData, AIThinkingLog } from '../types/game';
import { callAI, type ChatMessage } from './deepseekApi';
import { buildClueHistoryTable, buildKeywordClueMap, formatCode } from '../utils/gameLogic';

export class AIParseError extends Error {
  log: AIThinkingLog;
  constructor(message: string, log: AIThinkingLog) {
    super(message);
    this.name = 'AIParseError';
    this.log = log;
  }
}

export interface AICallContext {
  providerId: string;
  apiKey: string;
  useThinking: boolean;
  customBaseUrl?: string;
  customModel?: string;
}

function parseCluesFromResponse(text: string): [string, string, string] | null {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  const clues: string[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*\d[.、:：)\]]\s*(.+)/);
    if (match) {
      clues.push(match[1].trim());
    }
  }
  if (clues.length >= 3) return [clues[0], clues[1], clues[2]];

  if (lines.length >= 3) {
    return [lines[0].trim(), lines[1].trim(), lines[2].trim()];
  }
  return null;
}

function parseCodeFromResponse(text: string): Code | null {
  const validate = (nums: number[]): Code | null => {
    if (nums.length < 3) return null;
    const triple = nums.slice(0, 3) as unknown as Code;
    return new Set(triple).size === 3 ? triple : null;
  };

  // 1) 优先从「答案：X X X」行提取
  const answerLine = text.match(/答案[：:]\s*([1-4])[\s,、]+([1-4])[\s,、]+([1-4])/);
  if (answerLine) {
    const code = validate([+answerLine[1], +answerLine[2], +answerLine[3]]);
    if (code) return code;
  }

  // 2) 从最后一行提取数字（答案通常在末尾）
  const lastLine = text.trim().split('\n').pop() ?? '';
  const lastNums = lastLine.match(/[1-4]/g);
  if (lastNums) {
    const code = validate(lastNums.map(Number));
    if (code) return code;
  }

  // 3) fallback: 全文最后 3 个 1-4 数字
  const allNums = text.match(/[1-4]/g);
  if (allNums && allNums.length >= 3) {
    const tail = allNums.slice(-3).map(Number);
    const code = validate(tail);
    if (code) return code;
  }

  return null;
}

// ─── AI 加密者 ───

export async function aiEncrypt(
  ctx: AICallContext,
  keywords: [string, string, string, string],
  code: Code,
  history: RoundData[],
): Promise<{ clues: [string, string, string]; log: AIThinkingLog }> {
  const keywordMap = buildKeywordClueMap(history, 'ai', keywords);
  const round = history.length + 1;

  const systemPrompt = `你正在玩桌游"截码战"（Decrypto），担任【加密者】角色。

## 你的队伍关键词
1号: ${keywords[0]}
2号: ${keywords[1]}
3号: ${keywords[2]}
4号: ${keywords[3]}

## 每个关键词的历史线索（对手也能看到这些线索）
${keywordMap}

## 任务
收到一个3位密码后，为密码中每个数字对应的关键词给出1条线索（共3条），让队友能根据线索推断出正确的关键词编号，从而还原密码。

## 约束
- 每条线索必须是1-3个中文词语
- 不能直接使用关键词本身、关键词的一部分、谐音或英文翻译
- 不能重复之前已经用过的线索
- 3条线索之间也不能雷同

## 出题策略（非常重要）
${round <= 2 ? `现在是第${round}轮（早期），可以给出与关键词有较明确关联的线索，帮助队友建立对关键词的认知。但避免过于直白的同义词。` : round <= 4 ? `现在是第${round}轮（中期），对手已经开始通过历史线索分析你的关键词了。请使用更间接的关联方式：
- 文化背景联想（诗词、典故、俗语）
- 功能/用途/场景联想
- 形状/颜色/质感等感官联想
- 避免每次都用同一类关联角度` : `现在是第${round}轮（后期），对手已积累大量历史数据。你必须非常小心：
- 使用抽象的、多义性强的线索
- 换一种全新的关联维度（如果之前用了功能联想，改用情感联想）
- 可以使用反向联想、隐喻、双关语
- 目标：让队友的解读路径与对手的分析路径产生区分`}`;

  const userPrompt = `本轮密码：${formatCode(code)}

对应关键词：
- 位置1 → 编号${code[0]}「${keywords[code[0] - 1]}」
- 位置2 → 编号${code[1]}「${keywords[code[1] - 1]}」
- 位置3 → 编号${code[2]}「${keywords[code[2] - 1]}」

请为这3个位置各给出1条线索。

## 输出格式（严格遵守）
只输出3行线索，每行格式为「编号. 线索词」，不要输出任何解释或其他文字。

示例输出：
1. 温暖
2. 奔跑
3. 星空

请输出：`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const result = await callAI(ctx.providerId, ctx.apiKey, messages, 0.7, ctx.useThinking, ctx.customBaseUrl, ctx.customModel);
  const clues = parseCluesFromResponse(result.content);

  if (!clues) {
    console.error('[aiEncrypt] failed to parse clues from response:', result.content);
    throw new AIParseError('AI 加密者输出格式异常，无法解析线索', {
      role: 'encryptor',
      input: userPrompt,
      output: result.content,
      reasoning: result.reasoning,
      timestamp: Date.now(),
    });
  }

  console.log('[aiEncrypt] clues:', clues);
  return {
    clues,
    log: {
      role: 'encryptor',
      input: userPrompt,
      output: result.content,
      reasoning: result.reasoning,
      timestamp: Date.now(),
    },
  };
}

// ─── AI 接收者（知道关键词，不知道密码）───

export async function aiGuess(
  ctx: AICallContext,
  keywords: [string, string, string, string],
  clues: [string, string, string],
  history: RoundData[],
): Promise<{ guess: Code; log: AIThinkingLog }> {
  const keywordMap = buildKeywordClueMap(history, 'ai', keywords);

  const systemPrompt = `你正在玩桌游"截码战"（Decrypto），担任【接收者】角色。

## 你的队伍关键词
1号: ${keywords[0]}
2号: ${keywords[1]}
3号: ${keywords[2]}
4号: ${keywords[3]}

## 每个关键词的历史线索
${keywordMap}

## 任务
加密者根据一个你不知道的3位密码给出了3条线索（按密码顺序排列）。你需要判断每条线索分别在暗示哪个关键词，从而还原密码。

## 解题方法
对每条线索，逐一考虑它与4个关键词的关联度，参考历史线索模式，选出关联度最高的关键词编号。
注意：密码由3个不重复的1-4数字组成。如果出现冲突，重新权衡各线索的最可能匹配。

## 输出格式（严格遵守）
只输出一行答案，不要输出任何分析过程、解释或其他文字。
格式：答案：X X X （X为1-4的数字，用空格分隔，三个数字互不相同）

示例输出：
答案：3 1 4`;

  const userPrompt = `本轮加密者给出的3条线索（按密码位置顺序）：
线索1: ${clues[0]}
线索2: ${clues[1]}
线索3: ${clues[2]}

请直接输出答案，不要分析：
答案：`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const result = await callAI(ctx.providerId, ctx.apiKey, messages, 0.3, ctx.useThinking, ctx.customBaseUrl, ctx.customModel);
  const guess = parseCodeFromResponse(result.content);

  if (!guess) {
    console.error('[aiGuess] failed to parse code from response:', result.content);
    throw new AIParseError('AI 接收者输出格式异常，无法解析密码', {
      role: 'guesser',
      input: userPrompt,
      output: result.content,
      reasoning: result.reasoning,
      timestamp: Date.now(),
    });
  }

  console.log('[aiGuess] guess:', guess);
  return {
    guess,
    log: {
      role: 'guesser',
      input: userPrompt,
      output: result.content,
      reasoning: result.reasoning,
      timestamp: Date.now(),
    },
  };
}

// ─── AI 拦截者（不知道对手关键词）───

export async function aiIntercept(
  ctx: AICallContext,
  opponentClues: [string, string, string],
  opponentHistory: RoundData[],
  team: 'human' | 'ai',
): Promise<{ guess: Code; log: AIThinkingLog }> {
  const historyTable = buildClueHistoryTable(opponentHistory, team === 'ai' ? 'human' : 'ai');

  const systemPrompt = `你正在玩桌游"截码战"（Decrypto），担任【拦截者】角色。

## 背景
对手有4个你不知道的秘密关键词（编号1-4）。每轮对手的加密者会为3位密码中每个数字对应的关键词给出线索。你的目标是通过分析历史线索推断出每个编号对应的关键词主题，然后破解本轮密码。

## 对手的历史线索记录（密码已公开）
${historyTable}

## 分析方法
第一步——归纳关键词主题：观察每个编号位置历史上收到的所有线索，找出共同特征推断关键词。
第二步——匹配本轮线索：将本轮每条线索与推断的4个关键词主题匹配，选出关联度最高的编号。
注意：密码由3个不重复的1-4数字组成。

## 输出格式（严格遵守）
只输出一行答案，不要输出任何分析过程、解释或其他文字。
格式：答案：X X X （X为1-4的数字，用空格分隔，三个数字互不相同）

示例输出：
答案：2 4 1`;

  const userPrompt = `对手本轮3条线索（按密码位置顺序）：
线索1: ${opponentClues[0]}
线索2: ${opponentClues[1]}
线索3: ${opponentClues[2]}

请直接输出答案，不要分析：
答案：`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const result = await callAI(ctx.providerId, ctx.apiKey, messages, 0.3, ctx.useThinking, ctx.customBaseUrl, ctx.customModel);
  const guess = parseCodeFromResponse(result.content);

  if (!guess) {
    console.error('[aiIntercept] failed to parse code from response:', result.content);
    throw new AIParseError('AI 拦截者输出格式异常，无法解析密码', {
      role: 'interceptor',
      input: userPrompt,
      output: result.content,
      reasoning: result.reasoning,
      timestamp: Date.now(),
    });
  }

  console.log('[aiIntercept] guess:', guess);
  return {
    guess,
    log: {
      role: 'interceptor',
      input: userPrompt,
      output: result.content,
      reasoning: result.reasoning,
      timestamp: Date.now(),
    },
  };
}
