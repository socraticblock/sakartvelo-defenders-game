# Level 1 vertical slice — playtest checklist

Use after each meaningful change to Level 1 or hero-builder systems. **All boxes must pass** before treating Level 1 as frozen and cloning levels 2–5.

**Engine (2025-05-21):** framed `full_field` camera, playable perimeter cliffs, path width 1.40, 1x/2x combat speed, lane scale — verify in-game below.

Spec: [level-1-design-spec.md](./level-1-design-spec.md) · Status: [level-1-template.md](./level-1-template.md) · Bible §31.2 success criteria.

---

## Phase 1 — Golden template (Level 1 only)

### Hero-builder loop

- [ ok] Tap plinth → build circle opens immediately
- [ok ] Time scale drops to ~10% while circle is open
- [ ] Select tower → circle closes, hero runs to plinth, tower appears after build timer
- [ok ] Move hero away before build finishes → pending build cancelled
- [ ok] Dead hero cannot build or upgrade towers

### Readability & pacing

- [ok ] Path, plinths, and exit are obvious in landscape without hunting
- [ok ] HUD does not hide critical choke points or the hero
- [ ok] Speed controls work; early “Start Wave” bonus feels fair
- [ok ] No excessive dead time crossing the tutorial field (full_field)

### Combat content (Bible §31.1)

- [ok ] Archer, catapult, and wall all buildable and useful
- [ ok] Call Militia spawns and fights (cooldown respected)
- [ok ] Stonefall damages enemies in target area
- [ok ] Enemies read as **groups** (formations / lane offset), not a single file
- [ok ] Flying wave (wave 5) requires a deliberate answer (archer / positioning)
- [ ] Mini-boss wave (wave 6) is a noticeable spike, beatable without consumables

### Meta

- [ ] Victory and defeat screens work
- [ ] 1–3 stars reflect lives lost (≥80% / ≥50% thresholds)
- [ ] Historical card text matches level name / fact
- [ ] Post-victory training pick: Archer +5% **or** Hero build speed +5% (slice upgrades)

### Campaign entry

- [ ] Route map node `e0_l1` → Play launches this level
- [ ] After victory, return to map (not forced straight into level 2 unless player chooses)

---

## Bible §31.2 — slice success (qualitative)

- [ ] Moving Medea feels responsive and fun
- [ ] Building through the hero feels natural, not annoying
- [ ] Map readable at a glance in landscape
- [ ] Meaningful choices each wave (where to build, when to spend powers)
- [ ] Beatable without paid consumables
- [ ] Upgrades make you want one more run

---

## Phase 2 — Ready to clone (levels 2–5)

Only after **all Phase 1** boxes are checked:

- [ ] `era0_board_12x16` documented: `board`, 12×16, no `full_field` unless special
- [ ] Level 2 sample playtested with **same** camera feel as Level 3+ (no per-level camera hacks)
- [ ] Wave/boss/historical_fact swapped; core loop unchanged

---

## Sign-off

| Date | Tester | Phase 1 | Notes |
|------|--------|---------|-------|
|      |        | ☐ Pass  |       |
