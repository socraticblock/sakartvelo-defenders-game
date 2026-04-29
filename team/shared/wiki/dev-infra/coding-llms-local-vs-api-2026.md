# Coding LLMs: Local vs API (2026)

> DeepSeek-Coder-V2, Qwen2.5-Coder, CodeLlama, and Claude 3.5/4 lead the pack. Here's how to choose and run them.

## Top Coding Models 2026

### API-Bound Models

| Model | Provider | Strengths | Benchmark (HumanEval) | Cost |
|---|---|---|---|---|
| **Claude 3.5 Sonnet** | Anthropic | Long context (200K), agentic coding, readability | ~92% | $3/1M input, $15/1M output |
| **Claude 3.7 Sonnet** | Anthropic | Extended thinking, improved reasoning | ~94% | Same as 3.5 |
| **GPT-4.5** | OpenAI | General excellence, broad tooling | ~90% | $75/1M input, $150/1M output |
| **GPT-4o** | OpenAI | Fast, cost-effective GPT-4 level | ~88% | $2.50/1M input, $10/1M output |
| **Gemini 2.5 Pro** | Google | 1M context, native tool use | ~90% | $1.25/1M input, $5/1M output |
| **DeepSeek-Coder-V2** | API / DeepSeek | 338 languages, 128K context, MoE | ~90% | ~$0.14/1M tokens (via DeepSeek API) |

### Local Models

| Model | Size | Quantized Size | VRAM (FP16) | Best For |
|---|---|---|---|---|
| **DeepSeek-Coder-V2** | 236B MoE | ~10GB Q4 | ~20GB sparse | Code completion, 338 languages |
| **Qwen2.5-Coder** | 7B / 14B / 32B | ~4GB / ~8GB / ~18GB Q4 | 14GB / 28GB / 64GB | General coding, Chinese langs |
| **CodeLlama** | 7B / 13B / 34B / 70B | ~4GB / ~7GB / ~18GB / ~38GB Q4 | 14GB / 26GB / 68GB / 145GB | Infill, long-context code |
| **StarCoder2** | 15B | ~8GB Q4 | 30GB | Code completion, permissive license |
| **Mistral Small 3.1** | 22B | ~12GB Q4 | 44GB | Balanced reasoning + coding |
| **Phi-4** | 14B | ~8GB Q4 | 28GB | Lightweight, strong reasoning |
| **Gemma 3 27B** | 27B | ~15GB Q4 | 55GB | Multimodal + code |

## VRAM Requirements by Task

```
Task                      | Model Size | Quantization | VRAM
--------------------------|------------|--------------|------
Simple completions        | 7B Q4      | Q4_K_M       | ~5GB
Code agent (tool use)     | 14B Q4     | Q4_K_M       | ~9GB
Long context (>32K)       | 34B Q4     | Q4_K_M       | ~20GB
Full codebase reasoning   | 70B Q4     | Q4_K_M       | ~40GB
```

## Running Local Coding Models

### With Ollama (easiest)
```bash
ollama run deepseek-coder-v2
ollama run qwen2.5-coder:14b
ollama run codellama:34b
```

### With vLLM (highest throughput)
```bash
pip install vllm

python -m vllm.entrypoints.openai.api_server \
  --model deepseek-ai/DeepSeek-Coder-V2-Instruct \
  --tensor-parallel-size 2 \
  --gpu-memory-utilization 0.9
```

### With llama.cpp (lowest memory)
```bash
# Example: Q5_K_M on 8GB VRAM
./llama-cli -m qwen2.5-coder-7b-q5_k_m.gguf \
  --temp 0.2 \
  -p "### Instruction:\nWrite a Python decorator\n### Response:\n"
```

## Benchmark Comparison (HumanEval+)

| Model | Score | Notes |
|---|---|---|
| Claude 3.7 Sonnet | 94% | Best overall |
| GPT-4.5 | 90% | Strong generalist |
| DeepSeek-Coder-V2 | 90% | Best value, 338 languages |
| Qwen2.5-Coder 32B | 85% | Strong for Chinese dev |
| CodeLlama 34B | 81% | Good infill |
| StarCoder2 15B | 79% | Permissive license (BSL) |

*Note: Benchmarks vary by evaluation method. HumanEval+ is commonly cited.*

## When to Use Local vs API

**Prefer Local When:**
- Data privacy is paramount (code never leaves your machine)
- High volume of daily inferences (cost predictable)
- Offline development
- Custom fine-tuning needed

**Prefer API When:**
- Need Claude 3.5/4 class capability
- Low volume (pay-per-use wins)
- Need Claude's 200K context for large repos
- Rapid prototyping

## Fine-Tuning Local Coding Models

```bash
# With axolotl (Qwen2.5-Coder example)
pip install axolotl

# config: qwen2.5-coder-7b-qlora.yml
base_model: qwen2.5-coder-7b
model_type: qwen2.5
quantization: 4bit
sequence_len: 8192
...

axolotl train qwen2.5-coder-7b-qlora.yml
```

## Key Insight: DeepSeek-Coder-V2 MoE

DeepSeek-Coder-V2 uses a **Mixture-of-Experts** architecture (236B total, 21B active per token). The MoE design means you only activate ~21B parameters per forward pass, making it run at roughly the speed of a 21B model while having 236B total capacity. This is the most capable open coding model as of April 2026.

## Sources

- https://github.com/deepseek-ai/DeepSeek-Coder-V2 (6,631 stars)
- https://github.com/ollama/ollama (169,730 stars)
- https://github.com/vllm-project/vllm (77,752 stars)
- https://arxiv.org/abs/2406.11931 (DeepSeek-Coder-V2 paper)
