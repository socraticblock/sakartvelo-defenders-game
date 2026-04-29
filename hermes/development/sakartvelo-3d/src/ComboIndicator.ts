/**
 * ComboIndicator.ts
 * Shows a combo counter when enemies are killed in rapid succession.
 * Viral moment: "5x COMBO!" with Georgian text creates shareable moments.
 */
import { audio } from './AudioManager';

const COMBO_WINDOW = 2.5; // seconds between kills to maintain combo

// Georgian combo labels for viral recognition
const KA_COMBO: Record<number, string> = {
  2: 'ორმაგი!',
  3: 'სამმაგი!',
  4: 'ოთხმაგი!',
  5: '5x შეუჩერებელი!',
  6: '6x გამარჯვება!',
  7: '7x გმირი!',
};

const EN_COMBO: Record<number, string> = {
  2: 'DOUBLE!',
  3: 'TRIPLE!',
  4: 'QUAD!',
  5: '5x UNSTOPPABLE!',
  6: '6x VICTORIOUS!',
  7: '7x HEROIC!',
};

export class ComboIndicator {
  private _count = 0;
  private _timer = 0;
  private _el: HTMLDivElement | null = null;
  private _subEl: HTMLDivElement | null = null;

  constructor() {
    this._ensureDOM();
  }

  private _ensureDOM(): void {
    if (this._el) return;
    let el = document.getElementById('combo-indicator');
    if (!el) {
      el = document.createElement('div');
      el.id = 'combo-indicator';
      el.style.cssText = `
        position: fixed; top: 18%; left: 50%; transform: translate(-50%, -50%);
        z-index: 200; pointer-events: none; text-align: center;
        opacity: 0; transition: opacity 0.2s, transform 0.2s;
      `;

      const main = document.createElement('div');
      main.id = 'combo-main';
      main.style.cssText = `
        font-family: Georgia, serif; font-size: clamp(28px, 6vw, 52px);
        font-weight: bold; color: #d4a017;
        text-shadow: 0 0 20px rgba(212,160,23,0.6), 0 2px 8px rgba(0,0,0,0.9);
        letter-spacing: 3px; text-transform: uppercase;
      `;
      el.appendChild(main);

      const sub = document.createElement('div');
      sub.id = 'combo-sub';
      sub.style.cssText = `
        font-family: Georgia, serif; font-size: clamp(16px, 3vw, 24px);
        color: #c0a860; margin-top: 4px;
        text-shadow: 0 1px 4px rgba(0,0,0,0.8);
      `;
      el.appendChild(sub);

      document.body.appendChild(el);
    }
    this._el = el as HTMLDivElement;
    this._mainEl = this._el.querySelector('#combo-main') as HTMLDivElement;
    this._subEl = this._el.querySelector('#combo-sub') as HTMLDivElement;
  }

  private _mainEl: HTMLDivElement | null = null;

  /** Call when an enemy is killed. */
  onKill(): void {
    this._ensureDOM();
    this._count++;
    this._timer = COMBO_WINDOW;

    if (this._count < 2) return; // No combo for single kills

    const label = this._count <= 7 ? EN_COMBO[this._count] : `${this._count}x COMBO!`;
    const kaLabel = this._count <= 7 ? KA_COMBO[this._count] : `${this._count}x!`;

    if (this._mainEl) this._mainEl.textContent = label;
    if (this._subEl) this._subEl.textContent = kaLabel;

    if (this._el) {
      this._el.style.opacity = '1';
      this._el.style.transform = 'translate(-50%, -50%) scale(1.15)';
      window.setTimeout(() => {
        if (this._el) this._el.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 100);
    }

    // Play a rising tone for combos
    if (this._count >= 3) {
      audio.playComboHit(this._count);
    }
  }

  /** Call each frame with delta time. */
  update(dt: number): void {
    if (this._timer <= 0) return;
    this._timer -= dt;

    if (this._timer <= 0) {
      // Combo ended
      this._count = 0;
      if (this._el) this._el.style.opacity = '0';
    }
  }

  /** Reset on level start. */
  reset(): void {
    this._count = 0;
    this._timer = 0;
    if (this._el) this._el.style.opacity = '0';
  }
}

export const comboIndicator = new ComboIndicator();
