/**
 * Era0SpearmanGltf.ts
 * Loads the Meshy-export Era 0 spearman body and exact animation clips.
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
  clips: {
    idle: THREE.AnimationClip | null;
    run: THREE.AnimationClip | null;
    attack: THREE.AnimationClip | null;
    death: THREE.AnimationClip | null;
  };
}

let cached: Era0SpearmanTemplate | null | undefined;
let loadInFlight: Promise<Era0SpearmanTemplate | null> | null = null;

async function loadOnce(): Promise<Era0SpearmanTemplate | null> {
  const loader = new GLTFLoader();

  try {
    const characterGltf = await loader.loadAsync(CHARACTER_URL);
    const animationGltf = await loader.loadAsync(ANIMATIONS_URL).catch((error) => {
      console.warn('[Era0 Spearman GLB] animations failed to load; spearman will remain static:', error);
      return { animations: [] as THREE.AnimationClip[] };
    });

    const sourceScene = characterGltf.scene;
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

    const allClips = [...(characterGltf.animations || []), ...(animationGltf.animations || [])];
    const findClip = (name: string) => allClips.find((clip) => clip.name === name) ?? null;
    const clips = {
      idle: findClip('Armature|clip0|baselayer'),
      run: findClip('Running'),
      attack: findClip('Spartan_Kick'),
      death: findClip('Dead'),
    };

    console.info('[Era0 Spearman GLB] loaded:', {
      character: CHARACTER_URL,
      animations: ANIMATIONS_URL,
      clips: allClips.map((clip) => clip.name),
      mapped: {
        idle: clips.idle?.name,
        run: clips.run?.name,
        attack: clips.attack?.name,
        death: clips.death?.name,
      },
    });

    return { sourceScene, clips };
  } catch (error) {
    console.warn('[Era0 Spearman GLB] load failed; procedural infantry fallback will be used:', error);
    return null;
  }
}

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

export function instantiateEra0SpearmanRig(): EnemyRig | null {
  const template = getEra0SpearmanTemplate();
  if (!template) return null;

  const root = new THREE.Group();
  root.userData.preserveSharedResources = true;
  root.userData.isStaticGltfInfantry = true;

  const modelRoot = cloneSkinnedScene(template.sourceScene);
  modelRoot.userData.isStaticGltfInfantryModel = true;
  root.add(modelRoot);

  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const head = new THREE.Group();

  // Invisible placeholders satisfy the existing EnemyRig shape.
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

  if (template.clips.run || template.clips.attack || template.clips.death || template.clips.idle) {
    const mixer = new THREE.AnimationMixer(modelRoot);
    rig.mixer = mixer;

    rig.idleAction = template.clips.idle ? mixer.clipAction(template.clips.idle) : null;
    rig.runAction = template.clips.run ? mixer.clipAction(template.clips.run) : null;
    rig.walkAction = rig.runAction;
    rig.attackAction = template.clips.attack ? mixer.clipAction(template.clips.attack) : null;
    rig.deathAction = template.clips.death ? mixer.clipAction(template.clips.death) : null;

    rig.idleAction?.setLoop(THREE.LoopRepeat, Infinity);
    rig.runAction?.setLoop(THREE.LoopRepeat, Infinity);
    rig.attackAction?.setLoop(THREE.LoopRepeat, Infinity);

    if (rig.deathAction) {
      rig.deathAction.setLoop(THREE.LoopOnce, 1);
      rig.deathAction.clampWhenFinished = true;
    }
  }

  return rig;
}
