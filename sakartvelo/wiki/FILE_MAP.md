# File Map — Sakartvelo Defenders

Quick reference: file → responsibility → lines. All files ≤300 lines.

## Entry & Core State
| File | Responsibility | Lines |
|------|---------------|-------|
| `main.ts` | Entry point — scene, renderer, camera, manager init, event wiring | 243 |
| `GameState.ts` | Singleton `gs` — all mutable state (gold, lives, towers, enemies, grid, etc.) | 218 |

## Game Loop
| File | Responsibility | Lines |
|------|---------------|-------|
| `GameLoop.ts` | 13-step animate loop, orchestration, camera sway | 213 |
| `EnemyAI.ts` | Enemy slow by walls, wall attacks, death rewards | 92 |

## Input & UI
| File | Responsibility | Lines |
|------|---------------|-------|
| `InputManager.ts` | Keyboard (QWERTY/AZERTY), mouse/touch, raycasting, hover mesh | 322* |
| `UIManager.ts` | HUD coordination — gold/lives/wave, build phase, keyboard badge | 163 |
| `TowerPanel.ts` | Tower buttons (5 types), info panel (upgrade/sell cost) | 89 |
| `ScreenManager.ts` | Title screen, level select, tutorial, game-over, level-complete, cultural facts | 273 |

## Hero
| File | Responsibility | Lines |
|------|---------------|-------|
| `Hero.ts` | Hero entity — movement, combat, vitals, HP bar, Jaq'eli the Bronze model | 287 |
| `HeroAbilities.ts` | 3 abilities — Lightning Strike (DoT), Stone Shield, Battle Cry | 166 |

## Towers
| File | Responsibility | Lines |
|------|---------------|-------|
| `Tower.ts` | Tower entity — attack logic, targeting, wall HP, boost system, upgrade/sell | 260 |
| `TowerConfigs.ts` | 5 tower configs: Archer, Catapult, Ballista, Wall, Boost | 50 |
| `TowerFactory.ts` | `createTower()` helper | 14 |
| `TowerMeshes.ts` | Mesh builders per tower type | 169 |

## Enemies
| File | Responsibility | Lines |
|------|---------------|-------|
| `Enemy.ts` | Enemy entity — path following, HP, wall attacks, death | 167 |
| `EnemyModels.ts` | Enemy model factory — creates rigged meshes per archetype | 43 |
| `EnemyBuilders.ts` | Geometry builders: createHumanoid, createWolf, createSiegeRam, createDevi | 295 |
| `EnemyAnimations.ts` | `animateRig()` — walk cycle, idle bob, wheel spin | 37 |

## Wave & Combat
| File | Responsibility | Lines |
|------|---------------|-------|
| `WaveManager.ts` | Wave spawning, build phase countdown, wave bonuses | 114 |
| `Projectile.ts` | Projectile pool, update, hit detection, splash | 203 |
| `Grid.ts` | 20×20 grid, A* path resolution, tower placement validation | 126 |
| `Effects.ts` | VFX: floating gold, hit flash, splash ring | 214 |

## Visuals
| File | Responsibility | Lines |
|------|---------------|-------|
| `CelShader.ts` | Toon material, outline pass, toon lighting setup | 185 |

## Screens & Data
| File | Responsibility | Lines |
|------|---------------|-------|
| `LevelSelect.ts` | Level select — Era 0 two-chapter layout, Era 1+ 5-level layout | 186 |
| `LevelSelectStyles.ts` | Level select CSS | 67 |
| `HistoricalPopup.ts` | Between-wave historical facts popup | 133 |
| `SaveManager.ts` | localStorage persistence — progress, stars, chapter/era unlocks | 215 |
| `historical_facts.ts` | 136 facts across 10 eras | 42 |

## Types & Config
| File | Responsibility | Lines |
|------|---------------|-------|
| `types.ts` | TypeScript interfaces, re-exports TOWER_CONFIGS | 67 |

## Data Files
| File | Format | Size |
|------|--------|------|
| `public/data/levels.json` | Compact JSON (1 level per line) | 293 KB / 202 lines |

---

*InputManager.ts (322) — pre-existing, exceeds limit but was not modified during Phase 2 refactor.
