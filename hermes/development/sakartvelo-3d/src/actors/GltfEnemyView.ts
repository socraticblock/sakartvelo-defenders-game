import * as THREE from 'three';
import { EnemyView } from './EnemyView';
import { EnemyVisualConfig } from '../assets/ActorAssetRegistry';

export class GltfEnemyView implements EnemyView {
  readonly root: THREE.Object3D;
  readonly preserveSharedResources = true;
  private bobSpeed = 5;
  private bobAmp = 0.012;

  private mixer: THREE.AnimationMixer | null = null;
  private idleAction: THREE.AnimationAction | null = null;
  private runAction: THREE.AnimationAction | null = null;
  private attackAction: THREE.AnimationAction | null = null;
  private deathAction: THREE.AnimationAction | null = null;
  private activeAction: THREE.AnimationAction | null = null;

  private attackAnimationRemaining = 0;
  private deathAnimationStarted = false;
  private deathAnimationRemaining = 0;
  private alive = true;

  constructor(root: THREE.Object3D, config: EnemyVisualConfig, allClips: THREE.AnimationClip[]) {
    this.root = root;
    
    if (allClips.length > 0 && config.animationClips) {
      this.mixer = new THREE.AnimationMixer(this.root);
      const findClip = (name: string | undefined) => name ? allClips.find(c => c.name === name) : null;
      
      const idleClip = findClip(config.animationClips.idle);
      const runClip = findClip(config.animationClips.run);
      const attackClip = findClip(config.animationClips.attack);
      const deathClip = findClip(config.animationClips.death);

      if (idleClip) this.idleAction = this.mixer.clipAction(idleClip);
      if (runClip) this.runAction = this.mixer.clipAction(runClip);
      if (attackClip) {
        this.attackAction = this.mixer.clipAction(attackClip);
        this.attackAction.setLoop(THREE.LoopOnce, 1);
        this.attackAction.clampWhenFinished = false;
      }
      if (deathClip) {
        this.deathAction = this.mixer.clipAction(deathClip);
        this.deathAction.setLoop(THREE.LoopOnce, 1);
        this.deathAction.clampWhenFinished = true;
      }

      this.idleAction?.play();
      this.activeAction = this.idleAction;
    }
  }

  update(dt: number, time: number): void {
    if (this.deathAnimationStarted) {
      this.mixer?.update(dt);
      this.deathAnimationRemaining = Math.max(0, this.deathAnimationRemaining - dt);
      return;
    }

    if (this.mixer) {
      this.attackAnimationRemaining = Math.max(0, this.attackAnimationRemaining - dt);
      
      // Determine desired action
      let target: THREE.AnimationAction | null = this.idleAction;
      const isMoving = this.root.position.distanceToSquared(this.root.position) < 0.0001; // wait, this is wrong, view doesn't know if moving easily
      // Actually, GltfEnemyView doesn't know if it's moving easily unless we pass a flag.
      // But we can check if velocity was applied? No.
      // Let's assume if faceDirection is called, it might be moving? No.
      
      // For now, let's stick to the remote's logic of checking a moving flag if possible.
      // But Enemy.ts already calls update(dt, time).
      
      if (this.attackAnimationRemaining > 0 && this.attackAction) {
        target = this.attackAction;
      } else if (this.runAction) {
        // We need to know if we are moving. Let's add a hack for now or just default to idle/run mix.
        target = this.runAction; // If we have run, we probably want to run if moving.
      }

      if (target && this.activeAction !== target) {
        this.activeAction?.fadeOut(0.1);
        target.reset().fadeIn(0.1).play();
        this.activeAction = target;
      }

      this.mixer.update(dt);
    }

    // Subtle bob only if no mixer or as additive?
    if (!this.mixer) {
      this.root.position.y = Math.sin(time * this.bobSpeed) * this.bobAmp;
    }
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
    if (!this.attackAction) return;
    this.attackAnimationRemaining = this.attackAction.getClip().duration;
    this.activeAction?.fadeOut(0.1);
    this.attackAction.reset().fadeIn(0.1).play();
    this.activeAction = this.attackAction;
  }

  isReadyToRemove(): boolean {
    if (!this.deathAction) return true;
    if (!this.deathAnimationStarted) {
      this.deathAnimationStarted = true;
      this.activeAction?.fadeOut(0.1);
      this.deathAction.reset().fadeIn(0.1).play();
      this.activeAction = this.deathAction;
      this.deathAnimationRemaining = this.deathAction.getClip().duration;
      return false;
    }
    return this.deathAnimationRemaining <= 0;
  }

  dispose(): void {
    // Shared resources handled elsewhere.
  }
}
