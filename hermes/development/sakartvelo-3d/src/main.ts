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
import { initMagicParticles } from './MagicalParticles';
import { initAmbientDust } from './AmbientDust';
import { warHorn } from './WarHorn';
import { getMedeaTemplate, loadMedeaTemplate } from './MedeaGltf';

// Use the generated magical sprite
const MAGIC_SPRITE = '/magic_particle_sprite.png';

// ─── Scene ────────────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x151d15);
scene.fog = new THREE.FogExp2(0x151d15, 0.02);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 120);
const CAMERA_ZOOM_KEY = 'sakartvelo_camera_zoom_pct';
let cameraZoomPct = 100;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Lighting - Prestige Balance (Moody but Visible)
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
scene.add(new THREE.HemisphereLight(0xaaaaff, 0x444422, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(20, 40, 20);
sun.castShadow = true;
sun.shadow.camera.left = -30; sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
fillLight.position.set(-20, 10, -20); 
scene.add(fillLight);

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

initMagicParticles(scene, MAGIC_SPRITE);
initAmbientDust(scene, MAGIC_SPRITE);

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
(window as any).__camera = camera;
(window as any).__setCameraZoom = (v: number) => {
  const clamped = Math.max(80, Math.min(120, Number(v) || 100));
  cameraZoomPct = clamped;
  localStorage.setItem(CAMERA_ZOOM_KEY, String(clamped));
  if (gs.currentLevel) setupCamera(gs.currentLevel.grid_width, gs.currentLevel.grid_height);
};
(window as any).__getCameraZoom = () => cameraZoomPct;

(window as any).__showEraScreen = () => {
  console.log('--- GLOBAL BEGIN TRIGGERED ---');
  screenMgr.showEraScreen();
};

(window as any).__navigateToLevelSelect = () => {
  console.log('--- GLOBAL CONTINUE TRIGGERED ---');
  audio.hardStopEraNarration();
  screenMgr.showLevelSelect(0);
};

// ─── Level lifecycle ─────────────────────────────────────────────────────

function setupCamera(gw: number, gh: number): void {
  const cx = gw / 2, cz = gh / 2;
  const bottomUiRects = ['bottom-bar', 'hero-bar']
    .map(id => document.getElementById(id))
    .filter((el): el is HTMLElement => Boolean(el) && getComputedStyle(el!).display !== 'none')
    .map(el => el.getBoundingClientRect())
    .filter(rect => rect.top > innerHeight * 0.58);
  const bottomTop = bottomUiRects.length ? Math.min(...bottomUiRects.map(rect => rect.top)) : innerHeight;
  const bottomUiRatio = Math.max(0, Math.min(0.42, (innerHeight - bottomTop) / innerHeight));
  const zoomScale = 100 / cameraZoomPct;
  const dist = Math.max(gh * 0.75, gw * 1.06) * zoomScale;
  const upwardBiasCells = gh * (0.08 + bottomUiRatio * 0.42);
  const zoomOutFactor = Math.max(0, Math.min(1, (100 - cameraZoomPct) / 20));
  const screenLiftCells = gh * (0.14 + zoomOutFactor * 0.1);
  const targetBottomY = Math.min(innerHeight - 12, bottomTop - 12);
  const camHeight = dist * (0.96 + bottomUiRatio * 0.12);
  const camDepth = dist * (0.82 + bottomUiRatio * 0.2);
  const baseTargetZ = cz - upwardBiasCells + screenLiftCells;
  const mapBottom = new THREE.Vector3(cx, 0, gh - 0.08);

  camera.fov = 46;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  const applyTarget = (targetZ: number): number => {
    camera.position.set(cx, camHeight, targetZ + camDepth);
    camera.lookAt(cx, 0, targetZ);
    camera.updateMatrixWorld(true);
    const projected = mapBottom.clone().project(camera);
    return (1 - projected.y) * 0.5 * innerHeight;
  };

  let targetZ = baseTargetZ;
  const minTargetZ = baseTargetZ - gh * 0.75;
  const maxTargetZ = baseTargetZ + gh * 0.75;

  // Solve bottom-map screen anchor while preserving camera angle.
  for (let i = 0; i < 6; i++) {
    const y = applyTarget(targetZ);
    if (!Number.isFinite(y)) break;
    const errPx = targetBottomY - y;
    if (Math.abs(errPx) < 1) break;

    const sampleStep = 0.35;
    const y2 = applyTarget(targetZ + sampleStep);
    const slope = (y2 - y) / sampleStep;
    if (!Number.isFinite(slope) || Math.abs(slope) < 0.001) break;

    const dz = THREE.MathUtils.clamp(errPx / slope, -gh * 0.18, gh * 0.18);
    targetZ = THREE.MathUtils.clamp(targetZ + dz, minTargetZ, maxTargetZ);
  }

  applyTarget(targetZ);
  gs.cameraBaseX = cx;
}

async function startLevel(era: number, level: number): Promise<void> {
  const lvl = gs.allLevels.find(l => l.era === era && l.level === level);
  if (!lvl) return;

  // Clean up previous level's resources
  loop.cleanup();

  audio.stopNarration();
  audio.hardStopEraNarration();
  if (era === 0 && level >= 1 && level <= 20) {
    const variant = Math.random() < 0.5 ? '' : 'b';
    audio.playBGM(`/audio/music-era0-lvl${level}${variant}.mp3`);
  } else {
    audio.stopBGM();
  }
  await loadMedeaTemplate();
  gs.initLevel(lvl, scene, getMedeaTemplate());
  ui.reset();
  if (gs.waveMgr?.inBuildPhase) {
    ui.showBuildPhase();
  }
  ui.screens.showGameUI();
  
  if (gs.grid && gs.grid.worldPath.length > 0) {
    warHorn.init(gs.grid.worldPath[0]);
    scene.add(warHorn.group);
  }
  
  // Wait for DOM layout to finish so getBoundingClientRect is accurate
  setTimeout(() => {
    setupCamera(lvl.grid_width, lvl.grid_height);
    (window as any).__grid = gs.grid;
    ui.showLevelName(lvl.name);
    ui.screens.hideGameOver(); ui.screens.hideLevelComplete(); ui.screens.showTutorial(lvl.level); ui.update();
  }, 100);
}

(window as any).__restartCurrentLevel = () => {
  if (!gs.currentLevel) return;
  void startLevel(gs.currentLevel.era, gs.currentLevel.level);
};

// ─── Init ────────────────────────────────────────────────────────────────

ui.init(
  (era, level) => void startLevel(era, level),
  () => { gs.selectedType = null; gs.selectedTower = null; ui.screens.showLevelSelect(); },
);

void loadMedeaTemplate().catch(() => {});

function issueHeroMoveCommand(x: number, z: number): void {
  if (!gs.hero) return;
  // User movement input always overrides queued build/upgrade intents.
  gs.hero.pendingBuild = null;
  gs.hero.buildTimer = 0;
  gs.pendingUpgradeTower = null;
  gs.hero.moveTo(x, z);
}

input.init(renderer, camera, scene, {
  onHeroMove: (x, z) => issueHeroMoveCommand(x, z),
  onGridClick: (gx, gy, isPath) => {
    if (gs.gameOver || !gs.selectedType || !gs.hero || !gs.grid) return;
    
    // ONLY walk if the spot is actually buildable (on a plinth)
    if (gs.grid.isBuildable(gx, gy, gs.selectedType === 'wall')) {
      gs.hero.pendingBuild = { type: gs.selectedType, gx, gy, isPath };
      ui.setTowerPlacementType(null);
      ui.panel.towerButtons.forEach(b => b.classList.remove('selected'));
    } else {
      // Optional: Visual feedback for "Can't build here"
      console.log("Invalid build location");
    }
  },
  onTowerClick: (tower) => {
    gs.selectedTower = tower;
    gs.targetTimeScale = 0.1;
    tower.showRange(true);
    ui.update();
  },
  onBuildNodeClick: (gx, gy) => {
    if (gs.gameOver || !gs.grid || !gs.hero) return;
    if (gs.selectedType === 'wall') return;
    issueHeroMoveCommand(gx + 0.5, gy + 0.5);
    ui.openBuildCircleAtCell(gx, gy, true);
  },
  onAbility: (idx) => gs.hero?.activateAbility(idx, gs.enemies, gs.towers),
  onEscape: () => { 
    if (gs.selectedTower) gs.selectedTower.showRange(false);
    ui.setTowerPlacementType(null); 
    gs.selectedTower = null; 
    gs.targetTimeScale = 1.0;
    ui.update(); 
  },
  onDeselect: () => { 
    if (gs.selectedTower) gs.selectedTower.showRange(false);
    ui.setTowerPlacementType(null); 
    gs.selectedTower = null; 
    gs.targetTimeScale = 1.0;
    ui.update(); 
  },
});

renderer.domElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const pos = input.getMouseGround();
  if (pos) issueHeroMoveCommand(pos.x, pos.z);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  if (gs.currentLevel) setupCamera(gs.currentLevel.grid_width, gs.currentLevel.grid_height);
  else camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

async function init(): Promise<void> {
  const savedZoom = Number(localStorage.getItem(CAMERA_ZOOM_KEY) ?? 100);
  cameraZoomPct = Number.isFinite(savedZoom) ? Math.max(80, Math.min(120, savedZoom)) : 100;
  audio.init();
  audio.playBGM('/audio/intro.mp3');
  // Calibrate word times if needed
  if ((audio as any).calibrateWordTimes) {
    (audio as any).calibrateWordTimes().then((times: any) => {
      (audio as any)._tpWordTimes = times;
    });
  }

  ui.screens.startCulturalFacts();

  try {
    // Keep level iteration honest during design passes; browsers can cache public JSON.
    const resp = await fetch(`/data/levels.json?v=${Date.now()}`, { cache: 'no-store' });
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
