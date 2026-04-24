/**
 * LevelSelect.ts — Level select screen for Sakartvelo Defenders
 * Era 0: Shows all 20 levels in two chapters.
 * Era 1+: Shows 5 levels per era.
 * CSS lives in LevelSelectStyles.ts.
 */
import { SaveManager } from './SaveManager';
import { LevelData } from './types';
import { LEVEL_SELECT_CSS } from './LevelSelectStyles';

let onSelect: ((era: number, level: number) => void) | null = null;
let onBack: (() => void) | null = null;
let container: HTMLElement | null = null;
let currentEra = 0;
let allLevels: LevelData[] = [];

function injectStyles() {
  if (document.getElementById('ls-styles')) return;
  const el = document.createElement('style');
  el.id = 'ls-styles';
  el.textContent = LEVEL_SELECT_CSS;
  document.head.appendChild(el);
}

const ERA_NAMES = [
  'Ancient Colchis', 'Kingdom of Iberia', 'Age of Invasions',
  'Georgian Golden Age', 'Mongol Catastrophe', 'Between Empires',
  'Russian Empire', 'First Republic', 'Soviet Century', 'Modern Georgia',
];

const ERA_YEARS = [
  '~1500 BC – ~100 BC', '~300 BC – 630 AD', '630 – 1089 AD',
  '1089 – 1225 AD', '1225 – 1500 AD', '1500 – 1801 AD',
  '1801 – 1918', '1918 – 1921', '1921 – 1991', '1991 – Present',
];

const CHAPTER_NAMES_ERA0 = [
  { label: 'Chapter I', name: 'Bronze Age', years: '~1500 BC – ~600 BC' },
  { label: 'Chapter II', name: 'Kingdom of Colchis', years: '~600 BC – ~100 BC' },
];

function getChapterForLevel(era: number, level: number): number {
  if (era === 0) return level <= 5 ? 0 : 1;
  return 0;
}

function cardClass(locked: boolean, completed: boolean, isNext: boolean): string {
  let cls = 'ls-card';
  if (locked) cls += ' ls-locked';
  else if (completed) cls += ' ls-completed';
  else if (isNext) cls += ' ls-next';
  return cls;
}

function starsHtml(stars: number): string {
  if (stars > 0) {
    return `<span class="ls-stars-completed">${'★'.repeat(stars)}</span><span class="ls-stars-empty">${'☆'.repeat(3 - stars)}</span>`;
  }
  return `<span class="ls-stars-empty">☆☆☆</span>`;
}

function render(era: number) {
  if (!container) return;
  currentEra = era;
  injectStyles();

  const eraLevels = allLevels.filter(l => l.era === era).sort((a, b) => a.level - b.level);
  
  let html = `
    <div class="ls-container">
      <div class="ls-header">
        <h2 class="ls-era-title">
          Era ${era}: ${ERA_NAMES[era] || `Era ${era}`}
        </h2>
        <p class="ls-era-years">${ERA_YEARS[era] || ''}</p>
      </div>
  `;

  if (era === 0) {
    for (let ch = 0; ch < 2; ch++) {
      const chLevels = eraLevels.filter(l => getChapterForLevel(era, l.level) === ch);
      if (chLevels.length === 0) continue;

      const chMeta = CHAPTER_NAMES_ERA0[ch];
      const chapterUnlocked = SaveManager.isChapterUnlocked(era, ch);
      const chClass = ch === 0 ? 'ls-chapter-bronze' : 'ls-chapter-steel';
      const firstUnlocked = ch === 0 ? 1 : 6;

      html += `
        <div class="${chClass}">
          <div class="ls-chapter-divider"></div>
          <div class="ls-chapter-header">
            ${chMeta.label} — ${chMeta.name} &nbsp;·&nbsp; ${chMeta.years}
          </div>
          <div class="ls-grid">
      `;

      for (const lvl of chLevels) {
        const id = SaveManager.levelId(era, lvl.level);
        const stars = SaveManager.getStars(id);
        const isUnlocked = SaveManager.isLevelUnlocked(era, lvl.level);
        const isCompleted = stars > 0;
        const isLocked = !isUnlocked;
        // A level is "Next" if it's unlocked but not yet completed
        const isNext = isUnlocked && !isCompleted;

        html += `
          <div class="${cardClass(isLocked, isCompleted, isNext)}"
               data-era="${era}" data-level="${lvl.level}"
               data-locked="${isLocked}">
            <div class="ls-num">${lvl.level}</div>
            <div class="ls-stars">${starsHtml(stars)}</div>
            <div class="ls-name">${lvl.name}</div>
          </div>
        `;
      }
      html += `</div></div>`;
    }
  } else {
    const eraUnlocked = SaveManager.isEraUnlocked(era);
    html += `<div class="ls-grid">`;

    for (const lvl of eraLevels) {
      const id = SaveManager.levelId(era, lvl.level);
      const stars = SaveManager.getStars(id);
      const isUnlocked = SaveManager.isLevelUnlocked(era, lvl.level);
      const isCompleted = stars > 0;
      const isLocked = !isUnlocked;
      const isNext = isUnlocked && !isCompleted;

      html += `
        <div class="${cardClass(isLocked, isCompleted, isNext)}"
             data-era="${era}" data-level="${lvl.level}"
             data-locked="${isLocked}">
          <div class="ls-num">${lvl.level}</div>
          <div class="ls-stars">${starsHtml(stars)}</div>
          <div class="ls-name">${lvl.name}</div>
        </div>
      `;
    }
    html += `</div>`;
  }

    html += `
      <div class="ls-footer">
        <button id="ls-back-btn">← Back</button>
        <button id="ls-reset-btn">Clear Progress</button>
      </div>
    </div>`;

  container.innerHTML = html;

  // Debug: Log all levels status
  console.log(`--- Era ${era} Level Status ---`);
  eraLevels.forEach(lvl => {
    const id = SaveManager.levelId(era, lvl.level);
    console.log(`Lvl ${lvl.level}: Unlocked=${SaveManager.isLevelUnlocked(era, lvl.level)}, Stars=${SaveManager.getStars(id)}`);
  });

  container.querySelectorAll<HTMLElement>('.ls-card[data-locked="false"]').forEach(card => {
    card.addEventListener('click', () => {
      const e = parseInt(card.dataset.era!);
      const l = parseInt(card.dataset.level!);
      onSelect?.(e, l);
    });
  });

  container.querySelector<HTMLButtonElement>('#ls-back-btn')?.addEventListener('click', () => {
    onBack?.();
  });

  container.querySelector<HTMLButtonElement>('#ls-reset-btn')?.addEventListener('click', () => {
    if (confirm('Clear all save data and restart?')) {
      SaveManager.reset();
      render(era);
    }
  });
}

export const LevelSelect = {
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
    render(era);
  },

  hide() {
    // No-op, managed by classes
  },

  refresh() {
    render(currentEra);
  },
};
