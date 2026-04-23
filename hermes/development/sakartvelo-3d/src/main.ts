/**
 * main.ts
 * Entry point. Wires scene, subsystems, and event handlers together.
 * All actual game logic lives in the manager classes.
 */
import * as THREE from 'three';
import { gs } from './GameState';
import { ui } from './UIManager';
import { input } from './InputManager';
import { audio } from './AudioManager';
import { GameLoop } from './GameLoop';
import { SaveManager } from './SaveManager';
import { Tower } from './Tower';
import { screenMgr } from './ScreenManager';

// ─── Scene ────────────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2a1a);
scene.fog = new THREE.FogExp2(0x1a2a1a, 0.015);

// Camera (positioned per-level in setupCamera)
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 120);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0x667766, 0.5));
scene.add(new THREE.HemisphereLight(0x99bb99, 0x443322, 0.4));
const sun = new THREE.DirectionalLight(0xffeedd, 1.4);
sun.position.set(12, 22, 14);
sun.castShadow = true;
sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

// Ground plane
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshLambertMaterial({ color: 0x2a3a2a }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.06;
ground.receiveShadow = true;
scene.add(ground);

// Hover indicator (Ghost Tower)
const hover = new THREE.Group();
hover.visible = false;
scene.add(hover);

// Hero move-to ring
const moveRing = new THREE.Mesh(
  new THREE.RingGeometry(0.25, 0.35, 16),
  new THREE.MeshBasicMaterial({ color: 0xd4a017, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
);
moveRing.rotation.x = -Math.PI / 2;
moveRing.visible = false;
scene.add(moveRing);

// ─── Global refs for external access ───────────────────────────────────

(window as any).__scene = scene;
(window as any).__saveManager = SaveManager;
(window as any).__audioMgr = audio;
(window as any).__screenMgr = screenMgr;
(window as any).__gs = gs;
(window as any).__navigateToLevelSelect = () => {
  try {
    console.log('--- FOOLPROOF NAV TRIGGERED ---');
    audio.stopEraNarration();
    screenMgr.showLevelSelect(0);
  } catch (err: any) {
    alert('NAV ERROR: ' + err.message);
  }
};
(window as any).__showEraScreen = () => {
  try {
    screenMgr.showEraScreen();
  } catch (err: any) {
    alert('BEGIN ERROR: ' + err.message);
  }
};

// ─── Level lifecycle ─────────────────────────────────────────────────────

function setupCamera(gw: number, gh: number): void {
  const cx = gw / 2, cz = gh / 2;
  const dist = Math.max(gw, gh) * 0.95;
  camera.position.set(cx, dist * 0.85, cz + dist * 0.95);
  camera.lookAt(cx, 0, cz);
  gs.cameraBaseX = cx;
}

function startLevel(era: number, level: number): void {
  const lvl = gs.allLevels.find(l => l.era === era && l.level === level);
  if (!lvl) return;

  audio.stopNarration();
  gs.initLevel(lvl, scene);
  setupCamera(lvl.grid_width, lvl.grid_height);

  // Expose grid for input manager
  (window as any).__grid = gs.grid;

  // Level 1 stays manual so tutorial text can run before combat begins.
  if (gs.waveMgr && !gs.waveMgr.active) {
    if (lvl.level === 1) {
      gs.waveCountdownActive = false;
      ui.$waveBtn.disabled = false;
      ui.$waveBtn.textContent = '▶ Start Wave';
    } else {
      gs.startWaveCountdown();
    }
  }

  ui.screens.showGameUI();
  ui.showLevelName(lvl.name);
  ui.screens.hideGameOver();
  ui.screens.hideLevelComplete();
  ui.screens.showTutorial(lvl.level);
  ui.update();
}

// ─── Init subsystems ─────────────────────────────────────────────────────

ui.init(
  (era, level) => startLevel(era, level),
  () => { gs.selectedType = null; gs.selectedTower = null; ui.screens.showLevelSelect(); },
);

input.init(
  renderer,
  camera,
  scene,
  {
    onHeroMove: (x: number, z: number) => {
      if (!gs.hero) return;
      // Cancel any in-progress build so move orders are not overridden by build AI.
      gs.hero.pendingBuild = null;
      gs.hero.buildTimer = 0;
      gs.pendingUpgradeTower = null;
      gs.hero.moveTo(x, z);
    },
    onGridClick: (gx: number, gy: number, isPath: boolean) => {
      if (gs.gameOver || !gs.grid || !gs.selectedType || !gs.hero || !gs.hero.alive) return;

      const type = gs.selectedType;
      gs.hero.pendingBuild = { type, gx, gy, isPath };
      gs.hero.buildTimer = 0;
      // Drop placement mode immediately so the ghost is cleared this frame (no batch lock).
      gs.selectedType = null;
      ui.panel.towerButtons.forEach((b: HTMLButtonElement) => b.classList.remove('selected'));
      ui.update();
    },
    onTowerClick: (tower: Tower) => {
      gs.selectedType = null;
      gs.selectedTower = gs.selectedTower === tower ? null : tower;
      gs.selectedTower?.showRange(true);
      ui.panel.towerButtons.forEach((b: HTMLButtonElement) => b.classList.remove('selected'));
      ui.update();
    },
    onAbility: (idx: number) => gs.hero?.activateAbility(idx, gs.enemies, gs.towers),
    onEscape: () => {
      if (gs.selectedType || gs.selectedTower) {
        gs.selectedType = null;
        gs.selectedTower = null;
        ui.panel.towerButtons.forEach((b: HTMLButtonElement) => b.classList.remove('selected'));
      } else {
        ui.screens.showLevelSelect();
      }
    },
    onDeselect: () => {
      gs.selectedType = null;
      gs.selectedTower = null;
      ui.panel.towerButtons.forEach((b: HTMLButtonElement) => b.classList.remove('selected'));
      ui.update();
    },
  },
);

// ─── Click: tower place vs select ────────────────────────────────────────

// Note: pointerdown is now handled entirely within InputManager.ts to avoid conflicts.

// Right-click: hero move
renderer.domElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const pos = input.getMouseGround();
  if (pos) gs.hero?.moveTo(pos.x, pos.z);
});

// ─── Escape ───────────────────────────────────────────────────────────────

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ─── Load levels and start ────────────────────────────────────────────────

async function init(): Promise<void> {
  audio.init();
  audio.calibrateWordTimes().then(times => {
    (audio as any)._tpWordTimes = times;
  });
  ui.screens.startCulturalFacts();

  try {
    const resp = await fetch('./data/levels.json');
    const raw = await resp.json();
    gs.allLevels = Array.isArray(raw) ? raw : (raw.levels ?? [raw]);
    ui.screens.showTitleScreen();
  } catch (err) {
    console.error('Level load failed:', err);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────

const loop = new GameLoop();
loop.init(renderer, scene, camera, ui, input, audio, hover, moveRing);
loop.start();
init();
