// components/FeedbackBar.tsx
"use client";

import { useState } from "react";
import clsx from "clsx";
import type { ChatMessage } from "../types";
import { sendFeedback, type FeedbackRating } from "@/libs/api";

type Props = {
  sessionId: string;
  message: ChatMessage;
  onUpdate: (updated: ChatMessage) => void;
};

export function FeedbackBar({ sessionId, message, onUpdate }: Props) {
  const currentRating = message.meta?.rating;
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalComment, setModalComment] = useState(message.meta?.comment ?? "");
  const [modalRating, setModalRating] = useState<FeedbackRating>(
    (message.meta?.rating as FeedbackRating) || "good",
  );

  const handleSimpleRate = async (rating: FeedbackRating) => {
    if (isSending) return;
    setError(null);
    setIsSending(true);

    try {
      await sendFeedback({
        sessionId,
        messageId: message.id,
        rating,
      });

      onUpdate({
        ...message,
        meta: {
          ...message.meta,
          rating,
          // komentar dibiarkan apa adanya
        },
      });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Gagal mengirim feedback.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitModal = async () => {
    if (isSending) return;
    setError(null);
    setIsSending(true);

    try {
      await sendFeedback({
        sessionId,
        messageId: message.id,
        rating: modalRating,
        comment: modalComment || undefined,
      });

      onUpdate({
        ...message,
        meta: {
          ...message.meta,
          rating: modalRating,
          comment: modalComment || undefined,
        },
      });

      setIsModalOpen(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Gagal mengirim feedback.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
        <span className="mr-1">Feedback:</span>
        <button
          type="button"
          onClick={() => void handleSimpleRate("good")}
          disabled={isSending}
          className={clsx(
            "rounded-full border px-2 py-0.5 transition",
            currentRating === "good"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : "border-zinc-700 bg-zinc-900 hover:border-emerald-500 hover:text-emerald-400",
          )}
        >
          👍 Good
        </button>
        <button
          type="button"
          onClick={() => void handleSimpleRate("bad")}
          disabled={isSending}
          className={clsx(
            "rounded-full border px-2 py-0.5 transition",
            currentRating === "bad"
              ? "border-rose-500 bg-rose-500/10 text-rose-400"
              : "border-zinc-700 bg-zinc-900 hover:border-rose-500 hover:text-rose-400",
          )}
        >
          👎 Bad
        </button>

        <button
          type="button"
          onClick={() => {
            setModalRating(
              (message.meta?.rating as FeedbackRating) || modalRating,
            );
            setModalComment(message.meta?.comment ?? "");
            setIsModalOpen(true);
          }}
          className="ml-2 text-[11px] text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
        >
          Tambah komentar
        </button>

        {isSending && (
          <span className="text-[10px] text-zinc-500">Mengirim...</span>
        )}
      </div>

      {error && (
        <div className="mt-1 text-[10px] text-rose-400">{error}</div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-xl">
            <h2 className="text-xs font-semibold text-zinc-100 mb-2">
              Feedback detail
            </h2>

            <div className="mb-3 flex gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setModalRating("good")}
                className={clsx(
                  "flex-1 rounded-full border px-2 py-1 text-center transition",
                  modalRating === "good"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500",
                )}
              >
                👍 Good
              </button>
              <button
                type="button"
                onClick={() => setModalRating("bad")}
                className={clsx(
                  "flex-1 rounded-full border px-2 py-1 text-center transition",
                  modalRating === "bad"
                    ? "border-rose-500 bg-rose-500/10 text-rose-400"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-rose-500",
                )}
              >
                👎 Bad
              </button>
            </div>

            <textarea
              rows={4}
              value={modalComment}
              onChange={(e) => setModalComment(e.target.value)}
              placeholder="Tulis komentar opsional (misalnya: kenapa jawaban ini bagus/buruk)..."
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-emerald-500"
            />

            <div className="mt-3 flex justify-end gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300 hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleSubmitModal()}
                disabled={isSending}
                className="rounded-full bg-emerald-500 px-3 py-1 font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
