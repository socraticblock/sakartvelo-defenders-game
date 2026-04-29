# Sakartvelo Defenders — Wiki

## Project Overview
Era 0: Ancient Colchis — Georgian tower defense game built with Three.js.

**Repository:** `socraticblock/sakartvelo-defenders-game`
**Deployed:** https://sakartvelo-defenders.vercel.app
**Stack:** Three.js, TypeScript, Vite, Vercel

## Era Map (10 Eras, 200 Levels)
| Era | Name | Period | Levels |
|-----|------|--------|--------|
| 0 | Ancient Colchis | ~1500–100 BC | 20 (Chapter I: Bronze Age, Chapter II: Kingdom of Colchis) |
| 1 | Kingdom of Iberia | ~300 BC–630 AD | 20 |
| 2 | Age of Invasions | 630–1089 AD | 20 |
| 3 | Georgian Golden Age | 1089–1225 AD | 20 |
| 4 | Mongol Catastrophe | 1225–1500 AD | 20 |
| 5 | Between Empires | 1500–1801 AD | 20 |
| 6 | Russian Empire | 1801–1918 | 20 |
| 7 | First Republic | 1918–1921 | 20 |
| 8 | Soviet Century | 1921–1991 | 20 |
| 9 | Modern Georgia | 1991–Present | 20 |

## Wiki Sections
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Current codebase structure, all files and their responsibilities
- **[CODING_STANDARDS.md](CODING_STANDARDS.md)** — 300-line rule, naming conventions, data file format
- **[PHASE2_REFACTOR_SPEC.md](PHASE2_REFACTOR_SPEC.md)** — Phase 2 refactor plan and execution log
- **[FILE_MAP.md](FILE_MAP.md)** — Quick reference: file → responsibility → line count

## Quick Facts
- **200 levels**, 1,340 waves per level, 2,247 enemy entries per wave
- **Tower types:** Archer, Catapult, Wall
- **Enemy archetypes:** Infantry, Cavalry, Wolf, Siege Ram, Boss
- **Hero:** Medea — 3 abilities (Colchian Poison, War Chant, Colchian Fire)
- **4,329 lines TypeScript** written (as of Phase 2 refactor)
- **Zero files over 300 lines** — enforced by pre-commit hook
- **No Godot** — game is Three.js, not Godot
