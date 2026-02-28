export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  thinkingModel: string | null;
  keyPlaceholder: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    thinkingModel: 'deepseek-reasoner',
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    thinkingModel: 'o3-mini',
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'anthropic-compatible',
    name: 'Claude (兼容接口)',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
    thinkingModel: null,
    keyPlaceholder: 'sk-ant-...',
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    thinkingModel: null,
    keyPlaceholder: '...',
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    thinkingModel: 'qwq-32b',
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    thinkingModel: null,
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'doubao',
    name: '豆包',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-1.5-pro-32k-250115',
    thinkingModel: 'doubao-1.5-thinking-pro-250415',
    keyPlaceholder: '...',
  },
  {
    id: 'custom',
    name: '自定义 (OpenAI 兼容)',
    baseUrl: '',
    model: '',
    thinkingModel: null,
    keyPlaceholder: '...',
  },
];

export function getProvider(id: string): AIProvider {
  return AI_PROVIDERS.find((p) => p.id === id) ?? AI_PROVIDERS[0];
}

const STORAGE_KEY = 'decrypto_provider_keys';

export function loadSavedKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveKeyForProvider(providerId: string, key: string) {
  try {
    const keys = loadSavedKeys();
    keys[providerId] = key;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {}
}

export function loadSavedProvider(): string {
  try {
    return localStorage.getItem('decrypto_provider') || 'deepseek';
  } catch {
    return 'deepseek';
  }
}

export function saveProvider(providerId: string) {
  try {
    localStorage.setItem('decrypto_provider', providerId);
  } catch {}
}
