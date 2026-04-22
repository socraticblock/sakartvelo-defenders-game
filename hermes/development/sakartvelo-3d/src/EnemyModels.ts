import * as THREE from 'three';
import { toon, outlineMat, addOutlineTo, outlineGroup } from './CelShader';

// ─── ERA 0 PALETTE (locked) ───
export const P = {
  skin:   0xd2b08e,
  fur:    0x1b3a26,
  bone:   0x8b7455,
  gold:   0xd4a017,
  dark:   0x111c13,
  leather:0x291f14,
  wood:   0x735938,
  iron:   0x2f2f2f,
  // Enemy threat colors
  threat_green:  0x5a8a3a,
  threat_yellow: 0xb89a2a,
  threat_orange: 0xb86a2a,
  threat_red:    0xaa3333,
  threat_blue:   0x3a7a9a,
};

// ─── PART BUILDER (cel-shaded) ───
export function makePart(
  geo: THREE.BufferGeometry, color: number,
  pos: [number,number,number], rot?: [number,number,number],
  parent?: THREE.Object3D
): THREE.Mesh {
  const m = new THREE.Mesh(geo, toon(color));
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

// ─── RIG TYPE ───
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

// ─── HUMANOID BUILDER ───
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
}): EnemyRig {
  const s = cfg.scale || 1;
  const headColor = cfg.headColor || P.skin;

  const root = new THREE.Group();

  // Torso
  makePart(new THREE.BoxGeometry(0.35*s, 0.35*s, 0.22*s), cfg.bodyColor, [0, 0.55*s, 0], undefined, root);

  // Belt
  const beltColor = cfg.beltColor || P.leather;
  makePart(new THREE.BoxGeometry(0.37*s, 0.06*s, 0.24*s), beltColor, [0, 0.4*s, 0], undefined, root);

  // Skirt / lower garment
  if (cfg.skirtColor) {
    makePart(new THREE.CylinderGeometry(0.2*s, 0.26*s, 0.18*s, 6), cfg.skirtColor, [0, 0.3*s, 0], undefined, root);
  }

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.82*s, 0);
  root.add(headGroup);
  makePart(new THREE.BoxGeometry(0.2*s, 0.22*s, 0.2*s), headColor, [0, 0, 0], undefined, headGroup);

  // Eyes (no mouth — locked art decision)
  for (const side of [-1, 1]) {
    const eye = makePart(new THREE.BoxGeometry(0.05*s, 0.05*s, 0.02*s), 0xffffff, [side*0.06*s, 0.02*s, 0.1*s], undefined, headGroup);
    makePart(new THREE.BoxGeometry(0.03*s, 0.03*s, 0.02*s), P.dark, [0, 0, 0.01*s], undefined, eye);
  }

  // Helmet
  if (cfg.helmet) {
    const hc = cfg.helmetColor || P.iron;
    makePart(new THREE.CylinderGeometry(0.13*s, 0.15*s, 0.12*s, 6), hc, [0, 0.12*s, 0], undefined, headGroup);
    // Nose guard
    makePart(new THREE.BoxGeometry(0.04*s, 0.1*s, 0.06*s), hc, [0, -0.02*s, 0.1*s], undefined, headGroup);
  }

  // Arms (pivot groups)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.22*s, 0.65*s, 0);
  root.add(leftArm);
  makePart(new THREE.BoxGeometry(0.1*s, 0.28*s, 0.1*s), headColor, [0, -0.14*s, 0], undefined, leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.22*s, 0.65*s, 0);
  root.add(rightArm);
  const rightArmMesh = makePart(new THREE.BoxGeometry(0.1*s, 0.28*s, 0.1*s), headColor, [0, -0.14*s, 0], undefined, rightArm);

  // Legs (pivot groups)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.1*s, 0.22*s, 0);
  root.add(leftLeg);
  makePart(new THREE.BoxGeometry(0.11*s, 0.24*s, 0.11*s), cfg.bodyColor, [0, -0.12*s, 0], undefined, leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.1*s, 0.22*s, 0);
  root.add(rightLeg);
  makePart(new THREE.BoxGeometry(0.11*s, 0.24*s, 0.11*s), cfg.bodyColor, [0, -0.12*s, 0], undefined, rightLeg);

  // Weapon
  let weapon: THREE.Object3D | undefined;
  if (cfg.weaponType === 'axe') {
    const wGroup = new THREE.Group();
    wGroup.position.set(0, -0.1*s, 0);
    rightArmMesh.add(wGroup);
    // Handle
    makePart(new THREE.BoxGeometry(0.04*s, 0.3*s, 0.04*s), P.wood, [0, -0.15*s, 0], undefined, wGroup);
    // Blade
    makePart(new THREE.BoxGeometry(0.14*s, 0.1*s, 0.03*s), P.bone, [0.05*s, -0.28*s, 0], undefined, wGroup);
    weapon = wGroup;
  } else if (cfg.weaponType === 'spear') {
    const wGroup = new THREE.Group();
    wGroup.position.set(0, -0.1*s, 0.05*s);
    rightArmMesh.add(wGroup);
    makePart(new THREE.BoxGeometry(0.03*s, 0.5*s, 0.03*s), P.wood, [0, -0.25*s, 0], undefined, wGroup);
    makePart(new THREE.ConeGeometry(0.04*s, 0.1*s, 4), P.bone, [0, -0.52*s, 0], undefined, wGroup);
    weapon = wGroup;
  } else if (cfg.weaponType === 'sword') {
    const wGroup = new THREE.Group();
    wGroup.position.set(0, -0.1*s, 0.05*s);
    rightArmMesh.add(wGroup);
    makePart(new THREE.BoxGeometry(0.03*s, 0.35*s, 0.02*s), P.iron, [0, -0.22*s, 0], undefined, wGroup);
    // Guard
    makePart(new THREE.BoxGeometry(0.1*s, 0.03*s, 0.03*s), P.bone, [0, -0.04*s, 0], undefined, wGroup);
    weapon = wGroup;
  }

  // Shield (on left arm)
  if (cfg.shieldColor) {
    const shield = makePart(
      new THREE.CylinderGeometry(0.14*s, 0.14*s, 0.03*s, 8),
      cfg.shieldColor,
      [-0.08*s, -0.12*s, 0.08*s],
      [Math.PI/2, 0, 0],
      leftArm
    );
    // Shield boss (center bump)
    makePart(new THREE.SphereGeometry(0.04*s, 6, 4), P.bone, [0, 0, 0.02*s], undefined, shield);
  }

  // Add outlines to static parts
  outlineGroup(root);

  return {
    root, leftArm, rightArm, leftLeg, rightLeg, head: headGroup, weapon,
    bobSpeed: 5, bobAmp: 0.02, walkSpeed: 8, walkAmp: 0.4,
  };
}

// ─── WOLF BUILDER (faces +Z) ───
export function createWolf(cfg: { furColor?: number; scale?: number }): EnemyRig {
  const s = cfg.scale || 1;
  const col = cfg.furColor || P.fur;
  const root = new THREE.Group();

  // Body (horizontal, length along Z = forward)
  makePart(new THREE.BoxGeometry(0.22*s, 0.2*s, 0.6*s), col, [0, 0.25*s, 0], undefined, root);

  // Neck + head (at +Z = forward)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.32*s, 0.32*s);
  root.add(headGroup);
  makePart(new THREE.BoxGeometry(0.16*s, 0.16*s, 0.2*s), col, [0, 0, 0], undefined, headGroup);
  // Snout
  makePart(new THREE.BoxGeometry(0.1*s, 0.08*s, 0.12*s), col, [0, -0.02*s, 0.1*s], undefined, headGroup);
  // Eyes (on +Z face)
  for (const side of [-1, 1]) {
    makePart(new THREE.BoxGeometry(0.04*s, 0.04*s, 0.02*s), 0xffff44, [side*0.05*s, 0.03*s, 0.09*s], undefined, headGroup);
  }
  // Ears
  for (const side of [-1, 1]) {
    makePart(new THREE.BoxGeometry(0.04*s, 0.08*s, 0.04*s), col, [side*0.06*s, 0.1*s, -0.04*s], undefined, headGroup);
  }

  // Tail (at -Z = backward, angled up)
  makePart(new THREE.BoxGeometry(0.05*s, 0.05*s, 0.2*s), col, [0, 0.3*s, -0.38*s], [0.3, 0, 0], root);

  // Front-left leg (pivot at hip)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.1*s, 0.18*s, 0.18*s);
  root.add(leftArm);
  makePart(new THREE.BoxGeometry(0.06*s, 0.2*s, 0.06*s), col, [0, -0.1*s, 0], undefined, leftArm);

  // Front-right leg
  const rightArm = new THREE.Group();
  rightArm.position.set(0.1*s, 0.18*s, 0.18*s);
  root.add(rightArm);
  makePart(new THREE.BoxGeometry(0.06*s, 0.2*s, 0.06*s), col, [0, -0.1*s, 0], undefined, rightArm);

  // Back-left leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.1*s, 0.18*s, -0.18*s);
  root.add(leftLeg);
  makePart(new THREE.BoxGeometry(0.06*s, 0.2*s, 0.06*s), col, [0, -0.1*s, 0], undefined, leftLeg);

  // Back-right leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.1*s, 0.18*s, -0.18*s);
  root.add(rightLeg);
  makePart(new THREE.BoxGeometry(0.06*s, 0.2*s, 0.06*s), col, [0, -0.1*s, 0], undefined, rightLeg);

  outlineGroup(root);

  return {
    root, leftArm, rightArm, leftLeg, rightLeg, head: headGroup,
    bobSpeed: 6, bobAmp: 0.015, walkSpeed: 12, walkAmp: 0.6,
  };
}

// ─── SIEGE RAM BUILDER (faces +Z) ───
export function createSiegeRam(cfg: { scale?: number }): EnemyRig {
  const s = cfg.scale || 1;
  const root = new THREE.Group();

  // Chassis (length along Z = forward)
  makePart(new THREE.BoxGeometry(0.5*s, 0.25*s, 0.8*s), P.wood, [0, 0.3*s, 0], undefined, root);
  // Roof
  makePart(new THREE.BoxGeometry(0.52*s, 0.06*s, 0.7*s), P.wood, [0, 0.5*s, 0], undefined, root);
  // Roof peak
  makePart(new THREE.BoxGeometry(0.3*s, 0.06*s, 0.65*s), P.leather, [0, 0.56*s, 0], undefined, root);

  // Bronze ram head (at +Z = forward)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.3*s, 0.45*s);
  root.add(headGroup);
  makePart(new THREE.ConeGeometry(0.1*s, 0.2*s, 6), P.bone, [0, 0, 0.1*s], [Math.PI/2, 0, 0], headGroup);
  // Ram face plate
  makePart(new THREE.BoxGeometry(0.22*s, 0.18*s, 0.04*s), P.bone, [0, 0, 0.05*s], undefined, headGroup);

  // Left wheels (pivot groups so they can spin)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.28*s, 0.1*s, 0.25*s);
  root.add(leftArm);
  const wlGeo = new THREE.CylinderGeometry(0.1*s, 0.1*s, 0.06*s, 8);
  makePart(wlGeo, P.iron, [0, 0, 0], [0, 0, Math.PI/2], leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.28*s, 0.1*s, 0.25*s);
  root.add(rightArm);
  makePart(wlGeo.clone(), P.iron, [0, 0, 0], [0, 0, Math.PI/2], rightArm);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.28*s, 0.1*s, -0.25*s);
  root.add(leftLeg);
  makePart(wlGeo.clone(), P.iron, [0, 0, 0], [0, 0, Math.PI/2], leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.28*s, 0.1*s, -0.25*s);
  root.add(rightLeg);
  makePart(wlGeo.clone(), P.iron, [0, 0, 0], [0, 0, Math.PI/2], rightLeg);

  outlineGroup(root);

  return {
    root, leftArm, rightArm, leftLeg, rightLeg, head: headGroup,
    bobSpeed: 2, bobAmp: 0.008, walkSpeed: 3, walkAmp: 0.1,
  };
}

// ─── DEVI (BOSS) BUILDER ───
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

  // Two extra heads
  for (const side of [-0.18, 0.18]) {
    const extraHead = new THREE.Group();
    extraHead.position.set(side * 1.5, 0.85 * 1.5, 0);
    rig.root.add(extraHead);
    const mh = makePart(new THREE.BoxGeometry(0.18, 0.2, 0.18), P.skin, [0, 0, 0], undefined, extraHead);
    addOutlineTo(mh, extraHead);
    // Eyes
    for (const es of [-1, 1]) {
      makePart(new THREE.BoxGeometry(0.04, 0.04, 0.02), 0xff2222, [es*0.05, 0.02, 0.09], undefined, extraHead);
    }
    // Horns
    for (const hs of [-1, 1]) {
      const rh = makePart(new THREE.ConeGeometry(0.03, 0.15, 4), P.bone, [hs*0.08, 0.15, 0], [0, 0, hs*0.3], extraHead);
      addOutlineTo(rh, extraHead);
    }
  }

  // Horns on main head
  for (const hs of [-1, 1]) {
    const rh = makePart(new THREE.ConeGeometry(0.04, 0.2, 4), P.bone, [hs*0.1, 0.15, 0], [0, 0, hs*0.3], rig.head);
    addOutlineTo(rh, rig.head);
  }

  // Glow aura
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.08 })
  );
  glow.position.y = 0.5;
  rig.root.add(glow);

  rig.bobAmp = 0.03;
  rig.walkSpeed = 4;
  rig.walkAmp = 0.25;

  return rig;
}

// ─── ANIMATION ───
export function animateRig(rig: EnemyRig, time: number, moving: boolean, isWheeled = false) {
  if (!moving) {
    rig.leftArm.rotation.x = Math.sin(time * 2) * 0.05;
    rig.rightArm.rotation.x = Math.sin(time * 2 + 1) * 0.05;
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    return;
  }

  if (isWheeled) {
    // Wheels spin on their local Z axis (roll forward)
    const spin = time * rig.walkSpeed * 2;
    rig.leftArm.rotation.z = spin;
    rig.rightArm.rotation.z = spin;
    rig.leftLeg.rotation.z = spin;
    rig.rightLeg.rotation.z = spin;
    rig.leftArm.rotation.x = 0;
    rig.rightArm.rotation.x = 0;
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
  } else {
    const ws = rig.walkSpeed;
    const wa = rig.walkAmp;
    // Arms swing opposite to legs
    rig.leftArm.rotation.x = Math.sin(time * ws) * wa;
    rig.rightArm.rotation.x = Math.sin(time * ws + Math.PI) * wa;
    // Legs counter-swing
    rig.leftLeg.rotation.x = Math.sin(time * ws + Math.PI) * wa;
    rig.rightLeg.rotation.x = Math.sin(time * ws) * wa;
  }

  // Head slight turn
  rig.head.rotation.y = Math.sin(time * (rig.walkSpeed * 0.5)) * 0.08;
}

// ─── FACTORY ───
export type EnemyArchetype = 'warrior' | 'cavalry' | 'wolf' | 'siege' | 'boss' | 'infantry';

export function createEnemyModel(type: string): EnemyRig {
  switch (type) {
    case 'infantry':
      return createHumanoid({
        bodyColor: P.fur, skirtColor: P.leather, beltColor: P.leather,
        headColor: P.skin, weaponType: 'axe', shieldColor: P.wood,
      });
    case 'cavalry':
      return createHumanoid({
        bodyColor: P.threat_orange, skirtColor: P.wood, beltColor: P.gold,
        headColor: P.skin, helmet: true, helmetColor: P.bone,
        weaponType: 'spear', scale: 1.1,
      });
    case 'siege':
      return createSiegeRam({});
    case 'flying':
      return createWolf({ furColor: P.threat_blue, scale: 0.8 });
    case 'boss':
      return createDevi();
    default:
      return createHumanoid({
        bodyColor: P.threat_green, skirtColor: P.fur, beltColor: P.leather,
        headColor: P.skin, weaponType: 'sword',
      });
  }
}
