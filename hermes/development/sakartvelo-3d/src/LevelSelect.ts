/**
 * LevelSelect.ts
 * One-screen campaign map selector.
 *
 * v5 rule: the main path from campaign map to battle must feel like a game,
 * not a scrollable website. The campaign map itself is the quick start.
 */
import { SaveManager } from './SaveManager';
import { LevelData } from './types';
import { LEVEL_SELECT_CSS } from './LevelSelectStyles';
import { audio } from './AudioManager';
import { ERA0_LEVEL_BRIEFINGS } from './CampaignBriefings';
import { getHistoricalFact, loadFacts } from './historical_facts';
import { escapeHtml } from './utils/dom';

type OnSelect = (era: number, level: number) => void;
type CampaignNodeType = 'main' | 'challenge' | 'boss';
type CampaignNodeState = 'completed' | 'current' | 'unlocked' | 'locked' | 'coming-soon';

type CampaignNode = {
  id: string;
  level?: number;
  title: string;
  type: CampaignNodeType;
  x: number;
  y: number;
  description: string;
  levelRef?: { era: number; level: number };
  requires?: string[];
  next?: string[];
};

type CampaignEra = {
  id: number;
  name: string;
  subtitle: string;
  dateRange: string;
  heroName: string;
  nodes: CampaignNode[];
};

let onSelect: OnSelect | null = null;
let onBack: (() => void) | null = null;
let container: HTMLElement | null = null;
let currentEra = 0;
let allLevels: LevelData[] = [];
let selectedNodeId: string | null = null;
let readMoreOpen = false;
let campaignPanX = 0;
let lastPanDragAt = 0;
let centerSelectedAfterRender = true;

let panGesture: {
  pointerId: number;
  startX: number;
  startY: number;
  startPanX: number;
  moved: boolean;
} | null = null;

const ERA0_CAMPAIGN: CampaignEra = {
  id: 0,
  name: 'Ancient Colchis',
  subtitle: 'Rivers, forests, gold, and old gods',
  dateRange: 'c. 600 BC – c. 100 BC',
  heroName: 'Medea',
  nodes: [
    { id: 'e0_l1', level: 1, title: 'The Golden River', type: 'main', x: 12, y: 66, description: 'Defend the first village road near the Rioni.', levelRef: { era: 0, level: 1 }, next: ['e0_l2'] },
    { id: 'e0_l2', level: 2, title: 'Forest Road', type: 'main', x: 25, y: 53, description: 'Hold the road through the Colchian forest.', levelRef: { era: 0, level: 2 }, requires: ['e0_l1'], next: ['e0_l3', 'e0_c1'] },
    { id: 'e0_l3', level: 3, title: 'Reed Village', type: 'main', x: 38, y: 42, description: 'Protect a riverside settlement of reed and timber.', levelRef: { era: 0, level: 3 }, requires: ['e0_l2'], next: ['e0_l4'] },
    { id: 'e0_c1', title: 'Gold-Panner’s Trial', type: 'challenge', x: 42, y: 74, description: 'Optional river challenge for extra mastery. Coming later.', requires: ['e0_l2'] },
    { id: 'e0_l4', level: 4, title: 'Sacred Grove', type: 'main', x: 52, y: 34, description: 'Defend the old grove marked with the Borjgali.', levelRef: { era: 0, level: 4 }, requires: ['e0_l3'], next: ['e0_l5'] },
    { id: 'e0_l5', level: 5, title: 'Bronze Ford', type: 'main', x: 64, y: 54, description: 'Hold the crossing before enemies reach the valley.', levelRef: { era: 0, level: 5 }, requires: ['e0_l4'], next: ['e0_l6'] },
    { id: 'e0_l6', level: 6, title: 'Vani Outskirts', type: 'main', x: 77, y: 39, description: 'The road climbs toward the rich hill settlement.', levelRef: { era: 0, level: 6 }, requires: ['e0_l5'], next: ['e0_boss1'] },
    { id: 'e0_boss1', level: 8, title: 'Guardian of the Fleece', type: 'boss', x: 90, y: 27, description: 'A mythic guardian waits beyond the golden shrine.', levelRef: { era: 0, level: 8 }, requires: ['e0_l6'] },
  ],
};

const CAMPAIGNS: Record<number, CampaignEra> = { 0: ERA0_CAMPAIGN };

function e(value: unknown): string { return escapeHtml(value); }

function injectStyles(): void {
  if (document.getElementById('ls-styles')) return;
  const el = document.createElement('style');
  el.id = 'ls-styles';
  el.textContent = LEVEL_SELECT_CSS;
  document.head.appendChild(el);
}

function levelExists(ref: { era: number; level: number } | undefined): boolean {
  if (!ref) return false;
  return allLevels.some(level => level.era === ref.era && level.level === ref.level);
}

function levelId(ref: { era: number; level: number }): string { return SaveManager.levelId(ref.era, ref.level); }

function isNodePlayable(node: CampaignNode): boolean {
  if (!node.levelRef || !levelExists(node.levelRef)) return false;
  return SaveManager.isLevelUnlocked(node.levelRef.era, node.levelRef.level);
}

function isNodeCompleted(node: CampaignNode): boolean {
  return Boolean(node.levelRef && SaveManager.getStars(levelId(node.levelRef)) > 0);
}

function requirementsMet(node: CampaignNode): boolean {
  if (!node.requires?.length) return true;
  const campaign = CAMPAIGNS[currentEra];
  return node.requires.every(requiredId => {
    const required = campaign?.nodes.find(candidate => candidate.id === requiredId);
    return required ? isNodeCompleted(required) : false;
  });
}

function getNodeState(node: CampaignNode): CampaignNodeState {
  if (!node.levelRef || !levelExists(node.levelRef)) return 'coming-soon';
  if (isNodeCompleted(node)) return 'completed';
  if (!requirementsMet(node)) return 'locked';
  if (isNodePlayable(node)) return node.id === getLatestPlayableNode()?.id ? 'current' : 'unlocked';
  return 'locked';
}

function getStars(node: CampaignNode): number {
  if (!node.levelRef) return 0;
  return SaveManager.getStars(levelId(node.levelRef));
}

function starsHtml(stars: number): string {
  const full = '&#9733;'.repeat(Math.max(0, Math.min(3, stars)));
  const empty = '&#9734;'.repeat(Math.max(0, 3 - stars));
  return `<span class="campaign-stars-full">${full}</span><span class="campaign-stars-empty">${empty}</span>`;
}

function getLatestPlayableNode(): CampaignNode | null {
  const campaign = CAMPAIGNS[currentEra];
  if (!campaign) return null;
  const playable = campaign.nodes.filter(isNodePlayable);
  if (playable.length === 0) return campaign.nodes.find(node => node.levelRef && levelExists(node.levelRef)) || campaign.nodes[0] || null;
  return playable.reduce((best, node) => {
    const bestLevel = best.levelRef?.level ?? 0;
    const nodeLevel = node.levelRef?.level ?? 0;
    return nodeLevel >= bestLevel ? node : best;
  }, playable[0]);
}

function getSelectedNode(): CampaignNode | null {
  const campaign = CAMPAIGNS[currentEra];
  if (!campaign) return null;
  const byId = selectedNodeId ? campaign.nodes.find(node => node.id === selectedNodeId) : null;
  return byId || getLatestPlayableNode();
}

function getLevelDataForNode(node: CampaignNode | null): LevelData | null {
  if (!node?.levelRef) return null;
  return allLevels.find(level => level.era === node.levelRef?.era && level.level === node.levelRef?.level) || null;
}

function getBriefingText(node: CampaignNode): { objective: string; teaser: string; history: string; accuracy: string } {
  if (!node.levelRef) {
    return {
      objective: 'Optional challenge node planned for the campaign map.',
      teaser: node.description,
      history: 'This side route is reserved for an optional challenge mode and will be connected once challenge battles are implemented.',
      accuracy: 'Placeholder campaign node. It is not yet a historical battle claim.',
    };
  }
  const briefing = node.levelRef.era === 0 ? ERA0_LEVEL_BRIEFINGS[node.levelRef.level] : undefined;
  const level = getLevelDataForNode(node);
  const fact = getHistoricalFact(node.levelRef.era, node.levelRef.level)?.text || level?.historical_fact || node.description;
  return {
    objective: briefing?.objective || `Defend ${level?.defense_target || 'the route'} and survive all waves.`,
    teaser: briefing?.shortTeaser || node.description,
    history: briefing?.historicalContext || fact,
    accuracy: briefing?.accuracyNote || 'This node links historical setting, campaign storytelling, and tower-defense adaptation.',
  };
}

function renderRouteSvg(campaign: CampaignEra): string {
  const paths: string[] = [];
  for (const node of campaign.nodes) {
    for (const nextId of node.next || []) {
      const next = campaign.nodes.find(candidate => candidate.id === nextId);
      if (!next) continue;
      const midX = (node.x + next.x) / 2;
      const bend = node.y < next.y ? -4 : 4;
      const d = `M ${node.x} ${node.y} C ${midX} ${node.y + bend}, ${midX} ${next.y - bend}, ${next.x} ${next.y}`;
      const completed = isNodeCompleted(node) && (isNodeCompleted(next) || isNodePlayable(next));
      paths.push(`<path class="campaign-route ${completed ? 'campaign-route-lit' : ''}" d="${d}" />`);
    }
  }
  return `<svg class="campaign-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths.join('')}</svg>`;
}

function renderNode(node: CampaignNode, selected: CampaignNode | null): string {
  const state = getNodeState(node);
  const selectedClass = selected?.id === node.id ? 'is-selected' : '';
  const nodeLabel = node.level ? `Level ${node.level}` : node.type === 'challenge' ? 'Trial' : 'Node';
  const stars = getStars(node);
  return `
    <button class="campaign-node campaign-node-${e(node.type)} campaign-node-${e(state)} ${selectedClass}" type="button" style="left:${node.x}%; top:${node.y}%" data-node-id="${e(node.id)}" aria-label="Select ${e(node.title)}">
      <span class="campaign-node-glow" aria-hidden="true"></span>
      <span class="campaign-node-icon" aria-hidden="true">${node.type === 'boss' ? '🐉' : node.type === 'challenge' ? '✦' : node.level || '•'}</span>
      <span class="campaign-node-label">${e(nodeLabel)}</span>
      ${stars > 0 ? `<span class="campaign-node-stars">${starsHtml(stars)}</span>` : ''}
    </button>
  `;
}

function renderSelectedCard(node: CampaignNode | null): string {
  if (!node) return '';
  const state = getNodeState(node);
  const stars = getStars(node);
  const text = getBriefingText(node);
  const playable = isNodePlayable(node);
  const comingSoon = state === 'coming-soon';
  const locked = state === 'locked';
  const action = playable
    ? `<button class="campaign-play-btn" id="campaign-play-btn" type="button">Play${node.level ? ` Level ${e(node.level)}` : ''}</button>`
    : `<button class="campaign-play-btn is-disabled" type="button" disabled>${comingSoon ? 'Coming Later' : 'Locked'}</button>`;

  return `
    <aside class="campaign-info-card" aria-live="polite">
      <div class="campaign-card-kicker">${node.type === 'boss' ? 'Boss Node' : node.type === 'challenge' ? 'Optional Trial' : `Level ${e(node.level || '')}`}</div>
      <h2 class="campaign-card-title">${e(node.title)}</h2>
      <div class="campaign-card-stars">${starsHtml(stars)}</div>
      <p class="campaign-card-copy">${e(text.teaser)}</p>
      <div class="campaign-card-objective">${e(text.objective)}</div>
      <div class="campaign-card-actions">${action}<button class="campaign-read-btn" id="campaign-read-btn" type="button">Read More</button></div>
      ${locked ? `<div class="campaign-lock-note">Complete the previous node to unlock this road.</div>` : ''}
    </aside>
  `;
}

function renderReadMore(node: CampaignNode | null): string {
  if (!node || !readMoreOpen) return '';
  const text = getBriefingText(node);
  return `
    <div class="campaign-readmore" role="dialog" aria-modal="true" aria-label="Campaign history details">
      <div class="campaign-readmore-backdrop" data-close-readmore="1"></div>
      <section class="campaign-readmore-panel scrollable">
        <button class="campaign-readmore-close" type="button" data-close-readmore="1">Close</button>
        <div class="campaign-readmore-kicker">${e(node.type.toUpperCase())}</div>
        <h2>${e(node.title)}</h2>
        <p class="campaign-readmore-lead">${e(text.teaser)}</p>
        <h3>Historical context</h3>
        <p>${e(text.history)}</p>
        <h3>Accuracy note</h3>
        <p>${e(text.accuracy)}</p>
      </section>
    </div>
  `;
}

function renderCampaignMap(): string {
  const campaign = CAMPAIGNS[currentEra] || ERA0_CAMPAIGN;
  const selected = getSelectedNode();
  const totalStars = SaveManager.getTotalStars();
  return `
    <div class="campaign-map-shell">
      <div class="campaign-pan-world" style="--campaign-pan-x:${campaignPanX}px">
        <div class="campaign-bg" aria-hidden="true"><div class="campaign-river"></div><div class="campaign-forest campaign-forest-left"></div><div class="campaign-forest campaign-forest-top"></div><div class="campaign-gold-dust"></div></div>
        ${renderRouteSvg(campaign)}
        <div class="campaign-node-layer">${campaign.nodes.map(node => renderNode(node, selected)).join('')}</div>
      </div>
      <div class="campaign-pan-hint" aria-hidden="true">Drag map</div>
      <header class="campaign-topbar">
        <div class="campaign-era-badge"><span class="campaign-era-small">Era ${campaign.id}</span><strong>${e(campaign.name)}</strong><span>${e(campaign.dateRange)}</span></div>
        <div class="campaign-top-actions"><button id="ls-back-btn" type="button">Back</button><button id="ls-reset-btn" type="button">Reset</button></div>
      </header>
      <div class="campaign-title-block"><div class="campaign-title-kicker">Campaign Map</div><h1>${e(campaign.subtitle)}</h1></div>
      <div class="campaign-hero-chip"><div class="campaign-hero-orb">M</div><div><span>Hero</span><strong>${e(campaign.heroName)}</strong></div></div>
      <div class="campaign-star-chip"><span>Total Stars</span><strong>${e(totalStars)}</strong></div>
      ${renderSelectedCard(selected)}
      ${renderReadMore(selected)}
    </div>
  `;
}

function renderFallbackList(era: number): string {
  const eraLevels = allLevels.filter(level => level.era === era).sort((a, b) => a.level - b.level);
  return `
    <div class="campaign-map-shell campaign-map-fallback">
      <header class="campaign-topbar"><div class="campaign-era-badge"><strong>Era ${e(era)}</strong><span>Campaign list fallback</span></div><div class="campaign-top-actions"><button id="ls-back-btn" type="button">Back</button></div></header>
      <div class="campaign-fallback-grid">
        ${eraLevels.map(level => {
          const playable = SaveManager.isLevelUnlocked(level.era, level.level);
          const stars = SaveManager.getStars(SaveManager.levelId(level.era, level.level));
          return `<button class="campaign-fallback-level" data-fallback-level="${level.level}" ${playable ? '' : 'disabled'}><strong>${e(level.level)}. ${e(level.name)}</strong><span>${starsHtml(stars)}</span></button>`;
        }).join('')}
      </div>
    </div>
  `;
}

function getPanElements(): { shell: HTMLElement; world: HTMLElement } | null {
  const shell = container?.querySelector<HTMLElement>('.campaign-map-shell');
  const world = container?.querySelector<HTMLElement>('.campaign-pan-world');
  return shell && world ? { shell, world } : null;
}

function getPanBounds(): { min: number; max: number } {
  const els = getPanElements();
  if (!els) return { min: 0, max: 0 };
  const overflow = Math.max(0, els.world.offsetWidth - els.shell.clientWidth);
  return { min: -overflow, max: 0 };
}

function clampPan(x: number): number {
  const { min, max } = getPanBounds();
  return Math.max(min, Math.min(max, x));
}

function applyPan(x = campaignPanX): void {
  campaignPanX = clampPan(x);
  const world = container?.querySelector<HTMLElement>('.campaign-pan-world');
  if (world) world.style.setProperty('--campaign-pan-x', `${campaignPanX}px`);
}

function centerSelectedNode(): void {
  const selected = getSelectedNode();
  const els = getPanElements();
  if (!selected || !els) return;
  const desired = (els.shell.clientWidth * 0.46) - ((selected.x / 100) * els.world.offsetWidth);
  applyPan(desired);
}

function bindMapPanning(): void {
  const els = getPanElements();
  if (!els) return;
  const { shell } = els;

  shell.addEventListener('pointerdown', (event) => {
    if (readMoreOpen) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.campaign-info-card, .campaign-topbar, .campaign-hero-chip, .campaign-star-chip, .campaign-readmore')) return;
    panGesture = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startPanX: campaignPanX, moved: false };
    shell.setPointerCapture?.(event.pointerId);
  });

  shell.addEventListener('pointermove', (event) => {
    if (!panGesture || panGesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - panGesture.startX;
    const dy = event.clientY - panGesture.startY;
    const threshold = event.pointerType === 'mouse' ? 6 : 14;
    if (!panGesture.moved && Math.hypot(dx, dy) > threshold) {
      panGesture.moved = true;
      shell.classList.add('is-panning');
    }
    if (!panGesture.moved) return;
    event.preventDefault();
    applyPan(panGesture.startPanX + dx);
  });

  const finish = (event: PointerEvent) => {
    if (!panGesture || panGesture.pointerId !== event.pointerId) return;
    if (panGesture.moved) lastPanDragAt = Date.now();
    panGesture = null;
    shell.classList.remove('is-panning');
    try { shell.releasePointerCapture?.(event.pointerId); } catch { /* noop */ }
  };

  shell.addEventListener('pointerup', finish);
  shell.addEventListener('pointercancel', finish);

  window.addEventListener('resize', () => applyPan(), { passive: true });
}

function bindInteractions(): void {
  if (!container) return;
  bindMapPanning();

  container.querySelectorAll<HTMLButtonElement>('[data-node-id]').forEach(button => {
    button.addEventListener('click', () => {
      if (Date.now() - lastPanDragAt < 220) return;
      selectedNodeId = button.dataset.nodeId || null;
      readMoreOpen = false;
      centerSelectedAfterRender = true;
      render(currentEra);
    });
  });

  container.querySelector<HTMLButtonElement>('#campaign-play-btn')?.addEventListener('click', () => {
    const selected = getSelectedNode();
    if (!selected?.levelRef || !isNodePlayable(selected)) return;
    onSelect?.(selected.levelRef.era, selected.levelRef.level);
  });

  container.querySelector<HTMLButtonElement>('#campaign-read-btn')?.addEventListener('click', () => { readMoreOpen = true; render(currentEra); });
  container.querySelectorAll<HTMLElement>('[data-close-readmore]').forEach(el => el.addEventListener('click', () => { readMoreOpen = false; render(currentEra); }));
  container.querySelectorAll<HTMLButtonElement>('[data-fallback-level]').forEach(button => button.addEventListener('click', () => { const level = Number(button.dataset.fallbackLevel); if (Number.isFinite(level)) onSelect?.(currentEra, level); }));
  container.querySelector<HTMLButtonElement>('#ls-back-btn')?.addEventListener('click', () => { readMoreOpen = false; onBack?.(); });
  container.querySelector<HTMLButtonElement>('#ls-reset-btn')?.addEventListener('click', () => { if (confirm('Clear all save data and restart?')) { SaveManager.reset(); selectedNodeId = null; readMoreOpen = false; centerSelectedAfterRender = true; render(currentEra); } });
  document.removeEventListener('keydown', handleEscape);
  document.addEventListener('keydown', handleEscape);
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;
  if (readMoreOpen) { readMoreOpen = false; render(currentEra); }
}

function render(era: number): void {
  if (!container) return;
  injectStyles();
  currentEra = era;
  const screen = container.closest<HTMLElement>('#screen-level-select');
  if (screen) {
    screen.classList.remove('quick-start-active', 'briefing-open');
    screen.classList.add('campaign-map-mode');
  }
  const campaign = CAMPAIGNS[era];
  if (!selectedNodeId) selectedNodeId = getLatestPlayableNode()?.id || campaign?.nodes[0]?.id || null;
  container.innerHTML = `
    <div class="ls-shell ls-shell-campaign">
      <div class="ls-volume-panel campaign-volume-panel"><div class="vol-row"><span class="vol-label">Music</span><input type="range" id="vol-music-level" min="0" max="100" value="10"><span class="vol-val" id="vol-music-level-val">10</span></div></div>
      ${campaign ? renderCampaignMap() : renderFallbackList(era)}
    </div>
  `;
  audio.bindVolumeControls();
  bindInteractions();
  requestAnimationFrame(() => {
    if (centerSelectedAfterRender) centerSelectedNode();
    else applyPan();
    centerSelectedAfterRender = false;
  });
}

export const LevelSelect = {
  async show(era: number, containerEl: HTMLElement, levels: LevelData[], onSelectLevel: OnSelect, onBackFn: () => void) {
    injectStyles();
    onSelect = onSelectLevel;
    onBack = onBackFn;
    allLevels = levels;
    container = containerEl;
    currentEra = era;
    selectedNodeId = null;
    readMoreOpen = false;
    campaignPanX = 0;
    centerSelectedAfterRender = true;
    await loadFacts();
    render(era);
  },

  hide() {
    readMoreOpen = false;
    document.removeEventListener('keydown', handleEscape);
  },

  refresh() { render(currentEra); },
};
