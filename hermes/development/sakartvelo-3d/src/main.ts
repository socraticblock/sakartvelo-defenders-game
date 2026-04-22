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

// Hover indicator mesh
const hover = new THREE.Mesh(
  new THREE.BoxGeometry(0.92, 0.04, 0.92),
  new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.35 }),
);
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

  // Reset wave countdown on first wave
  if (gs.waveMgr && !gs.waveMgr.active) {
    gs.startWaveCountdown();
  }

  ui.showLevelName(lvl.name);
  ui.hideGameOver();
  ui.hideLevelComplete();
  ui.showTutorial(lvl.level);
  ui.update();
}

function onWaveStart(bonus: number): void {
  gs.startWave(bonus);
}

// ─── Init subsystems ─────────────────────────────────────────────────────

ui.init(
  (era, level) => startLevel(era, level),
  () => { gs.selectedType = null; gs.selectedTower = null; ui.showLevelSelect(); },
);

input.init(
  renderer,
  camera,
  scene,
  {
    onHeroMove: (x: number, z: number) => gs.hero?.moveTo(x, z),
    onGridClick: (gx: number, gy: number, isPath: boolean) => {
      if (gs.gameOver || !gs.grid || !gs.selectedType) return;
      if (gs.waveMgr?.active) return;
      gs.placeTower(gs.selectedType, gx, gy, isPath, scene);
      gs.selectedType = null;
      ui.towerButtons.forEach(b => b.classList.remove('selected'));
      ui.update();
    },
    onTowerClick: (tower: Tower) => {
      gs.selectedType = null;
      gs.selectedTower = gs.selectedTower === tower ? null : tower;
      gs.selectedTower?.showRange(true);
      ui.towerButtons.forEach(b => b.classList.remove('selected'));
      ui.update();
    },
    onAbility: (idx: number) => gs.hero?.activateAbility(idx, gs.enemies, gs.towers),
    onEscape: () => { gs.selectedType = null; gs.selectedTower = null; ui.showLevelSelect(); },
  },
);

// Expose layout toggle
(window as any).__kbLayout = 'qwerty';
(window as any).__toggleKbLayout = () => {
  input.toggleLayout();
  (window as any).__kbLayout = input.layout;
  ui.updateKbBadge();
};

// ─── Click: tower place vs select ────────────────────────────────────────

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || gs.gameOver) return;

  // Check tower click first
  const tower = input.getMouseTower(gs.towers);
  if (tower) {
    gs.selectedType = null;
    gs.selectedTower = gs.selectedTower === tower ? null : tower;
    gs.selectedTower?.showRange(true);
    ui.towerButtons.forEach(b => b.classList.remove('selected'));
    ui.update();
    return;
  }

  // Tower placement
  if (gs.selectedType && gs.grid) {
    if (gs.waveMgr?.active) return;
    const cell = input.getMouseGrid(gs.grid);
    if (!cell) return;
    const placed = gs.placeTower(gs.selectedType, cell.gx, cell.gy, cell.isPath, scene);
    if (placed) {
      gs.selectedType = null;
      ui.towerButtons.forEach(b => b.classList.remove('selected'));
      ui.update();
    }
  }
});

// Right-click: hero move
renderer.domElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const pos = input.getMouseGround();
  if (pos) gs.hero?.moveTo(pos.x, pos.z);
});

// ─── Wave button ───────────────────────────────────────────────────────────

document.getElementById('wave-btn')?.addEventListener('click', () => {
  if (gs.gameOver || !gs.waveMgr || gs.waveMgr.active || gs.waveMgr.inBuildPhase) return;
  const bonus = gs.waveCountdownActive ? gs.getCountdownBonus() : 0;
  gs.startWave(bonus);
  ui.$waveBtn.disabled = true;
  ui.$waveBtn.textContent = '⚔ Wave in progress...';
});

// ─── Menu button ───────────────────────────────────────────────────────────

document.getElementById('go-menu')?.addEventListener('click', () => {
  ui.hideGameOver();
  ui.showLevelSelect();
});

// ─── Resize ───────────────────────────────────────────────────────────────

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
  ui.startCulturalFacts();

  try {
    const resp = await fetch('./data/levels.json');
    const raw = await resp.json();
    gs.allLevels = Array.isArray(raw) ? raw : (raw.levels ?? [raw]);
    ui.showTitleScreen();
    ui.updateKbBadge();
  } catch (err) {
    console.error('Level load failed:', err);
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────

const loop = new GameLoop();
loop.init(renderer, scene, camera, ui, input, audio, hover, moveRing);
loop.start();
init();
