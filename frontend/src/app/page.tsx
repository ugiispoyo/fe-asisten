"use client";

import { useEffect, useRef, useState } from "react";
import { ChatSidebar } from "../components/ChatSidebar";
import { ChatInput } from "../components/ChatInput";
import {
  ChatMessageBubble,
  TypingBubble,
} from "../components/ChatMessageBubble";
import type { ChatMessage, ChatSession } from "../components/types";
import { chatWithAssistant, sliceFromImage } from "@/libs/api";
import { FeedbackBar } from "@/components/FeedbackBar";

const STORAGE_KEY = "fe-assistant-sessions-v1";

function makeId() {
  return Math.random().toString(36).slice(2);
}

function createNewSession(title?: string): ChatSession {
  const now = new Date().toISOString();
  return {
    id: `sess-${now}-${makeId()}`,
    title: title || "New chat",
    createdAt: now,
    messages: [],
  };
}

function deriveTitleFromPrompt(prompt: string): string {
  const clean = prompt.trim().replace(/\s+/g, " ");
  if (!clean) return "New chat";
  const max = 35;
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

export default function HomePage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const s = createNewSession("First chat");
        setSessions([s]);
        setActiveSessionId(s.id);
        return;
      }
      const parsed = JSON.parse(raw) as ChatSession[];
      if (parsed.length > 0) {
        setSessions(parsed);
        setActiveSessionId(parsed[0].id);
      } else {
        const s = createNewSession("First chat");
        setSessions([s]);
        setActiveSessionId(s.id);
      }
    } catch {
      const s = createNewSession("First chat");
      setSessions([s]);
      setActiveSessionId(s.id);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  useEffect(() => {
    if (!activeSession) return;
    scrollToBottom();
  }, [activeSession?.id, activeSession?.messages.length]);

  const upsertSession = (session: ChatSession) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === session.id);
      if (idx === -1) return [session, ...prev];
      const copy = [...prev];
      copy[idx] = session;
      return copy;
    });
  };

  const handleNewChat = () => {
    const s = createNewSession("New chat");
    setSessions((prev) => [s, ...prev]);
    setActiveSessionId(s.id);
    setInput("");
    setAttachedFile(null);
  };
  
  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const prompt = input.trim();
    if (!activeSession) {
      const s = createNewSession(deriveTitleFromPrompt(prompt));
      setSessions((prev) => [s, ...prev]);
      setActiveSessionId(s.id);
    }

    const currentSession =
      sessions.find((s) => s.id === activeSessionId) ??
      createNewSession(deriveTitleFromPrompt(prompt));

    const now = new Date().toISOString();

    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: prompt,
      createdAt: now,
      meta: attachedFile ? { withImage: true } : undefined,
    };

    const updatedSession: ChatSession = {
      ...currentSession,
      title:
        currentSession.messages.length === 0
          ? deriveTitleFromPrompt(prompt)
          : currentSession.title,
      messages: [...currentSession.messages, userMsg],
    };

    upsertSession(updatedSession);
    setInput("");
    setIsSending(true);

    // ⬅️ mulai ukur waktu di sini
    const startedAt =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    try {
      let answerText = "";
      let logId: string | undefined;
      let mode: "chat" | "slice" = "chat";

      if (attachedFile) {
        const res = await sliceFromImage({
          file: attachedFile,
          instructions: prompt,
          sessionId: updatedSession.id,
        });
        answerText = res.result;
        logId = res.logId;
        mode = "slice";
      } else {
        const res = await chatWithAssistant({
          message: prompt,
          sessionId: updatedSession.id,
        });
        answerText = res.answer;
        logId = res.logId;
        mode = "chat";
      }

      const endedAt =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const latencyMs = endedAt - startedAt;

      const assistantMsg: ChatMessage = {
        id: logId || makeId(),
        role: "assistant",
        content: answerText,
        createdAt: new Date().toISOString(),
        meta: {
          ...(attachedFile ? { withImage: true } : {}),
          latencyMs,
          mode,
        },
      };

      upsertSession({
        ...updatedSession,
        messages: [...updatedSession.messages, userMsg, assistantMsg],
      });
    } catch (err: any) {
      const endedAt =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const latencyMs = endedAt - startedAt;

      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content:
          err?.message ||
          "Terjadi error saat menghubungi asisten. Coba cek backend / Ollama.",
        createdAt: new Date().toISOString(),
        meta: {
          latencyMs,
          mode: attachedFile ? "slice" : "chat",
        },
      };
      upsertSession({
        ...updatedSession,
        messages: [...updatedSession.messages, userMsg, assistantMsg],
      });
    } finally {
      setIsSending(false);
      setAttachedFile(null);
    }
  };

  const handlePickFile = (file: File) => {
    setAttachedFile(file);
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      <ChatSidebar
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={(id) => {
          setActiveSessionId(id);
          setInput("");
          setAttachedFile(null);
        }}
        onNew={handleNewChat}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 px-5 py-3">
          <div>
            <h1 className="text-sm font-semibold text-zinc-100">
              FE Assistant – Local
            </h1>
            <p className="text-[11px] text-zinc-400">
              Chat & slicing untuk Next.js, TypeScript, Tailwind. Semua di
              lokal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400">
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1">
              API:{" "}
              {process.env.NEXT_PUBLIC_ASSISTANT_API_URL ??
                "http://localhost:4217"}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1">
              Model via Ollama
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
          <div className="mx-auto flex max-w-3xl flex-col px-4 pb-4 pt-4">
            {!activeSession || activeSession.messages.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center text-sm text-zinc-200 shadow-sm">
                <p className="mb-2 font-medium">
                  Mulai ngobrol dengan asisten frontend lokal.
                </p>
                <p className="text-xs text-zinc-400">
                  Contoh:{" "}
                  <span className="italic">
                    “tolong buatin komponen Next.js + Tailwind untuk hero
                    section landing page”
                  </span>{" "}
                  atau upload gambar lalu kasih instruksi slicing.
                </p>
              </div>
            ) : (
              <div className="w-full h-full max-h-[80vh] overflow-y-auto">
                {activeSession.messages.map((m, i) => (
                  <div key={i}>
                    <ChatMessageBubble message={m} />
                    {m.role === "assistant" && (
                      <div className="ml-11 max-w-2xl">
                        <FeedbackBar
                          sessionId={activeSession.id}
                          message={m}
                          onUpdate={(updated) => {
                            setSessions((prev) =>
                              prev.map((sess) =>
                                sess.id !== activeSession.id
                                  ? sess
                                  : {
                                      ...sess,
                                      messages: sess.messages.map((msg) =>
                                        msg.id === m.id ? updated : msg
                                      ),
                                    }
                              )
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {isSending && <TypingBubble />}

                {/* anchor buat auto-scroll */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isSending}
          attachedFileName={attachedFile?.name ?? null}
          onPickFile={handlePickFile}
        />
      </div>
    </div>
  );
}
