/**
 * Teleprompter.ts
 * Presents the era narration as a focused three-line prologue window.
 */
import { ERA_PARAGRAPHS } from './EraData';

type Segment = {
  endWord: number;
  startWord: number;
  text: string;
  words: string[];
};

export class Teleprompter {
  private _wordTimes: number[] = [];
  private _rafId: number | null = null;
  private _track: HTMLElement | null = null;
  private _progressEl: HTMLElement | null = null;
  private _segments: Segment[] = [];
  private _activeSegmentIdx = -1;
  private _activeWordIdx = -1;

  init(): void {
    this._track = document.getElementById('era-tp-track');
    this._progressEl = document.getElementById('era-tp-progress');
  }

  generateFallbackTimes(): number[] {
    const fullText = ERA_PARAGRAPHS.join(' ');
    const words = fullText.split(/\s+/).filter(Boolean);
    const times: number[] = [];
    let charIdx = 0;
    words.forEach((word) => {
      times.push(charIdx);
      charIdx += word.length + 1;
    });
    this._wordTimes = times;
    return times;
  }

  setWordTimes(times: number[]): void {
    this._wordTimes = times;
  }

  buildTrack(): void {
    if (!this._track) return;

    const words = ERA_PARAGRAPHS.join(' ').split(/\s+/).filter(Boolean);
    this._segments = this._buildSegments(words);
    this._track.innerHTML = `
      <div class="tp-line tp-line-prev"></div>
      <div class="tp-line tp-line-current"></div>
      <div class="tp-line tp-line-next"></div>
    `;
    this._activeSegmentIdx = -1;
    this._activeWordIdx = -1;
    this._renderWindow(0, 0);
  }

  start(audioEl: HTMLAudioElement, duration: number, onTick?: () => void): void {
    if (this._rafId) cancelAnimationFrame(this._rafId);

    const tick = () => {
      this.updateProgress(audioEl.currentTime, audioEl.duration || duration);
      this.sync(audioEl.currentTime, audioEl.duration || duration);
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

    const formatTime = (seconds: number) => {
      if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
      return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
    };

    this._progressEl.textContent = `${formatTime(elapsed)} / ${formatTime(total)}`;
  }

  sync(elapsed: number, duration: number): void {
    if (this._segments.length === 0 || this._wordTimes.length === 0 || duration <= 0) return;

    const currentWordIdx = this._findWordIndex(elapsed, duration);
    const currentSegmentIdx = this._findSegmentIndex(currentWordIdx);

    if (currentSegmentIdx !== this._activeSegmentIdx || currentWordIdx !== this._activeWordIdx) {
      this._activeSegmentIdx = currentSegmentIdx;
      this._activeWordIdx = currentWordIdx;
      this._renderWindow(currentSegmentIdx, currentWordIdx);
    }
  }

  private _findWordIndex(elapsed: number, duration: number): number {
    const lastTime = this._wordTimes[this._wordTimes.length - 1] || 1;
    const scale = duration / lastTime;
    const scaledElapsed = (elapsed + 0.18) / scale;

    let lo = 0;
    let hi = this._wordTimes.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this._wordTimes[mid] <= scaledElapsed) lo = mid;
      else hi = mid - 1;
    }

    return Math.max(0, Math.min(lo, this._wordTimes.length - 1));
  }

  private _findSegmentIndex(wordIdx: number): number {
    for (let i = 0; i < this._segments.length; i++) {
      const segment = this._segments[i];
      if (wordIdx >= segment.startWord && wordIdx <= segment.endWord) {
        return i;
      }
    }
    return 0;
  }

  private _renderWindow(segmentIdx: number, activeWordIdx: number): void {
    if (!this._track || this._segments.length === 0) return;

    const prevEl = this._track.querySelector<HTMLElement>('.tp-line-prev');
    const currentEl = this._track.querySelector<HTMLElement>('.tp-line-current');
    const nextEl = this._track.querySelector<HTMLElement>('.tp-line-next');
    if (!prevEl || !currentEl || !nextEl) return;

    const prevSegment = this._segments[Math.max(0, segmentIdx - 1)];
    const currentSegment = this._segments[segmentIdx] || this._segments[0];
    const nextSegment = this._segments[Math.min(this._segments.length - 1, segmentIdx + 1)];

    prevEl.textContent = segmentIdx > 0 ? prevSegment.text : '';
    nextEl.textContent = segmentIdx < this._segments.length - 1 ? nextSegment.text : '';
    currentEl.innerHTML = '';

    currentSegment.words.forEach((word, relativeIdx) => {
      const span = document.createElement('span');
      span.className = 'tp-word';
      span.textContent = `${word} `;

      const absoluteWordIdx = currentSegment.startWord + relativeIdx;
      if (absoluteWordIdx === activeWordIdx) {
        span.classList.add('active');
      }

      currentEl.appendChild(span);
    });
  }

  private _buildSegments(words: string[]): Segment[] {
    const segments: Segment[] = [];
    let bucket: string[] = [];
    let startWord = 0;
    let charCount = 0;

    const flush = (endWord: number) => {
      if (bucket.length === 0) return;
      segments.push({
        endWord,
        startWord,
        text: bucket.join(' '),
        words: [...bucket],
      });
      bucket = [];
      charCount = 0;
      startWord = endWord + 1;
    };

    words.forEach((word, idx) => {
      bucket.push(word);
      charCount += word.length + 1;

      const sentenceEdge = /[.!?]$/.test(word);
      const clauseEdge = /[,;:]$/.test(word);
      const longEnough = bucket.length >= 7;
      const tooLong = bucket.length >= 11 || charCount >= 58;
      const naturalBreak = longEnough && (sentenceEdge || clauseEdge || charCount >= 44);

      if (tooLong || naturalBreak) {
        flush(idx);
      }
    });

    flush(words.length - 1);
    return segments;
  }
}

export const teleprompter = new Teleprompter();
