# Voice AI: TTS & STT (2026)

> Real-time speech-to-text, voice cloning, and expressive TTS — what's available, what's local, and what's production-ready.

## Speech-to-Text (STT)

### Whisper (OpenAI) — Best Local STT

Whisper is the open-source standard for speech recognition. The `whisper_streaming` project (3,600 stars) enables real-time streaming transcription.

```bash
pip install openai-whisper
```

```python
import whisper

model = whisper.load_model("base")  # tiny/base/small/medium/large
result = model.transcribe("audio.mp3", language="en")
print(result["text"])
```

**Model sizes and VRAM:**
| Model | Parameters | VRAM | Relative Speed |
|---|---|---|---|
| tiny | 39M | ~1GB | 32x |
| base | 74M | ~1GB | 16x |
| small | 244M | ~2GB | 6x |
| medium | 769M | ~5GB | 2x |
| large-v3 | 1.55B | ~10GB | 1x |

**Streaming with whisper_streaming:**
```bash
git clone https://github.com/ufal/whisper_streaming.git
cd whisper_streaming
python whisper_streaming.py --model base --language en
```

### Cloud STT Options

| Provider | Model | Accuracy | Latency | Cost |
|---|---|---|---|---|
| **Deepgram** | Nova-3 | Excellent | ~100ms | $0.0043/min |
| **AssemblyAI** | 3.0 | Excellent | ~150ms | $0.00025/min |
| **OpenAI Whisper API** | large-v3 | Very Good | ~500ms | $0.006/min |
| **Google Speech-to-Text** | latest | Good | ~200ms | $0.025/min |

## Text-to-Speech (TTS)

### MiniMax TTS

MiniMax offers high-quality TTS with voice cloning. Used in production for AI podcast generation.

```bash
# MiniMax TTS API call example
curl -X POST "https://api.minimax.chat/v1/t2a_v2" \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -d '{
    "model": "speech-02-hd",
    "text": "Hello, this is a test of the MiniMax TTS system.",
    "stream": true,
    "voice_setting": {
      "voice_id": "moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d"
    }
  }'
```

**MiniMax capabilities:**
- Voice cloning from 20-second audio sample
- Voice IDs: `moss_audio_aaa1346a...` (female), `moss_audio_ce44fc67...` (male)
- Streaming synthesis
- Multi-language (EN, ZH, JP, KR, ID, TH)
- Used by AI podcast generators (MiniMax AI Podcast repo, 60 stars)

**Pricing**: Approximately $0.05/1K characters (T2A) — check current pricing at minimax.chat.

### ElevenLabs

The established premium TTS provider with the largest voice library.

```bash
pip install elevenlabs
```

```python
from elevenlabs import generate, play

audio = generate(
    text="Hello, this is ElevenLabs.",
    voice="Rachel",
    model="eleven_v2"
)
play(audio)
```

**Voice cloning:**
```python
from elevenlabs import clone

voice = clone(
    name="My Voice",
    files=["./my_voice_sample.mp3"]
)
```

**Pricing**: ~$5-22/month (Creator tier), $0.30/1K characters (pay-as-you-go).

### OpenAI TTS

```bash
pip install openai
```

```python
from openai import OpenAI
client = OpenAI()

response = client.audio.speech.create(
    model="gpt-4o-mini-tts",
    voice="alloy",
    input="Hello from OpenAI TTS"
)
response.stream_to_file("output.mp3")
```

**Models**: `tts-1` (fast), `tts-1-hd` (high quality), `gpt-4o-mini-tts` (mini, cheaper).

## Local TTS Options

### Chatterbox TTS (OpenAI-compatible API)

```bash
# Chatterbox runs locally, OpenAI API-compatible
pip install chatterbox-tts
chatterbox serve --port 8080

# Then use with any OpenAI-compatible client
curl -X POST http://localhost:8080/v1/audio/speech \
  -d '{"model":"chatterbox","input":"Hello","voice":"default"}'
```

### Coqui TTS (Local, open)

Coqui offers fully local TTS with speaker cloning from short audio samples. Note: Coqui's licensing changed in 2024 — verify current license before commercial use.

## Voice Conversation (Real-time)

For real-time voice interaction with LLMs:

| Tool | STT | LLM | TTS | Notes |
|---|---|---|---|---|
| **OpenVoice (by MyShell)** | Whisper | Various | ✓ | Instant voice cloning |
| **LiveKit** | Whisper | Any | ✓ | Production-grade real-time |
| **Daily.co** | Deepgram | Any | ✓ | Video + voice |
| **Picovoice** | Porcupine | Any | ✓ | On-device wake word |

## Streaming Audio Pipeline

Typical production stack:
```
Microphone → Whisper (STT) → LLM (Claude/GPT/MiniMax) → TTS (MiniMax/ElevenLabs) → Speaker
```

**LiveKit example:**
```python
from livekit import rtc

# Real-time audio room
room = rtc.Room()
await room.connect("wss://your-livekit-server", "your-token")

# Audio stream: mic → STT → LLM → TTS → remote participant
```

## Sources

- https://github.com/ufal/whisper_streaming (3,600 stars)
- https://github.com/elevenlabs/elevenlabs-python (2,935 stars)
- https://github.com/MiniMax-OpenPlatform/minimax_aipodcast (60 stars)
- https://github.com/openai/whisper
- https://github.com/travisvn/chatterbox-tts-api (582 stars)
