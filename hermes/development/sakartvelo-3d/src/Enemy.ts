import * as THREE from 'three';
import { ENEMY_CONFIGS } from './types';
import { createEnemyModel } from './EnemyModels';
import { animateRig } from './EnemyAnimations';
import { type EnemyRig } from './EnemyBuilders';

export class Enemy {
  group: THREE.Group;
  rig: EnemyRig;
  healthBg: THREE.Mesh;
  healthFill: THREE.Mesh;
  shadow: THREE.Mesh;

  hp: number;
  maxHp: number;
  speed: number;
  /** Original speed before wall slow effect — stored so slow can be toggled cleanly */
  readonly baseSpeed: number;
  reward: number;
  type: string;
  livesCost: number;

  worldPath: THREE.Vector3[];
  totalPathLength = 0;
  segmentLengths: number[] = [];
  distanceTraveled = 0;

  alive = true;
  reachedEnd = false;
  isBlocked = false;
  private flashMat: THREE.MeshStandardMaterial[] = [];
  private flashTime = 0;

  constructor(type: string, pathPoints: THREE.Vector3[], hpMult: number, speedMult: number) {
    const cfg = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.infantry;
    this.type = type;
    this.hp = cfg.hp * hpMult;
    this.maxHp = this.hp;
    this.speed = cfg.speed * speedMult;
    this.baseSpeed = this.speed;
    this.reward = cfg.reward;
    this.livesCost = cfg.livesCost;
    this.worldPath = pathPoints;

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const len = pathPoints[i].distanceTo(pathPoints[i + 1]);
      this.segmentLengths.push(len);
      this.totalPathLength += len;
    }

    // Build procedural model
    this.rig = createEnemyModel(type);
    this.group = new THREE.Group();
    this.group.add(this.rig.root);

    // Scale to match gameplay size
    const s = cfg.scale / 0.35; // normalize around humanoid scale
    this.rig.root.scale.setScalar(s);

    // Shadow
    const shadowGeo = new THREE.CircleGeometry(0.35, 12);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.01;
    this.group.add(this.shadow);

    // Health bar (billboard)
    const hbW = 0.8;
    this.healthBg = new THREE.Mesh(
      new THREE.BoxGeometry(hbW, 0.06, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    this.healthBg.position.y = 1.3;
    this.group.add(this.healthBg);

    this.healthFill = new THREE.Mesh(
      new THREE.BoxGeometry(hbW - 0.02, 0.04, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x44dd44 })
    );
    this.healthFill.position.y = 1.3;
    this.group.add(this.healthFill);

    // Collect materials for flash effect
    this.rig.root.traverse(child => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as any;
        if (mat.emissive) this.flashMat.push(mat);
      }
    });

    // Position at path start
    if (pathPoints.length > 0) this.group.position.copy(pathPoints[0]);
  }

  update(dt: number, camera: THREE.Camera): void {
    if (!this.alive) return;

    // Move
    this.distanceTraveled += this.speed * dt;
    if (this.distanceTraveled >= this.totalPathLength) {
      this.alive = false;
      this.reachedEnd = true;
      return;
    }

    // Find position on path
    let rem = this.distanceTraveled;
    for (let i = 0; i < this.segmentLengths.length; i++) {
      if (rem <= this.segmentLengths[i]) {
        const t = rem / this.segmentLengths[i];
        this.group.position.lerpVectors(this.worldPath[i], this.worldPath[i + 1], t);
        // Face direction
        const dir = new THREE.Vector3().subVectors(this.worldPath[i + 1], this.worldPath[i]);
        if (dir.length() > 0.01) {
          this.rig.root.rotation.y = Math.atan2(dir.x, dir.z);
        }
        break;
      }
      rem -= this.segmentLengths[i];
    }

    // Animate rig (walk cycle)
    const time = performance.now() * 0.001;
    animateRig(this.rig, time, true, this.type === 'siege');

    // Vertical bob
    this.rig.root.position.y = Math.sin(time * this.rig.bobSpeed) * this.rig.bobAmp;

    // Billboard health bar
    this.healthBg.quaternion.copy(camera.quaternion);
    this.healthFill.quaternion.copy(camera.quaternion);

    // Flash effect
    if (this.flashTime > 0) {
      this.flashTime -= dt;
      if (this.flashTime <= 0) {
        for (const mat of this.flashMat) mat.emissive.setHex(0x000000);
      }
    }
  }

  takeDamage(amount: number): boolean {
    if (!this.alive) return false;
    this.hp -= amount;

    // White flash
    this.flashTime = 0.1;
    for (const mat of this.flashMat) mat.emissive.setHex(0x666666);

    const ratio = Math.max(0, this.hp / this.maxHp);
    this.healthFill.scale.x = Math.max(0.001, ratio);
    this.healthFill.position.x = -0.39 * (1 - ratio);

    if (ratio > 0.5) (this.healthFill.material as THREE.MeshBasicMaterial).color.setHex(0x44dd44);
    else if (ratio > 0.25) (this.healthFill.material as THREE.MeshBasicMaterial).color.setHex(0xdddd44);
    else (this.healthFill.material as THREE.MeshBasicMaterial).color.setHex(0xdd4444);

    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  getPos(): THREE.Vector3 {
    return this.group.position;
  }
}
