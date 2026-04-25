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
import { visuals } from './VisualsManager';
import { showPopup } from './HistoricalPopup';
import {
  spawnFloatingGold,
  spawnHitFlash,
  spawnSplashRing,
  updateEffects,
} from './Effects';
import { updateEnemySlow, updateEnemyWallAttacks, updateEnemyDeaths } from './EnemyAI';
import { magicParticles } from './MagicalParticles';

export class GameLoop {
  private readonly _UPGRADE_RANGE = 1.6;
  private _renderer!: THREE.WebGLRenderer;
  private _scene!: THREE.Scene;
  private _camera!: THREE.PerspectiveCamera;
  private _ui!: UIManager;
  private _input!: InputManager;
  private _audio!: AudioManager;
  private _hover!: THREE.Group;
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
    hover: THREE.Group,
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
      this._updateEnemies(dt);
      updateEnemyWallAttacks(this._scene, this._camera);
      this._updateTowers(dt);
      this._updateProjectiles(dt);
      this._updateHero(dt);
      this._updateHeroUpgrades();
      this._updateHeroBuilding(dt);
      updateEnemyDeaths(this._scene, this._camera);
      updateEffects(dt, this._camera);
      magicParticles?.update(dt);
      this._updateWallHpBillboards();
      this._checkWaveComplete();
      gs.grid.update(performance.now() * 0.001, gs.selectedType !== null);
    }

    this._updateHover();
    this._updateCameraSway();

    // Use the visuals manager for high-end rendering
    visuals.render(this._renderer, this._scene, this._camera);
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

  private _updateEnemies(dt: number): void {
    for (const enemy of gs.enemies) {
      enemy.update(dt, this._camera);
    }
  }

  private _updateTowers(dt: number): void {
    for (const tower of gs.towers) {
      const spawn = tower.update(dt, gs.enemies);
      if (spawn) {
        gs.projectilePool.acquire(
          spawn.origin, spawn.target, spawn.damage, spawn.speed,
          spawn.towerType, spawn.isCrit, spawn.splashRadius,
        );
      }
    }
    this._updateOcclusion();
  }

  private _updateOcclusion(): void {
    // 1. Get units that need visibility (Hero + enemies)
    const targets: THREE.Vector3[] = [];
    if (gs.hero) targets.push(gs.hero.group.position);
    gs.enemies.slice(0, 15).forEach(e => targets.push(e.group.position));

    const tempV = new THREE.Vector3();
    const towerScreenPos = new THREE.Vector2();
    const targetScreenPos = new THREE.Vector2();

    for (const tower of gs.towers) {
      let occluded = false;

      // Get tower screen position (center-ish)
      tempV.copy(tower.group.position).y += 0.8; // Offset to tower mid-height
      tempV.project(this._camera);
      towerScreenPos.set(tempV.x, tempV.y);

      for (const targetPos of targets) {
        // Project target to screen
        tempV.copy(targetPos).y += 0.2; // Offset to unit head
        tempV.project(this._camera);
        targetScreenPos.set(tempV.x, tempV.y);

        // Calculate screen-space distance
        const distSq = towerScreenPos.distanceToSquared(targetScreenPos);

        // If target is "behind" in world Z and close on screen
        const isBehind = targetPos.z < tower.group.position.z;
        if (isBehind && distSq < 0.04) { // 0.04 is ~20% of screen width squared
          occluded = true;
          break;
        }
      }

      // Smoothly transition opacity
      const targetOpacity = occluded ? 0.3 : 1.0;
      tower.group.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          const mat = Array.isArray(child.material) ? child.material[0] : child.material;
          if (mat) {
            mat.transparent = true;
            mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
          }
        }
      });
    }
  }

  private _updateProjectiles(dt: number): void {
    for (const proj of gs.projectilePool.alive) {
      proj.update(dt);
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

  private _updateHeroBuilding(dt: number): void {
    if (!gs.hero || !gs.hero.pendingBuild) return;

    // Check if build is complete (using 1.5s as base build time)
    if (gs.hero.buildTimer >= 1.5) {
      const b = gs.hero.pendingBuild;
      const placed = gs.placeTower(b.type, b.gx, b.gy, b.isPath, this._scene);
      if (placed) {
        // Only clear pending build if placement was successful
        gs.hero.pendingBuild = null;
        gs.hero.buildTimer = 0;
        // Placement mode is cleared on grid click in main (ghost teardown); batch repeat uses UI.
      } else {
        // Placement failed (e.g. not enough gold anymore?), cancel
        gs.hero.pendingBuild = null;
        gs.hero.buildTimer = 0;
        gs.selectedType = null;
      }
      this._ui.update();
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

  private _updateHeroUpgrades(): void {
    if (!gs.hero || !gs.pendingUpgradeTower) return;
    const t = gs.pendingUpgradeTower;

    // Tower was sold or removed while walking.
    if (!gs.towers.includes(t)) {
      gs.pendingUpgradeTower = null;
      return;
    }

    const targetPos = new THREE.Vector3(t.gx + 0.5, 0, t.gy + 0.5);
    const dist = gs.hero.getPos().distanceTo(targetPos);
    if (dist > this._UPGRADE_RANGE) return;

    gs.upgradeTower(t);
    gs.pendingUpgradeTower = null;
    this._ui.update();
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
      // Victory! Show popup only at the very end of the level
      showPopup(gs.currentLevel?.era ?? 0, gs.currentLevel?.level ?? 1, () => {
        gs.gameOver = true;
        this._ui.screens.showGameOver(true, "Victory!", gs.getStars());
        this._ui.screens.showLevelComplete("Level Complete", gs.getStars());
      });
    } else {
      gs.waveMgr.clear();
      // No more popups between waves! Just start the build phase.
      if (gs.waveMgr.startBuildPhase()) {
        this._ui.showBuildPhase();
      }
    }
  }

  private _updateCameraSway(): void {
    if (!gs.currentLevel) return;
    const t = performance.now() * 0.0001;
    this._camera.position.x = gs.cameraBaseX + Math.sin(t) * 0.15;
  }
}
