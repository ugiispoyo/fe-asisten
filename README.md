Asisten lokal untuk frontend engineer:

- Fokus **React + Nextjs + TypeScript + Tailwind**
- Bantu **slicing desain → komponen React**
- Bantu **integrasi API backend** (service layer, hooks, dsb.)
- Punya **memori** (ingat koreksi & preferensi per project)
- Jalan pakai **LLM lokal (Ollama)** + **API Node.js lokal**

---

## Arsitektur

```text
[ VSCode / Postman / Web UI ]
              │  (HTTP)
              ▼
      [ FE Assistant API ]  ← Node.js + TypeScript (lokal, npm/pnpm dev)
              │
      ┌───────┴────────┐
      ▼                ▼
[ Ollama LLM (Docker) ]   [ Memory ]
  - qwen2.5-coder         - data/memories.json
  - qwen2.5-vl
```

## Prasyarat

- Ram Minimal (16GB)
- Node.js 22.x + pnpm (atau npm)

## Cara jalanin

### 1. Cara Pakai

- Run api 

```bash 
cd backend
pnpm i
pnpm run dev:stack
```

- Run WEB UI

```bash
cd frontend
pnpm i
pnpm run dev
```

- Run Extension

```bash
cd vscode-extension
pnpm i
pnpm run compile
```