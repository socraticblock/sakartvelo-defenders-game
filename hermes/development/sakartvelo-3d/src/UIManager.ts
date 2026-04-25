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
type HudLayout = 'bottom' | 'left' | 'right' | 'top';
const HUD_LAYOUT_KEY = 'sakartvelo_hud_layout';
const BUILD_LAYOUT_KEY = 'sakartvelo_build_layout';
const ABILITY_LAYOUT_KEY = 'sakartvelo_ability_layout';
const DOCK_STACK_PREFIX = 'sakartvelo_dock_stack_';

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
  private $gameSettingsModal = document.getElementById('game-settings-modal');
  private $bossHpContainer = document.getElementById('boss-hp-container');
  private $bossName = document.getElementById('boss-name');
  private $bossHpFill = document.getElementById('boss-hp-fill');
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
        if (this.$gameSettingsModal?.classList.contains('visible')) {
          this.$gameSettingsModal.classList.remove('visible');
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
    const settingsBtn = document.getElementById('btn-game-settings');
    const settingsCloseBtn = document.getElementById('btn-game-settings-close');
    const levelSelectBtn = document.getElementById('btn-game-level-select');
    if (!openBtn || !this.$gameInfoModal || !closeBtn || !settingsBtn || !this.$gameSettingsModal || !settingsCloseBtn) return;
    this._bindCameraZoomControl();
    this._bindDockLayoutControls();

    openBtn.addEventListener('click', () => {
      this.$gameInfoModal?.classList.add('visible');
      gs.paused = true;
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

    settingsBtn.addEventListener('click', () => {
      this.$gameSettingsModal?.classList.add('visible');
      gs.paused = true;
      audio.bindVolumeControls();
      this._syncCameraZoomUi();
      this._syncDockLayoutUi();
    });
    settingsCloseBtn.addEventListener('click', () => {
      this.$gameSettingsModal?.classList.remove('visible');
      if (!document.hidden) gs.paused = false;
    });
    this.$gameSettingsModal.addEventListener('click', (e) => {
      if (e.target === this.$gameSettingsModal) {
        this.$gameSettingsModal?.classList.remove('visible');
        if (!document.hidden) gs.paused = false;
      }
    });

    levelSelectBtn?.addEventListener('click', () => {
      this.$gameSettingsModal?.classList.remove('visible');
      this.screens.showLevelSelect(gs.currentLevel?.era ?? 0);
    });
  }

  private _syncCameraZoomUi(): void {
    const slider = document.getElementById('cam-zoom-game') as HTMLInputElement | null;
    const value = document.getElementById('cam-zoom-game-val');
    const getZoom = (window as any).__getCameraZoom as (() => number) | undefined;
    const zoom = getZoom ? Math.round(getZoom()) : 100;
    if (!slider || !value) return;
    slider.value = String(zoom);
    value.textContent = String(zoom);
    slider.style.setProperty('--pct', `${((zoom - 80) / 40) * 100}%`);
  }

  private _bindCameraZoomControl(): void {
    const slider = document.getElementById('cam-zoom-game') as HTMLInputElement | null;
    const value = document.getElementById('cam-zoom-game-val');
    if (!slider || !value || slider.dataset.bound === '1') return;
    slider.dataset.bound = '1';
    this._syncCameraZoomUi();
    slider.addEventListener('input', () => {
      const zoom = Math.max(80, Math.min(120, Number(slider.value) || 100));
      value.textContent = String(zoom);
      slider.style.setProperty('--pct', `${((zoom - 80) / 40) * 100}%`);
      const setZoom = (window as any).__setCameraZoom as ((v: number) => void) | undefined;
      setZoom?.(zoom);
    });
  }

  private _applySavedHudLayout(): void {
    const legacy = this._parseHudLayout(localStorage.getItem(HUD_LAYOUT_KEY), 'bottom');
    const build = this._parseHudLayout(localStorage.getItem(BUILD_LAYOUT_KEY), legacy);
    const ability = this._parseHudLayout(localStorage.getItem(ABILITY_LAYOUT_KEY), legacy);
    this._setDockLayout('build', build, true);
    this._setDockLayout('ability', ability, true);
  }

  private _parseHudLayout(value: string | null, fallback: HudLayout): HudLayout {
    const raw = (value || fallback).toLowerCase();
    return (raw === 'left' || raw === 'right' || raw === 'top') ? raw : 'bottom';
  }

  private _getDockLayout(kind: 'build' | 'ability'): HudLayout {
    return this._parseHudLayout(
      localStorage.getItem(kind === 'build' ? BUILD_LAYOUT_KEY : ABILITY_LAYOUT_KEY),
      'bottom',
    );
  }

  private _setDockLayout(kind: 'build' | 'ability', layout: HudLayout, fromInit = false): void {
    const otherKind = kind === 'build' ? 'ability' : 'build';
    const otherLayout = this._getDockLayout(otherKind);
    const prefix = kind === 'build' ? 'build-layout' : 'ability-layout';
    document.body.classList.remove(`${prefix}-bottom`, `${prefix}-left`, `${prefix}-right`, `${prefix}-top`);
    document.body.classList.add(`${prefix}-${layout}`);
    localStorage.setItem(kind === 'build' ? BUILD_LAYOUT_KEY : ABILITY_LAYOUT_KEY, layout);
    this._updateDockStackOrder(layout, otherKind, otherLayout, fromInit);
    // Camera framing depends on dock placement.
    const lvl = gs.currentLevel;
    const setZoom = (window as any).__setCameraZoom as ((v: number) => void) | undefined;
    const getZoom = (window as any).__getCameraZoom as (() => number) | undefined;
    if (lvl && setZoom && getZoom) setZoom(getZoom());
  }

  private _updateDockStackOrder(
    layout: HudLayout,
    otherKind: 'build' | 'ability',
    otherLayout: HudLayout,
    fromInit: boolean,
  ): void {
    const classes = ['bottom', 'left', 'right', 'top'].flatMap(edge => [
      `dock-stack-${edge}-build-first`,
      `dock-stack-${edge}-ability-first`,
    ]);
    document.body.classList.remove(...classes);

    if (layout === otherLayout) {
      const key = `${DOCK_STACK_PREFIX}${layout}`;
      const saved = localStorage.getItem(key);
      const first = fromInit
        ? (saved === 'ability' ? 'ability' : 'build')
        : otherKind;
      localStorage.setItem(key, first);
    }

    const buildLayout = this._getDockLayout('build');
    const abilityLayout = this._getDockLayout('ability');
    if (buildLayout === abilityLayout) {
      const key = `${DOCK_STACK_PREFIX}${buildLayout}`;
      const saved = localStorage.getItem(key);
      const first = saved === 'ability' ? 'ability' : 'build';
      document.body.classList.add(`dock-stack-${buildLayout}-${first}-first`);
    }
  }

  private _syncDockLayoutUi(): void {
    const build = document.getElementById('build-layout-game') as HTMLSelectElement | null;
    const ability = document.getElementById('ability-layout-game') as HTMLSelectElement | null;
    if (build) build.value = this._parseHudLayout(localStorage.getItem(BUILD_LAYOUT_KEY), 'bottom');
    if (ability) ability.value = this._parseHudLayout(localStorage.getItem(ABILITY_LAYOUT_KEY), 'bottom');
  }

  private _bindDockLayoutControls(): void {
    const bind = (id: string, kind: 'build' | 'ability') => {
      const select = document.getElementById(id) as HTMLSelectElement | null;
      if (!select || select.dataset.bound === '1') return;
      select.dataset.bound = '1';
      select.addEventListener('change', () => {
        this._setDockLayout(kind, this._parseHudLayout(select.value, 'bottom'));
      });
    };
    this._syncDockLayoutUi();
    bind('build-layout-game', 'build');
    bind('ability-layout-game', 'ability');
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

  showBossHp(visible: boolean): void {
    if (!this.$bossHpContainer) return;
    if (visible) this.$bossHpContainer.classList.add('visible');
    else this.$bossHpContainer.classList.remove('visible');
  }

  updateBossHp(hp: number, maxHp: number, name: string): void {
    if (!this.$bossName || !this.$bossHpFill) return;
    this.$bossName.textContent = name;
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    this.$bossHpFill.style.width = `${ratio * 100}%`;
  }

  showEnemyIntro(type: string): void {
    const key = `sakartvelo_enemy_intro_${type}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    this.enemyIntroQueue.push(type);
    if (!this.enemyIntroOpen) this._showNextEnemyIntro();
  }

  private _showNextEnemyIntro(): void {
    const type = this.enemyIntroQueue.shift();
    if (!type) {
      this.enemyIntroOpen = false;
      if (!document.hidden) gs.paused = false;
      return;
    }

    const data = ENEMY_INTROS[type] || ENEMY_INTROS.infantry;
    const modal = document.getElementById('enemy-intro-modal');
    const name = document.getElementById('enemy-intro-name');
    const lore = document.getElementById('enemy-intro-lore');
    const threat = document.getElementById('enemy-intro-threat');
    const counter = document.getElementById('enemy-intro-counter');
    const ok = document.getElementById('enemy-intro-ok');
    if (!modal || !name || !lore || !threat || !counter || !ok) return;

    this.enemyIntroOpen = true;
    gs.paused = true;
    name.textContent = data.name;
    lore.textContent = data.lore;
    threat.textContent = data.threat;
    counter.textContent = data.counter;
    modal.classList.add('visible');

    ok.onclick = () => {
      modal.classList.remove('visible');
      this._showNextEnemyIntro();
    };
  }
}

export const ui = new UIManager();

const ENEMY_INTROS: Record<string, { name: string; lore: string; threat: string; counter: string }> = {
  infantry: {
    name: 'Colchian Raider',
    lore: 'Local raiders and rival bands test the river villages before larger threats arrive.',
    threat: 'Basic swarm enemy. Weak alone, dangerous in numbers.',
    counter: 'Place archers near bends so they fire longer.',
  },
  cavalry: {
    name: 'Horseman of Colchis',
    lore: 'Mounted fighters moved quickly along river roads and forest paths, striking before villages could fully prepare.',
    threat: 'Fast enemy that can slip past poor coverage.',
    counter: 'Build near turns and use Medea poison when riders bunch up.',
  },
  siege: {
    name: 'Bronze Siege Ram',
    lore: 'Heavy rams represent organized war reaching Colchis, where wooden palisades and gates must hold.',
    threat: 'Slow but tanky. Breaks walls hard.',
    counter: 'Use catapults, upgraded archers, and delay with walls.',
  },
  flying: {
    name: 'Sky Wolf',
    lore: 'A mythic beast of the mountains, inspired by Georgian tales where wild nature itself becomes an enemy.',
    threat: 'Very fast and light. Can rush through gaps.',
    counter: 'Use long sight lines and upgraded archer range.',
  },
  boss: {
    name: 'Mythic Boss',
    lore: 'Colchian myth speaks of Devi, dragons, and guardians tied to sacred treasure and wild places.',
    threat: 'Huge health and high pressure.',
    counter: 'Save abilities and fight near your strongest upgraded towers.',
  },
};
