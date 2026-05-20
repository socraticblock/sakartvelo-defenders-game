/**
 * LevelSelectStyles.ts
 * Fixed one-screen campaign map styling.
 */
export const LEVEL_SELECT_CSS = `
  #screen-level-select,
  #screen-level-select.campaign-map-mode {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    overflow: hidden !important;
    justify-content: stretch;
    padding: 0;
    background: #07100b;
    touch-action: none;
  }

  #screen-level-select::before { display: none; }

  .ls-shell,
  .ls-shell-campaign {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    margin: 0;
    padding: 0;
    overflow: hidden;
    z-index: 1;
  }

  .campaign-map-shell {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    color: #f0dfb8;
    background:
      radial-gradient(circle at 15% 82%, rgba(212, 160, 23, 0.18), transparent 18%),
      radial-gradient(circle at 80% 24%, rgba(212, 160, 23, 0.12), transparent 14%),
      linear-gradient(135deg, #0f2417 0%, #203b22 32%, #2d5a3d 58%, #102015 100%);
  }

  .campaign-bg,
  .campaign-route-svg,
  .campaign-node-layer { position: absolute; inset: 0; }
  .campaign-bg { pointer-events: none; overflow: hidden; }
  .campaign-bg::before {
    content: '';
    position: absolute;
    inset: -12%;
    background:
      radial-gradient(ellipse at 20% 18%, rgba(135, 206, 235, 0.18), transparent 22%),
      radial-gradient(ellipse at 62% 78%, rgba(139, 115, 85, 0.28), transparent 24%),
      radial-gradient(ellipse at 92% 34%, rgba(27, 58, 38, 0.54), transparent 24%),
      linear-gradient(180deg, rgba(5, 9, 7, 0.05), rgba(0, 0, 0, 0.24));
  }

  .campaign-river {
    position: absolute;
    left: -8%; top: 58%; width: 120%; height: 20%;
    transform: rotate(-16deg);
    border-radius: 50%;
    background: linear-gradient(90deg, rgba(46, 134, 171, 0.15), rgba(46, 134, 171, 0.78), rgba(135, 206, 235, 0.54), rgba(46, 134, 171, 0.18));
    box-shadow: 0 0 34px rgba(46, 134, 171, 0.2), inset 0 0 24px rgba(255, 255, 255, 0.1);
  }

  .campaign-forest {
    position: absolute;
    pointer-events: none;
    background-image:
      radial-gradient(circle, rgba(14, 44, 24, 0.95) 0 16%, transparent 18%),
      radial-gradient(circle, rgba(20, 69, 35, 0.9) 0 13%, transparent 15%),
      radial-gradient(circle, rgba(42, 93, 54, 0.78) 0 10%, transparent 12%);
    background-size: 72px 72px, 92px 92px, 56px 56px;
    opacity: 0.82;
  }
  .campaign-forest-left { left: -4%; top: -8%; width: 30%; height: 116%; }
  .campaign-forest-top { left: 8%; top: -10%; width: 92%; height: 34%; opacity: 0.54; }

  .campaign-gold-dust {
    position: absolute;
    left: 8%; bottom: 10%; width: 44%; height: 36%;
    background:
      radial-gradient(circle at 10% 80%, rgba(212, 160, 23, 0.5) 0 2px, transparent 3px),
      radial-gradient(circle at 45% 48%, rgba(212, 160, 23, 0.35) 0 2px, transparent 3px),
      radial-gradient(circle at 70% 64%, rgba(212, 160, 23, 0.32) 0 1px, transparent 3px),
      radial-gradient(circle at 88% 38%, rgba(212, 160, 23, 0.26) 0 2px, transparent 4px);
  }

  .campaign-route-svg { z-index: 4; pointer-events: none; }
  .campaign-route {
    fill: none;
    stroke: rgba(77, 50, 24, 0.86);
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-dasharray: 1.8 1.1;
    vector-effect: non-scaling-stroke;
  }
  .campaign-route-lit { stroke: rgba(212, 160, 23, 0.92); stroke-width: 2; stroke-dasharray: none; }

  .campaign-topbar {
    position: absolute;
    z-index: 20;
    left: calc(12px + var(--safe-left)); right: calc(12px + var(--safe-right)); top: calc(10px + var(--safe-top));
    display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
    pointer-events: none;
  }
  .campaign-era-badge, .campaign-top-actions, .campaign-hero-chip, .campaign-star-chip, .campaign-info-card {
    border: 1px solid rgba(227, 179, 73, 0.42);
    background: rgba(5, 8, 6, 0.68);
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.28), inset 0 0 0 1px rgba(255, 238, 188, 0.05);
    backdrop-filter: blur(8px);
  }
  .campaign-era-badge { display: grid; gap: 2px; min-width: min(290px, 40vw); padding: 10px 13px; border-radius: 16px; }
  .campaign-era-small, .campaign-era-badge span, .campaign-star-chip span, .campaign-hero-chip span, .campaign-card-kicker {
    color: #c7a764; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  }
  .campaign-era-badge strong { color: #f4dfad; font-size: clamp(16px, 2.7vw, 24px); line-height: 1; }
  .campaign-top-actions { display: flex; gap: 8px; padding: 7px; border-radius: 14px; pointer-events: auto; }
  .campaign-top-actions button, .campaign-read-btn, .campaign-readmore-close {
    border-radius: 11px; border: 1px solid rgba(227, 179, 73, 0.38); background: rgba(24, 22, 15, 0.74); color: #ead29a; font-family: inherit; cursor: pointer;
  }
  .campaign-top-actions button { min-height: 32px; padding: 0 10px; font-size: 12px; }

  .campaign-title-block {
    position: absolute; z-index: 8; left: 32%; top: 11%; transform: translateX(-50%);
    width: min(440px, 42vw); text-align: center; pointer-events: none; text-shadow: 0 3px 14px rgba(0,0,0,.62);
  }
  .campaign-title-kicker { color: #d4a017; font-size: 11px; letter-spacing: .26em; text-transform: uppercase; }
  .campaign-title-block h1 { margin: 3px 0 0; color: #f1dfb5; font-size: clamp(19px, 3vw, 36px); line-height: 1.02; }

  .campaign-node-layer { z-index: 10; }
  .campaign-node {
    position: absolute;
    width: clamp(38px, 7.2vh, 62px); height: clamp(38px, 7.2vh, 62px);
    transform: translate(-50%, -50%);
    border-radius: 50%; border: 2px solid rgba(238, 203, 119, 0.76);
    background: radial-gradient(circle at 35% 28%, #f4de9a, #c28624 44%, #3d2b16 100%);
    color: #180f07; font-family: inherit; font-weight: 800;
    box-shadow: 0 8px 22px rgba(0,0,0,.36), 0 0 0 5px rgba(11,25,14,.34);
    cursor: pointer; z-index: 12; touch-action: manipulation;
  }
  .campaign-node-icon { position: relative; z-index: 2; font-size: clamp(15px, 3.2vh, 24px); }
  .campaign-node-label {
    position: absolute; left: 50%; top: calc(100% + 4px); transform: translateX(-50%);
    min-width: 80px; color: #f4dfad; font-size: 10px; text-shadow: 0 2px 8px #000; pointer-events: none;
  }
  .campaign-node-stars { position: absolute; left: 50%; bottom: calc(100% + 3px); transform: translateX(-50%); white-space: nowrap; font-size: 10px; text-shadow: 0 1px 5px #000; }
  .campaign-node-glow { position: absolute; inset: -9px; border-radius: 50%; opacity: 0; background: radial-gradient(circle, rgba(212,160,23,.42), transparent 68%); animation: campaign-node-pulse 1.8s ease-in-out infinite; }
  .campaign-node-current .campaign-node-glow, .campaign-node.is-selected .campaign-node-glow { opacity: 1; }
  .campaign-node.is-selected { outline: 3px solid rgba(255,244,205,.74); transform: translate(-50%, -50%) scale(1.07); }
  .campaign-node-completed { background: radial-gradient(circle at 35% 28%, #fff1b8, #d4a017 48%, #6f4c12 100%); }
  .campaign-node-locked, .campaign-node-coming-soon { filter: grayscale(.78) brightness(.62); border-color: rgba(187,160,112,.34); }
  .campaign-node-boss { width: clamp(46px, 8.6vh, 74px); height: clamp(46px, 8.6vh, 74px); border-color: rgba(234,82,52,.86); background: radial-gradient(circle at 35% 28%, #ffd8a8, #b54522 48%, #2b0e08 100%); }
  .campaign-node-challenge { border-radius: 28%; background: radial-gradient(circle at 35% 28%, #ebf3c8, #8aa864 48%, #273818 100%); }
  @keyframes campaign-node-pulse { 0%,100% { transform: scale(.92); opacity:.42; } 50% { transform: scale(1.12); opacity:.9; } }

  .campaign-hero-chip { position: absolute; z-index: 18; left: calc(14px + var(--safe-left)); bottom: calc(14px + var(--safe-bottom)); display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 18px; }
  .campaign-hero-orb { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; color: #1c1006; background: linear-gradient(180deg, #f4dfad, #d4a017); font-weight: 900; }
  .campaign-hero-chip strong, .campaign-star-chip strong { display: block; color: #f2dfae; font-size: 16px; line-height: 1; }
  .campaign-star-chip { position: absolute; z-index: 18; left: calc(15px + var(--safe-left)); bottom: calc(76px + var(--safe-bottom)); padding: 8px 12px; border-radius: 14px; }

  .campaign-info-card {
    position: absolute; z-index: 18; right: calc(14px + var(--safe-right)); bottom: calc(14px + var(--safe-bottom));
    width: min(360px, 35vw); max-height: calc(100dvh - 86px - var(--safe-top) - var(--safe-bottom)); overflow: hidden;
    border-radius: 22px; padding: 15px;
  }
  .campaign-card-title { margin: 2px 0 6px; color: #f4dfad; font-size: clamp(20px, 2.4vw, 31px); line-height: 1.02; }
  .campaign-card-stars { margin-bottom: 8px; font-size: 15px; }
  .campaign-stars-full { color: #ffd166; } .campaign-stars-empty { color: rgba(244,223,173,.38); }
  .campaign-card-copy, .campaign-card-objective, .campaign-lock-note { color: #d7c091; font-size: 13px; line-height: 1.35; }
  .campaign-card-objective { margin-top: 9px; padding: 9px 10px; border-radius: 12px; background: rgba(0,0,0,.22); color: #f0dfb8; }
  .campaign-card-actions { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-top: 12px; }
  .campaign-play-btn { min-height: 46px; border-radius: 14px; border: 2px solid rgba(255,231,154,.84); background: linear-gradient(180deg, #d4a017, #8b6914); color: #120f0a; font-family: inherit; font-size: 16px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
  .campaign-play-btn.is-disabled { opacity: .52; cursor: not-allowed; }
  .campaign-read-btn { min-width: 88px; padding: 0 11px; font-size: 12px; }
  .campaign-lock-note { margin-top: 8px; color: #ba8a71; }

  .campaign-volume-panel { position: fixed; z-index: 40; right: calc(14px + var(--safe-right)); top: calc(58px + var(--safe-top)); min-width: 182px; padding: 9px 10px; border-radius: 13px; border: 1px solid rgba(227,179,73,.26); background: rgba(5,8,6,.52); backdrop-filter: blur(7px); }
  .campaign-volume-panel .vol-row { display: flex; align-items: center; gap: 8px; }
  .campaign-volume-panel .vol-label, .campaign-volume-panel .vol-val { color: #c7a764; font-size: 12px; }
  .campaign-volume-panel input[type='range'] { width: 82px; }

  .campaign-readmore { position: fixed; inset: 0; z-index: 80; }
  .campaign-readmore-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.56); }
  .campaign-readmore-panel { position: absolute; right: calc(16px + var(--safe-right)); top: calc(16px + var(--safe-top)); bottom: calc(16px + var(--safe-bottom)); width: min(520px, 52vw); overflow-y: auto; touch-action: pan-y; padding: 22px; border-radius: 22px; border: 1px solid rgba(227,179,73,.42); background: rgba(7,10,7,.96); box-shadow: 0 18px 60px rgba(0,0,0,.56); }
  .campaign-readmore-close { float: right; min-height: 34px; padding: 0 12px; }
  .campaign-readmore-kicker { color: #d4a017; font-size: 11px; letter-spacing: .2em; }
  .campaign-readmore-panel h2 { margin: 6px 0 8px; color: #f4dfad; font-size: 30px; }
  .campaign-readmore-panel h3 { margin: 18px 0 7px; color: #d4a017; }
  .campaign-readmore-panel p { color: #d8c39a; line-height: 1.55; }

  .campaign-fallback-grid { position: absolute; left: 18px; right: 18px; top: 86px; bottom: 18px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; overflow-y: auto; touch-action: pan-y; }
  .campaign-fallback-level { min-height: 72px; border-radius: 16px; border: 1px solid rgba(227,179,73,.35); background: rgba(5,8,6,.74); color: #f0dfb8; font-family: inherit; text-align: left; padding: 12px; }

  @media (pointer: coarse) and (orientation: landscape), (max-height: 620px) and (orientation: landscape) {
    .campaign-era-badge { min-width: 0; max-width: 34vw; padding: 8px 10px; }
    .campaign-era-badge strong { font-size: clamp(15px, 4vh, 20px); }
    .campaign-era-badge span:last-child, .campaign-title-block, .campaign-volume-panel, .campaign-card-copy, .campaign-card-objective, .campaign-star-chip { display: none; }
    .campaign-info-card { width: min(286px, 38vw); padding: 11px; border-radius: 18px; }
    .campaign-card-title { font-size: clamp(17px, 4.8vh, 23px); }
    .campaign-card-actions { grid-template-columns: 1fr; gap: 7px; margin-top: 9px; }
    .campaign-play-btn { min-height: 42px; font-size: 14px; }
    .campaign-read-btn { min-height: 34px; }
    .campaign-hero-chip { padding: 7px 9px; border-radius: 15px; }
    .campaign-hero-orb { width: 34px; height: 34px; }
    .campaign-node-label { display: none; }
    .campaign-readmore-panel { left: calc(16px + var(--safe-left)); right: calc(16px + var(--safe-right)); width: auto; padding: 16px; }
  }
`;
