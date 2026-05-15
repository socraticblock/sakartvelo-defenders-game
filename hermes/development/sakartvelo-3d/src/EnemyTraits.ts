export type EnemyMovementClass = 'ground' | 'flying';
export type DamageSource = 'archer' | 'catapult' | 'heroMagic' | 'friendlyInfantry' | 'abilityMagic';

export interface EnemyTraits {
  movementClass: EnemyMovementClass;
  blockableByWalls: boolean;
  blockableByFriendlies: boolean;
  blockableByHero: boolean;
  targetableBy: Record<DamageSource, boolean>;
}

const GROUND_TARGETING: Record<DamageSource, boolean> = {
  archer: true,
  catapult: true,
  heroMagic: true,
  friendlyInfantry: true,
  abilityMagic: true,
};

const FLYING_TARGETING: Record<DamageSource, boolean> = {
  archer: true,
  catapult: false,
  heroMagic: true,
  friendlyInfantry: false,
  abilityMagic: true,
};

export const ENEMY_TRAITS: Record<string, EnemyTraits> = {
  infantry: {
    movementClass: 'ground',
    blockableByWalls: true,
    blockableByFriendlies: true,
    blockableByHero: true,
    targetableBy: GROUND_TARGETING,
  },
  cavalry: {
    movementClass: 'ground',
    blockableByWalls: true,
    blockableByFriendlies: true,
    blockableByHero: true,
    targetableBy: GROUND_TARGETING,
  },
  siege: {
    movementClass: 'ground',
    blockableByWalls: true,
    blockableByFriendlies: true,
    blockableByHero: true,
    targetableBy: GROUND_TARGETING,
  },
  flying: {
    movementClass: 'flying',
    blockableByWalls: false,
    blockableByFriendlies: false,
    blockableByHero: false,
    targetableBy: FLYING_TARGETING,
  },
  boss: {
    movementClass: 'ground',
    blockableByWalls: true,
    blockableByFriendlies: true,
    blockableByHero: true,
    targetableBy: GROUND_TARGETING,
  },
};

export function getEnemyTraits(type: string): EnemyTraits {
  return ENEMY_TRAITS[type] ?? ENEMY_TRAITS.infantry;
}

export function canDamageEnemy(enemyType: string, source: DamageSource): boolean {
  return getEnemyTraits(enemyType).targetableBy[source];
}

export function isFlyingEnemy(enemyType: string): boolean {
  return getEnemyTraits(enemyType).movementClass === 'flying';
}
