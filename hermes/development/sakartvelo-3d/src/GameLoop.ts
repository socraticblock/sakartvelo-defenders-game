/**
 * GameLoop.ts
 * The game loop. Organized into clear sequential steps.
 * Each step is a separate method for readability and debugging.
 */
import * as THREE from 'three';
import { gs } from './GameState';
import { UIManager } from './UIManager';
import { InputManager } from './InputManager';
import { AudioManager } from './AudioManager';
import { showPopup } from './HistoricalPopup';
import {
  spawnFloatingGold,
  spawnHitFlash,
  spawnSplashRing,
  updateEffects,
} from './Effects';
import { ENEMY_CONFIGS } from './types';
import { Tower } from './Tower';

const SLOW_RANGE_SQ = 1.5 * 1.5;    // 1.5² — squared to avoid sqrt
const ATTACK_RANGE_SQ = 0.64;       // 0.8² — enemy attacks walls at this range

export class GameLoop {
  // Three.js refs
  private _renderer!: THREE.WebGLRenderer;
  private _scene!: THREE.Scene;
  private _camera!: THREE.PerspectiveCamera;

  // Managers
  private _ui!: UIManager;
  private _input!: InputManager;
  private _audio!: AudioManager;

  // Visual refs (managed by main.ts)
  private _hover!: THREE.Mesh;
  private _moveRing!: THREE.Mesh;

  // State refs (for closure)
  private _clock = new THREE.Clock();
  private _waveCompleteProcessed = false;

  // Per-frame reusable vectors (zero allocations after init)
  private _wallVec = new THREE.Vector3();
  private _enemyPos = new THREE.Vector3();

  // ─── Init ───────────────────────────────────────────

  init(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    ui: UIManager,
    input: InputManager,
    audio: AudioManager,
    hover: THREE.Mesh,
    moveRing: THREE.Mesh,
  ): void {
    this._renderer = renderer;
    this._scene = scene;
    this._camera = camera;
    this._ui = ui;
    this._input = input;
    this._audio = audio;
    this._hover = hover;
    this._moveRing = moveRing;
  }

  // ─── Start ──────────────────────────────────────────

  start(): void {
    // Tab-away pause
    document.addEventListener('visibilitychange', () => {
      gs.paused = document.hidden;
      if (!gs.paused) this._clock.getDelta(); // discard accumulated delta
    });

    this._clock.start();
    this._animate();
  }

  // ─── Main loop ───────────────────────────────────────

  private _animate = (): void => {
    requestAnimationFrame(this._animate);
    const dt = Math.min(this._clock.getDelta(), 0.05);

    if (!gs.gameOver && !gs.paused && gs.waveMgr && gs.grid) {
      this._updateBuildPhase(dt);
      this._updateWaveCountdown(dt);
      this._updateSpawn(dt);
      this._updateEnemySlow();
      this._updateEnemies();
      this._updateEnemyWallAttacks();
      this._updateTowers();
      this._updateProjectiles();
      this._updateHero(dt);
      this._updateEnemyDeaths();
      updateEffects(dt, this._camera);
      this._updateWallHpBillboards();
      this._checkWaveComplete();
    }

    this._updateHover();
    this._updateCameraSway();
    this._renderer.render(this._scene, this._camera);
  };

  // ─── Step 1: Hover indicator ─────────────────────────

  private _updateHover(): void {
    // Delegate hover mesh update to InputManager — single source of truth
    this._input.updateHover(this._hover, gs.grid, gs.selectedType, gs.gold);
  }

  // ─── Step 2: Build phase countdown ──────────────────

  private _updateBuildPhase(dt: number): void {
    if (!gs.waveMgr?.inBuildPhase) return;
    const remaining = gs.waveMgr.updateBuildPhase(dt);
    // $buildTimer and $buildStartBtn updated in UIManager.update()
    if (remaining <= 0) {
      gs.waveMgr.endBuildPhase();
      this._ui.hideBuildPhase();
      if (gs.waveMgr.startNext()) {
        this._ui.$waveBtn.disabled = true;
        this._ui.$waveBtn.textContent = '⚔ Wave in progress...';
      }
    }
  }

  // ─── Step 3: Wave auto-start countdown ───────────────

  private _updateWaveCountdown(dt: number): void {
    if (!gs.waveCountdownActive || !gs.waveMgr || gs.waveMgr.active) return;
    gs.waveCountdown -= dt;
    if (gs.waveCountdown <= 0) {
      gs.waveCountdownActive = false;
      gs.startWave(0);
    }
  }

  // ─── Step 4: Spawn enemies ──────────────────────────

  private _updateSpawn(dt: number): void {
    const spawned = gs.waveMgr?.update(dt);
    if (spawned) gs.addEnemy(spawned, this._scene);
  }

  // ─── Step 5: Wall slow on enemies ───────────────────

  private _updateEnemySlow(): void {
    // Build wall cache once per frame (avoid per-enemy allocations)
    const wallCache: Array<{ t: Tower; x: number; z: number }> = [];
    for (const t of gs.towers) {
      if (t.type === 'wall' && t.getWallHp() > 0) {
        wallCache.push({ t, x: t.gx + 0.5, z: t.gy + 0.5 });
      }
    }

    for (const enemy of gs.enemies) {
      if (!enemy.alive) continue;
      let totalSlow = 0;
      this._enemyPos.copy(enemy.getPos());
      for (const w of wallCache) {
        this._wallVec.set(w.x, 0, w.z);
        const dx = this._enemyPos.x - w.x;
        const dz = this._enemyPos.z - w.z;
        if (dx * dx + dz * dz <= SLOW_RANGE_SQ) {
          totalSlow = Math.max(totalSlow, w.t.getWallSlow());
        }
      }
      enemy.speed = totalSlow > 0 ? enemy.baseSpeed * (1 - totalSlow) : enemy.baseSpeed;
    }
  }

  // ─── Step 6: Enemy movement ─────────────────────────

  private _updateEnemies(): void {
    for (const enemy of gs.enemies) {
      enemy.update(0, this._camera);
    }
  }

  // ─── Step 7: Enemy attacks walls ────────────────────

  private _updateEnemyWallAttacks(): void {
    const wallCache: Array<{ t: Tower; x: number; z: number }> = [];
    for (const t of gs.towers) {
      if (t.type === 'wall' && t.getWallHp() > 0) {
        wallCache.push({ t, x: t.gx + 0.5, z: t.gy + 0.5 });
      }
    }

    for (const enemy of gs.enemies) {
      if (!enemy.alive) continue;
      this._enemyPos.copy(enemy.getPos());
      for (let wi = 0; wi < wallCache.length; wi++) {
        const w = wallCache[wi];
        if (w.t.getWallHp() <= 0) continue;
        const dx = this._enemyPos.x - w.x;
        const dz = this._enemyPos.z - w.z;
        if (dx * dx + dz * dz <= ATTACK_RANGE_SQ) {
          const dmg = ENEMY_CONFIGS[enemy.type]?.wallDmg ?? 10;
          const destroyed = w.t.takeWallDamage(dmg, this._camera);
          w.t.billboardHp(this._camera);

          const reflect = w.t.getWallReflect();
          if (reflect > 0) enemy.takeDamage(reflect);

          if (destroyed) {
            gs.grid!.free(w.t.gx, w.t.gy);
            this._scene.remove(w.t.group);
            gs.towers = gs.towers.filter(t => t !== w.t);
            wallCache.splice(wi, 1);
            if (gs.selectedTower === w.t) gs.selectedTower = null;
          }
          break; // one wall attack per frame per enemy
        }
      }
    }
  }

  // ─── Step 8: Tower targeting + firing ────────────────

  private _updateTowers(): void {
    for (const tower of gs.towers) {
      const spawn = tower.update(0, gs.enemies);
      if (spawn) {
        gs.projectilePool.acquire(
          spawn.origin,
          spawn.target,
          spawn.damage,
          spawn.speed,
          spawn.towerType,
          spawn.isCrit,
          spawn.splashRadius,
        );
      }
    }
  }

  // ─── Step 9: Projectile update + hits ───────────────

  private _updateProjectiles(): void {
    for (const proj of gs.projectilePool.alive) {
      proj.update(0);
      if (!proj.alive) {
        const hitPos = proj.mesh.position.clone();
        if (proj.splashRadius > 0) {
          spawnSplashRing(this._scene, hitPos, proj.splashRadius);
          for (const enemy of gs.enemies) {
            if (!enemy.alive) continue;
            if (enemy.getPos().distanceTo(hitPos) <= proj.splashRadius) {
              enemy.takeDamage(proj.damage * 0.5);
            }
          }
        } else {
          spawnHitFlash(this._scene, hitPos);
        }
        gs.projectilePool.release(proj);
      }
    }
  }

  // ─── Step 10: Hero update + move ring ────────────────

  private _updateHero(dt: number): void {
    if (!gs.hero) return;
    gs.hero.update(dt, this._camera, gs.enemies);

    const mt = gs.hero.getMoveTarget();
    if (mt) {
      this._moveRing.visible = true;
      this._moveRing.position.set(mt.x, 0.02, mt.z);
      const t = performance.now() * 0.003;
      this._moveRing.scale.setScalar(0.9 + Math.sin(t) * 0.1);
    } else {
      this._moveRing.visible = false;
    }
  }

  // ─── Step 11: Enemy deaths ───────────────────────────

  private _updateEnemyDeaths(): void {
    for (let i = gs.enemies.length - 1; i >= 0; i--) {
      const enemy = gs.enemies[i];
      if (!enemy.alive) {
        if (enemy.reachedEnd) {
          gs.loseLife(enemy.livesCost);
          // Flash lives red
        } else {
          gs.addGold(enemy.reward);
          spawnFloatingGold(this._scene, enemy.getPos(), enemy.reward, this._camera);
        }
        gs.removeEnemy(enemy, this._scene);
      }
    }
  }

  // ─── Step 12: Wall HP billboards ───────────────────

  private _updateWallHpBillboards(): void {
    for (const t of gs.towers) {
      if (t.type === 'wall') t.billboardHp(this._camera);
    }
  }

  // ─── Step 13: Wave complete ─────────────────────────

  private _checkWaveComplete(): void {
    if (!gs.waveMgr?.active || !gs.waveMgr.isWaveDone()) {
      this._waveCompleteProcessed = false;
      return;
    }
    if (this._waveCompleteProcessed) return;
    this._waveCompleteProcessed = true;

    const bonus = gs.getWaveBonus(gs.waveMgr.waveNum);
    gs.addGold(bonus);

    if (gs.waveMgr.waveNum >= gs.waveMgr.totalWaves) {
      // Final wave cleared
      gs.waveMgr.clear();
      const era = gs.currentLevel?.era ?? 0;
      const lvl = gs.currentLevel?.level ?? 1;
      showPopup(era, lvl, () => {
        gs.gameOver = true;
        this._ui.showGameOver(true);
        this._ui.showLevelComplete(gs.getStars());
      });
    } else {
      // Between waves
      gs.waveMgr.clear();
      const nextWaveNum = (gs.waveMgr?.waveNum ?? 0) + 1;
      showPopup(gs.currentLevel?.era ?? 0, nextWaveNum, () => {
        if (!gs.waveMgr) return;
        if (gs.waveMgr.startBuildPhase()) {
          this._ui.showBuildPhase();
        }
      });
    }
  }

  // ─── Camera sway ───────────────────────────────────

  private _updateCameraSway(): void {
    if (!gs.currentLevel) return;
    const t = performance.now() * 0.0001;
    this._camera.position.x = gs.cameraBaseX + Math.sin(t) * 0.15;
  }
}
