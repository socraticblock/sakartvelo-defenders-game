# Prompting Techniques That Actually Work (2026)

> Chain-of-thought, structured output, few-shot, and XML tagging — battle-tested patterns for production LLM use.

## Chain of Thought (CoT)

CoT elicits intermediate reasoning steps before the final answer. Effective for complex reasoning, math, and multi-step debugging.

### Standard CoT
```
Question: If a train leaves Chicago at 6 AM traveling 80 mph, 
and another leaves New York at 8 AM traveling 60 mph 
(the distance is 790 miles), when do they meet?

Answer (with CoT):
- Train 1 travels from 6 AM: let t = hours after 6 AM
- Train 2 starts 2 hours later, so it travels (t-2) hours  
- Distance equation: 80t + 60(t-2) = 790
- 80t + 60t - 120 = 790
- 140t = 910
- t = 6.5 hours after 6 AM = 12:30 PM

Answer: They meet at 12:30 PM.
```

### Zero-Shot CoT ("Think Step by Step")
```
Prompt: "Solve this. Think step by step. Then give your final answer."
```

Adding "Think step by step" to any prompt triggers reasoning in most modern models (GPT-4, Claude 3.5+, Gemini 2.5+).

### Chain-of-Thought with Verification (CoTdv)
```
Prompt: "Solve this problem. Show your reasoning. 
Then double-check your reasoning for flaws. 
Then give your final answer."
```

## Structured Output

For deterministic parsing, use JSON schema or Zod validation.

### OpenAI / Claude / vLLM via structured output

```python
from pydantic import BaseModel

class CodeReview(BaseModel):
    severity: Literal["critical", "high", "medium", "low"]
    line_number: int
    issue: str
    suggestion: str
    cwe_id: str | None

response = client.beta.messages.create(
    model="claude-3-7-sonnet-20250227",
    messages=[{"role": "user", "content": prompt}],
    response_format=CodeReview
)
```

### Guidance (Microsoft) — Regex-Guided Generation

```python
from guidance import gen, select, namespace

g = guidance(
    "Review this code: "
    "```python\n{{code}}\n```"
    "Severity: {{select name='severity' options=['critical', 'high', 'medium', 'low']}}"
    "Issue: {{gen name='issue' pattern='[A-Z][a-z ]+' stop='\\n'}}"
)

result = g(code="def eval(): exec(input())")
```

### Outlines (inference) — Guaranteed Valid JSON

```python
from outlines import models, generate, json

model = models.openai("gpt-4o")

@json
def code_review(code: str) -> CodeReview:
    """Review code and return structured findings."""
    ...

result = code_review("def eval(): exec(input())")
# Always returns valid CodeReview, never malformed JSON
```

## Few-Shot Prompting

Provide 3-5 concrete examples to teach the output format or behavior.

### Good Few-Shot Pattern
```
Task: Extract key-value pairs from product descriptions.

Example 1:
Input: "The iPhone 15 Pro has a 6.1-inch display, A17 Pro chip, 
        256GB storage, and costs $999."
Output: {"display": "6.1-inch", "chip": "A17 Pro", "storage": "256GB", "price": "$999"}

Example 2:
Input: "Samsung Galaxy S24 Ultra features a 6.8-inch screen, 
        Snapdragon 8 Gen 3, 512GB, $1299."
Output: {"display": "6.8-inch", "chip": "Snapdragon 8 Gen 3", "storage": "512GB", "price": "$1299"}

Example 3:
Input: "MacBook Air M4: 13.6-inch Retina, 16GB RAM, 512GB SSD, $1199."
Output: {{gen ...}}

Now your turn:
Input: "Google Pixel 9 Pro XL has a 6.7-inch display, Tensor G4 chip, 
        256GB, priced at $1099."
Output:
```

### When Few-Shot Works vs Fails

**Works:** Output format shaping, domain-specific extraction, tone calibration, classification tasks.

**Fails:** Tasks that require reasoning the examples don't demonstrate, or when the model already knows the pattern from pretraining.

## XML Tagging for Tool Use

For MCP tools and function calling, wrap context in XML tags to reduce confusion:

```
<context>
  <working_directory>/home/user/project</working_directory>
  <files>
    <file path="src/main.py">
      def hello():
          print("world")
    </file>
  </files>
  <tool_results>
    <tool name="grep" output="42:  return x / y"/>
  </tool_results>
</context>

<Task>Fix the division by zero bug</Task>
```

Claude and GPT-4o respond better to XML-tagged context than raw JSON when using tool-augmented generation.

## System Prompt Best Practices

1. **Be explicit about output format** — "Always respond as JSON" vs "respond in a structured way"
2. **Set the persona crisply** — "You are a senior backend engineer..." works better than vague role assignment
3. **Chain constraints together** — "Never guess. If unsure, say 'I don't know'. Never make up APIs."
4. **Put critical instructions last** — LLM attention is stronger at the end of the context window

```python
SYSTEM_PROMPT = """You are a senior backend engineer specializing in Python FastAPI.
- Always use type hints
- Prefer async/await patterns
- Never return mock data — call actual functions
- If you don't know something, say so explicitly
- Format all code with Black conventions
"""
```

## Claude's Extended Thinking (2026)

Claude 3.7 Sonnet introduced `thinking: { type: "enabled", budget_tokens: 16000 }`. This lets Claude reason extensively before responding:

```python
response = client.messages.create(
    model="claude-3-7-sonnet-20250227",
    messages=[{"role": "user", "content": "Design a distributed rate limiter"}],
    thinking={
        "type": "enabled",
        "budget_tokens": 16000  # More tokens = deeper reasoning
    }
)
print(response.content[1].thinking)  # The extended reasoning
print(response.content[0].text)      # The final answer
```

## GRPO and RLVR (Reinforcement Learning with Verifiable Rewards)

Emerging in 2026: Models trained with GRPO (Group Relative Policy Optimization) show dramatically improved reasoning. DeepSeek-Math and the GRPO-VPS paper (arxiv:2604.20669) demonstrate that RLVR — training on verifiable rewards (not human feedback) — produces models that self-correct mid-reasoning.

For prompting: Models trained with GRPO respond particularly well to:
- Asking for step-by-step verification
- Prompting to "check your work" after initial answer
- Structured error analysis

## Sources

- https://arxiv.org/abs/2401.12976 (CoT paper)
- https://github.com/microsoft/guidance
- https://github.com/outlines-dev/outlines
- https://github.com/danswer-ai/danswer (production RAG + prompting examples)
- arxiv:2604.20669 (GRPO-VPS, 2026-04-22)
