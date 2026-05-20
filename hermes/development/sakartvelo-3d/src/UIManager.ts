/**
 * UIManager.ts
 * HUD coordination — gold/lives/wave HUD, build phase, level name, keyboard badge.
 * Tower buttons → TowerPanel.ts
 * Screens/tutorial/cultural facts → ScreenManager.ts
 */
import * as THREE from 'three';
import { gs } from './GameState';
import { TowerPanel } from './TowerPanel';
import { screenMgr } from './ScreenManager';
import { audio } from './AudioManager';
import { TOWER_CONFIGS } from './types';
import { BESTIARY_ENTRIES } from './BestiaryData';
import { visuals } from './VisualsManager';
import { escapeHtml } from './utils/dom';

type OnLevelSelect = (era: number, level: number) => void;
type OnEscape = () => void;
type HudLayout = 'bottom' | 'left' | 'right' | 'top';
const HUD_LAYOUT_KEY = 'sakartvelo_hud_layout';
const BUILD_LAYOUT_KEY = 'sakartvelo_build_layout';
const ABILITY_LAYOUT_KEY = 'sakartvelo_ability_layout';
const DOCK_STACK_PREFIX = 'sakartvelo_dock_stack_';
const MOBILE_LAYOUT_MAX_WIDTH = 768;

export class UIManager {
  // HUD elements
  // HUD elements
  $gold = document.getElementById('gold');
  $lives = document.getElementById('lives');
  $wave = document.getElementById('wave');
  $totalWaves = document.getElementById('total-waves');
  $hornBonus = document.getElementById('horn-bonus');
  $hornBonusGold = document.getElementById('horn-bonus-gold');
  private $buildOverlay = document.getElementById('build-overlay');
  private $buildTimer = document.getElementById('build-timer');
  private $bpEnemyList = document.getElementById('bp-enemy-list');
  private $bottomBar = document.getElementById('bottom-bar');
  private $buildStartBtn = document.getElementById('build-start-btn') as HTMLButtonElement | null;
  private $waveBtn = document.getElementById('wave-btn') as HTMLButtonElement | null;
  private $levelName = document.getElementById('level-name');
  private $heroHp = document.getElementById('hero-hp');
  private $heroStatus = document.getElementById('hero-status');
  private $wallModeBtn = document.getElementById('wall-mode-btn') as HTMLButtonElement | null;
  private $infantrySpawnBtn = document.getElementById('infantry-spawn-btn') as HTMLButtonElement | null;
  private $buildCircle = document.getElementById('build-circle');
  private $buildCircleArcher = document.getElementById('build-circle-archer') as HTMLButtonElement | null;
  private $buildCircleCatapult = document.getElementById('build-circle-catapult') as HTMLButtonElement | null;
  private $gameInfoModal = document.getElementById('game-info-modal');
  private $gameSettingsModal = document.getElementById('game-settings-modal');
  private $pauseMenuModal = document.getElementById('pause-menu-modal');
  private $bestiaryModal = document.getElementById('bestiary-modal');
  private $bossHpContainer = document.getElementById('boss-hp-container');
  private $bossName = document.getElementById('boss-name');
  private $bossHpFill = document.getElementById('boss-hp-fill');
  private $heroBar = document.getElementById('hero-bar');
  private $lifeFlash: HTMLElement | null = null;
  private dockResizeObserver: ResizeObserver | null = null;
  private dockViewportMode: 'compact' | 'full' | null = null;
  private buildCircleCell: { gx: number; gy: number } | null = null;
  private buildCircleOpenedAtMs = 0;
  private buildCircleMovePrimed = false;
  private enemyIntroQueue: string[] = [];
  private enemyIntroOpen = false;

  // Sub-managers
  panel: TowerPanel;
  screens = screenMgr; // Use the singleton

  constructor() {
    this.panel = new TowerPanel();
  }

  init(onLevelSelect: OnLevelSelect, onEscape: OnEscape): void {
    this.screens.init(onLevelSelect, onEscape);
    this._applySavedHudLayout();
    this._bindDockSpacingObserver();
    this._bindResponsiveDockLayout();
    this._bindAbilityButtons();
    this._bindBuildCircle();
    this._bindWallAndInfantryButtons();
    this._bindInfoModal();
    this._bindPauseMenu();
    this._bindEscape();
    this._bindBuildPhaseStartButton();
    setInterval(() => this.update(), 100);
  }

  private _bindBuildPhaseStartButton(): void {
    this.$buildStartBtn = document.getElementById('build-start-btn') as HTMLButtonElement | null;
    if (!this.$buildStartBtn) return;
    this.$buildStartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (gs.paused || gs.gameOver || !gs.waveMgr?.inBuildPhase) return;
      const bonus = gs.getBuildPhaseBonus();
      gs.startWave(bonus);
    });
  }

  // ─── Per-frame HUD update (10x/sec) ─────────────────────────────────────

  update(): void {
    if (!gs.currentLevel) return;
    const wm = gs.waveMgr;

    this.setText(this.$gold, String(gs.gold));
    this.setText(this.$lives, String(gs.lives));
    document.body.classList.toggle('low-lives-warning', gs.lives / Math.max(1, gs.startingLives) < 0.3);

    if (wm) {
      this.setText(this.$wave, String(wm.waveNum));
      this.setText(this.$totalWaves, String(wm.totalWaves));
    }

    if (gs.hero) {
      if (gs.hero.alive) {
        this.setText(this.$heroHp, `❤️ ${Math.ceil(gs.hero.hp)}/${gs.hero.maxHp}`);
        this.setText(this.$heroStatus, '');
      } else {
        this.setText(this.$heroHp, '💀 Dead');
        this.setText(this.$heroStatus, `Respawn: ${Math.ceil(gs.hero.respawnTimeRemaining)}s`);
      }
      this.screens.updateAbilities(gs.hero);
    }
    if (this.$wallModeBtn) this.$wallModeBtn.classList.toggle('selected', gs.selectedType === 'wall');
    if (this.$infantrySpawnBtn) {
      const cd = Math.max(0, gs.infantryCooldown);
      const canSpawn = gs.canSpawnInfantry();
      const baseText = `⚔ Infantry (${gs.infantryCost}g)`;
      this.$infantrySpawnBtn.disabled = !canSpawn;
      this.setText(this.$infantrySpawnBtn, cd > 0 ? `${baseText} ${cd.toFixed(1)}s` : baseText);
    }

    this.panel.update();

    // Re-fetch horn elements if module loaded before DOM
    if (!this.$hornBonus) this.$hornBonus = document.getElementById('horn-bonus');
    if (!this.$hornBonusGold) this.$hornBonusGold = document.getElementById('horn-bonus-gold');

    // Overlay visibility must follow WaveManager (hideBuildPhase was never called when waves auto-started)
    if (this.$buildOverlay && wm) {
      this.$buildOverlay.classList.toggle('visible', wm.inBuildPhase);
    }

    if (wm?.inBuildPhase) {
      this.setText(this.$buildTimer, String(Math.ceil(wm.buildPhaseTimer)));
      const bonus = gs.getBuildPhaseBonus();
      if (this.$buildStartBtn) {
        this.$buildStartBtn.textContent = `▶ Start Wave Now (+${bonus}g)`;
        this.$buildStartBtn.disabled = gs.gameOver || !!gs.paused;
      }
      // The build-phase panel already shows the start-wave action and gold bonus.
      // Hiding the world-space horn label here avoids overlapping the right-side panel
      // on landscape maps where the horn/exit is near the edge of the battlefield.
      if (this.$hornBonus) this.$hornBonus.style.display = 'none';
    } else if (gs.waveCountdownActive && wm && !wm.active) {
      const bonus = gs.getCountdownBonus();
      if (this.$hornBonus) {
        this.$hornBonus.style.display = 'block';
        this.setText(this.$hornBonusGold, `+${bonus}g`);
        this.$hornBonus.style.color = bonus > 10 ? '#ffd700' : (bonus > 5 ? '#ffa500' : '#ff4444');
      }
    } else {
      if (this.$hornBonus) this.$hornBonus.style.display = 'none';
    }
  }

  private setText(el: HTMLElement | null, text: string) {
    if (el && el.textContent !== text) {
      el.textContent = text;
    }
  }

  // ─── Wave / Build phase buttons ───────────────────────────────────────────

  reset(): void {
    this.$buildOverlay?.classList.remove('visible');
    // Do NOT hide hornBonus here, let update() handle it based on WaveManager state
    this.closeBuildCircle();
  }

  // ─── Escape ──────────────────────────────────────────────────────────────

  private _bindEscape(): void {
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.$pauseMenuModal?.classList.contains('visible')) {
          this.closePauseMenu();
          return;
        }
        if (this.$gameInfoModal?.classList.contains('visible')) {
          this.$gameInfoModal.classList.remove('visible');
          this._resumeIfNoBlockingModal();
          return;
        }
        if (this.$gameSettingsModal?.classList.contains('visible')) {
          this.$gameSettingsModal.classList.remove('visible');
          this._resumeIfNoBlockingModal();
          return;
        }
        if (this.$bestiaryModal?.classList.contains('visible')) {
          this.$bestiaryModal.classList.remove('visible');
          this._resumeIfNoBlockingModal();
          return;
        }
        if (gs.currentLevel && !gs.gameOver && !document.getElementById('tutorial-overlay')?.classList.contains('visible')) {
          this.openPauseMenu();
          return;
        }
        gs.selectedType = null;
        gs.selectedTower = null;
        this.closeBuildCircle();
        this.panel.towerButtons.forEach(b => b.classList.remove('selected'));
      }
    });
  }

  setTowerPlacementType(type: string | null): void {
    gs.selectedType = type;
    gs.selectedTower = null;
    
    // Slow down time for tactical placement
    gs.targetTimeScale = type ? 0.1 : 1.0;
    
    this.closeBuildCircle();
    this.panel.towerButtons.forEach(b => b.classList.remove('selected'));
    if (this.$wallModeBtn) this.$wallModeBtn.classList.toggle('selected', gs.selectedType === 'wall');
  }

  openBuildCircleAtCell(gx: number, gy: number, primeMove = false): void {
    if (!this.$buildCircle || !gs.grid) return;
    if (gs.gameOver) return;
    const worldPos = gs.grid.getPlinthVisualPos(gx, gy) || new THREE.Vector3(gx + 0.5, 0.1, gy + 0.5);
    const cam = (window as any).__camera as THREE.Camera | undefined;
    if (!cam) return;
    const v = new THREE.Vector3(worldPos.x, worldPos.y + 0.2, worldPos.z).project(cam);
    const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
    const clampedX = Math.max(88, Math.min(window.innerWidth - 88, sx));
    const clampedY = Math.max(88, Math.min(window.innerHeight - 88, sy));
    this.$buildCircle.style.left = `${Math.round(clampedX)}px`;
    this.$buildCircle.style.top = `${Math.round(clampedY)}px`;
    if (this.$buildCircleArcher) {
      this.$buildCircleArcher.disabled = !gs.unlockedTowers.has('archer') || gs.gold < TOWER_CONFIGS.archer.cost;
    }
    if (this.$buildCircleCatapult) {
      this.$buildCircleCatapult.disabled = !gs.unlockedTowers.has('catapult') || gs.gold < TOWER_CONFIGS.catapult.cost;
    }
    this.$buildCircle.classList.add('visible');
    this.buildCircleOpenedAtMs = performance.now();
    this.buildCircleCell = { gx, gy };
    this.buildCircleMovePrimed = primeMove;
    gs.targetTimeScale = 0.1;
  }

  closeBuildCircle(): void {
    if (this.buildCircleMovePrimed && gs.hero && !gs.hero.pendingBuild && this.buildCircleCell) {
      // Only cancel the move if the hero is still headed for the plinth.