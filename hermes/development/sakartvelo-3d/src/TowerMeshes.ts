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
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28 * scaleMult, 0.35 * scaleMult, 0.3, 8),
    toon(lv >= 3 ? 0x999988 : 0x777766)
  );
  base.position.y = 0.15; base.castShadow = true;
  group.add(base);

  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * scaleMult, 0.22 * scaleMult, 0.6 * scaleMult, 8),
    toon(color)
  );
  tower.position.y = 0.6; tower.castShadow = true;
  group.add(tower);

  const roofColor = lv === 1 ? 0x6b4914 : lv === 2 ? 0x8b6914 : 0xd4a017;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.28 * scaleMult, 0.25 * scaleMult, 8),
    toon(roofColor)
  );
  roof.position.y = 0.6 + 0.3 * scaleMult + 0.12;
  group.add(roof);

  const archer = new THREE.Mesh(
    new THREE.SphereGeometry(0.08 * scaleMult, 6, 4),
    toon(0xd2b08e)
  );
  archer.position.set(0, 0.55 + 0.3 * scaleMult + 0.05, 0.15);
  group.add(archer);

  if (lv >= 2) {
    const archer2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.08 * scaleMult, 6, 4),
      toon(0xd2b08e)
    );
    archer2.position.set(-0.12, 0.55 + 0.3 * scaleMult + 0.05, -0.1);
    group.add(archer2);
  }

  if (lv >= 3) {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22 * scaleMult, 0.22 * scaleMult, 0.04, 8),
      new THREE.MeshLambertMaterial({ color: 0xd4a017, emissive: 0xd4a017, emissiveIntensity: 1.5 })
    );
    band.position.y = 0.85 * scaleMult;
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

  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, wallH, 0.92),
    toon(wallColor)
  );
  wall.position.y = wallH / 2; wall.castShadow = true;
  group.add(wall);

  const bSize = 0.14 + (lv - 1) * 0.02;
  for (const dx of [-1, 1]) {
    for (const dz of [-1, 1]) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(bSize, bSize, bSize),
        toon(wallColor)
      );
      m.position.set(dx * 0.3, wallH + bSize / 2, dz * 0.3);
      group.add(m);
    }
  }

  if (lv >= 2) {
    for (let i = -1; i <= 1; i++) {
      const stake = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.2, 4),
        toon(0x735938)
      );
      stake.position.set(i * 0.15, wallH + 0.1, 0.45);
      stake.rotation.x = -0.3;
      group.add(stake);
    }
  }

  if (lv >= 3) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(0.94, 0.04, 0.94),
      toon(0x555555)
    );
    band.position.y = wallH * 0.6;
    group.add(band);
  }

  // HP bar
  const hbW = 0.9;
  hpBg.geometry = new THREE.BoxGeometry(hbW, 0.06, 0.01);
  hpBg.position.y = wallH + 0.25;
  hpFill.geometry = new THREE.BoxGeometry(hbW - 0.02, 0.04, 0.02);
  hpFill.position.y = wallH + 0.25;
}
