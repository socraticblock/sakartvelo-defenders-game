import * as THREE from 'three';
import { TOWER_CONFIGS, TOWER_LEVEL_MULTS } from './types';
import { Enemy } from './Enemy';
import { toon, outlineGroup } from './CelShader';

/** Tracks original emissive color of each mesh part for flash/restore */
const _origColorMap = new Map<THREE.Mesh, number>();

/** Raw projectile data — main.ts acquires from pool */
export interface ProjectileSpawn {
  origin: THREE.Vector3;
  target: Enemy;
  damage: number;
  speed: number;
  towerType: string;
  isCrit: boolean;
  splashRadius: number;
}

export class Tower {
  group: THREE.Group;
  type: string;
  gx: number;
  gy: number;
  config = TOWER_CONFIGS.archer;

  level = 1; // 1, 2, or 3

  // Effective stats (base × level multiplier)
  private effectiveDamage: number;
  private effectiveRange: number;
  private effectiveSpeed: number;
  private effectiveSplash: number;

  private cooldown = 0;
  private target: Enemy | null = null;
  rangeRing: THREE.Mesh;

  // Boost system (Medea abilities)
  private dmgBoost = 1.0;
  private rangeBoost = 1.0;
  private speedBoost = 1.0;
  private boostTimer = 0;

  // Wall-specific (placeable on path)
  private wallHp = 0;
  private wallMaxHp = 0;
  private hpBg: THREE.Mesh | null = null;
  private hpFill: THREE.Mesh | null = null;

  constructor(type: string, gx: number, gy: number, isOnPath: boolean = false) {
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

    // Init effective stats
    this.effectiveDamage = this.config.damage;
    this.effectiveRange = this.config.range;
    this.effectiveSpeed = this.config.attackSpeed;
    this.effectiveSplash = 0;

    // Init wall HP if wall type
    if (type === 'wall') {
      const wallCfg = TOWER_LEVEL_MULTS.wall;
      this.wallHp = wallCfg.hp[0];
      this.wallMaxHp = this.wallHp;
    }
  }

  get isOnPath(): boolean {
    return this.type === 'wall';
  }

  get upgradeCost(): number | null {
    if (this.level >= 3) return null;
    return this.config.upgradeCosts[this.level - 1];
  }

  get sellValue(): number {
    let total = this.config.cost;
    for (let i = 0; i < this.level - 1; i++) {
      total += this.config.upgradeCosts[i];
    }
    return Math.floor(total * 0.5);
  }

  upgrade(): boolean {
    if (this.level >= 3) return false;
    this.level++;
    this.applyLevelStats();
    this.rebuildMesh();

    // Update range ring
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
      const idx = this.level - 1;
      this.wallMaxHp = m.hp[idx];
      this.wallHp = this.wallMaxHp;
    }
  }

  private rebuildMesh() {
    // Remove old mesh children (keep range ring + boost visuals)
    const toRemove: THREE.Object3D[] = [];
    this.group.children.forEach(c => {
      if (c !== this.rangeRing) toRemove.push(c);
    });
    toRemove.forEach(c => this.group.remove(c));

    this.buildMesh();

    // Re-add wall HP bar if wall
    if (this.type === 'wall') {
      this.buildWallHpBar();
    }
  }

  private buildMesh() {
    const c = this.config.color;
    const lv = this.level;
    const scaleMult = 1 + (lv - 1) * 0.15; // bigger each level

    if (this.type === 'archer') {
      // Stone base
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28 * scaleMult, 0.35 * scaleMult, 0.3, 8),
        toon(lv >= 3 ? 0x999988 : 0x777766 )
      );
      base.position.y = 0.15;
      base.castShadow = true;
      this.group.add(base);

      // Wooden tower
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18 * scaleMult, 0.22 * scaleMult, 0.6 * scaleMult, 8),
        toon(c )
      );
      tower.position.y = 0.6;
      tower.castShadow = true;
      this.group.add(tower);

      // Roof
      const roofColor = lv === 1 ? 0x6b4914 : lv === 2 ? 0x8b6914 : 0xd4a017;
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(0.28 * scaleMult, 0.25 * scaleMult, 8),
        toon(roofColor )
      );
      roof.position.y = 0.6 + 0.3 * scaleMult + 0.12;
      this.group.add(roof);

      // Archer figure
      const archer = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 * scaleMult, 6, 4),
        toon(0xd2b08e )
      );
      archer.position.set(0, 0.55 + 0.3 * scaleMult + 0.05, 0.15);
      this.group.add(archer);

      // L2: Extra archer
      if (lv >= 2) {
        const archer2 = new THREE.Mesh(
          new THREE.SphereGeometry(0.08 * scaleMult, 6, 4),
          toon(0xd2b08e )
        );
        archer2.position.set(-0.12, 0.55 + 0.3 * scaleMult + 0.05, -0.1);
        this.group.add(archer2);
      }

      // L3: Gold trim band (emissive for bloom)
      if (lv >= 3) {
        const band = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22 * scaleMult, 0.22 * scaleMult, 0.04, 8),
          new THREE.MeshLambertMaterial({ color: 0xd4a017, emissive: 0xd4a017, emissiveIntensity: 1.5 })
        );
        band.position.y = 0.85 * scaleMult;
        this.group.add(band);
      }

    } else if (this.type === 'catapult') {
      // Platform
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(0.6 * scaleMult, 0.15 * scaleMult, 0.5 * scaleMult),
        toon(lv >= 3 ? 0x554422 : 0x735938 )
      );
      platform.position.y = 0.075;
      platform.castShadow = true;
      this.group.add(platform);

      // Wheels
      for (const x of [-0.25, 0.25]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1 * scaleMult, 0.1 * scaleMult, 0.05, 8),
          toon(lv >= 3 ? 0x555555 : 0x444444 )
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x * scaleMult, 0.1, 0.22);
        this.group.add(wheel);
      }

      // Arm
      const armLen = 0.5 * scaleMult;
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, armLen, 0.06),
        toon(0x735938 )
      );
      arm.position.set(0, 0.4 * scaleMult, -0.1);
      arm.rotation.x = -0.4;
      this.group.add(arm);

      // Bucket
      const bucket = new THREE.Mesh(
        new THREE.BoxGeometry(0.12 * scaleMult, 0.08 * scaleMult, 0.12 * scaleMult),
        toon(lv >= 2 ? 0x666666 : 0x555555 )
      );
      bucket.position.set(0, 0.55 * scaleMult, -0.28);
      this.group.add(bucket);

      // L2+: Extra ammo pile
      if (lv >= 2) {
        for (let i = 0; i < 2; i++) {
          const ammo = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 6, 4),
            toon(0x666666 )
          );
          ammo.position.set(0.15 + i * 0.06, 0.18, -0.15);
          this.group.add(ammo);
        }
      }

      // L3: Reinforced frame (gold bands, emissive for bloom)
      if (lv >= 3) {
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(0.62 * scaleMult, 0.04, 0.52 * scaleMult),
          new THREE.MeshLambertMaterial({ color: 0xd4a017, emissive: 0xd4a017, emissiveIntensity: 1.5 })
        );
        frame.position.y = 0.16;
        this.group.add(frame);
      }

    } else if (this.type === 'wall') {
      const wallH = 0.4 + (lv - 1) * 0.12;
      const wallColor = lv === 1 ? 0x8a7a5a : lv === 2 ? 0x9a8a6a : 0xaaaaaa;

      // Main wall body
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, wallH, 0.92),
        toon(wallColor )
      );
      wall.position.y = wallH / 2;
      wall.castShadow = true;
      this.group.add(wall);

      // Battlements
      const bSize = 0.14 + (lv - 1) * 0.02;
      for (let dx = -1; dx <= 1; dx += 2) {
        for (let dz = -1; dz <= 1; dz += 2) {
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(bSize, bSize, bSize),
            toon(wallColor )
          );
          m.position.set(dx * 0.3, wallH + bSize / 2, dz * 0.3);
          this.group.add(m);
        }
      }

      // L2: Log stakes on front
      if (lv >= 2) {
        for (let i = -1; i <= 1; i++) {
          const stake = new THREE.Mesh(
            new THREE.ConeGeometry(0.03, 0.2, 4),
            toon(0x735938 )
          );
          stake.position.set(i * 0.15, wallH + 0.1, 0.45);
          stake.rotation.x = -0.3;
          this.group.add(stake);
        }
      }

      // L3: Iron bands
      if (lv >= 3) {
        const band = new THREE.Mesh(
          new THREE.BoxGeometry(0.94, 0.04, 0.94),
          toon(0x555555 )
        );
        band.position.y = wallH * 0.6;
        this.group.add(band);
      }

      // Build HP bar
      this.buildWallHpBar();
    }

    // Cel-shading: add outlines to all tower parts
    outlineGroup(this.group);
  }

  private buildWallHpBar() {
    const hbW = 0.9;
    this.hpBg = new THREE.Mesh(
      new THREE.BoxGeometry(hbW, 0.06, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    const wallH = 0.4 + (this.level - 1) * 0.12;
    this.hpBg.position.y = wallH + 0.25;
    this.group.add(this.hpBg);

    this.hpFill = new THREE.Mesh(
      new THREE.BoxGeometry(hbW - 0.02, 0.04, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x44dd44 })
    );
    this.hpFill.position.y = wallH + 0.25;
    this.group.add(this.hpFill);
  }

  // Wall takes damage from enemies
  takeWallDamage(amount: number, camera?: THREE.Camera): boolean {
    if (this.type !== 'wall' || this.wallHp <= 0) return false;

    this.wallHp -= amount;
    this.updateWallHpBar();

    // Flash wall red — store original emissive in Map so subsequent flashes restore correctly
    this.group.children.forEach(c => {
      if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshLambertMaterial) {
        if (!_origColorMap.has(c)) {
          _origColorMap.set(c, c.material.emissive.getHex());
        }
        c.material.emissive.setHex(0x440000);
        setTimeout(() => {
          const orig = _origColorMap.get(c) ?? 0x000000;
          c.material.emissive.setHex(orig);
        }, 100);
      }
    });

    if (this.wallHp <= 0) return true; // wall destroyed
    return false;
  }

  private updateWallHpBar() {
    if (!this.hpFill) return;
    const ratio = Math.max(0, this.wallHp / this.wallMaxHp);
    this.hpFill.scale.x = Math.max(0.001, ratio);
    this.hpFill.position.x = -0.44 * (1 - ratio);

    if (ratio > 0.5) (this.hpFill.material as THREE.MeshBasicMaterial).color.setHex(0x44dd44);
    else if (ratio > 0.25) (this.hpFill.material as THREE.MeshBasicMaterial).color.setHex(0xdddd44);
    else (this.hpFill.material as THREE.MeshBasicMaterial).color.setHex(0xdd4444);
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

  billboardHp(camera: THREE.Camera) {
    if (this.hpBg) this.hpBg.quaternion.copy(camera.quaternion);
    if (this.hpFill) this.hpFill.quaternion.copy(camera.quaternion);
  }

  private createRangeRing(): THREE.Mesh {
    const r = this.getEffectiveRange();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r - 0.05, r, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    ring.visible = false;
    return ring;
  }

  private getEffectiveRange(): number {
    return this.effectiveRange * this.rangeBoost;
  }

  update(dt: number, enemies: Enemy[]): ProjectileSpawn | null {
    if (this.config.damage === 0) return null; // walls don't shoot

    // Tick boost timer
    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      if (this.boostTimer <= 0) {
        this.dmgBoost = 1.0;
        this.rangeBoost = 1.0;
        this.speedBoost = 1.0;
      }
    }

    this.cooldown -= dt;

    // Find best target
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
      const effectiveSpeed = this.effectiveSpeed * this.speedBoost;
      this.cooldown = 1 / effectiveSpeed;

      // Crit check (archer L3)
      let dmg = this.effectiveDamage * this.dmgBoost;
      let isCrit = false;
      if (this.type === 'archer' && this.level >= 3) {
        const critChance = TOWER_LEVEL_MULTS.archer.crit[2];
        if (Math.random() < critChance) {
          dmg *= 2;
          isCrit = true;
        }
      }

      return {
        origin: new THREE.Vector3(myPos.x, myPos.y + 0.8, myPos.z),
        target: this.target,
        damage: dmg,
        speed: this.config.projectileSpeed,
        towerType: this.type,
        isCrit,
        splashRadius: this.effectiveSplash,
      };
    }
    return null;
  }

  boost(dmgMult: number, rangeMult: number, speedMult: number, duration: number) {
    this.dmgBoost = dmgMult;
    this.rangeBoost = rangeMult;
    this.speedBoost = speedMult;
    this.boostTimer = duration;
  }

  showRange(v: boolean) { this.rangeRing.visible = v; }
}
