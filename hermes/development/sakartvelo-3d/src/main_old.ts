import * as THREE from 'three';
import { LevelData, TOWER_CONFIGS, ENEMY_CONFIGS, TileUserData } from './types';
import { Grid } from './Grid';
import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { Projectile, ProjectilePool } from './Projectile';
import { WaveManager } from './WaveManager';
import { Hero } from './Hero';
import { SaveManager } from './SaveManager';
import { LevelSelect } from './LevelSelect';
import { spawnFloatingGold, spawnHitFlash, spawnSplashRing, updateEffects, disposeEffects } from './Effects';
import { showPopup } from './HistoricalPopup';

// ─── NARRATION SYSTEM ──────────────────────────────────────────────────────────
let _narrationAudio: HTMLAudioElement | null = null;

function playNarration(src: string) {
  console.log('[Narration] play:', src);
  if (_narrationAudio) {
    _narrationAudio.pause();
    _narrationAudio = null;
  }
  _narrationAudio = new Audio(src);
  _narrationAudio.addEventListener('error', e => console.warn('[Narration] load error:', e));
  _narrationAudio.addEventListener('canplay', () => {
    _narrationAudio!.play().catch(e => console.warn('[Narration] play blocked:', e.message));
  }, { once: true });
}

function stopNarration() {
  if (_narrationAudio) {
    _narrationAudio.pause();
    _narrationAudio = null;
  }
}

// ─── VOLUME CONTROLS ───
// ─── TELEPROMPTER / AUTO-CUE SYSTEM ──────────────────────────────────────────

const ERA_PARAGRAPHS = [
  "On the eastern shores of the Black Sea, where the Caucasus Mountains plunge into the sea, a civilization flourished for fifteen centuries.",
  "Long before Rome existed, long before Athens wrote its first plays, Bronze Age farmers here were already mining gold, smelting iron, and building sophisticated settlements.",
  "By the sixth century before Christ, Greek ships began arriving at ports along this coast, drawn by Colchis's legendary wealth.",
  "The Greeks told stories in return: Jason and the Argonauts sailing east to steal the Golden Fleece from King Aeetes. The myth was rooted in something real — Colchian gold was extracted by placing sheepskins in mountain streams, trapping gold flakes in the wool.",
  "The Greeks called the people Colchians. Herodotus, visiting in the fifth century BC, noted they resembled Egyptians, a connection that still puzzles historians today.",
  "This was the land of Medea, the sorceress princess. And this was the land archaeologists call Vani, a sacred city of temples and trade, one of the most important Colchian sites.",
  "Colchis endured until eighty-three before the common era, when Mithridates of Pontus conquered it. But the people endured. Their language became Kartuli. Their story never ended.",
  "This is the story of Sakartvelo — a land that refused to fall.",
];

// Word-start timestamps (seconds into speech) indexed by word position.
// Populated once at init via Web Speech API calibration.
let _tpWordTimes: number[] = [];
let _tpWordEls: NodeListOf<HTMLElement> | null = null;
let _tpActiveWordIdx = -1;
let _tpRafId: number | null = null;
let _tpAudioDuration = 0; // real audio duration, set when audio loads
let _eraPlaying = false;
let _eraAudioEl: HTMLAudioElement | null = null;

// ─── Web Speech API calibration ────────────────────────────────────────────────
function calibrateWordTimes(): Promise<number[]> {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    const fullText = ERA_PARAGRAPHS.join(' ');
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = 1.0;
    utterance.volume = 0; // silent
    utterance.pitch = 1.0;

    const times: number[] = [];
    let charIndex = 0;

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        // e.charIndex is the character offset where this word starts
        // e.charLength is the number of characters in the word
        times.push(e.charIndex);
      }
    };

    utterance.onend = () => {
      resolve(times);
    };
    utterance.onerror = () => {
      resolve([]);
    };

    // Cancel any ongoing speech and speak
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  });
}

// ─── Build word spans ─────────────────────────────────────────────────────────
function buildEraTeleprompter() {
  const track = document.getElementById('era-tp-track')!;
  track.innerHTML = '';
  ERA_PARAGRAPHS.forEach(para => {
    const words = para.split(' ');
    words.forEach(word => {
      const span = document.createElement('span');
      span.className = 'tp-word';
      span.textContent = word + ' ';
      track.appendChild(span);
    });
    const sep = document.createElement('span');
    sep.className = 'tp-para-end';
    track.appendChild(sep);
  });
  _tpWordEls = document.querySelectorAll<HTMLElement>('#era-tp-track .tp-word');
}

// ─── RAF tick — auto-scrolls teleprompter, no word highlighting ───────────────
function tpTick() {
  if (!_eraAudioEl || !_tpWordEls) return;

  const elapsed = _eraAudioEl.currentTime;
  const audioDur = _eraAudioEl.duration || _tpAudioDuration;

  // Update progress time
  const prog = document.getElementById('era-tp-progress')!;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  prog.textContent = `⏱ ${fmt(elapsed)} / ${fmt(audioDur)}`;

  // Find which word is at current audio time and scroll it into view
  if (_tpWordTimes.length > 0 && audioDur > 0) {
    const scale = audioDur / (_tpWordTimes[_tpWordTimes.length - 1] || 1);
    const scaledElapsed = elapsed / scale;
    let lo = 0, hi = _tpWordTimes.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (_tpWordTimes[mid] <= scaledElapsed) lo = mid;
      else hi = mid - 1;
    }
    const wordIdx = Math.min(lo, _tpWordEls.length - 1);
    if (_tpWordEls[wordIdx]) {
      _tpWordEls[wordIdx].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  if (_eraPlaying && !_eraAudioEl.ended) {
    _tpRafId = requestAnimationFrame(tpTick);
  } else if (_eraAudioEl.ended) {
    const playBtn = document.getElementById('btn-era-play') as HTMLButtonElement;
    playBtn.textContent = '▶ Play Narration';
    playBtn.classList.remove('playing');
    playBtn.disabled = false;
    _eraPlaying = false;
  }
}

// ─── Init — calibrate Web Speech API timings at startup ──────────────────────
calibrateWordTimes().then(times => {
  _tpWordTimes = times;
  console.log(`[Teleprompter] calibrated ${times.length} word times`);
});

// ─── Start narration ───────────────────────────────────────────────────────────
function startEraNarration() {
  buildEraTeleprompter();
  const playBtn = document.getElementById('btn-era-play') as HTMLButtonElement;
  playBtn.textContent = '⏳ Loading...';
  playBtn.classList.add('playing');
  playBtn.disabled = true;
  _eraPlaying = true;
  _tpActiveWordIdx = -1;

  _eraAudioEl = new Audio('./audio/narration-era0-intro.mp3');
  _eraAudioEl.preload = 'auto';
  _eraAudioEl.volume = (parseInt((document.getElementById('vol-narration') as HTMLInputElement).value)) / 100;

  _eraAudioEl.addEventListener('error', e => {
    console.warn('[Narration] load error:', e);
    playBtn.textContent = '▶ Play Narration';
    playBtn.disabled = false;
    playBtn.classList.remove('playing');
    _eraPlaying = false;
  });

  _eraAudioEl.addEventListener('canplay', () => {
    _tpAudioDuration = _eraAudioEl!.duration;
    playBtn.textContent = '■ Stop';
    playBtn.disabled = false;
    _eraAudioEl!.play().catch(e => {
      console.warn('[Narration] play blocked:', e.message);
      playBtn.textContent = '▶ Play Narration';
      playBtn.disabled = false;
      playBtn.classList.remove('playing');
      _eraPlaying = false;
    });
    if (_tpRafId) cancelAnimationFrame(_tpRafId);
    _tpRafId = requestAnimationFrame(tpTick);
  }, { once: true });
}

// ─── Stop narration ───────────────────────────────────────────────────────────
function stopEraNarration() {
  _eraPlaying = false;
  if (_tpRafId) { cancelAnimationFrame(_tpRafId); _tpRafId = null; }
  if (_eraAudioEl) { _eraAudioEl.pause(); _eraAudioEl = null; }
  const playBtn = document.getElementById('btn-era-play') as HTMLButtonElement;
  playBtn.textContent = '▶ Play Narration';
  playBtn.disabled = false;
  playBtn.classList.remove('playing');
}

// ─── Build word spans once ────────────────────────────────────────────────────

// ─── VOLUME CONTROLS ─────────────────────────────────────────────────────────
function setupVolumeControls() {
  const narrSlider = document.getElementById('vol-narration') as HTMLInputElement;
  const narrVal = document.getElementById('vol-narration-val')!;

  function updateSliderBg(slider: HTMLInputElement) {
    const pct = slider.value + '%';
    slider.style.background = `linear-gradient(90deg, #8b6914 ${pct}, #3a3020 ${pct})`;
  }

  narrSlider.addEventListener('input', () => {
    narrVal.textContent = narrSlider.value;
    updateSliderBg(narrSlider);
    if (_eraAudioEl) _eraAudioEl.volume = parseInt(narrSlider.value) / 100;
  });
  updateSliderBg(narrSlider);
}

// ─── TUTORIAL SYSTEM ─────────────────────────────────────────────────────────
// Shown once per level per session. Positioned above HUD (bottom ~130px).
const TUTORIALS: Record<number, string> = {
  1: "🗼 Your hero, Medea, is here. Move her with WASD/ZQSD to attack enemies.\nTap a tower button below, then tap the grid to place it.\nArchers shoot enemies in range!",
  2: "🧱 Wall towers have huge HP — place them to block enemy paths and slow the horde.",
  3: "💥 Catapults deal splash damage to groups. Position them behind walls!",
  4: "⚡ Harpy enemies fly — only Archers can hit them. Place towers in their flight path!",
  5: "👹 The Bronze Devi is a boss — she's tough. Surround her with all your towers!",
};
const seenTutorials = new Set<number>();

function showTutorial(levelNum: number) {
  if (seenTutorials.has(levelNum)) return;
  seenTutorials.add(levelNum);
  const msg = TUTORIALS[levelNum];
  if (!msg) return;
  const overlay = document.getElementById('tutorial-overlay')!;
  const text = document.getElementById('tutorial-text')!;
  text.textContent = msg;
  overlay.style.display = 'block';

  function dismiss() {
    overlay.style.display = 'none';
    overlay.removeEventListener('click', dismiss);
    overlay.removeEventListener('keydown', dismiss);
  }
  overlay.addEventListener('click', dismiss, { once: true });
  overlay.addEventListener('keydown', dismiss, { once: true });
}

// ─── SCENE ───
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2a1a);
scene.fog = new THREE.FogExp2(0x1a2a1a, 0.015);

// ─── CAMERA (fixed isometric-ish) ───
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 120);

// ─── RENDERER ───
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

// ─── POST-PROCESSING (bloom — disabled for perf, was causing event loop starvation)
// Re-enable once we have a proper render budget (target 60fps with headroom)
// const composer = new EffectComposer(renderer);
// composer.addPass(new RenderPass(scene, camera));
// const bloomPass = new UnrealBloomPass(
//   new THREE.Vector2(Math.floor(innerWidth / 2), Math.floor(innerHeight / 2)),
//   0.35, 0.3, 0.85
// );
// composer.addPass(bloomPass);

// ─── LIGHTING ───
scene.add(new THREE.AmbientLight(0x667766, 0.5));
const hemi = new THREE.HemisphereLight(0x99bb99, 0x443322, 0.4);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffeedd, 1.4);
sun.position.set(12, 22, 14);
sun.castShadow = true;
sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

// ─── GROUND ───
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshLambertMaterial({ color: 0x2a3a2a })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.06;
ground.receiveShadow = true;
scene.add(ground);

// ─── GAME STATE ───
let grid: Grid | null = null;
let waveMgr: WaveManager | null = null;
let hero: Hero | null = null;
let enemies: Enemy[] = [];
let towers: Tower[] = [];
let projectilePool: ProjectilePool = new ProjectilePool(scene);
let gold = 100;
let lives = 20;
let startingLives = 20;
let selectedType: string | null = null;
let selectedTower: Tower | null = null;
let currentLevel: LevelData | null = null;
let gameOver = false;
let paused = false;

// Module-level level data (for level select)
let allLevels: LevelData[] = [];

// Wave countdown (KR-style: auto-start with early call bonus)
let waveCountdown = 0;
let waveCountdownActive = false;
const WAVE_COUNTDOWN = 25; // seconds between waves (build phase duration)

// Historical popup state
let popupDismissed = false;

// ─── HUD ELEMENTS ───
const $gold = document.getElementById('gold')!;
const $lives = document.getElementById('lives')!;
const $wave = document.getElementById('wave')!;
const $totalWaves = document.getElementById('total-waves')!;
const $waveBtn = document.getElementById('wave-btn') as HTMLButtonElement;
const $buildOverlay = document.getElementById('build-overlay')!;
const $buildTimer = document.getElementById('build-timer')!;
const $bpEnemyList = document.getElementById('bp-enemy-list')!;
const $buildStartBtn = document.getElementById('build-start-btn') as HTMLButtonElement;
const $levelName = document.getElementById('level-name')!;
const $gameOver = document.getElementById('game-over')!;
const $goTitle = document.getElementById('game-over-title')!;
const $goMsg = document.getElementById('game-over-msg')!;
const $goStars = document.getElementById('game-over-stars')!;
const $heroHp = document.getElementById('hero-hp')!;
const $heroStatus = document.getElementById('hero-status')!;
const $abilityQ = document.getElementById('ability-q') as HTMLButtonElement;
const $abilityW = document.getElementById('ability-w') as HTMLButtonElement;
const $abilityE = document.getElementById('ability-e') as HTMLButtonElement;

// Tower info panel
const $towerPanel = document.getElementById('tower-panel')!;
const $towerPanelName = document.getElementById('tower-panel-name')!;
const $towerPanelLevel = document.getElementById('tower-panel-level')!;
const $upgradeBtn = document.getElementById('upgrade-btn') as HTMLButtonElement;
const $sellBtn = document.getElementById('sell-btn') as HTMLButtonElement;

// Cache tower buttons — avoid querySelectorAll every frame
const towerButtons = Array.from(document.querySelectorAll('.tower-btn')) as HTMLButtonElement[];

function hud() {
  $gold.textContent = String(gold);
  $lives.textContent = String(lives);
  if (waveMgr) {
    $wave.textContent = String(waveMgr.waveNum);
    $totalWaves.textContent = String(waveMgr.totalWaves);
  }
  if (hero) {
    if (hero.alive) {
      $heroHp.textContent = `❤️ ${Math.ceil(hero.hp)}/${hero.maxHp}`;
      $heroStatus.textContent = '';
    } else {
      $heroHp.textContent = '💀 Dead';
      $heroStatus.textContent = `Respawn: ${Math.ceil(hero.respawnTimer)}s`;
    }
    updateAbilityBtn($abilityQ, hero.abilities[0], 0);
    updateAbilityBtn($abilityW, hero.abilities[1], 1);
    updateAbilityBtn($abilityE, hero.abilities[2], 2);
  }

  // Grey out tower buttons — respect per-level unlocks AND gold
  towerButtons.forEach(btn => {
    const type = btn.dataset.type!;
    const cost = TOWER_CONFIGS[type].cost;
    const locked = !unlockedTowers.has(type);
    const tooPoor = gold < cost;
    btn.disabled = locked || tooPoor;
    btn.classList.toggle('too-poor', tooPoor && !locked);
    btn.classList.toggle('ls-locked', locked);
  });

  // Update tower info panel
  if (selectedTower) {
    $towerPanel.style.display = 'flex';
    $towerPanelName.textContent = selectedTower.config.name;
    $towerPanelLevel.textContent = `Level ${selectedTower.level}/3`;
    const ucost = selectedTower.upgradeCost;
    if (ucost !== null) {
      $upgradeBtn.style.display = 'inline-block';
      $upgradeBtn.textContent = `⬆ Upgrade (${ucost}g)`;
      $upgradeBtn.disabled = gold < ucost;
      $upgradeBtn.classList.toggle('too-poor', gold < ucost);
    } else {
      $upgradeBtn.style.display = 'none';
    }
    $sellBtn.textContent = `💰 Sell (${selectedTower.sellValue}g)`;
  } else {
    $towerPanel.style.display = 'none';
  }
}

function updateAbilityBtn(el: HTMLButtonElement, ab: any, idx: number) {
  if (!ab) return;
  const labels = getAbilityLabels();
  const key = labels[idx] || '?';
  const icon = ['☠️', '🌿', '⚗️'][idx] || '';
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
    el.textContent = `${icon} [${key}]`;
    el.classList.remove('ability-cd', 'ability-active');
    el.disabled = false;
  }
}

// ─── HOVER INDICATOR ───
const hover = new THREE.Mesh(
  new THREE.BoxGeometry(0.92, 0.04, 0.92),
  new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.35 })
);
hover.visible = false;
scene.add(hover);

// ─── HERO MOVE INDICATOR ───
const moveRing = new THREE.Mesh(
  new THREE.RingGeometry(0.25, 0.35, 16),
  new THREE.MeshBasicMaterial({ color: 0xd4a017, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
);
moveRing.rotation.x = -Math.PI / 2;
moveRing.visible = false;
scene.add(moveRing);

// ─── KEYBOARD LAYOUT SYSTEM (QWERTY vs AZERTY) ───────────────────────────────
// AZERTY auto-detection: French/Belgian keyboard has QWERTY W but physical Q = left
// We detect on first meaningful keypress, then persist to localStorage.
// Mobile players don't need this — they use tap-to-move and on-screen ability buttons.

// ─── KEYBOARD LAYOUT (QWERTY vs AZERTY) ─────────────────────────────────────
// QWERTY:  WASD movement, QER abilities
// AZERTY:  ZQSD movement, AER abilities
// W exists ONLY on QWERTY (no W key on AZERTY). Z exists ONLY on AZERTY for UP.
// These unique keys are used for layout auto-detection.
//
// NOTE: On AZERTY, physical A key (top-left) sends 'q' to JavaScript.
//       On QWERTY, physical Q key (top-left) sends 'q' to JavaScript.
//       So 'q' alone is ambiguous. We detect via W (QWERTY) or Z (AZERTY).

type KBLayout = 'qwerty' | 'azerty';
const SAVED_KB_KEY = 'sakartvelo_kb_layout';

let kbLayout: KBLayout =
  (localStorage.getItem(SAVED_KB_KEY) as KBLayout) || 'qwerty';

// Layout-aware movement keys
const QWERTY_MOVE: Record<string, { x: number; z: number }> = {
  w: { x: 0, z: -1 }, a: { x: -1, z: 0 }, s: { x: 0, z: 1 }, d: { x: 1, z: 0 },
};
const AZERTY_MOVE: Record<string, { x: number; z: number }> = {
  z: { x: 0, z: -1 }, q: { x: -1, z: 0 }, s: { x: 0, z: 1 }, d: { x: 1, z: 0 },
};
const ARROW_MOVE: Record<string, { x: number; z: number }> = {
  ArrowUp: { x: 0, z: -1 }, ArrowDown: { x: 0, z: 1 },
  ArrowLeft: { x: -1, z: 0 }, ArrowRight: { x: 1, z: 0 },
};

function currentMoveDir(): Record<string, { x: number; z: number }> {
  return kbLayout === 'azerty' ? AZERTY_MOVE : QWERTY_MOVE;
}

// Layout-aware ability keys (none overlap with movement keys)
const ABILITY_KEYS: Record<KBLayout, string[]> = {
  qwerty: ['q', 'e', 'r'],  // QER on QWERTY (WASD taken by movement)
  azerty: ['a', 'e', 'r'], // AER on AZERTY (ZQSD taken by movement)
};
const ABILITY_LABELS: Record<KBLayout, string[]> = {
  qwerty: ['Q', 'E', 'R'],
  azerty: ['A', 'E', 'R'],
};

function getAbilityKeys(): string[] { return ABILITY_KEYS[kbLayout]; }
function getAbilityLabels(): string[] { return ABILITY_LABELS[kbLayout]; }

// Expose toggle globally so HTML onclick works
declare global { interface Window { _toggleKbLayout?: () => void; } }
window._toggleKbLayout = function() {
  kbLayout = kbLayout === 'qwerty' ? 'azerty' : 'qwerty';
  localStorage.setItem(SAVED_KB_KEY, kbLayout);
  updateKbBadge();
  updateAbilityLabels();
};

function updateKbBadge() {
  const badge = document.getElementById('kb-badge');
  if (!badge) return;
  badge.textContent = `⌨ ${kbLayout.toUpperCase()}`;
  badge.style.borderColor = kbLayout === 'azerty' ? '#7a9aaa' : '#8b6914';
  badge.style.color = kbLayout === 'azerty' ? '#7a9aaa' : '#6a5a3a';
}

function updateAbilityLabels() {
  const labels = getAbilityLabels();
  const icons = ['☠️', '🌿', '⚗️'];
  const btns = [$abilityQ, $abilityW, $abilityE];
  btns.forEach((btn, i) => {
    if (!btn) return;
    const ab = hero?.abilities[i];
    if (!ab) { btn.textContent = `${icons[i]} [${labels[i]}]`; return; }
    if (ab.active) {
      btn.textContent = `${icons[i]} ${ab.timer.toFixed(0)}s`;
    } else if (ab.cooldown > 0) {
      btn.textContent = `${icons[i]} ${ab.cooldown.toFixed(0)}s`;
    } else {
      btn.textContent = `${icons[i]} [${labels[i]}]`;
    }
  });
}

// Auto-detect layout on first W or Z keypress.
// W only exists on QWERTY (no W on AZERTY).
// Z-up only exists on AZERTY (Z is a regular key on QWERTY).
// Anything else first → assume QWERTY (more common).
let layoutDetected = !!localStorage.getItem(SAVED_KB_KEY); // skip if already saved
function detectLayout(key: string) {
  if (layoutDetected) return;
  layoutDetected = true;
  if (key === 'w') {
    kbLayout = 'qwerty';
  } else if (key === 'z') {
    kbLayout = 'azerty';
  } else {
    kbLayout = 'qwerty'; // default assumption
  }
  // Async write — don't block the event loop
  requestAnimationFrame(() => localStorage.setItem(SAVED_KB_KEY, kbLayout));
  updateKbBadge();
  updateAbilityLabels();
}

// ─── HERO KEYBOARD MOVEMENT ──────────────────────────────────────────────────
// Movement is event-driven (set target on key change), hero.update() does the moving.

const keysDown: Set<string> = new Set();
let _heroKeyDir = { x: 0, z: 0 }; // current held direction

function computeHeroDir(): { x: number; z: number } {
  let dx = 0, dz = 0;
  const move = currentMoveDir();
  for (const k of keysDown) {
    const d = move[k] || ARROW_MOVE[k];
    if (d) { dx += d.x; dz += d.z; }
  }
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len === 0) return { x: 0, z: 0 };
  return { x: dx / len, z: dz / len };
}

let _lastHeroMove = 0;
const MOVE_INTERVAL_MS = 33; // 30 times per second

function heroKeyDirChanged(next: { x: number; z: number }) {
  if (next.x === _heroKeyDir.x && next.z === _heroKeyDir.z) return;
  _heroKeyDir = next;
  if (hero && hero.alive) {
    if (next.x === 0 && next.z === 0) {
      hero.moveTarget = null; // stop
    } else {
      hero.moveTo(
        hero.group.position.x + next.x * 16,
        hero.group.position.z + next.z * 16
      );
    }
  }
}

addEventListener('keydown', (e) => {
  const now = performance.now();

  // ─── Escape: deselect everything and open level select ───
  if (e.key === 'Escape') {
    keysDown.clear();
    _heroKeyDir = { x: 0, z: 0 };
    selectedType = null;
    deselectTower();
    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
    hover.visible = false;
    hud();
    showLevelSelectScreen();
    return;
  }

  // ─── Throttle movement keys to ~10/sec ───
  if (now - _lastHeroMove < MOVE_INTERVAL_MS) return;
  _lastHeroMove = now;

  const k = e.key.toLowerCase();

  // W or Z → layout detection + movement
  if (k === 'w' || k === 'z') {
    detectLayout(k);
    keysDown.add(k);
    heroKeyDirChanged(computeHeroDir());
    return;
  }

  // Layout-specific movement keys
  const move = currentMoveDir();
  if (move[k]) {
    keysDown.add(k);
    heroKeyDirChanged(computeHeroDir());
    return;
  }

  // Arrow keys (universal)
  if (ARROW_MOVE[e.key]) {
    keysDown.add(e.key);
    heroKeyDirChanged(computeHeroDir());
    return;
  }

  // Ability keys (layout-aware, none overlap with movement)
  const idx = getAbilityKeys().indexOf(k);
  if (idx >= 0 && hero && !gameOver) {
    hero.activateAbility(idx, enemies, towers);
  }
});

addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  const move = currentMoveDir();
  if (move[k] || ARROW_MOVE[e.key] || k === 'w' || k === 'z') {
    keysDown.delete(k);
    heroKeyDirChanged(computeHeroDir());
  }
});

// ─── MOBILE TAP-TO-MOVE ─────────────────────────────────────────────────────
// Canvas touchend: tap anywhere on ground plane to move hero.
// We skip the bottom ~100px HUD zone so taps on ability buttons don't trigger movement.

const HUD_SKIP_ZONE_PX = 100; // don't move hero when tapping bottom HUD

renderer.domElement.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (gameOver || !hero || !hero.alive) return;
  const t = e.changedTouches[0];
  if (!t) return;
  // Skip if tap landed in HUD zone
  if (t.clientY > window.innerHeight - HUD_SKIP_ZONE_PX) return;
  // Cast to ground plane
  mouse.x = (t.clientX / innerWidth) * 2 - 1;
  mouse.y = -(t.clientY / innerHeight) * 2 + 1;
  ray.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const target = new THREE.Vector3();
  const hit = ray.ray.intersectPlane(plane, target);
  if (hit) hero.moveTo(target.x, target.z);
}, { passive: false });

// ─── RAYCASTER ───
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function castGrid(e: MouseEvent): { gx: number; gy: number; isPath: boolean } | null {
  if (!grid) return null;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(grid.getAllTileMeshes());
  if (hits.length > 0) return hits[0].object.userData as TileUserData;
  return null;
}

function castGround(e: MouseEvent): THREE.Vector3 | null {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  ray.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const target = new THREE.Vector3();
  const hit = ray.ray.intersectPlane(plane, target);
  return hit ? target : null;
}

function castTower(e: MouseEvent): Tower | null {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  ray.setFromCamera(mouse, camera);

  // Collect all tower meshes
  const meshes: THREE.Object3D[] = [];
  for (const t of towers) {
    t.group.traverse(c => meshes.push(c));
  }
  const hits = ray.intersectObjects(meshes);
  if (hits.length > 0) {
    // Walk up to find tower group
    let obj: THREE.Object3D | null = hits[0].object;
    while (obj) {
      if (obj.userData?.isTower) return obj.userData.tower;
      obj = obj.parent;
    }
  }
  return null;
}

// ─── CAMERA BASE POSITION (for sway) ───
let cameraBaseX = 0;

// ─── CAMERA SETUP FOR LEVEL ───
function setupCamera(gw: number, gh: number) {
  const cx = gw / 2, cz = gh / 2;
  const dist = Math.max(gw, gh) * 0.95;
  camera.position.set(cx, dist * 0.85, cz + dist * 0.95);
  camera.lookAt(cx, 0, cz);
  cameraBaseX = cx;
}

// ─── INTRO SCREEN FLOW ───
function hideOverlay(id: string) {
  document.getElementById(id)?.classList.remove('visible');
}
function showOverlay(id: string) {
  document.getElementById(id)?.classList.add('visible');
}

function showTitleScreen() {
  showOverlay('screen-title');
  hideOverlay('screen-era');
  hideOverlay('screen-chapter');

}

function advanceFromTitle() {
  hideOverlay('screen-title');
  showOverlay('screen-era');
  buildEraTeleprompter();
  _tpActiveWordIdx = -1;
  const prog = document.getElementById('era-tp-progress')!;
  prog.textContent = '⏱ 0:00 / 1:31';
}

function advanceFromEra() {
  stopEraNarration();
  stopNarration();
  hideOverlay('screen-era');
  showOverlay('screen-chapter');
  playNarration('./audio/narration-chapter1-bronze-age.mp3');
}

function advanceFromChapter() {
  stopEraNarration();
  stopNarration();
  hideOverlay('screen-chapter');
  // Show level select screen
  showLevelSelectScreen();
}

// Wire up intro buttons
document.getElementById('btn-title-continue')?.addEventListener('click', () => { advanceFromTitle(); });
document.getElementById('btn-era-continue')?.addEventListener('click', advanceFromEra);
document.getElementById('btn-chapter-continue')?.addEventListener('click', advanceFromChapter);

// Wire up teleprompter controls
document.getElementById('btn-era-prev')?.addEventListener('click', () => {
  if (_eraAudioEl) {
    _eraAudioEl.currentTime = Math.max(0, _eraAudioEl.currentTime - 10);
  }
});
document.getElementById('btn-era-next')?.addEventListener('click', () => {
  if (_eraAudioEl) {
    _eraAudioEl.currentTime = Math.min(_tpAudioDuration, _eraAudioEl.currentTime + 10);
  }
});
document.getElementById('btn-era-play')?.addEventListener('click', () => {
  if (_eraPlaying) { stopEraNarration(); }
  else { startEraNarration(); }
});

// ─── LOAD LEVEL ───
async function init() {
  setupVolumeControls();
  try {
    const resp = await fetch('./data/levels.json');
    const raw = await resp.json();
    allLevels = Array.isArray(raw) ? raw : raw.levels || [raw];
    // Show title screen — player chooses when to enter
    showTitleScreen();
    updateKbBadge(); // init keyboard layout badge
  } catch (err) {
    console.error('Level load failed:', err);
  }
}

function startLevel(lvl: LevelData) {
  stopNarration();
  // Cleanup
  enemies.forEach(e => scene.remove(e.group));
  towers.forEach(t => scene.remove(t.group));
  if (grid) scene.remove(grid.group);
  if (hero) scene.remove(hero.group);

  enemies = []; towers = [];
  projectilePool.dispose();
  projectilePool = new ProjectilePool(scene);
  disposeEffects(scene);
  currentLevel = lvl;
  gold = lvl.starting_gold;
  lives = lvl.starting_lives;
  startingLives = lvl.starting_lives;
  gameOver = false;
  paused = false;
  selectedTower = null;
  selectedType = null;

  grid = new Grid(lvl);
  scene.add(grid.group);

  waveMgr = new WaveManager(lvl, grid.getWorldPath());

  // Create Medea at path start
  const pathStart = grid.getWorldPath()[0];
  hero = new Hero(pathStart.x, pathStart.z, lvl.grid_width, lvl.grid_height);
  scene.add(hero.group);

  setupCamera(lvl.grid_width, lvl.grid_height);

  $levelName.textContent = lvl.name;
  $gameOver.style.display = 'none';
  $buildOverlay.classList.remove('visible'); // hide build phase overlay on level start
  document.getElementById('level-complete')!.style.display = 'none';
  $waveBtn.disabled = false;
  $waveBtn.textContent = '▶ Start Wave';
  waveCountdownActive = false;

  // Progressive tower unlocks
  unlockedTowers = getTowerUnlocks(lvl.level);
  updateTowerButtons();

  hud();
  showTutorial(lvl.level);
}

// ─── TOWER UNLOCKS (per level) ───
// Levels 1: Archer only. Level 2: +Wall. Level 3+: all.
let unlockedTowers: Set<string> = new Set(['archer', 'catapult', 'wall']);

function getTowerUnlocks(levelNum: number): Set<string> {
  if (levelNum >= 3) return new Set(['archer', 'catapult', 'wall']);
  if (levelNum === 2) return new Set(['archer', 'wall']);
  return new Set(['archer']); // level 1
}

const TOWER_UNLOCK_TEXT: Record<string, { minLevel: number; text: string }> = {
  wall:     { minLevel: 2, text: '🧱 Wall (Unlocks L2)' },
  catapult: { minLevel: 3, text: '💥 Catapult (Unlocks L3)' },
};

function updateTowerButtons() {
  document.querySelectorAll('.tower-btn').forEach(btn => {
    const type = (btn as HTMLElement).dataset.type!;
    const cfg = TOWER_CONFIGS[type];
    const unlock = TOWER_UNLOCK_TEXT[type];
    const available = unlockedTowers.has(type);
    if (!available && unlock) {
      btn.textContent = unlock.text;
    } else {
      const icon = type === 'archer' ? '🏹' : type === 'catapult' ? '💥' : '🧱';
      btn.textContent = `${icon} ${cfg.name} (${cfg.cost}g)`;
    }
  });
}

// ─── STAR RATING ───
function getStars(): number {
  const ratio = lives / startingLives;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

function getStarString(n: number): string {
  return '⭐'.repeat(n) + '☆'.repeat(3 - n);
}

// ─── END GAME ───
function endGame(won: boolean) {
  gameOver = true;
  const stars = getStars();
  $goTitle.textContent = won ? '🎉 VICTORY!' : '💀 DEFEAT!';
  $goMsg.textContent = won
    ? `${currentLevel?.name} defended! All waves cleared.`
    : `${currentLevel?.name} has fallen after wave ${waveMgr?.waveNum}.`;
  $goStars.textContent = `Lives remaining: ${lives}  ${getStarString(stars)}`;
  $gameOver.style.display = 'block';
  $waveBtn.disabled = true;

  if (won && currentLevel) {
    const levelId = SaveManager.levelId(currentLevel.era, currentLevel.level);
    SaveManager.completeLevel(levelId, stars);
    showLevelComplete(levelId, stars);
  }
}

// ─── LEVEL COMPLETE OVERLAY ───
function showLevelComplete(levelId: string, stars: number) {
  const el = document.getElementById('level-complete')!;
  const title = document.getElementById('lc-title')!;
  const starEl = document.getElementById('lc-stars')!;
  const msg = document.getElementById('lc-msg')!;
  const nextBtn = document.getElementById('lc-next') as HTMLButtonElement;
  const menuBtn = document.getElementById('lc-menu') as HTMLButtonElement;

  const levelName = currentLevel?.name || 'Level';
  title.textContent = levelName;
  starEl.textContent = getStarString(stars);
  msg.textContent = stars === 3 ? 'Perfect! No lives lost.' : stars === 2 ? 'Well defended!' : 'Level cleared!';

  // Next level button
  const nextLevelId = SaveManager.isNextUnlocked(levelId);
  if (nextLevelId) {
    nextBtn.style.display = '';
    nextBtn.textContent = 'Next Level →';
    nextBtn.onclick = () => {
      el.style.display = 'none';
      loadNextLevel();
    };
  } else {
    nextBtn.style.display = 'none';
  }

  menuBtn.onclick = () => {
    el.style.display = 'none';
    showLevelSelectScreen();
  };

  el.style.display = 'block';
}

function loadNextLevel() {
  if (!currentLevel) return;
  const nextEra = currentLevel.level >= 20 ? currentLevel.era + 1 : currentLevel.era;
  const nextNum = currentLevel.level >= 20 ? 1 : currentLevel.level + 1;
  const next = allLevels.find(l => l.era === nextEra && l.level === nextNum);
  if (next) startLevel(next);
}

function showLevelSelectScreen() {
  LevelSelect.show(
    0,
    document.getElementById('level-select')!,
    allLevels,
    (era, level) => {
      const lvl = allLevels.find(l => l.era === era && l.level === level);
      if (lvl) {
        LevelSelect.hide();
        startLevel(lvl);
      }
    },
    () => {
      LevelSelect.hide();
      showTitleScreen();
    },
  );
}
// ─── CULTURAL FOOTER ───
const culturalFacts: Array<{ cat: string; text: string }> = [];
let cfIndex = 0;
let cfTimer: number | null = null;

async function loadCulturalFacts() {
  try {
    const resp = await fetch('/content/cultural_footer.txt');
    const text = await resp.text();
    text.split('\n').forEach(line => {
      const sep = line.indexOf('|');
      if (sep > 0) {
        culturalFacts.push({
          cat: line.slice(0, sep).trim(),
          text: line.slice(sep + 1).trim().replace(/^[""]|[""]$/g, ''),
        });
      }
    });
    if (culturalFacts.length > 0) cycleCulturalFact();
  } catch {
    // File may not exist in dev
    document.getElementById('cf-text')!.textContent = '';
  }
}

function cycleCulturalFact() {
  if (cfTimer !== null) clearInterval(cfTimer);
  const el = document.getElementById('cf-text')!;
  if (culturalFacts.length === 0) return;

  let prev = cfIndex;
  while (prev === cfIndex && culturalFacts.length > 1) {
    cfIndex = Math.floor(Math.random() * culturalFacts.length);
  }

  el.textContent = `${culturalFacts[cfIndex].cat} — "${culturalFacts[cfIndex].text}"`;
  cfTimer = window.setInterval(() => {
    cfIndex = (cfIndex + 1) % culturalFacts.length;
    el.textContent = `${culturalFacts[cfIndex].cat} — "${culturalFacts[cfIndex].text}"`;
  }, 8000);
}

// ─── START WAVE ───
function startWave(earlyBonus: number = 0) {
  if (gameOver || !waveMgr) return;
  if (waveMgr.startNext()) {
    if (earlyBonus > 0) {
      gold += earlyBonus;
    }
    waveCountdownActive = false;
    $waveBtn.disabled = true;
    $waveBtn.textContent = '⚔ Wave in progress...';
    hud();
  }
}

// ─── TOWER SELECTION ───
function deselectTower() {
  if (selectedTower) {
    selectedTower.showRange(false);
    selectedTower = null;
  }
}

function selectTowerObj(tower: Tower) {
  deselectTower();
  selectedType = null;
  document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
  selectedTower = tower;
  tower.showRange(true);
}

// ─── EVENTS ───
// Tower selection buttons
document.querySelectorAll('.tower-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = (btn as HTMLElement).dataset.type!;
    deselectTower();
    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
    if (selectedType === type) {
      selectedType = null;
      hover.visible = false;
      towers.forEach(t => t.showRange(false));
    } else {
      selectedType = type;
      btn.classList.add('selected');
      towers.forEach(t => t.showRange(t.type === type));
    }
  });
});

// Upgrade button
$upgradeBtn?.addEventListener('click', () => {
  if (!selectedTower || gameOver) return;
  const cost = selectedTower.upgradeCost;
  if (cost === null || gold < cost) return;
  gold -= cost;
  selectedTower.upgrade();
  hud();
});

// Sell button
$sellBtn?.addEventListener('click', () => {
  if (!selectedTower || gameOver || !grid) return;
  const val = selectedTower.sellValue;
  gold += val;
  const gx = selectedTower.gx;
  const gy = selectedTower.gy;
  scene.remove(selectedTower.group);
  towers = towers.filter(t => t !== selectedTower);
  grid.free(gx, gy);
  selectedTower = null;
  hud();
});

// Ability buttons
$abilityQ?.addEventListener('click', () => {
  if (hero && hero.alive) hero.activateAbility(0, enemies, towers);
});
$abilityW?.addEventListener('click', () => {
  if (hero && hero.alive) hero.activateAbility(1, enemies, towers);
});
$abilityE?.addEventListener('click', () => {
  if (hero && hero.alive) hero.activateAbility(2, enemies, towers);
});

// Wave button
$waveBtn.addEventListener('click', () => {
  if (gameOver || !waveMgr || waveMgr.active || waveMgr.inBuildPhase) return;

  if (waveCountdownActive) {
    const bonus = Math.ceil(waveCountdown * 3);
    startWave(bonus);
  } else {
    startWave(0);
  }
});

// Build Phase start button — ends build phase early, starts wave with bonus
$buildStartBtn.addEventListener('click', () => {
  if (gameOver || !waveMgr || !waveMgr.inBuildPhase) return;
  const bonus = Math.ceil(waveMgr.buildPhaseTimer * 2);
  waveMgr.endBuildPhase();
  $buildOverlay.classList.remove('visible');
  startWave(bonus);
});

// Left click: place tower or select existing tower
// Use pointerdown for touchpad tap support

// Prevent pointer lock completely
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement) document.exitPointerLock();
});

// Block drag on canvas
renderer.domElement.addEventListener('dragstart', (e) => e.preventDefault());

// Use pointerdown instead of click — touchpad taps don't fire click events
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return; // left click / tap only
  if (gameOver) return;

  // Always check if click hit an existing tower first
  const clickedTower = castTower(e);
  if (clickedTower) {
    selectTowerObj(clickedTower);
    hud();
    return;
  }

  // If we have a tower type selected → place tower
  if (selectedType && grid) {
    // Block tower placement during active wave (enforce build phases)
    if (waveMgr?.active) return;
    const cell = castGrid(e);
    if (!cell) return;

    const isWall = selectedType === 'wall';
    if (grid.isBuildable(cell.gx, cell.gy, isWall)) {
      const cost = TOWER_CONFIGS[selectedType].cost;
      if (gold >= cost) {
        const tower = new Tower(selectedType, cell.gx, cell.gy, cell.isPath);
        towers.push(tower);
        scene.add(tower.group);
        grid.occupy(cell.gx, cell.gy);
        gold -= cost;
        hud();
        grid.flashTile(cell.gx, cell.gy, 0x44ff44);
      }
    }
    }
});

// Right click: move hero
renderer.domElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (gameOver || !hero) return;
  const pos = castGround(e);
  if (pos) {
    hero.moveTo(pos.x, pos.z);
  }
});

// ─── MOUSE TRACKING (decoupled from raycasting) ─────────────────────────────
// mousemove events fire ~60+ times/sec. Raycasting on every event is expensive.
// Instead: store the latest mouse position on each mousemove.
// Process hover raycasts once per animation frame in the game loop.

let _mouseX = -9999, _mouseY = -9999;
let _mouseDirty = false;
let _hudAccum = 0;

renderer.domElement.addEventListener('pointermove', (e) => {
  _mouseX = e.clientX;
  _mouseY = e.clientY;
  _mouseDirty = true;
});

// Resize
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ─── PAUSE ON TAB-AWAY ───
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !gameOver) {
    paused = true;
  } else {
    paused = false;
    clock.getDelta(); // discard accumulated delta
  }
});

// ─── GAME LOOP ───
const clock = new THREE.Clock();
let waveCompleteProcessed = false;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  // ─── HOVER: process once per frame (not per mousemove event) ─────────────
  if (_mouseDirty && selectedType && grid) {
    const fakeEvent = { clientX: _mouseX, clientY: _mouseY } as MouseEvent;
    const cell = castGrid(fakeEvent);
    if (cell) {
      hover.position.set(cell.gx + 0.5, 0.08, cell.gy + 0.5);
      hover.visible = true;
      const isWall = selectedType === 'wall';
      const ok = grid.isBuildable(cell.gx, cell.gy, isWall) && gold >= TOWER_CONFIGS[selectedType].cost;
      (hover.material as THREE.MeshBasicMaterial).color.setHex(ok ? 0x44ff44 : 0xff4444);
    } else {
      hover.visible = false;
    }
  } else if (!selectedType || !grid) {
    hover.visible = false;
  }
  _mouseDirty = false;

  if (!gameOver && !paused && waveMgr && grid) {
    // ─── Build Phase update ───
    if (waveMgr.inBuildPhase) {
      const remaining = waveMgr.updateBuildPhase(dt);
      $buildTimer.textContent = String(Math.ceil(remaining));
      const bonus = Math.ceil(remaining * 2);
      $buildStartBtn.textContent = `▶ Start Wave Now (+${bonus}g)`;
      if (remaining <= 0) {
        // Auto-start wave when timer expires
        waveMgr.endBuildPhase();
        $buildOverlay.classList.remove('visible');
        if (waveMgr.startNext()) {
          $waveBtn.disabled = true;
          $waveBtn.textContent = '⚔ Wave in progress...';
        }
      }
    }

    // ─── Wave countdown (KR-style auto-start) ───
    if (waveCountdownActive && !waveMgr.active) {
      waveCountdown -= dt;
      const bonus = Math.ceil(waveCountdown * 3);
      $waveBtn.disabled = false;
      $waveBtn.textContent = `▶ Next Wave (+${bonus}g) [${Math.ceil(waveCountdown)}s]`;

      if (waveCountdown <= 0) {
        waveCountdownActive = false;
        startWave(0);
      }
    }

    // Spawn enemies
    const spawned = waveMgr.update(dt);
    if (spawned) {
      enemies.push(spawned);
      scene.add(spawned.group);
    }

    // Pre-cache wall positions (rebuilt each frame, but avoids per-enemy allocations)
    const wallCache: Array<{ tower: Tower; x: number; z: number }> = [];
    for (const tower of towers) {
      if (tower.type === 'wall' && tower.getWallHp() > 0) {
        wallCache.push({ tower, x: tower.gx + 0.5, z: tower.gy + 0.5 });
      }
    }
    const _wallVec = new THREE.Vector3(); // reusable — one alloc per frame, not per enemy×wall
    const _enemyPos = new THREE.Vector3();
    const SLOW_RANGE = 1.5;
    const ATTACK_RANGE_SQ = 0.64; // 0.8² — avoid sqrt
    const SLOW_RANGE_SQ = SLOW_RANGE * SLOW_RANGE;

    // Wall slow effect on enemies
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      let totalSlow = 0;
      _enemyPos.copy(enemy.getPos());
      for (const w of wallCache) {
        _wallVec.set(w.x, 0, w.z);
        const dx = _enemyPos.x - w.x;
        const dz = _enemyPos.z - w.z;
        if (dx * dx + dz * dz <= SLOW_RANGE_SQ) {
          totalSlow = Math.max(totalSlow, w.tower.getWallSlow());
        }
      }
      const cfg = enemy.baseSpeed;
      enemy.speed = totalSlow > 0 ? cfg * (1 - totalSlow) : cfg;
    }

    // Update enemy movement
    for (const enemy of enemies) {
      enemy.update(dt, camera);
    }

    // Enemies attack walls they're next to
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      _enemyPos.copy(enemy.getPos());
      for (let wi = 0; wi < wallCache.length; wi++) {
        const w = wallCache[wi];
        if (w.tower.getWallHp() <= 0) continue;
        const dx = _enemyPos.x - w.x;
        const dz = _enemyPos.z - w.z;
        if (dx * dx + dz * dz <= ATTACK_RANGE_SQ) {
          // Enemy attacks the wall — damage from ENEMY_CONFIGS
          const dmg = ENEMY_CONFIGS[enemy.type]?.wallDmg ?? 10;
          const destroyed = w.tower.takeWallDamage(dmg, camera);
          w.tower.billboardHp(camera);

          // Wall reflects damage (L3)
          const reflect = w.tower.getWallReflect();
          if (reflect > 0) {
            enemy.takeDamage(reflect);
          }

          if (destroyed) {
            // Wall destroyed — free the cell
            grid!.free(w.tower.gx, w.tower.gy);
            scene.remove(w.tower.group);
            towers = towers.filter(t => t !== w.tower);
            wallCache.splice(wi, 1); // remove from cache
            if (selectedTower === w.tower) {
              selectedTower = null;
            }
          }
          break; // enemy only attacks one wall per frame
        }
      }
    }

    // Update towers → may spawn projectiles
    for (const tower of towers) {
      const spawn = tower.update(dt, enemies);
      if (spawn) {
        projectilePool.acquire(spawn.origin, spawn.target, spawn.damage, spawn.speed, spawn.towerType, spawn.isCrit, spawn.splashRadius);
      }
    }

    // Update projectiles → may kill enemies
    for (const proj of projectilePool.alive) {
      proj.update(dt);
      if (!proj.alive) {
        // Spawn hit effects
        if (proj.target.alive === false && proj.target.hp <= 0) {
          // This was a kill shot
        }
        // Always show impact effects
        const hitPos = proj.mesh.position.clone();
        if (proj.splashRadius > 0) {
          // Catapult splash — damage nearby enemies + show ring
          spawnSplashRing(scene, hitPos, proj.splashRadius);
          for (const enemy of enemies) {
            if (!enemy.alive) continue;
            if (enemy.getPos().distanceTo(hitPos) <= proj.splashRadius) {
              const killed = enemy.takeDamage(proj.damage * 0.5); // 50% splash damage
            }
          }
        } else {
          // Archer hit flash
          spawnHitFlash(scene, hitPos);
        }
        projectilePool.release(proj);
      }
    }

    // Update hero (auto-attack + move via WASD key events)
    if (hero) {
      hero.update(dt, camera, enemies);

      // Update move indicator
      const mt = hero.getMoveTarget();
      if (mt) {
        moveRing.visible = true;
        moveRing.position.set(mt.x, 0.02, mt.z);
        const t = performance.now() * 0.003;
        moveRing.scale.setScalar(0.9 + Math.sin(t) * 0.1);
      } else {
        moveRing.visible = false;
      }
    }

    // Process enemy deaths
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy.alive) {
        if (enemy.reachedEnd) {
          lives -= enemy.livesCost;
          hud();
          $lives.style.color = '#ff4444';
          setTimeout(() => $lives.style.color = '', 300);
          if (lives <= 0) endGame(false);
        } else {
          gold += enemy.reward;
          hud();
          $gold.style.color = '#44ff44';
          setTimeout(() => $gold.style.color = '', 300);

          // Floating gold text on kill
          spawnFloatingGold(scene, enemy.getPos(), enemy.reward, camera);
        }
        scene.remove(enemy.group);
        enemies.splice(i, 1);
      }
    }

    // Update effects
    updateEffects(dt, camera);

    // Billboard wall HP bars
    for (const tower of towers) {
      if (tower.type === 'wall') {
        tower.billboardHp(camera);
      }
    }

    // Wave complete?
    if (waveMgr.active && waveMgr.isWaveDone()) {
      if (!waveCompleteProcessed) {
        waveCompleteProcessed = true;
        const bonus = 25 + waveMgr.waveNum * 10;
        gold += bonus;
        hud();

        if (waveMgr.waveNum >= waveMgr.totalWaves) {
          waveMgr.clear();
          // Show historical popup before level-complete screen
          const era = currentLevel?.era ?? 0;
          const lvl = currentLevel?.level ?? 1;
          showPopup(era, lvl, () => {
            popupDismissed = false;
            endGame(true);
          });
        } else {
          waveMgr.clear();
          // Show historical popup between waves, then start BUILD PHASE
          const era = currentLevel?.era ?? 0;
          const wm = waveMgr;
          const nextWaveNum = wm ? wm.waveNum + 1 : 0;
          showPopup(era, nextWaveNum, () => {
            popupDismissed = false;
            // ─── START BUILD PHASE ───
            if (!wm) return;
            if (wm.startBuildPhase()) {
              const preview = wm.getNextWavePreview();
              $bpEnemyList.textContent = preview.types.join(' · ') || 'Unknown wave';
              $buildTimer.textContent = String(Math.ceil(wm.buildPhaseTimer));
              $buildStartBtn.textContent = `▶ Start Wave Now (+${Math.ceil(wm.buildPhaseTimer * 2)}g)`;
              $buildOverlay.classList.add('visible');
              $waveBtn.disabled = true;
              $waveBtn.textContent = '⚒ Build Phase...';
            }
          });
        }
      }
    } else {
      waveCompleteProcessed = false;
    }

    // Update HUD — decoupled from render loop via setInterval below
  }

  // Gentle camera sway (temporary offset, no drift)
  if (currentLevel) {
    const t = performance.now() * 0.0001;
    camera.position.x = cameraBaseX + Math.sin(t) * 0.15;
  }

  // Plain render — bloom disabled for event loop headroom
  renderer.render(scene, camera);
}

// ─── START ───
document.getElementById('go-menu')?.addEventListener('click', () => {
  $gameOver.style.display = 'none';
  showLevelSelectScreen();
});

init();
loadCulturalFacts();

// HUD updates decoupled from render loop — DOM writes in rAF block click events
setInterval(hud, 100);

animate();
