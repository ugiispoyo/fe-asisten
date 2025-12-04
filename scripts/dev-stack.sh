#!/usr/bin/env bash
set -e

# ==========
# CONFIG
# ==========
CODER_MODEL="${CODER_MODEL:-qwen2.5-coder:3b}"
VISION_MODEL="${VISION_MODEL:-qwen2.5vl:3b}"

# Kalau OLLAMA_MODELS belum diset dari luar, pakai ./ollama-data
MODELS_DIR="${OLLAMA_MODELS:-$PWD/ollama-data}"
export OLLAMA_MODELS="$MODELS_DIR"

API_CMD="${API_CMD:-pnpm dev}"

echo "🚀 FE Assistant Dev Stack"
echo "📁 Models dir: $MODELS_DIR"

# Pastikan folder models ada
if [ ! -d "$MODELS_DIR" ]; then
  echo "📂 Membuat folder models di: $MODELS_DIR"
  mkdir -p "$MODELS_DIR"
fi

# ==========
# 1. CEK OLLAMA ADA / NGGAK
# ==========
if ! command -v ollama >/dev/null 2>&1; then
  echo "⚠️  Ollama belum terinstall."

  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS. Coba install via Homebrew..."

    if command -v brew >/dev/null 2>&1; then
      echo "➡️  Menjalankan: brew install ollama"
      brew install ollama
    else
      echo "❌ Homebrew tidak ditemukan."
      echo "Silakan install Ollama manual dari https://ollama.com/download"
      exit 1
    fi
  else
    echo "❌ OS bukan macOS. Silakan install Ollama manual sesuai OS-mu:"
    echo "    https://ollama.com/download"
    exit 1
  fi
else
  echo "✅ Ollama sudah terinstall."
fi

# ==========
# 2. CEK OLLAMA SERVE UDAH NYALA / BELUM
# ==========
echo "🔍 Cek apakah ollama serve sudah jalan..."
if curl -sSf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "✅ ollama serve sudah jalan."
else
  echo "▶️  Menjalankan ollama serve di background (pakai OLLAMA_MODELS=$MODELS_DIR)..."
  ollama serve >/tmp/ollama-serve.log 2>&1 &
  OLLAMA_PID=$!

  # tunggu ready
  echo "⏳ Menunggu ollama siap..."
  until curl -sSf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; do
    sleep 2
  done

  echo "✅ ollama siap. (pid: ${OLLAMA_PID})"
fi

# helper buat cek & pull model kalau belum ada
check_or_pull_model() {
  local MODEL_NAME="$1"

  echo "🔍 Cek model: $MODEL_NAME di $MODELS_DIR"

  local TAGS
  TAGS="$(curl -sSf http://127.0.0.1:11434/api/tags || echo '{}')"

  if echo "$TAGS" | grep -q "\"name\":\"${MODEL_NAME}\""; then
    echo "✅ Model sudah ada: ${MODEL_NAME}"
  else
    echo "⬇️  Model belum ada, pull: ${MODEL_NAME}"
    ollama pull "${MODEL_NAME}"
  fi
}

# ==========
# 3. CEK MODEL DARI FOLDER OLLAMA-DATA (VIA OLLAMA)
# ==========
# Karena OLLAMA_MODELS sudah diarahkan ke $MODELS_DIR,
# semua cek/pull akan menggunakan folder itu.
check_or_pull_model "$CODER_MODEL"
check_or_pull_model "$VISION_MODEL"

echo "✅ Semua model siap di folder: $MODELS_DIR"

# ==========
# 4. JALANKAN API
# ==========
echo "▶️  Menjalankan API: ${API_CMD}"
echo "   (Ctrl+C untuk stop)"

exec ${API_CMD}
