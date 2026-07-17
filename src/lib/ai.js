import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const model = createOpenAICompatible({
  name: 'opencode-go',
  baseURL: 'https://opencode.ai/zen/go/v1',
  headers: {
    Authorization: `Bearer ${process.env.OPENCODE_GO_API_KEY}`,
  },
}).chatModel('deepseek-v4-flash');
