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
  sub_era?: string;
  map_profile?: string;
  signature_profile?: string;
  historical_profile?: string;
  boss_profile?: string;
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
  infantry: { hp: 75, speed: 2.2, color: 0xcc4444, scale: 0.3, reward: 7, livesCost: 1, wallDmg: 12 },
  cavalry:  { hp: 125, speed: 3.4, color: 0xcc7733, scale: 0.35, reward: 10, livesCost: 1, wallDmg: 18 },
  siege:    { hp: 250, speed: 1.4, color: 0x8844aa, scale: 0.45, reward: 18, livesCost: 2, wallDmg: 45 },
  flying:   { hp: 55, speed: 4.0, color: 0x33aacc, scale: 0.25, reward: 14, livesCost: 1, wallDmg: 0 },
  boss:     { hp: 800, speed: 1.6, color: 0xff2222, scale: 0.55, reward: 120, livesCost: 5, wallDmg: 60 },
};
