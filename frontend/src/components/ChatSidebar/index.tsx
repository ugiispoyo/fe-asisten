"use client";

import type { ChatSession } from "@/components/types";
import clsx from "clsx";

type Props = {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
};

export function ChatSidebar({ sessions, activeId, onSelect, onNew }: Props) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-800 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-xs font-semibold text-zinc-100">
          FE Assistant
        </span>
        <button
          onClick={onNew}
          className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-zinc-950 shadow-sm hover:bg-emerald-400 transition"
        >
          + New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 text-xs">
        {sessions.length === 0 && (
          <div className="mt-4 px-2 text-[11px] text-zinc-500">
            Belum ada chat. Klik <span className="font-semibold">New</span> untuk mulai.
          </div>
        )}

        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={clsx(
              "w-full rounded-lg px-3 py-2 text-left transition",
              activeId === s.id
                ? "bg-zinc-800 text-zinc-50 shadow-sm"
                : "text-zinc-300 hover:bg-zinc-850/70 hover:text-zinc-50",
            )}
          >
            <div className="truncate text-[11px] font-medium">
              {s.title || "Untitled"}
            </div>
            <div className="mt-0.5 text-[10px] text-zinc-500">
              {new Date(s.createdAt).toLocaleString()}
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-zinc-800 px-4 py-3 text-[10px] text-zinc-500">
        Model lokal via Ollama. Kode & memori tetap di device kamu.
      </div>
    </aside>
  );
}
