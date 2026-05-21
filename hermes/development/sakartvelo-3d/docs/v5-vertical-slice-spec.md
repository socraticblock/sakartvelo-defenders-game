# Sakartvelo Defenders v5 Vertical Slice

**Level 1 golden template (authoring + playtest):** [level-1-template.md](./level-1-template.md) · [LEVEL-1-CHECKLIST.md](./LEVEL-1-CHECKLIST.md)

## Implemented Scope

- One playable Era 0 level: **Gold Streams of the Rioni**.
- Landscape-first battlefield with a single readable ground path, six build plinths, and two fixed wall slots.
- Hero-builder construction remains the core rule: the hero must reach the build site before a tower appears.
- Tactical slow motion is used for build choices and targeted Stonefall.
- Towers in scope: Archer, Catapult, Wall.
- Enemies in scope: Light Infantry, Fast Raider, Armored Brute, Flying Enemy, Mini-Boss.
- Six waves: basic infantry, clustered infantry, mixed brute pressure, fast raiders, flying enemies, and mini-boss finale.
- Map powers in scope: Call Militia and Stonefall.
- Victory/defeat flow, 1-3 stars, one historical card, and a tiny local upgrade choice.

## Map presentation (Level 1 golden template)

- Level 1: `full_field` **diorama** — ground mesh is playable 18×10 + 2-cell skirt only (22×14), cliff ring, dense forest perimeter, stronger fog; not a 34×19 void.
- Levels 2+: `board` 12×16 (standard clone template).
- `fullFieldPathWidth`: **1.40** · `boardPathWidth`: **1.25** · `fullFieldFramingScale`: **1.0**
- Lane offsets scale with path width (`pathWidth / 1.15`).
- Combat speed: HUD **1x / 2x** (`btn-combat-speed`); tactical slow-mo overrides build circle / stonefall / tower pick.

## Tuning Constants

- `tacticalSlowMotionScale`: `0.1`
- `heroMoveSpeed`: `4.2`
- `heroBuildRange`: `1.65`
- `basicTowerBuildTime`: `1.25s`
- `dragThresholdPx`: `10`
- `touchDragThresholdPx`: `12`
- `stonefallCooldown`: `26s`
- `stonefallRadius`: `1.85`
- `stonefallDamage`: `125`
- `callMilitiaCooldown`: `24s`
- `archerDamageUpgrade`: `+5%`
- `heroBuildSpeedUpgrade`: `+5%`

## Known Tradeoffs

- The slice uses existing procedural/stylized assets instead of final Meshy/GLB production art.
- Call Militia is a cooldown map power spawned along the path, not a fully targeted placement power yet.
- Stonefall has targeted damage feedback, but its targeting preview is intentionally minimal.
- The tiny upgrade loop is local-storage based and deliberately not the full Academy or Hero Training tree.

## Intentionally Not Implemented

- PvP, seasons, marketplace, blockchain logic, SAKART economy, scroll crafting, full Academy, full Hero Training, full codex, and the ten-era campaign.
- Multi-entrance maps and boss path-changing events.
- Final asset pipeline or production-quality historical art.

## Slice Success Test

The slice should prove that moving Medea to build feels like commanding the battlefield, not waiting on busywork. Build timing is short, build range is forgiving, map powers provide emergency response, and the level is beatable without consumables.
