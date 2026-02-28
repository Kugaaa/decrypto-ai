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

  const strategyByRound = round <= 2
    ? `现在是第${round}轮（早期）。
策略：使用间接但队友可理解的联想，建立可延续的线索风格。
- 优先选择关键词的使用场景、功能用途、情感体验等间接联想
- 禁止使用同义词、近义词、上位词（如"苹果"不能用"水果"）
- 禁止使用直接的物理属性描述（如"苹果"不能用"红色圆形"）

好的线索示例：
  关键词"苹果" → "牛顿"（典故联想）或"果园"（场景联想）
  关键词"钢琴" → "黑白"（视觉特征但不直接）或"肖邦"（人物联想）
坏的线索示例：
  关键词"苹果" → "水果"（上位词）或"红色"（太直接）
  关键词"钢琴" → "乐器"（上位词）或"键盘"（太接近）`
    : round <= 4
    ? `现在是第${round}轮（中期），对手已通过历史线索开始分析你的关键词。
策略：每轮必须切换联想维度，增加对手的推断难度。
- 如果之前用了场景联想，这轮改用情感、文化、感官等其他维度
- 可以使用谐音双关、反义暗示、诗词典故
- 关键：让队友能从4个关键词中区分出正确的那个，但对手看到线索后无法确定对应哪个关键词`
    : `现在是第${round}轮（后期），对手已积累大量历史数据，可能已经猜到部分关键词。
策略：使用高度抽象和多义性的线索。
- 使用只有知道关键词才能理解的内部联想（如共同经历、冷知识、非常规用法）
- 可以使用反向联想、隐喻、感受描述
- 每条线索必须与之前所有轮次的线索维度不同
- 目标：即使对手已猜到关键词，也无法从线索反推对应编号`;

  const systemPrompt = `你正在玩桌游"截码战"（Decrypto），担任【加密者】角色。

## 游戏核心矛盾
你需要给出线索让队友猜对密码，但对手也能看到这些线索。如果线索太直白，对手会通过积累多轮线索推断出你的关键词，从而拦截成功。所以线索必须在"队友能懂"和"对手猜不到"之间取得平衡。

## 你的队伍关键词
1号: ${keywords[0]}
2号: ${keywords[1]}
3号: ${keywords[2]}
4号: ${keywords[3]}

## 每个关键词的历史线索（对手也能看到）
${keywordMap}

## 线索规则
- 每条线索必须是1-3个中文词语
- 禁止使用：关键词本身、关键词的一部分、同义词、近义词、上位词/下位词、谐音、英文翻译
- 不能重复之前用过的线索
- 线索应该具有一定区分度——队友能通过线索在4个关键词中选出正确的那个

## 本轮策略
${strategyByRound}`;

  const userPrompt = `本轮密码：${formatCode(code)}

对应关键词：
- 位置1 → 编号${code[0]}「${keywords[code[0] - 1]}」
- 位置2 → 编号${code[1]}「${keywords[code[1] - 1]}」
- 位置3 → 编号${code[2]}「${keywords[code[2] - 1]}」

请为这3个位置各给出1条线索，只输出3行，格式为「编号. 线索词」：
1.
2.
3.`;

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

  const outputFormat = ctx.useThinking
    ? `## 输出格式
只输出一行答案，格式为：答案：X X X（X为1-4的数字，空格分隔，互不相同）

示例：
答案：3 1 4`
    : `## 输出格式
先逐条分析，再给出答案。严格按以下格式：

分析：
- 线索1「XX」→ 与1号"${keywords[0]}"关联度?，与2号"${keywords[1]}"关联度?，与3号"${keywords[2]}"关联度?，与4号"${keywords[3]}"关联度? → 最可能是?号
- 线索2「XX」→ （同上格式）
- 线索3「XX」→ （同上格式）

答案：X X X

注意：答案必须在最后一行，格式为「答案：X X X」，三个数字互不相同。`;

  const systemPrompt = `你正在玩桌游"截码战"（Decrypto），担任【接收者】角色。

## 你的队伍关键词
1号: ${keywords[0]}
2号: ${keywords[1]}
3号: ${keywords[2]}
4号: ${keywords[3]}

## 每个关键词的历史线索
${keywordMap}

## 任务
加密者根据一个你不知道的3位密码给出了3条线索（按密码顺序排列）。你需要判断每条线索分别在暗示哪个关键词编号，从而还原密码。

## 解题方法
对每条线索：
1. 逐一评估它与4个关键词的语义关联度（从含义、场景、感觉等多角度）
2. 参考历史线索模式——同一关键词在不同轮次的线索往往有主题相似性
3. 选出关联度最高的关键词编号
4. 密码由3个不重复的1-4数字组成，如果两条线索指向同一关键词，需要退一步重新权衡

${outputFormat}`;

  const userPrompt = ctx.useThinking
    ? `本轮3条线索：
线索1: ${clues[0]}
线索2: ${clues[1]}
线索3: ${clues[2]}

答案：`
    : `本轮3条线索：
线索1: ${clues[0]}
线索2: ${clues[1]}
线索3: ${clues[2]}

请逐条分析后给出答案：`;

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

  const outputFormat = ctx.useThinking
    ? `## 输出格式
只输出一行答案，格式为：答案：X X X（X为1-4的数字，空格分隔，互不相同）

示例：
答案：2 4 1`
    : `## 输出格式
先分析再给出答案，严格按以下格式：

关键词推断：
- 1号：根据历史线索推断主题为「??」
- 2号：根据历史线索推断主题为「??」
- 3号：根据历史线索推断主题为「??」
- 4号：根据历史线索推断主题为「??」

本轮匹配：
- 线索1「XX」→ 最接近?号（理由简述）
- 线索2「XX」→ 最接近?号（理由简述）
- 线索3「XX」→ 最接近?号（理由简述）

答案：X X X

注意：答案必须在最后一行，格式为「答案：X X X」，三个数字互不相同。`;

  const systemPrompt = `你正在玩桌游"截码战"（Decrypto），担任【拦截者】角色。

## 背景
对手有4个你不知道的秘密关键词（编号1-4）。每轮对手的加密者会为密码中每个数字对应的关键词给出线索。你的目标是通过分析历史线索推断出每个编号对应的关键词主题，然后破解本轮密码。

## 对手的历史线索记录（密码已公开）
${historyTable}

## 分析方法
第一步——归纳关键词主题：
- 看历史记录中，每个编号位置出现过的所有线索
- 找出同一编号下线索的共同特征（语义场、主题、情感等），推断该编号关键词
- 例如：编号2历史出现"海浪""沙滩""蓝色" → 关键词可能是"海洋"

第二步——匹配本轮线索：
- 将本轮每条线索与你推断的4个关键词主题逐一比较
- 选出关联度最高的编号
- 密码由3个不重复的1-4数字组成，如有冲突需重新权衡

${outputFormat}`;

  const userPrompt = ctx.useThinking
    ? `对手本轮3条线索：
线索1: ${opponentClues[0]}
线索2: ${opponentClues[1]}
线索3: ${opponentClues[2]}

答案：`
    : `对手本轮3条线索：
线索1: ${opponentClues[0]}
线索2: ${opponentClues[1]}
线索3: ${opponentClues[2]}

请先推断关键词主题，再匹配本轮线索，最后给出答案：`;

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
