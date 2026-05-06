export type EnemyVisualKind = 'procedural' | 'gltf';

export interface EnemyVisualConfig {
  kind: EnemyVisualKind;
  type: string;
  modelUrl?: string;
  targetHeight?: number;
  fallbackProceduralType?: string;
  staticOnly?: boolean;
  weaponProp?: 'spear' | 'shortSpear' | 'sword' | 'none';
}

export const ACTOR_REGISTRY: Record<string, EnemyVisualConfig> = {
  infantry: {
    kind: 'gltf',
    type: 'infantry',
    modelUrl: '/models/era0_spearman/character.glb',
    targetHeight: 1.15,
    fallbackProceduralType: 'infantry',
    staticOnly: true,
    weaponProp: 'none',
  },
  cavalry: {
    kind: 'procedural',
    type: 'cavalry',
  },
  siege: {
    kind: 'procedural',
    type: 'siege',
  },
  flying: {
    kind: 'procedural',
    type: 'flying',
  },
  boss: {
    kind: 'procedural',
    type: 'boss',
  }
};
