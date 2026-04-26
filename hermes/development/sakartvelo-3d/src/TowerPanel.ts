/**
 * TowerPanel.ts
 * Tower selection buttons and tower info panel (upgrade/sell).
 * Extracted from UIManager.ts.
 */
import { gs } from './GameState';
import { input } from './InputManager';
import { TOWER_CONFIGS } from './types';
import * as THREE from 'three';

export class TowerPanel {
  private $panel = document.getElementById('tower-panel')!;
  private $name = document.getElementById('tower-panel-name')!;
  private $level = document.getElementById('tower-panel-level')!;
  private $upgradeBtn = document.getElementById('upgrade-btn') as HTMLButtonElement;
  private $sellBtn = document.getElementById('sell-btn') as HTMLButtonElement;
  private $circle = document.getElementById('tower-action-circle');
  private $circleUpgrade = document.getElementById('tower-circle-upgrade') as HTMLButtonElement | null;
  private $circleSell = document.getElementById('tower-circle-sell') as HTMLButtonElement | null;
  towerButtons: HTMLButtonElement[];

  constructor() {
    this.towerButtons = Array.from(
      document.querySelectorAll('.tower-btn')
    ) as HTMLButtonElement[];
    this._syncTowerShopLabels();
    addEventListener('resize', () => this._syncTowerShopLabels());
    this._bindTowerButtons();
    this._bindUpgradeSell();
  }

  /** Keep hut / shop prices in sync with TOWER_CONFIGS (HTML defaults are stale). */
  private _syncTowerShopLabels(): void {
    const icons: Record<string, string> = {
      archer: '🏹',
      catapult: '💥',
      wall: '🧱',
    };
    const shortNames: Record<string, string> = {
      archer: 'Arc',
      catapult: 'Cat',
      wall: 'Wall',
    };
    const compact = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
    for (const btn of this.towerButtons) {
      const type = btn.dataset.type!;
      const c = TOWER_CONFIGS[type];
      if (!c) continue;
      btn.textContent = compact
        ? `${icons[type] ?? ''} ${shortNames[type] ?? c.name} ${c.cost}g`
        : `${icons[type] ?? ''} ${c.name} (${c.cost}g)`;
    }
  }

  // ─── Per-frame update ──────────────────────────────────────────────────────

  update(): void {
    // Keep old panel hidden; tower actions now use contextual circle menu.
    this.$panel.style.display = 'none';

    if (gs.selectedTower) {
      const t = gs.selectedTower;
      this.$name.textContent = t.config.name;
      this.$level.textContent = `Level ${t.level}/3`;
      const ucost = t.upgradeCost;
      if (ucost !== null) {
        this.$upgradeBtn.textContent = `⬆ Upgrade (${ucost}g)`;
        this.$upgradeBtn.disabled = gs.gold < ucost;
        this.$upgradeBtn.classList.toggle('too-poor', gs.gold < ucost);
        if (this.$circleUpgrade) {
          this.$circleUpgrade.style.display = 'inline-block';
          this.$circleUpgrade.textContent = `⬆ Upgrade (${ucost}g)`;
          this.$circleUpgrade.disabled = gs.gold < ucost;
        }
      } else {
        if (this.$circleUpgrade) this.$circleUpgrade.style.display = 'none';
      }
      this.$sellBtn.textContent = `💰 Sell (${t.sellValue}g)`;
      if (this.$circleSell) this.$circleSell.textContent = `💰 Sell (${t.sellValue}g)`;
      this._positionCircleForTower(t.gx + 0.5, t.gy + 0.5);
      this.$circle?.classList.add('visible');
    } else {
      this.$circle?.classList.remove('visible');
    }

    // Tower button states
    this._updateTowerButtons();
  }

  private _updateTowerButtons(): void {
    this.towerButtons.forEach(btn => {
      const type = btn.dataset.type!;
      const cost = TOWER_CONFIGS[type].cost;
      const locked = !gs.unlockedTowers.has(type);
      const tooPoor = gs.gold < cost;
      btn.style.display = locked ? 'none' : '';
      btn.disabled = locked || tooPoor;
      btn.classList.toggle('too-poor', tooPoor && !locked);
      btn.classList.toggle('ls-locked', locked);
    });
  }

  private _bindTowerButtons(): void {
    this.towerButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        input.syncPointer(e.clientX, e.clientY);
        const type = btn.dataset.type!;
        gs.selectedType = gs.selectedType === type ? null : type;
        gs.selectedTower = null;
        this.towerButtons.forEach(b => b.classList.remove('selected'));
        if (gs.selectedType) btn.classList.add('selected');
        else btn.classList.remove('selected');
      });
    });
  }

  private _bindUpgradeSell(): void {
    const doUpgrade = () => {
      if (!gs.selectedTower || gs.gameOver || !gs.hero || !gs.hero.alive) return;
      const t = gs.selectedTower;
      gs.pendingUpgradeTower = t;
      gs.hero.moveTo(t.gx + 0.5, t.gy + 0.5);
      this.$circle?.classList.remove('visible');
    };
    const doSell = () => {
      if (!gs.selectedTower || gs.gameOver || !gs.grid) return;
      const scene = (window as any).__scene;
      gs.sellTower(gs.selectedTower, scene);
      gs.selectedTower = null;
      this.$circle?.classList.remove('visible');
    };
    this.$upgradeBtn.addEventListener('click', doUpgrade);
    this.$sellBtn.addEventListener('click', doSell);
    this.$circleUpgrade?.addEventListener('click', doUpgrade);
    this.$circleSell?.addEventListener('click', doSell);
  }

  private _positionCircleForTower(wx: number, wz: number): void {
    if (!this.$circle) return;
    const camera = (window as any).__camera as THREE.Camera | undefined;
    if (!camera) return;
    const projected = new THREE.Vector3(wx, 0.85, wz).project(camera);
    const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
    const clampedX = Math.max(100, Math.min(window.innerWidth - 100, x));
    const clampedY = Math.max(100, Math.min(window.innerHeight - 100, y));
    this.$circle.style.left = `${Math.round(clampedX)}px`;
    this.$circle.style.top = `${Math.round(clampedY)}px`;
  }
}
