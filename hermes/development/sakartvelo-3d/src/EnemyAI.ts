/**
 * EnemyAI.ts
 * Enemy movement, wall attacks, and death handling.
 * Extracted from GameLoop.ts to keep it under 300 lines.
 */
import * as THREE from 'three';
import { gs } from './GameState';
import { ENEMY_CONFIGS } from './types';
import { spawnFloatingGold, spawnHitFlash } from './Effects';
import { Enemy } from './Enemy';
import { audio } from './AudioManager';

const SLOW_RANGE_SQ = 2.0 * 2.0;
const ATTACK_RANGE_SQ = 0.64;
const HERO_ATTACK_RANGE_SQ = 0.9 * 0.9;
const HERO_DPS: Record<string, number> = {
  infantry: 8,
  cavalry: 12,
  siege: 15,
  boss: 25,
};
const _enemyPos = new THREE.Vector3();
const _heroAttackCd = new WeakMap<Enemy, number>();

export function updateEnemySlow(): void {
  for (const enemy of gs.enemies) {
    if (!enemy.alive) continue;
    let totalSlow = 0;
    _enemyPos.copy(enemy.getPos());
    
    let blockedByFriendly = false;
    for (const f of gs.friendlies) {
      if (!f.alive) continue;
      const dx = _enemyPos.x - f.group.position.x;
      const dz = _enemyPos.z - f.group.position.z;
      if (dx * dx + dz * dz <= 0.9 * 0.9) {
        blockedByFriendly = true;
        break;
      }
    }
    
    if (blockedByFriendly) {
      enemy.isBlocked = true;
      enemy.speed = 0;
      continue;
    }

    totalSlow = Math.max(totalSlow, enemy.temporarySlowAmount);
    
    for (const t of gs.towers) {
      if (t.type === 'wall' && t.getWallHp() > 0) {
        const wx = t.gx + 0.5;
        const wz = t.gy + 0.5;
        const dx = _enemyPos.x - wx;
        const dz = _enemyPos.z - wz;
        if (dx * dx + dz * dz <= SLOW_RANGE_SQ) {
          totalSlow = Math.max(totalSlow, t.getWallSlow());
        }
      }
    }
    
    if (enemy.isBlocked) {
      enemy.speed = 0;
    } else {
      enemy.speed = totalSlow > 0 ? enemy.baseSpeed * (1 - totalSlow) : enemy.baseSpeed;
    }
  }
}

export function updateEnemyWallAttacks(scene: THREE.Scene, camera: THREE.Camera, dt: number): void {
  for (const enemy of gs.enemies) {
    if (!enemy.alive) continue;
    enemy.isBlocked = false; // Reset each frame; re-set below if still hitting a wall
    _enemyPos.copy(enemy.getPos());
    
    for (const t of gs.towers) {
      if (t.type === 'wall' && t.getWallHp() > 0) {
        const wx = t.gx + 0.5;
        const wz = t.gy + 0.5;
        const dx = _enemyPos.x - wx;
        const dz = _enemyPos.z - wz;
        
        if (dx * dx + dz * dz <= ATTACK_RANGE_SQ) {
          enemy.isBlocked = true;
          enemy.speed = 0;
          const dmg = ENEMY_CONFIGS[enemy.type]?.wallDmg ?? 10;
          const destroyed = t.takeWallDamage(dmg);
          t.billboardHp(camera);

          const reflect = t.getWallReflect();
          if (reflect > 0) enemy.takeDamage(reflect);

          if (destroyed) {
            audio.playWallDestruction();
            gs.grid!.free(t.gx, t.gy);
            scene.remove(t.group);
            gs.towers = gs.towers.filter(tw => tw !== t);
            if (gs.selectedTower === t) gs.selectedTower = null;
          }
          break; // Stop checking walls for this enemy
        }
      }
    }

    if (enemy.isBlocked || !gs.hero?.alive) continue;

    const dx = _enemyPos.x - gs.hero.group.position.x;
    const dz = _enemyPos.z - gs.hero.group.position.z;
    if (dx * dx + dz * dz <= HERO_ATTACK_RANGE_SQ) {
      enemy.isBlocked = true;
      enemy.speed = 0;
      const heroPos = gs.hero.group.position;
      enemy.rig.root.rotation.y = Math.atan2(heroPos.x - _enemyPos.x, heroPos.z - _enemyPos.z);

      const cd = Math.max(0, (_heroAttackCd.get(enemy) ?? 0) - dt);
      if (cd <= 0) {
        gs.hero.takeDamage(HERO_DPS[enemy.type] ?? 8);
        const hitPos = _enemyPos.clone().lerp(heroPos, 0.5);
        spawnHitFlash(scene, hitPos);
        _heroAttackCd.set(enemy, 1.0);
      } else {
        _heroAttackCd.set(enemy, cd);
      }
    }
  }
}

export function updateEnemyDeaths(scene: THREE.Scene, camera: THREE.Camera): void {
  for (let i = gs.enemies.length - 1; i >= 0; i--) {
    const enemy = gs.enemies[i];
    if (!enemy.alive) {
      if (enemy.reachedEnd) {
        gs.loseLife(enemy.livesCost);
      } else {
        gs.addGold(enemy.reward);
        spawnFloatingGold(scene, enemy.getPos(), enemy.reward, camera);
        if (enemy.type === 'boss') gs.bossKilled = true;
      }
      gs.removeEnemy(enemy, scene);
    }
  }
}
