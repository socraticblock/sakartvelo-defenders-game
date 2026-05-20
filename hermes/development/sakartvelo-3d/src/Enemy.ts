import * as THREE from 'three';
import { ENEMY_CONFIGS, type EnemyFormation } from './types';
import { gs } from './GameState';
import { EnemyView } from './actors/EnemyView';
import { createEnemyView } from './actors/EnemyFactory';
import { isFlyingEnemy } from './EnemyTraits';

export class Enemy {
  private static _tmpDir = new THREE.Vector3();
  private static _tmpNormal = new THREE.Vector3();
  private static _tmpBasePos = new THREE.Vector3();

  group: THREE.Group;
  view: EnemyView;
  healthBg: THREE.Mesh;
  healthFill: THREE.Mesh;
  shadow: THREE.Mesh;
  poisonRing: THREE.Mesh;
  slowRing: THREE.Mesh;

  hp: number;
  maxHp: number;
  speed: number;
  /** Original speed before wall slow effect — stored so slow can be toggled cleanly */
  readonly baseSpeed: number;
  reward: number;
  type: string;
  livesCost: number;
  readonly isFlying: boolean;

  worldPath: THREE.Vector3[];
  totalPathLength = 0;
  segmentLengths: number[] = [];
  distanceTraveled = 0;

  alive = true;
  reachedEnd = false;
  isBlocked = false;
  temporarySlowTimer = 0;
  temporarySlowAmount = 0;
  poisonVisualTimer = 0;
  private flashMat: THREE.MeshStandardMaterial[] = [];
  private flashTime = 0;
  private readonly visualLift: number;
  private readonly bobPhase: number;
  private readonly laneOffset: number;

  constructor(
    type: string,
    pathPoints: THREE.Vector3[],
    hpMult: number,
    speedMult: number,
    formation: EnemyFormation = 'loose',
    spawnIndex = 0,
  ) {
    const cfg = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.infantry;
    this.type = type;
    this.isFlying = isFlyingEnemy(type);
    this.visualLift = this.isFlying ? 0.75 : 0;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.laneOffset = this.computeLaneOffset(type, formation, spawnIndex);
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

    // Build visual model
    this.view = createEnemyView(type);
    this.group = new THREE.Group();
    this.group.add(this.view.root);

    if (this.view.preserveSharedResources) {
      this.group.userData.preserveSharedResources = true;
    }

    // Scale to match gameplay size
    const s = cfg.scale / 0.35; // normalize around humanoid scale
    this.view.root.scale.setScalar(s);

    // Shadow
    const shadowGeo = new THREE.CircleGeometry(0.35, 12);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: this.isFlying ? 0.11 : 0.2 });
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.01;
    if (this.isFlying) this.shadow.scale.setScalar(0.72);
    this.group.add(this.shadow);

    this.poisonRing = new THREE.Mesh(
      new THREE.RingGeometry(0.36, 0.44, 18),
      new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
    );
    this.poisonRing.rotation.x = -Math.PI / 2;
    this.poisonRing.position.y = 0.04;
    this.poisonRing.visible = false;
    this.group.add(this.poisonRing);

    this.slowRing = new THREE.Mesh(
      new THREE.RingGeometry(0.46, 0.52, 18),
      new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.38, side: THREE.DoubleSide }),
    );
    this.slowRing.rotation.x = -Math.PI / 2;
    this.slowRing.position.y = 0.055;
    this.slowRing.visible = false;
    this.group.add(this.slowRing);

    // Health bar (billboard)
    const hbW = 0.8;
    this.healthBg = new THREE.Mesh(
      new THREE.BoxGeometry(hbW, 0.06, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    this.healthBg.position.y = this.isFlying ? 2.05 : 1.3;
    this.group.add(this.healthBg);

    this.healthFill = new THREE.Mesh(
      new THREE.BoxGeometry(hbW - 0.02, 0.04, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x44dd44 })
    );
    this.healthFill.position.y = this.isFlying ? 2.05 : 1.3;
    this.group.add(this.healthFill);

    // Collect materials for flash effect
    this.view.collectFlashMaterials(this.flashMat);

    // Position at path start
    if (pathPoints.length > 0) this.group.position.copy(pathPoints[0]);
  }

  private computeLaneOffset(type: string, formation: EnemyFormation, spawnIndex: number): number {
    if (type === 'boss') return 0;

    const lanesByFormation: Record<EnemyFormation, number[]> = {
      line: [0],
      column: [0, -0.18, 0.18],
      loose: [0, -0.24, 0.24, -0.42, 0.42],
      wide: [0, -0.34, 0.34, -0.56, 0.56],
    };

    const lanes = lanesByFormation[formation] ?? lanesByFormation.loose;
    const base = lanes[Math.abs(spawnIndex) % lanes.length] ?? 0;
    const jitter = ((Math.random() - 0.5) * 0.1);
    const typeScale = type === 'siege' ? 0.55 : type === 'cavalry' ? 1.1 : this.isFlying ? 1.25 : 1;
    return (base + jitter) * typeScale;
  }

  update(dt: number, camera: THREE.Camera): void {
    if (!this.alive) {
      this.view.update(dt, gs.gameTime);
      return;
    }
    if (this.temporarySlowTimer > 0) {
      this.temporarySlowTimer = Math.max(0, this.temporarySlowTimer - dt);
      if (this.temporarySlowTimer === 0) this.temporarySlowAmount = 0;
    }
    this.poisonVisualTimer = Math.max(0, this.poisonVisualTimer - dt);

    // Move
    this.distanceTraveled += this.speed * dt;
    if (this.distanceTraveled >= this.totalPathLength) {
      this.alive = false;
      this.reachedEnd = true;
      return;
    }

    // Find position on path, with a visual lateral lane offset so waves read like formations instead of a train.
    let rem = this.distanceTraveled;
    for (let i = 0; i < this.segmentLengths.length; i++) {
      if (rem <= this.segmentLengths[i]) {
        const t = rem / this.segmentLengths[i];
        Enemy._tmpBasePos.lerpVectors(this.worldPath[i], this.worldPath[i + 1], t);

        const dir = Enemy._tmpDir.subVectors(this.worldPath[i + 1], this.worldPath[i]);
        if (dir.lengthSq() > 0.0001) {
          dir.normalize();
          Enemy._tmpNormal.set(-dir.z, 0, dir.x);
          this.group.position.copy(Enemy._tmpBasePos).addScaledVector(Enemy._tmpNormal, this.laneOffset);
          this.view.faceDirection(dir);
        } else {
          this.group.position.copy(Enemy._tmpBasePos);
        }
        break;
      }
      rem -= this.segmentLengths[i];
    }

    // Animate visual
    const time = gs.gameTime;
    this.view.root.position.y = this.visualLift + (this.isFlying ? Math.sin(time * 4.2 + this.bobPhase) * 0.08 : 0);
    this.view.update(dt, time);

    this.poisonRing.visible = this.poisonVisualTimer > 0;
    this.slowRing.visible = this.temporarySlowTimer > 0 || this.isBlocked;
    if (this.poisonRing.visible) this.poisonRing.rotation.z += dt * 1.8;
    if (this.slowRing.visible) this.slowRing.rotation.z -= dt * 1.2;

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

  isReadyToRemove(): boolean {
    return this.view.isReadyToRemove();
  }

  triggerAttackAnimation(): void {
    this.view.triggerAttackAnimation();
  }

  getPos(): THREE.Vector3 {
    return this.group.position;
  }

  applyTemporarySlow(amount: number, duration: number): void {
    this.temporarySlowAmount = Math.max(this.temporarySlowAmount, amount);
    this.temporarySlowTimer = Math.max(this.temporarySlowTimer, duration);
  }

  setPoisoned(duration: number): void {
    this.poisonVisualTimer = Math.max(this.poisonVisualTimer, duration);
  }
}