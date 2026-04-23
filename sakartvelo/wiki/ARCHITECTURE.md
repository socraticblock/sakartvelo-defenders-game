# Architecture

## Overview

```
src/
├── main.ts                    # Entry point — scene setup, init, event wiring
├── GameState.ts               # Mutable singleton state (gold, lives, towers, enemies, etc.)
├── GameLoop.ts                # 14-step animate() loop, delegates to managers
├── InputManager.ts            # High-precision raycasting (document-level tracking)
├── UIManager.ts               # HUD coordination (gold/lives/wave/build HUD)
├── TowerPanel.ts              # Tower buttons, tower info panel (upgrade/sell)
├── ScreenManager.ts           # Screens: title, level select, tutorial, game-over, etc.
├── AudioManager.ts            # Narration, Web Speech API, cultural facts teleprompter
│
├── Hero.ts                    # Hero entity — movement, combat, HP bar, model
├── HeroAbilities.ts           # Hero ability system — activation, cooldowns, DoT, VFX
│
├── Tower.ts                   # Tower entity — attack logic, targeting, wall HP, boost
├── TowerConfigs.ts            # All tower configuration data (TOWER_CONFIGS)
├── TowerFactory.ts            # Tower creation helper
├── TowerMeshes.ts            # Mesh-building helpers per tower type
│
├── Enemy.ts                   # Enemy entity — path following, HP, attacks, death
├── EnemyModels.ts             # Enemy model factory
├── EnemyBuilders.ts           # Geometry builders for each enemy archetype
├── EnemyAnimations.ts        # Enemy rig animation logic
├── EnemyAI.ts                 # Enemy slow/wall-attack/death logic (from GameLoop)
│
├── WaveManager.ts             # Wave spawning, build phase countdown, bonuses
├── Projectile.ts              # Projectile pool, update, hit detection
├── Grid.ts                    # 20×20 grid, path resolution, tower placement
├── Effects.ts                 # Floating gold, hit flash, splash ring VFX
├── CelShader.ts               # Toon material, outline pass, toon lighting
│
├── LevelSelect.ts             # Level select screen (Era 0 two-chapter layout)
├── LevelSelectStyles.ts       # Level select CSS (extracted)
├── HistoricalPopup.ts          # Between-wave historical facts popup
├── SaveManager.ts             # localStorage persistence (progress, stars, unlocks)
├── historical_facts.ts         # 136 historical facts across 10 eras
│
├── types.ts                   # TypeScript types, re-exports TOWER_CONFIGS from TowerConfigs
└── main_old.ts                # DELETED — was 1,514 lines, replaced by modular architecture
```

## Key Design Patterns

### Singleton State (GameState.ts)
All mutable game state lives in `gs` — a singleton exported from `GameState.ts`. No other file holds mutable state.

```
gs.gold, gs.lives, gs.waveMgr, gs.towers[], gs.enemies[], gs.hero,
gs.grid, gs.selectedType, gs.selectedTower, gs.currentLevel, etc.
```

### One Responsibility Per File
Each file has exactly one job. If you can't name the file in one clear word, it probably has too many responsibilities.

### Pre-commit Hook (300-line limit)
`~/hermes-workspace/.git/hooks/pre-commit` blocks commits if any staged `.ts` file exceeds 300 lines.

### Data Files: Compact JSON
`public/data/levels.json` is stored **1 level per line** (not pretty-printed). ~202 lines total vs 30,852 lines pretty-printed.

## Game Loop (GameLoop.ts)

13 steps per frame:
1. `_updateHover` — delegate to InputManager
2. `_updateBuildPhase` — countdown, end build phase
3. `_updateWaveCountdown` — auto-start timer
4. `_updateSpawn` — WaveManager spawns enemies
5. `updateEnemySlow` — walls slow nearby enemies (→ EnemyAI.ts)
6. `_updateEnemies` — enemy movement
7. `updateEnemyWallAttacks` — enemies attack adjacent walls (→ EnemyAI.ts)
8. `_updateTowers` — tower targeting + firing
9. `_updateProjectiles` — projectile update + splash damage
10. `_updateHero` — hero movement + abilities
11. `_updateHeroBuilding` — progress builds when hero is in range
12. `updateEnemyDeaths` — gold rewards, death cleanup (→ EnemyAI.ts)
13. `updateEffects` — VFX billboard sprites
14. `_updateWallHpBillboards` — wall HP labels face camera
15. `_checkWaveComplete` — between-wave popup, final wave → game over

## Managers
- **InputManager** — single source of truth for mouse grid position; tracks `document` level pointer events to ensure precision over HTML UI.
- **UIManager** — HUD gold/lives/wave display + build phase UI
- **TowerPanel** — tower selection buttons + upgrade/sell panel
- **ScreenManager** — title, level select, tutorial, game-over, level-complete screens
- **AudioManager** — narration via Web Speech API, cultural facts teleprompter

## Architecture Decisions

### Why no class hierarchy for towers?
Towers have wildly different behaviors (archer shoots projectiles, wall has HP, boost applies buffs). Using a single `Tower` class with a `type` discriminator + switch statements is simpler than a deep class hierarchy for this game.

### Why separate EnemyAI from GameLoop?
EnemyAI was split from GameLoop because GameLoop was 352 lines. Now GameLoop is 213 lines and focuses purely on loop orchestration.

### Why HeroAbilities separate from Hero?
Hero was 484 lines. Ability logic (~166 lines) was split into `HeroAbilities.ts`. Hero.ts is now 287 lines.

### Why EnemyBuilders + EnemyAnimations + EnemyModels?
`EnemyModels.ts` was 398 lines. Geometry builders (~295 lines) went to `EnemyBuilders.ts`. Animation logic (37 lines) went to `EnemyAnimations.ts`. `EnemyModels.ts` now just exports the factory.
