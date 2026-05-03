import * as THREE from 'three';
import { Enemy } from './Enemy';

export class FriendlyInfantry {
  group: THREE.Group;
  hp = 90;
  maxHp = 90;
  alive = true;
  reachedEnemySide = false;
  distanceFromHome = 0;
  speed = 1.9;
  attackDamage = 10;
  attackRange = 0.75;
  attackCooldown = 0;

  private readonly totalPathLength: number;
  private readonly segmentLengths: number[] = [];
  private readonly worldPath: THREE.Vector3[];

  constructor(worldPath: THREE.Vector3[]) {
    this.worldPath = worldPath.slice();
    this.group = new THREE.Group();
    this.totalPathLength = this._computeLengths();

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 0.42, 6),
      new THREE.MeshLambertMaterial({ color: 0x4b7d2b }),
    );
    body.position.y = 0.28;
    this.group.add(body);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshLambertMaterial({ color: 0xd2b08e }),
    );
    head.position.y = 0.56;
    this.group.add(head);

    const spear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.48, 4),
      new THREE.MeshLambertMaterial({ color: 0x735938 }),
    );
    spear.position.set(0.15, 0.32, 0);
    spear.rotation.z = 0.2;
    this.group.add(spear);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 10),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    this.group.add(shadow);

    const spawnPos = this._getPositionFromHomeDistance(0);
    this.group.position.copy(spawnPos);
  }

  update(dt: number, enemies: Enemy[], wallAheadDistance: number | null): void {
    if (!this.alive) return;

    let blockedByWall = false;
    if (wallAheadDistance !== null) {
      const wallStopDist = Math.max(0, wallAheadDistance - 0.45);
      if (this.distanceFromHome + this.speed * dt >= wallStopDist) {
        this.distanceFromHome = wallStopDist;
        blockedByWall = true;
      }
    }

    const targetEnemy = this._findClosestEnemy(enemies);
    const canAttack = targetEnemy && this.group.position.distanceTo(targetEnemy.getPos()) <= this.attackRange;
    this.attackCooldown -= dt;

    if (canAttack) {
      if (this.attackCooldown <= 0) {
        targetEnemy.takeDamage(this.attackDamage);
        this.attackCooldown = 0.65;
      }
    } else if (!blockedByWall) {
      this.distanceFromHome += this.speed * dt;
    }

    if (this.distanceFromHome >= this.totalPathLength) {
      this.reachedEnemySide = true;
      this.alive = false;
      return;
    }

    const nextPos = this._getPositionFromHomeDistance(this.distanceFromHome);
    const lookAhead = this._getPositionFromHomeDistance(Math.min(this.totalPathLength, this.distanceFromHome + 0.2));
    this.group.position.copy(nextPos);
    const dir = new THREE.Vector3().subVectors(lookAhead, nextPos);
    if (dir.lengthSq() > 0.0001) this.group.rotation.y = Math.atan2(dir.x, dir.z);
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.hp <= 0) this.alive = false;
  }

  private _findClosestEnemy(enemies: Enemy[]): Enemy | null {
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = this.group.position.distanceToSquared(e.getPos());
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  private _computeLengths(): number {
    let total = 0;
    for (let i = 0; i < this.worldPath.length - 1; i++) {
      const len = this.worldPath[i].distanceTo(this.worldPath[i + 1]);
      this.segmentLengths.push(len);
      total += len;
    }
    return total;
  }

  private _getPositionFromHomeDistance(distanceFromHome: number): THREE.Vector3 {
    const fromStartDistance = Math.max(0, this.totalPathLength - distanceFromHome);
    let rem = fromStartDistance;
    for (let i = 0; i < this.segmentLengths.length; i++) {
      const seg = this.segmentLengths[i];
      if (rem <= seg) {
        const t = rem / seg;
        return new THREE.Vector3().lerpVectors(this.worldPath[i], this.worldPath[i + 1], t);
      }
      rem -= seg;
    }
    return this.worldPath[this.worldPath.length - 1]?.clone() ?? new THREE.Vector3();
  }
}
