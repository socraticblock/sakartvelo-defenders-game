/**
 * main.ts
 * Entry point. Wires scene, subsystems, and event handlers together.
 */
import * as THREE from 'three';
import { gs } from './GameState';
import { visuals } from './VisualsManager';
import { ui } from './UIManager';
import { input } from './InputManager';
import { audio } from './AudioManager';
import { GameLoop } from './GameLoop';
import { SaveManager } from './SaveManager';
import { Tower } from './Tower';
import { screenMgr } from './ScreenManager';

// ─── Scene ────────────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x151d15);
scene.fog = new THREE.FogExp2(0x151d15, 0.025); // Slightly thicker for depth

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85; // Crushed exposure for cinematic look
document.body.appendChild(renderer.domElement);

// Lighting - Phase 4 Step 1 (Cinematic Shadows)
scene.add(new THREE.AmbientLight(0xffffff, 0.2)); 
scene.add(new THREE.HemisphereLight(0xaaaaff, 0x444422, 0.2));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(20, 40, 20);
sun.castShadow = true;
sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshLambertMaterial({ color: 0x3a4a3a }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.06;
ground.receiveShadow = true;
scene.add(ground);

const hover = new THREE.Group();
hover.visible = false;
scene.add(hover);

const moveRing = new THREE.Mesh(
  new THREE.RingGeometry(0.25, 0.35, 16),
  new THREE.MeshBasicMaterial({ color: 0xd4a017, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
);
moveRing.rotation.x = -Math.PI / 2;
moveRing.visible = false;
scene.add(moveRing);

// ─── Global Hooks (ESSENTIAL for HTML buttons) ───────────────────────────

(window as any).__scene = scene;
(window as any).__audioMgr = audio;
(window as any).__gs = gs;

(window as any).__showEraScreen = () => {
  console.log('--- GLOBAL BEGIN TRIGGERED ---');
  screenMgr.showEraScreen();
};

(window as any).__navigateToLevelSelect = () => {
  console.log('--- GLOBAL CONTINUE TRIGGERED ---');
  audio.stopEraNarration();
  screenMgr.showLevelSelect(0);
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

  (window as any).__grid = gs.grid;

  ui.screens.showGameUI();
  ui.showLevelName(lvl.name);
  ui.screens.hideGameOver();
  ui.screens.hideLevelComplete();
  ui.screens.showTutorial(lvl.level);
  ui.update();
}

// ─── Init ────────────────────────────────────────────────────────────────

ui.init(
  (era, level) => startLevel(era, level),
  () => { gs.selectedType = null; gs.selectedTower = null; ui.screens.showLevelSelect(); },
);

input.init(renderer, camera, scene, {
  onHeroMove: (x, z) => { gs.hero?.moveTo(x, z); },
  onGridClick: (gx, gy, isPath) => {
    if (gs.gameOver || !gs.selectedType || !gs.hero) return;
    gs.hero.pendingBuild = { type: gs.selectedType, gx, gy, isPath };
    gs.selectedType = null;
    ui.panel.towerButtons.forEach(b => b.classList.remove('selected'));
  },
  onTowerClick: (tower) => {
    gs.selectedTower = tower;
    tower.showRange(true);
    ui.update();
  },
  onAbility: (idx) => gs.hero?.activateAbility(idx, gs.enemies, gs.towers),
  onEscape: () => { gs.selectedType = null; gs.selectedTower = null; },
  onDeselect: () => { gs.selectedType = null; gs.selectedTower = null; },
});

renderer.domElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const pos = input.getMouseGround();
  if (pos) gs.hero?.moveTo(pos.x, pos.z);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

async function init(): Promise<void> {
  audio.init();
  // Calibrate word times if needed
  if ((audio as any).calibrateWordTimes) {
    (audio as any).calibrateWordTimes().then((times: any) => {
      (audio as any)._tpWordTimes = times;
    });
  }

  ui.screens.startCulturalFacts();

  try {
    // FIX: Use absolute-style path for Vite public folder
    const resp = await fetch('/data/levels.json');
    if (!resp.ok) throw new Error('Fetch failed: ' + resp.status);
    const raw = await resp.json();
    gs.allLevels = raw.levels || raw;
    console.log('Levels loaded:', gs.allLevels.length);
    ui.screens.showTitleScreen();
  } catch (err) {
    console.error('CRITICAL LOAD ERROR:', err);
    // Even if it fails, show the title screen so the user can at least try to click
    ui.screens.showTitleScreen();
  }
}

const loop = new GameLoop();
visuals.init(renderer, scene, camera);
loop.init(renderer, scene, camera, ui, input, audio, hover, moveRing);
loop.start();
init();
