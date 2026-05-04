/**
 * LevelSelectStyles.ts
 * Journey-map and bottom-sheet styling for campaign level select.
 */
export const LEVEL_SELECT_CSS = `
  #screen-level-select {
    overflow-y: auto;
    justify-content: flex-start;
    padding: 0 0 44px;
    background:
      radial-gradient(ellipse at 50% 32%, rgba(227, 179, 73, 0.04), transparent 48%),
      radial-gradient(ellipse at 50% 52%, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.68)),
      url('/images/3387e128-87a0-4327-a509-c41cb9f85932.png') center center / cover no-repeat;
  }

  #screen-level-select.briefing-open {
    overflow: hidden;
  }

  #screen-level-select::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(3, 7, 6, 0.2), rgba(3, 7, 6, 0.12) 38%, rgba(3, 7, 6, 0.28) 100%),
      radial-gradient(ellipse at center, transparent 22%, rgba(0, 0, 0, 0.46) 100%);
    z-index: 0;
  }

  .ls-shell {
    position: relative;
    z-index: 1;
    width: min(100%, 980px);
    margin: 0 auto;
    padding: 92px 18px 32px;
  }

  .ls-volume-panel {
    position: fixed;
    top: 18px;
    right: 18px;
    z-index: 160;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 210px;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1px solid rgba(227, 179, 73, 0.56);
    background: rgba(8, 10, 10, 0.7);
    backdrop-filter: blur(6px);
  }

  .ls-volume-panel .vol-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ls-volume-panel .vol-label {
    min-width: 48px;
    color: #ead09a;
    font-size: 14px;
  }

  .ls-volume-panel .vol-val {
    min-width: 26px;
    font-size: 11px;
    color: #a58b58;
    text-align: right;
  }

  .ls-volume-panel input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 92px;
    height: 4px;
    background: linear-gradient(90deg, #8b6914 var(--pct, 70%), #3a3020 var(--pct, 70%));
    border-radius: 999px;
    outline: none;
  }

  .ls-volume-panel input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #d4a017;
    box-shadow: 0 0 8px rgba(212, 160, 23, 0.4);
    cursor: pointer;
  }

  .campaign-map {
    display: flex;
    flex-direction: column;
    gap: 26px;
  }

  .campaign-map-header {
    padding: 0 6px;
    text-align: center;
  }

  .campaign-kicker {
    color: #cca65e;
    font-size: 13px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .campaign-title {
    color: #f0ddae;
    font-size: clamp(32px, 9vw, 52px);
    line-height: 1.02;
    font-weight: 700;
    text-shadow: 0 0 18px rgba(227, 179, 73, 0.12);
  }

  .campaign-years {
    margin-top: 10px;
    color: #d4b677;
    font-size: clamp(16px, 4.5vw, 22px);
  }

  .campaign-subtitle {
    margin: 14px auto 0;
    max-width: 720px;
    color: #c8b38a;
    font-size: clamp(15px, 4vw, 21px);
    line-height: 1.4;
  }

  .campaign-dev-badge {
    display: inline-flex;
    margin-top: 14px;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid rgba(227, 179, 73, 0.44);
    background: rgba(18, 17, 11, 0.6);
    color: #dbbf87;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .chapter-journey {
    position: relative;
    padding: 20px 16px 12px;
    border-radius: 22px;
    border: 1px solid rgba(227, 179, 73, 0.14);
    background:
      linear-gradient(180deg, rgba(9, 13, 11, 0.54), rgba(9, 13, 11, 0.28)),
      radial-gradient(ellipse at top, rgba(227, 179, 73, 0.035), transparent 64%);
    box-shadow: inset 0 1px 0 rgba(255, 230, 170, 0.02);
  }

  .chapter-copy {
    margin-bottom: 18px;
  }

  .chapter-kicker {
    color: #8d7650;
    font-size: 12px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .chapter-title {
    color: #f0dfb8;
    font-size: clamp(24px, 6.6vw, 34px);
    line-height: 1.08;
    margin-bottom: 8px;
  }

  .chapter-period {
    color: #bf9f64;
    font-size: 14px;
    letter-spacing: 0.08em;
    margin-bottom: 12px;
  }

  .chapter-desc {
    color: #baa57d;
    font-size: 15px;
    line-height: 1.45;
  }

  .journey-node-stack {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .journey-node-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .map-path {
    width: 4px;
    min-height: 28px;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(110, 86, 42, 0.84), rgba(80, 62, 30, 0.18));
    box-shadow: 0 0 12px rgba(227, 179, 73, 0.08);
  }

  .map-path-current {
    background: linear-gradient(180deg, rgba(212, 160, 23, 0.9), rgba(115, 82, 18, 0.18));
    box-shadow: 0 0 16px rgba(227, 179, 73, 0.18);
  }

  .map-node {
    width: 100%;
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    gap: 14px;
    align-items: center;
    padding: 14px;
    border-radius: 18px;
    border: 1px solid rgba(227, 179, 73, 0.18);
    background: rgba(15, 16, 12, 0.72);
    color: inherit;
    cursor: pointer;
    text-align: left;
    transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  }

  .map-node:hover {
    transform: translateY(-1px);
    border-color: rgba(227, 179, 73, 0.44);
    background: rgba(22, 20, 14, 0.82);
  }

  .map-node-art {
    width: 96px;
    height: 96px;
    border-radius: 14px;
    border: 1px solid rgba(227, 179, 73, 0.24);
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(14, 14, 14, 0.95), rgba(5, 5, 5, 0.95)),
      radial-gradient(circle at 40% 35%, rgba(227, 179, 73, 0.06), transparent 42%);
    box-shadow: inset 0 0 0 1px rgba(255, 220, 138, 0.02);
  }

  .map-node-art-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    opacity: 0.98;
    transform: scale(1.14);
  }

  .map-node-art::before,
  .map-node-art::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .map-node-art-generic {
    background:
      linear-gradient(145deg, rgba(17, 17, 15, 0.96), rgba(7, 7, 7, 0.98)),
      radial-gradient(circle at 35% 28%, rgba(227, 179, 73, 0.06), transparent 34%);
  }

  .map-node-art-generic .map-node-art-img {
    display: none;
  }

  .map-node-art-river-gold {
    background:
      linear-gradient(180deg, rgba(24, 36, 28, 0.98), rgba(11, 17, 13, 0.98)),
      linear-gradient(135deg, rgba(216, 176, 77, 0.08), transparent 42%);
  }

  .map-node-art-river-gold::before {
    background:
      linear-gradient(110deg, transparent 20%, rgba(206, 163, 70, 0.24) 22%, rgba(245, 215, 128, 0.45) 30%, rgba(90, 122, 112, 0.28) 34%, transparent 38%, transparent 58%, rgba(206, 163, 70, 0.18) 62%, rgba(245, 215, 128, 0.34) 68%, transparent 74%);
    transform: skewY(-10deg);
  }

  .map-node-art-river-gold::after {
    background: radial-gradient(circle at 68% 26%, rgba(255, 227, 150, 0.34), transparent 18%);
  }

  .map-node-art-river-tribes {
    background:
      linear-gradient(180deg, rgba(38, 29, 18, 0.98), rgba(14, 13, 9, 0.98)),
      radial-gradient(circle at 20% 30%, rgba(143, 101, 52, 0.24), transparent 24%);
  }

  .map-node-art-river-tribes::before {
    inset: auto 12px 12px 12px;
    height: 26px;
    background:
      linear-gradient(90deg, rgba(77, 54, 28, 0.95) 0 16%, transparent 16% 20%, rgba(77, 54, 28, 0.95) 20% 37%, transparent 37% 42%, rgba(77, 54, 28, 0.95) 42% 64%, transparent 64% 68%, rgba(77, 54, 28, 0.95) 68% 100%);
    border-top: 2px solid rgba(176, 126, 62, 0.42);
    border-radius: 4px;
  }

  .map-node-art-river-tribes::after {
    inset: 12px 16px auto 16px;
    height: 20px;
    background: linear-gradient(180deg, rgba(100, 135, 120, 0.22), transparent);
  }

  .map-node-art-sacred-grove {
    background:
      linear-gradient(180deg, rgba(12, 22, 14, 0.98), rgba(8, 12, 8, 0.98)),
      radial-gradient(circle at 50% 28%, rgba(171, 144, 76, 0.18), transparent 24%);
  }

  .map-node-art-sacred-grove::before {
    inset: 12px 24px 10px;
    background:
      radial-gradient(circle at 50% 18%, rgba(90, 137, 83, 0.88) 0 34%, transparent 35%),
      linear-gradient(180deg, transparent 0 62%, rgba(89, 58, 30, 0.86) 62% 100%);
  }

  .map-node-art-sacred-grove::after {
    inset: auto 12px 10px;
    height: 12px;
    background: radial-gradient(ellipse at center, rgba(208, 167, 73, 0.24), transparent 70%);
  }

  .map-node-art-pontus-coast {
    background:
      linear-gradient(180deg, rgba(12, 24, 34, 0.98), rgba(8, 12, 16, 0.98)),
      linear-gradient(180deg, rgba(122, 153, 172, 0.16), transparent 45%);
  }

  .map-node-art-pontus-coast::before {
    background:
      linear-gradient(180deg, transparent 0 56%, rgba(22, 47, 60, 0.94) 56% 78%, rgba(9, 17, 21, 0.98) 78% 100%),
      linear-gradient(110deg, transparent 0 18%, rgba(55, 55, 50, 0.86) 18% 28%, transparent 28% 38%, rgba(55, 55, 50, 0.86) 38% 52%, transparent 52%);
  }

  .map-node-art-pontus-coast::after {
    inset: auto 0 20px;
    height: 12px;
    background: linear-gradient(90deg, transparent, rgba(201, 225, 238, 0.32), transparent);
  }

  .map-node-art-forest-pass {
    background:
      linear-gradient(180deg, rgba(16, 24, 15, 0.98), rgba(7, 11, 7, 0.98)),
      linear-gradient(135deg, rgba(88, 114, 76, 0.22), transparent 46%);
  }

  .map-node-art-forest-pass::before {
    background:
      linear-gradient(180deg, transparent 0 58%, rgba(54, 46, 28, 0.92) 58% 72%, rgba(12, 12, 10, 0.94) 72% 100%),
      linear-gradient(90deg, rgba(19, 28, 18, 0.9) 0 18%, transparent 18% 82%, rgba(19, 28, 18, 0.9) 82% 100%);
  }

  .map-node-art-forge-village {
    background:
      linear-gradient(180deg, rgba(30, 18, 12, 0.98), rgba(10, 9, 8, 0.98)),
      radial-gradient(circle at 64% 34%, rgba(255, 146, 78, 0.32), transparent 18%);
  }

  .map-node-art-forge-village::before {
    inset: auto 12px 14px;
    height: 18px;
    background: linear-gradient(90deg, rgba(70, 50, 40, 0.94) 0 34%, rgba(92, 63, 42, 0.92) 34% 58%, rgba(70, 50, 40, 0.94) 58% 100%);
    border-top: 2px solid rgba(210, 123, 62, 0.34);
  }

  .map-node-art-forge-village::after {
    inset: 14px 22px auto auto;
    width: 18px;
    height: 18px;
    background: radial-gradient(circle, rgba(255, 180, 86, 0.72), rgba(255, 106, 34, 0.14) 68%, transparent 72%);
  }

  .map-node-art-watchfires {
    background:
      linear-gradient(180deg, rgba(17, 20, 29, 0.98), rgba(9, 10, 14, 0.98)),
      linear-gradient(180deg, rgba(86, 105, 132, 0.14), transparent 40%);
  }

  .map-node-art-watchfires::before {
    background:
      linear-gradient(180deg, transparent 0 58%, rgba(37, 47, 61, 0.92) 58% 74%, rgba(12, 14, 19, 0.96) 74% 100%);
  }

  .map-node-art-watchfires::after {
    inset: 14px 18px auto auto;
    width: 18px;
    height: 24px;
    background:
      radial-gradient(circle at 50% 26%, rgba(255, 194, 100, 0.82), rgba(255, 124, 52, 0.34) 46%, transparent 58%),
      linear-gradient(180deg, transparent 0 56%, rgba(85, 66, 45, 0.86) 56% 100%);
  }

  .map-node-art-trade-road {
    background:
      linear-gradient(180deg, rgba(26, 22, 16, 0.98), rgba(10, 10, 9, 0.98)),
      linear-gradient(135deg, rgba(128, 107, 62, 0.16), transparent 40%);
  }

  .map-node-art-trade-road::before {
    background: linear-gradient(120deg, transparent 18%, rgba(170, 133, 74, 0.28) 18% 28%, rgba(112, 88, 50, 0.78) 28% 38%, transparent 38% 54%, rgba(170, 133, 74, 0.2) 54% 64%, rgba(112, 88, 50, 0.72) 64% 74%, transparent 74%);
  }

  .map-node-art-boundary-stones {
    background:
      linear-gradient(180deg, rgba(22, 20, 17, 0.98), rgba(10, 10, 9, 0.98)),
      radial-gradient(circle at 52% 28%, rgba(186, 148, 88, 0.18), transparent 22%);
  }

  .map-node-art-boundary-stones::before {
    background:
      linear-gradient(180deg, transparent 0 48%, rgba(66, 60, 53, 0.94) 48% 100%);
    clip-path: polygon(20% 54%, 28% 26%, 36% 54%, 46% 32%, 54% 54%, 64% 18%, 72% 54%, 80% 38%, 86% 54%, 86% 100%, 20% 100%);
  }

  .map-node-art-mythic-gate {
    background:
      linear-gradient(180deg, rgba(18, 12, 16, 0.98), rgba(7, 7, 8, 0.98)),
      radial-gradient(circle at 50% 32%, rgba(185, 84, 57, 0.26), transparent 24%);
  }

  .map-node-art-mythic-gate::before {
    inset: 12px 18px 12px;
    background:
      linear-gradient(180deg, rgba(72, 52, 30, 0.92), rgba(40, 24, 14, 0.96));
    clip-path: polygon(18% 100%, 18% 44%, 34% 24%, 50% 12%, 66% 24%, 82% 44%, 82% 100%, 66% 100%, 66% 50%, 50% 38%, 34% 50%, 34% 100%);
    box-shadow: 0 0 14px rgba(211, 121, 62, 0.16);
  }

  .map-node-art-mythic-gate::after {
    inset: 18px auto auto 50%;
    width: 20px;
    height: 20px;
    transform: translateX(-50%);
    background: radial-gradient(circle, rgba(240, 183, 103, 0.86), rgba(186, 66, 38, 0.18) 64%, transparent 70%);
  }

  .map-node-art-trial-ground {
    background:
      linear-gradient(180deg, rgba(28, 24, 19, 0.98), rgba(11, 10, 9, 0.98)),
      linear-gradient(135deg, rgba(145, 118, 72, 0.16), transparent 42%);
  }

  .map-node-art-trial-ground::before {
    background:
      linear-gradient(180deg, transparent 0 58%, rgba(86, 69, 45, 0.78) 58% 62%, transparent 62%),
      linear-gradient(90deg, transparent 0 22%, rgba(86, 69, 45, 0.72) 22% 26%, transparent 26% 74%, rgba(86, 69, 45, 0.72) 74% 78%, transparent 78%);
  }

  .map-node-art-marshland {
    background:
      linear-gradient(180deg, rgba(16, 28, 22, 0.98), rgba(8, 13, 10, 0.98)),
      radial-gradient(circle at 50% 62%, rgba(87, 118, 94, 0.22), transparent 28%);
  }

  .map-node-art-marshland::before {
    background:
      linear-gradient(180deg, transparent 0 54%, rgba(38, 66, 54, 0.92) 54% 100%),
      linear-gradient(120deg, transparent 18%, rgba(154, 177, 146, 0.18) 18% 24%, transparent 24% 34%, rgba(154, 177, 146, 0.14) 34% 40%, transparent 40%);
  }

  .map-node-art-palisade {
    background:
      linear-gradient(180deg, rgba(26, 19, 15, 0.98), rgba(10, 8, 7, 0.98)),
      linear-gradient(135deg, rgba(126, 89, 52, 0.16), transparent 44%);
  }

  .map-node-art-palisade::before {
    inset: 14px 12px;
    background:
      linear-gradient(90deg, rgba(101, 72, 43, 0.94) 0 8%, transparent 8% 12%, rgba(101, 72, 43, 0.94) 12% 20%, transparent 20% 24%, rgba(101, 72, 43, 0.94) 24% 32%, transparent 32% 36%, rgba(101, 72, 43, 0.94) 36% 44%, transparent 44% 48%, rgba(101, 72, 43, 0.94) 48% 56%, transparent 56% 60%, rgba(101, 72, 43, 0.94) 60% 68%, transparent 68% 72%, rgba(101, 72, 43, 0.94) 72% 80%, transparent 80% 84%, rgba(101, 72, 43, 0.94) 84% 92%, transparent 92%);
    clip-path: polygon(0 100%, 0 22%, 4% 12%, 8% 22%, 12% 10%, 16% 22%, 20% 12%, 24% 22%, 28% 10%, 32% 22%, 36% 12%, 40% 22%, 44% 10%, 48% 22%, 52% 12%, 56% 22%, 60% 10%, 64% 22%, 68% 12%, 72% 22%, 76% 10%, 80% 22%, 84% 12%, 88% 22%, 92% 10%, 96% 22%, 100% 12%, 100% 100%);
  }

  .map-node-art-fleece-gate {
    background:
      linear-gradient(180deg, rgba(21, 16, 12, 0.98), rgba(8, 7, 7, 0.98)),
      radial-gradient(circle at 50% 30%, rgba(223, 182, 97, 0.24), transparent 20%);
  }

  .map-node-art-fleece-gate::before {
    inset: 16px 18px 14px;
    background:
      radial-gradient(circle at 50% 18%, rgba(240, 217, 149, 0.78), rgba(204, 164, 76, 0.28) 54%, transparent 60%),
      linear-gradient(180deg, transparent 0 34%, rgba(77, 55, 29, 0.9) 34% 100%);
    clip-path: polygon(50% 0, 68% 14%, 74% 34%, 70% 58%, 60% 78%, 50% 100%, 40% 78%, 30% 58%, 26% 34%, 32% 14%);
  }

  .map-node-art-heart-colchis {
    background:
      linear-gradient(180deg, rgba(23, 16, 14, 0.98), rgba(8, 7, 7, 0.98)),
      radial-gradient(circle at 50% 36%, rgba(211, 115, 78, 0.22), transparent 22%);
  }

  .map-node-art-heart-colchis::before {
    inset: 16px 18px;
    background:
      radial-gradient(circle at 50% 40%, rgba(255, 225, 153, 0.84), rgba(224, 133, 77, 0.42) 48%, rgba(108, 42, 34, 0.24) 68%, transparent 74%);
  }

  .map-node-art-heart-colchis::after {
    inset: auto 18px 16px;
    height: 10px;
    background: radial-gradient(ellipse at center, rgba(211, 115, 78, 0.28), transparent 74%);
  }

  .map-node-art-river-gold .map-node-art-img,
  .map-node-art-river-tribes .map-node-art-img,
  .map-node-art-sacred-grove .map-node-art-img,
  .map-node-art-pontus-coast .map-node-art-img,
  .map-node-art-forest-pass .map-node-art-img,
  .map-node-art-forge-village .map-node-art-img,
  .map-node-art-watchfires .map-node-art-img,
  .map-node-art-trade-road .map-node-art-img,
  .map-node-art-boundary-stones .map-node-art-img,
  .map-node-art-mythic-gate .map-node-art-img,
  .map-node-art-trial-ground .map-node-art-img,
  .map-node-art-marshland .map-node-art-img,
  .map-node-art-palisade .map-node-art-img,
  .map-node-art-fleece-gate .map-node-art-img,
  .map-node-art-heart-colchis .map-node-art-img {
    display: block;
  }

  .map-node-meta {
    min-width: 0;
  }

  .map-node-num {
    color: #d7b76f;
    font-size: 14px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .map-node-name {
    color: #f0dfb8;
    font-size: 20px;
    line-height: 1.14;
    margin-bottom: 6px;
  }

  .map-node-tags {
    color: #b99862;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .map-node-stars {
    font-size: 14px;
    letter-spacing: 0.16em;
    margin-bottom: 5px;
  }

  .ls-stars-completed {
    color: #d4a017;
  }

  .ls-stars-empty {
    color: #584a2b;
  }

  .map-node-best {
    color: #9f8660;
    font-size: 12px;
  }

  .map-node-best-empty {
    color: #75654b;
  }

  .map-node-completed {
    border-color: rgba(227, 179, 73, 0.44);
    background: rgba(35, 28, 18, 0.82);
  }

  .map-node-current {
    border-color: rgba(227, 179, 73, 0.88);
    box-shadow: 0 0 18px rgba(227, 179, 73, 0.14);
    animation: ls-node-pulse 2.2s ease-in-out infinite;
  }

  .map-node-unlocked {
    border-color: rgba(227, 179, 73, 0.26);
  }

  .map-node-locked {
    opacity: 0.56;
    border-color: rgba(98, 88, 60, 0.2);
    background: rgba(11, 12, 10, 0.66);
  }

  @keyframes ls-node-pulse {
    0%, 100% { box-shadow: 0 0 16px rgba(227, 179, 73, 0.12); }
    50% { box-shadow: 0 0 24px rgba(227, 179, 73, 0.24); }
  }

  .chapter-gate-card {
    padding: 18px 16px;
    border-radius: 18px;
    border: 1px dashed rgba(227, 179, 73, 0.26);
    background: rgba(10, 11, 9, 0.54);
  }

  .chapter-gate-kicker {
    color: #826d48;
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .chapter-gate-title {
    color: #d8c095;
    font-size: 22px;
    margin-bottom: 6px;
  }

  .chapter-gate-period {
    color: #aa8d58;
    font-size: 13px;
    margin-bottom: 10px;
  }

  .chapter-gate-copy {
    color: #a89571;
    font-size: 14px;
    line-height: 1.45;
    margin-bottom: 14px;
  }

  .chapter-gate-btn {
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid rgba(227, 179, 73, 0.34);
    background: rgba(18, 17, 11, 0.82);
    color: #ddc68d;
    font-family: 'Noto Serif Georgian', 'Georgia', serif;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
  }

  .ls-footer {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 28px;
    padding-bottom: 18px;
  }

  #ls-back-btn,
  #ls-reset-btn {
    min-height: 46px;
    padding: 12px 18px;
    border-radius: 12px;
    font-family: 'Noto Serif Georgian', 'Georgia', serif;
    cursor: pointer;
  }

  #ls-back-btn {
    border: 1px solid rgba(227, 179, 73, 0.52);
    background: rgba(24, 22, 15, 0.78);
    color: #eed7a4;
    font-size: 15px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  #ls-reset-btn {
    border: 1px solid rgba(128, 72, 72, 0.42);
    background: rgba(52, 16, 16, 0.4);
    color: #d9aaaa;
    font-size: 13px;
  }

  .level-briefing-sheet {
    display: none;
  }

  .level-briefing-sheet.is-open {
    display: block;
  }

  .level-briefing-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.54);
    z-index: 220;
  }

  .briefing-panel {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 221;
    max-height: 84vh;
    display: flex;
    flex-direction: column;
    border-radius: 24px 24px 0 0;
    border: 1px solid rgba(227, 179, 73, 0.32);
    background:
      linear-gradient(180deg, rgba(10, 12, 10, 0.98), rgba(7, 9, 8, 0.99)),
      radial-gradient(ellipse at top, rgba(227, 179, 73, 0.05), transparent 55%);
    box-shadow: 0 -18px 48px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }

  .briefing-close {
    align-self: flex-end;
    margin: 12px 14px 0 0;
    border: 0;
    background: transparent;
    color: #c7a870;
    font-size: 13px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .briefing-handle {
    align-self: center;
    margin-top: 10px;
    width: 44px;
    height: 5px;
    border-radius: 999px;
    background: rgba(216, 190, 141, 0.34);
  }

  .briefing-scroll {
    padding: 4px 18px 24px;
    overflow-y: auto;
  }

  .briefing-topline {
    color: #8f7a52;
    font-size: 12px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .briefing-title {
    color: #f0dfb8;
    font-size: clamp(28px, 7vw, 42px);
    line-height: 1.06;
    margin-bottom: 12px;
  }

  .briefing-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .truth-tag {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(227, 179, 73, 0.24);
    background: rgba(24, 21, 14, 0.78);
    color: #d8be8d;
    font-size: 11px;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .briefing-subline,
  .briefing-period {
    color: #ba9a63;
    font-size: 14px;
    line-height: 1.4;
  }

  .briefing-period {
    margin-top: 3px;
  }

  .briefing-teaser {
    margin-top: 14px;
    color: #dbc69f;
    font-size: 16px;
    line-height: 1.5;
  }

  .briefing-section {
    margin-top: 18px;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid rgba(227, 179, 73, 0.12);
    background: rgba(19, 18, 12, 0.52);
  }

  .briefing-section-quick {
    display: grid;
    gap: 14px;
  }

  .briefing-row {
    display: grid;
    gap: 6px;
  }

  .briefing-label {
    color: #a88b58;
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .briefing-value {
    color: #f0dfb8;
    font-size: 17px;
    line-height: 1.45;
  }

  .briefing-heading {
    color: #ecd29f;
    font-size: 18px;
    line-height: 1.35;
    margin-bottom: 10px;
  }

  .briefing-copy,
  .briefing-accordion-body {
    color: #c8b38a;
    font-size: 15px;
    line-height: 1.58;
  }

  .briefing-accordion {
    margin-top: 12px;
    border-radius: 14px;
    border: 1px solid rgba(227, 179, 73, 0.1);
    background: rgba(15, 14, 10, 0.48);
    overflow: hidden;
  }

  .briefing-accordion summary {
    list-style: none;
    cursor: pointer;
    padding: 15px 16px;
    color: #e5c889;
    font-size: 15px;
    line-height: 1.4;
  }

  .briefing-accordion summary::-webkit-details-marker {
    display: none;
  }

  .briefing-accordion[open] summary {
    border-bottom: 1px solid rgba(227, 179, 73, 0.08);
  }

  .briefing-accordion-body {
    padding: 0 16px 16px;
  }

  .briefing-actions {
    position: sticky;
    bottom: 0;
    padding: 14px 18px 18px;
    border-top: 1px solid rgba(227, 179, 73, 0.08);
    background: linear-gradient(180deg, rgba(8, 9, 8, 0.14), rgba(8, 9, 8, 0.98) 38%);
  }

  .briefing-begin-btn {
    width: 100%;
    min-height: 56px;
    border-radius: 16px;
    border: 2px solid rgba(227, 179, 73, 0.92);
    background: linear-gradient(180deg, rgba(45, 34, 14, 0.96), rgba(16, 12, 6, 0.98));
    color: #f0dfb8;
    font-family: 'Noto Serif Georgian', 'Georgia', serif;
    font-size: 20px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    box-shadow: 0 0 24px rgba(227, 179, 73, 0.14);
    cursor: pointer;
  }

  .briefing-locked-note {
    color: #b9a179;
    font-size: 14px;
    line-height: 1.45;
    text-align: center;
  }

  @media (max-width: 700px) and (orientation: portrait) {
    .ls-shell {
      padding-top: 84px;
    }

    .ls-volume-panel {
      right: 12px;
      top: 12px;
      min-width: 182px;
      padding: 12px 13px;
    }

    .campaign-title {
      font-size: clamp(30px, 8.6vw, 44px);
    }

    .campaign-subtitle {
      font-size: 15px;
    }

    .chapter-journey {
      padding: 18px 14px 10px;
      border-radius: 20px;
    }

    .map-node {
      grid-template-columns: 88px minmax(0, 1fr);
      gap: 12px;
      padding: 12px;
    }

    .map-node-art {
      width: 88px;
      height: 88px;
    }

    .map-node-name {
      font-size: 18px;
    }

    .briefing-panel {
      max-height: 82vh;
    }
  }

  @media (min-width: 701px) {
    .ls-shell {
      width: min(92vw, 960px);
    }

    .chapter-journey {
      padding: 24px 22px 14px;
    }

    .briefing-panel {
      left: 50%;
      right: auto;
      width: min(760px, 92vw);
      transform: translateX(-50%);
      border-radius: 24px 24px 0 0;
    }
  }
`;
