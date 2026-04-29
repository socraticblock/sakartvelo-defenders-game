# Ollama Local LLM Guide (2026)

> Ollama lets you run open models (Llama, Qwen, DeepSeek, Gemma, Kimi-K2.5, GLM-5, MiniMax) locally with a single command. 169k GitHub stars as of April 2026.

## Installation

```bash
# macOS
curl -fsSL https://ollama.com/install.sh | sh

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
irm https://ollama.com/install.ps1 | iex

# Docker
docker run -d -v ollama:/root/.ollama -p 11434:11434 ollama/ollama
```

## Supported Models (April 2026)

Ollama's library covers the full spread of open-weight models:

| Model Family | Notable Variants | VRAM (FP16) | Quantized (Q4) |
|---|---|---|---|
| **Llama 3.3 / 3.1** | 8B, 70B | 16GB, 144GB | ~5GB, ~40GB |
| **Qwen 2.5** | 7B, 14B, 32B, 72B | 14GB, 28GB, 64GB, 145GB | ~4GB, ~8GB, ~18GB, ~40GB |
| **DeepSeek V2 / Coder-V2** | 16B, 236B MoE | 32GB (sparse) | ~10GB |
| **Gemma 3** | 4B, 12B, 27B | 8GB, 24GB, 55GB | ~2.5GB, ~7GB, ~15GB |
| **GLM-5** | 9B, 12B | 18GB, 24GB | ~5GB, ~7GB |
| **Kimi-K2.5** | 20B MoE | ~20GB | ~10GB |
| **Mistral Small 3.1** | 22B | 44GB | ~12GB |
| **Phi-4** | 14B | 28GB | ~8GB |

**Key new additions (2026):** Kimi-K2.5, GLM-5, MiniMax, DeepSeek (full stack), Qwen-2.5, Gemma 3.

## Usage Patterns

### CLI Chat
```bash
ollama run qwen2.5:7b        # Interact with Qwen 7B
ollama run deepseek-coder-v2  # Code-specialized model
ollama run gemma3:12b         # Vision + text
```

### REST API
```bash
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5:7b",
  "messages": [{"role": "user", "content": "Explain async Python"}],
  "stream": false
}'
```

### Python SDK
```bash
pip install ollama
```

```python
from ollama import chat

response = chat(
    model='qwen2.5:7b',
    messages=[{'role': 'user', 'content': 'Write a FastAPI endpoint'}]
)
print(response.message.content)
```

### JavaScript
```bash
npm i ollama
```

```javascript
import ollama from "ollama";
const response = await ollama.chat({
  model: 'qwen2.5:7b',
  messages: [{ role: 'user', content: 'Why is the sky blue?' }],
});
console.log(response.message.content);
```

## Model Management

```bash
ollama list              # Show installed models
ollama pull qwen2.5:14b   # Download a model
ollama rm qwen2.5:7b      # Remove a model
ollama show qwen2.5:7b    # Display model info
ollama create custom --from qwen2.5:7b  # Create Modelfile variant
```

## Integrations (New in 2026)

Ollama now ships built-in launch targets for AI coding assistants:

```bash
ollama launch claude   # Connect to Claude Code
ollama launch opencode  # Connect to OpenCode
ollama launch codex     # Connect to OpenAI Codex CLI
ollama launch openclaw  # Personal AI assistant (WhatsApp, Telegram, Slack, Discord)
```

## Quantization for Low VRAM

Ollama uses llama.cpp under the hood. The `pull` command auto-selects Q4 quantization if your GPU is detected as having < 16GB VRAM.

For manual control, specify in a Modelfile:
```bash
FROM qwen2.5:7b
PARAMETER num_gpu 1
PARAMETER low_vram true
```

For a 24GB consumer GPU (e.g., RTX 4090, RTX 5070), these work well:
- **Q4_K_M** quantization: balances quality and size
- **Q5_K_M** quantization: near-FP16 quality, 30% larger
- **IQ4_XS**: excellent quality/speed on AMD ROCm

## Multimodal Models

```bash
ollama run gemma3:12b   # Image understanding
ollama run llava:34b     # Large vision model
```

Vision models require additional VRAM. gemma3:12b-vision needs ~16GB FP16.

## Backend

Ollama wraps **llama.cpp** (GGUF format) for CPU+GPU inference. For pure throughput on a server with multiple GPUs, consider vLLM instead — Ollama is optimized for developer ergonomics and single-node use.

## Common Issues

- **Slow inference on CPU**: Ollama defaults to CPU when no GPU is detected. Install CUDA/ROCm drivers.
- **Model not found**: `ollama pull <model>` before running.
- **Context length**: Set `PARAMETER num_ctx 8192` in a Modelfile for longer contexts.
- **API rate limits**: Ollama has no rate limits locally — unlimited inference.

## Sources

- https://github.com/ollama/ollama (169,730 stars, updated 2026-04-23)
- https://ollama.com/library
- https://docs.ollama.com
