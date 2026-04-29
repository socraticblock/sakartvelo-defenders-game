import * as THREE from 'three';
import { Enemy } from './Enemy';
import { magicParticles } from './MagicalParticles';

// ─── SHARED GEOMETRIES & MATERIALS (allocated once) ───
const arrowGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4);
const arrowMat = new THREE.MeshBasicMaterial({ color: 0x8b6914 });
const arrowCritMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
const arrowCritGlowGeo = new THREE.SphereGeometry(0.06, 6, 6);
const arrowCritGlowMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.4 });
const boulderGeo = new THREE.SphereGeometry(0.08, 6, 6);
const boulderMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
const boulderGlowGeo = new THREE.SphereGeometry(0.15, 6, 6);
const boulderGlowMat = new THREE.MeshBasicMaterial({ color: 0xff6633, transparent: true, opacity: 0.25 });
const heroMagicGeo = new THREE.IcosahedronGeometry(0.09, 1);
const heroMagicMat = new THREE.MeshBasicMaterial({ color: 0x55ffaa });
const heroMagicGlowGeo = new THREE.SphereGeometry(0.18, 8, 8);
const heroMagicGlowMat = new THREE.MeshBasicMaterial({ color: 0x66ff99, transparent: true, opacity: 0.32 });

// Reusable vectors (zero allocations in update loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();

export class Projectile {
  mesh: THREE.Mesh;
  target: Enemy;
  damage: number;
  speed: number;
  alive = true;
  lifetime = 4;
  splashRadius: number;
  isCrit: boolean;
  commandLinked: boolean;

  private startPos: THREE.Vector3;
  private progress = 0;
  private totalDist: number;
  private arcHeight: number;
  towerType: string;

  constructor(
    origin: THREE.Vector3, target: Enemy, damage: number, speed: number,
    towerType: string, isCrit: boolean = false, splashRadius: number = 0, commandLinked = false
  ) {
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.isCrit = isCrit;
    this.splashRadius = splashRadius;
    this.commandLinked = commandLinked;
    this.towerType = towerType;

    this.startPos = _v1.set(origin.x, origin.y, origin.z);
    this.totalDist = origin.distanceTo(target.getPos());
    this.arcHeight = towerType === 'catapult' ? 1.5 : 0.3;

    if (towerType === 'archer') {
      this.mesh = new THREE.Mesh(arrowGeo, isCrit ? arrowCritMat : arrowMat);
      if (isCrit) {
        const glow = new THREE.Mesh(arrowCritGlowGeo, arrowCritGlowMat);
        this.mesh.add(glow);
      }
    } else if (towerType === 'heroMagic') {
      this.mesh = new THREE.Mesh(heroMagicGeo, heroMagicMat);
      this.mesh.add(new THREE.Mesh(heroMagicGlowGeo, heroMagicGlowMat));
    } else {
      this.mesh = new THREE.Mesh(boulderGeo, boulderMat);
      const glow = new THREE.Mesh(boulderGlowGeo, boulderGlowMat);
      this.mesh.add(glow);
    }

    this.mesh.position.copy(origin);
  }

  /** Re-init for pool reuse — avoids constructor + geometry alloc */
  reset(
    origin: THREE.Vector3, target: Enemy, damage: number, speed: number,
    towerType: string, isCrit: boolean, splashRadius: number, commandLinked = false
  ) {
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.isCrit = isCrit;
    this.splashRadius = splashRadius;
    this.commandLinked = commandLinked;
    this.towerType = towerType;
    this.alive = true;
    this.lifetime = 4;
    this.progress = 0;

    this.startPos.copy(origin);
    this.totalDist = origin.distanceTo(target.getPos());
    this.arcHeight = towerType === 'catapult' ? 1.5 : 0.3;

    // Rebuild mesh for type swap (archer vs catapult)
    while (this.mesh.children.length > 0) {
      const child = this.mesh.children[0] as THREE.Mesh;
      this.mesh.remove(child);
      child.geometry?.dispose();
      const mat = child.material;
      if (mat) {
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat.dispose();
      }
    }
    if (towerType === 'archer') {
      this.mesh.geometry = arrowGeo;
      this.mesh.material = isCrit ? arrowCritMat : arrowMat;
      if (isCrit) this.mesh.add(new THREE.Mesh(arrowCritGlowGeo, arrowCritGlowMat));
    } else if (towerType === 'heroMagic') {
      this.mesh.geometry = heroMagicGeo;
      this.mesh.material = heroMagicMat;
      this.mesh.add(new THREE.Mesh(heroMagicGlowGeo, heroMagicGlowMat));
    } else {
      this.mesh.geometry = boulderGeo;
      this.mesh.material = boulderMat;
      this.mesh.add(new THREE.Mesh(boulderGlowGeo, boulderGlowMat));
    }

    this.mesh.position.copy(origin);
    this.mesh.visible = true;
  }

  update(dt: number): boolean {
    if (!this.alive) return false;
    this.lifetime -= dt;
    if (this.lifetime <= 0) { this.alive = false; return false; }

    if (!this.target.alive) { this.alive = false; return false; }

    const targetPos = _v2.copy(this.target.getPos());
    targetPos.y += 0.3;

    const currentDist = this.startPos.distanceTo(targetPos);
    this.totalDist = Math.max(this.totalDist, currentDist);
    this.progress += this.speed * dt;

    const t = Math.min(this.progress / this.totalDist, 1);

    this.mesh.position.lerpVectors(this.startPos, targetPos, t);
    this.mesh.position.y += Math.sin(t * Math.PI) * this.arcHeight;

    // Face direction of travel
    _v3.subVectors(targetPos, this.startPos);
    if (_v3.lengthSq() > 0.000001) {
      _v3.normalize().multiplyScalar(0.5);
      _v3.add(this.mesh.position);
      _v3.y = this.mesh.position.y;
      this.mesh.lookAt(_v3);
    }

    // God-Tier Trails
    if (this.towerType === 'archer') {
      magicParticles?.spawn(this.mesh.position.clone(), new THREE.Vector3(0, 0, 0), this.isCrit ? 0xffcc44 : 0x8b6914, 0.04, 0.2);
    } else if (this.towerType === 'heroMagic') {
      magicParticles?.spawn(this.mesh.position.clone(), new THREE.Vector3(0, 0.06, 0), 0x55ffaa, 0.055, 0.28);
    } else {
      magicParticles?.spawn(this.mesh.position.clone(), new THREE.Vector3(0, 0.1, 0), 0xff6633, 0.08, 0.4);
    }

    // Hit detection
    if (t >= 0.95 || this.mesh.position.distanceTo(targetPos) < 0.25) {
      this.target.takeDamage(this.damage);
      this.alive = false;
      return false;
    }

    return true;
  }
}

// ─── PROJECTILE POOL ───
export class ProjectilePool {
  private pool: Projectile[] = [];
  private scene: THREE.Scene;
  /** Cached alive list — rebuilt on acquire/release, iterated in game loop */
  private _alive: Projectile[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  acquire(
    origin: THREE.Vector3, target: Enemy, damage: number, speed: number,
    towerType: string, isCrit: boolean, splashRadius: number, commandLinked = false
  ): Projectile {
    // Find dead projectile to reuse
    for (const p of this.pool) {
      if (!p.alive) {
        p.reset(origin, target, damage, speed, towerType, isCrit, splashRadius, commandLinked);
        this.scene.add(p.mesh);
        return p;
      }
    }
    // Pool empty — create new
    const p = new Projectile(origin, target, damage, speed, towerType, isCrit, splashRadius, commandLinked);
    this.pool.push(p);
    this.scene.add(p.mesh);
    return p;
  }

  release(proj: Projectile) {
    proj.alive = false;
    proj.mesh.visible = false;
    this.scene.remove(proj.mesh);
  }

  /** Get all living projectiles for iteration — no allocation */
  get alive(): Projectile[] {
    // Fast path: reuse cached array, clear and refill
    this._alive.length = 0;
    for (const p of this.pool) {
      if (p.alive) this._alive.push(p);
    }
    return this._alive;
  }

  /** Clean up pool — call on level reset */
  dispose() {
    for (const p of this.pool) {
      this.scene.remove(p.mesh);
    }
    this.pool.length = 0;
    this._alive.length = 0;
  }
}
