// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FE Assistant Local",
  description: "Asisten frontend lokal dengan Ollama + Next.js UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-950 text-slate-50">{children}</body>
    </html>
  );
}
