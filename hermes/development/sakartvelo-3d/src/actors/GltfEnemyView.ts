import * as THREE from 'three';
import { EnemyView } from './EnemyView';
import { EnemyVisualConfig } from '../assets/ActorAssetRegistry';

export class GltfEnemyView implements EnemyView {
  readonly root: THREE.Object3D;
  readonly preserveSharedResources = true;
  private bobSpeed = 5;
  private bobAmp = 0.012;
  private readonly staticOnly: boolean;

  private mixer: THREE.AnimationMixer | null = null;
  private walkAction: THREE.AnimationAction | null = null;

  constructor(root: THREE.Object3D, config: EnemyVisualConfig, allClips: THREE.AnimationClip[]) {
    this.root = root;
    this.staticOnly = config.staticOnly === true;

    if (this.staticOnly) {
      return;
    }

    const walkClipName = config.animationClips?.walk;
    if (walkClipName) {
      const walkClip = allClips.find((clip) => clip.name === walkClipName) ?? null;

      if (!walkClip) {
        console.warn('[GltfEnemyView] Missing configured walk clip:', walkClipName);
        return;
      }

      this.mixer = new THREE.AnimationMixer(this.root);
      this.walkAction = this.mixer.clipAction(walkClip);
      this.walkAction.setLoop(THREE.LoopRepeat, Infinity);
      this.walkAction.enabled = true;
      this.walkAction.play();

      console.info('[GltfEnemyView] Playing walk clip:', walkClip.name);
    }
  }

  update(dt: number, time: number): void {
    if (this.staticOnly) {
      this.root.position.y = Math.sin(time * this.bobSpeed) * this.bobAmp;
      return;
    }

    if (this.mixer) {
      this.mixer.update(dt);
      return;
    }

    this.root.position.y = Math.sin(time * this.bobSpeed) * this.bobAmp;
  }

  faceDirection(dir: THREE.Vector3): void {
    if (dir.lengthSq() > 0.0001) {
      this.root.rotation.y = Math.atan2(dir.x, dir.z);
      // If we are facing a direction, we are likely moving.
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

  triggerAttackAnimation(): void {
    // Intentionally disabled for Era 0 Spearman until attack clips are curated.
  }

  isReadyToRemove(): boolean {
    return true;
  }

  dispose(): void {
    // Shared resources handled elsewhere.
  }
}
