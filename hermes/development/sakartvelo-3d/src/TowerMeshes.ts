/**
 * TowerMeshes.ts
 * Mesh-building helpers for each tower type.
 * Extracted from Tower.ts to keep it under 300 lines.
 */
import * as THREE from 'three';
import { toon, outlineGroup } from './CelShader';
import { mythic, mythicToon } from './MythicMaterials';
import { geoCache } from './GeometryCache';

function createSwayFlag(width: number, height: number, color: number): THREE.Mesh {
  // NOTE: Cannot use geoCache here — geometry.translate() below mutates it.
  const geometry = new THREE.PlaneGeometry(width, height, 10, 6);

  // Move the geometry so the left edge is anchored at the pole.
  geometry.translate(width * 0.5, 0, 0);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec3 transformed = position;

        // Pole is on uv.x = 0. Free end is uv.x = 1.
        float anchor = pow(uv.x, 1.7);

        float primaryWave = sin((uTime * 2.4) + (uv.y * 4.5)) * 0.09;
        float secondaryWave = sin((uTime * 3.6) + (uv.x * 7.0) - (uv.y * 2.0)) * 0.04;

        transformed.z += (primaryWave + secondaryWave) * anchor;
        transformed.y += sin((uTime * 2.0) + (uv.x * 5.0)) * 0.02 * anchor;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec2 vUv;

      void main() {
        float shade = 0.80 + ((1.0 - vUv.y) * 0.20);
        gl_FragColor = vec4(uColor * shade, 0.95);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const flag = new THREE.Mesh(geometry, material);
  flag.castShadow = true;

  flag.onBeforeRender = () => {
    material.uniforms.uTime.value = performance.now() * 0.001;
  };

  return flag;
}

export function buildArcherMesh(
  group: THREE.Group, lv: number, scaleMult: number, color: number,
): void {
  const lightened = new THREE.Color(color).addScalar(0.18).getHex();
  const isL3 = lv >= 3;
  const stone = isL3 ? 0x73705f : 0x6d6959;
  const wood = isL3 ? 0x8a6030 : 0x6b4524;
  const gold = 0xd4a017;
  const roofColor = lv === 1 ? 0x5b3416 : lv === 2 ? 0x8b6914 : 0xc79a22;
  const baseY = isL3 ? 0.18 : 0.12;
  const towerH = (lv === 1 ? 0.86 : lv === 2 ? 1.06 : 1.34) * scaleMult;

  const add = (mesh: THREE.Mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  add(new THREE.Mesh(
    geoCache.getCylinder(0.42 * scaleMult, 0.48 * scaleMult, baseY * 2, 8),
    mythic(stone, 0.1, 0.9),
  )).position.y = baseY;

  add(new THREE.Mesh(
    geoCache.getCylinder(0.34 * scaleMult, 0.42 * scaleMult, 0.12, 8),
    mythicToon(0x504b3f),
  )).position.y = baseY * 2 + 0.06;

  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      const leg = add(new THREE.Mesh(
        geoCache.getBox(0.1 * scaleMult, towerH, 0.1 * scaleMult),
        mythicToon(wood),
      ));
      leg.position.set(x * 0.26 * scaleMult, baseY * 2 + towerH / 2, z * 0.26 * scaleMult);
      leg.rotation.z = x * 0.08;
      leg.rotation.x = -z * 0.08;
    }
  }

  const braceY = baseY * 2 + towerH * 0.48;
  for (const z of [-1, 1]) {
    const brace = add(new THREE.Mesh(
      geoCache.getBox(0.68 * scaleMult, 0.06 * scaleMult, 0.06 * scaleMult),
      mythic(wood, 0.1, 0.85),
    ));
    brace.position.set(0, braceY, z * 0.28 * scaleMult);
    brace.rotation.z = z * 0.45;
  }

  const topY = baseY * 2 + towerH;
  add(new THREE.Mesh(
    geoCache.getBox(0.78 * scaleMult, 0.12 * scaleMult, 0.78 * scaleMult),
    mythicToon(lightened),
  )).position.y = topY;

  for (const z of [-0.36, 0.36]) {
    add(new THREE.Mesh(
      geoCache.getBox(0.74 * scaleMult, 0.1 * scaleMult, 0.06 * scaleMult),
      mythicToon(gold),
    )).position.set(0, topY + 0.12, z * scaleMult);
  }
  for (const x of [-0.36, 0.36]) {
    add(new THREE.Mesh(
      geoCache.getBox(0.06 * scaleMult, 0.1 * scaleMult, 0.74 * scaleMult),
      mythicToon(gold),
    )).position.set(x * scaleMult, topY + 0.12, 0);
  }

  const roofHeight = (lv === 3 ? 0.58 : 0.42) * scaleMult;
  const roof = add(new THREE.Mesh(
    geoCache.getCone(0.5 * scaleMult, roofHeight, 4),
    mythicToon(roofColor),
  ));
  roof.position.y = topY + 0.22 + roofHeight / 2;
  roof.rotation.y = Math.PI / 4;

  if (lv >= 2) {
    const bannerPole = add(new THREE.Mesh(
      geoCache.getCylinder(0.012, 0.012, 0.5 * scaleMult, 6),
      mythic(0x2f2f2f, 0.2, 0.8),
    ));
    bannerPole.position.set(0.34 * scaleMult, topY + 0.38, -0.28 * scaleMult);
    const flag = createSwayFlag(0.2 * scaleMult, 0.13 * scaleMult, lv >= 3 ? 0xd63031 : 0x2d6a4f);
    flag.position.set(0.34 * scaleMult, topY + 0.52, -0.28 * scaleMult);
    flag.rotation.y = Math.PI / 5;
    group.add(flag);
  }

  const archerCount = lv;
  const spots: [number, number][] = [[0, 0.22], [-0.19, -0.16], [0.19, -0.16]];
  for (let i = 0; i < archerCount; i++) {
    const [x, z] = spots[i];
    const body = add(new THREE.Mesh(
      geoCache.getCylinder(0.055 * scaleMult, 0.07 * scaleMult, 0.16 * scaleMult, 5),
      toon(0x1b3a26),
    ));
    body.position.set(x * scaleMult, topY + 0.24, z * scaleMult);
    const head = add(new THREE.Mesh(
      geoCache.getBox(0.075 * scaleMult, 0.075 * scaleMult, 0.075 * scaleMult),
      toon(0xd2b08e),
    ));
    head.position.set(x * scaleMult, topY + 0.36, z * scaleMult);
    const bow = add(new THREE.Mesh(
      geoCache.getTorus(0.09 * scaleMult, 0.006 * scaleMult, 5, 12, Math.PI),
      mythic(0x4a2c16, 0.1, 0.85),
    ));
    bow.position.set((x + 0.06) * scaleMult, topY + 0.29, (z + 0.08) * scaleMult);
    bow.rotation.set(Math.PI / 2, 0, -0.25);
  }

  outlineGroup(group);
}

export function buildCatapultMesh(
  group: THREE.Group, lv: number, scaleMult: number, color: number,
): void {
  const isL3 = lv >= 3;
  const lightened = new THREE.Color(color).addScalar(0.2).getHex();
  
  // 1. CHASSIS (Reinforced Stone/Iron for L3)
  const platform = new THREE.Mesh(
    geoCache.getBox(0.6 * scaleMult, isL3 ? 0.25 : 0.15 * scaleMult, 0.5 * scaleMult),
    mythicToon(lightened)
  );
  platform.position.y = isL3 ? 0.12 : 0.075; 
  platform.castShadow = true;
  group.add(platform);

  const frontPlate = new THREE.Mesh(
    geoCache.getBox(0.68 * scaleMult, 0.12 * scaleMult, 0.06 * scaleMult),
    mythicToon(isL3 ? 0x5f5a4a : 0x4a3320),
  );
  frontPlate.position.set(0, 0.22 * scaleMult, 0.28 * scaleMult);
  frontPlate.castShadow = true;
  group.add(frontPlate);

  // Wheels
  for (const x of [-0.25, 0.25]) {
    for (const z of [-0.2, 0.2]) {
      const wheel = new THREE.Mesh(
        geoCache.getCylinder(0.12 * scaleMult, 0.12 * scaleMult, 0.08, 8),
        mythic(isL3 ? 0x222222 : 0x444444, 0.2, 0.7)
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x * scaleMult, 0.12, z * scaleMult);
      group.add(wheel);
    }
  }

  // 2. THE ARM & BUCKET (Heavier for L3)
  const armHeight = isL3 ? 0.9 * scaleMult : 0.6 * scaleMult;
  const arm = new THREE.Mesh(
    geoCache.getBox(0.08 * scaleMult, armHeight, 0.08 * scaleMult),
    mythic(0x5d4037, 0.1, 0.9)
  );
  arm.rotation.x = -Math.PI / 4;
  arm.position.set(0, 0.4 * scaleMult, -0.1 * scaleMult);
  group.add(arm);

  const crossBeam = new THREE.Mesh(
    geoCache.getBox(0.62 * scaleMult, 0.07 * scaleMult, 0.07 * scaleMult),
    mythic(0x735938, 0.1, 0.85),
  );
  crossBeam.position.set(0, 0.36 * scaleMult, 0.02 * scaleMult);
  group.add(crossBeam);

  const bucketSize = isL3 ? 0.3 * scaleMult : 0.2 * scaleMult;
  const bucket = new THREE.Mesh(
    geoCache.getBox(bucketSize, 0.1 * scaleMult, bucketSize),
    mythicToon(isL3 ? 0xd4a017 : 0x8d6e63)
  );
  bucket.position.set(0, 0.4 * scaleMult + Math.sin(Math.PI / 4) * (armHeight / 2), -0.1 * scaleMult - Math.cos(Math.PI / 4) * (armHeight / 2));
  group.add(bucket);

  const stone = new THREE.Mesh(
    geoCache.getIcosahedron((isL3 ? 0.13 : 0.1) * scaleMult, 0),
    mythicToon(0x777766),
  );
  stone.position.copy(bucket.position);
  stone.position.y += 0.1 * scaleMult;
  group.add(stone);

  if (isL3) {
    // War Banner for Catapult
    const pole = new THREE.Mesh(
      geoCache.getCylinder(0.01, 0.01, 0.6, 8),
      mythic(0x333333, 0.1, 0.9)
    );
    pole.position.set(0.2, 0.5, 0.2);
    group.add(pole);

    const banner = createSwayFlag(0.15, 0.3, 0xd63031);
    banner.position.set(0.2, 0.65, 0.2);
    banner.rotation.y = Math.PI / 4;
    group.add(banner);
  }
}

export function buildWallMesh(
  group: THREE.Group, lv: number,
  hpBg: THREE.Mesh, hpFill: THREE.Mesh,
): void {
  const era = (window as any).__gs?.currentLevel?.era ?? 0;

  if (era === 0) {
    buildWoodenPalisade(group, lv, hpBg, hpFill);
  } else {
    buildStoneBastion(group, lv, hpBg, hpFill);
  }
}

function buildWoodenPalisade(
  group: THREE.Group, lv: number,
  hpBg: THREE.Mesh, hpFill: THREE.Mesh,
): void {
  const wallH = 0.5 + (lv - 1) * 0.15;
  const logColor = lv === 1 ? 0x6b4524 : lv === 2 ? 0x5d4037 : 0x4e342e;
  const ropeColor = 0x8b7d6b;
  const bronzeColor = 0xcd7f32;

  const add = (mesh: THREE.Mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // 1. VERTICAL LOGS (Palisade)
  // Create a tight row of logs with slight random height/rotation for "handcrafted" feel
  const logCount = 5;
  const logStep = 0.18;
  for (let i = 0; i < logCount; i++) {
    for (let j = 0; j < logCount; j++) {
      // Only outer logs for the wall perimeter
      if (i > 0 && i < logCount - 1 && j > 0 && j < logCount - 1) continue;

      const x = (i - (logCount - 1) / 2) * logStep;
      const z = (j - (logCount - 1) / 2) * logStep;
      
      const randH = wallH + (Math.random() * 0.1 - 0.05);
      // NOTE: randH is unique per-log, so caching would create too many unique keys.
      const log = add(new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.09, randH, 6),
        mythicToon(logColor)
      ));
      log.position.set(x, randH / 2, z);
      log.rotation.y = Math.random() * Math.PI;
      log.rotation.x = (Math.random() - 0.5) * 0.05;

      // Pointed tip
      const tipH = 0.15;
      const tip = add(new THREE.Mesh(
        new THREE.ConeGeometry(0.08, tipH, 6),
        mythicToon(logColor)
      ));
      tip.position.set(x, randH + tipH / 2 - 0.02, z);
      tip.rotation.y = log.rotation.y;
    }
  }

  // 2. REINFORCEMENTS
  if (lv === 1) {
    // Rope bindings
    for (const y of [wallH * 0.3, wallH * 0.7]) {
      const rope = add(new THREE.Mesh(
        geoCache.getBox(0.85, 0.03, 0.85),
        mythic(ropeColor, 0, 0.9)
      ));
      rope.position.y = y;
    }
  } else {
    // Bronze bands
    for (const y of [wallH * 0.25, wallH * 0.75]) {
      const band = add(new THREE.Mesh(
        geoCache.getBox(0.9, 0.06, 0.9),
        mythicToon(bronzeColor)
      ));
      band.position.y = y;
    }
  }

  // 3. LEVEL 3 EXTRAS (Walkway & Spikes)
  if (lv >= 3) {
    const platform = add(new THREE.Mesh(
      geoCache.getBox(0.7, 0.08, 0.7),
      mythicToon(0x3e2723)
    ));
    platform.position.y = wallH * 0.6;

    // Small bronze spikes at the base
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const spike = add(new THREE.Mesh(
        geoCache.getCone(0.04, 0.2, 4),
        mythicToon(bronzeColor)
      ));
      spike.position.set(Math.cos(angle) * 0.45, 0.1, Math.sin(angle) * 0.45);
      spike.rotation.x = Math.PI / 2;
      spike.lookAt(new THREE.Vector3(0, 1, 0));
    }
  }

  // HP bar position
  hpBg.position.y = wallH + 0.35;
  hpFill.position.y = wallH + 0.35;
}

function buildStoneBastion(
  group: THREE.Group, lv: number,
  hpBg: THREE.Mesh, hpFill: THREE.Mesh,
): void {
  const wallH = 0.4 + (lv - 1) * 0.12;
  const wallColor = lv === 1 ? 0x8a7a5a : lv === 2 ? 0x9a8a6a : 0xaaaaaa;

  // 1. MAIN BASTION (Layered with a beveled base)
  const baseH = 0.1;
  const bastionBase = new THREE.Mesh(
    geoCache.getBox(0.98, baseH, 0.98),
    mythic(wallColor, 0.1, 0.9)
  );
  bastionBase.position.y = baseH / 2;
  bastionBase.castShadow = true;
  group.add(bastionBase);

  const mainWall = new THREE.Mesh(
    geoCache.getBox(0.92, wallH - baseH, 0.92),
    mythicToon(wallColor)
  );
  mainWall.position.y = baseH + (wallH - baseH) / 2;
  mainWall.castShadow = true;
  group.add(mainWall);

  for (const z of [-0.47, 0.47]) {
    const band = new THREE.Mesh(
      geoCache.getBox(0.98, 0.06, 0.04),
      mythicToon(lv >= 3 ? 0xd4a017 : 0x5a4a32),
    );
    band.position.set(0, wallH * 0.55, z);
    group.add(band);
  }
  for (const x of [-0.47, 0.47]) {
    const band = new THREE.Mesh(
      geoCache.getBox(0.04, 0.06, 0.98),
      mythicToon(lv >= 3 ? 0xd4a017 : 0x5a4a32),
    );
    band.position.set(x, wallH * 0.55, 0);
    group.add(band);
  }

  // 2. DEFENSIVE RIDGES (Crenellations)
  const bSize = 0.14 + (lv - 1) * 0.02;
  for (const dx of [-1, 1]) {
    for (const dz of [-1, 1]) {
      const tooth = new THREE.Mesh(
        geoCache.getBox(bSize, bSize, bSize),
        mythicToon(wallColor)
      );
      tooth.position.set(dx * 0.35, wallH + bSize / 2, dz * 0.35);
      group.add(tooth);
    }
  }

  for (let i = -1; i <= 1; i++) {
    const frontSpike = new THREE.Mesh(
      geoCache.getCone(0.035, 0.22, 4),
      mythic(0x735938, 0.1, 0.8),
    );
    frontSpike.position.set(i * 0.25, wallH + 0.09, 0.48);
    frontSpike.rotation.x = -0.75;
    group.add(frontSpike);
  }

  // 3. STAKES (Level 2+) - Now more "Mythic" with sharpened tips
  if (lv >= 2) {
    for (let i = -1; i <= 1; i++) {
      const stake = new THREE.Mesh(
        geoCache.getCone(0.04, 0.25, 4),
        mythic(0x735938, 0.1, 0.8)
      );
      stake.position.set(i * 0.2, wallH + 0.12, 0.45);
      stake.rotation.x = -0.4;
      group.add(stake);
    }
  }

  // 4. LEGENDARY BAND (Level 3)
  if (lv >= 3) {
    const band = new THREE.Mesh(
      geoCache.getBox(0.95, 0.05, 0.95),
      mythic(0x555555, 0.8, 0.3)
    );
    band.position.y = wallH * 0.7;
    group.add(band);
  }

  // HP bar — each wall needs its own geometry since the fill is scaled per-frame.
  const hbW = 0.9;
  hpBg.geometry = new THREE.BoxGeometry(hbW, 0.06, 0.01);
  hpBg.position.y = wallH + 0.25;
  hpFill.geometry = new THREE.BoxGeometry(hbW - 0.02, 0.04, 0.02);
  hpFill.position.y = wallH + 0.25;
}
