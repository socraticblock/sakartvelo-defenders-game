/**
 * AudioManager.ts
 * Narration, volume controls, and Web Speech API calibration.
 */
import { ERA_PARAGRAPHS } from './EraData';
import { teleprompter } from './Teleprompter';

export class AudioManager {
  private _bgm: HTMLAudioElement | null = null;
  private _bgmVolume = 0.04;
  private _sfxVolume = 1.0;
  private _ctx: AudioContext | null = null;
  private _masterGain: GainNode | null = null;

  private _narrationAudio: HTMLAudioElement | null = null;
  private _eraAudioEl: HTMLAudioElement | null = null;
  private _eraAudioDuration = 0;
  private _eraSessionId = 0;
  _eraPlaying = false;

  init(): void {
    this.bindVolumeControls();
    
    teleprompter.init();

    // Unlock audio context on first click
    document.addEventListener('click', (e) => {
      if (this._ctx && this._ctx.state === 'suspended') {
        this._ctx.resume();
      }
      
      const target = e.target as HTMLElement;
      if (target.closest('button')) {
        this.playClick();
      }
    });
  }

  bindVolumeControls(): void {
    const slider = document.getElementById('vol-narration') as HTMLInputElement | null;
    const val = document.getElementById('vol-narration-val');
    const musicTitleSlider = document.getElementById('vol-music-title') as HTMLInputElement | null;
    const musicTitleVal = document.getElementById('vol-music-title-val');
    const musicEraSlider = document.getElementById('vol-music-era') as HTMLInputElement | null;
    const musicEraVal = document.getElementById('vol-music-era-val');
    const musicLevelSlider = document.getElementById('vol-music-level') as HTMLInputElement | null;
    const musicLevelVal = document.getElementById('vol-music-level-val');
    const musicGameSlider = document.getElementById('vol-music-game') as HTMLInputElement | null;
    const musicGameVal = document.getElementById('vol-music-game-val');
    const sfxGameSlider = document.getElementById('vol-sfx-game') as HTMLInputElement | null;
    const sfxGameVal = document.getElementById('vol-sfx-game-val');

    if (slider) {
      if (!slider.dataset.bound) {
        slider.addEventListener('input', () => {
          if (val) val.textContent = slider.value;
          this._updateSliderBg(slider);
          const vol = parseInt(slider.value) / 100;
          if (this._narrationAudio) this._narrationAudio.volume = vol;
          if (this._eraAudioEl) this._eraAudioEl.volume = vol;
          this._setMusicVolumePercent(parseInt(slider.value));
          if (this._masterGain && this._ctx) {
            this._masterGain.gain.setTargetAtTime(this._sfxVolume * vol, this._ctx.currentTime, 0.1);
          }
        });
        slider.dataset.bound = '1';
      }
      this._updateSliderBg(slider);
    }

    [musicTitleSlider, musicEraSlider, musicLevelSlider, musicGameSlider].forEach(musicSlider => {
      if (!musicSlider) return;
      if (!musicSlider.dataset.bound) {
        musicSlider.addEventListener('input', () => {
          this._setMusicVolumePercent(parseInt(musicSlider.value));
        });
        musicSlider.dataset.bound = '1';
      }
      this._updateSliderBg(musicSlider);
    });

    if (sfxGameSlider) {
      if (!sfxGameSlider.dataset.bound) {
        sfxGameSlider.addEventListener('input', () => {
          const safePct = Math.max(0, Math.min(100, parseInt(sfxGameSlider.value)));
          this._sfxVolume = safePct / 100;
          if (sfxGameVal) sfxGameVal.textContent = String(safePct);
          this._updateSliderBg(sfxGameSlider);
          if (this._masterGain && this._ctx) {
            const narration = slider ? parseInt(slider.value) / 100 : 1;
            this._masterGain.gain.setTargetAtTime(this._sfxVolume * narration, this._ctx.currentTime, 0.05);
          }
        });
        sfxGameSlider.dataset.bound = '1';
      }
      const sfxPct = Math.round(this._sfxVolume * 100);
      sfxGameSlider.value = String(sfxPct);
      if (sfxGameVal) sfxGameVal.textContent = String(sfxPct);
      this._updateSliderBg(sfxGameSlider);
    }

    this._syncMusicUI(
      Math.round((this._bgmVolume / 0.4) * 100),
      musicTitleSlider,
      musicTitleVal,
      musicEraSlider,
      musicEraVal,
      musicLevelSlider,
      musicLevelVal,
      musicGameSlider,
      musicGameVal,
    );
  }

  private _updateSliderBg(el: HTMLInputElement): void {
    el.style.background = `linear-gradient(90deg, #8b6914 ${el.value}%, #3a3020 ${el.value}%)`;
  }

  private _syncMusicUI(
    pct: number,
    musicTitleSlider: HTMLInputElement | null,
    musicTitleVal: HTMLElement | null,
    musicEraSlider: HTMLInputElement | null,
    musicEraVal: HTMLElement | null,
    musicLevelSlider: HTMLInputElement | null,
    musicLevelVal: HTMLElement | null,
    musicGameSlider: HTMLInputElement | null,
    musicGameVal: HTMLElement | null,
  ): void {
    const safePct = Math.round(Math.max(0, Math.min(100, pct)));
    if (musicTitleSlider) {
      musicTitleSlider.value = String(safePct);
      this._updateSliderBg(musicTitleSlider);
    }
    if (musicEraSlider) {
      musicEraSlider.value = String(safePct);
      this._updateSliderBg(musicEraSlider);
    }
    if (musicLevelSlider) {
      musicLevelSlider.value = String(safePct);
      this._updateSliderBg(musicLevelSlider);
    }
    if (musicGameSlider) {
      musicGameSlider.value = String(safePct);
      this._updateSliderBg(musicGameSlider);
    }
    if (musicTitleVal) musicTitleVal.textContent = String(safePct);
    if (musicEraVal) musicEraVal.textContent = String(safePct);
    if (musicLevelVal) musicLevelVal.textContent = String(safePct);
    if (musicGameVal) musicGameVal.textContent = String(safePct);
  }

  private _setMusicVolumePercent(pct: number): void {
    const safePct = Math.max(0, Math.min(100, pct));
    this._bgmVolume = (safePct / 100) * 0.4;
    if (this._bgm) this._bgm.volume = this._bgmVolume;
    this.bindVolumeControls();
  }

  private _getCtx(): AudioContext {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.connect(this._ctx.destination);
      
      // Set initial volume from slider
      const slider = document.getElementById('vol-narration') as HTMLInputElement;
      const vol = slider ? parseInt(slider.value) / 100 : 1.0;
      this._masterGain.gain.setValueAtTime(this._sfxVolume * vol, this._ctx.currentTime);
    }
    return this._ctx;
  }

  // ─── Background Music ────────────────────────────────
  
  playBGM(src: string): void {
    if (this._bgm) {
      if (this._bgm.src.includes(src.replace('./', ''))) return;
      this._bgm.pause();
    }
    this._bgm = new Audio(src);
    this._bgm.loop = true;
    this._bgm.volume = this._bgmVolume; // Default mix
    this._bgm.play().catch(() => {
      // Auto-play might be blocked until first interaction
      document.addEventListener('click', () => this._bgm?.play(), { once: true });
    });
  }

  stopBGM(): void {
    if (!this._bgm) return;
    this._bgm.pause();
    this._bgm.currentTime = 0;
    this._bgm = null;
  }

  lowerMusicVolume(step = 0.08): number {
    this._bgmVolume = Math.max(0, this._bgmVolume - step);
    if (this._bgm) this._bgm.volume = this._bgmVolume;
    return Math.round((this._bgmVolume / 0.4) * 100);
  }

  // ─── Synthesized SFX (Zero Latency) ──────────────────

  playClick(): void {
    const ctx = this._getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.connect(g);
    g.connect(this._masterGain!);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  playBuild(): void {
    const ctx = this._getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
    
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.connect(g);
    g.connect(this._masterGain!);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  playVictory(): void {
    const ctx = this._getCtx();
    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A Major 9
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.15;
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
      
      osc.connect(g);
      g.connect(this._masterGain!);
      osc.start(t);
      osc.stop(t + 1.0);
    });
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
    const sessionId = ++this._eraSessionId;
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
      if (sessionId !== this._eraSessionId) return;
      if (!this._eraPlaying) return;
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

  hardStopEraNarration(): void {
    this._eraSessionId++;
    this._eraPlaying = false;
    if (this._eraAudioEl) {
      this._eraAudioEl.pause();
      this._eraAudioEl.currentTime = 0;
    }
    this._eraAudioEl = null;
    this._eraAudioDuration = 0;
    teleprompter.stop();
    this.resetEraPlayButton('▶ Play Narration');
  }

  seekEraNarration(delta: number): void {
    if (!this._eraAudioEl || isNaN(this._eraAudioDuration) || this._eraAudioDuration === 0) return;
    
    const newTime = Math.max(0, Math.min(this._eraAudioDuration, this._eraAudioEl.currentTime + delta));
    this._eraAudioEl.currentTime = newTime;
    
    if (newTime >= this._eraAudioDuration) {
      this.stopEraNarration();
    } else if (this._eraAudioEl.paused) {
      teleprompter.updateProgress(newTime, this._eraAudioDuration);
      teleprompter.sync(newTime, this._eraAudioDuration);
    }
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
