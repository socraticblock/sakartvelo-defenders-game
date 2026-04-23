/**
 * AudioManager.ts
 * Narration, volume controls, Web Speech API calibration, teleprompter.
 * All audio and speech-related functionality in one place.
 */
export class AudioManager {
  // ─── Narration ────────────────────────────────────────

  private _narrationAudio: HTMLAudioElement | null = null;

  playNarration(src: string): void {
    console.log('[Narration] play:', src);
    if (this._narrationAudio) {
      this._narrationAudio.pause();
      this._narrationAudio = null;
    }
    this._narrationAudio = new Audio(src);
    this._narrationAudio.addEventListener('error', e =>
      console.warn('[Narration] load error:', e)
    );
    this._narrationAudio.addEventListener('canplay', () => {
      this._narrationAudio?.play().catch(e =>
        console.warn('[Narration] play blocked:', e.message)
      );
    }, { once: true });
  }

  stopNarration(): void {
    if (this._narrationAudio) {
      this._narrationAudio.pause();
      this._narrationAudio = null;
    }
  }

  // ─── Chapter narration (Chapter I: Bronze Age) ─────────────────────────────

  playChapterNarration(): void {
    this.playNarration('./audio/narration-chapter1-bronze-age.mp3');
  }

  stopChapterNarration(): void {
    this.stopNarration();
  }

  // ─── Volume setup ───────────────────────────────────

  init(): void {
    const slider = document.getElementById('vol-narration') as HTMLInputElement;
    const val = document.getElementById('vol-narration-val')!;

    const updateBg = (el: HTMLInputElement) => {
      el.style.background = `linear-gradient(90deg, #8b6914 ${el.value}%, #3a3020 ${el.value}%)`;
    };

    slider.addEventListener('input', () => {
      val.textContent = slider.value;
      updateBg(slider);
      const vol = parseInt(slider.value) / 100;
      if (this._narrationAudio) this._narrationAudio.volume = vol;
      if (this._eraAudioEl) this._eraAudioEl.volume = vol;
    });
    updateBg(slider);
  }

  // ─── Teleprompter / Era narration ────────────────────

  private _tpWordTimes: number[] = [];
  private _tpWordEls: NodeListOf<HTMLElement> | null = null;
  private _tpRafId: number | null = null;
  private _tpAudioDuration = 0;
  _eraPlaying = false;
  _eraAudioEl: HTMLAudioElement | null = null;

  private readonly ERA_PARAGRAPHS = [
    "On the eastern shores of the Black Sea, where the Caucasus Mountains plunge into the sea, a civilization flourished for fifteen centuries.",
    "Long before Rome existed, long before Athens wrote its first plays, Bronze Age farmers here were already mining gold, smelting iron, and building sophisticated settlements.",
    "By the sixth century before Christ, Greek ships began arriving at ports along this coast, drawn by Colchis's legendary wealth.",
    "The Greeks told stories in return: Jason and the Argonauts sailing east to steal the Golden Fleece from King Aeetes. The myth was rooted in something real — Colchian gold was extracted by placing sheepskins in mountain streams, trapping gold flakes in the wool.",
    "The Greeks called the people Colchians. Herodotus, visiting in the fifth century BC, noted they resembled Egyptians, a connection that still puzzles historians today.",
    "This was the land of Medea, the sorceress princess. And this was the land archaeologists call Vani, a sacred city of temples and trade, one of the most important Colchian sites.",
    "Colchis endured until eighty-three before the common era, when Mithridates of Pontus conquered it. But the people endured. Their language became Kartuli. Their story never ended.",
    "This is the story of Sakartvelo — a land that refused to fall.",
  ];

  // ─── Web Speech API calibration ──────────────────────

  calibrateWordTimes(): Promise<number[]> {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window)) { resolve([]); return; }
      const fullText = this.ERA_PARAGRAPHS.join(' ');
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.rate = 1.0;
      utterance.volume = 0; // silent calibration
      utterance.pitch = 1.0;
      const times: number[] = [];
      utterance.onboundary = (e) => {
        if (e.name === 'word') times.push(e.charIndex);
      };
      utterance.onend = () => { this._tpWordTimes = times; resolve(times); };
      utterance.onerror = () => { this._tpWordTimes = []; resolve([]); };
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    });
  }

  // ─── Teleprompter rendering ───────────────────────────

  buildEraTeleprompter(): void {
    const track = document.getElementById('era-tp-track')!;
    track.innerHTML = '';
    this.ERA_PARAGRAPHS.forEach(para => {
      const words = para.split(' ');
      words.forEach(word => {
        const span = document.createElement('span');
        span.className = 'tp-word';
        span.textContent = word + ' ';
        track.appendChild(span);
      });
      const sep = document.createElement('span');
      sep.className = 'tp-para-end';
      track.appendChild(sep);
    });
    this._tpWordEls = document.querySelectorAll<HTMLElement>('#era-tp-track .tp-word');
  }

  // ─── Era narration playback ──────────────────────────

  startEraNarration(): void {
    this.buildEraTeleprompter();
    const playBtn = document.getElementById('btn-era-play') as HTMLButtonElement;
    playBtn.textContent = '⏳ Loading...';
    playBtn.classList.add('playing');
    playBtn.disabled = true;
    this._eraPlaying = true;

    const slider = document.getElementById('vol-narration') as HTMLInputElement;
    this._eraAudioEl = new Audio('./audio/narration-era0-intro.mp3');
    this._eraAudioEl.preload = 'auto';
    this._eraAudioEl.volume = parseInt(slider.value) / 100;

    this._eraAudioEl.addEventListener('error', () => {
      playBtn.textContent = '▶ Play Narration';
      playBtn.disabled = false;
      playBtn.classList.remove('playing');
      this._eraPlaying = false;
    });

    this._eraAudioEl.addEventListener('canplay', () => {
      this._tpAudioDuration = this._eraAudioEl!.duration;
      this.updateTpProgress(); // Initial update
      playBtn.textContent = '■ Stop';
      playBtn.disabled = false;
      this._eraAudioEl!.play().catch(e => {
        console.warn('[Narration] play blocked:', e.message);
        playBtn.textContent = '▶ Play Narration';
        playBtn.disabled = false;
        playBtn.classList.remove('playing');
        this._eraPlaying = false;
      });
      if (this._tpRafId) cancelAnimationFrame(this._tpRafId);
      this._tpRafId = requestAnimationFrame(() => this._tpTick());
    }, { once: true });
  }

  stopEraNarration(): void {
    this._eraPlaying = false;
    if (this._tpRafId) { cancelAnimationFrame(this._tpRafId); this._tpRafId = null; }
    if (this._eraAudioEl) { this._eraAudioEl.pause(); this._eraAudioEl = null; }
    const playBtn = document.getElementById('btn-era-play') as HTMLButtonElement;
    playBtn.textContent = '▶ Play Narration';
    playBtn.disabled = false;
    playBtn.classList.remove('playing');
  }

  // ─── Per-frame teleprompter tick ────────────────────

  updateTpProgress(): void {
    const elapsed = this._eraAudioEl?.currentTime || 0;
    const audioDur = this._eraAudioEl?.duration || this._tpAudioDuration || 0;
    const prog = document.getElementById('era-tp-progress')!;
    if (!prog) return;
    const fmt = (s: number) => {
      if (isNaN(s) || s < 0) return '0:00';
      return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    };
    prog.textContent = `⏱ ${fmt(elapsed)} / ${fmt(audioDur)}`;
  }

  private _tpTick(): void {
    if (!this._eraAudioEl || !this._tpWordEls) return;
    this.updateTpProgress();

    const elapsed = this._eraAudioEl.currentTime;
    const audioDur = this._eraAudioEl.duration || this._tpAudioDuration;

    if (this._tpWordTimes.length > 0 && audioDur > 0) {
      const scale = audioDur / (this._tpWordTimes[this._tpWordTimes.length - 1] || 1);
      const scaledElapsed = elapsed / scale;
      let lo = 0, hi = this._tpWordTimes.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (this._tpWordTimes[mid] <= scaledElapsed) lo = mid;
        else hi = mid - 1;
      }
      const wordIdx = Math.min(lo, this._tpWordEls.length - 1);
      if (this._tpWordEls[wordIdx]) {
        this._tpWordEls[wordIdx].scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }

    if (this._eraPlaying && !this._eraAudioEl.ended) {
      this._tpRafId = requestAnimationFrame(() => this._tpTick());
    } else if (this._eraAudioEl?.ended) {
      this.stopEraNarration();
    }
  }
}

// ─── Module-level instance (accessible via window for teleprompter controls) ──

export const audio = new AudioManager();
