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

  constructor(root: THREE.Object3D, config: EnemyVisualConfig, allClips: THREE.AnimationClip[]) {
    this.root = root;
    this.staticOnly = config.staticOnly === true;
    applyStaticPose(this.root, config.staticPose);

    if (this.staticOnly) {
      return;
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
    // Intentionally disabled until attack clips are curated.
  }

  isReadyToRemove(): boolean {
    return true;
  }

  dispose(): void {
    // Shared resources handled elsewhere.
  }
}

function findBone(root: THREE.Object3D, name: string): THREE.Bone | null {
  const obj = root.getObjectByName(name);
  return obj instanceof THREE.Bone ? obj : null;
}

function applyEra0SpearmanRelaxedPose(root: THREE.Object3D): void {
  const leftArm = findBone(root, 'LeftArm');
  const rightArm = findBone(root, 'RightArm');
  const leftForeArm = findBone(root, 'LeftForeArm');
  const rightForeArm = findBone(root, 'RightForeArm');
  const leftShoulder = findBone(root, 'LeftShoulder');
  const rightShoulder = findBone(root, 'RightShoulder');

  // Do not call SkinnedMesh.pose(). It previously made the model disappear.
  // These are additive offsets from the exported rest pose.
  // Goal: lower arms from T-pose into a relaxed readable stance.
  if (leftShoulder) {
    leftShoulder.rotation.z += 0.15;
  }

  if (rightShoulder) {
    rightShoulder.rotation.z -= 0.15;
  }

  if (leftArm) {
    leftArm.rotation.z += 1.15;
    leftArm.rotation.x += 0.08;
  }

  if (rightArm) {
    rightArm.rotation.z -= 1.15;
    rightArm.rotation.x += 0.08;
  }

  if (leftForeArm) {
    leftForeArm.rotation.z += 0.25;
    leftForeArm.rotation.x += 0.05;
  }

  if (rightForeArm) {
    rightForeArm.rotation.z -= 0.25;
    rightForeArm.rotation.x += 0.05;
  }

  if (!leftArm || !rightArm) {
    console.warn('[GltfEnemyView] Era0 spearman relaxed pose missing expected arm bones:', {
      leftArm: Boolean(leftArm),
      rightArm: Boolean(rightArm),
      leftForeArm: Boolean(leftForeArm),
      rightForeArm: Boolean(rightForeArm),
      leftShoulder: Boolean(leftShoulder),
      rightShoulder: Boolean(rightShoulder),
    });
  }

  root.updateMatrixWorld(true);
}

function applyStaticPose(root: THREE.Object3D, pose: string | undefined): void {
  if (pose === 'era0SpearmanRelaxed') {
    applyEra0SpearmanRelaxedPose(root);
  }
}
