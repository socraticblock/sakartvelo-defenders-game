# Sakartvelo Defenders v5.0

## Hero-Builder Tower Defense Bible

**Landscape-only 3D tower defense • Georgian history • deep progression • map powers • scroll mastery • invisible Web3 ownership**

**Status:** Canonical source-of-truth replacement for the previous v4 game bible and outdated art-production assumptions.

**Intended use:** This document replaces the old Game Design Bible. Future design, code, art, economy, progression, and roadmap work should use this v5 bible unless a newer numbered bible replaces it.

---

# 0. Executive Summary

Sakartvelo Defenders is a landscape-only 3D hero-builder tower defense game set across the history of Georgia, known to Georgians as Sakartvelo. The player defends Georgian lands across ten chronological eras, from Ancient Colchis through modern Georgia. The game combines crafted tower defense maps, direct hero command, fixed construction sites, tactical map powers, deep outside-battle upgrades, scroll mastery, and invisible blockchain-backed ownership.

The most important design pivot in v5 is that the hero is not merely a combat unit. The hero is the builder, commander, emergency responder, and emotional center of the battlefield. Towers do not simply appear when the player taps a build spot. Instead, the player taps a construction plinth, the build circle opens immediately in tactical slow motion, the hero runs toward the plinth, and the selected tower is constructed when the hero arrives. If the player moves the hero away before construction begins or finishes, the build intent is cancelled. If the hero is dead, the player cannot build or upgrade unless later progression unlocks assistant builders.

The second major pivot is that the whole game is landscape-only. The player should never be asked to rotate between portrait and landscape. Battles, map selection, hero screens, academy upgrades, scroll loadouts, inventory, marketplace, settings, and victory screens all live inside a horizontal game experience.

The third major pivot is that the project is now a real-time 3D/WebGL game using stylized assets, not a strict Blender-to-2D-sprite Godot pipeline. Meshy AI from pictures can be part of the production workflow. The new art pipeline is: image reference and historical research → Meshy AI 3D generation or manual modeling → cleanup and optimization → GLB/game-ready asset → Three.js/WebGL implementation → style and performance validation.

The fourth major pivot is that one-time paid consumables are not the core monetization or progression loop. The game should not pressure players to spend valuable currency on disposable battle items. Instead, the fun should come from permanent and semi-permanent buildcraft: Hero Training, Tower Academy upgrades, Map Power progression, Mastery Scroll loadouts, skins, cosmetics, challenge modes, and carefully controlled SAKART sinks.

The target feeling is:

> Kingdom Rush-level readability and battlefield clarity, with a more active hero-builder core, deeper outside-game progression, Georgian historical identity, and modern 3D presentation.

---

# 1. Vision

## 1.1 Core Vision

Sakartvelo Defenders is a premium-feeling tower defense game about defending the story of Georgia. It should be fun first, historically respectful second, and blockchain-powered silently in the background third.

The game should feel like a beautiful historical battlefield diorama that comes alive. The player sees mountain passes, fortified monasteries, ancient rivers, golden-age castles, ruined villages, stone towers, Soviet-era concrete, modern checkpoints, and mythological creatures inspired by Georgian folklore. Enemies advance through readable roads and wide path lanes. The hero moves directly under the player’s command. Towers are built by the hero, not placed magically. Map powers give the player dramatic tactical choices. Permanent upgrades create long-term strategy.

The game should never feel like a generic crypto product. Wallets, NFTs, tokens, and marketplace features exist only where they add ownership, economy, or progression value. A player who only wants to play the campaign should experience a polished tower defense game without needing to understand blockchain.

## 1.2 Design Pillars

### Pillar 1 — Hero-Builder Gameplay

The hero is the core differentiator. The player does not only place towers; the player directs a historical or mythological hero around the battlefield. The hero fights, builds, upgrades, reinforces weak points, activates abilities, and changes the shape of battle.

The core rule:

> No active hero means no normal building or upgrading.

This makes hero positioning meaningful. A hero cannot be treated as a passive bonus. The player must decide whether to send the hero to a choke point, a construction plinth, a tower upgrade, a leaking lane, a boss, or a future threat.

### Pillar 2 — Landscape-Only Battlefields

The whole game is designed for horizontal play. Landscape orientation gives enough room for winding paths, multiple entrances, tactical choke points, hero movement, large bosses, map powers, and beautiful historical backdrops. The player should not rotate the phone between menus and battles.

### Pillar 3 — Readable Strategic Maps

Every map must be readable at a glance. The player must understand where enemies enter, where they exit, where build spots are, which lanes are dangerous, what the hero is doing, and which towers are active. Beautiful art is important, but gameplay readability is more important.

### Pillar 4 — Deep Outside-Battle Progression

The game should have a rich long-term progression layer. The player should constantly unlock new strategic options: towers, tower upgrades, hero training nodes, map powers, scrolls, mastery effects, skins, and challenge modes. The outside-game progression should feel like a journey of discovery.

The inspiration is not to copy Path of Exile’s complexity directly, but to capture the fun of choosing a build direction, experimenting, and discovering powerful combinations.

### Pillar 5 — Historical Identity

Sakartvelo Defenders exists because Georgian history is underrepresented and dramatically suited to strategy gameplay. The game spans ten chronological eras. The progression through history should make players feel that they are moving through a real national story: ancient kingdoms, Christianization, invasion, golden age, catastrophe, imperial pressure, democratic struggle, Soviet repression, and modern resilience.

### Pillar 6 — Invisible Web3 Ownership

Blockchain features should be real but quiet. SAKART, skins, mastery scrolls, and marketplace systems should never interrupt the fun. The player should not feel forced to connect a wallet to enjoy the campaign. Blockchain exists to provide ownership, trading, scarcity, and token sinks, not to make the basic game worse.

---

# 2. Non-Negotiable v5 Rules

These rules define the v5 identity and should not be changed lightly.

## 2.1 Platform and Orientation Rules

1. The game is landscape-only.
2. The player should not be forced to rotate the phone between portrait and landscape.
3. All major screens must work in landscape: title, campaign map, level select, battle, academy, hero training, scrolls, inventory, marketplace, settings, victory, defeat, and codex.
4. Battles are designed for 16:9 first, with support for wider mobile ratios.
5. UI must respect mobile safe areas, notches, and browser bars.
6. Desktop may show more map area or sharper controls, but the core gameplay must remain the same.

## 2.2 Hero-Builder Rules

1. The hero is required for normal building.
2. The hero is required for normal tower upgrades.
3. Tapping a build plinth opens the build circle immediately and sends the hero there.
4. While the build circle is open, the game runs at tactical slow motion, currently defined as 10% speed.
5. Choosing a tower closes the build circle and returns the game to normal speed.
6. The hero continues running to the construction plinth after the tower is selected.
7. The tower is built when the hero reaches construction range and completes the build timer.
8. Moving the hero elsewhere cancels the pending build intent.
9. If the hero dies, normal construction and upgrades become unavailable.
10. Assistant builders may later be unlocked to allow slow construction while the hero is dead, but this is a progression reward, not a default rule.

## 2.3 Tower Placement Rules

1. Normal towers are built only on fixed build plinths.
2. The player chooses what unlocked tower to build on a normal plinth.
3. No free placement anywhere on the terrain.
4. Wall/barrier placement uses fixed wall slots or approved path-blocking cells.
5. Wall placement must never permanently break pathfinding.
6. Towers currently do not take damage, so there is no repair system in the base version.
7. If tower damage is added later, repair must be considered a major system change.

## 2.4 Enemy Movement Rules

1. Enemies must not move in a perfect single-file line forever.
2. Paths should support lane offsets or formation offsets.
3. Small enemies can walk beside one another.
4. Large enemies and bosses occupy more visual space.
5. Flying enemies ignore walls and ground blockers.
6. Flying enemies still need clear readable air lanes or movement logic.
7. Enemy silhouettes must remain readable even when many are on screen.

## 2.5 Map Rules

1. Most maps have one main exit or defense objective.
2. Later maps may have multiple entrances.
3. New entrances can open over time.
4. Bosses may open new entrances or alter paths in special levels.
5. Larger maps are allowed, but larger maps must not mean boring waiting.
6. Camera panning and zooming may exist, but the player should never feel lost.
7. Early maps should fit mostly on screen; later maps can be larger.
8. Elevation is visual-first for now; complex gameplay elevation is postponed.

## 2.6 Economy and Monetization Rules

1. The campaign must be beatable through skill, upgrades, and strategy.
2. Paid or token-burn consumables must never be required to win.
3. No SAKART reward booster should exist.
4. SAKART should support permanent progression, scroll systems, cosmetics, skins, unbinding, respecs, and long-term economy.
5. One-time consumables are optional at most, and should not be the main fun or main spending loop.
6. PvP and leaderboards must carefully separate or ban paid advantages.

---

# 3. Game Overview

## 3.1 Genre

Sakartvelo Defenders is a 3D hero-builder tower defense game with strategic map progression, active hero control, map powers, and deep outside-battle upgrades.

It is not a pure idle defense game. The player is active during combat. The player moves the hero, chooses construction moments, uses abilities, triggers map powers, starts waves early, responds to leaks, and plans around future waves.

## 3.2 Core Gameplay Loop

1. Select a level from the campaign map.
2. Review the map, enemies, and possible threats.
3. Choose hero, map powers, tower loadout if applicable, and scroll loadout.
4. Enter build phase.
5. Tap build plinths to send the hero and choose towers.
6. Start the wave manually or wait for build phase timer.
7. Enemies advance along paths.
8. Towers attack automatically.
9. Hero fights and moves under player command.
10. Player uses map powers and hero abilities.
11. Earn gold from defeated enemies.
12. Build more towers or upgrade existing towers through hero actions.
13. Survive all waves and bosses.
14. Receive star rating and rewards.
15. Spend rewards in Academy, Hero Training, Map Powers, Scrolls, or cosmetics.
16. Continue to the next level or replay for better stars.

## 3.3 Session Loop

Short session:

1. Open game.
2. Play one level for 3–8 minutes.
3. Earn stars/resources.
4. Upgrade one thing.
5. Try the next level or replay for better rating.

Long session:

1. Push through several levels.
2. Unlock a new tower, hero, map power, scroll, or upgrade branch.
3. Experiment with loadouts.
4. Replay hard levels for better stars.
5. Progress through era story.
6. Prepare for boss or challenge levels.

## 3.4 Desired Player Feel

During battle, the player should feel:

- “I am commanding the hero.”
- “My decisions matter.”
- “I can save this if I react well.”
- “This map is readable.”
- “The hero is fun to move.”
- “The towers are satisfying.”
- “The battle is chaotic but fair.”

Between battles, the player should feel:

- “I unlocked something meaningful.”
- “I can build my strategy differently.”
- “This hero plays differently from that hero.”
- “This upgrade changes how I approach maps.”
- “I want to test a new scroll/map power/tower combination.”

---

# 4. Current Technical Foundation

## 4.1 Engine Direction

The current implementation is a browser-based real-time 3D game using Three.js/WebGL. The older Godot/PWA/2D sprite pipeline is no longer the accurate source of truth for implementation.

The v5 technical identity is:

- Browser-first game.
- Real-time 3D rendering.
- Stylized low-poly or optimized 3D models.
- Three.js/WebGL scene.
- Landscape-only UI and camera framing.
- Procedural/parameterized map generation from level data.
- Meshy AI and/or manual 3D model pipeline.
- GLB-style asset import for heroes, enemies, towers, and props.

## 4.2 Current Implemented Gameplay Concepts

The current gameplay already supports or partially supports:

- Hero movement by tapping/clicking the map.
- Build plinths.
- Build circle UI.
- Tactical slow motion during placement decisions.
- Hero pending build state.
- Build timer.
- Construction after hero reaches build range.
- Cancelling pending construction through hero movement.
- Tower selection.
- Tower upgrades through hero proximity.
- Archer, catapult, and wall tower types.
- Friendly infantry map power/button.
- Enemy waves.
- Build phases between waves.
- Early wave start bonus.
- Hero HP and respawn.
- Flying enemies.
- Boss metadata and boss HP UI.
- Camera zoom control.
- Pinch/touchpad zoom behavior.
- Level data with map size, path waypoints, build nodes, waves, themes, and defense targets.

## 4.3 Deprecated Assumptions

The following older assumptions are deleted from the source of truth:

1. The game is not currently a Godot 4.x 2D sprite-sheet game.
2. The production art pipeline is not only Blender-to-2D sprites.
3. The game should not be designed around portrait mobile battle screens.
4. Heroes are not merely optional support units; they are central builder-commanders.
5. Consumable scrolls/items should not dominate the battle economy.
6. Free tower placement should not be introduced as the standard placement method.

---

# 5. Controls and User Experience

## 5.1 Default Battle Controls

### Tap Empty Ground

The hero moves to that location.

### Tap Enemy

Preferred future behavior: the hero moves to intercept or attack that enemy. If enemy targeting is too complex in early versions, tapping near the enemy moves the hero to that ground point.

### Tap Build Plinth

The hero is ordered to move to the plinth. The build circle opens immediately. The game enters tactical slow motion. The player selects a tower. The build circle closes. The hero continues to the plinth and builds the chosen tower once in range.

### Tap Existing Tower

Open tower action UI: upgrade, sell, inspect, and possibly set priority later. The tower shows its range.

### Tap Hero Portrait

Center camera on hero or select/focus hero.

### Tap Map Power Button

If the map power is targeted, enter targeting mode or cast at tapped location. If the map power is global, activate immediately after confirmation or direct tap.

### Tap Wave Horn / Start Wave

Start wave early and award remaining build-phase bonus if applicable.

### Pinch Zoom

Zoom camera in/out within safe limits.

### Drag Map

Pan camera on larger maps. Drag should not accidentally move hero. The implementation should distinguish tap from drag.

## 5.2 Control Priority Rules

1. UI buttons and overlays.
2. Pause/settings/modals.
3. Active map power targeting.
4. Existing tower selection.
5. Build plinth interaction.
6. Enemy targeting, if implemented.
7. Empty-ground hero movement.
8. Deselect/cancel.

## 5.3 Tactical Slow Motion

Slow motion triggers:

- Build circle open.
- Tower action menu open.
- Pinch zoom gesture.
- Certain targeted map powers.
- Optional hero ability aiming.

Slow motion should not feel like a pause exploit. It should be short, clear, and tied to active decision UI.

## 5.4 Speed Controls

The game should support:

- x1 normal.
- x2 fast.
- x3 optional for experienced players.

Speed control is important because larger maps can increase travel and waiting time. Speed should automatically return to tactical slow motion when a build/targeting UI is open.

## 5.5 Camera Panning and Zooming

Rules:

- Early maps should fit mostly on screen.
- Later maps can be larger than the screen.
- Zoom out should allow players to view the full map if they want.
- Zoom in should allow comfortable unit readability.
- Camera bounds should prevent empty off-map areas.
- Hero portrait should center camera on hero.
- Warning icons should jump to leaks, new entrances, or boss events.

---

# 6. Battle Screen Layout

## 6.1 Overall Layout Philosophy

The battle screen uses a Kingdom Rush-like edge UI structure, adapted for Sakartvelo Defenders’ hero-builder identity. The center of the screen belongs to the battlefield. UI should live on the edges and never block key build spots, paths, or combat.

## 6.2 Recommended HUD Layout

### Top Left

- Lives.
- Gold.
- Wave counter.
- Optional era icon.

### Left Side Under Top UI

- Hero portrait.
- Hero HP.
- Hero level.
- Respawn timer if dead.

### Bottom Left

- Map power buttons, such as Call Militia and Stonefall.
- These are permanent cooldown powers, not disposable paid items.

### Bottom Center

- Contextual tower build UI.
- May appear only when a build plinth is selected.
- On larger screens, a small tower availability bar may remain visible.

### Right Side or Bottom Right

- Hero ability buttons.
- Cooldown indicators.
- Hero abilities should be visually separate from map powers.

### Top Right

- Pause.
- Speed control.
- Settings.

## 6.3 UI Readability Requirements

- Buttons must be large enough for thumbs on landscape phones.
- Cooldowns must be readable without tiny text.
- Build circle must not appear off-screen.
- Build circle must clamp to screen edges if plinth is near border.
- Enemy wave preview must be clear before wave starts.
- UI should support left-handed and right-handed layout preferences later.

---

# 7. Hero-Builder System

## 7.1 Role of the Hero

The hero is the player’s direct representative on the battlefield. The hero has four roles:

1. Builder — constructs towers.
2. Upgrader — upgrades towers when near them.
3. Fighter — blocks, attacks, or supports in combat.
4. Commander — activates abilities and influences nearby towers.

## 7.2 Hero Construction Flow

1. Player taps a build plinth.
2. Hero receives a move command toward the plinth.
3. Build circle opens instantly.
4. Game slows to 10% speed.
5. Player chooses tower type.
6. Build circle closes.
7. Game returns to previous speed.
8. Hero continues moving.
9. Hero reaches build range.
10. Build timer starts.
11. Tower appears when timer completes.
12. Gold is deducted when construction is committed or when tower is placed, depending on final economy implementation.

Current behavior deducts gold at tower placement completion. That is acceptable, but the UI should clearly show whether the player can afford the selected tower before selection.

## 7.3 Cancelling Construction

A pending build is cancelled when:

- Player taps elsewhere to move the hero.
- Player selects another action that overrides the build.
- Hero dies before construction completes.
- The build spot becomes invalid or occupied.
- Player explicitly cancels from UI.

## 7.4 Hero Death Rules

When the hero dies:

- Hero disappears or falls visually.
- Hero respawn timer begins.
- Hero cannot move.
- Hero cannot fight.
- Hero cannot build.
- Hero cannot upgrade towers.
- Hero abilities are disabled.
- Pending build is cancelled.
- Existing towers continue fighting.
- Map powers may still be usable unless specifically tied to hero.

## 7.5 Assistant Builder Unlock

Assistant Builders are a future progression unlock, not default behavior.

When unlocked:

- If hero is alive, construction works normally.
- If hero is dead, assistant builders can construct at 2x or 3x slower speed.
- Assistant builders may only build basic towers, not advanced upgrades, until further upgraded.
- Assistant builders cannot fight.
- Assistant builders should be represented visually or with a small construction icon.

Possible upgrade path:

1. Assistant Builders I — can build while hero dead at 300% build time.
2. Assistant Builders II — dead-hero build time reduced to 225%.
3. Assistant Builders III — dead-hero build time reduced to 175%.
4. Master Builders — can upgrade Level 1 towers while hero dead, but slowly.

## 7.6 Hero Build Speed

Build speed becomes one of the most important hero stats.

Different heroes should have different build identities:

- Heavy warrior: slow builder, strong fighter.
- Engineer: fast builder, weak fighter.
- Teleport hero: reaches plinths instantly but builds at normal or slightly reduced speed.
- Saint/support: average builder, strong defensive utility.
- Cavalry hero: fast movement, average build speed.

## 7.7 Hero Upgrade Interaction

Tower upgrades should require hero presence.

Flow:

1. Player taps existing tower.
2. Upgrade option appears if affordable and available.
3. Player chooses upgrade.
4. Hero moves to tower.
5. Upgrade occurs when hero reaches upgrade range.

---

# 8. Hero Roster Design

## 8.1 Hero Design Philosophy

Every hero must feel like a different show actor. The goal is that players do not all choose the same hero. Heroes should have unique movement, build rhythm, combat role, abilities, and progression trees.

Each hero should answer:

- Why is this hero historically or culturally important?
- What battlefield fantasy does this hero offer?
- What is this hero good at?
- What is this hero bad at?
- How does this hero change building decisions?
- How does this hero interact with towers and map powers?

## 8.2 Hero Template

Every hero should have:

- Name.
- Era.
- Historical/cultural identity.
- Role.
- Movement speed.
- Build speed.
- HP.
- Attack style.
- Passive trait.
- Ability 1: short cooldown.
- Ability 2: medium cooldown.
- Ultimate: long cooldown.
- Unique training tree.
- Weakness.
- Suggested player style.

## 8.3 Core Hero Archetypes

### Tank Hero

Role: Holds choke points and survives heavy pressure.

Strengths: high HP, strong melee, can delay enemies, good against infantry waves.

Weaknesses: slow movement, slow build speed, poor response to multiple entrances, vulnerable to flying enemies unless abilities help.

Example abilities:

- Shield Bash: damages and stuns nearby enemies.
- Hold the Gate: increases armor and blocks more enemies temporarily.
- Last Stand: becomes nearly unkillable for a short time and rallies nearby towers.

### Fast Builder Hero

Role: Builds and upgrades quickly.

Strengths: fast build speed, fast upgrade speed, good on large maps, supports tower-heavy strategy.

Weaknesses: low combat power, needs tower support, can die if caught.

Example abilities:

- Rapid Construction: next build is much faster.
- Supply Run: temporarily reduces tower cost near hero.
- Master Builder: instantly completes all pending construction in a small radius.

### Teleport Hero

Role: Extreme mobility and map control.

Strengths: can appear anywhere quickly, excellent for large maps and multi-entrance levels, can save leaks, can build at distant plinths.

Weaknesses: lower HP, lower sustained damage, requires active player attention.

Example abilities:

- Blink: teleport to target location.
- Phase Mark: mark an enemy; towers deal bonus damage to it.
- Rift Return: teleport a group of enemies backward along the path.

### Ranged Hero

Role: Mobile ranged damage and priority targeting.

Strengths: attacks from safety, good against flying enemies if designed that way, can support towers from behind walls.

Weaknesses: fragile if surrounded, not good at holding choke points, average or slow building depending on hero.

Example abilities:

- Piercing Shot.
- Hunter’s Mark.
- Rain of Arrows.

### Saint / Support Hero

Role: Protection, healing, slowing, and defensive control.

Strengths: protects towers and walls, slows enemies, supports defensive play, strong synergy with shrine/church towers.

Weaknesses: low direct damage, needs good tower placement.

Example abilities:

- Vine Cross Ward: protective area.
- Sacred Ground: slows enemies in radius.
- Blessing of Sakartvelo: heals hero and empowers towers temporarily.

### Cavalry Commander Hero

Role: Fast road control and interception.

Strengths: high movement speed, strong against leaks, can charge along paths, good against ranged or fragile enemies.

Weaknesses: may struggle against heavy bosses, build speed may be average, needs careful pathing.

Example abilities:

- Cavalry Charge.
- Rally Riders.
- Breakthrough: damages a line and pushes enemies backward.

### Magic / Control Hero

Role: Debuffs, poison, transformation, battlefield manipulation.

Strengths: high control, useful against mixed waves, strong ability combos.

Weaknesses: fragile, skill-dependent, cooldown reliant.

Example abilities:

- Poison Cloud.
- Alchemical Surge.
- Transformative Field.

## 8.4 Era-Based Hero Examples

### Era 0 — Ancient Colchis

**Medea**  
Role: Magic/support/control.  
Fantasy: Colchian princess, healer, alchemist, wielder of ancient knowledge.  
Gameplay: Poison enemies, empower towers, heal/support hero or defenders.

Possible abilities:

- Herbal Poison: damages and weakens enemies over time.
- Colchian Remedy: heals hero and nearby friendly infantry.
- Colchian Alchemy: temporarily empowers nearby towers or transforms projectiles.

### Era 1 — Kingdom of Iberia

**King Pharnavaz** — economy/builder hero. Cheaper construction, stronger early economy, faster build near central areas.

**Saint Nino** — saint/support/protection hero. Slows enemies, shields towers, strengthens shrine effects.

**Vakhtang Gorgasali** — warrior king/tank commander. Strong melee, wolf-head charge, tower damage aura.

### Era 2 — Age of Invasions

**Bagrat III the Unifier** — consolidation hero. Global buffs, reduced build costs in connected defenses, strong comeback tools.

### Era 3 — Georgian Golden Age

**David IV the Builder** — commander/builder hybrid. Strong building, military buffs, Didgori-themed ultimate.

**Queen Tamar** — prosperity/defense/economy. Resource generation, tower invulnerability, high-level strategic power.

**Zakare Zakarian** — offensive commander. Cavalry synergies, coordinated strikes.

**Shota Rustaveli** — cultural inspiration/support. Morale buffs, tower speed, non-combat inspiration effects.

### Era 4 — Mongol Catastrophe

**Queen Rusudan** — desperation/diplomacy. Emergency resources, damage reduction, crisis survival.

**George V the Brilliant** — restoration. Restores tower power and supports reunification-themed comeback play.

### Era 5 — Between Empires

**Erekle II** — last stand defender. Risky power spikes, defensive leadership, survival under pressure.

**Vakhtang VI** — law/economy/structure. Systematic upgrade discounts, academy-like support.

### Era 6 — Russian Empire

**Prince Pyotr Bagration** — defensive military hero. Shield lines, artillery resistance, strong defensive ultimate.

**Ilia Chavchavadze** — national awakening/economy. Resource generation, cultural resilience, education bonuses.

### Era 7 — First Democratic Republic

**Noe Jordania** — democratic resilience/diplomacy. Emergency coordination, multi-front defense, morale preservation.

### Era 8 — Soviet Century

**Merab Kostava** — resistance. Resilience aura, debuffs oppressive enemies, national will ultimate.

**WWII Georgian Commander** — military offense/fortification. Targeted strike, temporary fortified zone.

Important rule: Stalin is historical context, not a playable hero.

### Era 9 — Modern Georgia

Modern heroes must be handled carefully because the era is politically sensitive. Prefer archetypal or composite heroes if named figures would create controversy.

Possible roles:

- Drone scout.
- Modern officer.
- Field medic.
- Civil defender.
- Engineer.
- Resistance commander.

---

# 9. Hero Training System

## 9.1 Purpose

Hero Training is the permanent or semi-permanent progression system for heroes. It makes every hero feel deeper over time and creates reasons to replay levels and experiment.

Hero Training is separate from Tower Academy. Academy upgrades improve tower families and general systems. Hero Training improves individual heroes.

## 9.2 Training Resources

Possible training costs:

- In-game hero XP.
- Stars.
- Era medals.
- SAKART for major unlocks/respecs.
- Hero-specific tokens earned through use.

Recommended approach:

- Basic hero levels come from gameplay XP.
- Training nodes cost hero points earned by leveling.
- Advanced mastery nodes may require SAKART burn or special achievements.
- Respecs can cost a small SAKART fee or a rare earned item.

## 9.3 Shared Training Categories

### Vitality

- Max HP.
- Damage resistance.
- Respawn time reduction.
- Survival after lethal hit once per battle.

### Movement

- Movement speed.
- Path movement bonus.
- Faster response after receiving command.
- Reduced slowdown from enemy effects.

### Construction

- Build speed.
- Upgrade speed.
- Reduced construction interruption.
- Build range.
- First tower built faster.

### Combat

- Attack damage.
- Attack speed.
- Attack range.
- Critical chance.
- Armor penetration.
- Anti-air capability if appropriate.

### Abilities

- Cooldown reduction.
- Larger radius.
- Longer duration.
- Added secondary effect.
- Ultimate charge speed.

### Synergy

- Nearby tower buff.
- Nearby infantry buff.
- Stronger command link.
- Shrine/map power interaction.

## 9.4 Unique Hero Training Trees

Each hero should have three branch identities.

Example warrior hero:

1. Guardian Branch — HP, blocking, defense.
2. Commander Branch — tower aura, infantry rally, morale.
3. Builder Branch — build speed, upgrade speed, fortification support.

Example teleport hero:

1. Blink Branch — teleport cooldown, range, afterimage.
2. Arcane Branch — debuffs, magic damage, enemy rewind.
3. Builder Branch — instant arrival construction, fragile but fast map control.

Example Saint Nino:

1. Vine Cross Branch — shields, healing, sanctuary.
2. Pilgrim Branch — movement, aura path, map-wide blessing.
3. Shrine Branch — shrine tower synergy, slow aura, spiritual protection.

## 9.5 Final Mastery Nodes

Examples:

- David IV: first tower built each wave is 50% faster.
- Tamar: once per level, prevent a lethal life loss and grant emergency gold.
- Medea: poisoned enemies take increased damage from catapults and magic.
- Teleport hero: after teleporting, next build starts instantly but takes longer to finish.
- Tank hero: when below 30% HP, nearby towers gain attack speed.

## 9.6 Avoiding One Best Hero

- Maps should reward different hero styles.
- Large maps favor mobility.
- Choke-heavy maps favor tanks.
- Economy-starved maps favor builders/economy heroes.
- Air-threat maps favor ranged/control heroes.
- Boss-pressure maps favor burst or defense heroes.

Hero balance should be based on map context, not only raw damage.

---

# 10. Tower System

## 10.1 Tower Philosophy

Towers are the defensive backbone. The hero builds and supports them, but towers do the majority of sustained defense.

Tower design rules:

1. Each tower must have a clear role.
2. New towers add options, not direct replacements.
3. Older towers remain useful in later eras.
4. Tower visuals change by era while core role can remain recognizable.
5. Upgrade choices should feel impactful.
6. Towers must have readable silhouettes.

## 10.2 Starting Tower Families

### Archer Tower

Role: reliable single-target damage.

Strengths:

- Cheap.
- Fast attacks.
- Good against light infantry.
- Can become anti-air through upgrades.

Weaknesses:

- Weak against heavy armor.
- Limited splash.
- Needs good placement.

Upgrade ideas:

- Level 2: increased attack speed.
- Level 3: critical hits or anti-air specialization.
- Academy branch: poison arrows, fire arrows, armor-piercing arrows, eagle-eye range.

### Catapult / Siege Tower

Role: area damage and crowd control.

Strengths:

- Splash damage.
- Good against grouped enemies.
- Strong at bends and choke points.

Weaknesses:

- Slow fire rate.
- Can miss fast enemies if implemented.
- Weak against flying unless upgraded specially.

Upgrade ideas:

- Larger splash.
- Stun chance.
- Burning ground.
- Armor cracking.

### Wall / Barrier

Role: path delay, choke creation, enemy control.

Strengths:

- Slows ground enemies.
- Creates time for towers.
- Enables kill zones.

Weaknesses:

- Fixed slots only.
- Flying enemies ignore it.
- Siege and bosses damage it heavily.
- Too many walls can be dangerous to balance.

Upgrade ideas:

- More durability.
- Spikes.
- Slow aura.
- Shielded gate.
- Bastion synergy with adjacent walls.

### Friendly Infantry / Militia

Role: temporary blocker and emergency response.

This may be a map power rather than a tower.

Strengths:

- Can be placed or spawned to delay enemies.
- Good emergency tool.
- Fun active decision.

Weaknesses:

- Temporary.
- Can die.
- Weak against cavalry, siege, bosses, flying.
- Must not become always-best solution.

### Shrine / Bell / Church Tower

Role: buff, debuff, crowd control, cultural identity.

Strengths:

- Slows enemies.
- Buffs nearby towers.
- Protects walls or hero.
- Strong Georgian identity.

Weaknesses:

- Low direct damage.
- Needs good placement.
- Can be weak without synergy.

Upgrade ideas:

- Bell Toll slow.
- Sanctuary shield.
- Divine Light tower buff.
- Vine Cross aura.

## 10.3 Later Tower Families

### Cavalry Outpost

Mobile patrol/intercept tower that periodically sends riders along a short patrol route.

### Gunpowder Tower

Era 5 onward. Long-range, high damage, armor penetration.

### Industrial Tower

Era 6 onward. Rapid-fire suppression, machine-gun/artillery style.

### Bunker Tower

Era 8 onward. Durable, defensive, suppression fire.

### Tech Tower / Drone Platform

Era 9 onward. Precision targeting, reveals hidden enemies, anti-air/drone support.

## 10.4 Tower Upgrade Levels During Battle

Each tower should have 3 in-battle upgrade levels at minimum.

- Level 1: base tower.
- Level 2: stat improvement.
- Level 3: special ability unlocked.

Later, advanced branches can exist:

- Level 4A and 4B choices.
- Era-specific variants.
- Academy-unlocked specializations.

Early versions should keep it simple: three levels first.

## 10.5 Tower Selection on Build Plinths

Normal plinth rules:

- Any unlocked standard tower can be built.
- Some plinths may have soft bonuses but should not force a tower unless it is a special level mechanic.
- The UI must show tower cost, role, and availability.

Special plinth types can be added later:

- High ground plinth.
- Sacred plinth.
- Heavy foundation.
- Roadside outpost.
- Tech pad.

---

# 11. Tower Academy

## 11.1 Purpose

The Academy is the permanent tower and system upgrade hub. It is one of the most important outside-game progression systems.

The Academy should create long-term buildcraft. Players should feel they are shaping their defensive philosophy.

The Academy should not simply be “+1% damage everywhere.” It should unlock meaningful mechanics.

## 11.2 Academy Structure

Recommended Academy tabs:

1. Archer Academy.
2. Siege Academy.
3. Fortification Academy.
4. Militia & Cavalry Academy.
5. Shrine & Culture Academy.
6. Economy & Construction Academy.
7. Era Technology Academy.
8. Advanced Mastery.

## 11.3 Upgrade Cost Model

Academy upgrades can cost:

- Stars.
- Era medals.
- In-game upgrade currency.
- SAKART for major unlocks, respecs, or prestige.

Recommended:

- Early Academy upgrades should not require SAKART.
- SAKART can be used for advanced branches, optional respecs, mastery unlocks, and cosmetic binding systems.
- The campaign should remain playable without aggressive token spending.

## 11.4 Archer Academy Example Tree

### Tier 1

- Sharper Arrows: Archer damage +5%.
- Faster Draw: Archer attack speed +5%.
- Watchful Eye: Archer range +5%.

### Tier 2

- Eagle Training: Archers can target flying enemies more reliably.
- Focus Fire: Archers deal bonus damage to enemies already damaged by hero.
- Prepared Quivers: First archer built each level costs slightly less.

### Tier 3

- Critical Volley: Small chance to deal double damage.
- Armor-Piercing Tips: Reduced penalty against armored enemies.
- Hunter’s Mark: Archer attacks mark enemies for other archers.

### Mastery Choice

- Falcon Branch: anti-air specialization.
- Didgori Marksmen: high single-target damage.
- Rainfire Branch: lower damage but occasional mini-volley.

## 11.5 Siege Academy Example Tree

### Tier 1

- Reinforced Arms: Catapult damage +5%.
- Wider Impact: splash radius +5%.
- Crew Training: reload time reduced.

### Tier 2

- Cracked Armor: catapult hits reduce enemy armor briefly.
- Shattered Ground: splash slows enemies slightly.
- Heavy Stones: more damage to siege enemies and bosses.

### Tier 3

- Fire Pots: leaves burning ground.
- Stun Impact: small chance to stun non-boss enemies.
- Mountain Stone: bonus damage on mountain/fortress maps.

### Mastery Choice

- Destroyer: boss/siege damage.
- Crowd Breaker: larger splash and slow.
- Fire Engineer: burn effects.

## 11.6 Fortification Academy Example Tree

### Tier 1

- Stronger Palisades: wall durability +10%.
- Faster Assembly: wall build time -10%.
- Cheaper Stakes: wall cost -5%.

### Tier 2

- Spiked Barriers: enemies attacking walls take damage.
- Defensive Ditches: enemies near walls are slowed.
- Gate Discipline: friendly infantry near walls gain defense.

### Tier 3

- Bastion Network: adjacent walls empower each other.
- Stone Facing: walls resist siege damage better.
- Last Gate: once per level, a destroyed wall survives at 1 HP.

### Mastery Choice

- Caucasus Wall: maximum durability.
- Thorn Wall: damage reflection.
- Choke Architect: stronger slow/kill-zone control.

## 11.7 Militia & Cavalry Academy Example Tree

### Tier 1

- Better Spears: militia damage +5%.
- Sturdier Shields: militia HP +10%.
- Faster Rally: militia cooldown reduced.

### Tier 2

- Extra Recruit: militia summons one additional unit.
- Hold Formation: militia survive longer when near hero.
- Road Guards: militia move faster on paths.

### Tier 3

- Veteran Militia: militia gain armor.
- Counter Charge: militia deal bonus damage to cavalry.
- Last Defense: militia spawn automatically near exit once per level when lives are low.

### Mastery Choice

- Village Guard: stronger blockers.
- Mountain Ambushers: temporary high burst.
- Royal Retinue: synergy with commander heroes.

## 11.8 Shrine & Culture Academy Example Tree

### Tier 1

- Clear Bell: slow aura +5%.
- Stronger Faith: tower buff +5%.
- Sacred Stones: shrine build time reduced.

### Tier 2

- Sanctuary: nearby towers gain temporary shield when shrine is built.
- Pilgrim Path: enemies near shrine are slowed longer.
- Chant: hero ability cooldown recovers faster near shrine.

### Tier 3

- Vine Cross Ward: periodic protective pulse.
- Monastery Archive: bonus codex/XP rewards.
- Golden Light: shrine empowers nearby walls and archers.

### Mastery Choice

- Defender of Faith: defensive aura.
- Cultural Flame: offense/support aura.
- Pilgrim’s Grace: hero and map power synergy.

## 11.9 Economy & Construction Academy Example Tree

### Tier 1

- Better Tools: all build times -5%.
- Organized Crews: upgrade time -5%.
- Salvage: selling towers returns more gold.

### Tier 2

- Early Planning: start each level with +5% gold.
- Quick Foundations: first tower built each wave is faster.
- Construction Signals: hero moves slightly faster toward build plinths.

### Tier 3

- Assistant Builders I: construction possible while hero dead at 300% time.
- Assistant Builders II: dead-hero construction improved.
- Emergency Scaffolds: one instant Level 1 build per level, unlocked late.

### Mastery Choice

- Builder’s Path: faster construction.
- Treasurer’s Path: better economy.
- Engineer’s Path: assistant builders and upgrade comfort.

## 11.10 Academy Balance Principles

- No single branch should be mandatory.
- Early upgrades should be easy and satisfying.
- Late upgrades should create identity.
- Respec should exist, but not always be free.
- Academy should reward experimentation.
- Academy upgrades should not trivialize campaign maps.
- PvP and leaderboards may use normalized or bracketed upgrade rules.

---

# 12. Map Powers

## 12.1 Purpose

Map powers are active battlefield abilities independent from hero abilities. They give the player satisfying emergency tools and strategic expression.

They replace the bad feeling of disposable paid consumables. The player unlocks and upgrades map powers outside battle, then chooses a limited number for each level.

## 12.2 Loadout Rule

Players may unlock many map powers, but can equip only 2 or 3 per level.

Recommended:

- Early game: 2 map power slots.
- Mid game unlock: third slot.
- Challenge/PvP may restrict to 2 for balance.

## 12.3 Map Power Categories

- Reinforcement powers: summon temporary defenders.
- Damage powers: deal area damage.
- Control powers: slow, freeze, push back, fear, or redirect enemies.
- Defensive powers: shield walls, protect exit, strengthen towers.
- Economy powers: generate emergency gold or reduce costs briefly.
- Utility powers: reveal hidden enemies, mark boss, speed construction.

## 12.4 Starting Map Powers

### Call Militia

Summons temporary Georgian defenders near a selected path location.

Role:

- Emergency blocker.
- Delay leaks.
- Protect weak lanes.

Upgrade ideas:

- More HP.
- More damage.
- More soldiers.
- Shorter cooldown.
- Longer duration.
- Bonus near walls or hero.

### Stonefall

Drops stones on a selected area.

Role:

- Basic area damage.
- Good against groups.
- Easy to understand.

Upgrade ideas:

- Larger radius.
- More damage.
- Slow effect.
- Armor crack.
- Extra damage to siege.

## 12.5 Georgian-Themed Map Powers

### Fire of Amirani

A mythic fire strike inspired by Georgian mythic heroism.

Effect:

- Area fire damage.
- Burn over time.
- Strong against clustered enemies.

### Horn of Didgori

A rally power inspired by the Battle of Didgori.

Effect:

- Temporarily increases tower attack speed and militia courage.
- Could also start next wave with bonus if used in build phase.

### Vine Cross Sanctuary

Inspired by Saint Nino’s grapevine cross.

Effect:

- Creates protective zone.
- Slows enemies.
- Strengthens nearby hero/towers.

### Golden Fleece Surge

Inspired by Colchis and the Golden Fleece.

Effect:

- Temporarily increases gold reward from enemies in an area, or buffs towers with golden energy.
- Must be balanced carefully to avoid economy exploits.

### Mountain Ambush

Spawns temporary ambushers from terrain edges. Strong on mountain/forest maps.

### Royal Banner

Place banner that buffs towers and militia in radius. Good for planned defense.

### Monastery Bells

Global or large-area slow pulse. May interrupt certain enemy abilities.

### Falcon Scout

Reveals next wave, hidden enemies, or flying paths. Later can mark high-priority enemies.

## 12.6 Map Power Upgrade Trees

Example: Call Militia

- Rank 1: summons 2 militia.
- Rank 2: +20% HP.
- Rank 3: cooldown -10%.
- Rank 4: summons 3 militia.
- Rank 5: militia gain shields near hero.
- Mastery: militia can briefly block cavalry or resist boss fear.

Example: Stonefall

- Rank 1: basic area damage.
- Rank 2: +10% damage.
- Rank 3: +10% radius.
- Rank 4: applies slow.
- Rank 5: armor crack.
- Mastery: second smaller impact after delay.

## 12.7 SAKART and Map Powers

SAKART may be used for:

- Unlocking advanced map power branches.
- Respecing map power upgrades.
- Cosmetic variants of powers.
- Prestige upgrades after normal progression.

SAKART should not be required to make basic map powers usable.

---

# 13. Enemy System

## 13.1 Enemy Design Philosophy

Enemies must be historically or mythologically grounded, mechanically clear, and visually readable.

Every enemy should communicate:

- Movement speed.
- Durability.
- Threat type.
- Whether it is flying.
- Whether it attacks walls.
- Whether it is a boss or elite.

## 13.2 Enemy Categories

### Infantry

Standard ground enemies. Moderate speed, moderate HP, basic wall damage, appear in most waves.

### Cavalry

Fast ground enemies. Higher speed, wider lane offset, pressure exits quickly, dangerous if not blocked.

### Siege

Slow, heavy enemies. High HP, heavy wall damage, vulnerable to focused fire, good target for catapults and armor-break powers.

### Flying

Air enemies that ignore ground path blocking. They ignore walls, often have lower HP, and require anti-air towers, hero abilities, or map powers.

### Boss

Major encounter enemy. High HP, special mechanics, multiple phases if possible, clear warning and boss HP UI.

## 13.3 Formation and Lane Offset System

Enemies should no longer appear as a single-file train.

Each ground path should have a width and several visual lanes.

When an enemy spawns:

- Assign a lateral offset from path center.
- Offset depends on enemy size.
- Infantry can use random small offsets.
- Cavalry can use wider offsets.
- Siege uses center or slight offset.
- Boss uses center.
- Groups can spawn in loose formation.

## 13.4 Multi-Path Enemies

Future enemy wave data should support path IDs.

Example:

- Wave 1: infantry from `north_pass`.
- Wave 3: cavalry from `east_road`.
- Wave 5: boss opens `mountain_gate`.

## 13.5 Enemy Traits

Possible traits:

- Armored: reduced arrow damage.
- Swift: faster movement, lower HP.
- Regenerating: heals over time unless burst down.
- Shielded: blocks frontal attacks.
- Wallbreaker: bonus damage to walls.
- Flyer: ignores walls.
- Hidden: requires scout/tech/shrine reveal.
- Commander: buffs nearby enemies.
- Cowardly: flees or speeds up when low HP.

Traits should be introduced slowly.

## 13.6 Enemy Readability Rules

- Fast enemies must have fast animation.
- Armored enemies must visibly look armored.
- Flying enemies must be elevated with shadow below.
- Siege enemies must be larger and slower.
- Bosses must be unmistakable.
- Health bars should be clear but not cluttered.

---

# 14. Walls and Blocking

## 14.1 Wall Purpose

Walls are not normal towers. They are terrain-control tools. They allow the player to create delay, shape enemy flow, and buy time. They must be powerful but not game-breaking.

## 14.2 Wall Slot Rules

Recommended v5 rule:

- Walls can only be built on fixed wall slots or approved path-blocking cells.
- Wall slots are designed per map.
- Wall placement must preserve at least one valid route or use controlled blocking rules.
- Bosses and siege units can damage walls heavily.
- Flying enemies ignore walls entirely.

## 14.3 Wall Durability

Walls have HP/durability. Ground enemies stop or slow when blocked and attack the wall. Siege and bosses deal extra wall damage. Infantry deals less wall damage. Cavalry may be delayed strongly but eventually break through.

## 14.4 No Repair in Base Version

Because towers do not currently take damage, there is no broad repair system. Walls may have durability as a special case.

If wall repair is added:

- Hero can repair walls only.
- Repair takes time.
- Repair competes with building and fighting.
- Repair should not apply to all towers unless tower damage becomes a broader system.

## 14.5 Wall Upgrades

In-battle upgrades:

- Level 1: basic barrier.
- Level 2: more HP.
- Level 3: spikes, slow, or shield.

Academy upgrades:

- Bastion network.
- Siege resistance.
- Faster construction.
- Last Gate effect.

---

# 15. Friendly Infantry and Reinforcements

## 15.1 Purpose

Friendly infantry should be fun and useful, but not always the best option. They are an emergency and tactical delay system.

## 15.2 Current Role

Friendly infantry currently work as a spawnable support unit. This should remain because it is fun and already fits the game.

## 15.3 Balance Rules

Friendly infantry should:

- Delay enemies, not replace towers.
- Be strong against small infantry.
- Be weak against siege, bosses, flying enemies.
- Have cooldown and cost.
- Have active count limits.
- Scale through map power upgrades or Academy.

## 15.4 Upgrade Ideas

- More HP.
- More damage.
- More active units.
- Shorter cooldown.
- Bonus near hero.
- Bonus near walls.
- Spearmen upgrade vs cavalry.
- Shieldbearer upgrade vs infantry.
- Mountain ambusher variant.

## 15.5 Interaction with Heroes

Some heroes can specialize in infantry:

- Commander heroes rally infantry.
- Saint heroes protect infantry.
- Cavalry heroes summon mounted allies.
- Builder heroes deploy stronger barricade crews.

---

# 16. Boss Encounters

## 16.1 Boss Design Philosophy

Bosses should be strategic and dramatic, not annoying tap-spam.

Bad boss mechanics:

- Repeatedly tapping towers to unlock them.
- Random unavoidable tower disables.
- One-shot losses without warning.
- Excessive screen clutter.
- Pay-to-win pressure.

Good boss mechanics:

- Opens a new entrance.
- Damages or breaks walls.
- Summons special waves.
- Forces hero movement.
- Creates visible danger zones.
- Requires tower priority decisions.
- Has clear counterplay.

## 16.2 Boss Event Examples

### Gate Breaker

Boss smashes open a new entrance mid-level. A warning appears before the gate opens.

### Siege Aura

Boss empowers nearby siege units. Player must focus boss or use control powers.

### Burning Ground

Boss creates danger zones where towers or infantry are less effective.

### Wall Crusher

Boss deals huge damage to walls but moves slowly.

### Summoner

Boss periodically summons small enemies from side entrances.

### Airborne Phase

Mythological boss briefly flies, requiring anti-air or hero ability.

## 16.3 Bosses by Era

- Era 0: Colchian Dragon, Devi Chief, mythic guardian of the Golden Fleece.
- Era 1: Sassanid Persian general, Roman centurion/commander.
- Era 2: Emir of Tbilisi, Seljuk warlord.
- Era 3: Seljuk coalition commander, Khwarezmian raider.
- Era 4: Chormaqan, Timur.
- Era 5: Agha Mohammad Khan, Ottoman commander.
- Era 6: Tsarist general, mountain war commander.
- Era 7: Bolshevik commissar, armored Red Army column.
- Era 8: repressive state apparatus represented carefully; WWII commander enemies depending on context.
- Era 9: Russian tank column, separatist warlord, modern armored convoy.

Sensitive modern bosses must be handled carefully and factually.

---

# 17. Map Design System

## 17.1 Map Philosophy

Maps are the heart of tower defense. Each map should be a small historical battlefield puzzle.

Every map should have:

- Clear entrance(s).
- Clear exit or defense objective.
- Readable paths.
- Meaningful build plinths.
- At least one tactical choice.
- Era-specific environment.
- Good hero movement space.
- No excessive clutter.

## 17.2 Landscape Map Scale

Early maps:

- Mostly fit on screen.
- 1 entrance.
- 1 exit.
- 4–7 build plinths.
- Simple waves.

Mid maps:

- Slightly larger than screen.
- 1–2 entrances.
- 1 exit.
- 7–11 build plinths.
- Wall slots.
- Flying or cavalry pressure.

Late maps:

- Larger with panning/zoom.
- 2–3 entrances.
- 1 main exit.
- 10–15 build plinths.
- Boss events.
- Special objectives.

## 17.3 Entrances and Exits

Default structure:

- Multiple entrances can exist.
- One main exit is preferred for clarity.

Special cases:

- Two exits for advanced challenge maps.
- Defense target instead of exit.
- Escort route.
- Holdout timer.

## 17.4 Multiple Entrances Over Time

Entrances should not all activate immediately in early levels. New entrances can open as the player progresses.

Examples:

- Wave 1: north road only.
- Wave 3: east forest opens.
- Wave 6: boss breaks mountain gate.

The player must receive warning:

- Entrance marker.
- Horn/sound cue.
- Camera nudge.
- Wave preview.
- Visual gate cracking before it opens.

## 17.5 Build Plinth Placement Rules

1. Place plinths near path bends.
2. Place some plinths before choke points.
3. Place some plinths after choke points for backup.
4. Avoid placing every plinth in obviously perfect positions.
5. Give the player early, middle, and late defense options.
6. Leave room for hero movement.
7. Do not hide plinths behind UI or tall props.
8. Keep plinth count readable.

## 17.6 Wall Slot Placement Rules

Good wall slot locations:

- Choke points.
- Bridge crossings.
- Gate roads.
- Narrow mountain passes.
- Before tower kill zones.

Bad wall slot locations:

- Everywhere.
- Places that completely trivialize the map.
- Places that create confusing pathing.
- Places too close to exit without counterbalance.

## 17.7 Elevation

Elevation is visual-first in v5.

Reason:

- Complex height rules can complicate hero movement.
- Current focus should be landscape, map size, path lanes, multi-entrance, and progression.

Future simple elevation:

- Some plinths tagged as high ground.
- High ground gives range bonus.
- Hero can still path normally.
- Visual height should not block readability.

## 17.8 Map Objectives

Special objectives can include:

- Protect the village gate.
- Defend a monastery.
- Hold a bridge.
- Protect refugees crossing the map.
- Defend qvevri/wine harvest in cultural levels.
- Protect a watchfire.
- Stop siege engines before they reach a fortress.
- Survive until reinforcements.
- Defend multiple gates.
- Prevent boss from destroying a sacred object.

Objectives should be introduced gradually.

## 17.9 Data-Driven Map Pipeline

The map should be designed through data rather than fully hand-built scenes.

Designer-authored data:

- Era.
- Level number.
- Map name.
- Grid width/height.
- Path waypoints.
- Future: multiple paths with IDs.
- Build plinths.
- Wall slots.
- Starting gold/lives.
- Waves.
- Boss.
- Theme.
- Defense target.
- Historical fact.
- Map profile.

Generated by game:

- Organic terrain.
- Path ribbon.
- Path borders.
- Plinth visuals.
- Decoration sets.
- Rocks, trees, water, ruins.
- Defense objective prop.
- Theme-specific environment.

## 17.10 Future Multi-Path Level Data

Recommended future format:

```ts
interface LevelPathData {
  id: string;
  waypoints: number[][];
  opensWave?: number;
  entranceName?: string;
  pathType?: 'ground' | 'air' | 'boss' | 'ambush';
}

interface LevelDataV5 {
  era: number;
  level: number;
  name: string;
  starting_gold: number;
  starting_lives: number;
  grid_width: number;
  grid_height: number;
  paths: LevelPathData[];
  build_nodes: number[][];
  wall_nodes?: number[][];
  waves: WaveDataV5[];
  theme: string;
  defense_target: string;
  historical_fact: string;
  boss?: string | BossData | null;
}

interface EnemySpawnDataV5 {
  type: string;
  count: number;
  hp_mult: number;
  speed_mult: number;
  spawn_interval: number;
  pathId?: string;
  formation?: 'line' | 'loose' | 'wide' | 'column';
}
```

---

# 18. Era Structure

## 18.1 Era Philosophy

The game follows strict chronological progression. Georgian history should unfold as a story. Each era introduces new threats, environments, mechanics, towers, heroes, and educational themes.

The ten-era structure remains:

0. Ancient Colchis.
1. Kingdom of Iberia.
2. Age of Invasions.
3. Georgian Golden Age.
4. Mongol Catastrophe.
5. Between Empires.
6. Russian Empire.
7. First Democratic Republic.
8. Soviet Century.
9. Modern Georgia.

Each era should contain approximately 20 levels in the long-term plan, for 200 campaign levels total. The first playable scope should remain much smaller.

## 18.2 Era 0 — Ancient Colchis

Period: approximately 600 BC to 100 BC.

Themes:

- Colchis.
- Golden Fleece.
- Vani archaeology.
- Rivers and forests.
- Gold, bronze, early iron.
- Greek contact.
- Mythic creatures.

Gameplay identity:

- Introductory tower defense.
- Basic archer/catapult/wall systems.
- Medea as first hero.
- Simple paths at first.
- Mythological flying or devi enemies later.
- River crossings and forest ambushes.

Map visuals:

- Rioni valley.
- Ancient settlements.
- Wooden towers.
- Gold streams.
- Sacred groves.
- Greek-influenced coastal outposts.

## 18.3 Era 1 — Kingdom of Iberia

Period: approximately 300 BC to 630 AD.

Themes:

- Kartli/Iberia.
- Mtskheta.
- Armazi.
- Christianization.
- Saint Nino.
- Vakhtang Gorgasali.
- Rome, Parthia, Sassanid Persia.

Gameplay identity:

- Stone fortifications.
- Stronger cavalry enemies.
- Early shrine/protection mechanics.
- Heroes with kingdom, saint, and warrior identities.

Map visuals:

- Mtskheta.
- Armazi fortress.
- Early churches.
- Tbilisi hot springs legend.
- Uplistsikhe cave city.

## 18.4 Era 2 — Age of Invasions

Period: approximately 630 to 1089 AD.

Themes:

- Arab invasions.
- Emirate of Tbilisi.
- Tao-Klarjeti.
- Bagrationi rise.
- Bagrat III.
- Didi Turkoba.

Gameplay identity:

- Larger waves.
- Desperate defense.
- Fortified positions.
- Multi-wave pressure.
- Early multi-entrance maps.

Map visuals:

- Crumbling fortresses.
- Mountain refuges.
- Monasteries as cultural anchors.
- Tbilisi under emirate influence.

## 18.5 Era 3 — Georgian Golden Age

Period: approximately 1089 to 1225 AD.

Themes:

- David IV.
- Didgori.
- Liberation of Tbilisi.
- Queen Tamar.
- Gelati.
- Vardzia.
- Rustaveli.
- Zakarian commanders.

Gameplay identity:

- Strongest heroic fantasy.
- Advanced tower synergies.
- Powerful heroes.
- Larger beautiful maps.
- Elite enemies and major battles.

Map visuals:

- Castles.
- Monasteries.
- Vardzia cliffs.
- Golden skies.
- Prosperous roads and fortified passes.

## 18.6 Era 4 — Mongol Catastrophe

Period: approximately 1225 to 1500 AD.

Themes:

- Mongol invasion.
- Queen Rusudan.
- Chormaqan.
- George V the Brilliant.
- Timur’s invasions.
- Fragmentation.

Gameplay identity:

- Survival pressure.
- Evacuation objectives.
- Overwhelming cavalry.
- Damaged infrastructure.
- Bosses that alter the map.

Map visuals:

- Burned villages.
- Mountain redoubts.
- Broken roads.
- Ruined towers.
- Temporary restoration under George V.

## 18.7 Era 5 — Between Empires

Period: approximately 1500 to 1801 AD.

Themes:

- Ottoman/Persian struggle.
- Fragmented kingdoms.
- Vakhtang VI.
- Erekle II.
- Treaty of Georgievsk.
- Krtsanisi.

Gameplay identity:

- Gunpowder introduction.
- Multiple enemy styles.
- Betrayal/last stand maps.
- Strong defensive drama.

Map visuals:

- Kartli/Kakheti/Imereti.
- Tbilisi under threat.
- Persian and Ottoman visual influences.
- Early gunpowder emplacements.

## 18.8 Era 6 — Russian Empire

Period: 1801 to 1918 AD.

Themes:

- Annexation.
- Loss of church autocephaly.
- Georgian national awakening.
- Ilia Chavchavadze.
- Pyotr Bagration.
- Railways and modernization.

Gameplay identity:

- Industrial technology begins.
- Artillery and barricades.
- Urban maps.
- Cultural resistance.

Map visuals:

- Imperial-era Tbilisi.
- Railways.
- Mountain forts.
- Black Sea port cities.

## 18.9 Era 7 — First Democratic Republic

Period: 1918 to 1921 AD.

Themes:

- Independence.
- Democratic constitution.
- Multi-front war.
- British presence.
- Bolshevik invasion.
- Noe Jordania.

Gameplay identity:

- Multi-front defense.
- Limited resources.
- Early modern weapons.
- Short but intense campaign arc.

Map visuals:

- Tbilisi.
- Border regions.
- Republic banners.
- Defensive lines.

## 18.10 Era 8 — Soviet Century

Period: 1921 to 1991 AD.

Themes:

- Soviet occupation.
- 1924 uprising.
- Stalin as historical context, not hero.
- Great Purge.
- WWII.
- 1956 Tbilisi Massacre.
- 1978 language protests.
- 1989 tragedy.
- Independence movement.

Gameplay identity:

- Heavy, serious tone.
- Concrete bunkers.
- Resistance and survival.
- Carefully handled historical content.

Map visuals:

- Soviet-era Tbilisi.
- Industrial zones.
- Mountain resistance areas.
- Concrete and red banners used carefully, not glorified.

## 18.11 Era 9 — Modern Georgia

Period: 1991 to present.

Themes:

- Independence.
- Civil conflict.
- Abkhazia and South Ossetia.
- Rose Revolution.
- 2008 war.
- Modern Euro-Atlantic aspirations.
- Contemporary political sensitivity.

Gameplay identity:

- Modern defensive systems.
- Drones/scouts.
- Armored enemies.
- Multiple entrances.
- High-stakes final maps.

Map visuals:

- Modern Tbilisi.
- Mountain roads.
- Checkpoints.
- Drone platforms.
- Fortified outposts.

Modern political representation must be careful and not simplistic.

---

# 19. Progression System

## 19.1 Progression Philosophy

Progression should be the game’s long-term engine. Players should constantly unlock new decisions, not just bigger numbers.

Progression pillars:

1. Campaign stars.
2. Tower Academy.
3. Hero Training.
4. Map Power upgrades.
5. Scrolls and mastery.
6. Hero and tower unlocks.
7. Skins/cosmetics.
8. Challenge modes.
9. SAKART economy.

## 19.2 Star System

Each level awards 1–3 stars.

Possible structure:

- 1 star: survive all waves.
- 2 stars: survive with enough lives remaining.
- 3 stars: survive with high lives, strong time/resource performance, or level-specific condition.

Stars unlock:

- Next levels.
- Academy upgrades.
- Map powers.
- Hero training resources.
- Challenge levels.

## 19.3 Era Unlocks

Eras unlock chronologically.

Recommended:

- Complete enough levels/stars in current era to unlock next era.
- Boss level must be cleared to finish an era.
- Optional challenge levels provide extra stars and rewards.

## 19.4 Player Level

The player account can have an overall level based on campaign progress.

Player level unlocks:

- Additional map power slot.
- Scroll loadout slot.
- Academy tier access.
- Challenge modes.
- Cosmetic features.

## 19.5 Difficulty Modes

- Story.
- Normal.
- Veteran.
- Heroic.
- Iron/Challenge.

Higher difficulty can reward more non-SAKART resources, cosmetics, achievements, and prestige, but SAKART distribution must be controlled to avoid farming exploits.

---

# 20. Scrolls and Mastery

## 20.1 Scroll Philosophy

Scrolls should support buildcraft. They should not be random clutter and should not become mandatory pay-to-win items.

There are two main scroll categories:

1. Standard Scrolls — earned, limited-use or temporary effects.
2. Mastery Scrolls — permanent passive NFT-style bonuses, tradeable, capped for balance.

## 20.2 Standard Scrolls

Standard scrolls can be earned through:

- 3-star level completion.
- Challenge levels.
- Daily/weekly rewards.
- In-game currency shop.
- Events.

Standard scrolls should not require SAKART for normal use.

Possible standard scroll types:

- Temporary archer damage boost.
- Temporary hero HP boost.
- One-level wall durability boost.
- Starting gold bonus for one level.
- Map power cooldown reduction for one level.

However, standard scrolls should not feel like painful consumables. Use them carefully.

## 20.3 Mastery Scrolls

Mastery Scrolls are permanent passive bonuses. They are activated in the pre-level loadout and last for the level.

Rules:

- A mastery scroll type can be equipped once.
- Copies stack up to 3.
- 1 copy = 3% bonus.
- 2 copies = 6% bonus.
- 3 copies = 9% bonus.
- Bonuses must be capped.
- Mastery scrolls are tradeable if implemented as NFTs.
- Mastery scrolls should enhance strategy without breaking balance.

Examples:

- Archer Tower Mastery: Archer damage +3/6/9%.
- Hero Vitality Mastery: Hero HP +3/6/9%.
- Fortification Mastery: Wall durability +3/6/9%.
- Siege Mastery: Catapult splash +3/6/9%.
- Militia Mastery: Militia duration +3/6/9%.
- Builder Mastery: Build speed +3/6/9%.
- Map Power Mastery: selected map power cooldown -3/6/9%.

## 20.4 Scroll Loadout Slots

Players should not equip unlimited scrolls.

Recommended:

- Start with 1 mastery slot.
- Unlock 2nd slot through campaign progress.
- Unlock 3rd slot later.
- Special challenge modes may limit slots.

## 20.5 No SAKART Boost Scroll

There must be no scroll that increases SAKART rewards.

Reason:

- Prevents economic exploits.
- Prevents pay-to-earn imbalance.
- Keeps token distribution predictable.

## 20.6 Scroll Crafting and Forging

Future system:

- Combine standard scroll fragments into scrolls.
- Forge mastery scrolls from rare materials.
- Upgrade mastery stack by owning copies.
- Burn SAKART for certain forging actions or rerolls.

SAKART burn must be carefully balanced.

---

# 21. SAKART Token Economy

## 21.1 Token Philosophy

SAKART should support long-term ownership and progression without damaging gameplay fairness.

The game should be fun without understanding SAKART. Players who care about ownership and economy can engage more deeply.

## 21.2 SAKART Earning

SAKART should be earned primarily through controlled one-time achievements, not unlimited farming.

Possible earning sources:

- First-time star rewards.
- Era completion.
- Challenge milestones.
- Seasonal achievements.
- PvP season placement.
- Special events.

Replay farming should not mint unlimited SAKART.

## 21.3 SAKART Sinks

Good SAKART sinks:

- Skin binding/unbinding.
- Cosmetic crafting.
- Mastery scroll forging.
- Advanced Academy branch unlocks.
- Hero prestige unlocks.
- Respec costs.
- Marketplace fees.
- Tournament entry where appropriate.
- Name/banner customization.

Bad SAKART sinks:

- Required battle consumables.
- Pay-to-win campaign progression.
- SAKART reward boosters.
- Mandatory wallet fees for basic play.

## 21.4 Permanent Progression and SAKART

Recommended model:

- Early progression uses stars and in-game resources.
- SAKART appears later for optional mastery, prestige, cosmetics, scroll economy, and respecs.
- A player can finish the campaign without buying SAKART.
- A dedicated player can use SAKART to deepen buildcraft and ownership.

## 21.5 Consumables Policy

Consumables are not forbidden, but they are not a core pillar.

If consumables exist:

- They must be earnable through gameplay.
- They must not be required to win campaign levels.
- Leaderboards must separate consumable-assisted runs.
- PvP should ban or normalize them.
- SAKART-bought consumables should be avoided unless very carefully designed.

Current recommendation: prioritize permanent map power upgrades over consumables.

---

# 22. Skins, Cosmetics, and Binding

## 22.1 Cosmetic Philosophy

Skins should be desirable but not gameplay-changing.

Skins can change:

- Tower appearance.
- Hero appearance.
- Map power visual effect.
- Projectile appearance.
- UI banner.
- Victory animation.

Skins should not change stats.

## 22.2 Era Skins

Every tower type should have default era skins so the same tower role visually adapts through history.

Example Archer Tower:

- Era 0: Colchian wooden watchtower.
- Era 1: Iberian stone platform.
- Era 3: Golden Age castle archer tower.
- Era 5: Early modern palisade/musket platform.
- Era 9: Modern defensive outpost.

## 22.3 Premium Skins

Premium skins can be:

- Earned in challenge modes.
- Purchased or traded.
- Event rewards.
- Crafted from cosmetic materials.

Premium skins must preserve readability.

## 22.4 Binding and Unbinding

When equipped, a skin can become bound. Unbinding costs a small amount of SAKART. This creates an economy sink and discourages constant speculative flipping.

Rules:

- Common skins: low unbind fee.
- Rare skins: moderate unbind fee.
- Legendary skins: higher unbind fee.
- Bound status must be clear in UI.

---

# 23. Art Direction and Production Pipeline

## 23.1 Visual Target

Sakartvelo Defenders should look like a living historical diorama: stylized, readable, colorful, and culturally specific.

The style should draw from:

- Georgian history books.
- Museum dioramas.
- Georgian architecture.
- Medieval Georgian manuscript and miniature inspiration.
- Real landscapes of the Caucasus.
- Clear modern tower defense readability.

Avoid:

- Generic fantasy assets.
- Generic mobile game plastic look.
- Overly realistic military simulation.
- Neon crypto visuals.
- Visual clutter that hides gameplay.

## 23.2 Updated v5 Production Pipeline

The old “AI reference → Blender → 2D sprites → Godot” pipeline is deprecated as the primary source of truth.

The v5 pipeline is:

1. Historical research and reference collection.
2. Image concept creation or reference image selection.
3. Meshy AI generation from pictures or text where useful.
4. Manual cleanup, retopology, decimation, or optimization if needed.
5. Material styling to match era palette and game readability.
6. Export/import as GLB or game-ready asset.
7. Integrate into Three.js/WebGL scene.
8. Validate silhouette, scale, animation, and performance.
9. Test in actual gameplay camera, not only model viewer.

## 23.3 Meshy AI Rules

Meshy AI can be used, but it must not decide the game’s art direction by itself.

Rules:

- Meshy output is a starting point, not automatically final.
- Historical/cultural accuracy must be reviewed.
- Silhouette must be readable from gameplay camera.
- Polycount must be acceptable for mobile WebGL.
- Textures/materials must be optimized.
- Weird geometry must be cleaned or hidden.
- Asset must match era palette and visual style.

## 23.4 Asset Optimization Rules

Every gameplay asset must be tested for:

- Polycount.
- Draw calls.
- Texture size.
- Animation size.
- Loading time.
- Mobile performance.
- Visual readability.

Use instancing for repeated props where possible.

## 23.5 Readability Rules

- Enemy silhouettes must be distinct.
- Flying enemies must be visibly elevated.
- Towers must be recognizable by shape.
- Build plinths must be visible but not ugly.
- Map powers must have strong but short visual effects.
- Boss effects must not hide enemy health or path.
- UI must not cover key battlefield areas.

## 23.6 Era Palette Philosophy

- Era 0: earthy greens, bronze, gold, river blue.
- Era 1: stone, wine red, early Christian ivory, Armazi gold.
- Era 2: dusty fortress tones, monastery warm lights, invasion smoke.
- Era 3: deep green, gold, red, warm stone, prosperous skies.
- Era 4: ash, cold brown, dark red, broken stone.
- Era 5: Persian/Ottoman textile accents, gunpowder smoke, Kartli/Kakheti earth.
- Era 6: imperial stone, railway iron, muted civic colors.
- Era 7: democratic republic banners, early modern uniforms, muted battlefield tones.
- Era 8: concrete gray, Soviet red used carefully, cold industrial colors.
- Era 9: modern military green, asphalt, steel, blue-gray, digital accents.

---

# 24. Audio Direction

## 24.1 Music

Music should support era identity:

- Ancient Colchis: drums, flutes, mysterious river/forest feeling.
- Iberia: solemn strings, early sacred tones.
- Age of Invasions: tense percussion, resilience themes.
- Golden Age: heroic Georgian-inspired orchestration.
- Mongol Catastrophe: dark, sparse, heavy drums.
- Between Empires: tense blend of Georgian, Persian, Ottoman atmosphere.
- Russian Empire: imperial military hints plus Georgian melancholy.
- First Republic: hopeful but fragile.
- Soviet Century: heavy, cold, restrained.
- Modern Georgia: cinematic, tense, resilient.

## 24.2 Sound Effects

Important SFX:

- Build start.
- Build complete.
- Hero move command.
- Hero death.
- Hero respawn.
- Tower upgrade.
- Wave horn.
- Enemy entrance warning.
- Boss arrival.
- Map power cast.
- Wall hit/break.
- Flying enemy warning.

## 24.3 Voice and Narration

Narration can be used for historical moments, but should not interrupt combat too much.

Best places:

- Level intro.
- Era intro.
- Boss intro.
- Victory screen.
- Codex entries.

---

# 25. Educational System

## 25.1 Philosophy

Education should be organic. The game should teach history through play, map setting, heroes, enemies, and short readable cards.

Do not overload the player with long text during combat.

## 25.2 Historical Cards

After winning a level, show a short historical card:

- Title.
- 2–4 sentences.
- Why it matters.
- Optional “learn more” button.

## 25.3 Codex

The Codex stores unlocked history:

- Eras.
- Heroes.
- Enemies.
- Locations.
- Battles.
- Mythology.
- Architecture.
- Language/script.
- Culture and daily life.

## 25.4 Accuracy Policy

Historical claims must be checked. If a topic is debated, present it as debated. Do not invent historical figures. Do not simplify modern conflicts into misleading propaganda.

For sensitive modern events, write factual, careful, neutral educational text while still respecting Georgian suffering and territorial realities.

---

# 26. PvP and Competitive Modes

## 26.1 PvP Philosophy

PvP should not be the first priority. The campaign and core gameplay must be excellent first.

If added, PvP should avoid pay-to-win.

## 26.2 Asynchronous PvP

Recommended format:

- Player sets defense/loadout.
- Opponent attacks asynchronously.
- Score based on lives, time, enemies defeated, and objective health.

## 26.3 PvP Balance Rules

- Consumables banned or separated.
- Upgrade brackets or normalized stats.
- Clear matchmaking.
- No hidden paid advantages.
- Scroll effects capped.

## 26.4 PvP Loadout

PvP loadout can include:

- Hero.
- Tower set.
- Map powers.
- Mastery scrolls.
- Defensive layout if mode supports it.

---

# 27. Survival, Seasons, and Endgame

## 27.1 Survival Mode

Survival mode sends endless or long-form waves.

Purpose:

- Test builds.
- Earn non-inflationary rewards.
- Compete on leaderboards.
- Use deep progression.

Rewards:

- Cosmetics.
- Scroll fragments.
- Prestige points.
- Seasonal rank.

SAKART rewards must be controlled.

## 27.2 Seasons

Seasons can refresh goals without resetting core progress.

Season content:

- Special map modifiers.
- New cosmetics.
- Limited challenge levels.
- Leaderboards.
- New scrolls.
- Hero skins.

## 27.3 Endgame

Endgame should include:

- Heroic/iron versions of old levels.
- Era challenge towers.
- Boss rush.
- Survival leaderboards.
- Seasonal maps.
- Buildcraft challenges.
- Scroll mastery collection.

---

# 28. Blockchain Integration

## 28.1 Invisible Blockchain Philosophy

The player should not feel like they are using a blockchain app during normal play.

Rules:

- Wallet connection optional for early campaign.
- Blockchain prompts only when needed.
- Clear user explanations.
- No crypto jargon during battle.
- No transaction required to start a normal level.

## 28.2 On-Chain Candidates

Potential on-chain assets:

- SAKART token.
- Premium skins.
- Mastery scrolls.
- Rare cosmetics.
- Seasonal trophies.

## 28.3 Off-Chain Candidates

Keep these off-chain or local/server-managed unless needed:

- Moment-to-moment battle state.
- Basic campaign progress.
- Basic upgrades.
- Temporary standard scrolls.
- Settings.
- Tutorial state.

## 28.4 Chain Outage Fallback

If blockchain systems are unavailable:

- Campaign remains playable.
- Local progress continues.
- Blockchain actions queue or become unavailable with clear message.
- Player is not kicked out of gameplay.

---

# 29. Monetization and Fairness

## 29.1 Acceptable Monetization

- Cosmetic skins.
- Marketplace fees.
- Optional battle pass/season cosmetics.
- SAKART sinks for prestige, forging, unbinding, respecs.
- Non-pay-to-win convenience.

## 29.2 Avoid

- Required consumables.
- Paid-only power needed to beat levels.
- SAKART reward boosters.
- Aggressive wallet prompts.
- Gacha systems that hide gameplay power.
- PvP paid advantage.

## 29.3 Player Trust Rule

If a player loses, they should think:

> I can improve my strategy, hero use, tower placement, upgrades, or timing.

They should not think:

> I lost because I did not spend enough.

---

# 30. Implementation Roadmap

## Phase 1 — Lock v5 Core Direction

Goals:

- Landscape-only game direction.
- Preserve hero-builder mechanics.
- Clean HUD for landscape.
- Keep current build circle and slow-motion flow.
- Document current systems.

## Phase 2 — Enemy Formation Improvement

Goals:

- Add lane offsets.
- Prevent single-file enemy trains.
- Add formation settings to waves if possible.
- Ensure tower targeting still works.
- Keep flying enemy clarity.

## Phase 3 — Bigger Landscape Maps

Goals:

- Improve camera panning and zoom.
- Create larger test map.
- Ensure build plinths and UI remain readable.
- Add entrance warnings.
- Keep pacing fast with speed controls and early wave start.

## Phase 4 — Multi-Entrance Path System

Goals:

- Replace single path with path list.
- Add path IDs to enemy waves.
- Support entrances opening by wave.
- Add visual entrance markers.
- Add boss gate event prototype.

## Phase 5 — Academy Prototype

Goals:

- Create Academy screen.
- Add 2–3 upgrade branches.
- Store upgrades.
- Apply upgrades in battle.
- Test balance.

First Academy branches:

- Archer damage/range/anti-air.
- Wall durability/build speed.
- Construction/assistant builder preview.

## Phase 6 — Hero Training Prototype

Goals:

- Hero XP/leveling.
- Hero training screen.
- Build speed upgrade.
- HP upgrade.
- Ability cooldown upgrade.
- One unique hero branch.

## Phase 7 — Map Powers System

Goals:

- Define map power loadout.
- Upgrade Call Militia.
- Add Stonefall.
- Add cooldown UI.
- Add targeting mode.

## Phase 8 — Scroll Loadout

Goals:

- Add mastery scroll loadout screen.
- Implement simple +3% bonuses.
- Cap stacking.
- Add scroll reward/crafting placeholder.

## Phase 9 — Art Pipeline Upgrade

Goals:

- Formalize Meshy-to-GLB pipeline.
- Define asset budget.
- Update style guide.
- Replace weak procedural placeholders gradually.

## Phase 10 — Era Expansion

Goals:

- Expand Era 0 with polished levels.
- Add Era 1 mechanics.
- Add additional heroes.
- Add boss variety.

---

# 31. First Playable v5 Vertical Slice

The first v5 proof should not attempt 200 levels. It should create one excellent slice.

## 31.1 Required Features

- Landscape-only battle.
- One polished Era 0 or Era 3 map.
- Hero-builder construction.
- Build circle with slow motion.
- Archer, catapult, wall.
- Friendly infantry map power.
- Stonefall or Fire of Amirani map power.
- 5–8 waves.
- Enemy lane offsets.
- One flying enemy wave.
- One mini-boss.
- Victory/defeat screen.
- 3-star rating.
- One historical card.
- One small Academy upgrade.
- One hero training upgrade.

## 31.2 Success Criteria

The vertical slice succeeds if:

- The hero feels fun to move.
- Building through the hero feels natural, not annoying.
- Enemies look like groups, not a single line.
- The map is readable in landscape.
- The player has meaningful choices.
- The game is beatable without consumables.
- Upgrades make the player want to play another round.

---

# 32. Design Risks and Solutions

## 32.1 Risk: Hero-Builder Becomes Annoying

Solution:

- Keep build times short.
- Add build speed upgrades.
- Add assistant builders later.
- Make hero movement responsive.
- Avoid huge maps too early.

## 32.2 Risk: Maps Become Too Big and Slow

Solution:

- Speed controls.
- Early wave start bonus.
- Camera jump warnings.
- Entrances open over time.
- Keep first contact timing reasonable without spawning enemies artificially close to the exit.

## 32.3 Risk: Too Much Progression Complexity

Solution:

- Unlock systems gradually.
- Start with simple upgrades.
- Add depth over eras.
- Use recommended builds for casual players.
- Keep advanced buildcraft optional.

## 32.4 Risk: SAKART Feels Pay-to-Win

Solution:

- No required consumables.
- No SAKART boost scroll.
- Campaign beatable through play.
- Competitive modes normalize power.
- SAKART used for cosmetics, mastery, respecs, and prestige.

## 32.5 Risk: Meshy Assets Look Inconsistent

Solution:

- Strict asset review.
- Style palette pass.
- Optimization pass.
- Silhouette check.
- In-game camera test.

## 32.6 Risk: Historical Inaccuracy

Solution:

- Use existing historical reference document.
- Verify named figures.
- Mark debated claims as debated.
- Avoid invented historical names.
- Treat modern conflicts carefully.

---

# 33. Glossary

## Hero-Builder

The core system where the hero physically moves to build and upgrade towers.

## Build Plinth

Fixed construction spot where normal towers can be built.

## Wall Slot

Fixed or approved path-blocking location where walls/barriers can be built.

## Map Power

Permanent cooldown-based battlefield ability chosen before a level.

## Hero Training

Progression tree for individual heroes.

## Tower Academy

Permanent tower/system upgrade hub.

## Mastery Scroll

Passive scroll bonus, capped at 3/6/9% based on copies.

## SAKART

Game token used for controlled economy, cosmetics, mastery, prestige, respecs, and sinks.

## Era

One chronological period of Georgian history represented by levels, heroes, enemies, and art style.

---

# 34. Final v5 Design Statement

Sakartvelo Defenders is no longer just a historical tower defense concept. It is now a landscape-only hero-builder tower defense game with a distinctive mechanical identity.

The player commands a hero directly. The hero builds towers, upgrades defenses, fights enemies, and changes the battlefield. Maps are wide, readable, and historically themed. Towers are placed on fixed construction plinths, while walls use controlled durability slots. Enemies move in formations across wide paths instead of single-file lines. Map powers provide tactical drama. Outside battle, the player grows through Hero Training, Tower Academy upgrades, Map Power progression, Mastery Scrolls, skins, and carefully controlled SAKART systems.

The game should learn from Kingdom Rush’s clarity, but it should not become a clone. Its identity is Georgian history plus hero-builder interaction plus deep progression.

The guiding sentence for all future design is:

> Build a beautiful, readable, landscape-only Georgian tower defense game where the hero is the builder, every upgrade choice matters, and blockchain ownership stays invisible until the player wants it.
