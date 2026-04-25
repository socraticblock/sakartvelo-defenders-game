/**
 * EnemyAI.ts
 * Enemy movement, wall attacks, and death handling.
 * Extracted from GameLoop.ts to keep it under 300 lines.
 */
import * as THREE from 'three';
import { gs } from './GameState';
import { ENEMY_CONFIGS } from './types';
import { Tower } from './Tower';
import { spawnFloatingGold } from './Effects';

const SLOW_RANGE_SQ = 1.5 * 1.5;
const ATTACK_RANGE_SQ = 0.64;

const _wallVec = new THREE.Vector3();
const _enemyPos = new THREE.Vector3();

export function updateEnemySlow(): void {
  const wallCache: Array<{ t: Tower; x: number; z: number }> = [];
  for (const t of gs.towers) {
    if (t.type === 'wall' && t.getWallHp() > 0) {
      wallCache.push({ t, x: t.gx + 0.5, z: t.gy + 0.5 });
    }
  }

  for (const enemy of gs.enemies) {
    if (!enemy.alive) continue;
    let totalSlow = 0;
    _enemyPos.copy(enemy.getPos());
    for (const w of wallCache) {
      _wallVec.set(w.x, 0, w.z);
      const dx = _enemyPos.x - w.x;
      const dz = _enemyPos.z - w.z;
      if (dx * dx + dz * dz <= SLOW_RANGE_SQ) {
        totalSlow = Math.max(totalSlow, w.t.getWallSlow());
      }
    }
    if (enemy.isBlocked) {
      enemy.speed = 0;
    } else {
      enemy.speed = totalSlow > 0 ? enemy.baseSpeed * (1 - totalSlow) : enemy.baseSpeed;
    }
  }
}

export function updateEnemyWallAttacks(scene: THREE.Scene, camera: THREE.Camera): void {
  const wallCache: Array<{ t: Tower; x: number; z: number }> = [];
  for (const t of gs.towers) {
    if (t.type === 'wall' && t.getWallHp() > 0) {
      wallCache.push({ t, x: t.gx + 0.5, z: t.gy + 0.5 });
    }
  }

  for (const enemy of gs.enemies) {
    if (!enemy.alive) continue;
    enemy.isBlocked = false; // Reset each frame; re-set below if still hitting a wall
    _enemyPos.copy(enemy.getPos());
    for (let wi = 0; wi < wallCache.length; wi++) {
      const w = wallCache[wi];
      if (w.t.getWallHp() <= 0) continue;
      const dx = _enemyPos.x - w.x;
      const dz = _enemyPos.z - w.z;
      if (dx * dx + dz * dz <= ATTACK_RANGE_SQ) {
        enemy.isBlocked = true;
        enemy.speed = 0;
        const dmg = ENEMY_CONFIGS[enemy.type]?.wallDmg ?? 10;
        const destroyed = w.t.takeWallDamage(dmg);
        w.t.billboardHp(camera);

        const reflect = w.t.getWallReflect();
        if (reflect > 0) enemy.takeDamage(reflect);

        if (destroyed) {
          gs.grid!.free(w.t.gx, w.t.gy);
          scene.remove(w.t.group);
          gs.towers = gs.towers.filter(t => t !== w.t);
          wallCache.splice(wi, 1);
          if (gs.selectedTower === w.t) gs.selectedTower = null;
        }
        break;
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
