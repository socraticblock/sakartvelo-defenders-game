/**
 * ScreenManager.ts
 * Intro/title/era/chapter/game-over/level-complete screens, tutorial, cultural facts.
 * Extracted from UIManager.ts.
 */
import { gs } from './GameState';
import { LevelSelect } from './LevelSelect';
import type { Hero } from './Hero';

const TUTORIALS: Record<number, string> = {
  1: "🗼 Your hero, Medea, is here. Move her with WASD/ZQSD to attack enemies.\nTap a tower button below, then tap the grid to place it. Archers shoot enemies in range!",
  2: "🧱 Wall towers have huge HP — place them to block enemy paths and slow the horde.",
  3: "💥 Catapults deal splash damage to groups. Position them behind walls!",
  4: "⚡ Harpy enemies fly — only Archers can hit them. Place towers in their flight path!",
  5: "👹 The Bronze Devi is a boss — she's tough. Surround her with all your towers!",
};
const seenTutorials = new Set<number>();

interface CulturalFact { cat: string; text: string; }
let culturalFacts: CulturalFact[] = [];
let cfIndex = 0;
let cfTimer: ReturnType<typeof setInterval> | null = null;

type OnLevelSelect = (era: number, level: number) => void;
type OnEscape = () => void;
let _onLevelSelect: OnLevelSelect = () => {};
let _onEscape: OnEscape = () => {};

const TOWER_UNLOCK_TEXT: Record<string, { minLevel: number; text: string }> = {
  wall:     { minLevel: 2, text: '🧱 Wall (Unlocks L2)' },
  catapult: { minLevel: 3, text: '💥 Catapult (Unlocks L3)' },
};

export class ScreenManager {
  private $abilityQ = document.getElementById('ability-q') as HTMLButtonElement;
  private $abilityW = document.getElementById('ability-w') as HTMLButtonElement;
  private $abilityE = document.getElementById('ability-e') as HTMLButtonElement;
  private $gameOver = document.getElementById('game-over')!;
  private $goTitle = document.getElementById('game-over-title')!;
  private $goMsg = document.getElementById('game-over-msg')!;
  private $goStars = document.getElementById('game-over-stars')!;
  private $levelComplete = document.getElementById('level-complete')!;

  init(onLevelSelect: OnLevelSelect, onEscape: OnEscape): void {
    _onLevelSelect = onLevelSelect;
    _onEscape = onEscape;
    this._bindIntroButtons();
    this._bindTeleprompterControls();
    this._bindAbilityButtons();
  }

  // ─── Screens ────────────────────────────────────────────────────────────────

  showTitleScreen(): void { this._showScreen('screen-title'); }

  showEraScreen(): void {
    this._showScreen('screen-era');
    // Auto-start era narration when screen opens
    const audio = (window as any).__audioMgr;
    if (audio) audio.startEraNarration();
  }

  showChapterScreen(): void {
    this._showScreen('screen-chapter');
    // Auto-start chapter narration when screen opens
    const audio = (window as any).__audioMgr;
    if (audio) audio.playChapterNarration();
  }

  private _showScreen(id: string): void {
    document.querySelectorAll('.intro-overlay').forEach(el => {
      (el as HTMLElement).style.display = 'none';
      el.classList.remove('visible');
    });
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('visible');
      el.style.display = '';  // clear inline so CSS class wins
    }
  }

  private _hideScreen(id: string): void {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible');
  }

  private _bindIntroButtons(): void {
    document.getElementById('btn-title-continue')?.addEventListener('click', () => {
      this._hideScreen('screen-title');
      this.showEraScreen();
    });
    document.getElementById('btn-era-continue')?.addEventListener('click', () => {
      const audio = (window as any).__audioMgr;
      if (audio) audio.stopEraNarration();
      this._hideScreen('screen-era');
      this.showLevelSelect();
    });
    document.getElementById('btn-chapter-continue')?.addEventListener('click', () => {
      const audio = (window as any).__audioMgr;
      if (audio) audio.stopChapterNarration();
      this._hideScreen('screen-chapter');
      this.showLevelSelect();
    });
  }

  // ─── Level select ──────────────────────────────────────────────────────────

  showLevelSelect(): void {
    LevelSelect.show(
      0,
      document.getElementById('level-select')!,
      gs.allLevels,
      (era, level) => {
        const lvl = gs.allLevels.find(l => l.era === era && l.level === level);
        if (lvl) { LevelSelect.hide(); _onLevelSelect(era, level); }
      },
      () => { LevelSelect.hide(); this.showTitleScreen(); },
    );
  }

  // ─── Game over / Level complete ───────────────────────────────────────────

  showGameOver(won: boolean): void {
    gs.gameOver = true;
    const stars = gs.getStars();
    this.$goTitle.textContent = won ? '🎉 VICTORY!' : '💀 DEFEAT!';
    this.$goMsg.textContent = won
      ? `${gs.currentLevel?.name} defended! All waves cleared.`
      : `${gs.currentLevel?.name} has fallen after wave ${gs.waveMgr?.waveNum}.`;
    this.$goStars.textContent = `Lives remaining: ${gs.lives}  ${gs.getStarString(stars)}`;
    this.$gameOver.style.display = 'block';
    gs.saveLevelComplete(won);
  }

  hideGameOver(): void {
    this.$gameOver.style.display = 'none';
  }

  showLevelComplete(stars: number): void {
    if (!gs.currentLevel) return;
    const lvl = gs.currentLevel;
    const title = document.getElementById('lc-title')!;
    const starEl = document.getElementById('lc-stars')!;
    const msg = document.getElementById('lc-msg')!;
    const nextBtn = document.getElementById('lc-next') as HTMLButtonElement;
    const menuBtn = document.getElementById('lc-menu') as HTMLButtonElement;

    title.textContent = lvl.name;
    starEl.textContent = gs.getStarString(stars);
    msg.textContent = stars === 3 ? 'Perfect! No lives lost.' : stars === 2 ? 'Well defended!' : 'Level cleared!';

    const levelId = (window as any).__saveManager.levelId(lvl.era, lvl.level) as string;
    const nextLevelId = (window as any).__saveManager.isNextUnlocked(levelId) as string | false;
    if (nextLevelId) {
      nextBtn.style.display = '';
      nextBtn.textContent = 'Next Level →';
      nextBtn.onclick = () => {
        this.$levelComplete.style.display = 'none';
        _onLevelSelect(lvl.era, lvl.level + 1);
      };
    } else {
      nextBtn.style.display = 'none';
    }
    menuBtn.onclick = () => { this.$levelComplete.style.display = 'none'; this.showLevelSelect(); };
    this.$levelComplete.style.display = 'block';
  }

  hideLevelComplete(): void {
    this.$levelComplete.style.display = 'none';
  }

  // ─── Tutorial ─────────────────────────────────────────────────────────────

  showTutorial(levelNum: number): void {
    if (seenTutorials.has(levelNum)) return;
    seenTutorials.add(levelNum);
    const msg = TUTORIALS[levelNum];
    if (!msg) return;
    const overlay = document.getElementById('tutorial-overlay')!;
    const text = document.getElementById('tutorial-text')!;
    text.textContent = msg;
    overlay.style.display = 'block';
    const dismiss = () => { overlay.style.display = 'none'; };
    overlay.addEventListener('click', dismiss, { once: true });
    overlay.addEventListener('keydown', dismiss, { once: true });
  }

  // ─── Cultural facts footer ─────────────────────────────────────────────────

  startCulturalFacts(): void {
    fetch('/content/cultural_footer.txt')
      .then(r => r.text())
      .then(text => {
        text.split('\n').forEach(line => {
          const sep = line.indexOf('|');
          if (sep > 0) {
            culturalFacts.push({
              cat: line.slice(0, sep).trim(),
              text: line.slice(sep + 1).trim().replace(/^[""]|[""]$/g, ''),
            });
          }
        });
        if (culturalFacts.length > 0) this._cycleCulturalFact();
      })
      .catch(() => {
        const el = document.getElementById('cf-text');
        if (el) el.textContent = '';
      });
  }

  private _cycleCulturalFact(): void {
    if (cfTimer !== null) clearInterval(cfTimer);
    const el = document.getElementById('cf-text')!;
    if (culturalFacts.length === 0) return;
    const show = () => {
      if (culturalFacts.length === 0) return;
      cfIndex = (cfIndex + 1) % culturalFacts.length;
      el.textContent = `${culturalFacts[cfIndex].cat} — "${culturalFacts[cfIndex].text}"`;
    };
    show();
    cfTimer = setInterval(show, 8000);
  }

  // ─── Teleprompter controls ─────────────────────────────────────────────────

  private _bindTeleprompterControls(): void {
    document.getElementById('btn-era-prev')?.addEventListener('click', () => {
      const audio = (window as any).__audioMgr as any;
      if (audio?._eraAudioEl) {
        audio._eraAudioEl.currentTime = Math.max(0, audio._eraAudioEl.currentTime - 10);
      }
    });
    document.getElementById('btn-era-next')?.addEventListener('click', () => {
      const audio = (window as any).__audioMgr as any;
      if (audio?._eraAudioEl) {
        audio._eraAudioEl.currentTime = Math.min(audio._tpAudioDuration, audio._eraAudioEl.currentTime + 10);
      }
    });
    document.getElementById('btn-era-play')?.addEventListener('click', () => {
      const audio = (window as any).__audioMgr as any;
      if (!audio) return;
      if (audio._eraPlaying) audio.stopEraNarration();
      else audio.startEraNarration();
    });
  }

  // ─── Ability buttons ──────────────────────────────────────────────────────

  private _bindAbilityButtons(): void {
    this.$abilityQ.addEventListener('click', () => {
      if (gs.hero?.alive) gs.hero.activateAbility(0, gs.enemies, gs.towers);
    });
    this.$abilityW.addEventListener('click', () => {
      if (gs.hero?.alive) gs.hero.activateAbility(1, gs.enemies, gs.towers);
    });
    this.$abilityE.addEventListener('click', () => {
      if (gs.hero?.alive) gs.hero.activateAbility(2, gs.enemies, gs.towers);
    });
  }

  updateAbilities(hero: Hero | null): void {
    if (!hero) return;
    this._updateAbilityBtn(this.$abilityQ, hero.abilities[0] as any, 0);
    this._updateAbilityBtn(this.$abilityW, hero.abilities[1] as any, 1);
    this._updateAbilityBtn(this.$abilityE, hero.abilities[2] as any, 2);
  }

  private _updateAbilityBtn(
    el: HTMLButtonElement,
    ab: any,
    idx: number,
  ): void {
    if (!ab) return;
    const labels = ['Q', 'W', 'E'];
    const icons = ['☠️', '🌿', '⚗️'];
    const icon = icons[idx] || '';
    if (ab.active) {
      el.textContent = `${icon} ${ab.timer.toFixed(0)}s`;
      el.classList.add('ability-active');
      el.classList.remove('ability-cd');
      el.disabled = true;
    } else if (ab.cooldown !== undefined && ab.cooldown > 0) {
      el.textContent = `${icon} ${ab.cooldown.toFixed(0)}s`;
      el.classList.add('ability-cd');
      el.classList.remove('ability-active');
      el.disabled = true;
    } else {
      el.textContent = `${icon} [${labels[idx]}]`;
      el.classList.remove('ability-cd', 'ability-active');
      el.disabled = false;
    }
  }
}
