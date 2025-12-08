export type Role = "user" | "assistant";

export type ChatMessageMeta = {
  withImage?: boolean;
  rating?: "good" | "bad";
  comment?: string;
  latencyMs?: number;            // berapa ms proses
  mode?: "chat" | "slice";       // jenis respons
};

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  meta?: ChatMessageMeta;
};

export type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
};
