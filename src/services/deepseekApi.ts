import { getProvider } from './providers';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICallResult {
  content: string;
  reasoning?: string;
}

function stripThinkingTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

export async function callAI(
  providerId: string,
  apiKey: string,
  messages: ChatMessage[],
  temperature = 0.7,
  useThinking = false,
  customBaseUrl?: string,
  customModel?: string,
): Promise<AICallResult> {
  const provider = getProvider(providerId);

  const baseUrl = providerId === 'custom' && customBaseUrl
    ? customBaseUrl.replace(/\/+$/, '')
    : provider.baseUrl;

  const model = useThinking && provider.thinkingModel
    ? provider.thinkingModel
    : (providerId === 'custom' && customModel ? customModel : provider.model);

  const isThinking = useThinking && !!provider.thinkingModel;

  const body: Record<string, unknown> = { model, messages };
  if (!isThinking) {
    body.temperature = temperature;
  }

  const url = `${baseUrl}/chat/completions`;

  console.log(`[AI] calling ${providerId} model=${model} thinking=${isThinking}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[AI] HTTP ${res.status}:`, text);
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  console.log('[AI] response received, choices:', data.choices?.length ?? 0);

  const choice = data.choices?.[0];
  if (!choice?.message) {
    console.error('[AI] unexpected response structure:', JSON.stringify(data).slice(0, 500));
    throw new Error('API 返回格式异常：缺少 choices 或 message');
  }

  let content: string = choice.message.content ?? '';
  const reasoning: string | undefined = choice.message.reasoning_content ?? undefined;

  content = stripThinkingTags(content);

  if (!content && reasoning) {
    console.warn('[AI] content is empty, extracting answer from reasoning_content');
    const reasoningText = stripThinkingTags(reasoning);
    const lastSection = reasoningText.split('\n\n').pop() ?? '';
    if (lastSection.trim()) {
      content = lastSection.trim();
    }
  }

  if (!content) {
    console.error('[AI] empty content after processing. reasoning present:', !!reasoning);
    throw new Error('AI 模型返回内容为空，请检查模型是否正常工作');
  }

  console.log('[AI] parsed content:', content.slice(0, 200));

  return { content, reasoning };
}
