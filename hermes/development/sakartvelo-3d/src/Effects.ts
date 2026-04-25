import * as THREE from 'three';

// ─── REUSABLE VECTORS (zero alloc in update) ───
const _projVec = new THREE.Vector3();

// ═══════════════════════════════════════════════════
// FLOATING GOLD TEXT (HTML overlay — pooled DOM elements)
// ═══════════════════════════════════════════════════

interface FloatingText {
  el: HTMLDivElement;
  life: number;
  maxLife: number;
  vy: number;
  inUse: boolean;
}

const FLOAT_POOL_SIZE = 20;
const floatingPool: FloatingText[] = [];

// Pre-create DOM elements
for (let i = 0; i < FLOAT_POOL_SIZE; i++) {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; color: #ffdd44; font-family: Georgia, serif;
    font-size: 18px; font-weight: bold; pointer-events: none;
    z-index: 100; text-shadow: 1px 1px 3px rgba(0,0,0,0.8), -1px -1px 3px rgba(0,0,0,0.8);
    transform: translate(-50%, -50%); display: none;
  `;
  document.body.appendChild(el);
  floatingPool.push({ el, life: 0, maxLife: 1.2, vy: -40, inUse: false });
}

function worldToScreen(worldPos: THREE.Vector3, camera: THREE.Camera): { x: number; y: number } {
  _projVec.copy(worldPos).project(camera);
  return {
    x: (_projVec.x * 0.5 + 0.5) * innerWidth,
    y: (-_projVec.y * 0.5 + 0.5) * innerHeight,
  };
}

export function spawnFloatingGold(scene: THREE.Scene, pos: THREE.Vector3, amount: number, camera: THREE.Camera) {
  const ft = floatingPool.find(f => !f.inUse);
  if (!ft) return; // pool exhausted — skip

  const screen = worldToScreen(pos, camera);
  ft.el.textContent = `+${amount}g`;
  ft.el.style.left = `${screen.x}px`;
  ft.el.style.top = `${screen.y - 20}px`;
  ft.el.style.display = 'block';
  ft.el.style.opacity = '1';
  ft.life = 1.2;
  ft.maxLife = 1.2;
  ft.vy = -40;
  ft.inUse = true;
}

// ═══════════════════════════════════════════════════
// HIT FLASH (archer impact — pooled 3D meshes)
// ═══════════════════════════════════════════════════

interface HitFlash {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  life: number;
  maxLife: number;
  inUse: boolean;
}

const FLASH_POOL_SIZE = 15;
const flashPool: HitFlash[] = [];
const flashGeo = new THREE.SphereGeometry(0.12, 6, 4);

for (let i = 0; i < FLASH_POOL_SIZE; i++) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  const mesh = new THREE.Mesh(flashGeo, mat);
  mesh.visible = false;
  flashPool.push({ mesh, mat, life: 0, maxLife: 0.15, inUse: false });
}

import { magicParticles } from './MagicalParticles';

export function spawnHitFlash(scene: THREE.Scene, pos: THREE.Vector3) {
  const hf = flashPool.find(f => !f.inUse);
  if (!hf) return;

  hf.mesh.position.set(pos.x, pos.y + 0.3, pos.z);
  hf.mesh.visible = true;
  hf.mat.opacity = 0.8;
  hf.life = hf.maxLife;
  hf.inUse = true;
  scene.add(hf.mesh);

  // God-Tier Magical Sparkles
  magicParticles?.spawnBurst(pos.clone().add(new THREE.Vector3(0, 0.3, 0)), 0xffcc44, 8);
}

// ═══════════════════════════════════════════════════
// SPLASH RING (catapult impact — pooled)
// ═══════════════════════════════════════════════════

interface SplashRing {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  life: number;
  maxLife: number;
  maxRadius: number;
  currentRadius: number; // track current scale radius
  inUse: boolean;
}

const SPLASH_POOL_SIZE = 8;
const splashPool: SplashRing[] = [];
const splashGeoTemplate = new THREE.RingGeometry(0.1, 0.2, 24);

for (let i = 0; i < SPLASH_POOL_SIZE; i++) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xff6633, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(splashGeoTemplate.clone(), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  splashPool.push({ mesh, mat, life: 0, maxLife: 0.4, maxRadius: 1.5, currentRadius: 0, inUse: false });
}

export function spawnSplashRing(scene: THREE.Scene, pos: THREE.Vector3, radius: number) {
  const sr = splashPool.find(s => !s.inUse);
  if (!sr) return;

  sr.mesh.position.set(pos.x, pos.y + 0.1, pos.z);
  sr.mesh.visible = true;
  sr.mat.opacity = 0.7;
  sr.maxRadius = radius;
  sr.currentRadius = 0.1; // start small, expand via scale
  sr.mesh.scale.set(1, 1, 1); // reset scale
  sr.mesh.geometry.dispose();
  sr.mesh.geometry = new THREE.RingGeometry(0.1, 0.2, 24); // only on spawn, not every frame
  sr.life = sr.maxLife;
  sr.inUse = true;
  scene.add(sr.mesh);

  // Flash sphere (reuse hit flash pool)
  spawnHitFlash(scene, pos);
}

// ═══════════════════════════════════════════════════
// UPDATE ALL EFFECTS
// ═══════════════════════════════════════════════════

export function updateEffects(dt: number, camera: THREE.Camera) {
  // Floating texts
  for (const ft of floatingPool) {
    if (!ft.inUse) continue;
    ft.life -= dt;
    ft.vy -= dt * 30;
    const currentY = parseFloat(ft.el.style.top) || 0;
    ft.el.style.top = `${currentY + ft.vy * dt}px`;

    const alpha = ft.life < ft.maxLife * 0.4 ? ft.life / (ft.maxLife * 0.4) : 1;
    ft.el.style.opacity = String(Math.max(0, alpha));

    if (ft.life <= 0) {
      ft.el.style.display = 'none';
      ft.inUse = false;
    }
  }

  // Hit flashes
  for (const hf of flashPool) {
    if (!hf.inUse) continue;
    hf.life -= dt;
    hf.mat.opacity = Math.max(0, hf.life / hf.maxLife) * 0.8;
    if (hf.life <= 0) {
      hf.mesh.visible = false;
      hf.mesh.parent?.remove(hf.mesh);
      hf.inUse = false;
    }
  }

  // Splash rings — use scale to expand (zero alloc, no GC pressure)
  for (const sr of splashPool) {
    if (!sr.inUse) continue;
    sr.life -= dt;
    const t = 1 - (sr.life / sr.maxLife);
    const targetRadius = sr.maxRadius * t;
    if (targetRadius !== sr.currentRadius) {
      // Scale mesh so inner radius (0.1) to outer radius matches targetRadius
      // RingGeometry inner=0.1, outer=0.2 → thickness=0.1, half-thickness=0.05
      // Scale factor = targetRadius / (0.2 - 0.05) ≈ targetRadius / 0.15
      const scale = targetRadius / 0.15;
      sr.mesh.scale.setScalar(Math.max(0.01, scale));
      sr.currentRadius = targetRadius;
    }
    sr.mat.opacity = (1 - t) * 0.7;
    if (sr.life <= 0) {
      sr.mesh.visible = false;
      sr.mesh.parent?.remove(sr.mesh);
      sr.inUse = false;
    }
  }
}

// ═══════════════════════════════════════════════════
// DISPOSE — call on level reset
// ═══════════════════════════════════════════════════

export function disposeEffects(scene: THREE.Scene) {
  for (const ft of floatingPool) {
    ft.el.style.display = 'none';
    ft.inUse = false;
  }
  for (const hf of flashPool) {
    scene.remove(hf.mesh);
    hf.inUse = false;
  }
  for (const sr of splashPool) {
    scene.remove(sr.mesh);
    sr.mesh.geometry.dispose();
    sr.inUse = false;
  }
}
