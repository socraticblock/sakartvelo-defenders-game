/**
 * GameLoop.ts
 * The game loop. Organized into clear sequential steps.
 * Enemy AI extracted to EnemyAI.ts.
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
import { updateEnemySlow, updateEnemyWallAttacks, updateEnemyDeaths } from './EnemyAI';

export class GameLoop {
  private _renderer!: THREE.WebGLRenderer;
  private _scene!: THREE.Scene;
  private _camera!: THREE.PerspectiveCamera;
  private _ui!: UIManager;
  private _input!: InputManager;
  private _audio!: AudioManager;
  private _hover!: THREE.Mesh;
  private _moveRing!: THREE.Mesh;

  private _clock = new THREE.Clock();
  private _waveCompleteProcessed = false;

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

  start(): void {
    document.addEventListener('visibilitychange', () => {
      gs.paused = document.hidden;
      if (!gs.paused) this._clock.getDelta();
    });
    this._clock.start();
    this._animate();
  }

  private _animate = (): void => {
    requestAnimationFrame(this._animate);
    const dt = Math.min(this._clock.getDelta(), 0.05);

    if (!gs.gameOver && !gs.paused && gs.waveMgr && gs.grid) {
      this._updateBuildPhase(dt);
      this._updateWaveCountdown(dt);
      this._updateSpawn(dt);
      updateEnemySlow();
      this._updateEnemies();
      updateEnemyWallAttacks(this._scene, this._camera);
      this._updateTowers();
      this._updateProjectiles();
      this._updateHero(dt);
      updateEnemyDeaths(this._scene, this._camera);
      updateEffects(dt, this._camera);
      this._updateWallHpBillboards();
      this._checkWaveComplete();
    }

    this._updateHover();
    this._updateCameraSway();
    this._renderer.render(this._scene, this._camera);
  };

  private _updateHover(): void {
    this._input.updateHover(this._hover, gs.grid, gs.selectedType, gs.gold);
  }

  private _updateBuildPhase(dt: number): void {
    if (!gs.waveMgr?.inBuildPhase) return;
    const remaining = gs.waveMgr.updateBuildPhase(dt);
    if (remaining <= 0) {
      gs.waveMgr.endBuildPhase();
      this._ui.hideBuildPhase();
      if (gs.waveMgr.startNext()) {
        this._ui.$waveBtn.disabled = true;
        this._ui.$waveBtn.textContent = '⚔ Wave in progress...';
      }
    }
  }

  private _updateWaveCountdown(dt: number): void {
    if (!gs.waveCountdownActive || !gs.waveMgr || gs.waveMgr.active) return;
    gs.waveCountdown -= dt;
    if (gs.waveCountdown <= 0) {
      gs.waveCountdownActive = false;
      gs.startWave(0);
    }
  }

  private _updateSpawn(dt: number): void {
    const spawned = gs.waveMgr?.update(dt);
    if (spawned) gs.addEnemy(spawned, this._scene);
  }

  private _updateEnemies(): void {
    for (const enemy of gs.enemies) {
      enemy.update(dt, this._camera);
    }
  }

  private _updateTowers(): void {
    for (const tower of gs.towers) {
      const spawn = tower.update(dt, gs.enemies);
      if (spawn) {
        gs.projectilePool.acquire(
          spawn.origin, spawn.target, spawn.damage, spawn.speed,
          spawn.towerType, spawn.isCrit, spawn.splashRadius,
        );
      }
    }
  }

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

  private _updateWallHpBillboards(): void {
    for (const t of gs.towers) {
      if (t.type === 'wall') t.billboardHp(this._camera);
    }
  }

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
      gs.waveMgr.clear();
      showPopup(gs.currentLevel?.era ?? 0, gs.currentLevel?.level ?? 1, () => {
        gs.gameOver = true;
        this._ui.screens.showGameOver(true);
        this._ui.screens.showLevelComplete(gs.getStars());
      });
    } else {
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

  private _updateCameraSway(): void {
    if (!gs.currentLevel) return;
    const t = performance.now() * 0.0001;
    this._camera.position.x = gs.cameraBaseX + Math.sin(t) * 0.15;
  }
}
