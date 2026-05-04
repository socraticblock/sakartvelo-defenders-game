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
    grid-template-columns: 84px minmax(0, 1fr);
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
    width: 84px;
    height: 84px;
    border-radius: 14px;
    border: 1px solid rgba(227, 179, 73, 0.24);
    background:
      linear-gradient(135deg, rgba(14, 14, 14, 0.95), rgba(5, 5, 5, 0.95)),
      radial-gradient(circle at 40% 35%, rgba(227, 179, 73, 0.06), transparent 42%);
    box-shadow: inset 0 0 0 1px rgba(255, 220, 138, 0.02);
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
      grid-template-columns: 72px minmax(0, 1fr);
      gap: 12px;
      padding: 12px;
    }

    .map-node-art {
      width: 72px;
      height: 72px;
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
