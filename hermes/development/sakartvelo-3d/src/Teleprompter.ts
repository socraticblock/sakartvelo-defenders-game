/**
 * Teleprompter.ts
 * Logic for the scrolling narration text, word highlighting, and cinematic focus.
 */
import { ERA_PARAGRAPHS } from './EraData';

export class Teleprompter {
  private _wordTimes: number[] = [];
  private _wordEls: NodeListOf<HTMLElement> | null = null;
  private _rafId: number | null = null;
  private _container: HTMLElement | null = null;
  private _track: HTMLElement | null = null;
  private _progressEl: HTMLElement | null = null;

  init(): void {
    this._container = document.getElementById('era-teleprompter');
    this._track = document.getElementById('era-tp-track');
    this._progressEl = document.getElementById('era-tp-progress');
  }

  /**
   * Generates rough word timings based on character count as a fallback
   * for when the Web Speech API calibration fails or isn't used.
   */
  generateFallbackTimes(): number[] {
    const fullText = ERA_PARAGRAPHS.join(' ');
    const words = fullText.split(/\s+/);
    const times: number[] = [];
    let charIdx = 0;
    words.forEach(w => {
      times.push(charIdx);
      charIdx += w.length + 1;
    });
    this._wordTimes = times;
    return times;
  }

  setWordTimes(times: number[]): void {
    this._wordTimes = times;
  }

  buildTrack(): void {
    if (!this._track) return;
    this._track.innerHTML = '';
    ERA_PARAGRAPHS.forEach(para => {
      const words = para.split(' ');
      words.forEach(word => {
        const span = document.createElement('span');
        span.className = 'tp-word';
        span.textContent = word + ' ';
        this._track!.appendChild(span);
      });
      const sep = document.createElement('span');
      sep.className = 'tp-para-end';
      this._track!.appendChild(sep);
    });
    this._wordEls = document.querySelectorAll<HTMLElement>('#era-tp-track .tp-word');
  }

  start(audioEl: HTMLAudioElement, duration: number, onTick?: () => void): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    
    const tick = () => {
      if (!audioEl || !this._wordEls) return;
      
      this.updateProgress(audioEl.currentTime, audioEl.duration || duration);
      this.syncWords(audioEl.currentTime, audioEl.duration || duration);
      
      onTick?.();

      if (!audioEl.paused && !audioEl.ended) {
        this._rafId = requestAnimationFrame(tick);
      }
    };
    
    this._rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  updateProgress(elapsed: number, total: number): void {
    if (!this._progressEl) return;
    const fmt = (s: number) => {
      if (isNaN(s) || s < 0) return '0:00';
      return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    };
    this._progressEl.textContent = `⏱ ${fmt(elapsed)} / ${fmt(total)}`;
  }

  private syncWords(elapsed: number, duration: number): void {
    if (!this._wordEls || this._wordTimes.length === 0 || duration <= 0) return;

    const lastTime = this._wordTimes[this._wordTimes.length - 1] || 1;
    const scale = duration / lastTime;
    const scaledElapsed = (elapsed + 0.2) / scale; // 200ms lookahead

    // Binary search for current word
    let lo = 0, hi = this._wordTimes.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this._wordTimes[mid] <= scaledElapsed) lo = mid;
      else hi = mid - 1;
    }

    const idx = Math.min(lo, this._wordEls.length - 1);
    const activeWord = this._wordEls[idx];

    if (activeWord && !activeWord.classList.contains('active')) {
      this._wordEls.forEach(el => el.classList.remove('active'));
      activeWord.classList.add('active');
      activeWord.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    }
  }
}

export const teleprompter = new Teleprompter();
