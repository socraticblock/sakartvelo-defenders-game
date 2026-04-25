export interface BossData {
  id?: string;
  type?: string;
  hp_mult?: number;
  speed_mult?: number;
}

export interface LevelData {
  era: number;
  level: number;
  name: string;
  starting_gold: number;
  starting_lives: number;
  total_waves: number;
  grid_width: number;
  grid_height: number;
  path_waypoints: number[][];
  waves: WaveData[];
  historical_fact: string;
  boss: string | BossData | null;
  build_nodes?: number[][];
  theme?: string;
  defense_target?: string;
}

export interface WaveData {
  wave_num: number;
  enemies: EnemySpawnData[];
}

export interface EnemySpawnData {
  type: string;
  count: number;
  hp_mult: number;
  speed_mult: number;
  spawn_interval: number;
}

export interface TowerConfig {
  damage: number;
  range: number;
  attackSpeed: number;
  projectileSpeed: number;
  cost: number;
  color: number;
  name: string;
  upgradeCosts: number[]; // [L1→L2 cost, L2→L3 cost]
  splashRadius: number; // 0 = single target
  critChance: number;   // 0 = no crits
}

/** userData attached to each tile mesh by the Grid */
export interface TileUserData {
  gx: number;
  gy: number;
  isPath: boolean;
}

// Re-export tower configs from canonical location
export { TOWER_CONFIGS, TOWER_LEVEL_MULTS } from './TowerConfigs';

export const ENEMY_CONFIGS: Record<string, {
  hp: number; speed: number; color: number; scale: number; reward: number;
  livesCost: number; wallDmg: number; // damage dealt to walls per hit
}> = {
  infantry: { hp: 60, speed: 2.0, color: 0xcc4444, scale: 0.3, reward: 8, livesCost: 1, wallDmg: 10 },
  cavalry:  { hp: 100, speed: 3.2, color: 0xcc7733, scale: 0.35, reward: 12, livesCost: 1, wallDmg: 15 },
  siege:    { hp: 180, speed: 1.3, color: 0x8844aa, scale: 0.45, reward: 20, livesCost: 2, wallDmg: 40 },
  flying:   { hp: 45, speed: 3.8, color: 0x33aacc, scale: 0.25, reward: 15, livesCost: 1, wallDmg: 0 },
  boss:     { hp: 500, speed: 1.5, color: 0xff2222, scale: 0.55, reward: 150, livesCost: 5, wallDmg: 50 },
};
