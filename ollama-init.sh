#!/usr/bin/env bash
set -e

echo "[ollama-init] starting ollama serve..."
ollama serve &
SERVER_PID=$!

# tunggu server siap
sleep 5

# pull model coder
echo "[ollama-init] pulling coder model: ${CODER_MODEL:-qwen2.5-coder:3b}"
ollama pull "${CODER_MODEL:-qwen2.5-coder:3b}" || true

# pull model vision
echo "[ollama-init] pulling vision model: ${VISION_MODEL:-qwen2.5vl:3b}"
ollama pull "${VISION_MODEL:-qwen2.5vl:3b}" || true

echo "[ollama-init] all models pulled. keeping ollama serve running..."
wait "$SERVER_PID"
