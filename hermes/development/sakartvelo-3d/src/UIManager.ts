/**
 * UIManager.ts
 * All DOM/HUD operations. One place to look for UI logic.
 * Screen flows, HUD updates, tower buttons, tutorials, cultural footer.
 */
import { gs, GameState } from './GameState';
import { LevelSelect } from './LevelSelect';
import { TOWER_CONFIGS } from './types';
import { Hero } from './Hero';
import * as THREE from 'three';

// ─── Tutorial messages ────────────────────────────────────────────────────────

const TUTORIALS: Record<number, string> = {
  1: "🗼 Your hero, Medea, is here. Move her with WASD/ZQSD to attack enemies.\nTap a tower button below, then tap the grid to place it. Archers shoot enemies in range!",
  2: "🧱 Wall towers have huge HP — place them to block enemy paths and slow the horde.",
  3: "💥 Catapults deal splash damage to groups. Position them behind walls!",
  4: "⚡ Harpy enemies fly — only Archers can hit them. Place towers in their flight path!",
  5: "👹 The Bronze Devi is a boss — she's tough. Surround her with all your towers!",
};
const seenTutorials = new Set<number>();

const TOWER_UNLOCK_TEXT: Record<string, { minLevel: number; text: string }> = {
  wall:     { minLevel: 2, text: '🧱 Wall (Unlocks L2)' },
  catapult: { minLevel: 3, text: '💥 Catapult (Unlocks L3)' },
};

// ─── Cultural facts ───────────────────────────────────────────────────────────

interface CulturalFact { cat: string; text: string; }
let culturalFacts: CulturalFact[] = [];
let cfIndex = 0;
let cfTimer: ReturnType<typeof setInterval> | null = null;

// ─── Level select callbacks ────────────────────────────────────────────────────

type OnLevelSelect = (era: number, level: number) => void;
type OnEscape = () => void;
let _onLevelSelect: OnLevelSelect = () => {};
let _onEscape: OnEscape = () => {};

// ─── Gold flash ──────────────────────────────────────────────────────────────

function flashGold(amount: number): void {
  const el = document.getElementById('gold')!;
  el.textContent = String(amount);
  el.style.color = '#44ff44';
  setTimeout(() => { el.style.color = ''; }, 300);
}

function flashLives(amount: number): void {
  const el = document.getElementById('lives')!;
  el.textContent = String(amount);
  el.style.color = '#ff4444';
  setTimeout(() => { el.style.color = ''; }, 300);
}

// ─── Class ────────────────────────────────────────────────────────────────────

export class UIManager {
  // ─── Cached DOM elements ──────────────────────────────

  // HUD
  $gold = document.getElementById('gold')!;
  $lives = document.getElementById('lives')!;
  $wave = document.getElementById('wave')!;
  $totalWaves = document.getElementById('total-waves')!;
  $waveBtn = document.getElementById('wave-btn') as HTMLButtonElement;
  private $buildOverlay = document.getElementById('build-overlay')!;
  private $buildTimer = document.getElementById('build-timer')!;
  private $bpEnemyList = document.getElementById('bp-enemy-list')!;
  private $buildStartBtn = document.getElementById('build-start-btn') as HTMLButtonElement;
  private $levelName = document.getElementById('level-name')!;
  private $heroHp = document.getElementById('hero-hp')!;
  private $heroStatus = document.getElementById('hero-status')!;
  private $abilityQ = document.getElementById('ability-q') as HTMLButtonElement;
  private $abilityW = document.getElementById('ability-w') as HTMLButtonElement;
  private $abilityE = document.getElementById('ability-e') as HTMLButtonElement;

  // Tower panel
  private $towerPanel = document.getElementById('tower-panel')!;
  private $towerPanelName = document.getElementById('tower-panel-name')!;
  private $towerPanelLevel = document.getElementById('tower-panel-level')!;
  private $upgradeBtn = document.getElementById('upgrade-btn') as HTMLButtonElement;
  private $sellBtn = document.getElementById('sell-btn') as HTMLButtonElement;

  // Screens
  private $gameOver = document.getElementById('game-over')!;
  private $goTitle = document.getElementById('game-over-title')!;
  private $goMsg = document.getElementById('game-over-msg')!;
  private $goStars = document.getElementById('game-over-stars')!;
  private $levelComplete = document.getElementById('level-complete')!;

  // Keyboard layout badge
  private $kbBadge = document.getElementById('kb-badge');

  // Tower buttons
  towerButtons = Array.from(
    document.querySelectorAll('.tower-btn')
  ) as HTMLButtonElement[];

  // ─── Init ────────────────────────────────────────────

  init(
    onLevelSelect: OnLevelSelect,
    onEscape: OnEscape,
  ): void {
    _onLevelSelect = onLevelSelect;
    _onEscape = onEscape;
    this._bindTowerButtons();
    this._bindAbilityButtons();
    this._bindWaveButtons();
    this._bindBuildStart();
    this._bindUpgradeSell();
    this._bindIntroButtons();
    this._bindTeleprompterControls();
    this._bindEscape();
    this.updateKbBadge();

    // HUD update loop — 10fps DOM writes, decoupled from render
    setInterval(() => this.update(), 100);
  }

  // ─── Per-frame HUD update (called 10x/sec) ──────────

  update(): void {
    if (!gs.currentLevel) return;

    const lvl = gs.currentLevel;
    const wm = gs.waveMgr;
    const hero = gs.hero;

    // Economy
    this.$gold.textContent = String(gs.gold);
    this.$lives.textContent = String(gs.lives);

    // Wave
    if (wm) {
      this.$wave.textContent = String(wm.waveNum);
      this.$totalWaves.textContent = String(wm.totalWaves);
    }

    // Hero HP
    if (hero) {
      if (hero.alive) {
        this.$heroHp.textContent = `❤️ ${Math.ceil(hero.hp)}/${hero.maxHp}`;
        this.$heroStatus.textContent = '';
      } else {
        this.$heroHp.textContent = '💀 Dead';
        this.$heroStatus.textContent = `Respawn: ${Math.ceil(hero.respawnTimer)}s`;
      }
      this._updateAbilityBtn(this.$abilityQ, hero.abilities[0], 0);
      this._updateAbilityBtn(this.$abilityW, hero.abilities[1], 1);
      this._updateAbilityBtn(this.$abilityE, hero.abilities[2], 2);
    }

    // Tower buttons
    this._updateTowerButtons();

    // Tower info panel
    if (gs.selectedTower) {
      const t = gs.selectedTower;
      this.$towerPanel.style.display = 'flex';
      this.$towerPanelName.textContent = t.config.name;
      this.$towerPanelLevel.textContent = `Level ${t.level}/3`;
      const ucost = t.upgradeCost;
      if (ucost !== null) {
        this.$upgradeBtn.style.display = 'inline-block';
        this.$upgradeBtn.textContent = `⬆ Upgrade (${ucost}g)`;
        this.$upgradeBtn.disabled = gs.gold < ucost;
        this.$upgradeBtn.classList.toggle('too-poor', gs.gold < ucost);
      } else {
        this.$upgradeBtn.style.display = 'none';
      }
      this.$sellBtn.textContent = `💰 Sell (${t.sellValue}g)`;
    } else {
      this.$towerPanel.style.display = 'none';
    }

    // Build phase timer
    if (wm?.inBuildPhase) {
      const remaining = wm.buildPhaseTimer;
      this.$buildTimer.textContent = String(Math.ceil(remaining));
      const bonus = Math.ceil(remaining * 2);
      this.$buildStartBtn.textContent = `▶ Start Wave Now (+${bonus}g)`;
    }

    // Wave countdown
    if (gs.waveCountdownActive && wm && !wm.active) {
      const bonus = Math.ceil(gs.waveCountdown * 3);
      this.$waveBtn.disabled = false;
      this.$waveBtn.textContent = `▶ Next Wave (+${bonus}g) [${Math.ceil(gs.waveCountdown)}s]`;
    }
  }

  // ─── Tower buttons ────────────────────────────────────

  private _updateTowerButtons(): void {
    this.towerButtons.forEach(btn => {
      const type = btn.dataset.type!;
      const cost = TOWER_CONFIGS[type].cost;
      const locked = !gs.unlockedTowers.has(type);
      const tooPoor = gs.gold < cost;
      btn.disabled = locked || tooPoor;
      btn.classList.toggle('too-poor', tooPoor && !locked);
      btn.classList.toggle('ls-locked', locked);
    });
  }

  private _bindTowerButtons(): void {
    this.towerButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type!;
        gs.selectedType = gs.selectedType === type ? null : type;
        gs.selectedTower = null;
        this.towerButtons.forEach(b => b.classList.remove('selected'));
        if (gs.selectedType) btn.classList.add('selected');
        else btn.classList.remove('selected');
      });
    });
  }

  // ─── Ability buttons ──────────────────────────────────

  private _updateAbilityBtn(
    el: HTMLButtonElement,
    ab: Hero['abilities'][0] | undefined,
    idx: number,
  ): void {
    if (!ab) return;
    const labels = ['Q', 'W', 'E'];
    const icons = ['☠️', '🌿', '⚗️'];
    const key = labels[idx] || '?';
    const icon = icons[idx] || '';
    if (ab.active) {
      el.textContent = `${icon} ${ab.timer.toFixed(0)}s`;
      el.classList.add('ability-active');
      el.classList.remove('ability-cd');
      el.disabled = true;
    } else if (ab.cooldown !== undefined && ab.cooldown > 0) {
      el.textContent = `${icon} ${ab.cooldown.toFixed(0)}s`;
      el.classList.add('ability-cd');
      el.classList.remove('ability-active');
      el.disabled = true;
    } else {
      el.textContent = `${icon} [${key}]`;
      el.classList.remove('ability-cd', 'ability-active');
      el.disabled = false;
    }
  }

  private _bindAbilityButtons(): void {
    this.$abilityQ.addEventListener('click', () => {
      if (gs.hero?.alive) gs.hero.activateAbility(0, gs.enemies, gs.towers);
    });
    this.$abilityW.addEventListener('click', () => {
      if (gs.hero?.alive) gs.hero.activateAbility(1, gs.enemies, gs.towers);
    });
    this.$abilityE.addEventListener('click', () => {
      if (gs.hero?.alive) gs.hero.activateAbility(2, gs.enemies, gs.towers);
    });
  }

  // ─── Wave / Build phase buttons ───────────────────────

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

  // ─── Upgrade / Sell ──────────────────────────────────

  private _bindUpgradeSell(): void {
    this.$upgradeBtn.addEventListener('click', () => {
      if (!gs.selectedTower || gs.gameOver) return;
      if (gs.upgradeTower(gs.selectedTower)) this.update();
    });
    this.$sellBtn.addEventListener('click', () => {
      if (!gs.selectedTower || gs.gameOver || !gs.grid) return;
      const t = gs.selectedTower;
      const scene = (window as any).__scene as THREE.Scene;
      gs.sellTower(t, scene);
      gs.selectedTower = null;
      this.$towerPanel.style.display = 'none';
      this.update();
    });
  }

  // ─── Keyboard layout badge ─────────────────────────────

  updateKbBadge(): void {
    if (!this.$kbBadge) return;
    const layout = (window as any).__kbLayout as string || 'qwerty';
    this.$kbBadge.textContent = `⌨ ${layout.toUpperCase()}`;
    this.$kbBadge.style.borderColor = layout === 'azerty' ? '#7a9aaa' : '#8b6914';
    this.$kbBadge.style.color = layout === 'azerty' ? '#7a9aaa' : '#6a5a3a';
  }

  // ─── Escape ─────────────────────────────────────────

  private _bindEscape(): void {
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        gs.selectedType = null;
        gs.selectedTower = null;
        this.towerButtons.forEach(b => b.classList.remove('selected'));
        _onEscape();
      }
    });
  }

  // ─── Intro / screen flows ────────────────────────────

  private _showScreen(id: string): void {
    document.querySelectorAll('.intro-overlay').forEach(el =>
      (el as HTMLElement).style.display = 'none'
    );
    const el = document.getElementById(id);
    if (el) el.classList.add('visible');
  }

  showTitleScreen(): void { this._showScreen('screen-title'); }
  showEraScreen(): void { this._showScreen('screen-era'); }
  showChapterScreen(): void { this._showScreen('screen-chapter'); }

  private _hideScreen(id: string): void {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible');
  }

  private _bindIntroButtons(): void {
    document.getElementById('btn-title-continue')?.addEventListener('click', () => {
      this._hideScreen('screen-title');
      this._showScreen('screen-era');
    });
    document.getElementById('btn-era-continue')?.addEventListener('click', () => {
      this._hideScreen('screen-era');
      this._showScreen('screen-chapter');
    });
    document.getElementById('btn-chapter-continue')?.addEventListener('click', () => {
      this._hideScreen('screen-chapter');
      this.showLevelSelect();
    });
  }

  // ─── Teleprompter controls ────────────────────────────

  private _bindTeleprompterControls(): void {
    document.getElementById('btn-era-prev')?.addEventListener('click', () => {
      const audio = (window as any).__audioMgr as any;
      if (audio?._eraAudioEl) {
        audio._eraAudioEl.currentTime = Math.max(0, audio._eraAudioEl.currentTime - 10);
      }
    });
    document.getElementById('btn-era-next')?.addEventListener('click', () => {
      const audio = (window as any).__audioMgr as any;
      if (audio?._eraAudioEl) {
        audio._eraAudioEl.currentTime = Math.min(
          audio._tpAudioDuration,
          audio._eraAudioEl.currentTime + 10
        );
      }
    });
    document.getElementById('btn-era-play')?.addEventListener('click', () => {
      const audio = (window as any).__audioMgr as any;
      if (!audio) return;
      if (audio._eraPlaying) audio.stopEraNarration();
      else audio.startEraNarration();
    });
  }

  // ─── Level select ────────────────────────────────────

  showLevelSelect(): void {
    LevelSelect.show(
      0,
      document.getElementById('level-select')!,
      gs.allLevels,
      (era, level) => {
        const lvl = gs.allLevels.find(l => l.era === era && l.level === level);
        if (lvl) { LevelSelect.hide(); _onLevelSelect(era, level); }
      },
      () => { LevelSelect.hide(); this.showTitleScreen(); },
    );
  }

  // ─── Game over / Level complete ──────────────────────

  showGameOver(won: boolean): void {
    gs.gameOver = true;
    const stars = gs.getStars();
    this.$goTitle.textContent = won ? '🎉 VICTORY!' : '💀 DEFEAT!';
    this.$goMsg.textContent = won
      ? `${gs.currentLevel?.name} defended! All waves cleared.`
      : `${gs.currentLevel?.name} has fallen after wave ${gs.waveMgr?.waveNum}.`;
    this.$goStars.textContent = `Lives remaining: ${gs.lives}  ${gs.getStarString(stars)}`;
    this.$gameOver.style.display = 'block';
    this.$waveBtn.disabled = true;
    gs.saveLevelComplete(won);
  }

  showLevelComplete(stars: number): void {
    if (!gs.currentLevel) return;
    const lvl = gs.currentLevel;
    const title = document.getElementById('lc-title')!;
    const starEl = document.getElementById('lc-stars')!;
    const msg = document.getElementById('lc-msg')!;
    const nextBtn = document.getElementById('lc-next') as HTMLButtonElement;
    const menuBtn = document.getElementById('lc-menu') as HTMLButtonElement;

    title.textContent = lvl.name;
    starEl.textContent = gs.getStarString(stars);
    msg.textContent = stars === 3 ? 'Perfect! No lives lost.' : stars === 2 ? 'Well defended!' : 'Level cleared!';

    const levelId = (window as any).__saveManager.levelId(lvl.era, lvl.level) as string;
    const nextLevelId = (window as any).__saveManager.isNextUnlocked(levelId) as string | false;
    if (nextLevelId) {
      nextBtn.style.display = '';
      nextBtn.textContent = 'Next Level →';
      nextBtn.onclick = () => {
        this.$levelComplete.style.display = 'none';
        _onLevelSelect(lvl.era, lvl.level + 1);
      };
    } else {
      nextBtn.style.display = 'none';
    }
    menuBtn.onclick = () => { this.$levelComplete.style.display = 'none'; this.showLevelSelect(); };
    this.$levelComplete.style.display = 'block';
  }

  hideLevelComplete(): void {
    this.$levelComplete.style.display = 'none';
  }

  hideGameOver(): void {
    this.$gameOver.style.display = 'none';
  }

  // ─── Build phase overlay ──────────────────────────────

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

  // ─── Tutorial ────────────────────────────────────────

  showTutorial(levelNum: number): void {
    if (seenTutorials.has(levelNum)) return;
    seenTutorials.add(levelNum);
    const msg = TUTORIALS[levelNum];
    if (!msg) return;
    const overlay = document.getElementById('tutorial-overlay')!;
    const text = document.getElementById('tutorial-text')!;
    text.textContent = msg;
    overlay.style.display = 'block';
    const dismiss = () => { overlay.style.display = 'none'; };
    overlay.addEventListener('click', dismiss, { once: true });
    overlay.addEventListener('keydown', dismiss, { once: true });
  }

  // ─── Cultural facts footer ────────────────────────────

  startCulturalFacts(): void {
    fetch('/content/cultural_footer.txt')
      .then(r => r.text())
      .then(text => {
        text.split('\n').forEach(line => {
          const sep = line.indexOf('|');
          if (sep > 0) {
            culturalFacts.push({
              cat: line.slice(0, sep).trim(),
              text: line.slice(sep + 1).trim().replace(/^[""]|[""]$/g, ''),
            });
          }
        });
        if (culturalFacts.length > 0) this._cycleCulturalFact();
      })
      .catch(() => {
        const el = document.getElementById('cf-text');
        if (el) el.textContent = '';
      });
  }

  private _cycleCulturalFact(): void {
    if (cfTimer !== null) clearInterval(cfTimer);
    const el = document.getElementById('cf-text')!;
    if (culturalFacts.length === 0) return;
    const show = () => {
      if (culturalFacts.length === 0) return;
      cfIndex = (cfIndex + 1) % culturalFacts.length;
      el.textContent = `${culturalFacts[cfIndex].cat} — "${culturalFacts[cfIndex].text}"`;
    };
    show();
    cfTimer = setInterval(show, 8000);
  }

  // ─── Level name HUD ──────────────────────────────────

  showLevelName(name: string): void {
    this.$levelName.textContent = name;
  }

  hideLevelName(): void {
    this.$levelName.textContent = '';
  }
}

export const ui = new UIManager();
