import { getProvider } from './providers';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICallResult {
  content: string;
  reasoning?: string;
}

interface APIChoice {
  message: {
    content: string;
    reasoning_content?: string;
  };
}

interface APIResponse {
  choices: APIChoice[];
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
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const data: APIResponse = await res.json();
  const choice = data.choices[0];
  return {
    content: choice.message.content,
    reasoning: choice.message.reasoning_content,
  };
}
