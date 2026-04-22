/**
 * LevelSelect — Level select screen for Sakartvelo Defenders
 * Era 0: Shows all 20 levels in two chapters:
 *   Chapter I: Bronze Age (~1500–600 BC) — levels 1-5, warm bronze tint
 *   Chapter II: Kingdom of Colchis (~600–100 BC) — levels 6-20, cooler tint
 * Era 1+: Shows 5 levels per era as before
 */

import { SaveManager } from './SaveManager';
import { LevelData } from './types';

// ─── Styles ────────────────────────────────────────────────

const CSS = `
  #level-select {
    font-family: 'Georgia', serif;
  }
  .ls-chapter-header {
    text-align: center;
    margin: 24px 0 14px;
    color: #7a8a6a;
    font-size: 12px;
    letter-spacing: 3px;
    text-transform: uppercase;
  }
  .ls-chapter-header:first-child {
    margin-top: 8px;
  }
  .ls-chapter-divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #3a5a3a 30%, #3a5a3a 70%, transparent);
    margin-bottom: 18px;
  }
  .ls-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    margin-bottom: 28px;
  }
  .ls-card {
    background: rgba(45, 90, 61, 0.25);
    border: 2px solid #3a5a3a;
    border-radius: 10px;
    padding: 14px 6px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }
  .ls-card:hover:not(.ls-locked) {
    border-color: #d4a017;
    background: rgba(212, 160, 23, 0.1);
    transform: translateY(-2px);
  }
  .ls-card.ls-completed {
    border-color: #d4a017;
    background: rgba(212, 160, 23, 0.12);
  }
  .ls-card.ls-locked {
    opacity: 0.42;
    cursor: not-allowed;
    border-color: #2a2a2a;
  }
  .ls-card.ls-next {
    border-color: #d4a017;
    box-shadow: 0 0 12px rgba(212, 160, 23, 0.4);
    animation: ls-pulse 2s ease-in-out infinite;
  }
  @keyframes ls-pulse {
    0%, 100% { box-shadow: 0 0 12px rgba(212, 160, 23, 0.4); }
    50% { box-shadow: 0 0 20px rgba(212, 160, 23, 0.7); }
  }
  .ls-num {
    font-size: 22px;
    font-weight: bold;
    color: #d4a017;
    margin-bottom: 4px;
  }
  .ls-stars {
    font-size: 14px;
    letter-spacing: 2px;
  }
  .ls-stars-completed { color: #d4a017; }
  .ls-stars-empty { color: #444; }
  .ls-name {
    font-size: 10px;
    color: #8a7a5a;
    margin-top: 3px;
    line-height: 1.3;
  }
  /* Chapter I: warm bronze tint */
  .ls-chapter-bronze .ls-card {
    background: rgba(100, 65, 20, 0.2);
    border-color: #5a4020;
  }
  .ls-chapter-bronze .ls-card:hover:not(.ls-locked) {
    background: rgba(130, 90, 30, 0.25);
    border-color: #c09040;
  }
  .ls-chapter-bronze .ls-card.ls-completed {
    background: rgba(100, 70, 20, 0.28);
    border-color: #c09040;
  }
  .ls-chapter-bronze .ls-num { color: #c09040; }
  /* Chapter II: cooler steel tint */
  .ls-chapter-steel .ls-card {
    background: rgba(30, 50, 70, 0.25);
    border-color: #2a3a4a;
  }
  .ls-chapter-steel .ls-card:hover:not(.ls-locked) {
    background: rgba(40, 60, 85, 0.3);
    border-color: #4a6a8a;
  }
  .ls-chapter-steel .ls-card.ls-completed {
    background: rgba(35, 55, 75, 0.3);
    border-color: #4a6a8a;
  }
  .ls-chapter-steel .ls-num { color: #7a9aaa; }
`;

// ─── State ────────────────────────────────────────────────

let onSelect: ((era: number, level: number) => void) | null = null;
let onBack: (() => void) | null = null;
let container: HTMLElement | null = null;
let currentEra = 0;
let allLevels: LevelData[] = [];

// ─── Inject styles once ────────────────────────────────────

function injectStyles() {
  if (document.getElementById('ls-styles')) return;
  const el = document.createElement('style');
  el.id = 'ls-styles';
  el.textContent = CSS;
  document.head.appendChild(el);
}

// ─── Era/chapter metadata ────────────────────────────────

const ERA_NAMES = [
  'Ancient Colchis',
  'Kingdom of Iberia',
  'Age of Invasions',
  'Georgian Golden Age',
  'Mongol Catastrophe',
  'Between Empires',
  'Russian Empire',
  'First Republic',
  'Soviet Century',
  'Modern Georgia',
];

const ERA_YEARS = [
  '~1500 BC – ~100 BC',
  '~300 BC – 630 AD',
  '630 – 1089 AD',
  '1089 – 1225 AD',
  '1225 – 1500 AD',
  '1500 – 1801 AD',
  '1801 – 1918',
  '1918 – 1921',
  '1921 – 1991',
  '1991 – Present',
];

const CHAPTER_NAMES_ERA0 = [
  { label: 'Chapter I', name: 'Bronze Age', years: '~1500 BC – ~600 BC' },
  { label: 'Chapter II', name: 'Kingdom of Colchis', years: '~600 BC – ~100 BC' },
];

// ─── Chapter break: levels 1-5 = chapter 0, 6-20 = chapter 1 ───

function getChapterForLevel(era: number, level: number): number {
  if (era === 0) {
    if (level <= 5) return 0;
    return 1;
  }
  return 0; // Future eras use single chapter (levels 1-5)
}

// ─── Render ───────────────────────────────────────────────

function render(era: number) {
  if (!container) return;
  currentEra = era;
  injectStyles();

  // Get levels for this era
  const eraLevels = allLevels.filter(l => l.era === era).sort((a, b) => a.level - b.level);

  // Build HTML
  let html = `
    <div style="max-width:560px; margin:0 auto;">
      <div style="text-align:center; margin-bottom:28px;">
        <h2 style="color:#d4a017; font-size:24px; margin-bottom:6px;">
          Era ${era}: ${ERA_NAMES[era] || `Era ${era}`}
        </h2>
        <p style="color:#7a8a6a; font-size:12px;">${ERA_YEARS[era] || ''}</p>
      </div>
  `;

  if (era === 0) {
    // ── Era 0: two chapters with headers ──

    for (let ch = 0; ch < 2; ch++) {
      const chLevels = eraLevels.filter(l => getChapterForLevel(era, l.level) === ch);
      if (chLevels.length === 0) continue;

      const chMeta = CHAPTER_NAMES_ERA0[ch];
      const chapterUnlocked = SaveManager.isChapterUnlocked(era, ch);
      const chClass = ch === 0 ? 'ls-chapter-bronze' : 'ls-chapter-steel';

      html += `
        <div class="${chClass}">
          <div class="ls-chapter-divider"></div>
          <div class="ls-chapter-header">
            ${chMeta.label} — ${chMeta.name} &nbsp;·&nbsp; ${chMeta.years}
          </div>
          <div class="ls-grid">
      `;

      for (const lvl of chLevels) {
        const levelId = SaveManager.levelId(era, lvl.level);
        const stars = SaveManager.getStars(levelId);
        const completed = SaveManager.isCompleted(levelId);
        // Within a chapter, sequential unlock
        const locked = !chapterUnlocked;

        let cls = 'ls-card';
        if (locked) cls += ' ls-locked';
        else if (completed) cls += ' ls-completed';
        else if (lvl.level === 1 || (ch === 1 && lvl.level === 6)) cls += ' ls-next';

        const starDisplay = stars > 0
          ? `<span class="ls-stars-completed">${'★'.repeat(stars)}</span><span class="ls-stars-empty">${'☆'.repeat(3 - stars)}</span>`
          : `<span class="ls-stars-empty">☆☆☆</span>`;

        html += `
          <div class="${cls}" data-era="${era}" data-level="${lvl.level}">
            <div class="ls-num">${lvl.level}</div>
            <div class="ls-stars">${starDisplay}</div>
            <div class="ls-name">${lvl.name}</div>
          </div>
        `;
      }

      html += `</div></div>`;
    }
  } else {
    // ── Era 1+: 5 levels, era unlock required ──

    const eraUnlocked = SaveManager.isEraUnlocked(era);

    html += `<div class="ls-grid">`;

    for (const lvl of eraLevels) {
      const levelId = SaveManager.levelId(era, lvl.level);
      const stars = SaveManager.getStars(levelId);
      const completed = SaveManager.isCompleted(levelId);
      const locked = !eraUnlocked;

      let cls = 'ls-card';
      if (locked) cls += ' ls-locked';
      else if (completed) cls += ' ls-completed';
      else if (lvl.level === 1) cls += ' ls-next';

      const starDisplay = stars > 0
        ? `<span class="ls-stars-completed">${'★'.repeat(stars)}</span><span class="ls-stars-empty">${'☆'.repeat(3 - stars)}</span>`
        : `<span class="ls-stars-empty">☆☆☆</span>`;

      html += `
        <div class="${cls}" data-era="${era}" data-level="${lvl.level}">
          <div class="ls-num">${lvl.level}</div>
          <div class="ls-stars">${starDisplay}</div>
          <div class="ls-name">${lvl.name}</div>
        </div>
      `;
    }

    html += `</div>`;
  }

  html += `
    <div style="text-align:center;">
      <button id="ls-back-btn" style="
        padding:10px 28px;
        border:2px solid #8b6914; border-radius:8px;
        background:rgba(139,105,20,0.35); color:#f0e6d2;
        cursor:pointer; font-family:Georgia; font-size:14px;
        transition:background 0.2s;">
        ← Back
      </button>
    </div>
  </div>`;

  container.innerHTML = html;

  // Event listeners
  container.querySelectorAll<HTMLElement>('.ls-card:not(.ls-locked)').forEach(card => {
    card.addEventListener('click', () => {
      const era = parseInt(card.dataset.era!);
      const level = parseInt(card.dataset.level!);
      onSelect?.(era, level);
    });
  });

  container.querySelector<HTMLButtonElement>('#ls-back-btn')?.addEventListener('click', () => {
    onBack?.();
  });
}

// ─── Public API ───────────────────────────────────────────

export const LevelSelect = {
  /**
   * Show level select screen.
   * @param era Era to show
   * @param containerEl DOM element (the #level-select div)
   * @param levels Full levels array (for reading names/sub_era)
   * @param onSelectLevel Called when player picks a level
   * @param onBackFn Called when player presses Back
   */
  show(
    era: number,
    containerEl: HTMLElement,
    levels: LevelData[],
    onSelectLevel: (era: number, level: number) => void,
    onBackFn: () => void,
  ) {
    injectStyles();
    onSelect = onSelectLevel;
    onBack = onBackFn;
    allLevels = levels;
    container = containerEl;
    containerEl.style.display = 'block';
    render(era);
  },

  /** Hide level select screen */
  hide() {
    if (container) container.style.display = 'none';
  },

  /** Refresh current era display */
  refresh() {
    render(currentEra);
  },
};
