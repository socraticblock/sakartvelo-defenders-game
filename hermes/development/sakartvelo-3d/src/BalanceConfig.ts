/**
 * BalanceConfig.ts
 * Central tuning knobs for the active Era 0 game loop.
 *
 * Keep raw balance values here so gameplay tuning is deliberate instead of
 * scattered through UI, hero, wave, and unit code.
 */
export const ECONOMY_BALANCE = {
  /** Keep level JSON as the source of truth while Era 0 is being tuned. */
  startingGoldMultiplier: 1,
  /** Matches the current HUD / horn display: players receive exactly what they see. */
  buildPhaseBonusPerSecond: 2,
  /** Matches the current countdown display: players receive exactly what they see. */
  countdownBonusPerSecond: 3,
  waveBonusBase: 15,
  waveBonusPerWave: 5,
} as const;

export const HERO_BALANCE = {
  moveSpeed: 3.5,
  attackRange: 2.8,
  attackDamage: 14,
  attackInterval: 1.0,
  respawnTime: 15,
  buildRange: 1.5,
  buildTime: 1.5,
} as const;

export const FRIENDLY_INFANTRY_BALANCE = {
  /** Emergency reinforcement, not a better Archer. */
  cost: 65,
  cooldown: 20,
  maxActive: 2,
  hp: 110,
  speed: 1.9,
  attackDamage: 7,
  attackRange: 0.75,
  attackCooldown: 0.9,
} as const;
