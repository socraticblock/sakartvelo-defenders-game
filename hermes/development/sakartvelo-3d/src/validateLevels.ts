import { ENEMY_CONFIGS, LevelData, type EnemyFormation } from './types';
import { safeAssetPath } from './utils/assets';

const TEXT_LIMITS: Record<string, number> = {
  name: 120,
  historical_fact: 2000,
  defense_target: 120,
  theme: 120,
  sub_era: 120,
  map_profile: 120,
  signature_profile: 120,
  historical_profile: 120,
  boss_profile: 120,
  imageUrl: 256,
};

const ENEMY_FORMATIONS = new Set<EnemyFormation>(['line', 'loose', 'wide', 'column']);

type GridPoint = [number, number];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBoundedInt(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}

function isPoint(value: unknown): value is GridPoint {
  return Array.isArray(value) &&
    value.length === 2 &&
    isFiniteNumber(value[0]) &&
    isFiniteNumber(value[1]);
}

function getLevelsArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray((raw as { levels?: unknown }).levels)) {
    return (raw as { levels: unknown[] }).levels;
  }
  console.warn('Invalid levels payload: expected an array or { levels: array }.');
  return [];
}

/**
 * v5 gameplay is landscape-only. The early data set was authored as 12×16
 * portrait boards. Rotate those legacy boards clockwise at load time so the
 * playable level itself becomes a horizontal battlefield, not merely a portrait
 * board hidden inside a landscape browser window.
 */
function normalizeLevelToLandscape(level: LevelData): LevelData {
  if (level.grid_width >= level.grid_height) return level;

  const oldHeight = level.grid_height;
  const rotatePoint = ([x, y]: number[]): GridPoint => [oldHeight - 1 - y, x];

  return {
    ...level,
    grid_width: level.grid_height,
    grid_height: level.grid_width,
    path_waypoints: level.path_waypoints.map(rotatePoint),
    build_nodes: level.build_nodes?.map(rotatePoint),
    wall_nodes: level.wall_nodes?.map(rotatePoint),
  };
}

function isValidLevel(candidate: unknown, index: number): candidate is LevelData {
  const level = candidate as Partial<LevelData>;
  const prefix = `Invalid level at index ${index}:`;

  if (!candidate || typeof candidate !== 'object') {
    console.warn(prefix, 'entry is not an object.');
    return false;
  }

  const requiredNumbers: (keyof LevelData)[] = [
    'era',
    'level',
    'grid_width',
    'grid_height',
    'starting_gold',
    'starting_lives',
  ];

  for (const key of requiredNumbers) {
    if (!isFiniteNumber(level[key])) {
      console.warn(prefix, `${String(key)} must be a finite number.`);
      return false;
    }
  }

  if (typeof level.name !== 'string' || level.name.trim().length === 0) {
    console.warn(prefix, 'name must be a non-empty string.');
    return false;
  }

  if (!isBoundedInt(level.era, 0, 9) || !isBoundedInt(level.level, 1, 20)) {
    console.warn(prefix, 'era and level must be integers in sane ranges.');
    return false;
  }

  if (!isBoundedInt(level.grid_width, 4, 80) || !isBoundedInt(level.grid_height, 4, 80)) {
    console.warn(prefix, 'grid_width and grid_height must be bounded integers.');
    return false;
  }

  if (!isBoundedInt(level.starting_gold, 0, 10000) || !isBoundedInt(level.starting_lives, 1, 999)) {
    console.warn(prefix, 'starting_gold and starting_lives must be bounded integers.');
    return false;
  }

  if (!Array.isArray(level.path_waypoints) || level.path_waypoints.length < 2 || !level.path_waypoints.every(isPoint)) {
    console.warn(prefix, 'path_waypoints must contain at least two [number, number] pairs.');
    return false;
  }

  if (level.build_nodes !== undefined && (!Array.isArray(level.build_nodes) || !level.build_nodes.every(isPoint))) {
    console.warn(prefix, 'build_nodes must be [number, number] pairs when present.');
    return false;
  }

  if (level.wall_nodes !== undefined && (!Array.isArray(level.wall_nodes) || !level.wall_nodes.every(isPoint))) {
    console.warn(prefix, 'wall_nodes must be [number, number] pairs when present.');
    return false;
  }

  for (const [key, maxLength] of Object.entries(TEXT_LIMITS)) {
    const value = (level as Record<string, unknown>)[key];
    if (value !== undefined && (typeof value !== 'string' || value.length > maxLength)) {
      console.warn(prefix, `${key} must be a string up to ${maxLength} characters.`);
      return false;
    }
  }

  if (level.imageUrl !== undefined && !safeAssetPath(level.imageUrl)) {
    console.warn(prefix, 'imageUrl must be a safe local asset path.');
    return false;
  }

  if (!Array.isArray(level.waves) || level.waves.length < 1 || level.waves.length > 50) {
    console.warn(prefix, 'waves must be an array with a sane count.');
    return false;
  }

  for (const wave of level.waves as any[]) {
    if (!isBoundedInt(wave?.wave_num, 1, 50)) {
      console.warn(prefix, 'each wave needs a bounded integer wave_num.');
      return false;
    }

    if (!Array.isArray(wave.enemies) || wave.enemies.length < 1 || wave.enemies.length > 20) {
      console.warn(prefix, `wave ${wave.wave_num} enemies must be an array with a sane count.`);
      return false;
    }

    for (const enemy of wave.enemies) {
      const knownType = typeof enemy?.type === 'string' && enemy.type in ENEMY_CONFIGS;
      if (!knownType || !isBoundedInt(enemy?.count, 1, 500)) {
        console.warn(prefix, `wave ${wave.wave_num} has an invalid enemy entry.`, enemy);
        return false;
      }

      if (enemy.hp_mult !== undefined && (!isFiniteNumber(enemy.hp_mult) || enemy.hp_mult <= 0 || enemy.hp_mult > 100)) {
        console.warn(prefix, `wave ${wave.wave_num} has invalid hp_mult.`, enemy);
        return false;
      }

      if (enemy.speed_mult !== undefined && (!isFiniteNumber(enemy.speed_mult) || enemy.speed_mult <= 0 || enemy.speed_mult > 100)) {
        console.warn(prefix, `wave ${wave.wave_num} has invalid speed_mult.`, enemy);
        return false;
      }

      if (enemy.spawn_interval !== undefined && (!isFiniteNumber(enemy.spawn_interval) || enemy.spawn_interval < 0 || enemy.spawn_interval > 60)) {
        console.warn(prefix, `wave ${wave.wave_num} has invalid spawn_interval.`, enemy);
        return false;
      }

      if (enemy.pathId !== undefined && (typeof enemy.pathId !== 'string' || enemy.pathId.length > 80)) {
        console.warn(prefix, `wave ${wave.wave_num} has invalid pathId.`, enemy);
        return false;
      }

      if (enemy.formation !== undefined && (!ENEMY_FORMATIONS.has(enemy.formation))) {
        console.warn(prefix, `wave ${wave.wave_num} has invalid formation.`, enemy);
        return false;
      }
    }
  }

  return true;
}

export function validateLevels(raw: unknown): LevelData[] {
  return getLevelsArray(raw).filter(isValidLevel).map(normalizeLevelToLandscape);
}
