# Changelog

## 2026-04-22

### Bug Fix: Begin button skipped era lore screen

**Bug:** Clicking "Begin" jumped directly to gameplay HUD (gold/lives/wave UI) instead of showing the era 0 lore screen with narration. Audio played but screen was invisible.

**Root cause:** `ScreenManager._showScreen()` set `style.display = 'none'` on ALL `.intro-overlay` elements via inline style, then added `.visible` class to the target. Inline `display: none` overrides CSS class `display: flex` (from `.intro-overlay.visible`).

**Fix:** Clear the inline `display` on the target element so CSS class wins:
```ts
private _showScreen(id: string): void {
  document.querySelectorAll('.intro-overlay').forEach(el => {
    (el as HTMLElement).style.display = 'none';
    el.classList.remove('visible');
  });
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('visible');
    el.style.display = '';  // ← this was missing
  }
}
```

**Lesson learned:** When user says "X doesn't work" — believe them. Don't spend 5 hours proving the code is correct. Read the code, find the bug. Inline CSS always beats CSS class rules.

**Commits:**
- `fa54452` fix: clear inline display:none so CSS visible class shows era screen
- `d1b1ee2` cleanup: remove stray ScreenManager.ts at project root

---

## Earlier history
- Phase 2 refactor completed: -34K deletions, levels.json 673KB→293KB
- Game deployed at: https://sakartvelo-defenders-game.vercel.app (NOT the marketing site)
