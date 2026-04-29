import * as THREE from 'three';
import { LevelData, EnemySpawnData } from './types';
import { Enemy } from './Enemy';

export class WaveManager {
  waves: { wave_num: number; enemies: EnemySpawnData[] }[];
  worldPath: THREE.Vector3[];

  currentWave = -1;
  private spawnList: EnemySpawnData[] = [];
  private spawnIndex = 0;
  private spawnTimer = 0;

  active = false;
  allDone = false;
  aliveEnemies: Enemy[] = [];

  // Build phase: 25 seconds between waves to place towers
  inBuildPhase = false;
  buildPhaseTimer = 0;
  readonly BUILD_PHASE_DURATION = 25;

  constructor(level: LevelData, worldPath: THREE.Vector3[]) {
    this.waves = level.waves;
    this.worldPath = worldPath;
    // Start the very first wave in build phase so the player can plan
    this.inBuildPhase = true;
    this.buildPhaseTimer = this.BUILD_PHASE_DURATION;
  }

  /** Start the 25-second build phase after a wave ends. Returns true if build phase started. */
  startBuildPhase(): boolean {
    if (this.active || this.allDone) return false;
    // Don't start build phase if we're about to advance to a new wave
    if (this.currentWave + 1 >= this.waves.length) return false;
    this.inBuildPhase = true;
    this.buildPhaseTimer = this.BUILD_PHASE_DURATION;
    this.active = false;
    return true;
  }

  /** Call each frame during build phase. Returns remaining time. */
  updateBuildPhase(dt: number): number {
    if (!this.inBuildPhase) return 0;
    this.buildPhaseTimer -= dt;
    if (this.buildPhaseTimer <= 0) {
      this.buildPhaseTimer = 0;
    }
    return this.buildPhaseTimer;
  }

  /** Force-end build phase immediately (e.g., player clicks "Start Wave Now"). */
  endBuildPhase(): void {
    this.inBuildPhase = false;
    this.buildPhaseTimer = 0;
  }

  /** Get description of the NEXT wave (for build phase preview). */
  getNextWavePreview(): { types: string[]; entries: { type: string; count: number }[]; totalCount: number; waveNum: number } {
    const nextIdx = this.currentWave + 1;
    if (nextIdx >= this.waves.length) return { types: [], entries: [], totalCount: 0, waveNum: nextIdx + 1 };
    const nextWave = this.waves[nextIdx];
    const typeCount: Record<string, number> = {};
    for (const group of nextWave.enemies) {
      const key = group.type.toUpperCase();
      typeCount[key] = (typeCount[key] || 0) + group.count;
    }
    const types = Object.entries(typeCount).map(([t, c]) => `${c}×${t}`);
    const entries = Object.entries(typeCount).map(([t, c]) => ({ type: t.toLowerCase(), count: c }));
    const totalCount = nextWave.enemies.reduce((s, g) => s + g.count, 0);
    return { types, entries, totalCount, waveNum: nextIdx + 1 };
  }

  startNext(): boolean {
    if (this.allDone || this.active) return false;
    // If we're in build phase, clicking starts the wave immediately
    if (this.inBuildPhase) this.inBuildPhase = false;
    
    this.currentWave++;
    if (this.currentWave >= this.waves.length) { this.allDone = true; return false; }

    this.spawnList = [];
    for (const group of this.waves[this.currentWave].enemies) {
      for (let i = 0; i < group.count; i++) this.spawnList.push(group);
    }
    this.spawnIndex = 0;
    this.spawnTimer = 0.3; // short initial delay
    this.active = true;
    return true;
  }

  update(dt: number): Enemy | null {
    if (!this.active) return null;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.spawnIndex < this.spawnList.length) {
      const s = this.spawnList[this.spawnIndex];
      const enemy = new Enemy(s.type, this.worldPath, s.hp_mult, s.speed_mult);
      this.aliveEnemies.push(enemy);
      this.spawnIndex++;
      this.spawnTimer = s.spawn_interval || 0.8;
      return enemy;
    }
    return null;
  }

  isWaveDone(): boolean {
    if (!this.active) return true;
    if (this.spawnIndex < this.spawnList.length) return false;
    return this.aliveEnemies.every(e => !e.alive);
  }

  clear() {
    this.aliveEnemies = [];
    this.active = false;
    this.inBuildPhase = false;
  }

  get waveNum(): number { return this.currentWave + 1; }
  get totalWaves(): number { return this.waves.length; }
}
