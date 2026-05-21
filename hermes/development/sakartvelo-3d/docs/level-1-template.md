# Level 1 — Golden Template (Bible §31.1)

**Design from the full Bible:** [level-1-design-spec.md](./level-1-design-spec.md) (requirements matrix, map/wave design, clone JSON template, gaps).

This file is the **implementation status snapshot** for the v5 vertical slice. It is not “Era 0 complete.”

**North star:** [GAME_BIBLE.md §31](../../../../sakartvelo/wiki/GAME_BIBLE.md) (First Playable v5 Vertical Slice).  
**Implementation tuning:** [v5-vertical-slice-spec.md](./v5-vertical-slice-spec.md).  
**Playtest checklist:** [LEVEL-1-CHECKLIST.md](./LEVEL-1-CHECKLIST.md).

---

## Locked decisions (engine)

| Knob | Value | File |
|------|-------|------|
| Level 1 presentation | Framed `full_field` | `MAP_PRESENTATION_BALANCE` |
| Path width | 1.40 / 1.25 | `BalanceConfig.ts` → `Grid.ts` |
| Playable skirt | 2 cells | Camera + pan bounds |
| Starting gold | 360 (playtest) | `levels.json` |

Full matrix: [level-1-design-spec.md §12](./level-1-design-spec.md).

## Repo decisions (locked)

These resolve the two tensions called out in planning; change only deliberately.

| Topic | Decision | Rationale |
|-------|----------|-----------|
| **Campaign entry** | **Route map** (`LevelSelect.ts` → node `e0_l1` → Play) | Bible §3.2 loop is select → build → combat → rewards. The compact 8-node Era 0 route map is the quick-start journey; optional “Read more” is briefing, not a separate product. |
| **Level 1 battlefield** | **`full_field`** tutorial presentation | Only Level 1 uses `map_presentation: "full_field"` with enlarged visual bounds (34×19 over an 18×10 logic grid). Wow-first impression; not the clone template. |
| **Levels 2–20 template** | **`board`** + **12×16** data (rotated to landscape at load) | Same camera/presentation rules everywhere except special tutorial levels. Do not re-tune camera per level. |
| **Scope** | **One polished mission**, not 20 levels | Bible §31.1 is a vertical slice, not full Era 0. |

---

## Bible §31.1 → Level 1 mapping

| Bible requirement | Level 1 spec (`levels.json` + code) | Status |
|-------------------|-------------------------------------|--------|
| Landscape-only battle | Enforced in client; Level 1 grid 18×10 (already wide) | Implemented |
| One polished Era 0 map | `era: 0`, `level: 1`, theme `golden_river` | Implemented |
| Hero-builder construction | Plinth tap → build circle → hero run → build timer | Implemented |
| Build circle + 10% slow-mo | `V5_SLICE_BALANCE.tacticalSlowMotionScale` = 0.1 | Implemented |
| Archer, catapult, wall | `GameState` unlock set for slice | Implemented |
| Militia map power | Call Militia (`FRIENDLY_INFANTRY_BALANCE`) | Implemented |
| Stonefall **or** Fire of Amirani | **Stonefall** (targeted); Amirani deferred | Implemented (one power) |
| 5–8 waves | **6 waves** (`total_waves: 6`) | Implemented |
| Enemy lane offsets | `formation` on spawns → `Enemy.computeLaneOffset` | Implemented |
| One flying wave | Wave 5: `flying` + infantry | Implemented |
| One mini-boss | Wave 6: `boss` (`devi_chief`) + escorts | Implemented |
| Victory / defeat | `ScreenManager` level complete / game over | Implemented |
| 3-star rating | Lives ratio ≥80% / ≥50% (`GameState.getStars`) | Implemented |
| One historical card | `historical_fact` + victory UI | Implemented |
| Small Academy upgrade | Victory choice: `archer_damage_5` (+5% archer) | Slice stub |
| Hero training upgrade | Victory choice: `hero_build_speed_5` (+5% build speed) | Slice stub |

---

## Level 1 data contract (`public/data/levels.json`)

**Identity**

- `era`: 0, `level`: 1  
- `name`: Gold Streams of the Rioni  
- `vertical_slice.role`: `golden_template`  
- `vertical_slice.campaign_node_id`: `e0_l1`  
- `vertical_slice.clone_template_id`: `era0_board_12x16` (for levels 2+)

**Economy & waves**

- `starting_gold`: 360, `starting_lives`: 20  
- `total_waves`: 6  
- Wave script: infantry pressure → mixed siege → cavalry → **flying** → **boss finale**

**Map layout**

| Field | Level 1 | Levels 2–5 (clone template) |
|-------|---------|-----------------------------|
| `grid_width` × `grid_height` | 18 × 10 | 12 × 16 (loader rotates to landscape) |
| `map_presentation` | `full_field` | `board` (omit = board) |
| `visual_width` × `visual_height` | 34 × 19 | omit |
| `build_nodes` | 6 plinths | 4–6 plinths, same placement rules |
| `wall_nodes` | 2 fixed wall slots | optional per mission |
| `theme` | `golden_river` | per level (`golden_river`, etc.) |

**Wave formations (lane spread)**

Use `formation` on every group: `loose`, `wide`, `column`, or `line`. Defaults exist in `WaveManager` but explicit data reads better on the battlefield.

**Boss**

- `boss.id`: `devi_chief`  
- Final wave: 1× boss + infantry escort  

---

## Core loop (must pass before cloning)

1. Tap **build plinth** → build circle opens at **10% time scale**.  
2. Pick tower → circle closes, hero **runs** to plinth, tower builds in range.  
3. **Move hero** before build completes → cancel intent.  
4. **Dead hero** → no normal build/upgrade.  
5. **Readability** — path, plinths, enemies, HUD not obscuring the fight.  
6. **Pacing** — speed control, early wave start bonus, no endless walking on tutorial field.  
7. **Flying wave** — player needs anti-air (archer) or clear air-lane telegraph.  
8. **Stars + historical card** — match `name` / `historical_fact`.  

Tuning constants live in `BalanceConfig.ts` (`V5_SLICE_BALANCE`, `HERO_BALANCE`).

---

## Clone pattern (levels 2–5)

Copy **structure**, swap **content**:

```text
Same: map_presentation "board", grid 12×16, theme field, build-phase loop, formation keys
Swap: path_waypoints, waves, boss, build_nodes, historical_fact, starting_gold
Never: full_field unless level is explicitly marked special tutorial
```

Add to cloned levels when authoring:

```json
"vertical_slice": {
  "role": "clone_of_golden_template",
  "bible_ref": "31.1",
  "presentation": "board_standard",
  "clone_template_id": "era0_board_12x16"
}
```

---

## What this is NOT

Do not block Level 2–20 polish on Level 1, and do not block Level 1 on:

- Full 20-level Era 0  
- Full hero roster (Bible §8.4)  
- Full Academy / Hero Training trees  
- Multi-entrance maps, PvP, blockchain, survival (Bible Phase 10+)  

---

## Workflow

```text
Bible §31.1 (rules)
    → Level 1 golden template (this doc + levels.json)
    → Playtest LEVEL-1-CHECKLIST.md
    → Extract era0_board_12x16 → levels 2–5
    → Systems: formations polish, multi-path, Academy/Hero Training prototypes
    → Scale remaining Era 0, then other eras
```

---

## Related files

| File | Purpose |
|------|---------|
| `public/data/levels.json` | Level 1 mission data + `vertical_slice` meta |
| `src/LevelSelect.ts` | Route map node `e0_l1` → level 1 |
| `src/CampaignBriefings.ts` | Briefing copy for level 1 |
| `src/BalanceConfig.ts` | Slice tuning knobs |
| `docs/v5-vertical-slice-spec.md` | Engineering scope & tradeoffs |
