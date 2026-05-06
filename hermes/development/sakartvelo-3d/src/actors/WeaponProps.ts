import * as THREE from 'three';
import { mythic } from '../MythicMaterials';
import { P } from '../EnemyBuilders';

const geoCache = {
  shaft: new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4),
  shortShaft: new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4),
  spearHead: new THREE.ConeGeometry(0.05, 0.15, 4),
  swordBlade: new THREE.BoxGeometry(0.04, 0.45, 0.02),
  swordGuard: new THREE.BoxGeometry(0.12, 0.04, 0.04),
};

const matCache = {
  wood: new THREE.MeshToonMaterial({ color: P.wood }),
  iron: mythic(P.iron, 0.8, 0.3),
  gold: mythic(P.gold, 0.9, 0.2, P.gold),
};

export function createSpearProp(): THREE.Group {
  const group = new THREE.Group();
  
  const shaft = new THREE.Mesh(geoCache.shaft, matCache.wood);
  shaft.position.set(0, -0.3, 0);
  shaft.castShadow = true;
  group.add(shaft);

  const head = new THREE.Mesh(geoCache.spearHead, matCache.iron);
  head.position.set(0, -0.6, 0);
  head.castShadow = true;
  group.add(head);

  return group;
}

export function createShortSpearProp(): THREE.Group {
  const group = new THREE.Group();
  
  const shaft = new THREE.Mesh(geoCache.shortShaft, matCache.wood);
  shaft.position.set(0, -0.2, 0);
  shaft.castShadow = true;
  group.add(shaft);

  const head = new THREE.Mesh(geoCache.spearHead, matCache.iron);
  head.position.set(0, -0.4, 0);
  head.castShadow = true;
  group.add(head);

  return group;
}

export function createSwordProp(): THREE.Group {
  const group = new THREE.Group();
  
  const blade = new THREE.Mesh(geoCache.swordBlade, matCache.iron);
  blade.position.set(0, -0.25, 0);
  blade.castShadow = true;
  group.add(blade);

  const guard = new THREE.Mesh(geoCache.swordGuard, matCache.gold);
  guard.position.set(0, -0.05, 0);
  guard.castShadow = true;
  group.add(guard);

  return group;
}
