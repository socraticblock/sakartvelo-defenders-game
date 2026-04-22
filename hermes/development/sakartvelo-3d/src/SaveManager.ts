/**
 * SaveManager — localStorage persistence for Sakartvelo Defenders
 * Handles: stars per level, era unlocks, scroll inventory, best times
 */

const SAVE_KEY = 'sakartvelo_defenders_v1';

export interface SaveData {
  version: number;
  /** eraN_levelM → 1|2|3 */
  starsPerLevel: Record<string, number>;
  /** eraN_levelM → true (level was completed at least once) */
  completedLevels: Record<string, boolean>;
  /** era index → true (era unlocked) */
  unlockedEras: Record<string, boolean>;
  /** Scroll type → count */
  scrollInventory: Record<string, number>;
  /** eraN_levelM → best time in seconds */
  bestTimes: Record<string, number>;
  /** Total stars earned */
  totalStars: number;
}

const DEFAULT_SAVE: SaveData = {
  version: 1,
  starsPerLevel: {},
  completedLevels: {},
  unlockedEras: { 'era0': true }, // Era 0 always unlocked
  scrollInventory: {},
  bestTimes: {},
  totalStars: 0,
};

function loadRaw(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    return { ...DEFAULT_SAVE, ...JSON.parse(raw) } as SaveData;
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

function persist(data: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

// ─── Public API ────────────────────────────────────────────

export const SaveManager = {
  /** Load full save data */
  load(): SaveData {
    return loadRaw();
  },

  /** Overwrite entire save (e.g., "New Game") */
  reset(): void {
    localStorage.removeItem(SAVE_KEY);
  },

  /**
   * Record level completion.
   * Only upgrades star count, never downgrades.
   */
  completeLevel(levelId: string, stars: number, time?: number): void {
    const save = loadRaw();

    const prev = save.starsPerLevel[levelId] || 0;
    if (stars > prev) {
      save.starsPerLevel[levelId] = stars;
      // Recalculate total
      save.totalStars = Object.values(save.starsPerLevel).reduce((a, b) => a + b, 0);
    }

    save.completedLevels[levelId] = true;

    // Best time
    if (time !== undefined) {
      const prevTime = save.bestTimes[levelId];
      if (prevTime === undefined || time < prevTime) {
        save.bestTimes[levelId] = time;
      }
    }

    // Unlock next level
    const nextLevel = nextLevelId(levelId);
    if (nextLevel) save.completedLevels[nextLevel] = true;

    persist(save);
  },

  /**
   * Check if an era is unlocked.
   * Era 0 always unlocked.
   * Era N requires 15+ stars from Era N-1.
   */
  isEraUnlocked(era: number): boolean {
    if (era === 0) return true;
    const save = loadRaw();
    return save.unlockedEras[`era${era}`] === true;
  },

  /**
   * Try to unlock an era. Returns true if newly unlocked.
   */
  tryUnlockEra(era: number): boolean {
    const save = loadRaw();
    if (save.unlockedEras[`era${era}`]) return false;

    // Count stars from previous era
    const prevEra = era - 1;
    let prevStars = 0;
    for (let lvl = 1; lvl <= 20; lvl++) {
      prevStars += save.starsPerLevel[`era${prevEra}_level${lvl}`] || 0;
    }

    if (prevStars >= 15) {
      save.unlockedEras[`era${era}`] = true;
      persist(save);
      return true;
    }
    return false;
  },

  /** Get stars for a specific level (0 if never played) */
  getStars(levelId: string): number {
    return loadRaw().starsPerLevel[levelId] || 0;
  },

  /** Get total stars */
  getTotalStars(): number {
    return loadRaw().totalStars;
  },

  /** Check if level was completed at least once */
  isCompleted(levelId: string): boolean {
    return loadRaw().completedLevels[levelId] === true;
  },

  /** Check if next level in sequence is unlocked */
  isNextUnlocked(currentLevelId: string): boolean {
    const next = nextLevelId(currentLevelId);
    if (!next) return true; // No next level
    return loadRaw().completedLevels[next] === true;
  },

  /**
   * Check if a chapter is unlocked within an era.
   * chapter 0 = levels 1-5, chapter 1 = levels 6-20, etc.
   * Chapter 0 always unlocked.
   * Subsequent chapters require the last level of the previous chapter to be completed.
   */
  isChapterUnlocked(era: number, chapter: number): boolean {
    if (chapter === 0) return true;
    const prevChapterLastLevel = chapter * 20; // chapter 1 → level 20... wrong
    // Actually: Chapter 0 = levels 1-5, Chapter 1 = levels 6-20
    // Chapter N's first level = N * 20 + 1... but we have only 20 levels per era
    // For era 0: chapters are 1-5 and 6-20
    // chapter 0 = level 5 completed needed
    // chapter 1 = level 5 completed needed (all era 0 shares same "chapter I completion")
    if (era === 0) {
      const save = loadRaw();
      return save.completedLevels[`era0_level5`] === true;
    }
    return this.isEraUnlocked(era);
  },

  // ─── Scroll inventory ──────────────────────────────────

  addScroll(type: string, count: number = 1): void {
    const save = loadRaw();
    save.scrollInventory[type] = (save.scrollInventory[type] || 0) + count;
    persist(save);
  },

  useScroll(type: string): boolean {
    const save = loadRaw();
    const count = save.scrollInventory[type] || 0;
    if (count <= 0) return false;
    save.scrollInventory[type] = count - 1;
    persist(save);
    return true;
  },

  getScrollCount(type: string): number {
    return loadRaw().scrollInventory[type] || 0;
  },

  // ─── Helpers ──────────────────────────────────────────

  /** Parse "eraN_levelM" → { era, level } */
  parseLevelId(id: string): { era: number; level: number } | null {
    const m = id.match(/^era(\d+)_level(\d+)$/);
    if (!m) return null;
    return { era: parseInt(m[1]), level: parseInt(m[2]) };
  },

  /** Build level ID string */
  levelId(era: number, level: number): string {
    return `era${era}_level${level}`;
  },
};

// ─── Internal helpers ──────────────────────────────────────

function nextLevelId(currentId: string): string | null {
  const parsed = SaveManager.parseLevelId(currentId);
  if (!parsed) return null;
  const { era, level } = parsed;
  if (level < 20) {
    return SaveManager.levelId(era, level + 1);
  }
  // Level 20 → next era, level 1
  return SaveManager.levelId(era + 1, 1);
}
