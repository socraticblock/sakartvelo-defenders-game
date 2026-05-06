export type EnemyVisualKind = 'procedural' | 'gltf';

export interface EnemyVisualConfig {
  kind: EnemyVisualKind;
  type: string;
  modelUrl?: string;
  animationsUrl?: string;
  targetHeight?: number;
  fallbackProceduralType?: string;
  staticOnly?: boolean;
  staticPose?: 'none' | 'era0SpearmanRelaxed';
  weaponProp?: 'spear' | 'shortSpear' | 'sword' | 'none';
  animationClips?: {
    idle?: string;
    walk?: string;
    run?: string;
    attack?: string;
    death?: string;
  };
}

export const ACTOR_REGISTRY: Record<string, EnemyVisualConfig> = {
  infantry: {
    kind: 'gltf',
    type: 'infantry',
    modelUrl: '/models/era0_spearman/spearman_run_only.glb?v=2',
    targetHeight: 1.15,
    fallbackProceduralType: 'infantry',
    staticOnly: false,
    staticPose: 'none',
    weaponProp: 'none',
    animationClips: {
      walk: 'Running',
    },
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
