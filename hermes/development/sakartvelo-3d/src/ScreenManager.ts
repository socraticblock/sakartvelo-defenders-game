/**
 * ScreenManager.ts
 * Manages game screens (Intro, Era, Level Select, Game Over).
 */
import { gs } from './GameState';
import { LevelSelect } from './LevelSelect';
import { audio } from './AudioManager';
import { culturalFacts } from './CulturalFacts';
import { Hero } from './Hero';

type OnLevelSelect = (era: number, level: number) => void;
type OnEscape = () => void;

export class ScreenManager {
  private _onLevelSelect: OnLevelSelect | null = null;
  private _onEscape: OnEscape | null = null;

  init(onLevelSelect: OnLevelSelect, onEscape: OnEscape): void {
    this._onLevelSelect = onLevelSelect;
    this._onEscape = onEscape;

    this._bindIntroButtons();
    this._bindEraButtons();
    this._bindGameOverButtons();
    this._bindLevelCompleteButtons();
    this._bindTutorial();
    
    culturalFacts.init();
  }

  // ─── Screen Transitions ───────────────────────────────────────────────

  private _showScreen(id: string): void {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
    document.getElementById(id)?.classList.add('visible');
  }

  showIntro(): void { this._showScreen('screen-title'); }
  showTitleScreen(): void { this.showIntro(); }

  showEraScreen(): void {
    this._showScreen('screen-era');
    audio.startEraNarration();
  }

  showLevelSelect(): void {
    const container = document.getElementById('level-select');
    if (container) {
      container.innerHTML = LevelSelect(gs.allLevels, (e, l) => this._onLevelSelect?.(e, l));
    }
    this._showScreen('screen-level-select');
  }

  hideGameOver(): void {
    document.getElementById('screen-game-over')?.classList.remove('visible');
  }

  hideLevelComplete(): void {
    document.getElementById('screen-level-complete')?.classList.remove('visible');
  }

  showTutorial(levelNum: number): void {
    // Only show tutorial for specific levels if needed
    if (levelNum === 1) {
      document.getElementById('tutorial-overlay')?.classList.add('visible');
    }
  }

  startCulturalFacts(): void {
    culturalFacts.start();
  }

  showGameOver(victory: boolean, message: string, stars: number): void {
    const screen = document.getElementById('screen-game-over')!;
    const title = document.getElementById('game-over-title')!;
    const msg = document.getElementById('game-over-msg')!;
    const starsEl = document.getElementById('game-over-stars')!;

    title.textContent = victory ? 'VICTORY!' : 'DEFEAT';
    title.style.color = victory ? '#d4a017' : '#ff4444';
    msg.textContent = message;
    starsEl.textContent = '⭐'.repeat(stars);

    this._showScreen('screen-game-over');
  }

  showLevelComplete(message: string, stars: number): void {
    const msg = document.getElementById('lc-msg')!;
    const starsEl = document.getElementById('lc-stars')!;
    msg.textContent = message;
    starsEl.textContent = '⭐'.repeat(stars);
    this._showScreen('screen-level-complete');
  }

  // ─── Binding ──────────────────────────────────────────────────────────

  private _bindIntroButtons(): void {
    document.getElementById('btn-title-continue')?.addEventListener('click', () => this.showEraScreen());
  }

  private _bindEraButtons(): void {
    document.getElementById('btn-era-play')?.addEventListener('click', () => {
      if (audio._eraPlaying) audio.stopEraNarration();
      else audio.startEraNarration();
    });

    document.getElementById('btn-era-prev')?.addEventListener('click', () => {
      audio.seekEraNarration(-10);
    });

    document.getElementById('btn-era-next')?.addEventListener('click', () => {
      audio.seekEraNarration(10);
    });

    document.getElementById('btn-era-continue')?.addEventListener('click', () => {
      audio.stopEraNarration();
      this.showLevelSelect();
    });
  }

  private _bindGameOverButtons(): void {
    document.getElementById('go-menu')?.addEventListener('click', () => this.showLevelSelect());
    document.getElementById('btn-go-retry')?.addEventListener('click', () => {
      if (gs.currentLevel) this._onLevelSelect?.(gs.currentLevel.era, gs.currentLevel.level);
    });
  }

  private _bindLevelCompleteButtons(): void {
    document.getElementById('lc-menu')?.addEventListener('click', () => this.showLevelSelect());
    document.getElementById('lc-next')?.addEventListener('click', () => {
      // Logic for next level...
    });
  }

  // ─── HUD / Tutorial ──────────────────────────────────────────────────

  updateAbilities(hero: Hero): void {
    this._updateAbility('ability-q', hero.abilityQCooldown, hero.abilityQMaxCooldown);
    this._updateAbility('ability-w', hero.abilityWCooldown, hero.abilityWMaxCooldown);
    this._updateAbility('ability-e', hero.abilityECooldown, hero.abilityEMaxCooldown);
  }

  private _updateAbility(id: string, cd: number, maxCd: number): void {
    const el = document.getElementById(id) as HTMLButtonElement;
    if (!el) return;
    if (cd > 0) {
      el.disabled = true;
      el.style.opacity = '0.5';
      el.textContent = `${Math.ceil(cd)}s`;
    } else {
      el.disabled = false;
      el.style.opacity = '1';
      el.textContent = id.split('-')[1].toUpperCase();
    }
  }

  private _bindTutorial(): void {
    document.getElementById('tutorial-close')?.addEventListener('click', () => {
      document.getElementById('tutorial-overlay')?.classList.remove('visible');
    });
  }
}

export const screenMgr = new ScreenManager();
