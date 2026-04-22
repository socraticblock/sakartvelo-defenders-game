import * as THREE from 'three';
import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { makePart } from './EnemyModels';
import { outlineGroup } from './CelShader';

// ─── MEDEA — Era 0 Hero ───────────────────────────────
// Support/Control type
// Q: Colchian Poison (AoE DoT, 15s cd)
// W: Herbal Remedy (tower heal+boost, 45s cd)
// E: Colchian Alchemy (tower transform, 120s cd)

export interface AbilityState {
  name: string;
  icon: string;
  maxCd: number;
  cooldown: number;
  active: boolean;
  duration: number;
  timer: number;
}

interface PoisonDot {
  enemy: Enemy;
  ticksLeft: number;
  interval: number;
  elapsed: number;
  dps: number;
}

export class Hero {
  group: THREE.Group;

  // Rig parts (set in buildModel)
  private rootGroup!: THREE.Group;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;
  private staffOrb!: THREE.Mesh;
  private auraMesh!: THREE.Mesh;

  // Movement
  moveTarget: THREE.Vector3 | null = null;
  moveSpeed = 3.5;

  // Combat
  attackRange = 2.8;
  attackDamage = 14;
  attackInterval = 1.0;
  private attackCd = 0;

  // Vitals
  hp = 250;
  maxHp = 250;
  alive = true;
  respawnTimer = 0;
  private readonly RESPAWN_TIME = 15;

  // Health bar
  private hpBg: THREE.Mesh;
  private hpFill: THREE.Mesh;

  // Selection ring
  selected = false;
  private ring: THREE.Mesh;

  // Abilities
  abilities: AbilityState[];
  private dots: PoisonDot[] = [];

  // VFX
  private poisonVfx: THREE.Group;
  private healVfx: THREE.Group;
  private alchemyVfx: THREE.Group;

  // Grid bounds
  private gw: number;
  private gh: number;

  // Respawn position
  private spawnX: number;
  private spawnZ: number;

  constructor(startX: number, startZ: number, gridW: number, gridH: number) {
    this.gw = gridW;
    this.gh = gridH;
    this.spawnX = startX;
    this.spawnZ = startZ;
    this.group = new THREE.Group();
    this.group.position.set(startX, 0, startZ);

    this.rootGroup = new THREE.Group();
    this.group.add(this.rootGroup);

    this.buildModel();

    // Health bar
    const hbW = 1.0;
    this.hpBg = new THREE.Mesh(
      new THREE.BoxGeometry(hbW, 0.06, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    this.hpBg.position.y = 2.0;
    this.group.add(this.hpBg);

    this.hpFill = new THREE.Mesh(
      new THREE.BoxGeometry(hbW - 0.02, 0.04, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x44dd44 })
    );
    this.hpFill.position.y = 2.0;
    this.group.add(this.hpFill);

    // Selection ring
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.55, 24),
      new THREE.MeshBasicMaterial({ color: 0xd4a017, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;
    this.ring.visible = false;
    this.group.add(this.ring);

    // VFX groups
    this.poisonVfx = new THREE.Group();
    this.poisonVfx.visible = false;
    this.group.add(this.poisonVfx);
    this.healVfx = new THREE.Group();
    this.healVfx.visible = false;
    this.group.add(this.healVfx);
    this.alchemyVfx = new THREE.Group();
    this.alchemyVfx.visible = false;
    this.group.add(this.alchemyVfx);

    // Abilities
    this.abilities = [
      { name: 'Colchian Poison', icon: '☠️', maxCd: 15, cooldown: 0, active: false, duration: 5, timer: 0 },
      { name: 'War Chant', icon: '🌿', maxCd: 45, cooldown: 0, active: false, duration: 8, timer: 0 },
      { name: 'Colchian Fire', icon: '⚗️', maxCd: 120, cooldown: 0, active: false, duration: 10, timer: 0 },
    ];
  }

  private buildModel() {
    const robe = 0x4a1a6b;
    const gold = 0xd4a017;
    const skin = 0xd2b08e;
    const hair = 0x1a0a2a;
    const wood = 0x735938;

    // Robe (flowing cone — organic, not blocky)
    makePart(new THREE.CylinderGeometry(0.18, 0.4, 0.95, 8), robe, [0, 0.47, 0], undefined, this.rootGroup);

    // Gold belt
    makePart(new THREE.BoxGeometry(0.38, 0.05, 0.25), gold, [0, 0.35, 0], undefined, this.rootGroup);

    // Shoulders / cloak drape
    makePart(new THREE.BoxGeometry(0.5, 0.14, 0.34), robe, [0, 0.87, -0.04], undefined, this.rootGroup);

    // Gold shoulder clasps
    for (const s of [-1, 1]) {
      makePart(new THREE.SphereGeometry(0.04, 6, 4), gold, [s * 0.22, 0.9, 0.02], undefined, this.rootGroup);
    }

    // ─── Head ───
    const head = new THREE.Group();
    head.position.y = 1.1;
    this.rootGroup.add(head);

    makePart(new THREE.BoxGeometry(0.2, 0.22, 0.2), skin, [0, 0, 0], undefined, head);

    // Eyes (no mouth — art style locked)
    for (const s of [-1, 1]) {
      const eye = makePart(new THREE.BoxGeometry(0.05, 0.05, 0.02), 0xffffff, [s * 0.06, 0.02, 0.1], undefined, head);
      makePart(new THREE.BoxGeometry(0.03, 0.03, 0.02), 0x2a1a4a, [0, 0, 0.01], undefined, eye);
    }

    // Crown (Colchian gold — 3 points)
    makePart(new THREE.CylinderGeometry(0.13, 0.15, 0.1, 6), gold, [0, 0.14, 0], undefined, head);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      makePart(new THREE.ConeGeometry(0.025, 0.1, 4), gold,
        [Math.sin(a) * 0.1, 0.22, Math.cos(a) * 0.1], undefined, head);
    }

    // Long dark hair
    makePart(new THREE.BoxGeometry(0.22, 0.48, 0.06), hair, [0, -0.13, -0.1], undefined, head);

    // ─── Arms ───
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.27, 0.84, 0);
    this.rootGroup.add(this.leftArm);
    makePart(new THREE.BoxGeometry(0.08, 0.28, 0.08), robe, [0, -0.14, 0], undefined, this.leftArm);
    makePart(new THREE.BoxGeometry(0.065, 0.065, 0.065), skin, [0, -0.3, 0], undefined, this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.27, 0.84, 0);
    this.rootGroup.add(this.rightArm);
    makePart(new THREE.BoxGeometry(0.08, 0.28, 0.08), robe, [0, -0.14, 0], undefined, this.rightArm);
    makePart(new THREE.BoxGeometry(0.065, 0.065, 0.065), skin, [0, -0.3, 0], undefined, this.rightArm);

    // ─── Staff (right hand) ───
    const staffG = new THREE.Group();
    staffG.position.set(0.05, -0.25, 0.05);
    this.rightArm.add(staffG);
    makePart(new THREE.CylinderGeometry(0.02, 0.025, 1.0, 6), wood, [0, -0.5, 0], undefined, staffG);

    // Staff orb (glowing green — alchemy)
    this.staffOrb = makePart(new THREE.SphereGeometry(0.06, 8, 6), 0x44ff88, [0, -1.02, 0], undefined, staffG);
    const orbGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.3 })
    );
    orbGlow.position.set(0, -1.02, 0);
    staffG.add(orbGlow);

    // Passive aura (subtle purple glow)
    this.auraMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x8844ff, transparent: true, opacity: 0.04 })
    );
    this.auraMesh.position.y = 0.5;
    this.rootGroup.add(this.auraMesh);

    // Cel-shading: add outlines to all static parts
    outlineGroup(this.rootGroup);
  }

  // ─── Movement ───
  moveTo(worldX: number, worldZ: number) {
    this.moveTarget = new THREE.Vector3(
      Math.max(0.5, Math.min(this.gw - 0.5, worldX)),
      0,
      Math.max(0.5, Math.min(this.gh - 0.5, worldZ))
    );
    this.selected = true;
  }

  getMoveTarget(): THREE.Vector3 | null { return this.moveTarget; }

  // ─── Abilities ───
  activateAbility(index: number, enemies: Enemy[], towers: Tower[]): boolean {
    const ab = this.abilities[index];
    if (!ab || ab.cooldown > 0 || ab.active || !this.alive) return false;

    ab.active = true;
    ab.timer = ab.duration;

    if (index === 0) this.applyPoison(enemies);
    else if (index === 1) this.applyHeal(towers);
    else if (index === 2) this.applyAlchemy(towers);

    return true;
  }

  private applyPoison(enemies: Enemy[]) {
    const pos = this.group.position;
    const range = this.attackRange * 1.5;
    let hit = 0;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (pos.distanceTo(e.getPos()) <= range) {
        this.dots.push({ enemy: e, ticksLeft: 5, interval: 1.0, elapsed: 0, dps: 8 });
        hit++;
      }
    }
    if (hit > 0) this.createVfxBurst(this.poisonVfx, 0x44ff44, range);
  }

  private applyHeal(towers: Tower[]) {
    const pos = this.group.position;
    const range = 4.0;
    for (const t of towers) {
      const tPos = new THREE.Vector3(t.gx + 0.5, 0, t.gy + 0.5);
      if (pos.distanceTo(tPos) <= range) {
        t.boost(1.5, 1.0, 1.3, this.abilities[1].duration);
      }
    }
    this.createVfxBurst(this.healVfx, 0xffdd44, range);
  }

  private applyAlchemy(towers: Tower[]) {
    const pos = this.group.position;
    const range = 5.0;
    for (const t of towers) {
      const tPos = new THREE.Vector3(t.gx + 0.5, 0, t.gy + 0.5);
      if (pos.distanceTo(tPos) <= range) {
        t.boost(2.0, 1.3, 1.5, this.abilities[2].duration);
      }
    }
    this.createVfxBurst(this.alchemyVfx, 0x8844ff, range);
  }

  private createVfxBurst(parent: THREE.Group, color: number, radius: number) {
    parent.clear();
    // Expanding ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.12, radius, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    parent.add(ring);
    // Sphere flash
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.3, 12, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15 })
    );
    sphere.position.y = 0.5;
    parent.add(sphere);
    parent.visible = true;
  }

  // ─── Update ───
  update(dt: number, camera: THREE.Camera, enemies: Enemy[]) {
    if (!this.alive) {
      // Respawn timer
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.alive = true;
        this.hp = this.maxHp;
        this.group.position.set(this.spawnX, 0, this.spawnZ);
        this.rootGroup.visible = true;
        this.hpBg.visible = true;
        this.hpFill.visible = true;
        this.updateHpBar();
      }
      return;
    }

    const time = performance.now() * 0.001;
    const isMoving = this.moveTarget !== null;

    // Idle animation: only float when stationary (no leg-bobbing while moving)
    if (!isMoving) {
      this.rootGroup.position.y = Math.sin(time * 1.5) * 0.04;
    } else {
      this.rootGroup.position.y = 0; // keep grounded while moving
    }
    this.leftArm.rotation.x = Math.sin(time * 2) * 0.15;
    this.rightArm.rotation.x = Math.sin(time * 2 + 0.5) * 0.2;

    // Staff orb pulse
    this.staffOrb.scale.setScalar(0.8 + Math.sin(time * 3) * 0.2);

    // Aura pulse
    (this.auraMesh.material as THREE.MeshBasicMaterial).opacity =
      0.03 + Math.sin(time * 2) * 0.015;

    // Selection ring
    if (this.selected) {
      this.ring.visible = true;
      this.ring.rotation.z = time * 0.5;
    } else {
      this.ring.visible = false;
    }

    // Move toward target
    if (this.moveTarget) {
      const dir = this.moveTarget.clone().sub(this.group.position);
      dir.y = 0;
      const dist = dir.length();
      if (dist < 0.15) {
        this.moveTarget = null;
      } else {
        dir.normalize().multiplyScalar(this.moveSpeed * dt);
        this.group.position.add(dir);
        // Face movement direction
        if (dir.length() > 0.001) {
          this.rootGroup.rotation.y = Math.atan2(dir.x, dir.z);
        }
      }
    }

    // Auto-attack nearest enemy in range
    this.attackCd -= dt;
    if (this.attackCd <= 0) {
      const target = this.findTarget(enemies);
      if (target) {
        this.attackCd = 1 / this.attackInterval;
        target.takeDamage(this.attackDamage);
        // Face target
        const tPos = target.getPos();
        this.rootGroup.rotation.y = Math.atan2(
          tPos.x - this.group.position.x,
          tPos.z - this.group.position.z
        );
        // Attack arm swing
        this.rightArm.rotation.x = -0.8;
      }
    }

    // Update poison DoTs
    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      if (!dot.enemy.alive) { this.dots.splice(i, 1); continue; }
      dot.elapsed += dt;
      if (dot.elapsed >= dot.interval) {
        dot.elapsed -= dot.interval;
        dot.enemy.takeDamage(dot.dps);
        dot.ticksLeft--;
        if (dot.ticksLeft <= 0) this.dots.splice(i, 1);
      }
    }

    // Update ability timers
    for (let i = 0; i < this.abilities.length; i++) {
      const ab = this.abilities[i];
      if (ab.active) {
        ab.timer -= dt;
        if (ab.timer <= 0) {
          ab.active = false;
          ab.cooldown = ab.maxCd;
          ab.timer = ab.maxCd;
          if (i === 0) this.poisonVfx.visible = false;
          if (i === 1) this.healVfx.visible = false;
          if (i === 2) this.alchemyVfx.visible = false;
        }
      } else if (ab.cooldown > 0) {
        ab.timer -= dt;
        ab.cooldown = Math.max(0, ab.timer);
        if (ab.cooldown <= 0) ab.timer = 0;
      }
    }

    // Fade VFX
    this.fadeVfx(this.poisonVfx, dt);
    this.fadeVfx(this.healVfx, dt);
    this.fadeVfx(this.alchemyVfx, dt);

    // Billboard health bar
    this.hpBg.quaternion.copy(camera.quaternion);
    this.hpFill.quaternion.copy(camera.quaternion);
  }

  private fadeVfx(group: THREE.Group, dt: number) {
    if (!group.visible) return;
    group.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
        child.material.opacity = Math.max(0, child.material.opacity - dt * 0.08);
      }
    });
  }

  private findTarget(enemies: Enemy[]): Enemy | null {
    let best: Enemy | null = null;
    const pos = this.group.position;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = pos.distanceTo(e.getPos());
      if (d <= this.attackRange && (!best || e.distanceTraveled > best.distanceTraveled)) {
        best = e;
      }
    }
    return best;
  }

  takeDamage(amount: number) {
    if (!this.alive) return;
    this.hp -= amount;
    this.updateHpBar();

    if (this.hp <= 0) {
      this.alive = false;
      this.respawnTimer = this.RESPAWN_TIME;
      this.rootGroup.visible = false;
      this.hpBg.visible = false;
      this.hpFill.visible = false;
      this.moveTarget = null;
      this.selected = false;
    }
  }

  private updateHpBar() {
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpFill.scale.x = Math.max(0.001, ratio);
    this.hpFill.position.x = -0.49 * (1 - ratio);

    if (ratio > 0.5) (this.hpFill.material as THREE.MeshBasicMaterial).color.setHex(0x44dd44);
    else if (ratio > 0.25) (this.hpFill.material as THREE.MeshBasicMaterial).color.setHex(0xdddd44);
    else (this.hpFill.material as THREE.MeshBasicMaterial).color.setHex(0xdd4444);
  }

  getPos(): THREE.Vector3 {
    return this.group.position;
  }
}
