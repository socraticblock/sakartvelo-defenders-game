/**
 * GameState.ts
 * Single source of truth for all mutable game state.
 * Import this singleton everywhere: `import { gs } from './GameState'`
 */
import * as THREE from 'three';
import { LevelData, TOWER_CONFIGS } from './types';
import { Grid } from './Grid';
import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { ProjectilePool } from './Projectile';
import { WaveManager } from './WaveManager';
import { Hero } from './Hero';
import { SaveManager } from './SaveManager';
import { FriendlyInfantry } from './FriendlyInfantry';

export class GameState {
  // ─── Entities ───────────────────────────────────────────
  grid: Grid | null = null;
  waveMgr: WaveManager | null = null;
  hero: Hero | null = null;
  enemies: Enemy[] = [];
  friendlies: FriendlyInfantry[] = [];
  towers: Tower[] = [];
  projectilePool!: ProjectilePool;

  // ─── Economy ─────────────────────────────────────────────
  gold = 100;
  lives = 20;
  infantryCost = 35;
  infantryCooldown = 0;

  // ─── Selection ───────────────────────────────────────────
  selectedType: string | null = null;   // tower type being placed
  selectedTower: Tower | null = null;   // existing tower clicked
  pendingUpgradeTower: Tower | null = null; // tower to upgrade once hero reaches it
  commandLinkTower: Tower | null = null; // Medea's closest offensive tower link

  // ─── Level ──────────────────────────────────────────────
  currentLevel: LevelData | null = null;
  allLevels: LevelData[] = [];
  startingLives = 20;

  // ─── Game flow ───────────────────────────────────────────
  gameOver = false;
  paused = false;
  targetTimeScale = 1.0;
  currentTimeScale = 1.0;
  gameTime = 0; // Scaled time for synchronized slow-mo animations
  levelElapsedTime = 0;
  waveCountdown = 0;
  waveCountdownActive = false;
  waveCompleteProcessed = false;
  popupDismissed = false;
  bossKilled = false;

  // ─── Tower unlocks ───────────────────────────────────────
  unlockedTowers = new Set<string>(['archer', 'catapult', 'wall']);

  // ─── Camera ──────────────────────────────────────────────
  cameraBaseX = 0;

  // ─── Helpers ─────────────────────────────────────────────
  get buildPhaseActive() { return this.waveMgr?.inBuildPhase ?? false; }
  get waveActive() { return this.waveMgr?.active ?? false; }
  get currentWaveNum() { return this.waveMgr?.waveNum ?? 0; }
  get totalWaves() { return this.waveMgr?.totalWaves ?? 0; }

  constructor() {
    // Allocate projectile pool immediately so game loop can use it
    // even before a level is loaded
  }

  // ─── Level lifecycle ──────────────────────────────────────

  initLevel(lvl: LevelData, scene: THREE.Scene): void {
    // Clean up old level entities
    this.enemies.forEach(e => scene.remove(e.group));
    this.friendlies.forEach(f => scene.remove(f.group));
    this.towers.forEach(t => scene.remove(t.group));
    if (this.grid) scene.remove(this.grid.group);
    if (this.hero) scene.remove(this.hero.group);

    this.enemies = [];
    this.friendlies = [];
    this.towers = [];
    this.projectilePool?.dispose();
    this.projectilePool = new ProjectilePool(scene);

    this.currentLevel = lvl;
    this.gold = lvl.starting_gold;
    this.lives = lvl.starting_lives;
    this.startingLives = lvl.starting_lives;
    this.gameOver = false;
    this.paused = false;
    this.selectedTower = null;
    this.selectedType = null;
    this.pendingUpgradeTower = null;
    this.commandLinkTower = null;
    this.waveCountdownActive = false;
    this.waveCompleteProcessed = false;
    this.popupDismissed = false;
    this.bossKilled = false;
    this.infantryCooldown = 0;
    this.levelElapsedTime = 0;

    this.grid = new Grid(lvl);
    scene.add(this.grid.group);

    const worldPath = this.grid.getWorldPath();
    this.waveMgr = new WaveManager(lvl, worldPath);

    // Create hero at path start
    this.hero = new Hero(worldPath[0].x, worldPath[0].z, lvl.grid_width, lvl.grid_height);
    scene.add(this.hero.group);

    this.unlockedTowers = this.computeUnlocks(lvl.level);
  }

  private computeUnlocks(level: number): Set<string> {
    if (level >= 1) return new Set(['archer', 'catapult', 'wall']);
    return new Set(['archer']);
  }

  // ─── Tower placement ─────────────────────────────────────

  placeTower(type: string, gx: number, gy: number, isPath: boolean, scene: THREE.Scene): Tower | null {
    if (!this.grid || !this.currentLevel) return null;
    const cost = TOWER_CONFIGS[type].cost;
    if (this.gold < cost) return null;
    if (!this.grid.isBuildable(gx, gy, type === 'wall')) return null;

    this.gold -= cost;
    const tower = new Tower(type, gx, gy, isPath);
    
    // Final check for nudged position
    const vPos = this.grid.getPlinthVisualPos(gx, gy);
    if (vPos) tower.group.position.copy(vPos);

    this.towers.push(tower);
    scene.add(tower.group);
    this.grid.occupy(gx, gy);
    this.grid.flashTile(gx, gy, 0x44ff44);
    return tower;
  }

  sellTower(tower: Tower, scene: THREE.Scene): void {
    if (!this.grid) return;
    this.gold += tower.sellValue;
    scene.remove(tower.group);
    this.towers = this.towers.filter(t => t !== tower);
    this.grid.free(tower.gx, tower.gy);
  }

  upgradeTower(tower: Tower): boolean {
    const cost = tower.upgradeCost;
    if (cost === null || this.gold < cost) return false;
    this.gold -= cost;
    tower.upgrade();
    return true;
  }

  // ─── Wave management ─────────────────────────────────────

  startWave(bonus = 0): boolean {
    if (!this.waveMgr) return false;
    // Force end build phase if we are in it
    if (this.waveMgr.inBuildPhase) this.waveMgr.endBuildPhase();
    
    if (this.waveMgr.startNext()) {
      this.gold += bonus;
      this.waveCountdownActive = false;
      return true;
    }
    return false;
  }

  startWaveCountdown(): void {
    this.waveCountdownActive = true;
    this.waveCountdown = 25;
  }

  // ─── Gold & lives ────────────────────────────────────────

  addGold(amount: number): void { this.gold += amount; }

  loseLife(amount: number): void {
    this.lives -= amount;
    if (this.lives <= 0) {
      this.lives = 0;
      this.gameOver = true;
    }
  }

  // ─── Star rating ─────────────────────────────────────────

  getStars(): number {
    const ratio = this.lives / this.startingLives;
    if (ratio >= 0.8) return 3;
    if (ratio >= 0.5) return 2;
    return 1;
  }

  getStarString(n: number): string {
    return '⭐'.repeat(n) + '☆'.repeat(3 - n);
  }

  // ─── Enemy spawning ──────────────────────────────────────

  addEnemy(enemy: Enemy, scene: THREE.Scene): void {
    this.enemies.push(enemy);
    scene.add(enemy.group);
  }

  removeEnemy(enemy: Enemy, scene: THREE.Scene): void {
    scene.remove(enemy.group);
    this.enemies = this.enemies.filter(e => e !== enemy);
  }

  canSpawnInfantry(): boolean {
    return !!this.grid && !this.gameOver && this.gold >= this.infantryCost && this.infantryCooldown <= 0;
  }

  spawnFriendlyInfantry(scene: THREE.Scene): boolean {
    if (!this.grid || !this.canSpawnInfantry()) return false;
    const unit = new FriendlyInfantry(this.grid.getWorldPath());
    this.gold -= this.infantryCost;
    this.infantryCooldown = 8;
    this.friendlies.push(unit);
    scene.add(unit.group);
    return true;
  }

  // ─── Save ────────────────────────────────────────────────

  saveLevelComplete(won: boolean): void {
    if (!won || !this.currentLevel) return;

    const era = Number(this.currentLevel.era);
    const level = Number(this.currentLevel.level);
    const levelId = SaveManager.levelId(era, level);

    SaveManager.completeLevel(levelId, this.getStars(), this.levelElapsedTime);
  }

  // ─── Wave bonus ──────────────────────────────────────────

  getWaveBonus(waveNum: number): number {
    return 25 + waveNum * 10;
  }

  getCountdownBonus(): number {
    return Math.ceil(this.waveCountdown * 3);
  }

  getBuildPhaseBonus(): number {
    return Math.ceil((this.waveMgr?.buildPhaseTimer ?? 0) * 2);
  }
}

export const gs = new GameState();
