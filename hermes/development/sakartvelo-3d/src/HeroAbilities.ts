/**
 * HeroAbilities.ts
 * Hero ability system — activation, DoT tracking, cooldowns, VFX.
 * Imported and used by Hero.ts.
 */
import * as THREE from 'three';
import { Enemy } from './Enemy';
import { Tower } from './Tower';

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

export class HeroAbilities {
  abilities: AbilityState[];
  [index: number]: AbilityState;
  private dots: PoisonDot[] = [];

  // VFX groups (owned by Hero, referenced here for visibility control)
  private poisonVfx: THREE.Group;
  private healVfx: THREE.Group;
  private alchemyVfx: THREE.Group;

  constructor(poisonVfx: THREE.Group, healVfx: THREE.Group, alchemyVfx: THREE.Group) {
    this.poisonVfx = poisonVfx;
    this.healVfx = healVfx;
    this.alchemyVfx = alchemyVfx;
    this.abilities = [
      { name: 'Colchian Poison', icon: '☠️', maxCd: 15, cooldown: 0, active: false, duration: 5, timer: 0 },
      { name: 'War Chant',       icon: '🌿', maxCd: 45, cooldown: 0, active: false, duration: 8, timer: 0 },
      { name: 'Colchian Fire',   icon: '⚗️', maxCd: 120, cooldown: 0, active: false, duration: 10, timer: 0 },
    ];
  }

  activate(index: number, enemies: Enemy[], towers: Tower[], heroPos: THREE.Vector3): boolean {
    const ab = this.abilities[index];
    if (!ab || ab.cooldown > 0 || ab.active) return false;

    ab.active = true;
    ab.timer = ab.duration;

    if (index === 0) this.applyPoison(enemies, heroPos);
    else if (index === 1) this.applyHeal(towers, heroPos);
    else if (index === 2) this.applyAlchemy(towers, heroPos);

    return true;
  }

  private applyPoison(enemies: Enemy[], heroPos: THREE.Vector3) {
    const range = 4.2; // attackRange * 1.5
    let hit = 0;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (heroPos.distanceTo(e.getPos()) <= range) {
        this.dots.push({ enemy: e, ticksLeft: 5, interval: 1.0, elapsed: 0, dps: 8 });
        hit++;
      }
    }
    if (hit > 0) this.createVfxBurst(this.poisonVfx, 0x44ff44, range);
  }

  private applyHeal(towers: Tower[], heroPos: THREE.Vector3) {
    const range = 4.0;
    for (const t of towers) {
      const tPos = new THREE.Vector3(t.gx + 0.5, 0, t.gy + 0.5);
      if (heroPos.distanceTo(tPos) <= range) {
        t.boost(1.5, 1.0, 1.3, this.abilities[1].duration);
      }
    }
    this.createVfxBurst(this.healVfx, 0xffdd44, range);
  }

  private applyAlchemy(towers: Tower[], heroPos: THREE.Vector3) {
    const range = 5.0;
    for (const t of towers) {
      const tPos = new THREE.Vector3(t.gx + 0.5, 0, t.gy + 0.5);
      if (heroPos.distanceTo(tPos) <= range) {
        t.boost(2.0, 1.3, 1.5, this.abilities[2].duration);
      }
    }
    this.createVfxBurst(this.alchemyVfx, 0x8844ff, range);
  }

  private createVfxBurst(parent: THREE.Group, color: number, radius: number) {
    parent.clear();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.12, radius, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    parent.add(ring);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.3, 12, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15 })
    );
    sphere.position.y = 0.5;
    parent.add(sphere);
    parent.visible = true;
  }

  /** Called each frame from Hero.update() */
  update(dt: number, alive: boolean, heroPos: THREE.Vector3) {
    if (!alive) return;

    // Poison DoTs
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

    // Ability timers
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

    this.fadeVfx(this.poisonVfx, dt);
    this.fadeVfx(this.healVfx, dt);
    this.fadeVfx(this.alchemyVfx, dt);
  }

  private fadeVfx(group: THREE.Group, dt: number) {
    if (!group.visible) return;
    group.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
        child.material.opacity = Math.max(0, child.material.opacity - dt * 0.08);
      }
    });
  }
}
