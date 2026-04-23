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
    
    console.log('ScreenManager.init complete');
    
    culturalFacts.init();
  }

  // ─── Screen Transitions ───────────────────────────────────────────────

  private _showScreen(id: string): void {
    try {
      console.log(`Showing screen: ${id}`);

      // Update Debug Overlay
      const debugState = document.getElementById('debug-state');
      const debugLevels = document.getElementById('debug-levels');
      if (debugState) debugState.textContent = id.toUpperCase();
      if (debugLevels) debugLevels.textContent = String(gs.allLevels.length);

      document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
      
      // Toggle Game HUD visibility
      const isGameScreen = (id === 'none'); // Expand this if you have a dedicated 'game' screen ID
      document.querySelectorAll<HTMLElement>('.game-ui').forEach(el => {
        el.style.display = isGameScreen ? '' : 'none';
      });

      // Force title screen hide just in case
      document.getElementById('screen-title')?.classList.remove('visible');
      const target = document.getElementById(id);
      if (!target) throw new Error(`Screen not found: ${id}`);
      target.classList.add('visible');
    } catch (err: any) {
      alert('UI ERROR: ' + err.message);
    }
  }

  showIntro(): void { this._showScreen('screen-title'); }
  showTitleScreen(): void { this.showIntro(); }

  showEraScreen(): void {
    this._showScreen('screen-era');
    audio.startEraNarration();
  }

  hideAllScreens(): void {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
    document.getElementById('screen-title')?.classList.remove('visible');
  }

  showGameUI(): void {
    this.hideAllScreens();
    document.querySelectorAll<HTMLElement>('.game-ui').forEach(el => {
      el.style.display = '';
    });
    const debugState = document.getElementById('debug-state');
    if (debugState) debugState.textContent = 'GAMEPLAY';
  }

  showLevelSelect(era: number = 0): void {
    const container = document.getElementById('screen-level-select');
    if (container) {
      LevelSelect.show(
        era, 
        container, 
        gs.allLevels, 
        (e, l) => this._onLevelSelect?.(e, l),
        () => this.showIntro()
      );
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
      console.log('Era Continue clicked');
      audio.stopEraNarration();
      this.showLevelSelect(0); // For now hardcoded to era 0
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
    const abs = hero.abilities.abilities;
    this._updateAbility('ability-q', abs[0]?.cooldown ?? 0, abs[0]?.maxCd ?? 1, abs[0]?.active ?? false);
    this._updateAbility('ability-w', abs[1]?.cooldown ?? 0, abs[1]?.maxCd ?? 1, abs[1]?.active ?? false);
    this._updateAbility('ability-e', abs[2]?.cooldown ?? 0, abs[2]?.maxCd ?? 1, abs[2]?.active ?? false);
  }

  private _updateAbility(id: string, cd: number, maxCd: number, active: boolean): void {
    const el = document.getElementById(id) as HTMLButtonElement;
    if (!el) return;

    const overlay = el.querySelector('.cd-overlay') as HTMLElement;
    if (!overlay) return;

    if (active) {
      el.classList.add('ability-active');
    } else {
      el.classList.remove('ability-active');
    }

    if (cd > 0) {
      el.disabled = true;
      overlay.style.display = 'flex';
      overlay.textContent = `${Math.ceil(cd)}s`;
    } else {
      el.disabled = false;
      overlay.style.display = 'none';
      overlay.textContent = '';
    }
  }

  private _bindTutorial(): void {
    document.getElementById('tutorial-close')?.addEventListener('click', () => {
      document.getElementById('tutorial-overlay')?.classList.remove('visible');
    });
  }
}

export const screenMgr = new ScreenManager();
