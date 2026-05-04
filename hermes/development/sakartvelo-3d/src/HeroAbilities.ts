/**
 * HeroAbilities.ts
 * Hero ability system - activation, DoT tracking, cooldowns, VFX.
 * Imported and used by Hero.ts.
 */
import * as THREE from 'three';
import { Enemy } from './Enemy';
import { Tower } from './Tower';
import { magicParticles } from './MagicalParticles';

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
  private skillAnimRequest = false;

  private poisonVfx: THREE.Group;
  private snareVfx: THREE.Group;
  private alchemyVfx: THREE.Group;

  constructor(poisonVfx: THREE.Group, healVfx: THREE.Group, alchemyVfx: THREE.Group) {
    this.poisonVfx = poisonVfx;
    this.snareVfx = healVfx;
    this.alchemyVfx = alchemyVfx;
    this.abilities = [
      { name: 'Colchian Poison', icon: 'P', maxCd: 20, cooldown: 0, active: false, duration: 5, timer: 0 },
      { name: 'Ritual Snare', icon: 'S', maxCd: 45, cooldown: 0, active: false, duration: 8, timer: 0 },
      { name: 'Colchian Alchemy', icon: 'A', maxCd: 90, cooldown: 0, active: false, duration: 10, timer: 0 },
    ];
  }

  activate(index: number, enemies: Enemy[], towers: Tower[], heroPos: THREE.Vector3): boolean {
    const ab = this.abilities[index];
    if (!ab || ab.cooldown > 0 || ab.active) return false;

    ab.active = true;
    ab.timer = ab.duration;
    this.skillAnimRequest = true;

    if (index === 0) {
      this.applyPoison(enemies, heroPos);
      magicParticles?.spawnBurst(heroPos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x44ff44, 25);
    } else if (index === 1) {
      this.applySnare(enemies, heroPos);
      magicParticles?.spawnBurst(heroPos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x88dd66, 40);
    } else if (index === 2) {
      this.applyAlchemy(enemies, towers, heroPos);
      magicParticles?.spawnBurst(heroPos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xffbb44, 60);
    }

    return true;
  }

  consumeSkillAnimRequest(): boolean {
    const v = this.skillAnimRequest;
    this.skillAnimRequest = false;
    return v;
  }

  private applyPoison(enemies: Enemy[], heroPos: THREE.Vector3): void {
    const range = 4.2;
    let hit = 0;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (heroPos.distanceTo(e.getPos()) <= range) {
        this.dots.push({ enemy: e, ticksLeft: 5, interval: 1.0, elapsed: 0, dps: 6 });
        e.setPoisoned(5);
        hit++;
      }
    }
    if (hit > 0) this.createVfxBurst(this.poisonVfx, 0x44ff44, range);
  }

  private applySnare(enemies: Enemy[], heroPos: THREE.Vector3): void {
    const range = 4.3;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (heroPos.distanceTo(e.getPos()) <= range) {
        e.applyTemporarySlow(0.45, this.abilities[1].duration);
      }
    }
    this.createVfxBurst(this.snareVfx, 0x88dd66, range);
  }

  private applyAlchemy(enemies: Enemy[], towers: Tower[], heroPos: THREE.Vector3): void {
    const range = 5.0;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (heroPos.distanceTo(e.getPos()) <= range) {
        e.applyTemporarySlow(0.35, this.abilities[2].duration);
        e.setPoisoned(this.abilities[2].duration);
        this.dots.push({ enemy: e, ticksLeft: 10, interval: 1.0, elapsed: 0, dps: 7 });
      }
    }

    for (const t of towers) {
      const tPos = new THREE.Vector3(t.gx + 0.5, 0, t.gy + 0.5);
      if (heroPos.distanceTo(tPos) <= range) {
        t.boost(1.35, 1.1, 1.25, this.abilities[2].duration);
      }
    }

    this.createVfxBurst(this.alchemyVfx, 0xffbb44, range);
  }

  private createVfxBurst(parent: THREE.Group, color: number, radius: number): void {
    parent.clear();
    const inner = Math.max(0.02, radius - 0.12);
    const outer = Math.max(inner + 0.02, radius);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 32),
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

  update(dt: number, alive: boolean, heroPos: THREE.Vector3): void {
    if (!alive) return;

    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      if (!dot.enemy.alive) {
        this.dots.splice(i, 1);
        continue;
      }
      dot.elapsed += dt;
      if (dot.elapsed >= dot.interval) {
        dot.elapsed -= dot.interval;
        dot.enemy.takeDamage(dot.dps);
        dot.ticksLeft--;
        if (dot.ticksLeft <= 0) this.dots.splice(i, 1);
      }
    }

    for (let i = 0; i < this.abilities.length; i++) {
      const ab = this.abilities[i];
      if (ab.active) {
        ab.timer -= dt;
        if (ab.timer <= 0) {
          ab.active = false;
          ab.cooldown = ab.maxCd;
          ab.timer = ab.maxCd;
          if (i === 0) this.poisonVfx.visible = false;
          if (i === 1) this.snareVfx.visible = false;
          if (i === 2) this.alchemyVfx.visible = false;
        }
      } else if (ab.cooldown > 0) {
        ab.timer -= dt;
        ab.cooldown = Math.max(0, ab.timer);
        if (ab.cooldown <= 0) ab.timer = 0;
      }
    }

    this.fadeVfx(this.poisonVfx, dt);
    this.fadeVfx(this.snareVfx, dt);
    this.fadeVfx(this.alchemyVfx, dt);
  }

  private fadeVfx(group: THREE.Group, dt: number): void {
    if (!group.visible) return;
    group.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
        child.material.opacity = Math.max(0, child.material.opacity - dt * 0.08);
      }
    });
  }
}
