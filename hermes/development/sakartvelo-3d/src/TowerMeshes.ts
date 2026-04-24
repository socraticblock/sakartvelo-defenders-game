/**
 * TowerMeshes.ts
 * Mesh-building helpers for each tower type.
 * Extracted from Tower.ts to keep it under 300 lines.
 */
import * as THREE from 'three';
import { toon, outlineGroup } from './CelShader';

export function buildArcherMesh(
  group: THREE.Group, lv: number, scaleMult: number, color: number,
): void {
  // 1. THE FOUNDATION (Beveled Octagonal Base)
  const baseGeo = new THREE.CylinderGeometry(0.32 * scaleMult, 0.38 * scaleMult, 0.2, 8);
  const base = new THREE.Mesh(baseGeo, toon(lv >= 3 ? 0x999988 : 0x777766));
  base.position.y = 0.1; 
  base.castShadow = true;
  group.add(base);

  // 2. THE MAIN SHAFT (Tapered with a decorative "Belt")
  const shaftGeo = new THREE.CylinderGeometry(0.18 * scaleMult, 0.24 * scaleMult, 0.7 * scaleMult, 8);
  const shaft = new THREE.Mesh(shaftGeo, toon(color));
  shaft.position.y = 0.45 * scaleMult;
  shaft.castShadow = true;
  group.add(shaft);

  // Decorative Belt (Level 2+)
  if (lv >= 2) {
    const beltGeo = new THREE.CylinderGeometry(0.22 * scaleMult, 0.22 * scaleMult, 0.05 * scaleMult, 8);
    const belt = new THREE.Mesh(beltGeo, toon(0x554433));
    belt.position.y = 0.5 * scaleMult;
    group.add(belt);
  }

  // 3. THE BATTLEMENTS (Crenellations)
  const topPlatformGeo = new THREE.CylinderGeometry(0.26 * scaleMult, 0.22 * scaleMult, 0.1, 8);
  const topPlatform = new THREE.Mesh(topPlatformGeo, toon(color));
  topPlatform.position.y = 0.8 * scaleMult;
  group.add(topPlatform);

  // Add 4 crenellations (teeth)
  for (let i = 0; i < 4; i++) {
    const tooth = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * scaleMult, 0.1 * scaleMult, 0.08 * scaleMult),
      toon(color)
    );
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 8;
    const dist = 0.22 * scaleMult;
    tooth.position.set(Math.cos(angle) * dist, 0.85 * scaleMult + 0.05, Math.sin(angle) * dist);
    tooth.rotation.y = -angle;
    group.add(tooth);
  }

  // 4. THE ROOF (High-Peak Mythic Style)
  const roofColor = lv === 1 ? 0x6b4914 : lv === 2 ? 0x8b6914 : 0xd4a017;
  const roofGeo = new THREE.ConeGeometry(0.32 * scaleMult, 0.4 * scaleMult, 8);
  const roof = new THREE.Mesh(roofGeo, toon(roofColor));
  roof.position.y = 0.8 * scaleMult + 0.2 * scaleMult + 0.1;
  group.add(roof);

  // 5. THE ARCHERS (Detailed Sphere-base units)
  const archerGeo = new THREE.SphereGeometry(0.09 * scaleMult, 8, 6);
  const archer = new THREE.Mesh(archerGeo, toon(0xd2b08e));
  archer.position.set(0, 0.85 * scaleMult + 0.05, 0.15 * scaleMult);
  group.add(archer);

  if (lv >= 2) {
    const archer2 = new THREE.Mesh(archerGeo, toon(0xd2b08e));
    archer2.position.set(-0.12 * scaleMult, 0.85 * scaleMult + 0.05, -0.1 * scaleMult);
    group.add(archer2);
  }

  // 6. LEGENDARY ACCENT (Level 3)
  if (lv >= 3) {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23 * scaleMult, 0.23 * scaleMult, 0.04, 8),
      new THREE.MeshLambertMaterial({ color: 0xd4a017, emissive: 0xd4a017, emissiveIntensity: 1.5 })
    );
    band.position.y = 0.8 * scaleMult;
    group.add(band);
  }
}

export function buildCatapultMesh(
  group: THREE.Group, lv: number, scaleMult: number,
): void {
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(0.6 * scaleMult, 0.15 * scaleMult, 0.5 * scaleMult),
    toon(lv >= 3 ? 0x554422 : 0x735938)
  );
  platform.position.y = 0.075; platform.castShadow = true;
  group.add(platform);

  for (const x of [-0.25, 0.25]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1 * scaleMult, 0.1 * scaleMult, 0.05, 8),
      toon(lv >= 3 ? 0x555555 : 0x444444)
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x * scaleMult, 0.1, 0.22);
    group.add(wheel);
  }

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.5 * scaleMult, 0.06),
    toon(0x735938)
  );
  arm.position.set(0, 0.4 * scaleMult, -0.1);
  arm.rotation.x = -0.4;
  group.add(arm);

  const bucket = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * scaleMult, 0.08 * scaleMult, 0.12 * scaleMult),
    toon(lv >= 2 ? 0x666666 : 0x555555)
  );
  bucket.position.set(0, 0.55 * scaleMult, -0.28);
  group.add(bucket);

  if (lv >= 2) {
    for (let i = 0; i < 2; i++) {
      const ammo = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 4),
        toon(0x666666)
      );
      ammo.position.set(0.15 + i * 0.06, 0.18, -0.15);
      group.add(ammo);
    }
  }

  if (lv >= 3) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.62 * scaleMult, 0.04, 0.52 * scaleMult),
      new THREE.MeshLambertMaterial({ color: 0xd4a017, emissive: 0xd4a017, emissiveIntensity: 1.5 })
    );
    frame.position.y = 0.16;
    group.add(frame);
  }
}

export function buildWallMesh(
  group: THREE.Group, lv: number,
  hpBg: THREE.Mesh, hpFill: THREE.Mesh,
): void {
  const wallH = 0.4 + (lv - 1) * 0.12;
  const wallColor = lv === 1 ? 0x8a7a5a : lv === 2 ? 0x9a8a6a : 0xaaaaaa;

  // 1. MAIN BASTION (Layered with a beveled base)
  const baseH = 0.1;
  const bastionBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.98, baseH, 0.98),
    toon(wallColor)
  );
  bastionBase.position.y = baseH / 2;
  bastionBase.castShadow = true;
  group.add(bastionBase);

  const mainWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, wallH - baseH, 0.92),
    toon(wallColor)
  );
  mainWall.position.y = baseH + (wallH - baseH) / 2;
  mainWall.castShadow = true;
  group.add(mainWall);

  // 2. DEFENSIVE RIDGES (Crenellations)
  const bSize = 0.14 + (lv - 1) * 0.02;
  for (const dx of [-1, 1]) {
    for (const dz of [-1, 1]) {
      const tooth = new THREE.Mesh(
        new THREE.BoxGeometry(bSize, bSize, bSize),
        toon(wallColor)
      );
      tooth.position.set(dx * 0.35, wallH + bSize / 2, dz * 0.35);
      group.add(tooth);
    }
  }

  // 3. STAKES (Level 2+) - Now more "Mythic" with sharpened tips
  if (lv >= 2) {
    for (let i = -1; i <= 1; i++) {
      const stake = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.25, 4),
        toon(0x735938)
      );
      stake.position.set(i * 0.2, wallH + 0.12, 0.45);
      stake.rotation.x = -0.4;
      group.add(stake);
    }
  }

  // 4. LEGENDARY BAND (Level 3)
  if (lv >= 3) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.05, 0.95),
      toon(0x555555)
    );
    band.position.y = wallH * 0.7;
    group.add(band);
  }

  // HP bar
  const hbW = 0.9;
  hpBg.geometry = new THREE.BoxGeometry(hbW, 0.06, 0.01);
  hpBg.position.y = wallH + 0.25;
  hpFill.geometry = new THREE.BoxGeometry(hbW - 0.02, 0.04, 0.02);
  hpFill.position.y = wallH + 0.25;
}
