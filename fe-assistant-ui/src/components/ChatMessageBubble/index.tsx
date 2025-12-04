"use client";

import type { ChatMessage } from "./../types";
import clsx from "clsx";

type Props = {
  message: ChatMessage;
};

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const contentToShow = message.content;

  const latencyMs = message.meta?.latencyMs;
  const mode = message.meta?.mode; // "chat" | "slice" | undefined

  const latencyLabel =
    latencyMs != null ? `${(latencyMs / 1000).toFixed(2)}s` : null;

  const modeLabel =
    mode === "slice" ? "slicing" : mode === "chat" ? "chat" : undefined;

  return (
    <div
      className={clsx(
        "flex w-full gap-3 py-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-zinc-950 shadow-sm">
          FE
        </div>
      )}
      <div
        className={clsx(
          "max-w-2xl rounded-2xl px-4 py-2 text-sm shadow-sm border",
          isUser
            ? "bg-emerald-500 text-zinc-950 border-emerald-400"
            : "bg-white text-zinc-900 border-zinc-200",
        )}
      >
        {message.meta?.withImage && (
          <div className="mb-1 text-[10px] text-emerald-700">
            [Gambar dilampirkan untuk slicing]
          </div>
        )}

        <div className="whitespace-pre-wrap break-words">
          {contentToShow}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
          <span>{new Date(message.createdAt).toLocaleTimeString()}</span>

          {latencyLabel && (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-[1px] text-[10px] text-zinc-700">
              ⏱ {latencyLabel}
              {modeLabel && (
                <span className="text-[9px] uppercase tracking-wide text-zinc-500">
                  ({modeLabel})
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex w-full gap-3 py-3">
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-zinc-950 shadow-sm">
        FE
      </div>
      <div className="flex max-w-xs items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs text-zinc-800 border border-zinc-200 shadow-sm">
        <span>Asisten lagi mikir</span>
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
        </span>
      </div>
    </div>
  );
}
