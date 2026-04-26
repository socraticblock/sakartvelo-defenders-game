/**
 * EnemyBuilders.ts
 * Geometry builders for each enemy archetype.
 * Extracted from EnemyModels.ts to keep it under 300 lines.
 */
import * as THREE from 'three';
import { toon, outlineGroup, addOutlineTo } from './CelShader';
import { mythic, mythicToon } from './MythicMaterials';
import { geoCache } from './GeometryCache';

export const P = {
  skin: 0xd2b08e,
  fur: 0x1b3a26,
  bone: 0x8b7455,
  gold: 0xd4a017,
  dark: 0x111c13,
  leather: 0x291f14,
  wood: 0x735938,
  iron: 0x2f2f2f,
  threat_green: 0x5a8a3a,
  threat_yellow: 0xb89a2a,
  threat_orange: 0xb86a2a,
  threat_red: 0xaa3333,
  threat_blue: 0x3a7a9a,
};

export function makePart(
  geo: THREE.BufferGeometry, color: number,
  pos: [number, number, number], rot?: [number, number, number],
  parent?: THREE.Object3D,
  metal = 0.1, rough = 0.8, emissive = 0x000000
): THREE.Mesh {
  // Use mythicToon for character parts for the hand-painted look
  const m = new THREE.Mesh(geo, mythicToon(color, emissive));
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}


export interface EnemyRig {
  root: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  head: THREE.Object3D;
  weapon?: THREE.Object3D;
  bobSpeed: number;
  bobAmp: number;
  walkSpeed: number;
  walkAmp: number;
}

export type EnemyArchetype = 'warrior' | 'cavalry' | 'wolf' | 'siege' | 'boss' | 'infantry';

export function createColchianRaider(): EnemyRig {
  const root = new THREE.Group();
  const s = 1;

  makePart(geoCache.getCylinder(0.18, 0.24, 0.42, 6), P.fur, [0, 0.6, 0], undefined, root);
  makePart(geoCache.getCylinder(0.24, 0.3, 0.22, 6), P.leather, [0, 0.33, 0], undefined, root);
  makePart(geoCache.getBox(0.34, 0.06, 0.26), P.gold, [0, 0.44, 0.02], undefined, root);
  makePart(geoCache.getBox(0.08, 0.5, 0.04), P.bone, [0, 0.55, 0.17], undefined, root);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.9, 0);
  root.add(headGroup);
  makePart(geoCache.getCylinder(0.12, 0.13, 0.2, 6), P.skin, [0, 0, 0], undefined, headGroup);
  makePart(geoCache.getBox(0.25, 0.09, 0.16), P.dark, [0, 0.1, -0.02], undefined, headGroup);
  makePart(geoCache.getBox(0.24, 0.28, 0.06), P.dark, [0, -0.1, -0.11], undefined, headGroup);
  for (const side of [-1, 1]) {
    makePart(geoCache.getBox(0.04, 0.035, 0.02), 0xffffff, [side * 0.055, 0.03, 0.11], undefined, headGroup);
    makePart(geoCache.getBox(0.02, 0.018, 0.02), P.dark, [side * 0.055, 0.03, 0.125], undefined, headGroup);
  }
  makePart(geoCache.getCylinder(0.13, 0.15, 0.08, 6), P.bone, [0, 0.13, 0], undefined, headGroup);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.22, 0.7, 0);
  root.add(leftArm);
  makePart(geoCache.getCylinder(0.05, 0.07, 0.32, 4), P.skin, [0, -0.16, 0], undefined, leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.22, 0.7, 0);
  root.add(rightArm);
  const rightArmMesh = makePart(geoCache.getCylinder(0.05, 0.07, 0.32, 4), P.skin, [0, -0.16, 0], undefined, rightArm);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.12, 0.22, 0);
  root.add(leftLeg);
  makePart(geoCache.getCylinder(0.07, 0.05, 0.28, 4), P.fur, [0, -0.14, 0], undefined, leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.12, 0.22, 0);
  root.add(rightLeg);
  makePart(geoCache.getCylinder(0.07, 0.05, 0.28, 4), P.fur, [0, -0.14, 0], undefined, rightLeg);

  const weapon = new THREE.Group();
  weapon.position.set(0, -0.14, 0.02);
  rightArmMesh.add(weapon);
  makePart(geoCache.getCylinder(0.018, 0.018, 0.42, 4), P.wood, [0, -0.2, 0], undefined, weapon);
  const axeHead = new THREE.Mesh(geoCache.getCylinder(0.11, 0.15, 0.04, 3), mythic(P.iron, 0.75, 0.3));
  axeHead.position.set(0.08, -0.34, 0);
  axeHead.rotation.z = Math.PI / 2;
  weapon.add(axeHead);

  const shield = makePart(
    geoCache.getCylinder(0.17, 0.2, 0.045, 8),
    P.wood,
    [-0.12, -0.16, 0.1],
    [Math.PI / 2, 0, 0],
    leftArm,
  );
  makePart(geoCache.getBox(0.22, 0.025, 0.025), P.gold, [0, 0, 0.035], undefined, shield);
  makePart(geoCache.getBox(0.025, 0.22, 0.025), P.gold, [0, 0, 0.038], undefined, shield);

  outlineGroup(root);
  return { root, leftArm, rightArm, leftLeg, rightLeg, head: headGroup, weapon, bobSpeed: 5, bobAmp: 0.02, walkSpeed: 8, walkAmp: 0.42 };
}

export function createColchianHorseman(): EnemyRig {
  const root = new THREE.Group();
  const horseColor = 0x3b2a1a;
  const riderColor = P.threat_orange;

  makePart(geoCache.getBox(0.32, 0.26, 0.76), horseColor, [0, 0.38, 0], undefined, root);
  makePart(geoCache.getBox(0.22, 0.2, 0.26), horseColor, [0, 0.48, 0.43], [0.28, 0, 0], root);
  makePart(geoCache.getBox(0.08, 0.18, 0.08), P.dark, [0, 0.58, 0.56], undefined, root);
  makePart(geoCache.getBox(0.08, 0.08, 0.28), horseColor, [0, 0.44, -0.52], [-0.35, 0, 0], root);
  makePart(geoCache.getBox(0.36, 0.06, 0.3), P.gold, [0, 0.55, -0.05], undefined, root);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.11, 0.25, 0.24);
  root.add(leftArm);
  makePart(geoCache.getBox(0.07, 0.34, 0.07), horseColor, [0, -0.17, 0], undefined, leftArm);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.11, 0.25, 0.24);
  root.add(rightArm);
  makePart(geoCache.getBox(0.07, 0.34, 0.07), horseColor, [0, -0.17, 0], undefined, rightArm);
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.11, 0.25, -0.24);
  root.add(leftLeg);
  makePart(geoCache.getBox(0.07, 0.34, 0.07), horseColor, [0, -0.17, 0], undefined, leftLeg);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.11, 0.25, -0.24);
  root.add(rightLeg);
  makePart(geoCache.getBox(0.07, 0.34, 0.07), horseColor, [0, -0.17, 0], undefined, rightLeg);

  makePart(geoCache.getCylinder(0.11, 0.15, 0.28, 6), riderColor, [0, 0.78, -0.05], undefined, root);
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.0, -0.04);
  root.add(headGroup);
  makePart(geoCache.getBox(0.14, 0.16, 0.14), P.skin, [0, 0, 0], undefined, headGroup);
  makePart(geoCache.getCylinder(0.1, 0.13, 0.08, 6), P.bone, [0, 0.1, 0], undefined, headGroup);

  const spear = new THREE.Group();
  spear.position.set(0.18, 0.86, 0.08);
  spear.rotation.x = -0.75;
  root.add(spear);
  makePart(geoCache.getCylinder(0.014, 0.014, 0.82, 4), P.wood, [0, -0.28, 0], undefined, spear);
  makePart(geoCache.getCone(0.045, 0.16, 4), P.iron, [0, -0.75, 0], undefined, spear);

  outlineGroup(root);
  return { root, leftArm, rightArm, leftLeg, rightLeg, head: headGroup, weapon: spear, bobSpeed: 7, bobAmp: 0.015, walkSpeed: 12, walkAmp: 0.5 };
}


export function createHumanoid(cfg: {
  bodyColor: number;
  skirtColor?: number;
  beltColor?: number;
  headColor?: number;
  helmetColor?: number;
  helmet?: boolean;
  weaponType?: 'axe' | 'spear' | 'sword';
  shieldColor?: number;
  scale?: number;
  pauldrons?: boolean;
}): EnemyRig {
  const s = cfg.scale || 1;
  const headColor = cfg.headColor || P.skin;

  const root = new THREE.Group();

  // 1. TORSO (Faceted & Tapered)
  makePart(geoCache.getCylinder(0.18 * s, 0.22 * s, 0.45 * s, 6), cfg.bodyColor, [0, 0.6 * s, 0], undefined, root);
  
  // Ornate Belt (Hexagonal)
  makePart(geoCache.getCylinder(0.22 * s, 0.22 * s, 0.08 * s, 6), cfg.beltColor || P.leather, [0, 0.42 * s, 0], undefined, root);

  // Pauldrons (Beveled Guards)
  if (cfg.pauldrons || cfg.helmet) {
    for (const side of [-1, 1]) {
      makePart(geoCache.getCylinder(0.12 * s, 0.08 * s, 0.15 * s, 5), cfg.helmetColor || P.iron, [side * 0.22 * s, 0.78 * s, 0], [0, 0, side * 1.8], root, 0.7, 0.4);
    }
  }

  if (cfg.skirtColor) {
    makePart(geoCache.getCylinder(0.2 * s, 0.3 * s, 0.22 * s, 6), cfg.skirtColor, [0, 0.32 * s, 0], undefined, root);
  }

  // 2. HEAD & HELMET (Faceted)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.88 * s, 0);
  root.add(headGroup);
  makePart(geoCache.getCylinder(0.12 * s, 0.12 * s, 0.22 * s, 6), headColor, [0, 0, 0], undefined, headGroup);

  for (const side of [-1, 1]) {
    const eye = makePart(geoCache.getBox(0.04 * s, 0.04 * s, 0.02 * s), 0xffffff, [side * 0.06 * s, 0.04 * s, 0.1 * s], undefined, headGroup);
    makePart(geoCache.getBox(0.02 * s, 0.02 * s, 0.02 * s), P.dark, [0, 0, 0.01 * s], undefined, eye);
  }

  if (cfg.helmet) {
    const hc = cfg.helmetColor || P.iron;
    // Mythic Crown/Helmet - High Metalness
    const h1 = new THREE.Mesh(geoCache.getCylinder(0.12 * s, 0.16 * s, 0.15 * s, 6), mythic(hc, 0.8, 0.3));
    h1.position.set(0, 0.12 * s, 0);
    headGroup.add(h1);

    const h2 = new THREE.Mesh(geoCache.getCylinder(0.04 * s, 0.02 * s, 0.12 * s, 4), mythic(hc, 0.8, 0.3));
    h2.position.set(0, -0.02 * s, 0.11 * s);
    h2.rotation.x = Math.PI/2;
    headGroup.add(h2);

    // Ornament - Gold
    const h3 = new THREE.Mesh(geoCache.getCylinder(0.01 * s, 0.01 * s, 0.1 * s, 4), mythic(P.gold, 0.9, 0.2, P.gold));
    h3.position.set(0, 0.2 * s, 0);
    headGroup.add(h3);
  }

  // 3. LIMBS (Tapered Faceted Prisms)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.22 * s, 0.7 * s, 0);
  root.add(leftArm);
  makePart(geoCache.getCylinder(0.05 * s, 0.07 * s, 0.32 * s, 4), headColor, [0, -0.16 * s, 0], undefined, leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.22 * s, 0.7 * s, 0);
  root.add(rightArm);
  const rightArmMesh = makePart(geoCache.getCylinder(0.05 * s, 0.07 * s, 0.32 * s, 4), headColor, [0, -0.16 * s, 0], undefined, rightArm);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.12 * s, 0.22 * s, 0);
  root.add(leftLeg);
  makePart(geoCache.getCylinder(0.07 * s, 0.05 * s, 0.28 * s, 4), cfg.bodyColor, [0, -0.14 * s, 0], undefined, leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.12 * s, 0.22 * s, 0);
  root.add(rightLeg);
  makePart(geoCache.getCylinder(0.07 * s, 0.05 * s, 0.28 * s, 4), cfg.bodyColor, [0, -0.14 * s, 0], undefined, rightLeg);

  // 4. WEAPONS (Sharper profiles)
  let weapon: THREE.Object3D | undefined;
  if (cfg.weaponType === 'axe') {
    const wGroup = new THREE.Group();
    wGroup.position.set(0, -0.15 * s, 0);
    rightArmMesh.add(wGroup);
    makePart(geoCache.getCylinder(0.02 * s, 0.02 * s, 0.4 * s, 4), P.wood, [0, -0.2 * s, 0], undefined, wGroup);
    // Beveled Axe blade - Metallic
    const blade = new THREE.Mesh(geoCache.getCylinder(0.1 * s, 0.14 * s, 0.04 * s, 3), mythic(P.iron, 0.8, 0.3));
    blade.position.set(0.08 * s, -0.32 * s, 0);
    blade.rotation.z = Math.PI / 2;
    wGroup.add(blade);
    weapon = wGroup;
  } else if (cfg.weaponType === 'spear') {
    const wGroup = new THREE.Group();
    wGroup.position.set(0, -0.15 * s, 0.05 * s);
    rightArmMesh.add(wGroup);
    makePart(geoCache.getCylinder(0.015 * s, 0.015 * s, 0.6 * s, 4), P.wood, [0, -0.3 * s, 0], undefined, wGroup);
    makePart(geoCache.getCone(0.05 * s, 0.15 * s, 4), P.iron, [0, -0.6 * s, 0], undefined, wGroup);
    weapon = wGroup;
  } else if (cfg.weaponType === 'sword') {
    const wGroup = new THREE.Group();
    wGroup.position.set(0, -0.15 * s, 0.05 * s);
    rightArmMesh.add(wGroup);
    makePart(geoCache.getBox(0.04 * s, 0.45 * s, 0.02 * s), P.iron, [0, -0.25 * s, 0], undefined, wGroup);
    makePart(geoCache.getBox(0.12 * s, 0.04 * s, 0.04 * s), P.gold, [0, -0.05 * s, 0], undefined, wGroup);
    weapon = wGroup;
  }

  if (cfg.shieldColor) {
    const shield = makePart(
      geoCache.getCylinder(0.18 * s, 0.2 * s, 0.04 * s, 8),
      cfg.shieldColor, [-0.12 * s, -0.15 * s, 0.1 * s],
      [Math.PI / 2, 0, 0], leftArm
    );
    makePart(geoCache.getSphere(0.05 * s, 6, 4), P.gold, [0, 0, 0.03 * s], undefined, shield);
  }

  outlineGroup(root);

  return {
    root, leftArm, rightArm, leftLeg, rightLeg, head: headGroup, weapon,
    bobSpeed: 5, bobAmp: 0.02, walkSpeed: 8, walkAmp: 0.4,
  };
}


export function createWolf(cfg: { furColor?: number; scale?: number }): EnemyRig {
  const s = cfg.scale || 1;
  const col = cfg.furColor || P.fur;
  const root = new THREE.Group();

  // 1. BODY (Beveled beasty)
  makePart(geoCache.getBox(0.22 * s, 0.22 * s, 0.65 * s), col, [0, 0.28 * s, 0], undefined, root);

  // 2. HEAD & MYTHIC MANE
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.35 * s, 0.35 * s);
  root.add(headGroup);
  
  // The Mane (neck fur)
  makePart(geoCache.getCylinder(0.15 * s, 0.18 * s, 0.2 * s, 6), col, [0, -0.05 * s, -0.1 * s], [Math.PI / 4, 0, 0], headGroup);
  makePart(geoCache.getBox(0.08 * s, 0.16 * s, 0.3 * s), P.threat_blue, [0, 0.08 * s, -0.12 * s], [0.4, 0, 0], headGroup);
  
  makePart(geoCache.getBox(0.18 * s, 0.18 * s, 0.22 * s), col, [0, 0, 0], undefined, headGroup);
  makePart(geoCache.getBox(0.1 * s, 0.08 * s, 0.15 * s), col, [0, -0.04 * s, 0.12 * s], undefined, headGroup);
  makePart(geoCache.getBox(0.08 * s, 0.04 * s, 0.08 * s), P.bone, [0, -0.08 * s, 0.23 * s], undefined, headGroup);
  
  for (const side of [-1, 1]) {
    makePart(geoCache.getBox(0.04 * s, 0.04 * s, 0.02 * s), 0xffff44, [side * 0.05 * s, 0.04 * s, 0.1 * s], undefined, headGroup);
  }
  for (const side of [-1, 1]) {
    makePart(geoCache.getBox(0.05 * s, 0.1 * s, 0.04 * s), col, [side * 0.08 * s, 0.12 * s, -0.05 * s], [0, 0, side * 0.2], headGroup);
  }

  // Tail
  makePart(geoCache.getBox(0.06 * s, 0.06 * s, 0.25 * s), col, [0, 0.35 * s, -0.42 * s], [0.4, 0, 0], root);
  for (const side of [-1, 1]) {
    makePart(geoCache.getBox(0.28 * s, 0.03 * s, 0.16 * s), P.threat_blue, [side * 0.2 * s, 0.38 * s, -0.02 * s], [0.2, 0, side * 0.45], root);
  }

  // 3. LEGS
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.1 * s, 0.18 * s, 0.2 * s);
  root.add(leftArm);
  makePart(geoCache.getBox(0.07 * s, 0.22 * s, 0.07 * s), col, [0, -0.11 * s, 0], undefined, leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.1 * s, 0.18 * s, 0.2 * s);
  root.add(rightArm);
  makePart(geoCache.getBox(0.07 * s, 0.22 * s, 0.07 * s), col, [0, -0.11 * s, 0], undefined, rightArm);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.1 * s, 0.18 * s, -0.2 * s);
  root.add(leftLeg);
  makePart(geoCache.getBox(0.07 * s, 0.22 * s, 0.07 * s), col, [0, -0.11 * s, 0], undefined, leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.1 * s, 0.18 * s, -0.2 * s);
  root.add(rightLeg);
  makePart(geoCache.getBox(0.07 * s, 0.22 * s, 0.07 * s), col, [0, -0.11 * s, 0], undefined, rightLeg);

  outlineGroup(root);

  return {
    root, leftArm, rightArm, leftLeg, rightLeg, head: headGroup,
    bobSpeed: 6, bobAmp: 0.015, walkSpeed: 12, walkAmp: 0.6,
  };
}


export function createSiegeRam(cfg: { scale?: number }): EnemyRig {
  const s = cfg.scale || 1;
  const root = new THREE.Group();
  
  // 1. THE CHASSIS (Beveled Heavy Plating)
  makePart(geoCache.getCylinder(0.25 * s, 0.3 * s, 0.25 * s, 6), P.wood, [0, 0.3 * s, 0], [0, 0, Math.PI / 2], root);
  makePart(geoCache.getCylinder(0.3 * s, 0.32 * s, 0.7 * s, 6), P.wood, [0, 0.3 * s, 0], [Math.PI / 2, 0, 0], root);
  
  // Roof (Layered)
  makePart(geoCache.getCylinder(0.35 * s, 0.25 * s, 0.6 * s, 4), P.leather, [0, 0.5 * s, 0], [Math.PI / 2, Math.PI / 4, 0], root);
  makePart(geoCache.getBox(0.55 * s, 0.08 * s, 0.72 * s), P.iron, [0, 0.62 * s, 0], undefined, root);

  // 2. THE RAM HEAD (Mythic Bone Carving)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.3 * s, 0.45 * s);
  root.add(headGroup);
  // Faceted Horns/Head
  makePart(geoCache.getCone(0.12 * s, 0.25 * s, 6), P.bone, [0, 0, 0.15 * s], [Math.PI / 2, 0, 0], headGroup);
  makePart(geoCache.getCylinder(0.12 * s, 0.12 * s, 0.1 * s, 6), P.iron, [0, 0, 0.05 * s], [Math.PI / 2, 0, 0], headGroup);
  makePart(geoCache.getBox(0.18 * s, 0.05 * s, 0.05 * s), P.gold, [0, 0.08 * s, 0.04 * s], undefined, headGroup);

  // 3. WHEELS (Heavy Iron Hubs)
  const wlGeo = geoCache.getCylinder(0.12 * s, 0.12 * s, 0.08 * s, 8);
  for (const side of [-1, 1]) {
    for (const z of [-0.25, 0.25]) {
      const wGroup = new THREE.Group();
      wGroup.position.set(side * 0.32 * s, 0.12 * s, z * s);
      root.add(wGroup);
      makePart(wlGeo, P.iron, [0, 0, 0], [0, 0, Math.PI / 2], wGroup);
      // Hubcap
      makePart(geoCache.getSphere(0.04 * s, 6, 4), P.gold, [side * 0.04 * s, 0, 0], undefined, wGroup);
    }
  }

  const banner = makePart(geoCache.getBox(0.04 * s, 0.36 * s, 0.02 * s), P.gold, [0.28 * s, 0.78 * s, -0.24 * s], undefined, root);
  makePart(geoCache.getBox(0.18 * s, 0.12 * s, 0.02 * s), P.threat_red, [0.1 * s, -0.08 * s, 0], undefined, banner);

  // Stubs for animation
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();

  outlineGroup(root);

  return {
    root, leftArm, rightArm, leftLeg, rightLeg, head: headGroup,
    bobSpeed: 2, bobAmp: 0.008, walkSpeed: 3, walkAmp: 0.1,
  };
}


export function createDevi(): EnemyRig {
  const rig = createHumanoid({
    bodyColor: P.threat_red,
    skirtColor: P.dark,
    beltColor: P.gold,
    headColor: P.skin,
    helmet: false,
    weaponType: 'axe',
    scale: 1.5,
  });

  for (const side of [-0.18, 0.18]) {
    const extraHead = new THREE.Group();
    extraHead.position.set(side * 1.5, 0.85 * 1.5, 0);
    rig.root.add(extraHead);
    const mh = makePart(geoCache.getBox(0.18, 0.2, 0.18), P.skin, [0, 0, 0], undefined, extraHead);
    addOutlineTo(mh, extraHead);
    for (const es of [-1, 1]) {
      makePart(geoCache.getBox(0.04, 0.04, 0.02), 0xff2222, [es * 0.05, 0.02, 0.09], undefined, extraHead);
    }
    for (const hs of [-1, 1]) {
      const rh = makePart(geoCache.getCone(0.03, 0.15, 4), P.bone, [hs * 0.08, 0.15, 0], [0, 0, hs * 0.3], extraHead);
      addOutlineTo(rh, extraHead);
    }
  }

  for (const hs of [-1, 1]) {
    const rh = makePart(geoCache.getCone(0.04, 0.2, 4), P.bone, [hs * 0.1, 0.15, 0], [0, 0, hs * 0.3], rig.head);
    addOutlineTo(rh, rig.head);
  }

  makePart(geoCache.getBox(0.72, 0.12, 0.38), P.gold, [0, 1.18, 0.02], undefined, rig.root);
  makePart(geoCache.getCylinder(0.34, 0.42, 0.18, 6), P.dark, [0, 0.48, 0], undefined, rig.root);
  const club = new THREE.Group();
  club.position.set(0, -0.2, 0.03);
  rig.weapon?.add(club);
  makePart(geoCache.getCylinder(0.05, 0.06, 0.58, 6), P.wood, [0, -0.22, 0], undefined, club);
  makePart(geoCache.getIcosahedron(0.16, 0), P.iron, [0, -0.58, 0], undefined, club);

  const glow = new THREE.Mesh(
    geoCache.getCylinder(0.8, 1.0, 1.2, 6),
    new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.08 })
  );
  glow.position.y = 0.6;
  rig.root.add(glow);

  rig.bobAmp = 0.03;
  rig.walkSpeed = 4;
  rig.walkAmp = 0.25;

  return rig;
}
