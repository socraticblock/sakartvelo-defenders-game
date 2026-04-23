/**
 * AudioManager.ts
 * Narration, volume controls, and Web Speech API calibration.
 */
import { ERA_PARAGRAPHS } from './EraData';
import { teleprompter } from './Teleprompter';

export class AudioManager {
  private _narrationAudio: HTMLAudioElement | null = null;
  private _eraAudioEl: HTMLAudioElement | null = null;
  private _eraAudioDuration = 0;
  _eraPlaying = false;

  init(): void {
    const slider = document.getElementById('vol-narration') as HTMLInputElement;
    const val = document.getElementById('vol-narration-val')!;
    if (!slider) return;

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
    
    teleprompter.init();
  }

  // ─── Narration ────────────────────────────────────────

  playNarration(src: string): void {
    if (this._narrationAudio) {
      this._narrationAudio.pause();
      this._narrationAudio = null;
    }
    this._narrationAudio = new Audio(src);
    this._narrationAudio.addEventListener('canplay', () => {
      this._narrationAudio?.play().catch(e => console.warn('[Narration] play blocked:', e.message));
    }, { once: true });
  }

  stopNarration(): void {
    if (this._narrationAudio) {
      this._narrationAudio.pause();
      this._narrationAudio = null;
    }
  }

  playChapterNarration(): void {
    this.playNarration('./audio/narration-chapter1-bronze-age.mp3');
  }

  // ─── Era Narration ───────────────────────────────────

  startEraNarration(): void {
    const playBtn = document.getElementById('btn-era-play') as HTMLButtonElement;
    
    if (this._eraAudioEl && !this._eraPlaying) {
      this._eraPlaying = true;
      playBtn.textContent = '⏸ Pause';
      this._eraAudioEl.play();
      teleprompter.start(this._eraAudioEl, this._eraAudioDuration);
      return;
    }

    this._eraPlaying = true;
    playBtn.textContent = '⏳ Loading...';
    playBtn.classList.add('playing');
    playBtn.disabled = true;

    teleprompter.buildTrack(); // Render text immediately
    teleprompter.updateProgress(0, 0); // Show initial 0:00

    const slider = document.getElementById('vol-narration') as HTMLInputElement;
    this._eraAudioEl = new Audio('./audio/narration-era0-intro.mp3');
    this._eraAudioEl.volume = slider ? parseInt(slider.value) / 100 : 1;

    this._eraAudioEl.addEventListener('error', () => {
      this.resetEraPlayButton();
      this._eraPlaying = false;
      this._eraAudioEl = null;
    });

    this._eraAudioEl.addEventListener('canplay', () => {
      if (!this._eraAudioEl) return;
      this._eraAudioDuration = this._eraAudioEl.duration;
      playBtn.textContent = '⏸ Pause';
      playBtn.disabled = false;
      this._eraAudioEl.play();
      teleprompter.start(this._eraAudioEl, this._eraAudioDuration, () => {
        if (this._eraAudioEl?.ended) this.stopEraNarration();
      });
    }, { once: true });
  }

  stopEraNarration(): void {
    this._eraPlaying = false;
    if (this._eraAudioEl) this._eraAudioEl.pause();
    teleprompter.stop();
    this.resetEraPlayButton(this._eraAudioEl?.ended ? '▶ Play Narration' : '▶ Resume');
  }

  private resetEraPlayButton(label = '▶ Play Narration'): void {
    const playBtn = document.getElementById('btn-era-play') as HTMLButtonElement;
    if (playBtn) {
      playBtn.textContent = label;
      playBtn.disabled = false;
      playBtn.classList.remove('playing');
    }
  }

  // ─── Calibration ─────────────────────────────────────

  calibrateWordTimes(): Promise<number[]> {
    return new Promise(resolve => {
      const fallback = () => resolve(teleprompter.generateFallbackTimes());
      if (!('speechSynthesis' in window)) return fallback();
      
      const fullText = ERA_PARAGRAPHS.join(' ');
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.volume = 0; 
      const times: number[] = [];
      utterance.onboundary = (e) => { if (e.name === 'word') times.push(e.charIndex); };
      utterance.onend = () => {
        if (times.length > 0) { teleprompter.setWordTimes(times); resolve(times); }
        else fallback();
      };
      utterance.onerror = fallback;
      setTimeout(() => { if (times.length === 0) fallback(); }, 1500);
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    });
  }
}

export const audio = new AudioManager();
