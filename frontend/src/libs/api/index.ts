const API_BASE =
  process.env.NEXT_PUBLIC_ASSISTANT_API_URL || "http://localhost:4217";

export type ChatResponse = {
  answer: string;
  logId?: string;
};

export async function chatWithAssistant(params: {
  message: string;
  sessionId: string;
}): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: params.message,
      sessionId: params.sessionId,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Chat API error (${res.status}): ${text || res.statusText}`,
    );
  }

  return res.json();
}

export type SliceResponse = {
  ok: boolean;
  result: string;
  logId?: string;
};

export async function sliceFromImage(params: {
  file: File;
  instructions: string;
  sessionId: string;
}): Promise<SliceResponse> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("instructions", params.instructions);
  formData.append("sessionId", params.sessionId);

  const res = await fetch(`${API_BASE}/slice-from-image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Slice API error (${res.status}): ${text || res.statusText}`,
    );
  }

  return res.json();
}

export type FeedbackRating = "good" | "bad";

export async function sendFeedback(params: {
  sessionId: string;
  messageId: string;
  rating: FeedbackRating;
  comment?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Feedback API error (${res.status}): ${text || res.statusText}`,
    );
  }
}
