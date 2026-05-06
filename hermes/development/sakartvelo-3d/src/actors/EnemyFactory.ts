import { LevelData } from '../types';
import { ACTOR_REGISTRY } from '../assets/ActorAssetRegistry';
import { loadActorAsset, getActorAsset, instantiateActorAsset } from '../assets/ActorAssetLoader';
import { EnemyView } from './EnemyView';
import { GltfEnemyView } from './GltfEnemyView';
import { ProceduralEnemyView } from './ProceduralEnemyView';
import { createEnemyModel } from '../EnemyModels';

export async function preloadEnemyAssetsForLevel(level: LevelData): Promise<void> {
  const typesToLoad = new Set<string>();
  
  for (const wave of level.waves) {
    for (const group of wave.enemies) {
      typesToLoad.add(group.type);
    }
  }

  const promises: Promise<any>[] = [];
  
  for (const type of typesToLoad) {
    const config = ACTOR_REGISTRY[type] || ACTOR_REGISTRY['infantry'];
    if (config.kind === 'gltf' && config.modelUrl && config.targetHeight) {
      promises.push(
        loadActorAsset({
          url: config.modelUrl,
          animationsUrl: config.animationsUrl,
          targetHeight: config.targetHeight,
          label: config.type,
        })
      );
    }
  }

  await Promise.all(promises);
}

export function createEnemyView(type: string): EnemyView {
  const config = ACTOR_REGISTRY[type] || ACTOR_REGISTRY['infantry'];

  if (config.kind === 'gltf' && config.modelUrl) {
    const template = getActorAsset(config.modelUrl);
    if (template) {
      const root = instantiateActorAsset(template);
      return new GltfEnemyView(root, config, config.staticOnly ? [] : template.animations);
    }
  }

  // Fallback or Procedural
  const proceduralType = config.fallbackProceduralType || type;
  const rig = createEnemyModel(proceduralType);
  return new ProceduralEnemyView(rig, proceduralType === 'siege');
}
