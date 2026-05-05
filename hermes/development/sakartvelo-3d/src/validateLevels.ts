import { ENEMY_CONFIGS, LevelData } from './types';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getLevelsArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray((raw as { levels?: unknown }).levels)) {
    return (raw as { levels: unknown[] }).levels;
  }
  console.warn('Invalid levels payload: expected an array or { levels: array }.');
  return [];
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

  if (!Array.isArray(level.waves)) {
    console.warn(prefix, 'waves must be an array.');
    return false;
  }

  for (const wave of level.waves as any[]) {
    if (!isFiniteNumber(wave?.wave_num)) {
      console.warn(prefix, 'each wave needs a finite wave_num.');
      return false;
    }

    if (!Array.isArray(wave.enemies)) {
      console.warn(prefix, `wave ${wave.wave_num} enemies must be an array.`);
      return false;
    }

    for (const enemy of wave.enemies) {
      const knownType = typeof enemy?.type === 'string' && enemy.type in ENEMY_CONFIGS;
      if (!knownType || !isFiniteNumber(enemy?.count) || enemy.count <= 0) {
        console.warn(prefix, `wave ${wave.wave_num} has an invalid enemy entry.`, enemy);
        return false;
      }
    }
  }

  return true;
}

export function validateLevels(raw: unknown): LevelData[] {
  return getLevelsArray(raw).filter(isValidLevel);
}
