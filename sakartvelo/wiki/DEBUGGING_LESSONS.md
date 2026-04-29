# Debugging Lessons

## Never say "the code is correct"

When user reports a bug: **believe them**. The code is never correct when the user says it doesn't work.

## April 22 2026 — Inline style vs CSS class precedence

**Symptom:** Begin button played audio but didn't show the era lore screen. Gameplay HUD appeared instead.

**Wrong approach:** Check git history, CI builds, Vercel caching, wrong deploy URL. (5 hours wasted.)

**Right approach:** Read `_showScreen()` in ScreenManager.ts. Find that it sets `style.display = 'none'` on all overlays then adds `.visible` class. Inline styles override CSS class rules.

**Rule:** Inline `style.display = 'none'` always beats `.visible { display: flex }` from CSS.

## Git Workflow for Deploying

1. Edit source in `~/hermes-workspace/hermes/development/sakartvelo-3d/`
2. `npm run build` — verify clean build
3. `rsync` dist/, index.html, src/ to `/tmp/sakartvelo-defenders-game/hermes/development/sakartvelo-3d/`
4. `git add -A && git commit -m "description" && git push` to `git@github.com:socraticblock/sakartvelo-defenders-game.git`
5. Wait for CI pass (check `curl -s "https://api.github.com/...actions/runs?per_page=1"`)
6. Verify deployed bundle hash matches: `curl -s "$URL/" | grep "index-"`

## CI Fixes Applied

- **pnpm → npm:** GitHub Actions workflow was using pnpm but no lock file. Changed to npm install.
- **Wrong directory:** CI ran at repo root instead of `hermes/development/sakartvelo-3d/`. Fixed with `cd` in each step.
