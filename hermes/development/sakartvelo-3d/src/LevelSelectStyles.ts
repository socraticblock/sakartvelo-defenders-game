/**
 * LevelSelectStyles.ts
 * All CSS for the level select screen.
 * Extracted from LevelSelect.ts.
 */
export const LEVEL_SELECT_CSS = `
  .ls-container { max-width: 560px; margin: 0 auto; }
  .ls-volume-panel {
    position: fixed; top: 20px; right: 24px; z-index: 160;
    display: flex; flex-direction: column; gap: 10px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(139, 105, 20, 0.3);
    border-radius: 10px; padding: 14px 16px;
  }
  .ls-header { text-align: center; margin-bottom: 28px; }
  .ls-era-title { color: #d4a017; font-size: 24px; margin-bottom: 6px; }
  .ls-era-years { color: #7a8a6a; font-size: 12px; }
  .ls-footer { text-align: center; margin-top: 32px; display: flex; justify-content: center; gap: 20px; }
  
  #ls-back-btn {
    padding: 10px 28px; border: 2px solid #8b6914; border-radius: 8px;
    background: rgba(139, 105, 20, 0.35); color: #f0e6d2;
    cursor: pointer; font-family: Georgia; font-size: 14px;
    transition: background 0.2s;
  }
  #ls-back-btn:hover { background: rgba(139, 105, 20, 0.5); }
  
  #ls-reset-btn {
    padding: 10px 20px; border: 1px solid #600; border-radius: 8px;
    background: rgba(100, 0, 0, 0.2); color: #f88;
    cursor: pointer; font-family: Georgia; font-size: 12px;
    transition: background 0.2s;
  }
  #ls-reset-btn:hover { background: rgba(100, 0, 0, 0.4); }

  #level-select { font-family: 'Georgia', serif; }
  .ls-chapter-header {
    text-align: center; margin: 24px 0 14px;
    color: #7a8a6a; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;
  }
  .ls-chapter-header:first-child { margin-top: 8px; }
  .ls-chapter-divider {
    width: 100%; height: 1px;
    background: linear-gradient(90deg, transparent, #3a5a3a 30%, #3a5a3a 70%, transparent);
    margin-bottom: 18px;
  }
  .ls-grid {
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 14px; margin-bottom: 28px;
  }
  .ls-card {
    background: rgba(45, 90, 61, 0.25); border: 2px solid #3a5a3a;
    border-radius: 10px; padding: 14px 6px; text-align: center;
    cursor: pointer; transition: all 0.2s; user-select: none;
  }
  .ls-card:hover:not(.ls-locked) {
    border-color: #d4a017; background: rgba(212, 160, 23, 0.1);
    transform: translateY(-2px);
  }
  .ls-card.ls-completed { border-color: #d4a017; background: rgba(212, 160, 23, 0.12); }
  .ls-card.ls-locked { opacity: 0.42; cursor: not-allowed; border-color: #2a2a2a; }
  .ls-card.ls-next {
    border-color: #d4a017;
    box-shadow: 0 0 12px rgba(212, 160, 23, 0.4);
    animation: ls-pulse 2s ease-in-out infinite;
  }
  @keyframes ls-pulse {
    0%, 100% { box-shadow: 0 0 12px rgba(212, 160, 23, 0.4); }
    50% { box-shadow: 0 0 20px rgba(212, 160, 23, 0.7); }
  }
  .ls-num { font-size: 22px; font-weight: bold; color: #d4a017; margin-bottom: 4px; }
  .ls-stars { font-size: 14px; letter-spacing: 2px; }
  .ls-stars-completed { color: #d4a017; }
  .ls-stars-empty { color: #444; }
  .ls-name { font-size: 10px; color: #8a7a5a; margin-top: 3px; line-height: 1.3; }
  .ls-chapter-bronze .ls-card {
    background: rgba(100, 65, 20, 0.2); border-color: #5a4020;
  }
  .ls-chapter-bronze .ls-card:hover:not(.ls-locked) {
    background: rgba(130, 90, 30, 0.25); border-color: #c09040;
  }
  .ls-chapter-bronze .ls-card.ls-completed {
    background: rgba(100, 70, 20, 0.28); border-color: #c09040;
  }
  .ls-chapter-bronze .ls-num { color: #c09040; }
  .ls-chapter-steel .ls-card {
    background: rgba(30, 50, 70, 0.25); border-color: #2a3a4a;
  }
  .ls-chapter-steel .ls-card:hover:not(.ls-locked) {
    background: rgba(40, 60, 85, 0.3); border-color: #4a6a8a;
  }
  .ls-chapter-steel .ls-card.ls-completed {
    background: rgba(35, 55, 75, 0.3); border-color: #4a6a8a;
  }
  .ls-chapter-steel .ls-num { color: #7a9aaa; }
`;
