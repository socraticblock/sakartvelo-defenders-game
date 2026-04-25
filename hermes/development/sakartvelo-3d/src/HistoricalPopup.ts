import { loadFacts, getHistoricalFact, type HistoricalFact } from './historical_facts';

// ─────────────────────────────────────────────────────────────────────────────
// CSS injected once into <head>
// ─────────────────────────────────────────────────────────────────────────────
const POPUP_CSS = `
.hp-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center;
  animation: hp-fadein 0.25s ease;
}
@keyframes hp-fadein { from { opacity:0 } to { opacity:1 } }
.hp-card {
  background: linear-gradient(135deg,#1a0a00 0%,#2d1200 60%,#1a0a00 100%);
  border: 2px solid #c8941a;
  border-radius: 16px;
  padding: 32px 36px;
  max-width: 560px;
  width: 90%;
  box-shadow: 0 0 60px rgba(200,148,26,0.35), inset 0 0 30px rgba(200,148,26,0.08);
  animation: hp-rise 0.3s cubic-bezier(.18,.89,.32,1.28);
  font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
}
@keyframes hp-rise { from { transform:translateY(24px); opacity:0 } to { transform:none; opacity:1 } }
.hp-badge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #c8941a;
  margin-bottom: 14px;
}
.hp-title {
  font-size: 28px;
  line-height: 1.2;
  color: #ffd36b;
  margin: 0 0 14px;
  text-shadow: 0 0 18px rgba(255,211,107,0.25);
}
.hp-fact {
  font-size: 17px;
  line-height: 1.7;
  color: #f0d882;
  margin: 0 0 22px;
  font-style: italic;
}
.hp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.hp-era-tag {
  font-size: 11px;
  letter-spacing: 1.5px;
  color: #8a6010;
  text-transform: uppercase;
}
.hp-btn {
  background: linear-gradient(135deg,#c8941a,#e8b84b);
  color: #1a0800;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  font-family: inherit;
}
.hp-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(200,148,26,0.5); }
.hp-btn:active { transform: translateY(0); }
`;

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
let active = false;
let onDismiss: (() => void) | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap — inject CSS once
// ─────────────────────────────────────────────────────────────────────────────
function inject() {
  if (document.getElementById('hp-styles')) return;
  const el = document.createElement('style');
  el.id = 'hp-styles';
  el.textContent = POPUP_CSS;
  document.head.appendChild(el);
}

// ─────────────────────────────────────────────────────────────────────────────
// showPopup
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Show the historical popup for the given level.
 * Facts are fetched from /data/historical_facts.json lazily.
 * @param era    Era index (0-9)
 * @param level  Level number (1-20)
 * @param callback  Called when user dismisses popup
 */
export function showPopup(era: number, level: number, callback: () => void): void {
  if (active) return;
  active = true;
  onDismiss = callback;
  inject();

  loadFacts().then(() => {
    const fact = getHistoricalFact(era, level);
    if (!fact) {
      active = false;
      callback();
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'hp-overlay';
    overlay.innerHTML = `
      <div class="hp-card">
        <div class="hp-badge">📜 Did You Know?</div>
        <p class="hp-fact">"${fact.text}"</p>
        <div class="hp-footer">
          <span class="hp-era-tag">${fact.attribution}</span>
          <button class="hp-btn" id="hp-dismiss">Continue →</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#hp-dismiss')?.addEventListener('click', () => {
      document.body.removeChild(overlay);
      active = false;
      onDismiss = null;
      callback();
    });
  });
}

export function showVictoryPopup(title: string, message: string, callback: () => void): void {
  if (active) return;
  active = true;
  onDismiss = callback;
  inject();

  const overlay = document.createElement('div');
  overlay.className = 'hp-overlay';
  overlay.innerHTML = `
    <div class="hp-card">
      <div class="hp-badge">⚔ Boss Defeated</div>
      <h2 class="hp-title">${title}</h2>
      <p class="hp-fact">${message}</p>
      <div class="hp-footer">
        <span class="hp-era-tag">The path is clear</span>
        <button class="hp-btn" id="hp-dismiss">Claim Victory →</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#hp-dismiss')?.addEventListener('click', () => {
    document.body.removeChild(overlay);
    active = false;
    onDismiss = null;
    callback();
  });
}
