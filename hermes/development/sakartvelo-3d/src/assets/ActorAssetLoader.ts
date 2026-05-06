import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinnedScene } from 'three/addons/utils/SkeletonUtils.js';

export interface ActorAssetTemplate {
  sourceScene: THREE.Object3D;
  url: string;
  animationsUrl?: string;
  targetHeight: number;
  animations: THREE.AnimationClip[];
}

export interface LoadActorAssetOptions {
  url: string;
  animationsUrl?: string;
  targetHeight: number;
  label: string;
}

const templates = new Map<string, ActorAssetTemplate>();
const loadersInFlight = new Map<string, Promise<ActorAssetTemplate | null>>();
const gltfLoader = new GLTFLoader();

export async function loadActorAsset(options: LoadActorAssetOptions): Promise<ActorAssetTemplate | null> {
  if (templates.has(options.url)) return templates.get(options.url)!;
  
  if (loadersInFlight.has(options.url)) {
    return loadersInFlight.get(options.url)!;
  }

  const promise = (async () => {
    try {
      const characterGltf = await gltfLoader.loadAsync(options.url);
      let animations: THREE.AnimationClip[] = [...(characterGltf.animations || [])];

      if (options.animationsUrl) {
        try {
          const animGltf = await gltfLoader.loadAsync(options.animationsUrl);
          animations = [...animations, ...(animGltf.animations || [])];
        } catch (e) {
          console.warn(`[ActorAssetLoader] animations failed to load for ${options.label} at ${options.animationsUrl}`, e);
        }
      }

      const sourceScene = characterGltf.scene;
      sourceScene.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(sourceScene);
      const height = box.max.y - box.min.y;
      if (height > 1e-6) {
        const scale = options.targetHeight / height;
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

      const template: ActorAssetTemplate = {
        sourceScene,
        url: options.url,
        animationsUrl: options.animationsUrl,
        targetHeight: options.targetHeight,
        animations,
      };

      templates.set(options.url, template);
      return template;
    } catch (error) {
      console.warn(`[ActorAssetLoader] failed to load ${options.label} at ${options.url}:`, error);
      return null;
    } finally {
      loadersInFlight.delete(options.url);
    }
  })();

  loadersInFlight.set(options.url, promise);
  return promise;
}

export function getActorAsset(url: string): ActorAssetTemplate | null {
  return templates.get(url) || null;
}

export function instantiateActorAsset(template: ActorAssetTemplate): THREE.Object3D {
  const cloned = cloneSkinnedScene(template.sourceScene);
  cloned.userData.preserveSharedResources = true;
  return cloned;
}
