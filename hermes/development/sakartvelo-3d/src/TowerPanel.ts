/**
 * TowerPanel.ts
 * Tower selection buttons and tower info panel (upgrade/sell).
 * Extracted from UIManager.ts.
 */
import { gs } from './GameState';
import { input } from './InputManager';
import { TOWER_CONFIGS } from './types';

export class TowerPanel {
  private $panel = document.getElementById('tower-panel')!;
  private $name = document.getElementById('tower-panel-name')!;
  private $level = document.getElementById('tower-panel-level')!;
  private $upgradeBtn = document.getElementById('upgrade-btn') as HTMLButtonElement;
  private $sellBtn = document.getElementById('sell-btn') as HTMLButtonElement;
  towerButtons: HTMLButtonElement[];

  constructor() {
    this.towerButtons = Array.from(
      document.querySelectorAll('.tower-btn')
    ) as HTMLButtonElement[];
    this._syncTowerShopLabels();
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
    for (const btn of this.towerButtons) {
      const type = btn.dataset.type!;
      const c = TOWER_CONFIGS[type];
      if (!c) continue;
      btn.textContent = `${icons[type] ?? ''} ${c.name} (${c.cost}g)`;
    }
  }

  // ─── Per-frame update ──────────────────────────────────────────────────────

  update(): void {
    // Tower info panel
    if (gs.selectedTower) {
      const t = gs.selectedTower;
      this.$panel.style.display = 'flex';
      this.$name.textContent = t.config.name;
      this.$level.textContent = `Level ${t.level}/3`;
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
      this.$panel.style.display = 'none';
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
    this.$upgradeBtn.addEventListener('click', () => {
      if (!gs.selectedTower || gs.gameOver || !gs.hero || !gs.hero.alive) return;
      const t = gs.selectedTower;
      gs.pendingUpgradeTower = t;
      gs.hero.moveTo(t.gx + 0.5, t.gy + 0.5);
    });
    this.$sellBtn.addEventListener('click', () => {
      if (!gs.selectedTower || gs.gameOver || !gs.grid) return;
      const scene = (window as any).__scene;
      gs.sellTower(gs.selectedTower, scene);
      gs.selectedTower = null;
    });
  }
}
