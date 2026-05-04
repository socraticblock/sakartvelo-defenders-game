/**
 * LevelSelect.ts
 * Renders a mobile-first campaign journey map with briefing sheets.
 */
import { SaveManager } from './SaveManager';
import { LevelData } from './types';
import { LEVEL_SELECT_CSS } from './LevelSelectStyles';
import { audio } from './AudioManager';
import { ERA0_CHAPTERS, ERA0_TIMELINE } from './Era0Profiles';
import { ERA0_LEVEL_BRIEFINGS, LevelBriefing, TruthTag } from './CampaignBriefings';
import { getHistoricalFact, loadFacts } from './historical_facts';

let onSelect: ((era: number, level: number) => void) | null = null;
let onBack: (() => void) | null = null;
let container: HTMLElement | null = null;
let currentEra = 0;
let allLevels: LevelData[] = [];
let selectedBriefingLevel: LevelData | null = null;
let selectedGateChapter = -1;

const SHOW_ALL_ERA0_LEVELS_FOR_DEV =
  new URLSearchParams(window.location.search).get('allLevels') === '1' ||
  localStorage.getItem('sakartvelo_show_all_levels') === '1';

const ERA_NAMES = [
  'Ancient Colchis', 'Kingdom of Iberia', 'Age of Invasions',
  'Georgian Golden Age', 'Mongol Catastrophe', 'Between Empires',
  'Russian Empire', 'First Republic', 'Soviet Century', 'Modern Georgia',
];

const ERA_YEARS = [
  ERA0_TIMELINE, '~300 BC – 630 AD', '630 – 1089 AD',
  '1089 – 1225 AD', '1225 – 1500 AD', '1500 – 1801 AD',
  '1801 – 1918', '1918 – 1921', '1921 – 1991', '1991 – Present',
];

function injectStyles() {
  if (document.getElementById('ls-styles')) return;
  const el = document.createElement('style');
  el.id = 'ls-styles';
  el.textContent = LEVEL_SELECT_CSS;
  document.head.appendChild(el);
}

function getChapterForLevel(level: number): number {
  for (let i = 0; i < ERA0_CHAPTERS.length; i++) {
    const ch = ERA0_CHAPTERS[i];
    if (level >= ch.fromLevel && level <= ch.toLevel) return i;
  }
  return 0;
}

function starsHtml(stars: number): string {
  if (stars > 0) {
    return `<span class="ls-stars-completed">${'&#9733;'.repeat(stars)}</span><span class="ls-stars-empty">${'&#9734;'.repeat(3 - stars)}</span>`;
  }
  return `<span class="ls-stars-empty">&#9734;&#9734;&#9734;</span>`;
}

function formatTime(totalSeconds: number | undefined): string {
  if (totalSeconds === undefined) return '';
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

function normalizePeriod(period: string): string {
  return period
    .replace(/~/g, 'c. ')
    .replace(/\s+/g, ' ')
    .replace(/\s-\s/g, ' – ')
    .trim();
}

function humanizeTarget(target: string | undefined): string {
  if (!target) return 'Colchian stronghold';
  return target
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getMapArtClass(level: LevelData): string {
  const theme = (level.theme || '').toLowerCase();
  const name = level.name.toLowerCase();

  if (theme.includes('golden_river') || theme.includes('gold_stream')) return 'map-node-art-river-gold';
  if (theme.includes('river_tribes')) return 'map-node-art-river-tribes';
  if (theme.includes('sacred_grove') || theme.includes('sacred_oak')) return 'map-node-art-sacred-grove';
  if (theme.includes('pontus_coast') || theme.includes('sea_cliffs')) return 'map-node-art-pontus-coast';
  if (theme.includes('forest_pass')) return 'map-node-art-forest-pass';
  if (theme.includes('smith_village')) return 'map-node-art-forge-village';
  if (theme.includes('mountain_watchfires')) return 'map-node-art-watchfires';
  if (theme.includes('trade_road')) return 'map-node-art-trade-road';
  if (theme.includes('boundary_stones')) return 'map-node-art-boundary-stones';
  if (theme.includes('trial_ground')) return 'map-node-art-trial-ground';
  if (theme.includes('marshland')) return 'map-node-art-marshland';
  if (theme.includes('palisade')) return 'map-node-art-palisade';
  if (theme.includes('fleece_gate')) return 'map-node-art-fleece-gate';
  if (theme.includes('heart_colchis')) return 'map-node-art-heart-colchis';
  if (theme.includes('devi') || theme.includes('dragon') || name.includes('devi') || name.includes('dragon')) return 'map-node-art-mythic-gate';
  return 'map-node-art-generic';
}

function getMapArtSrc(level: LevelData): string {
  return `/images/level-art/era0/level-${String(level.level).padStart(2, '0')}.png`;
}

function truthTagLabel(tag: TruthTag): string {
  switch (tag) {
    case 'history': return 'HISTORY';
    case 'archaeology': return 'ARCHAEOLOGY';
    case 'myth': return 'MYTH';
    case 'game-adaptation': return 'GAME ADAPTATION';
    case 'uncertain': return 'UNCERTAIN';
    case 'tutorial': return 'TUTORIAL';
    case 'hybrid': return 'HYBRID';
    case 'boss': return 'BOSS';
    case 'finale': return 'FINALE';
    default: return String(tag).toUpperCase();
  }
}

function nodeTruthSummary(tags: TruthTag[]): string {
  if (tags.includes('tutorial')) return 'Tutorial';
  if (tags.includes('boss')) return 'Boss';
  if (tags.includes('finale')) return 'Finale';
  if (tags.includes('hybrid')) return 'Hybrid';
  if (tags.includes('myth')) return 'Myth';
  if (tags.includes('archaeology')) return 'Archaeology';
  return 'History';
}

function isChapterVisibleForPublic(chapterIndex: number): boolean {
  if (SHOW_ALL_ERA0_LEVELS_FOR_DEV) return true;
  if (chapterIndex === 0) return true;
  const previousChapter = ERA0_CHAPTERS[chapterIndex - 1];
  return SaveManager.getStars(SaveManager.levelId(0, previousChapter.toLevel)) > 0;
}

function isLevelStartAllowed(level: LevelData): boolean {
  if (SHOW_ALL_ERA0_LEVELS_FOR_DEV) return true;
  return SaveManager.isLevelUnlocked(level.era, level.level);
}

function getNodeState(level: LevelData, stars: number): 'completed' | 'current' | 'unlocked' | 'locked' {
  if (stars > 0) return 'completed';
  if (!isLevelStartAllowed(level)) return 'locked';
  const previousLevelId = level.level > 1 ? SaveManager.levelId(level.era, level.level - 1) : null;
  const isNext = level.level === 1 || (previousLevelId !== null && SaveManager.getStars(previousLevelId) > 0);
  return isNext ? 'current' : 'unlocked';
}

function getFallbackBriefing(level: LevelData): LevelBriefing {
  const chapter = ERA0_CHAPTERS[getChapterForLevel(level.level)];
  const factText = getHistoricalFact(level.era, level.level)?.text || level.historical_fact || 'This mission uses the campaign map to bridge history, myth, and gameplay.';
  return {
    era: level.era,
    level: level.level,
    title: level.name,
    chapterLabel: chapter.label,
    chapterName: chapter.name,
    period: normalizePeriod(chapter.years),
    kind: [level.level === 1 ? 'tutorial' : 'hybrid'],
    defenseTargetLabel: humanizeTarget(level.defense_target),
    shortTeaser: factText,
    whyName: `${level.name} is the campaign title for this battlefield. It is used to give the place a clear identity inside the journey map, even when the mission itself is a gameplay adaptation.`,
    historicalContext: factText,
    gameAdaptation: 'This mission layout, its enemy waves, and the defensive setup are adapted for tower-defense gameplay.',
    objective: `Defend ${humanizeTarget(level.defense_target)} and survive the level’s assault route.`,
    gameplayTip: 'Use the briefing tags and objective as a quick read, then begin battle whenever you are ready.',
    accuracyNote: 'This briefing uses available campaign data and falls back to level facts when deeper lore text is missing.',
  };
}

function getBriefingForLevel(level: LevelData): LevelBriefing {
  if (level.era === 0) {
    return ERA0_LEVEL_BRIEFINGS[level.level] || getFallbackBriefing(level);
  }
  return getFallbackBriefing(level);
}

function chapterTeaserHtml(chapterIndex: number): string {
  const chapter = ERA0_CHAPTERS[chapterIndex];
  return `
    <div class="chapter-gate-card">
      <div class="chapter-gate-kicker">${chapter.label}</div>
      <div class="chapter-gate-title">${chapter.name}</div>
      <div class="chapter-gate-period">${normalizePeriod(chapter.years)}</div>
      <div class="chapter-gate-copy">Complete the previous chapter to unlock this part of the Colchian journey.</div>
      <button class="chapter-gate-btn" data-gate-chapter="${chapterIndex}">View Chapter</button>
    </div>
  `;
}

function renderEraJourney(eraLevels: LevelData[]): string {
  let html = `
    <div class="campaign-map">
      <div class="campaign-map-header">
        <div class="campaign-kicker">Era 0 &middot; Ancient Colchis</div>
        <h2 class="campaign-title">Journey Through Ancient Colchis</h2>
        <p class="campaign-years">c. 1500 BC &ndash; 83 BC</p>
        <p class="campaign-subtitle">Travel from river villages and sacred groves toward the last heart of Colchis.</p>
        ${SHOW_ALL_ERA0_LEVELS_FOR_DEV ? `<div class="campaign-dev-badge">Dev: all levels visible</div>` : ''}
      </div>
  `;

  for (let chapterIndex = 0; chapterIndex < ERA0_CHAPTERS.length; chapterIndex++) {
    const chapter = ERA0_CHAPTERS[chapterIndex];
    const chapterLevels = eraLevels.filter(level => level.level >= chapter.fromLevel && level.level <= chapter.toLevel);
    const chapterVisible = isChapterVisibleForPublic(chapterIndex);

    html += `
      <section class="chapter-journey ${chapterVisible ? '' : 'chapter-journey-locked'}">
        <div class="chapter-copy">
          <div class="chapter-kicker">${chapter.label}</div>
          <h3 class="chapter-title">${chapter.name}</h3>
          <p class="chapter-period">${normalizePeriod(chapter.years)}</p>
          <p class="chapter-desc">${getChapterDescription(chapterIndex)}</p>
        </div>
    `;

    if (!chapterVisible) {
      html += chapterTeaserHtml(chapterIndex);
      html += `</section>`;
      continue;
    }

    html += `<div class="journey-node-stack">`;
    chapterLevels.forEach((lvl, idx) => {
      const levelId = SaveManager.levelId(lvl.era, lvl.level);
      const stars = SaveManager.getStars(levelId);
      const bestTime = SaveManager.getBestTime(levelId);
      const briefing = getBriefingForLevel(lvl);
      const state = getNodeState(lvl, stars);
      const lockedForStart = !isLevelStartAllowed(lvl);
      const artClass = getMapArtClass(lvl);
      html += `
        <div class="journey-node-wrap">
          <button
            class="map-node map-node-${state}"
            data-era="${lvl.era}"
            data-level="${lvl.level}"
            data-start-locked="${lockedForStart ? 'true' : 'false'}"
            aria-label="Open briefing for level ${lvl.level}, ${lvl.name}">
            <div class="map-node-art ${artClass}" aria-hidden="true">
              <img class="map-node-art-img" src="${lvl.imageUrl || getMapArtSrc(lvl)}" alt="" loading="lazy" decoding="async">
            </div>
            <div class="map-node-meta">
              <div class="map-node-num">${lvl.level}</div>
              <div class="map-node-name">${lvl.name}</div>
              <div class="map-node-tags">${nodeTruthSummary(briefing.kind)}</div>
              <div class="map-node-stars">${starsHtml(stars)}</div>
              ${bestTime !== undefined ? `<div class="map-node-best">Best ${formatTime(bestTime)}</div>` : `<div class="map-node-best map-node-best-empty">${state === 'locked' ? 'Locked' : 'Unfinished'}</div>`}
            </div>
          </button>
          ${idx < chapterLevels.length - 1 ? `<div class="map-path map-path-${state}"></div>` : ''}
        </div>
      `;
    });
    html += `</div></section>`;
  }

  html += `</div>`;
  return html;
}

function getChapterDescription(chapterIndex: number): string {
  switch (chapterIndex) {
    case 0: return 'Follow the Rioni through river villages, sacred groves, and the first mythic threshold of Colchis.';
    case 1: return 'Move through mountain streams, forge settlements, ridge watchfires, and the rising defensive world of Colchis.';
    case 2: return 'Travel the trade routes, ritual clearings, and mythic borders where Phasis, Medea, and the Fleece converge.';
    case 3: return 'Cross trial grounds, marsh routes, palisades, and the last ceremonial gates before the fall of independent Colchis.';
    default: return 'Continue deeper into the campaign journey.';
  }
}

function renderGenericEraList(era: number, eraLevels: LevelData[]): string {
  return `
    <div class="campaign-map">
      <div class="campaign-map-header">
        <div class="campaign-kicker">Era ${era} &middot; ${ERA_NAMES[era] || `Era ${era}`}</div>
        <h2 class="campaign-title">${ERA_NAMES[era] || `Era ${era}`}</h2>
        <p class="campaign-years">${ERA_YEARS[era] || ''}</p>
      </div>
      <section class="chapter-journey">
        <div class="journey-node-stack">
          ${eraLevels.map((lvl, idx) => {
            const levelId = SaveManager.levelId(lvl.era, lvl.level);
            const stars = SaveManager.getStars(levelId);
            const bestTime = SaveManager.getBestTime(levelId);
            const state = getNodeState(lvl, stars);
            const artClass = getMapArtClass(lvl);
            return `
              <div class="journey-node-wrap">
                <button class="map-node map-node-${state}" data-era="${lvl.era}" data-level="${lvl.level}" data-start-locked="${!isLevelStartAllowed(lvl) ? 'true' : 'false'}">
                  <div class="map-node-art ${artClass}" aria-hidden="true"
                    ${lvl.imageUrl ? `style="background-image:url('${lvl.imageUrl}');background-size:cover;background-position:center;"` : ''}
                  ></div>
                  <div class="map-node-meta">
                    <div class="map-node-num">${lvl.level}</div>
                    <div class="map-node-name">${lvl.name}</div>
                    <div class="map-node-tags">History</div>
                    <div class="map-node-stars">${starsHtml(stars)}</div>
                    ${bestTime !== undefined ? `<div class="map-node-best">Best ${formatTime(bestTime)}</div>` : `<div class="map-node-best map-node-best-empty">${state === 'locked' ? 'Locked' : 'Unfinished'}</div>`}
                  </div>
                </button>
                ${idx < eraLevels.length - 1 ? `<div class="map-path map-path-${state}"></div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </section>
    </div>
  `;
}

function renderSheet(): string {
  const level = selectedBriefingLevel;
  if (level) {
    const briefing = getBriefingForLevel(level);
    const displayTitle = level.name || briefing.title;
    const canBegin = isLevelStartAllowed(level);
    const tagHtml = briefing.kind.map(tag => `<span class="truth-tag truth-tag-${tag}">${truthTagLabel(tag)}</span>`).join('');
    return `
      <div class="level-briefing-sheet ${level ? 'is-open' : ''}" aria-hidden="false" role="dialog" aria-modal="true">
        <div class="level-briefing-backdrop" data-close-sheet="1"></div>
        <div class="briefing-panel">
          <div class="briefing-handle" aria-hidden="true"></div>
          <button class="briefing-close" type="button" data-close-sheet="1" aria-label="Close briefing">Close</button>
          <div class="briefing-scroll">
            <div class="briefing-topline">Level ${level.level}</div>
            <h3 class="briefing-title">${displayTitle}</h3>
            <div class="briefing-tags">${tagHtml}</div>
            <div class="briefing-subline">${briefing.chapterLabel} &mdash; ${briefing.chapterName}</div>
            <div class="briefing-period">${normalizePeriod(briefing.period)}</div>
            <p class="briefing-teaser">${briefing.shortTeaser}</p>

            <section class="briefing-section briefing-section-quick">
              <div class="briefing-row">
                <div class="briefing-label">Defend</div>
                <div class="briefing-value">${briefing.defenseTargetLabel}</div>
              </div>
              <div class="briefing-row">
                <div class="briefing-label">Objective</div>
                <div class="briefing-value">${briefing.objective}</div>
              </div>
            </section>

            <section class="briefing-section">
              <h4 class="briefing-heading">Why this level is called “${displayTitle}”</h4>
              <p class="briefing-copy">${briefing.whyName}</p>
            </section>

            <details class="briefing-accordion">
              <summary>Read historical context</summary>
              <div class="briefing-accordion-body">${briefing.historicalContext}</div>
            </details>

            ${briefing.mythicContext ? `
              <details class="briefing-accordion">
                <summary>Myth vs history</summary>
                <div class="briefing-accordion-body">${briefing.mythicContext}</div>
              </details>
            ` : ''}

            <details class="briefing-accordion">
              <summary>How the game adapts this</summary>
              <div class="briefing-accordion-body">${briefing.gameAdaptation}</div>
            </details>

            ${briefing.gameplayTip ? `
              <section class="briefing-section">
                <h4 class="briefing-heading">Gameplay tip</h4>
                <p class="briefing-copy">${briefing.gameplayTip}</p>
              </section>
            ` : ''}

            <details class="briefing-accordion">
              <summary>Accuracy note</summary>
              <div class="briefing-accordion-body">${briefing.accuracyNote}</div>
            </details>
          </div>

          <div class="briefing-actions">
            ${canBegin ? `<button class="briefing-begin-btn" data-begin-level="${level.level}" data-era="${level.era}">Begin Battle</button>` : `<div class="briefing-locked-note">Locked in normal mode. ${SHOW_ALL_ERA0_LEVELS_FOR_DEV ? 'Dev mode can still open all levels.' : 'Complete earlier levels to unlock this battle.'}</div>`}
          </div>
        </div>
      </div>
    `;
  }

  if (selectedGateChapter >= 0) {
    const chapter = ERA0_CHAPTERS[selectedGateChapter];
    return `
      <div class="level-briefing-sheet is-open" aria-hidden="false" role="dialog" aria-modal="true">
        <div class="level-briefing-backdrop" data-close-sheet="1"></div>
        <div class="briefing-panel">
          <div class="briefing-handle" aria-hidden="true"></div>
          <button class="briefing-close" type="button" data-close-sheet="1" aria-label="Close chapter preview">Close</button>
          <div class="briefing-scroll">
            <div class="briefing-topline">${chapter.label}</div>
            <h3 class="briefing-title">${chapter.name}</h3>
            <div class="briefing-period">${normalizePeriod(chapter.years)}</div>
            <p class="briefing-teaser">${getChapterDescription(selectedGateChapter)}</p>
            <section class="briefing-section">
              <h4 class="briefing-heading">What waits here</h4>
              <p class="briefing-copy">This chapter opens later in the journey and expands the campaign into new terrain, stronger mythic pressure, and deeper Colchian lore.</p>
            </section>
          </div>
          <div class="briefing-actions">
            <div class="briefing-locked-note">Complete the previous chapter to unlock this gate.</div>
          </div>
        </div>
      </div>
    `;
  }

  return `<div class="level-briefing-sheet" aria-hidden="true"></div>`;
}

function bindInteractions() {
  if (!container) return;

  container.querySelectorAll<HTMLElement>('.map-node').forEach((node) => {
    node.addEventListener('click', () => {
      const era = Number(node.dataset.era);
      const levelNum = Number(node.dataset.level);
      const level = allLevels.find((candidate) => candidate.era === era && candidate.level === levelNum) || null;
      if (!level) return;
      selectedGateChapter = -1;
      selectedBriefingLevel = level;
      rerenderPreserveScroll();
    });
  });

  container.querySelectorAll<HTMLElement>('[data-gate-chapter]').forEach((gate) => {
    gate.addEventListener('click', () => {
      selectedBriefingLevel = null;
      selectedGateChapter = Number(gate.dataset.gateChapter);
      rerenderPreserveScroll();
    });
  });

  container.querySelectorAll<HTMLElement>('[data-close-sheet]').forEach((closeEl) => {
    closeEl.addEventListener('click', () => closeSheet());
  });

  const beginBtn = container.querySelector<HTMLButtonElement>('[data-begin-level]');
  if (beginBtn) {
    beginBtn.addEventListener('click', () => {
      const era = Number(beginBtn.dataset.era);
      const level = Number(beginBtn.dataset.beginLevel);
      closeSheet(false);
      onSelect?.(era, level);
    });
  }

  container.querySelector<HTMLButtonElement>('#ls-back-btn')?.addEventListener('click', () => {
    closeSheet(false);
    onBack?.();
  });

  container.querySelector<HTMLButtonElement>('#ls-reset-btn')?.addEventListener('click', () => {
    if (confirm('Clear all save data and restart?')) {
      SaveManager.reset();
      closeSheet(false);
      render(currentEra);
    }
  });
}

function bindEscape() {
  document.removeEventListener('keydown', handleSheetEscape);
  document.addEventListener('keydown', handleSheetEscape);
}

function handleSheetEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  if (!selectedBriefingLevel && selectedGateChapter < 0) return;
  closeSheet();
}

function closeSheet(shouldRerender = true) {
  selectedBriefingLevel = null;
  selectedGateChapter = -1;
  if (shouldRerender) rerenderPreserveScroll();
}

function getScrollHost(): HTMLElement | null {
  if (!container) return null;
  const screen = container.closest<HTMLElement>('#screen-level-select');
  return screen || container;
}

function rerenderPreserveScroll(): void {
  const scrollHost = getScrollHost();
  const scrollTop = scrollHost?.scrollTop ?? 0;
  render(currentEra);
  const updatedHost = getScrollHost();
  if (updatedHost) updatedHost.scrollTop = scrollTop;
}

function render(era: number) {
  if (!container) return;
  currentEra = era;
  injectStyles();

  const eraLevels = allLevels.filter(l => l.era === era).sort((a, b) => a.level - b.level);
  const eraJourneyHtml = era === 0 ? renderEraJourney(eraLevels) : renderGenericEraList(era, eraLevels);

  const html = `
    <div class="ls-shell">
      <div class="ls-volume-panel">
        <div class="vol-row">
          <span class="vol-label">Music</span>
          <input type="range" id="vol-music-level" min="0" max="100" value="10">
          <span class="vol-val" id="vol-music-level-val">10</span>
        </div>
      </div>
      ${eraJourneyHtml}
      <div class="ls-footer">
        <button id="ls-back-btn">Back</button>
        <button id="ls-reset-btn">Clear Progress</button>
      </div>
      ${renderSheet()}
    </div>
  `;

  container.innerHTML = html;
  const screen = container.closest<HTMLElement>('#screen-level-select');
  if (screen) {
    const sheetOpen = Boolean(selectedBriefingLevel || selectedGateChapter >= 0);
    screen.classList.toggle('briefing-open', sheetOpen);
  }
  audio.bindVolumeControls();
  bindInteractions();
  bindEscape();
}

export const LevelSelect = {
  async show(
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
    await loadFacts();
    render(era);
  },

  hide() {
    closeSheet(false);
  },

  refresh() {
    render(currentEra);
  },
};
