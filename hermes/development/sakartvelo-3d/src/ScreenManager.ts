/**
 * ScreenManager.ts
 * Manages game screens (Intro, Era, Level Select, Game Over).
 */
import { gs } from './GameState';
import { LevelSelect } from './LevelSelect';
import { audio } from './AudioManager';
import { culturalFacts } from './CulturalFacts';
import { Hero } from './Hero';
import { SaveManager } from './SaveManager';

type OnLevelSelect = (era: number, level: number) => void;
type OnEscape = () => void;
type TutorialStep = {
  title: string;
  text: string;
  selector?: string;
  done?: () => boolean;
};

export class ScreenManager {
  private _onLevelSelect: OnLevelSelect | null = null;
  private _onEscape: OnEscape | null = null;
  private _tutorialStep = 0;
  private _tutorialTimer: number | null = null;
  private _tutorialStartPos: string | null = null;

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
      if (id !== 'screen-era') {
        audio.hardStopEraNarration();
      }

      // Update Debug Overlay
      const debugState = document.getElementById('debug-state');
      const debugLevels = document.getElementById('debug-levels');
      if (debugState) debugState.textContent = id.toUpperCase();
      if (debugLevels) debugLevels.textContent = String(gs.allLevels.length);

      document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));

      // Toggle Game HUD visibility
      const isGameScreen = (id === 'none'); // Expand this if you have a dedicated 'game' screen ID
      gs.paused = !isGameScreen;
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

  showIntro(): void {
    this._showScreen('screen-title');
    audio.playBGM('/audio/intro.mp3');
  }
  showTitleScreen(): void { this.showIntro(); }

  showEraScreen(): void {
    this._showScreen('screen-era');
    audio.playBGM('/audio/intro.mp3');
    audio.startEraNarration();
  }

  hideAllScreens(): void {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
    document.getElementById('screen-title')?.classList.remove('visible');
  }

  showGameUI(): void {
    this.hideAllScreens();
    gs.paused = false;
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
    audio.playBGM('/audio/intro.mp3');
  }

  refreshLevelSelect(): void {
    LevelSelect.refresh();
  }

  hideGameOver(): void {
    document.getElementById('screen-game-over')?.classList.remove('visible');
  }

  hideLevelComplete(): void {
    document.getElementById('screen-level-complete')?.classList.remove('visible');
  }

  showTutorial(levelNum: number): void {
    if (levelNum !== 1 || localStorage.getItem('sakartvelo_tutorial_complete')) return;
    const hero = gs.hero?.group.position;
    this._tutorialStartPos = hero ? `${hero.x.toFixed(2)},${hero.z.toFixed(2)}` : null;
    this._tutorialStep = 0;
    this._renderTutorialStep();
    document.getElementById('tutorial-overlay')?.classList.add('visible');
    gs.paused = false;
    if (this._tutorialTimer !== null) window.clearInterval(this._tutorialTimer);
    this._tutorialTimer = window.setInterval(() => this._checkTutorialStep(), 350);
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
    const title = document.getElementById('lc-title')!;
    const msg = document.getElementById('lc-msg')!;
    const starsEl = document.getElementById('lc-stars')!;
    const level = gs.currentLevel;
    const levelId = level ? SaveManager.levelId(level.era, level.level) : '';
    const best = levelId ? SaveManager.getBestTime(levelId) : undefined;
    const elapsed = gs.levelElapsedTime;
    const newRecord = best !== undefined && Math.abs(best - elapsed) < 0.2;

    title.textContent = 'VICTORY';
    starsEl.innerHTML = '☆'.repeat(3);
    msg.innerHTML = `
      <div class="chronicle-kicker">${message}</div>
      <div class="chronicle-target">You defended ${level?.defense_target || level?.name || 'Sakartvelo'}.</div>
      <div class="chronicle-stats">
        <span>Lives Saved: ${gs.lives}/${gs.startingLives}</span>
        <span>Time: ${this._formatTime(elapsed)}${newRecord ? ' <b>NEW RECORD</b>' : ''}</span>
        <span>Best: ${best !== undefined ? this._formatTime(best) : this._formatTime(elapsed)}</span>
      </div>
      <div class="chronicle-fact">${level?.historical_fact || ''}</div>
    `;
    this._showScreen('screen-level-complete');

    for (let i = 1; i <= 3; i++) {
      window.setTimeout(() => {
        starsEl.textContent = '★'.repeat(Math.min(i, stars)) + '☆'.repeat(3 - Math.min(i, stars));
        if (i <= stars) audio.playStarReveal(i);
      }, i * 450);
    }
  }

  private _formatTime(totalSeconds: number): string {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
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
      audio.hardStopEraNarration();
      this.showLevelSelect(0); // For now hardcoded to era 0
    });
  }

  private _bindGameOverButtons(): void {
    document.getElementById('go-menu')?.addEventListener('click', () => {
      this.showLevelSelect(gs.currentLevel?.era ?? 0);
    });
    document.getElementById('btn-go-retry')?.addEventListener('click', () => {
      if (gs.currentLevel) this._onLevelSelect?.(gs.currentLevel.era, gs.currentLevel.level);
    });
  }

  private _bindLevelCompleteButtons(): void {
    document.getElementById('lc-menu')?.addEventListener('click', () => {
      this.showLevelSelect(gs.currentLevel?.era ?? 0);
    });
    document.getElementById('lc-next')?.addEventListener('click', () => {
      const cur = gs.currentLevel;
      if (!cur) return;
      
      const nextLevelNum = cur.level + 1;
      const nextLevel = gs.allLevels.find(l => l.era === cur.era && l.level === nextLevelNum);
      
      if (nextLevel) {
        this._onLevelSelect?.(nextLevel.era, nextLevel.level);
      } else {
        // No next level in this era? Back to map.
        this.showLevelSelect(cur.era);
      }
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
    const overlay = document.getElementById('tutorial-overlay');
    if (!overlay) return;

    overlay.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'tutorial-next') this._advanceTutorial();
      if (target.id === 'tutorial-skip') this._finishTutorial();
    });
  }

  private _tutorialSteps(): TutorialStep[] {
    return [
      { title: 'This is Medea', text: 'Medea is your mobile hero. She moves, builds, casts, and now fires visible magic.' },
      {
        title: 'Move Medea',
        text: 'Tap or click the ground to move Medea toward a safer build position.',
        done: () => {
          const hero = gs.hero?.group.position;
          if (!hero || !this._tutorialStartPos) return false;
          return `${hero.x.toFixed(2)},${hero.z.toFixed(2)}` !== this._tutorialStartPos;
        },
      },
      {
        title: 'Build An Archer',
        text: 'Tap a build node and choose Archer. Medea must walk close enough before construction completes.',
        selector: '#build-circle-archer',
        done: () => gs.towers.some(t => t.type === 'archer'),
      },
      {
        title: 'Walk To Build',
        text: 'Distant nodes take time because Medea physically reaches the site. Protect her route and plan ahead.',
        done: () => gs.towers.length > 0,
      },
      {
        title: 'The Enemy Path',
        text: 'Enemies follow the road. Towers prefer enemies farthest along the path and in range.',
        selector: '#wave',
      },
      {
        title: 'Walls Block Enemies',
        text: 'Use the wall button to place a wall on the path. Enemies stop and attack walls until they break.',
        selector: '#wall-mode-btn',
        done: () => gs.towers.some(t => t.type === 'wall'),
      },
      {
        title: 'Tower Behind Wall',
        text: 'Archers near walls fire faster at blocked enemies. Catapults hit blocked enemies harder.',
        done: () => gs.towers.some(t => t.type === 'wall') && gs.towers.some(t => t.type === 'archer'),
      },
      {
        title: 'Your Abilities',
        text: 'Q poisons crowds, W buffs towers, and E supercharges your strongest defense for boss moments.',
        selector: '#hero-bar',
        done: () => Boolean(gs.hero?.abilities.abilities.some(a => a.cooldown > 0)),
      },
      {
        title: 'Medea Command Link',
        text: 'Move Medea near an archer or catapult. The golden link enchants one closest offensive tower.',
        done: () => Boolean(gs.commandLinkTower),
      },
      {
        title: 'Stars And Lives',
        text: 'Save more lives for more stars. Three stars means you defended Sakartvelo with mastery.',
        selector: '#lives',
      },
    ];
  }

  private _renderTutorialStep(): void {
    const text = document.getElementById('tutorial-text');
    const steps = this._tutorialSteps();
    const step = steps[this._tutorialStep];
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    if (step.selector) document.querySelector(step.selector)?.classList.add('tutorial-highlight');
    if (!text) return;
    text.innerHTML = `
      <div class="tutorial-title">${step.title}</div>
      <div>${step.text}</div>
      <div class="tutorial-progress">Step ${this._tutorialStep + 1}/${steps.length}</div>
      <div class="tutorial-actions">
        <button id="tutorial-next" class="tutorial-btn">${step.done ? 'Continue When Done' : 'Next'}</button>
        <button id="tutorial-skip" class="tutorial-btn tutorial-skip">Skip Tutorial</button>
      </div>
    `;
  }

  private _checkTutorialStep(): void {
    const overlay = document.getElementById('tutorial-overlay');
    if (!overlay?.classList.contains('visible')) return;
    const step = this._tutorialSteps()[this._tutorialStep];
    if (step?.done?.()) this._advanceTutorial();
  }

  private _advanceTutorial(): void {
    const step = this._tutorialSteps()[this._tutorialStep];
    if (step?.done && !step.done()) return;
    this._tutorialStep++;
    if (this._tutorialStep >= this._tutorialSteps().length) {
      this._finishTutorial();
    } else {
      this._renderTutorialStep();
    }
  }

  private _finishTutorial(): void {
    document.getElementById('tutorial-overlay')?.classList.remove('visible');
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    localStorage.setItem('sakartvelo_tutorial_complete', '1');
    if (this._tutorialTimer !== null) window.clearInterval(this._tutorialTimer);
    this._tutorialTimer = null;
  }
}

export const screenMgr = new ScreenManager();
