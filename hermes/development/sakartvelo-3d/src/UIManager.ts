/**
 * UIManager.ts
 * HUD coordination — gold/lives/wave HUD, build phase, level name, keyboard badge.
 * Tower buttons → TowerPanel.ts
 * Screens/tutorial/cultural facts → ScreenManager.ts
 */
import { gs } from './GameState';
import { TowerPanel } from './TowerPanel';
import { screenMgr } from './ScreenManager';
import { audio } from './AudioManager';

type OnLevelSelect = (era: number, level: number) => void;
type OnEscape = () => void;

export class UIManager {
  // HUD elements
  // HUD elements
  $gold = document.getElementById('gold');
  $lives = document.getElementById('lives');
  $wave = document.getElementById('wave');
  $totalWaves = document.getElementById('total-waves');
  $waveBtn = document.getElementById('wave-btn') as HTMLButtonElement;
  private $buildOverlay = document.getElementById('build-overlay');
  private $buildTimer = document.getElementById('build-timer');
  private $bpEnemyList = document.getElementById('bp-enemy-list');
  private $buildStartBtn = document.getElementById('build-start-btn') as HTMLButtonElement;
  private $levelName = document.getElementById('level-name');
  private $heroHp = document.getElementById('hero-hp');
  private $heroStatus = document.getElementById('hero-status');
  private $gameInfoModal = document.getElementById('game-info-modal');

  // Sub-managers
  panel: TowerPanel;
  screens = screenMgr; // Use the singleton

  constructor() {
    this.panel = new TowerPanel();
  }

  init(onLevelSelect: OnLevelSelect, onEscape: OnEscape): void {
    this.screens.init(onLevelSelect, onEscape);
    this._bindWaveButtons();
    this._bindBuildStart();
    this._bindAbilityButtons();
    this._bindInfoModal();
    this._bindEscape();
    setInterval(() => this.update(), 100);
  }

  // ─── Per-frame HUD update (10x/sec) ─────────────────────────────────────

  update(): void {
    if (!gs.currentLevel) return;
    const wm = gs.waveMgr;

    if (this.$gold) this.$gold.textContent = String(gs.gold);
    if (this.$lives) this.$lives.textContent = String(gs.lives);

    if (wm) {
      if (this.$wave) this.$wave.textContent = String(wm.waveNum);
      if (this.$totalWaves) this.$totalWaves.textContent = String(wm.totalWaves);
    }

    if (gs.hero) {
      if (gs.hero.alive) {
        if (this.$heroHp) this.$heroHp.textContent = `❤️ ${Math.ceil(gs.hero.hp)}/${gs.hero.maxHp}`;
        if (this.$heroStatus) this.$heroStatus.textContent = '';
      } else {
        if (this.$heroHp) this.$heroHp.textContent = '💀 Dead';
        if (this.$heroStatus) {
          this.$heroStatus.textContent = `Respawn: ${Math.ceil(gs.hero.respawnTimeRemaining)}s`;
        }
      }
      this.screens.updateAbilities(gs.hero);
    }

    this.panel.update();

    if (wm?.inBuildPhase) {
      const remaining = wm.buildPhaseTimer;
      if (this.$buildTimer) this.$buildTimer.textContent = String(Math.ceil(remaining));
      const bonus = Math.ceil(remaining * 2);
      this.$buildStartBtn.textContent = `▶ Start Wave Now (+${bonus}g)`;
    }

    if (gs.waveCountdownActive && wm && !wm.active) {
      const bonus = Math.ceil(gs.waveCountdown * 3);
      this.$waveBtn.disabled = false;
      this.$waveBtn.textContent = `▶ Next Wave (+${bonus}g) [${Math.ceil(gs.waveCountdown)}s]`;
    }
  }

  // ─── Wave / Build phase buttons ───────────────────────────────────────────

  private _bindWaveButtons(): void {
    this.$waveBtn.addEventListener('click', () => {
      if (gs.gameOver || !gs.waveMgr || gs.waveMgr.active || gs.waveMgr.inBuildPhase) return;
      const bonus = gs.waveCountdownActive ? gs.getCountdownBonus() : 0;
      gs.startWave(bonus);
      this.$waveBtn.disabled = true;
      this.$waveBtn.textContent = '⚔ Wave in progress...';
    });
  }

  private _bindBuildStart(): void {
    this.$buildStartBtn.addEventListener('click', () => {
      if (gs.gameOver || !gs.waveMgr?.inBuildPhase) return;
      const bonus = gs.getBuildPhaseBonus();
      gs.waveMgr.endBuildPhase();
      this.$buildOverlay?.classList.remove('visible');
      gs.startWave(bonus);
      this.$waveBtn.disabled = true;
      this.$waveBtn.textContent = '⚔ Wave in progress...';
    });
  }

  reset(): void {
    this.$waveBtn.disabled = false;
    this.$waveBtn.textContent = '⚔ Start Wave';
    this.$buildOverlay?.classList.remove('visible');
  }

  // ─── Escape ──────────────────────────────────────────────────────────────

  private _bindEscape(): void {
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.$gameInfoModal?.classList.contains('visible')) {
          this.$gameInfoModal.classList.remove('visible');
          if (!document.hidden) gs.paused = false;
          return;
        }
        gs.selectedType = null;
        gs.selectedTower = null;
        this.panel.towerButtons.forEach(b => b.classList.remove('selected'));
      }
    });
  }

  private _bindInfoModal(): void {
    const openBtn = document.getElementById('btn-game-info');
    const closeBtn = document.getElementById('btn-game-info-close');
    const levelSelectBtn = document.getElementById('btn-game-level-select');
    if (!openBtn || !this.$gameInfoModal || !closeBtn) return;

    openBtn.addEventListener('click', () => {
      this.$gameInfoModal?.classList.add('visible');
      gs.paused = true;
      audio.bindVolumeControls();
    });
    closeBtn.addEventListener('click', () => {
      this.$gameInfoModal?.classList.remove('visible');
      if (!document.hidden) gs.paused = false;
    });
    this.$gameInfoModal.addEventListener('click', (e) => {
      if (e.target === this.$gameInfoModal) {
        this.$gameInfoModal?.classList.remove('visible');
        if (!document.hidden) gs.paused = false;
      }
    });

    levelSelectBtn?.addEventListener('click', () => {
      this.$gameInfoModal?.classList.remove('visible');
      this.screens.showLevelSelect(gs.currentLevel?.era ?? 0);
    });
  }

  private _bindAbilityButtons(): void {
    const bind = (id: string, idx: number) => {
      const btn = document.getElementById(id) as HTMLButtonElement | null;
      if (!btn) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (gs.paused || gs.gameOver || !gs.hero) return;
        gs.hero.activateAbility(idx, gs.enemies, gs.towers);
      });
    };

    bind('ability-q', 0);
    bind('ability-w', 1);
    bind('ability-e', 2);
  }

  // ─── Build phase overlay ─────────────────────────────────────────────────

  showBuildPhase(): void {
    if (!gs.waveMgr) return;
    const preview = gs.waveMgr.getNextWavePreview();
    if (this.$bpEnemyList) this.$bpEnemyList.textContent = preview.types.join(' · ') || 'Unknown wave';
    if (this.$buildTimer) this.$buildTimer.textContent = String(Math.ceil(gs.waveMgr.buildPhaseTimer));
    this.$buildStartBtn.textContent = `▶ Start Wave Now (+${gs.getBuildPhaseBonus()}g)`;
    this.$buildOverlay?.classList.add('visible');
    this.$waveBtn.disabled = true;
    this.$waveBtn.textContent = '⚒ Build Phase...';
  }

  hideBuildPhase(): void {
    this.$buildOverlay?.classList.remove('visible');
  }

  // ─── Level name HUD ─────────────────────────────────────────────────────

  showLevelName(name: string): void {
    if (this.$levelName) this.$levelName.textContent = name;
  }

  hideLevelName(): void {
    if (this.$levelName) this.$levelName.textContent = '';
  }
}

export const ui = new UIManager();
