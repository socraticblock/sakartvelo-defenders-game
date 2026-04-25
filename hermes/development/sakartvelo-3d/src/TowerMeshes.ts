/**
 * TowerMeshes.ts
 * Mesh-building helpers for each tower type.
 * Extracted from Tower.ts to keep it under 300 lines.
 */
import * as THREE from 'three';
import { toon, outlineGroup } from './CelShader';
import { mythic, mythicToon } from './MythicMaterials';

function createSwayFlag(width: number, height: number, color: number): THREE.Mesh {
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
  // Lighten the color for better visibility in Toon shader
  const lightened = new THREE.Color(color).addScalar(0.2).getHex();
  const isL3 = lv >= 3;
  
  // 1. THE FOUNDATION (Stone-Heavy for L3)
  const baseRadius = isL3 ? 0.38 * scaleMult : 0.32 * scaleMult;
  const baseGeo = new THREE.CylinderGeometry(baseRadius, 0.4 * scaleMult, isL3 ? 0.4 : 0.2, 8);
  const base = new THREE.Mesh(baseGeo, mythic(isL3 ? 0x6a6a5a : 0x777766, 0.1, 0.9));
  base.position.y = isL3 ? 0.2 : 0.1; 
  base.castShadow = true;
  group.add(base);

  // 2. THE MAIN SHAFT (Vertical stretch for L3)
  const shaftHeight = isL3 ? 1.4 * scaleMult : 0.7 * scaleMult;
  const shaftGeo = new THREE.CylinderGeometry(0.18 * scaleMult, 0.24 * scaleMult, shaftHeight, 8);
  const shaft = new THREE.Mesh(shaftGeo, mythicToon(lightened));
  shaft.position.y = (isL3 ? 0.2 : 0) + shaftHeight / 2;
  shaft.castShadow = true;
  group.add(shaft);

  // 3. THE BATTLEMENTS / GALLERY
  const topY = (isL3 ? 0.2 : 0) + shaftHeight;
  const topPlatformGeo = new THREE.CylinderGeometry(0.28 * scaleMult, 0.22 * scaleMult, 0.15, 8);
  const topPlatform = new THREE.Mesh(topPlatformGeo, mythicToon(lightened));
  topPlatform.position.y = topY;
  group.add(topPlatform);

  if (isL3) {
    // Level 3 Cathedral Features: Open Column Gallery
    for (let i = 0; i < 8; i++) {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6),
        mythic(0xd4a017, 0.5, 0.5)
      );
      const angle = (i / 8) * Math.PI * 2;
      col.position.set(Math.cos(angle) * 0.24, topY + 0.15, Math.sin(angle) * 0.24);
      group.add(col);
    }
  }

  // 4. THE ROOF (High-Peak Spire for L3)
  const roofHeight = isL3 ? 1.0 * scaleMult : 0.4 * scaleMult;
  const roofGeo = new THREE.ConeGeometry(0.35 * scaleMult, roofHeight, 8);
  const roofColor = lv === 1 ? 0x6b4914 : lv === 2 ? 0x8b6914 : 0xd4a017;
  const roof = new THREE.Mesh(roofGeo, mythicToon(roofColor));
  roof.position.y = topY + (isL3 ? 0.3 : 0.1) + roofHeight / 2;
  group.add(roof);

  if (isL3) {
    // Legendary Flag
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.4),
      mythic(0x333333, 0.1, 0.9)
    );
    flagPole.position.y = roof.position.y + roofHeight / 2 + 0.15;
    group.add(flagPole);

    const flag = createSwayFlag(0.25, 0.15, 0xd63031);
    flag.position.set(0, flagPole.position.y + 0.1, 0);
    flag.rotation.y = Math.PI / 4;
    group.add(flag);
  }

  // 5. THE ARCHERS
  const archerGeo = new THREE.SphereGeometry(0.09 * scaleMult, 8, 6);
  const archerPos = topY + 0.08;
  const archer1 = new THREE.Mesh(archerGeo, toon(0xd2b08e));
  archer1.position.set(0, archerPos, 0.18 * scaleMult);
  group.add(archer1);

  if (lv >= 2) {
    const archer2 = new THREE.Mesh(archerGeo, toon(0xd2b08e));
    archer2.position.set(-0.15 * scaleMult, archerPos, -0.12 * scaleMult);
    group.add(archer2);
  }
  if (lv >= 3) {
    const archer3 = new THREE.Mesh(archerGeo, toon(0xd2b08e));
    archer3.position.set(0.15 * scaleMult, archerPos, -0.12 * scaleMult);
    group.add(archer3);
  }
}

export function buildCatapultMesh(
  group: THREE.Group, lv: number, scaleMult: number,
): void {
  const isL3 = lv >= 3;
  const lightened = new THREE.Color(isL3 ? 0x444444 : 0x735938).addScalar(0.2).getHex();
  
  // 1. CHASSIS (Reinforced Stone/Iron for L3)
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(0.6 * scaleMult, isL3 ? 0.25 : 0.15 * scaleMult, 0.5 * scaleMult),
    mythicToon(lightened)
  );
  platform.position.y = isL3 ? 0.12 : 0.075; 
  platform.castShadow = true;
  group.add(platform);

  // Wheels
  for (const x of [-0.25, 0.25]) {
    for (const z of [-0.2, 0.2]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12 * scaleMult, 0.12 * scaleMult, 0.08, 8),
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
    new THREE.BoxGeometry(0.08 * scaleMult, armHeight, 0.08 * scaleMult),
    mythic(0x5d4037, 0.1, 0.9)
  );
  arm.rotation.x = -Math.PI / 4;
  arm.position.set(0, 0.4 * scaleMult, -0.1 * scaleMult);
  group.add(arm);

  const bucketSize = isL3 ? 0.3 * scaleMult : 0.2 * scaleMult;
  const bucket = new THREE.Mesh(
    new THREE.BoxGeometry(bucketSize, 0.1 * scaleMult, bucketSize),
    mythicToon(isL3 ? 0xd4a017 : 0x8d6e63)
  );
  bucket.position.set(0, 0.4 * scaleMult + Math.sin(Math.PI / 4) * (armHeight / 2), -0.1 * scaleMult - Math.cos(Math.PI / 4) * (armHeight / 2));
  group.add(bucket);

  if (isL3) {
    // War Banner for Catapult
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.6),
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
  const wallH = 0.4 + (lv - 1) * 0.12;
  const wallColor = lv === 1 ? 0x8a7a5a : lv === 2 ? 0x9a8a6a : 0xaaaaaa;

  // 1. MAIN BASTION (Layered with a beveled base)
  const baseH = 0.1;
  const bastionBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.98, baseH, 0.98),
    mythic(wallColor, 0.1, 0.9)
  );
  bastionBase.position.y = baseH / 2;
  bastionBase.castShadow = true;
  group.add(bastionBase);

  const mainWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, wallH - baseH, 0.92),
    mythicToon(wallColor)
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
        mythicToon(wallColor)
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
      new THREE.BoxGeometry(0.95, 0.05, 0.95),
      mythic(0x555555, 0.8, 0.3)
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
