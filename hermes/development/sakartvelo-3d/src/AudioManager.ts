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
  private _bgmFadeTimer: number | null = null;

  private _narrationAudio: HTMLAudioElement | null = null;
  private _eraAudioEl: HTMLAudioElement | null = null;
  private _eraAudioDuration = 0;
  private _eraSessionId = 0;
  _eraPlaying = false;

  private _arrowBuffer: AudioBuffer | null = null;
  private _lastLifeLostAt = 0;

  init(): void {
    this.bindVolumeControls();
    
    teleprompter.init();
    this._loadArrowSound();

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

  private _playSweep(type: OscillatorType, from: number, to: number, duration: number, gain = 0.15): void {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + duration);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + duration);
    osc.connect(g);
    g.connect(this._masterGain!);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private async _loadArrowSound(): Promise<void> {
    try {
      const response = await fetch('/audio/arrow.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const ctx = this._getCtx();
      this._arrowBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.warn('[Audio] Failed to load arrow sound:', e);
    }
  }

  // ─── Background Music ────────────────────────────────
  
  playBGM(src: string, fadeMs = 2000): void {
    if (this._bgm) {
      if (this._bgm.src.includes(src.replace('./', ''))) return;
      const old = this._bgm;
      const startVolume = old.volume;
      if (this._bgmFadeTimer !== null) window.clearInterval(this._bgmFadeTimer);
      const startedAt = performance.now();
      this._bgmFadeTimer = window.setInterval(() => {
        const t = Math.min(1, (performance.now() - startedAt) / fadeMs);
        old.volume = startVolume * (1 - t);
        if (t >= 1) {
          old.pause();
          old.currentTime = 0;
          if (this._bgmFadeTimer !== null) window.clearInterval(this._bgmFadeTimer);
          this._bgmFadeTimer = null;
        }
      }, 50);
    }
    this._bgm = new Audio(src);
    this._bgm.loop = true;
    this._bgm.volume = fadeMs > 0 ? 0 : this._bgmVolume;
    this._bgm.play().catch(() => {
      // Auto-play might be blocked until first interaction
      document.addEventListener('click', () => this._bgm?.play(), { once: true });
    });
    if (fadeMs > 0) {
      const next = this._bgm;
      const startedAt = performance.now();
      const fadeIn = window.setInterval(() => {
        const t = Math.min(1, (performance.now() - startedAt) / fadeMs);
        next.volume = this._bgmVolume * t;
        if (t >= 1) window.clearInterval(fadeIn);
      }, 50);
    }
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

  playCatapultLaunch(): void { this._playSweep('triangle', 100, 55, 0.16, 0.22); }
  playCatapultImpact(): void { this._playSweep('sine', 80, 45, 0.32, 0.3); }
  playWallDestruction(): void { this._playSweep('sawtooth', 120, 45, 0.55, 0.28); }
  playCriticalHit(): void { this._playSweep('sine', 1800, 2400, 0.1, 0.11); }
  playBossEntrance(): void { this._playSweep('sawtooth', 55, 95, 1.8, 0.22); }
  playBossRoar(): void { this._playSweep('sawtooth', 100, 70, 0.9, 0.2); }
  playBossDeath(): void { this._playSweep('sawtooth', 160, 35, 2.0, 0.28); }
  playGameOver(): void { this._playSweep('sine', 440, 110, 1.4, 0.22); }
  playScreenTransition(): void { this._playSweep('triangle', 2000, 500, 0.2, 0.1); }
  playBuildPhaseStart(): void { this._playSweep('sine', 660, 660, 0.5, 0.14); }
  playBuildPhaseWarning(): void { this._playSweep('sine', 1000, 900, 0.05, 0.08); }
  playTowerUpgrade(): void {
    [400, 600, 800, 1200].forEach((freq, i) => {
      window.setTimeout(() => this._playSweep('sine', freq, freq, 0.12, 0.09), i * 55);
    });
  }
  playTowerSell(): void { this._playSweep('triangle', 300, 100, 0.3, 0.12); }
  playCooldownReady(): void { this._playSweep('sine', 700, 1200, 0.18, 0.09); }
  playBuildHammering(): void { this._playSweep('square', 3000, 2600, 0.04, 0.035); }
  playLowHealthPulse(): void { this._playSweep('sine', 60, 55, 0.18, 0.08); }

  playComboHit(comboCount: number): void {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const baseFreq = 600 + Math.min(comboCount, 8) * 80;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, baseFreq * 1.4), t + 0.08);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(g);
    g.connect(this._masterGain!);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  playWallHit(): void {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(g);
    g.connect(this._masterGain!);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  playBossDeathExplosion(): void {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    // Deep rumble
    const rumble = ctx.createOscillator();
    const rg = ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(60, t);
    rumble.frequency.exponentialRampToValueAtTime(20, t + 1.5);
    rg.gain.setValueAtTime(0.3, t);
    rg.gain.exponentialRampToValueAtTime(0.01, t + 1.8);
    rumble.connect(rg);
    rg.connect(this._masterGain!);
    rumble.start(t);
    rumble.stop(t + 1.85);

    // High shatter
    const shatter = ctx.createOscillator();
    const sg = ctx.createGain();
    shatter.type = 'sine';
    shatter.frequency.setValueAtTime(1200, t);
    shatter.frequency.exponentialRampToValueAtTime(200, t + 0.5);
    sg.gain.setValueAtTime(0.15, t);
    sg.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    shatter.connect(sg);
    sg.connect(this._masterGain!);
    shatter.start(t);
    shatter.stop(t + 0.65);
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

  playLifeLost(): void {
    const now = performance.now();
    if (now - this._lastLifeLostAt < 500) return;
    this._lastLifeLostAt = now;

    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const drone = ctx.createOscillator();
    const fall = ctx.createOscillator();
    const g = ctx.createGain();

    drone.type = 'sine';
    drone.frequency.setValueAtTime(150, t);
    fall.type = 'sine';
    fall.frequency.setValueAtTime(150, t);
    fall.frequency.exponentialRampToValueAtTime(120, t + 0.5);

    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    drone.connect(g);
    fall.connect(g);
    g.connect(this._masterGain!);
    drone.start(t);
    fall.start(t + 0.08);
    drone.stop(t + 0.55);
    fall.stop(t + 0.55);
  }

  playStarReveal(starNumber: number): void {
    const ctx = this._getCtx();
    const baseTime = ctx.currentTime;
    const tones = [880, 1100, 1320].slice(0, Math.max(1, Math.min(3, starNumber)));

    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const t = baseTime + i * 0.08;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.28 + starNumber * 0.06);
      osc.connect(g);
      g.connect(this._masterGain!);
      osc.start(t);
      osc.stop(t + 0.55);
    });

    if (starNumber >= 3) {
      const shimmer = ctx.createOscillator();
      const g = ctx.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(1760, baseTime + 0.2);
      g.gain.setValueAtTime(0.08, baseTime + 0.2);
      g.gain.exponentialRampToValueAtTime(0.01, baseTime + 0.9);
      shimmer.connect(g);
      g.connect(this._masterGain!);
      shimmer.start(baseTime + 0.2);
      shimmer.stop(baseTime + 0.9);
    }
  }

  playVictoryMelody(starCount: number): void {
    const ctx = this._getCtx();
    const t0 = ctx.currentTime;
    const notes = [440, 493.88, 523.25, 659.25, 880]; // A harmonic-minor flavored ascent.
    const clampedStars = Math.max(1, Math.min(3, starCount));

    const playVoice = (type: OscillatorType, gain: number, offset: number, ratio = 1) => {
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const t = t0 + i * 0.2 + offset;
        const duration = i === notes.length - 1 ? 0.65 : 0.24;
        osc.type = type;
        osc.frequency.setValueAtTime(freq * ratio, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(gain, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.01, t + duration);
        osc.connect(g);
        g.connect(this._masterGain!);
        osc.start(t);
        osc.stop(t + duration + 0.05);
      });
    };

    playVoice('sine', 0.18, 0);
    if (clampedStars >= 2) playVoice('triangle', 0.1, 0.04, 1.5);
    if (clampedStars >= 3) {
      playVoice('square', 0.045, 0, 0.5);
      [0.995, 1.005, 1.5].forEach((ratio, i) => {
        const pad = ctx.createOscillator();
        const g = ctx.createGain();
        pad.type = 'sine';
        pad.frequency.setValueAtTime(220 * ratio, t0);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.035, t0 + 0.25 + i * 0.03);
        g.gain.exponentialRampToValueAtTime(0.01, t0 + 1.8);
        pad.connect(g);
        g.connect(this._masterGain!);
        pad.start(t0);
        pad.stop(t0 + 1.9);
      });
    }
  }

  playHeroMagicAttack(): void {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(g);
    g.connect(this._masterGain!);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playHeroMagicImpact(): void {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(720, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.16);
    g.gain.setValueAtTime(0.11, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc.connect(g);
    g.connect(this._masterGain!);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  playHeroHit(): void {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.12);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
    osc.connect(g);
    g.connect(this._masterGain!);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  playHeroDeath(): void {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    [220, 261.63, 329.63].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, t + 1.0);
      g.gain.setValueAtTime(0.08, t + i * 0.02);
      g.gain.exponentialRampToValueAtTime(0.01, t + 1.1);
      osc.connect(g);
      g.connect(this._masterGain!);
      osc.start(t);
      osc.stop(t + 1.1);
    });
  }

  playHeroRespawn(): void {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    [440, 523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.5, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 1.3);
      g.gain.setValueAtTime(0, t + i * 0.08);
      g.gain.linearRampToValueAtTime(0.08, t + 0.35 + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.01, t + 1.55);
      osc.connect(g);
      g.connect(this._masterGain!);
      osc.start(t);
      osc.stop(t + 1.6);
    });
  }

  playArrow(): void {
    if (!this._arrowBuffer) return;
    const ctx = this._getCtx();
    const source = ctx.createBufferSource();
    source.buffer = this._arrowBuffer;
    source.connect(this._masterGain!);
    source.start();
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
