/**
 * UIManager.ts
 * HUD coordination — gold/lives/wave HUD, build phase, level name, keyboard badge.
 * Tower buttons → TowerPanel.ts
 * Screens/tutorial/cultural facts → ScreenManager.ts
 */
import { gs } from './GameState';
import { TowerPanel } from './TowerPanel';
import { screenMgr } from './ScreenManager';

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
  private $kbBadge = document.getElementById('kb-badge');

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
    this._bindEscape();
    this.updateKbBadge();
    setInterval(() => this.update(), 100);
  }

  // ─── Per-frame HUD update (10x/sec) ─────────────────────────────────────

  update(): void {
    if (!gs.currentLevel) return;
    const wm = gs.waveMgr;

    this.$gold.textContent = String(gs.gold);
    this.$lives.textContent = String(gs.lives);

    if (wm) {
      this.$wave.textContent = String(wm.waveNum);
      this.$totalWaves.textContent = String(wm.totalWaves);
    }

    if (gs.hero) {
      if (gs.hero.alive) {
        this.$heroHp.textContent = `❤️ ${Math.ceil(gs.hero.hp)}/${gs.hero.maxHp}`;
        this.$heroStatus.textContent = '';
      } else {
        this.$heroHp.textContent = '💀 Dead';
        this.$heroStatus.textContent = `Respawn: ${Math.ceil(gs.hero.respawnTimer)}s`;
      }
      this.screens.updateAbilities(gs.hero);
    }

    this.panel.update();

    if (wm?.inBuildPhase) {
      const remaining = wm.buildPhaseTimer;
      this.$buildTimer.textContent = String(Math.ceil(remaining));
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
      this.$buildOverlay.classList.remove('visible');
      gs.startWave(bonus);
      this.$waveBtn.disabled = true;
      this.$waveBtn.textContent = '⚔ Wave in progress...';
    });
  }

  // ─── Keyboard layout badge ─────────────────────────────────────────────────

  updateKbBadge(): void {
    if (!this.$kbBadge) return;
    const layout = (window as any).__kbLayout as string || 'qwerty';
    this.$kbBadge.textContent = `⌨ ${layout.toUpperCase()}`;
    this.$kbBadge.style.borderColor = layout === 'azerty' ? '#7a9aaa' : '#8b6914';
    this.$kbBadge.style.color = layout === 'azerty' ? '#7a9aaa' : '#6a5a3a';
  }

  // ─── Escape ──────────────────────────────────────────────────────────────

  private _bindEscape(): void {
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        gs.selectedType = null;
        gs.selectedTower = null;
        this.panel.towerButtons.forEach(b => b.classList.remove('selected'));
      }
    });
  }

  // ─── Build phase overlay ─────────────────────────────────────────────────

  showBuildPhase(): void {
    if (!gs.waveMgr) return;
    const preview = gs.waveMgr.getNextWavePreview();
    this.$bpEnemyList.textContent = preview.types.join(' · ') || 'Unknown wave';
    this.$buildTimer.textContent = String(Math.ceil(gs.waveMgr.buildPhaseTimer));
    this.$buildStartBtn.textContent = `▶ Start Wave Now (+${gs.getBuildPhaseBonus()}g)`;
    this.$buildOverlay.classList.add('visible');
    this.$waveBtn.disabled = true;
    this.$waveBtn.textContent = '⚒ Build Phase...';
  }

  hideBuildPhase(): void {
    this.$buildOverlay.classList.remove('visible');
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
