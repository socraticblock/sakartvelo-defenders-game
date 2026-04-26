/**
 * Hero.ts
 * Hero entity — movement, combat, vitals, model, HP bar, selection.
 * Ability logic lives in HeroAbilities.ts.
 */
import * as THREE from 'three';
import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { makePart } from './EnemyModels';
import { outlineGroup } from './CelShader';
import { HeroAbilities } from './HeroAbilities';
import { gs } from './GameState';

export class Hero {
  group: THREE.Group;
  abilities: HeroAbilities;

  // Rig parts (set in buildModel)
  private rootGroup!: THREE.Group;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;
  private staffOrb!: THREE.Mesh;
  private auraMesh!: THREE.Mesh;

  // VFX groups (passed to HeroAbilities)
  private poisonVfx: THREE.Group;
  private healVfx: THREE.Group;
  private alchemyVfx: THREE.Group;

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
  private readonly RESPAWN_TIME = 15;
  private respawnTimer = 0;

  /** Seconds remaining until respawn (meaningful when `alive` is false). */
  get respawnTimeRemaining(): number {
    return this.respawnTimer;
  }
  
  // Building
  pendingBuild: { type: string; gx: number; gy: number; isPath: boolean } | null = null;
  buildTimer = 0;
  private readonly BUILD_RANGE = 1.5;
  private readonly BUILD_TIME = 1.5; // Default base build time

  // Health bar
  private hpBg: THREE.Mesh;
  private hpFill: THREE.Mesh;

  // Selection ring
  selected = false;
  private ring: THREE.Mesh;
  
  // Build bar
  private buildBg: THREE.Mesh;
  private buildFill: THREE.Mesh;

  // Grid bounds
  private gw: number;
  private gh: number;
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

    this.poisonVfx = new THREE.Group();
    this.poisonVfx.visible = false;
    this.group.add(this.poisonVfx);
    this.healVfx = new THREE.Group();
    this.healVfx.visible = false;
    this.group.add(this.healVfx);
    this.alchemyVfx = new THREE.Group();
    this.alchemyVfx.visible = false;
    this.group.add(this.alchemyVfx);

    this.abilities = new HeroAbilities(this.poisonVfx, this.healVfx, this.alchemyVfx);

    this.buildModel();

    // HP bar
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

    // Build bar (hidden by default)
    this.buildBg = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.04, 0.01),
      new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.8 })
    );
    this.buildBg.position.y = 1.7;
    this.buildBg.visible = false;
    this.group.add(this.buildBg);

    this.buildFill = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.03, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: 0.9 })
    );
    this.buildFill.position.y = 1.7;
    this.buildFill.visible = false;
    this.group.add(this.buildFill);
  }

  // ─── Movement ───────────────────────────────────────────────────────────────

  moveTo(worldX: number, worldZ: number) {
    this.moveTarget = new THREE.Vector3(
      Math.max(0.5, Math.min(this.gw - 0.5, worldX)),
      0,
      Math.max(0.5, Math.min(this.gh - 0.5, worldZ))
    );
    this.selected = true;
  }

  getMoveTarget(): THREE.Vector3 | null { return this.moveTarget; }

  // ─── Abilities ──────────────────────────────────────────────────────────────

  activateAbility(index: number, enemies: Enemy[], towers: Tower[]): boolean {
    if (!this.alive) return false;
    return this.abilities.activate(index, enemies, towers, this.group.position);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  update(dt: number, camera: THREE.Camera, enemies: Enemy[]) {
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.alive = true;
        this.hp = this.maxHp;
        this.group.position.set(this.spawnX, 0, this.spawnZ);
        this.rootGroup.visible = true;
        this.hpBg.visible = true;
        this.hpFill.visible = true;
        const ratio = 1;
        this.hpFill.scale.x = 1;
        this.hpFill.position.x = 0;
        (this.hpFill.material as THREE.MeshBasicMaterial).color.setHex(0x44dd44);
      }
      return;
    }

    const time = gs.gameTime;
    const isMoving = this.moveTarget !== null;

    // Idle float vs grounded while moving
    this.rootGroup.position.y = isMoving ? 0 : Math.sin(time * 1.5) * 0.04;
    this.leftArm.rotation.x = Math.sin(time * 2) * 0.15;
    this.rightArm.rotation.x = Math.sin(time * 2 + 0.5) * 0.2;
    this.staffOrb.scale.setScalar(0.8 + Math.sin(time * 3) * 0.2);
    (this.auraMesh.material as THREE.MeshBasicMaterial).opacity = 0.03 + Math.sin(time * 2) * 0.015;

    // Selection ring
    if (this.selected) {
      this.ring.visible = true;
      this.ring.rotation.z = time * 0.5;
    } else {
      this.ring.visible = false;
    }

    // Movement
    if (this.moveTarget) {
      const dir = this.moveTarget.clone().sub(this.group.position);
      dir.y = 0;
      const dist = dir.length();
      
      // If we have a pending build, we stop at BUILD_RANGE
      const stopDist = this.pendingBuild ? this.BUILD_RANGE : 0.15;

      if (dist < stopDist) {
        this.moveTarget = null;
      } else {
        dir.normalize().multiplyScalar(this.moveSpeed * dt);
        this.group.position.add(dir);
        if (dir.length() > 0.001) {
          this.rootGroup.rotation.y = Math.atan2(dir.x, dir.z);
        }
      }
    }

    // Build process
    if (this.pendingBuild && !this.moveTarget) {
      const targetPos = new THREE.Vector3(this.pendingBuild.gx + 0.5, 0, this.pendingBuild.gy + 0.5);
      const dist = this.group.position.distanceTo(targetPos);
      
      if (dist <= this.BUILD_RANGE + 0.1) {
        this.buildTimer += dt;
        // Face the building site
        this.rootGroup.rotation.y = Math.atan2(
          targetPos.x - this.group.position.x,
          targetPos.z - this.group.position.z
        );
        // Hammering animation
        this.rightArm.rotation.x = -0.5 + Math.sin(time * 15) * 0.4;
      } else {
        // We moved away or aren't there yet
        this.moveTarget = targetPos;
      }
    } else if (!this.pendingBuild) {
      this.buildTimer = 0;
    }

    // Auto-attack
    this.attackCd -= dt;
    if (this.attackCd <= 0) {
      const target = this._findTarget(enemies);
      if (target) {
        this.attackCd = 1 / this.attackInterval;
        target.takeDamage(this.attackDamage);
        const tPos = target.getPos();
        this.rootGroup.rotation.y = Math.atan2(
          tPos.x - this.group.position.x,
          tPos.z - this.group.position.z
        );
        this.rightArm.rotation.x = -0.8;
      }
    }

    // Ability system (DOTs, cooldowns, VFX)
    this.abilities.update(dt, this.alive, this.group.position);

    // Update build bar
    if (this.pendingBuild && this.buildTimer > 0) {
      this.buildBg.visible = true;
      this.buildFill.visible = true;
      const ratio = Math.min(1, this.buildTimer / this.BUILD_TIME);
      this.buildFill.scale.x = Math.max(0.001, ratio);
      this.buildFill.position.x = -0.39 * (1 - ratio);
    } else {
      this.buildBg.visible = false;
      this.buildFill.visible = false;
    }

    // Billboard bars
    this.hpBg.quaternion.copy(camera.quaternion);
    this.hpFill.quaternion.copy(camera.quaternion);
    this.buildBg.quaternion.copy(camera.quaternion);
    this.buildFill.quaternion.copy(camera.quaternion);
  }

  // ─── Model ────────────────────────────────────────────────────────────────

  private buildModel() {
    const C = {
      robe: 0x4d226f,
      robeDark: 0x25102f,
      trim: 0xd4a017,
      skin: 0xd2b08e,
      hair: 0x241626,
      wood: 0x735938,
      gem: 0x44ff88,
      cloak: 0x122816,
    };
    const p = (
      geo: THREE.BufferGeometry,
      c: number,
      pos: [number, number, number],
      rot?: [number, number, number],
      par: THREE.Object3D = this.rootGroup,
    ) => makePart(geo, c, pos, rot, par);

    p(new THREE.CylinderGeometry(0.24, 0.42, 0.78, 6), C.robe, [0, 0.48, 0]);
    p(new THREE.CylinderGeometry(0.28, 0.46, 0.22, 6), C.robeDark, [0, 0.18, 0]);
    p(new THREE.BoxGeometry(0.58, 0.08, 0.34), C.trim, [0, 0.43, 0.01]);
    p(new THREE.BoxGeometry(0.08, 0.8, 0.04), C.trim, [0, 0.48, 0.22]);
    p(new THREE.BoxGeometry(0.62, 0.18, 0.38), C.robe, [0, 0.88, -0.02]);
    p(new THREE.BoxGeometry(0.72, 0.1, 0.12), C.trim, [0, 0.96, 0.02]);
    p(new THREE.BoxGeometry(0.55, 0.72, 0.06), C.cloak, [0, 0.56, -0.23], [0.18, 0, 0]);

    const head = new THREE.Group();
    head.position.y = 1.15;
    this.rootGroup.add(head);
    p(new THREE.BoxGeometry(0.23, 0.25, 0.22), C.skin, [0, 0, 0], undefined, head);
    p(new THREE.BoxGeometry(0.28, 0.12, 0.16), C.hair, [0, 0.09, -0.02], undefined, head);
    p(new THREE.BoxGeometry(0.28, 0.46, 0.07), C.hair, [0, -0.13, -0.13], undefined, head);
    for (const s of [-1, 1]) {
      p(new THREE.BoxGeometry(0.035, 0.035, 0.018), 0xffffff, [s * 0.055, 0.02, 0.115], undefined, head);
      p(new THREE.BoxGeometry(0.018, 0.018, 0.012), 0x171022, [s * 0.055, 0.02, 0.128], undefined, head);
      p(new THREE.ConeGeometry(0.025, 0.16, 4), C.trim, [s * 0.12, 0.18, 0.01], [0, 0, s * 0.35], head);
    }
    p(new THREE.CylinderGeometry(0.13, 0.15, 0.08, 6), C.trim, [0, 0.15, 0], undefined, head);
    p(new THREE.ConeGeometry(0.04, 0.18, 4), C.trim, [0, 0.28, 0], undefined, head);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.34, 0.86, 0);
    this.rootGroup.add(this.leftArm);
    p(new THREE.BoxGeometry(0.1, 0.34, 0.1), C.robe, [0, -0.16, 0], [0.08, 0, -0.12], this.leftArm);
    p(new THREE.BoxGeometry(0.08, 0.08, 0.08), C.skin, [0, -0.36, 0.02], undefined, this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.34, 0.86, 0);
    this.rootGroup.add(this.rightArm);
    p(new THREE.BoxGeometry(0.1, 0.34, 0.1), C.robe, [0, -0.16, 0], [0.08, 0, 0.12], this.rightArm);
    p(new THREE.BoxGeometry(0.08, 0.08, 0.08), C.skin, [0, -0.36, 0.02], undefined, this.rightArm);

    const staffG = new THREE.Group();
    staffG.position.set(0.08, -0.28, 0.06);
    staffG.rotation.z = -0.2;
    this.rightArm.add(staffG);
    p(new THREE.CylinderGeometry(0.022, 0.028, 1.12, 6), C.wood, [0, -0.52, 0], undefined, staffG);
    p(new THREE.TorusGeometry(0.08, 0.012, 6, 12), C.trim, [0, -1.08, 0], [Math.PI / 2, 0, 0], staffG);
    this.staffOrb = p(new THREE.IcosahedronGeometry(0.075, 0), C.gem, [0, -1.08, 0], undefined, staffG);
    const orbGlow = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.14, 1),
      new THREE.MeshBasicMaterial({ color: C.gem, transparent: true, opacity: 0.24 }),
    );
    orbGlow.position.set(0, -1.08, 0);
    staffG.add(orbGlow);

    this.auraMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.76, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x8844ff, transparent: true, opacity: 0.04 }),
    );
    this.auraMesh.position.y = 0.52;
    this.rootGroup.add(this.auraMesh);
    outlineGroup(this.rootGroup);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private _findTarget(enemies: Enemy[]): Enemy | null {
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
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpFill.scale.x = Math.max(0.001, ratio);
    this.hpFill.position.x = -0.49 * (1 - ratio);
    const mat = this.hpFill.material as THREE.MeshBasicMaterial;
    if (ratio > 0.5) mat.color.setHex(0x44dd44);
    else if (ratio > 0.25) mat.color.setHex(0xdddd44);
    else mat.color.setHex(0xdd4444);
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

  getPos(): THREE.Vector3 { return this.group.position; }
}
