import ollama from 'ollama';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const CODER_MODEL = process.env.CODER_MODEL ?? 'qwen2.5-coder:3b';

export async function chatWithCoder(messages: ChatMessage[]): Promise<string> {
  const res = await ollama.chat({
    model: CODER_MODEL,
    messages,
  });

  return res.message.content;
}
