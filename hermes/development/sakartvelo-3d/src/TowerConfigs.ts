/**
 * TowerConfigs.ts
 * All tower configuration data. No game logic here.
 */
import type { TowerConfig } from './types';

export const TOWER_CONFIGS: Record<string, TowerConfig> = {
  archer: {
    damage: 18, range: 3.5, attackSpeed: 1.0,
    projectileSpeed: 18, cost: 75, color: 0x8b6914, name: 'Archer',
    upgradeCosts: [80, 160],
    splashRadius: 0,
    critChance: 0,
  },
  catapult: {
    damage: 45, range: 5.0, attackSpeed: 0.4,
    projectileSpeed: 12, cost: 150, color: 0x666666, name: 'Catapult',
    upgradeCosts: [120, 220],
    splashRadius: 0,
    critChance: 0,
  },
  wall: {
    damage: 0, range: 0, attackSpeed: 0,
    projectileSpeed: 0, cost: 40, color: 0x999999, name: 'Wall',
    upgradeCosts: [50, 100],
    splashRadius: 0,
    critChance: 0,
  },
};

// Tower level multipliers: [L1, L2, L3]
export const TOWER_LEVEL_MULTS = {
  archer: {
    damage:  [1.0, 1.9, 3.0],
    range:   [1.0, 1.15, 1.35],
    speed:   [1.0, 1.35, 1.85],
    crit:    [0,   0,   0.25],
  },
  catapult: {
    damage:  [1.0, 1.8, 2.9],
    range:   [1.0, 1.15, 1.3],
    speed:   [1.0, 1.3, 1.7],
    splash:  [0,   1.1, 1.9],
  },
  wall: {
    hp:      [700, 1550, 2900],
    slow:    [0.3, 0.42, 0.58],
    reflect: [0,   0,   10],
  },
};
