import * as THREE from 'three';
import { EnemyView } from './EnemyView';

export class GltfEnemyView implements EnemyView {
  readonly root: THREE.Object3D;
  readonly preserveSharedResources = true;
  private bobSpeed = 5;
  private bobAmp = 0.012;

  constructor(root: THREE.Object3D) {
    this.root = root;
  }

  update(dt: number, time: number): void {
    // Subtle bob only, no mixer for now (static behavior)
    this.root.position.y = Math.sin(time * this.bobSpeed) * this.bobAmp;
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
    // Never dispose shared GLB geometry/materials here.
  }
}
