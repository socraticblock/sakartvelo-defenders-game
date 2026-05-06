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

/** Manual overrides for animation clip selection if the scoring logic fails. */
const FORCE_WALK_CLIP_NAME = '';
const FORCE_IDLE_CLIP_NAME = '';

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

function scoreWalkClip(clip: THREE.AnimationClip): number {
  const name = clip.name.toLowerCase();
  let score = 0;

  if (/\bwalk\b/.test(name)) score += 100;
  if (/\brun\b/.test(name)) score += 90;
  if (/jog|locomotion|stride|forward|move/.test(name)) score += 60;

  // Penalize wrong action clips
  if (/attack|punch|kick|push|hit|stumble|death|die|fall|jump|gesture|turn|spin|dance|angry|idle|stand|pose/.test(name)) {
    score -= 200;
  }

  // Normal locomotion clips are usually looping and not ultra-short.
  if (clip.duration >= 0.5 && clip.duration <= 3.0) score += 10;
  if (clip.duration < 0.35) score -= 50;

  return score;
}

function scoreIdleClip(clip: THREE.AnimationClip): number {
  const name = clip.name.toLowerCase();
  let score = 0;

  if (/idle/.test(name)) score += 100;
  if (/stand|breath|rest|base|pose/.test(name)) score += 60;

  if (/attack|punch|kick|push|hit|stumble|death|die|fall|jump|walk|run|jog|move|locomotion|forward|dance|spin/.test(name)) {
    score -= 200;
  }

  return score;
}

function pickBestClip(
  clips: THREE.AnimationClip[],
  scorer: (clip: THREE.AnimationClip) => number,
): THREE.AnimationClip | null {
  let best: THREE.AnimationClip | null = null;
  let bestScore = 0;

  for (const clip of clips) {
    const score = scorer(clip);
    if (score > bestScore) {
      best = clip;
      bestScore = score;
    }
  }

  return best;
}

function findClipByForcedName(clips: THREE.AnimationClip[], forcedName: string): THREE.AnimationClip | null {
  if (!forcedName.trim()) return null;
  const needle = forcedName.trim().toLowerCase();
  return clips.find(c => c.name.toLowerCase() === needle) ?? null;
}

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
    
    const idleClip = findClipByForcedName(clips, FORCE_IDLE_CLIP_NAME) ?? pickBestClip(clips, scoreIdleClip);
    const walkClip = findClipByForcedName(clips, FORCE_WALK_CLIP_NAME) ?? pickBestClip(clips, scoreWalkClip);

    console.info(
      '[Era0 Spearman GLB] loaded. clips detailed:',
      clips.map((c, i) => ({
        index: i,
        name: c.name,
        duration: Number(c.duration.toFixed(2)),
        walkScore: scoreWalkClip(c),
        idleScore: scoreIdleClip(c),
      })),
      'mapped idle:',
      idleClip?.name,
      'mapped walk:',
      walkClip?.name,
    );

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
    // instruction 9: always play walk animation while enemy is moving
    if (rig.walkAction) {
        if (rig.idleAction) rig.idleAction.stop();
        rig.walkAction.play();
        rig.activeAction = rig.walkAction;
    } else if (rig.idleAction) {
        rig.activeAction = rig.idleAction;
    }
  } else if (rig.idleAction) {
      // Step 10: If walkClip is null, use idle clip if available
      rig.activeAction = rig.idleAction;
  }

  return rig;
}
