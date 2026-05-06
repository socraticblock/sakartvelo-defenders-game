import * as THREE from 'three';

export interface EnemyView {
  readonly root: THREE.Object3D;
  readonly preserveSharedResources: boolean;

  update(dt: number, time: number): void;
  faceDirection(dir: THREE.Vector3): void;
  collectFlashMaterials(target: THREE.MeshStandardMaterial[]): void;
  triggerAttackAnimation(): void;
  isReadyToRemove(): boolean;
  dispose(): void;
}
