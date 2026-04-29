/**
 * ShareManager.ts
 * Shareable victory moments via Canvas2D → navigator.share() / download.
 *
 * Three card types:
 * 1. Victory Card — 3-star result with era/level info (Georgian + English)
 * 2. Boss Kill — dramatic boss defeat moment
 * 3. Last Stand — survived with < 30% lives
 */
import { gs } from './GameState';
import { SaveManager } from './SaveManager';

const CARD_W = 1200;
const CARD_H = 630;

// Georgian text for viral recognition
const KA_STARS: Record<number, string> = {
  1: 'ერთი ვარსკვლავი',
  2: 'ორი ვარსკვლავი',
  3: 'სამი ვარსკვლავი',
};
const KA_VICTORY = 'გამარჯვება!';
const KA_DEFENDED = 'დაიცვა';

// Historical facts per era for cards
const ERA_FACTS: Record<number, { en: string; ka: string }> = {
  0: {
    en: 'Ancient Colchis — Land of the Golden Fleece',
    ka: 'ძველი კოლხეთი — ოქროს საწმისის ქვეყანა',
  },
  1: {
    en: 'Medieval Georgia — Fortress of the Caucasus',
    ka: 'შუა საუკუნეების საქართველო — კავკასიის ციხესიმაგრე',
  },
  2: {
    en: 'Golden Age — Queen Tamar\'s Reign',
    ka: 'ოქროს ხანა — თამარ მეფის მეფობა',
  },
};

export type CardType = 'victory' | 'bossKill' | 'lastStand';

export interface ShareCardData {
  type: CardType;
  stars: number;
  era: number;
  level: number;
  levelName: string;
  livesSaved: number;
  totalLives: number;
  bossName?: string;
  time: string;
}

export class ShareManager {
  private _canvas: HTMLCanvasElement | null = null;
  private _ctx: CanvasRenderingContext2D | null = null;

  /** Pre-render the share card. Returns data URL. */
  renderCard(data: ShareCardData): string {
    if (!this._canvas) {
      this._canvas = document.createElement('canvas');
      this._canvas.width = CARD_W;
      this._canvas.height = CARD_H;
      this._ctx = this._canvas.getContext('2d')!;
    }
    const ctx = this._ctx!;
    const w = CARD_W;
    const h = CARD_H;

    // ─── Background ─────────────────────────────────────────
    // Dark gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0a0e0a');
    bgGrad.addColorStop(0.5, '#151d15');
    bgGrad.addColorStop(1, '#0a0e0a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ─── Decorative border ──────────────────────────────────
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    // Inner border
    ctx.strokeStyle = 'rgba(212, 160, 23, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, w - 64, h - 64);

    // ─── Title based on type ────────────────────────────────
    ctx.textAlign = 'center';
    if (data.type === 'victory') {
      // Victory title
      ctx.font = 'bold 56px serif';
      ctx.fillStyle = '#d4a017';
      ctx.fillText(KA_VICTORY, w / 2, 100);
      ctx.font = '32px serif';
      ctx.fillStyle = '#c0a860';
      ctx.fillText('VICTORY', w / 2, 140);
    } else if (data.type === 'bossKill') {
      ctx.font = 'bold 48px serif';
      ctx.fillStyle = '#ff4444';
      ctx.fillText('BOSS DEFEATED', w / 2, 100);
      ctx.font = '36px serif';
      ctx.fillStyle = '#d4a017';
      ctx.fillText(data.bossName || 'Unknown Boss', w / 2, 150);
    } else if (data.type === 'lastStand') {
      ctx.font = 'bold 48px serif';
      ctx.fillStyle = '#ff6644';
      ctx.fillText('LAST STAND', w / 2, 100);
      ctx.font = '28px serif';
      ctx.fillStyle = '#c0a860';
      ctx.fillText('Survived against all odds', w / 2, 140);
    }

    // ─── Stars ──────────────────────────────────────────────
    const starY = 210;
    ctx.font = '48px serif';
    let starStr = '';
    for (let i = 0; i < 3; i++) {
      starStr += i < data.stars ? '★' : '☆';
    }
    ctx.fillStyle = data.stars >= 3 ? '#d4a017' : data.stars >= 2 ? '#c0a860' : '#888';
    ctx.fillText(starStr, w / 2, starY);

    // Georgian star label
    ctx.font = '24px serif';
    ctx.fillStyle = '#c0a860';
    ctx.fillText(KA_STARS[data.stars] || '', w / 2, starY + 40);

    // ─── Level info ─────────────────────────────────────────
    ctx.font = '28px serif';
    ctx.fillStyle = '#e0d8c0';
    ctx.fillText(`${KA_DEFENDED} ${data.levelName}`, w / 2, 310);

    // ─── Stats row ──────────────────────────────────────────
    const statsY = 380;
    ctx.font = '22px sans-serif';

    // Lives
    ctx.fillStyle = '#88aa88';
    ctx.textAlign = 'left';
    ctx.fillText(`Lives: ${data.livesSaved}/${data.totalLives}`, 120, statsY);

    // Time
    ctx.textAlign = 'center';
    ctx.fillText(`Time: ${data.time}`, w / 2, statsY);

    // Era
    ctx.textAlign = 'right';
    ctx.fillText(`Era ${data.era}`, w - 120, statsY);

    // ─── Historical fact ────────────────────────────────────
    const fact = ERA_FACTS[data.era] || ERA_FACTS[0]!;
    ctx.textAlign = 'center';
    ctx.font = 'italic 20px serif';
    ctx.fillStyle = '#a09060';
    ctx.fillText(fact.ka, w / 2, 460);
    ctx.font = '18px serif';
    ctx.fillStyle = '#807050';
    ctx.fillText(fact.en, w / 2, 490);

    // ─── Footer ─────────────────────────────────────────────
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#606060';
    ctx.textAlign = 'center';
    ctx.fillText('Sakartvelo Defenders — 2,000 years of Georgian history, one tower at a time', w / 2, h - 50);

    // ─── Flag accent ────────────────────────────────────────
    // Small Georgian flag stripe at bottom
    const flagY = h - 30;
    const flagH = 6;
    const stripeW = (w - 80) / 5;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(40, flagY, stripeW * 5, flagH);
    ctx.fillStyle = '#ff0000'; ctx.fillRect(40, flagY, stripeW, flagH);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(40 + stripeW, flagY, stripeW, flagH);
    ctx.fillStyle = '#ff0000'; ctx.fillRect(40 + stripeW * 2, flagY, stripeW, flagH);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(40 + stripeW * 3, flagY, stripeW, flagH);
    ctx.fillStyle = '#ff0000'; ctx.fillRect(40 + stripeW * 4, flagY, stripeW, flagH);

    return this._canvas.toDataURL('image/png');
  }

  /** Share via Web Share API (mobile) or download (desktop). */
  async share(data: ShareCardData): Promise<boolean> {
    const dataUrl = this.renderCard(data);

    // Try Web Share API first (works on mobile)
    if (navigator.share && navigator.canShare) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'sakartvelo-victory.png', { type: 'image/png' });
        const shareData = { files: [file] };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return true;
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return false; // User cancelled
        // Fall through to download
      }
    }

    // Desktop fallback: download
    return this._download(dataUrl);
  }

  private _download(dataUrl: string): boolean {
    try {
      const link = document.createElement('a');
      link.download = 'sakartvelo-victory.png';
      link.href = dataUrl;
      link.click();
      return true;
    } catch {
      return false;
    }
  }

  /** Build share card data from current game state. */
  static fromGameState(bossName?: string): ShareCardData {
    const level = gs.currentLevel;
    const era = Number(level?.era ?? 0);
    const lvlNum = Number(level?.level ?? 1);
    const stars = gs.getStars();
    const livesRatio = gs.startingLives > 0 ? gs.lives / gs.startingLives : 0;

    let type: CardType = 'victory';
    if (bossName && gs.bossKilled) {
      type = 'bossKill';
    } else if (livesRatio < 0.3 && livesRatio > 0) {
      type = 'lastStand';
    }

    const elapsed = gs.levelElapsedTime;
    const m = Math.floor(elapsed / 60);
    const s = Math.floor(elapsed % 60);

    return {
      type,
      stars,
      era,
      level: lvlNum,
      levelName: level?.defense_target || level?.name || 'Sakartvelo',
      livesSaved: gs.lives,
      totalLives: gs.startingLives,
      bossName,
      time: `${m}:${String(s).padStart(2, '0')}`,
    };
  }
}

export const shareManager = new ShareManager();
