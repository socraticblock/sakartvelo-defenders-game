/**
 * Era0SpearmanGltf.ts
 * Loads the Meshy-export Era 0 spearman body and animations.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinnedScene } from 'three/addons/utils/SkeletonUtils.js';
import type { EnemyRig } from './EnemyBuilders';

const CHARACTER_URL = '/models/era0_spearman/character.glb';
const ANIMATIONS_URL = '/models/era0_spearman/animations.glb';

/** Target pre-normalization height. Enemy.ts still applies gameplay scale afterward. */
const TARGET_HEIGHT = 1.15;

interface Era0SpearmanTemplate {
  sourceScene: THREE.Object3D;
  clips: THREE.AnimationClip[];
  idleClip: THREE.AnimationClip | null;
  walkClip: THREE.AnimationClip | null;
}

let cached: Era0SpearmanTemplate | null | undefined;
let loadInFlight: Promise<Era0SpearmanTemplate | null> | null = null;

async function loadOnce(): Promise<Era0SpearmanTemplate | null> {
  const loader = new GLTFLoader();

  try {
    const [charGltf, animGltf] = await Promise.all([
      loader.loadAsync(CHARACTER_URL),
      loader.loadAsync(ANIMATIONS_URL).catch(err => {
        console.warn('[Era0 Spearman GLB] animations failed to load:', err);
        return { animations: [] as THREE.AnimationClip[] };
      })
    ]);

    const sourceScene = charGltf.scene;
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

    const clips = [...(charGltf.animations || []), ...(animGltf.animations || [])];
    
    const idleRegex = /idle|stand|breath|rest|base|pose/i;
    const walkRegex = /walk|run|jog|move|locomotion|forward/i;

    const idleClip = clips.find(c => idleRegex.test(c.name)) || null;
    const walkClip = clips.find(c => walkRegex.test(c.name)) || null;

    console.info('[Era0 Spearman GLB] loaded. clips:', clips.map(c => c.name), 'mapped idle:', idleClip?.name, 'mapped walk:', walkClip?.name);

    return { sourceScene, clips, idleClip, walkClip };
  } catch (error) {
    console.warn('[Era0 Spearman GLB] load failed; procedural infantry fallback will be used:', error);
    return null;
  }
}

/** Preloads the spearman template. Safe to call more than once. */
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
 * Creates an EnemyRig wrapper around the cloned GLB with animation mixer.
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

  // Invisible placeholders satisfy the existing EnemyRig animator if used as fallback.
  root.add(leftArm, rightArm, leftLeg, rightLeg, head);

  const rig: EnemyRig = {
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

  // Setup animations if clips are available
  const mixer = new THREE.AnimationMixer(modelRoot);
  rig.mixer = mixer;

  if (template.idleClip) {
    rig.idleAction = mixer.clipAction(template.idleClip);
    rig.idleAction.play();
  }

  if (template.walkClip) {
    rig.walkAction = mixer.clipAction(template.walkClip);
    // We don't play it immediately; Enemy.ts should toggle it.
    // However, the instructions said: "start idle or walk action safely"
    // and "always play walk animation while enemy is moving" (Step 9).
    // For now, let's play walk if it exists, since they are moving.
    if (rig.walkAction) {
        if (rig.idleAction) rig.idleAction.stop();
        rig.walkAction.play();
        rig.activeAction = rig.walkAction;
    } else if (rig.idleAction) {
        rig.activeAction = rig.idleAction;
    }
  }

  return rig;
}
