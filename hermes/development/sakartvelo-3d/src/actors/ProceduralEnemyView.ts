import * as THREE from 'three';
import { EnemyView } from './EnemyView';
import { type EnemyRig } from '../EnemyBuilders';
import { animateRig } from '../EnemyAnimations';

export class ProceduralEnemyView implements EnemyView {
  readonly root: THREE.Object3D;
  readonly preserveSharedResources = false;

  constructor(private rig: EnemyRig, private isSiege: boolean = false) {
    this.root = rig.root;
  }

  update(dt: number, time: number): void {
    animateRig(this.rig, time, true, this.isSiege);
    this.root.position.y = Math.sin(time * this.rig.bobSpeed) * this.rig.bobAmp;
  }

  faceDirection(dir: THREE.Vector3): void {
    if (dir.lengthSq() > 0.0001) {
      this.root.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }

  collectFlashMaterials(target: THREE.MeshStandardMaterial[]): void {
    this.root.traverse(child => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as any;
        if (mat && mat.emissive !== undefined) {
          target.push(mat);
        }
      }
    });
  }

  dispose(): void {
    // Disposal handled by GameLoop / GameState generic cleanup since preserveSharedResources is false.
  }
}
