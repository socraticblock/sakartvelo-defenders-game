/**
 * Era0SpearmanGltf.ts
 * Loads the Meshy-export Era 0 spearman body for static enemy visuals.
 *
 * This intentionally loads only character.glb for now. The separate animations.glb
 * is large and will be wired in a later pass after the static model is verified.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinnedScene } from 'three/addons/utils/SkeletonUtils.js';
import type { EnemyRig } from './EnemyBuilders';

const CHARACTER_URL = '/models/era0_spearman/character.glb';

/** Target pre-normalization height. Enemy.ts still applies gameplay scale afterward. */
const TARGET_HEIGHT = 1.15;

interface Era0SpearmanTemplate {
  sourceScene: THREE.Object3D;
}

let cached: Era0SpearmanTemplate | null | undefined;
let loadInFlight: Promise<Era0SpearmanTemplate | null> | null = null;

async function loadOnce(): Promise<Era0SpearmanTemplate | null> {
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync(CHARACTER_URL);
    const sourceScene = gltf.scene;
    sourceScene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(sourceScene);
    const height = box.max.y - box.min.y;
    if (height > 1e-6) {
      const scale = TARGET_HEIGHT / height;
      sourceScene.scale.setScalar(scale);
      sourceScene.updateMatrixWorld(true);

      const normalizedBox = new THREE.Box3().setFromObject(sourceScene);
      sourceScene.position.y = -normalizedBox.min.y;
      sourceScene.updateMatrixWorld(true);
    }

    sourceScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    console.info('[Era0 Spearman GLB] static character loaded:', CHARACTER_URL);
    return { sourceScene };
  } catch (error) {
    console.warn('[Era0 Spearman GLB] load failed; procedural infantry fallback will be used:', error);
    return null;
  }
}

/** Preloads the static spearman template. Safe to call more than once. */
export async function loadEra0SpearmanTemplate(): Promise<Era0SpearmanTemplate | null> {
  if (cached !== undefined) return cached;
  if (!loadInFlight) {
    loadInFlight = loadOnce().then((template) => {
      cached = template;
      loadInFlight = null;
      return template;
    });
  }
  return loadInFlight;
}

export function getEra0SpearmanTemplate(): Era0SpearmanTemplate | null {
  return cached ?? null;
}

/**
 * Creates an EnemyRig wrapper around the cloned GLB.
 * The limb/head groups are placeholders so the existing procedural walk animator
 * can run without special-casing GLB enemies. Real animation wiring comes later.
 */
export function instantiateEra0SpearmanRig(): EnemyRig | null {
  const template = getEra0SpearmanTemplate();
  if (!template) return null;

  const root = new THREE.Group();
  root.userData.preserveSharedResources = true;

  const modelRoot = cloneSkinnedScene(template.sourceScene);
  root.add(modelRoot);

  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const head = new THREE.Group();

  // Invisible placeholders satisfy the existing EnemyRig animator.
  root.add(leftArm, rightArm, leftLeg, rightLeg, head);

  return {
    root,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    head,
    bobSpeed: 5,
    bobAmp: 0.012,
    walkSpeed: 8,
    walkAmp: 0,
  };
}
