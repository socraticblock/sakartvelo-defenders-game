/**
 * Tower.ts
 * Tower entity — attack logic, targeting, wall HP, boost system, upgrade/sell.
 * Mesh building extracted to TowerMeshes.ts.
 */
import * as THREE from 'three';
import { TOWER_CONFIGS, TOWER_LEVEL_MULTS } from './TowerConfigs';
import { Enemy } from './Enemy';
import { toon, outlineGroup } from './CelShader';
import {
  buildArcherMesh,
  buildCatapultMesh,
  buildWallMesh,
} from './TowerMeshes';

const _origColorMap = new Map<THREE.Mesh, number>();

export interface ProjectileSpawn {
  origin: THREE.Vector3; target: Enemy; damage: number;
  speed: number; towerType: string; isCrit: boolean; splashRadius: number;
  commandLinked?: boolean;
}

export class Tower {
  group: THREE.Group;
  type: string;
  gx: number;
  gy: number;
  config = TOWER_CONFIGS.archer;
  level = 1;

  private effectiveDamage: number;
  private effectiveRange: number;
  private effectiveSpeed: number;
  private effectiveSplash: number;
  private cooldown = 0;
  private target: Enemy | null = null;
  rangeRing: THREE.Mesh;

  private dmgBoost = 1.0;
  private rangeBoost = 1.0;
  private speedBoost = 1.0;
  private boostTimer = 0;

  private wallHp = 0;
  private wallMaxHp = 0;
  private wallBaseMaxHp = 0;
  private bastionActive = false;
  private hpBg: THREE.Mesh | null = null;
  private hpFill: THREE.Mesh | null = null;
  private synergyRing: THREE.Mesh | null = null;

  constructor(type: string, gx: number, gy: number, isOnPath = false) {
    this.type = type;
    this.gx = gx;
    this.gy = gy;
    this.config = TOWER_CONFIGS[type];
    this.group = new THREE.Group();
    this.group.position.set(gx + 0.5, 0.06, gy + 0.5);
    this.group.userData = { isTower: true, tower: this };
    this.buildMesh();
    this.rangeRing = this.createRangeRing();
    this.group.add(this.rangeRing);
    this.effectiveDamage = this.config.damage;
    this.effectiveRange = this.config.range;
    this.effectiveSpeed = this.config.attackSpeed;
    this.effectiveSplash = 0;
    if (type === 'wall') {
      const wc = TOWER_LEVEL_MULTS.wall;
      this.wallHp = wc.hp[0];
      this.wallMaxHp = this.wallHp;
      this.wallBaseMaxHp = this.wallHp;
    }
  }

  get isOnPath(): boolean { return this.type === 'wall'; }

  get upgradeCost(): number | null {
    if (this.level >= 3) return null;
    return this.config.upgradeCosts[this.level - 1];
  }

  get sellValue(): number {
    let total = this.config.cost;
    for (let i = 0; i < this.level - 1; i++) total += this.config.upgradeCosts[i];
    return Math.floor(total * 0.5);
  }

  upgrade(): boolean {
    if (this.level >= 3) return false;
    this.level++;
    this.applyLevelStats();
    this.rebuildMesh();
    this.group.remove(this.rangeRing);
    this.rangeRing = this.createRangeRing();
    this.group.add(this.rangeRing);
    return true;
  }

  private applyLevelStats() {
    if (this.type === 'archer') {
      const m = TOWER_LEVEL_MULTS.archer;
      const idx = this.level - 1;
      this.effectiveDamage = this.config.damage * m.damage[idx];
      this.effectiveRange = this.config.range * m.range[idx];
      this.effectiveSpeed = this.config.attackSpeed * m.speed[idx];
    } else if (this.type === 'catapult') {
      const m = TOWER_LEVEL_MULTS.catapult;
      const idx = this.level - 1;
      this.effectiveDamage = this.config.damage * m.damage[idx];
      this.effectiveRange = this.config.range * m.range[idx];
      this.effectiveSpeed = this.config.attackSpeed * m.speed[idx];
      this.effectiveSplash = m.splash[idx];
    } else if (this.type === 'wall') {
      const m = TOWER_LEVEL_MULTS.wall;
      this.wallBaseMaxHp = m.hp[this.level - 1];
      this.wallMaxHp = this.bastionActive ? this.wallBaseMaxHp * 1.25 : this.wallBaseMaxHp;
      this.wallHp = this.wallMaxHp;
    }
  }

  private rebuildMesh() {
    const toRemove: THREE.Object3D[] = [];
    this.group.children.forEach(c => { if (c !== this.rangeRing) toRemove.push(c); });
    toRemove.forEach(c => this.group.remove(c));
    this.buildMesh();
  }

  private buildMesh() {
    const lv = this.level;
    const scaleMult = 1 + (lv - 1) * 0.15;

    if (this.type === 'archer') {
      buildArcherMesh(this.group, lv, scaleMult, this.config.color);
    } else if (this.type === 'catapult') {
      buildCatapultMesh(this.group, lv, scaleMult, this.config.color);
    } else if (this.type === 'wall') {
      if (!this.hpBg) this.hpBg = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.01), new THREE.MeshBasicMaterial({ color: 0x333333 }));
      if (!this.hpFill) this.hpFill = new THREE.Mesh(new THREE.BoxGeometry(1, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: 0x44dd44 }));
      this.group.add(this.hpBg);
      this.group.add(this.hpFill);
      buildWallMesh(this.group, lv, this.hpBg, this.hpFill);
    }

    outlineGroup(this.group);
  }

  // ─── Wall damage ──────────────────────────────────────────────────────────────

  takeWallDamage(amount: number): boolean {
    if (this.type !== 'wall' || this.wallHp <= 0) return false;
    this.wallHp -= amount;
    this.updateWallHpBar();
    this.group.traverse(c => {
      if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshLambertMaterial) {
        if (!_origColorMap.has(c)) _origColorMap.set(c, c.material.emissive.getHex());
        c.material.emissive.setHex(0x440000);
        setTimeout(() => c.material.emissive.setHex(_origColorMap.get(c) ?? 0x000000), 100);
      }
    });
    return this.wallHp <= 0;
  }

  private updateWallHpBar() {
    if (!this.hpFill) return;
    const ratio = Math.max(0, this.wallHp / this.wallMaxHp);
    this.hpFill.scale.x = Math.max(0.001, ratio);
    this.hpFill.position.x = -0.44 * (1 - ratio);
    const mat = this.hpFill.material as THREE.MeshBasicMaterial;
    mat.color.setHex(ratio > 0.5 ? 0x44dd44 : ratio > 0.25 ? 0xdddd44 : 0xdd4444);
  }

  getWallSlow(): number {
    if (this.type !== 'wall') return 0;
    return TOWER_LEVEL_MULTS.wall.slow[this.level - 1];
  }

  getWallReflect(): number {
    if (this.type !== 'wall') return 0;
    return TOWER_LEVEL_MULTS.wall.reflect[this.level - 1];
  }

  getWallHp(): number { return this.wallHp; }

  setBastionActive(active: boolean): void {
    if (this.type !== 'wall' || this.bastionActive === active) return;
    const previousMax = Math.max(1, this.wallMaxHp);
    const ratio = this.wallHp / previousMax;
    this.bastionActive = active;
    this.wallMaxHp = this.wallBaseMaxHp * (active ? 1.25 : 1);
    this.wallHp = Math.min(this.wallMaxHp, Math.max(1, this.wallMaxHp * ratio));
    this.updateWallHpBar();
    this.setSynergyActive(active);
  }

  billboardHp(camera: THREE.Camera) {
    if (this.hpBg) this.hpBg.quaternion.copy(camera.quaternion);
    if (this.hpFill) this.hpFill.quaternion.copy(camera.quaternion);
  }

  // ─── Combat ─────────────────────────────────────────────────────────────────

  private createRangeRing(): THREE.Mesh {
    const r = this.getEffectiveRange();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r - 0.05, r, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    ring.visible = false;
    // Avoid selecting towers through their large range-circle overlay.
    ring.userData.ignoreTowerPick = true;
    return ring;
  }

  private getEffectiveRange(): number {
    return this.effectiveRange * this.rangeBoost;
  }

  update(dt: number, enemies: Enemy[], allTowers: Tower[] = [], commandLinkTower: Tower | null = null): ProjectileSpawn | null {
    if (this.config.damage === 0) return null;

    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      if (this.boostTimer <= 0) {
        this.dmgBoost = 1.0;
        this.rangeBoost = 1.0;
        this.speedBoost = 1.0;
        this.setSynergyActive(false);
      }
    }

    this.cooldown -= dt;
    this.target = null;
    let bestDist = -1;
    const myPos = this.group.position;
    const effectiveRange = this.getEffectiveRange();

    for (const e of enemies) {
      if (!e.alive || e.reachedEnd) continue;
      const d = myPos.distanceTo(e.getPos());
      if (d <= effectiveRange && e.distanceTraveled > bestDist) {
        bestDist = e.distanceTraveled;
        this.target = e;
      }
    }

    if (this.target && this.cooldown <= 0) {
      const wallSynergy = this._hasNearbyWall(allTowers, 2.0);
      const blockedTarget = this.target.isBlocked;
      const archerWallBonus = this.type === 'archer' && wallSynergy && blockedTarget;
      const catapultWallBonus = this.type === 'catapult' && wallSynergy && blockedTarget;
      const commandLinked = commandLinkTower === this;
      const effectiveSpeed = this.effectiveSpeed * this.speedBoost * (archerWallBonus ? 1.3 : 1);
      this.cooldown = 1 / effectiveSpeed;
      let dmg = this.effectiveDamage * this.dmgBoost * (catapultWallBonus ? 1.25 : 1);
      let isCrit = false;
      if (this.type === 'archer' && this.level >= 3) {
        if (Math.random() < TOWER_LEVEL_MULTS.archer.crit[2]) {
          dmg *= 2; isCrit = true;
        }
      }
      this.setSynergyActive(archerWallBonus || catapultWallBonus || commandLinked);
      return {
        origin: new THREE.Vector3(myPos.x, myPos.y + 0.8, myPos.z),
        target: this.target,
        damage: dmg,
        speed: this.config.projectileSpeed,
        towerType: this.type,
        isCrit,
        splashRadius: commandLinked && this.type === 'archer' ? 0.8 : this.effectiveSplash,
        commandLinked,
      };
    }
    if (this.boostTimer <= 0) this.setSynergyActive(false);
    return null;
  }

  boost(dmgMult: number, rangeMult: number, spdMult: number, duration: number) {
    this.dmgBoost = dmgMult;
    this.rangeBoost = rangeMult;
    this.speedBoost = spdMult;
    this.boostTimer = duration;
    this.setSynergyActive(true);
  }

  showRange(v: boolean) { this.rangeRing.visible = v; }

  private _hasNearbyWall(towers: Tower[], range: number): boolean {
    const rSq = range * range;
    for (const tower of towers) {
      if (tower === this || tower.type !== 'wall' || tower.getWallHp() <= 0) continue;
      const dx = tower.group.position.x - this.group.position.x;
      const dz = tower.group.position.z - this.group.position.z;
      if (dx * dx + dz * dz <= rSq) return true;
    }
    return false;
  }

  setSynergyActive(active: boolean): void {
    if (!active) {
      if (this.synergyRing) this.synergyRing.visible = false;
      return;
    }
    if (!this.synergyRing) {
      this.synergyRing = new THREE.Mesh(
        new THREE.RingGeometry(0.42, 0.5, 24),
        new THREE.MeshBasicMaterial({ color: 0xd4a017, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
      );
      this.synergyRing.rotation.x = -Math.PI / 2;
      this.synergyRing.position.y = 0.04;
      this.synergyRing.userData.ignoreTowerPick = true;
      this.group.add(this.synergyRing);
    }
    this.synergyRing.visible = true;
    this.synergyRing.rotation.z += 0.035;
  }
}
