/**
 * Loads Meshy-export Medea (character + separate animation GLB) and builds a template for cloning per level.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinnedScene } from 'three/addons/utils/SkeletonUtils.js';

const CHARACTER_URL = '/models/medea/character.glb';
const ANIMATIONS_URL = '/models/medea/animations.glb';

/** Target on-screen height in world units (~ old procedural Medea). */
const TARGET_HEIGHT = 1.65;

export interface MedeaClipSet {
  walk: THREE.AnimationClip | null;
  skill: THREE.AnimationClip | null;
  idle: THREE.AnimationClip | null;
}

export interface MedeaTemplate {
  /** Source scene for SkeletonUtils.clone (not added to world). */
  sourceScene: THREE.Object3D;
  clips: MedeaClipSet;
}

let cached: MedeaTemplate | null | undefined;
let loadInFlight: Promise<MedeaTemplate | null> | null = null;

function classifyClip(name: string): keyof MedeaClipSet | null {
  const n = name.toLowerCase();
  if (/walk|run|jog|locomotion|stride|forward/.test(n)) return 'walk';
  if (/idle|stand|breath|rest/.test(n) && !/skill/.test(n)) return 'idle';
  if (/skill|cast|spell|ability|attack|magic|chant|strike|slash|throw|fire|emote|combo/.test(n)) return 'skill';
  return null;
}

function pickClips(all: THREE.AnimationClip[]): MedeaClipSet {
  const buckets: MedeaClipSet = { walk: null, skill: null, idle: null };
  const unclassified: THREE.AnimationClip[] = [];

  for (const clip of all) {
    const kind = classifyClip(clip.name);
    if (kind && !buckets[kind]) buckets[kind] = clip;
    else if (!kind) unclassified.push(clip);
  }

  // If Meshy used generic names, assign by count heuristics
  if (!buckets.walk && unclassified.length >= 1) {
    buckets.walk = unclassified.find(c => /anim|mix|take|track/i.test(c.name)) ?? unclassified[0] ?? null;
  }
  if (!buckets.skill && unclassified.length >= 2) {
    const rest = unclassified.filter(c => c !== buckets.walk);
    buckets.skill = rest[0] ?? null;
  } else if (!buckets.skill && unclassified.length === 1 && !buckets.walk) {
    buckets.walk = unclassified[0];
  }

  if (all.length) {
    console.info(
      '[Medea GLB] clips:',
      all.map(c => c.name),
      '→ walk:',
      buckets.walk?.name,
      'skill:',
      buckets.skill?.name,
      'idle:',
      buckets.idle?.name,
    );
  }

  return buckets;
}

async function loadOnce(): Promise<MedeaTemplate | null> {
  const loader = new GLTFLoader();

  let charGltf: Awaited<ReturnType<typeof loader.loadAsync>>;
  let animGltf: Awaited<ReturnType<typeof loader.loadAsync>>;
  try {
    charGltf = await loader.loadAsync(CHARACTER_URL);
    animGltf = await loader.loadAsync(ANIMATIONS_URL);
  } catch (e) {
    console.warn('[Medea GLB] load failed:', e);
    return null;
  }

  const clips = [...charGltf.animations, ...animGltf.animations];
  const picked = pickClips(clips);

  const sourceScene = charGltf.scene;
  sourceScene.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(sourceScene);
  const h = box.max.y - box.min.y;
  if (h > 1e-6) {
    const s = TARGET_HEIGHT / h;
    sourceScene.scale.setScalar(s);
    sourceScene.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(sourceScene);
    sourceScene.position.y = -box2.min.y;
  }

  sourceScene.traverse((obj: THREE.Object3D) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return { sourceScene, clips: picked };
}

/** Loads once; returns null if files missing or invalid. */
export async function loadMedeaTemplate(): Promise<MedeaTemplate | null> {
  if (cached !== undefined) return cached;
  if (!loadInFlight) {
    loadInFlight = loadOnce().then((r) => {
      cached = r;
      loadInFlight = null;
      return r;
    });
  }
  return loadInFlight;
}

export function getMedeaTemplate(): MedeaTemplate | null {
  return cached ?? null;
}

export interface MedeaInstance {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  walkAction: THREE.AnimationAction | null;
  skillAction: THREE.AnimationAction | null;
  idleAction: THREE.AnimationAction | null;
  /** Orb / gem meshes for command-link tint (optional). */
  accentMeshes: THREE.Mesh[];
  /** Suggested Y for auto-attack projectile spawn. */
  projectileY: number;
}

export function instantiateMedea(template: MedeaTemplate): MedeaInstance {
  const root = cloneSkinnedScene(template.sourceScene);
  root.updateMatrixWorld(true);

  const mixer = new THREE.AnimationMixer(root);

  const walkAction = template.clips.walk ? mixer.clipAction(template.clips.walk) : null;
  const skillAction = template.clips.skill ? mixer.clipAction(template.clips.skill) : null;
  const idleAction = template.clips.idle ? mixer.clipAction(template.clips.idle) : null;

  if (walkAction) {
    walkAction.setLoop(THREE.LoopRepeat, Infinity);
    walkAction.enabled = true;
  }
  if (skillAction) {
    skillAction.setLoop(THREE.LoopOnce, 1);
    skillAction.clampWhenFinished = true;
    skillAction.enabled = true;
  }
  if (idleAction) {
    idleAction.setLoop(THREE.LoopRepeat, Infinity);
    idleAction.enabled = true;
  }

  const accentMeshes: THREE.Mesh[] = [];
  root.traverse((obj: THREE.Object3D) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const name = obj.name.toLowerCase();
    if (/orb|gem|glow|staff|crystal|lantern|emit/.test(name)) accentMeshes.push(obj);
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (
        m &&
        'emissive' in m &&
        (m as THREE.MeshStandardMaterial).emissive &&
        (m as THREE.MeshStandardMaterial).emissive.getHex() > 0
      ) {
        if (!accentMeshes.includes(obj)) accentMeshes.push(obj);
      }
    }
  });

  const bbox = new THREE.Box3().setFromObject(root);
  const projectileY = Math.min(2.2, Math.max(1.0, bbox.max.y * 0.85));

  return {
    root,
    mixer,
    walkAction,
    skillAction,
    idleAction,
    accentMeshes,
    projectileY,
  };
}
