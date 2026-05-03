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
  idle: THREE.AnimationClip | null;
  skill: THREE.AnimationClip | null;
  castPoison: THREE.AnimationClip | null;
  castFire: THREE.AnimationClip | null;
  castChant: THREE.AnimationClip | null;
  death: THREE.AnimationClip | null;
}

export interface MedeaTemplate {
  sourceScene: THREE.Object3D;
  clips: MedeaClipSet;
}

let cached: MedeaTemplate | null | undefined;
let loadInFlight: Promise<MedeaTemplate | null> | null = null;

function pickClips(all: THREE.AnimationClip[]): MedeaClipSet {
  const buckets: MedeaClipSet = {
    walk: null, idle: null, skill: null,
    castPoison: null, castFire: null, castChant: null, death: null
  };

  const SPELL_KEYWORDS = ['cast', 'magic', 'spell', 'ability', 'attack', 'skill', 'strike', 'poison', 'fire', 'chant', 'soell'];

  // 1. Priority 1: Exact matches (Case-sensitive from GLB)
  for (const clip of all) {
    const n = clip.name;
    const nl = n.toLowerCase();
    const isSpell = SPELL_KEYWORDS.some(k => nl.includes(k));
    
    // Locomotion (Blacklist-safe)
    if (!isSpell) {
      if (n === 'Running') buckets.walk = clip;
      else if (n === 'Walking' && !buckets.walk) buckets.walk = clip;
      else if (n === 'idle' || n === 'stand') buckets.idle = clip;
    }

    // Specific Spells (Exact names from your newest file)
    if (n === 'mage_soell_cast_2') buckets.castPoison = clip;
    else if (n === 'mage_soell_cast_4') buckets.castFire = clip;
    else if (n === 'mage_soell_cast_6') buckets.castChant = clip;
    else if (n === 'Charged_Spell_Cast') buckets.skill = clip;
    else if (n === 'Dead') buckets.death = clip;
  }

  // 2. Priority 2: Heuristics for missing slots (With Blacklist)
  for (const clip of all) {
    const n = clip.name.toLowerCase();
    const isSpell = SPELL_KEYWORDS.some(k => n.includes(k));

    if (!buckets.walk && !isSpell && /run|walk|jog/i.test(n)) {
      buckets.walk = clip;
    } else if (!buckets.idle && !isSpell && /idle|stand|breath/i.test(n)) {
      buckets.idle = clip;
    }
  }

  // 3. Final Fallbacks
  if (!buckets.walk) buckets.walk = all.find(c => /run/i.test(c.name)) || all.find(c => /walk/i.test(c.name)) || null;
  if (!buckets.idle) buckets.idle = all.find(c => /idle/i.test(c.name)) || null;
  if (!buckets.skill) buckets.skill = all.find(c => /attack|strike|cast/i.test(c.name)) || null;

  console.info('[Medea GLB] Audited Mapping:', {
    walk: buckets.walk?.name,
    idle: buckets.idle?.name,
    bolt: buckets.skill?.name,
    poison: buckets.castPoison?.name,
    fire: buckets.castFire?.name,
    chant: buckets.castChant?.name,
    death: buckets.death?.name
  });

  return buckets;
}

async function loadOnce(): Promise<MedeaTemplate | null> {
  const loader = new GLTFLoader();
  let charGltf, animGltf;
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

  sourceScene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return { sourceScene, clips: picked };
}

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
  idleAction: THREE.AnimationAction | null;
  skillAction: THREE.AnimationAction | null;
  poisonAction: THREE.AnimationAction | null;
  fireAction: THREE.AnimationAction | null;
  chantAction: THREE.AnimationAction | null;
  deathAction: THREE.AnimationAction | null;
  projectileY: number;
}

export function instantiateMedea(template: MedeaTemplate): MedeaInstance {
  const root = cloneSkinnedScene(template.sourceScene);
  root.updateMatrixWorld(true);
  const mixer = new THREE.AnimationMixer(root);

  const walkAction = template.clips.walk ? mixer.clipAction(template.clips.walk) : null;
  const idleAction = template.clips.idle ? mixer.clipAction(template.clips.idle) : null;
  const skillAction = template.clips.skill ? mixer.clipAction(template.clips.skill) : null;
  const poisonAction = template.clips.castPoison ? mixer.clipAction(template.clips.castPoison) : null;
  const fireAction = template.clips.castFire ? mixer.clipAction(template.clips.castFire) : null;
  const chantAction = template.clips.castChant ? mixer.clipAction(template.clips.castChant) : null;
  const deathAction = template.clips.death ? mixer.clipAction(template.clips.death) : null;

  [walkAction, idleAction].forEach(a => { if (a) { a.setLoop(THREE.LoopRepeat, Infinity); a.enabled = true; } });
  [skillAction, poisonAction, fireAction, chantAction, deathAction].forEach(a => { if (a) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.enabled = true; } });

  const bbox = new THREE.Box3().setFromObject(root);
  const projectileY = Math.min(2.2, Math.max(1.0, bbox.max.y * 0.85));

  return { root, mixer, walkAction, idleAction, skillAction, poisonAction, fireAction, chantAction, deathAction, projectileY };
}
