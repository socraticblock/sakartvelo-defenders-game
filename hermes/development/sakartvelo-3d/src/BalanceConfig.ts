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
  moveSpeed: 4.2,
  attackRange: 2.8,
  attackDamage: 14,
  attackInterval: 1.0,
  respawnTime: 15,
  buildRange: 1.65,
  buildTime: 1.25,
} as const;

export const FRIENDLY_INFANTRY_BALANCE = {
  /** Emergency reinforcement map power, not a paid disposable item. */
  cost: 0,
  cooldown: 24,
  maxActive: 2,
  hp: 110,
  speed: 1.9,
  attackDamage: 7,
  attackRange: 0.75,
  attackCooldown: 0.9,
} as const;

export const V5_SLICE_BALANCE = {
  tacticalSlowMotionScale: 0.1,
  dragThresholdPx: 10,
  touchDragThresholdPx: 12,
  tapMaxDurationMs: 260,
  plinthTapRadius: 1.15,
  stonefallCooldown: 26,
  stonefallRadius: 1.85,
  stonefallDamage: 125,
  archerDamageUpgradeMult: 1.05,
  heroBuildSpeedUpgradeMult: 0.95,
} as const;

/** Map presentation tuning (Level 1 framed diorama vs standard board levels). */
export const MAP_PRESENTATION_BALANCE = {
  fullFieldPathWidth: 1.4,
  boardPathWidth: 1.25,
  /** Baseline path width used when lane offsets were authored. */
  pathWidthBaseline: 1.15,
  /** Replaces legacy 0.72–0.78 zoom-out on full_field. */
  fullFieldFramingScale: 1.0,
  /** Margin around logic grid for camera framing and pan clamp. */
  fullFieldPlayableSkirtCells: 2,
  /** Exponential fog density on Level 1 diorama (higher = faster falloff). */
  fullFieldFogDensity: 0.032,
  /** Standard battle fog when not on framed full_field. */
  boardFogDensity: 0.0135,
} as const;

/** Combat speed multiplier when not in tactical slow-mo (Bible §5.4). */
export const COMBAT_SPEED_OPTIONS = [1, 2] as const;
export type CombatSpeedMultiplier = (typeof COMBAT_SPEED_OPTIONS)[number];
