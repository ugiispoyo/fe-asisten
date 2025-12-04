"use client";

import { useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  attachedFileName?: string | null;
  onPickFile: (file: File) => void;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  attachedFileName,
  onPickFile,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      onPickFile(f);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/95 p-3">
      <div className="mx-auto max-w-3xl space-y-2">
        {attachedFileName && (
          <div className="flex items-center justify-between rounded-md border border-emerald-500/70 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-900">
            <span>
              Gambar terpilih:{" "}
              <span className="font-semibold">{attachedFileName}</span>
            </span>
            <span className="text-emerald-700">
              *Prompt dipakai sebagai instruksi slicing.
            </span>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl border border-zinc-700 bg-zinc-900/95 px-3 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mb-1 rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-[11px] text-zinc-100 hover:bg-zinc-700 transition"
          >
            + Gambar
          </button>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Tulis prompt di sini... (Enter kirim, Shift+Enter baris baru)"
            className="flex-1 resize-none bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="mb-1 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 transition"
          >
            Kirim
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="text-[10px] text-zinc-500">
          Tanpa gambar → chat biasa. Dengan gambar → mode slicing aktif.
        </div>
      </div>
    </div>
  );
}
