# Level 1 — Master design spec (from full v5 Bible)

**Purpose:** Design **one** Era 0 mission that satisfies the Bible’s vertical slice **and** every rule that applies to *early* maps—so levels 2–20 copy the same **structure** without re-reading 3,000 lines.

**Sources:** `sakartvelo/wiki/GAME_BIBLE.md` (canonical v5) · current repo (`levels.json`, `Grid.ts`, `BalanceConfig.ts`)

**Companion docs:** Playtest gate → [LEVEL-1-CHECKLIST.md](./LEVEL-1-CHECKLIST.md) · Implementation status → [level-1-template.md](./level-1-template.md)

---

## 1. How to use this document

| Phase | Action |
|-------|--------|
| **Design** | Fill §4–§8 (map, waves, economy, presentation). Lock §3 decisions. |
| **Build** | Implement gaps in §9 (engine + data). |
| **Prove** | Run [LEVEL-1-CHECKLIST.md](./LEVEL-1-CHECKLIST.md). |
| **Clone** | Copy §10 JSON template → change only §11 “swap per level” fields. |

**Rule:** Level 1 is the **golden template**. Levels 2+ use `era0_standard_level` (§10). Only special tutorials get `full_field`.

---

## 2. Bible → Level 1 requirement matrix

### 2.1 MUST (blocking — slice + early-map law)

These are non-negotiable for Level 1 and every cloned Era 0 early level.

| Bible | Requirement | Level 1 design target |
|-------|-------------|------------------------|
| **§31.1** | Landscape-only battle | Landscape lock; 16:9-first HUD |
| **§31.1** | One polished Era 0 map | Theme `golden_river`, Rioni / Colchis fantasy |
| **§31.1** | Hero-builder + build circle + 10% slow-mo | Full §7.2 flow |
| **§31.1** | Archer, catapult, wall | Only these three on plinths |
| **§31.1** | Militia + Stonefall *or* Amirani | **Militia + Stonefall** (Amirani = later era content) |
| **§31.1** | 5–8 waves | **6 waves** (teach cadence without fatigue) |
| **§31.1** | Lane offsets / formations | Every spawn group has `formation`; wide path visually |
| **§31.1** | One flying wave | Wave 5 |
| **§31.1** | One mini-boss | Wave 6, `devi_chief` |
| **§31.1** | Victory/defeat, 3★, historical card | Lives-based stars + `historical_fact` |
| **§31.1** | Small Academy + Hero Training upgrade | Post-victory pick (slice stubs OK) |
| **§2.2** | Hero required for build/upgrade; cancel on move; dead = no build | As implemented |
| **§2.3** | Plinths only; wall slots only; walls don’t break path | 6 plinths, 2 wall slots |
| **§2.4** | No eternal single-file; flying readable | Formations + elevated flyers |
| **§2.5** | Early map mostly on screen; 1 entrance, 1 exit | **Diorama framing** (§4) |
| **§3.2** | Select → build phase → waves → rewards → upgrades | Route map `e0_l1` → battle → map return |
| **§17.2** | Early: 4–7 plinths, simple waves | 6 plinths, 6 waves |
| **§17.5** | Plinths at bends, choke, backup; not all perfect spots | Author waypoints + `build_nodes` to match |
| **§17.6** | Walls at choke / bridge / gate | 2 slots at path bends |
| **§6** | KR edge UI; battlefield center clear | HUD audit per checklist |
| **§13.3** | Wide path lanes + lateral offsets | Path width + `loose`/`wide`/`column` |
| **§18.2** | Era 0: rivers, gold, myth, Medea | Copy + briefing in `CampaignBriefings.ts` |

### 2.2 SHOULD (Level 1 polish before cloning)

Not in §31.1 checklist, but Bible expects them for “Kingdom Rush readability” and §31.2 feel.

| Bible | Requirement | Level 1 action |
|-------|-------------|----------------|
| **§1.1 / §23.1** | Historical **diorama**, not empty sandbox | Frame playable area; cliff/forest/mountain rim |
| **§5.5** | Camera bounds — no empty off-map void | Crop camera to logic grid + skirt; or use `board` |
| **§5.5** | Early map fits mostly on screen | Tighter zoom than current full-field pull-back |
| **§2.4 / §13.3** | Path wide enough for formations to read | Bump `pathWidth` (engine); test wave 2 & 5 |
| **§5.4** | x1 / x2 / x3 speed | Add when pacing still slow *after* framing fix |
| **§6.3** | Build circle on-screen; wave preview clear | Clamp UI; inbound preview readable |
| **§7.7** | Hero at tower for upgrade | Keep; teach on wave 3–4 |
| **§16.1** | Boss fair, telegraphed | Boss HP UI + escort wave, no surprise one-shots |
| **§15.3** | Militia = delay, not win button | Cooldown + weak vs siege/boss/flying |
| **§25** | Educational respect | Historical card + briefing accuracy note |
| **§31.2** | Hero fun, build natural, groups not train, meaningful choices | Playtest §31.2 qualitatively |

### 2.3 STUB (prove progression fantasy — not full systems)

| Bible | Full vision | Level 1 stub |
|-------|-------------|--------------|
| **§9** Hero Training | Full trees per hero | One win pick: build speed +5% |
| **§11** Tower Academy | Branching mastery | One win pick: archer damage +5% |
| **§12.2** | 2–3 map power loadout | Fixed: Militia + Stonefall only |
| **§8.4** Medea abilities | Poison, remedy, alchemy | **Minimum:** move + fight + build; abilities optional for slice |

### 2.4 NOT Level 1 (clone template must not assume these)

| Bible | Why wait |
|-------|----------|
| **§17.4** Multi-entrance over time | Phase 4 roadmap |
| **§13.4** `pathId` per wave | Same |
| **§7.5** Assistant builders | Academy late / Phase 5 |
| **§11** Full Academy UI | Phase 5 |
| **§9** Full Hero Training UI | Phase 6 |
| **§12.5+** Amirani, Didgori horn, etc. | Content after core two powers work |
| **§10.3+** Shrine, cavalry outpost, gunpowder… | Later eras |
| **§13.5** Traits (armored, hidden…) | Introduce slowly per era |
| **§16.2** Boss opens gate mid-level | Boss level 8+ content |
| **§20** Scroll loadout | Phase 8 |
| **§26–29** PvP, blockchain, seasons | Phase 10+ |

---

## 3. Locked product decisions (design authority)

Change only with intent.

| # | Decision | Value | Bible |
|---|----------|-------|-------|
| D1 | Campaign entry | Route map node `e0_l1` → Play; optional Read more | §3.2 |
| D2 | Level 1 presentation | **`full_field` tutorial** OR **`board` KR-style** — **pick one in §4.1** | §17.2, §5.5 |
| D3 | Clone template (Lv 2+) | `board`, **12×16**, landscape rotation at load | §17.2 early |
| D4 | Hero | Medea only | §18.2 |
| D5 | Map powers | Call Militia + Stonefall (2 slots) | §31.1, §12.4 |
| D6 | Towers | Archer, catapult, wall | §31.1, §10.2 |
| D7 | Stars | 1★ survive; 2★ ≥50% lives; 3★ ≥80% lives | §19.2 (simplified) |

---

## 4. Map design (Level 1)

### 4.1 Presentation — choose before art pass

**Option A — Framed `full_field` (recommended if keeping tutorial wow)**  
- Logic grid: **18×10** (gameplay).  
- Visual skirt: smaller than today OR same 34×19 but **camera never shows full void**.  
- Engine: perimeter cliffs/forest (`createTerrainEdges` or denser `createFullFieldDecorations`).  
- Matches: diorama pillar (§23.1), early on-screen (§17.2).

**Option B — `board` (recommended if KR parity is top priority)**  
- **12×16** → rotated to landscape in loader.  
- Built-in cliff rim (`createTerrainEdges`).  
- Level 1 looks like level 2+ → **simplest clone path**.

**Do not:** Show huge empty sand with a thin path (violates §2.5, §5.5, §32.2).

### 4.2 Topology (early map — §17.2)

| Element | Level 1 spec |
|---------|----------------|
| Entrances | **1** (path start west/off-map) |
| Exit / objective | **1** — `defense_target`: Rioni settlement gate |
| Build plinths | **6** — mix pre-choke, at bend, backup |
| Wall slots | **2** — choke / bend (not everywhere) |
| Paths | **1** ground path; flying uses same path elevated |
| Hero space | Open cells beside path; not blocked by props |
| Clutter | Low — readability > decoration (§17.1) |

### 4.3 Path & lanes (§2.4, §13.3)

| Knob | Owner | Level 1 target |
|------|--------|----------------|
| Path ribbon width | `Grid.ts` `pathWidth` | **~1.35–1.45** on tutorial (test from 1.15) |
| Spawn formation | `levels.json` per group | infantry `loose`/`wide`; siege `column`; boss `line` + escorts `wide` |
| Lane offsets | `Enemy.ts` | Already derived from formation — **data must use formations** |
| Flying | Wave 5 | Elevated + shadow; forces archer or positioning |

**Design note:** Bible does not require three hard-coded lane tracks. It requires **visible spread** across a **wide enough** road.

### 4.4 Plinth placement checklist (§17.5)

When placing `build_nodes` in grid coords:

- [ ] At least one plinth **before** first choke.  
- [ ] At least one **on** a bend with line of sight.  
- [ ] At least one **after** choke (backup).  
- [ ] Not all in “obvious best” spots.  
- [ ] None under bottom HUD / behind tall props.  
- [ ] Hero can path to each plinth without awkward corners.

### 4.5 Theme & narrative (§18.2, §25)

| Field | Value |
|-------|--------|
| `theme` | `golden_river` |
| `name` | Gold Streams of the Rioni |
| `historical_fact` | Rioni / Phasis, Colchis, gold, Vani (already in JSON) |
| Briefing | `CampaignBriefings` level 1 — tutorial + accuracy note |
| Boss fantasy | Devi chief / Colchian myth (not historical commander) |

---

## 5. Wave design (6 waves)

Teach threats in order. Clone levels swap types/counts, keep **structure**.

| Wave | Teaching goal | Enemy mix (example — tune in JSON) | Formation notes |
|------|---------------|-----------------------------------|-----------------|
| 1 | Basics, first build | Infantry only, low pressure | `loose` |
| 2 | Density / groups | More infantry | `wide` |
| 3 | Armor + wall lesson | Infantry + siege | infantry `loose`, siege `column` |
| 4 | Speed threat | Cavalry | `wide` |
| 5 | Anti-air | Flying + infantry | flying `wide`, infantry `loose` |
| 6 | Boss spike | Boss + escorts | boss `line`, infantry `wide` |

**Rules:**  
- `total_waves` = 6.  
- Build phase between each (§3.2).  
- Early wave start bonus (§5.1 horn).  
- Preview shows next wave icons (§6.3).

---

## 6. Economy & towers

| Field | Level 1 starting point | Clone guidance |
|-------|------------------------|----------------|
| `starting_gold` | 360 (tune after framing) | Scale ±10% per difficulty |
| `starting_lives` | 20 | Keep 20 early Era 0 |
| Wave gold | Kill rewards + wave bonus + early start | Same formulas |
| Tower costs | `TowerConfigs` | Don’t per-level unless challenge |

**In-battle:** 3 tower levels per family (§10.4) — verify catapult/archer/wall upgrades feel meaningful by wave 4.

**Walls:** Only on `wall_nodes`; flying wave ignores (§14).

---

## 7. Hero, powers, meta

### 7.1 Medea (§8.4 Era 0)

| Role | Slice minimum | Full Bible later |
|------|---------------|------------------|
| Builder | Required | — |
| Fighter | Basic attack | — |
| Commander | — | Poison, remedy, alchemy abilities |
| Upgrade at tower | Hero runs to tower | — |

### 7.2 Map powers (§12)

| Power | Role in Level 1 |
|-------|-----------------|
| Call Militia | Emergency block; teach on leak or wave 4 preview |
| Stonefall | Area damage; teach vs groups / siege |

Loadout slots: **2** (no third slot, no loadout screen).

### 7.3 After victory (§31.1, §19)

| Reward | Implementation |
|--------|----------------|
| Stars | Save per `era0_level1` |
| Historical card | Victory UI + `historical_fact` |
| Training pick | `archer_damage_5` **or** `hero_build_speed_5` (one-time slice) |

Return to **campaign map**, not auto-chain level 2 (journey-first).

---

## 8. HUD & controls (§5–§6)

Verify on phone landscape:

| Zone | Content |
|------|---------|
| Top left | Lives, gold, wave |
| Top right | Pause, zoom (speed when added) |
| Left | Hero portrait / HP |
| Bottom left | Map powers |
| Bottom center | Build circle / tower bar when plinth active |
| Bottom | Historical ticker optional |

**Slow-mo when:** build circle, stonefall targeting (§5.3).

---

## 9. Gap list — Bible vs repo today

Use this as the **build backlog** for Level 1 design completion.

| Gap | Priority | Owner |
|-----|----------|--------|
| Diorama framing / no void | **P0** | `main.ts` camera + `Grid.ts` edges |
| Wider path ribbon | **P0** | `Grid.ts` |
| x2 / x3 combat speed | P1 | `UIManager` / `GameLoop` |
| Build circle clamp at screen edge | P1 | Build UI |
| Medea abilities (beyond move/fight) | P2 | Hero — not slice blocker |
| Real Academy screen | P3 | Phase 5 |
| Real Hero Training screen | P3 | Phase 6 |
| `pathId` multi-path | Later | Phase 4 |

**Already meets Bible for slice:** hero-builder loop, six waves, formations data, flying, boss, stars, powers, three towers, campaign node.

---

## 10. JSON clone template — `era0_standard_level`

Every cloned level (2–20) shares this **schema**. Level 1 adds `vertical_slice` + optional `full_field` fields.

### 10.1 Required fields (all levels)

```json
{
  "era": 0,
  "level": 2,
  "name": "string",
  "starting_gold": 140,
  "starting_lives": 20,
  "total_waves": 5,
  "grid_width": 12,
  "grid_height": 16,
  "path_waypoints": [[x, y], ...],
  "waves": [
    {
      "wave_num": 1,
      "enemies": [
        {
          "type": "infantry|cavalry|siege|flying|boss",
          "count": 10,
          "hp_mult": 1.0,
          "speed_mult": 1.0,
          "spawn_interval": 0.9,
          "formation": "loose|wide|column|line"
        }
      ]
    }
  ],
  "historical_fact": "string",
  "boss": null,
  "build_nodes": [[x, y], ...],
  "theme": "golden_river",
  "defense_target": "string",
  "wall_nodes": []
}
```

### 10.2 Level 1 only (golden template)

```json
{
  "map_presentation": "full_field",
  "visual_width": 34,
  "visual_height": 19,
  "visual_offset_x": 0,
  "visual_offset_y": 0,
  "vertical_slice": {
    "role": "golden_template",
    "bible_ref": "31.1",
    "campaign_node_id": "e0_l1",
    "presentation": "full_field_tutorial",
    "clone_template_id": "era0_board_12x16"
  },
  "boss": { "id": "devi_chief", "type": "boss", "hp_mult": 0.68, "speed_mult": 0.82 }
}
```

### 10.3 Cloned level marker

```json
"vertical_slice": {
  "role": "clone_of_golden_template",
  "bible_ref": "31.1",
  "presentation": "board_standard",
  "clone_template_id": "era0_board_12x16"
}
```

### 10.4 Per-level swap checklist (authoring)

When making level N from template:

1. `level`, `name`, `historical_fact`, `defense_target`  
2. `path_waypoints` — new puzzle shape, same readability rules (§17)  
3. `build_nodes` / `wall_nodes` — re-run §4.4 checklist  
4. `waves` — new mix; keep formation keys  
5. `boss` — null until boss levels; then boss object + finale wave  
6. `starting_gold`, `total_waves` (5–8 early era)  
7. `theme` / `imageUrl` if art differs  
8. Campaign node in `LevelSelect.ts` + `CampaignBriefings.ts`  

**Never swap without team agreement:** `map_presentation`, camera rules, engine `pathWidth`, hero-builder rules.

---

## 11. Clone workflow (levels 2–5 first)

```text
Lock Level 1 design (this doc §4–§8)
    → Close §9 P0 gaps (frame + path width)
    → LEVEL-1-CHECKLIST all Phase 1
    → Duplicate era0_standard_level → level 2
    → Change only §10.4 swap fields
    → One playtest: “same game, new puzzle?”
    → Repeat for 3, 4, 5
    → Then roadmap Phase 2–5 systems
```

---

## 12. Locked decisions (2025-05-21)

| ID | Decision | Engine / data |
|----|----------|----------------|
| Q1 | **Framed `full_field`** for Level 1 only; levels 2+ stay `board` | `MAP_PRESENTATION_BALANCE` in `BalanceConfig.ts`; camera/pan in `main.ts` / `InputManager.ts` |
| Q2 | Path **1.40** (`full_field`), **1.25** (`board`) | `Grid.ts` `createPathRibbon` |
| Q3 | **All Medea abilities** on HUD; tutorial teaches Q/W/E | No gating; optional wave-5 flyer hint in tutorial |
| Q4 | **Lives-only stars** (≥80% / ≥50%) | `GameState.getStars` unchanged |
| Q5 | **`starting_gold`: 360** until playtest; tune to 300–320 only if tight | `levels.json` level 1 |

---

## 13. Sign-off

| Role | Level 1 design locked | Date |
|------|------------------------|------|
| Design | ☐ | |
| Playtest | ☐ Checklist Phase 1 | |
| Ready to clone L2 | ☐ Checklist Phase 2 | |

---

*This spec subsumes the feature list in [level-1-template.md](./level-1-template.md) with full-Bible context. Update both when decisions in §12 are locked.*
