/**
 * GameLoop.ts
 * The game loop. Organized into clear sequential steps.
 * Enemy AI extracted to EnemyAI.ts.
 */
import * as THREE from 'three';
import { gs } from './GameState';
import { UIManager } from './UIManager';
import { InputManager } from './InputManager';
import { audio } from './AudioManager';
import type { AudioManager } from './AudioManager';
import { visuals } from './VisualsManager';
import { showPopup, showVictoryPopup } from './HistoricalPopup';
import {
  spawnFloatingGold,
  spawnHitFlash,
  spawnSplashRing,
  updateEffects,
} from './Effects';
import { updateEnemySlow, updateEnemyWallAttacks, updateEnemyDeaths } from './EnemyAI';
import { magicParticles } from './MagicalParticles';
import { ambientDust } from './AmbientDust';

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
    const isModalOpen = () => document.getElementById('game-info-modal')?.classList.contains('visible') ?? false;

    document.addEventListener('visibilitychange', () => {
      gs.paused = document.hidden || isModalOpen();
      if (!gs.paused) this._clock.getDelta();
    });
    window.addEventListener('blur', () => { gs.paused = true; });
    window.addEventListener('focus', () => {
      if (!document.hidden && !isModalOpen() && gs.currentLevel && !gs.gameOver) {
        gs.paused = false;
        this._clock.getDelta();
      }
    });
    this._clock.start();
    this._animate();
  }

  private _animate = (): void => {
    requestAnimationFrame(this._animate);
    const dt = Math.min(this._clock.getDelta(), 0.05);
    const now = performance.now() * 0.001;

    if (!gs.gameOver && !gs.paused && gs.waveMgr && gs.grid) {
      this._updateBuildPhase(dt);
      this._updateWaveCountdown(dt);
      this._updateSpawn(dt);
      this._updateInfantryCooldown(dt);
      updateEnemySlow();
      this._updateEnemies(dt);
      this._updateFriendlies(dt);
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
      gs.grid.update(now, gs.selectedType);
    }

    this._updateHover();
    this._updateCameraSway(now);
    ambientDust?.update(this._camera, now);

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
    if (spawned) {
      gs.addEnemy(spawned, this._scene);
      this._ui.showEnemyIntro(spawned.type);
    }
  }

  private _updateInfantryCooldown(dt: number): void {
    if (gs.infantryCooldown > 0) gs.infantryCooldown = Math.max(0, gs.infantryCooldown - dt);
  }

  private _updateEnemies(dt: number): void {
    let boss: any = null;
    for (const enemy of gs.enemies) {
      enemy.update(dt, this._camera);
      if (enemy.type === 'boss' && enemy.alive) {
        boss = enemy;
      }
    }

    if (boss) {
      this._ui.showBossHp(true);
      this._ui.updateBossHp(boss.hp, boss.maxHp, 'Ancient Devi');
    } else {
      this._ui.showBossHp(false);
    }
  }

  private _updateFriendlies(dt: number): void {
    const wallDistances = this._getWallDistancesFromHome();
    for (const unit of gs.friendlies) {
      const nextWall = wallDistances.find(d => d > unit.distanceFromHome) ?? null;
      unit.update(dt, gs.enemies, nextWall);

      // Enemy contact damage back to infantry (simple collision combat).
      for (const enemy of gs.enemies) {
        if (!enemy.alive) continue;
        const d = enemy.getPos().distanceTo(unit.group.position);
        if (d <= 0.85) {
          unit.takeDamage((enemy.type === 'siege' ? 18 : 8) * dt);
        }
      }
    }

    for (let i = gs.friendlies.length - 1; i >= 0; i--) {
      const unit = gs.friendlies[i];
      if (!unit.alive) {
        this._scene.remove(unit.group);
        gs.friendlies.splice(i, 1);
      }
    }
  }

  private _getWallDistancesFromHome(): number[] {
    const path = gs.grid?.getWorldPath();
    if (!path || path.length < 2) return [];
    const cumul: number[] = [0];
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      total += path[i].distanceTo(path[i + 1]);
      cumul.push(total);
    }
    const toDistanceFromStart = (x: number, z: number): number => {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < path.length; i++) {
        const dx = path[i].x - x;
        const dz = path[i].z - z;
        const d2 = dx * dx + dz * dz;
        if (d2 < bestDist) {
          bestDist = d2;
          bestIdx = i;
        }
      }
      return cumul[bestIdx];
    };
    const fromHome = gs.towers
      .filter(t => t.type === 'wall' && t.getWallHp() > 0)
      .map(t => {
        const fromStart = toDistanceFromStart(t.gx + 0.5, t.gy + 0.5);
        return Math.max(0, total - fromStart);
      })
      .sort((a, b) => a - b);
    return fromHome;
  }

  private _updateTowers(dt: number): void {
    for (const tower of gs.towers) {
      const spawn = tower.update(dt, gs.enemies);
      if (spawn) {
        gs.projectilePool.acquire(
          spawn.origin, spawn.target, spawn.damage, spawn.speed,
          spawn.towerType, spawn.isCrit, spawn.splashRadius,
        );
        if (spawn.towerType === 'archer') {
          this._audio.playArrow();
        }
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
        this._audio.playBuild();
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

  private _currentWaveHasBoss(): boolean {
    const level = gs.currentLevel;
    const waveNum = gs.waveMgr?.waveNum;

    if (!level || !waveNum) return false;

    const currentWave = level.waves.find(w => w.wave_num === waveNum);
    const waveHasBoss = currentWave?.enemies?.some(enemy => enemy.type === 'boss') ?? false;
    const metadataHasBoss = Boolean(level.boss);

    return metadataHasBoss || waveHasBoss;
  }

  private _getBossVictoryText(): string {
    const rawBoss = gs.currentLevel?.boss;

    if (typeof rawBoss === 'string' && rawBoss.trim().length > 0) {
      const formatted = rawBoss
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      return `You defeated ${formatted} and held the line. Colchis stands victorious.`;
    }

    if (gs.currentLevel?.level === 1) {
      return `You defeated the Devi and held the line. Colchis stands victorious.`;
    }

    return `You defeated the enemy champion and held the line. Sakartvelo endures.`;
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

      // Freeze gameplay first.
      gs.gameOver = true;

      // Persist stars before any UI transition.
      gs.saveLevelComplete(true);

      // Refresh the map immediately so background / next navigation is up to date.
      this._ui.screens.refreshLevelSelect();

      const era = Number(gs.currentLevel?.era ?? 0);
      const level = Number(gs.currentLevel?.level ?? 1);
      const stars = gs.getStars();

      const finishVictoryFlow = () => {
        this._audio.playVictory();
        this._ui.screens.showLevelComplete('Level Complete', stars);
      };

      if (this._currentWaveHasBoss() && gs.bossKilled) {
        showVictoryPopup('Boss Defeated!', this._getBossVictoryText(), finishVictoryFlow);
      } else {
        showPopup(era, level, finishVictoryFlow);
      }
    } else {
      gs.waveMgr.clear();
      // No more popups between waves! Just start the build phase.
      if (gs.waveMgr.startBuildPhase()) {
        this._ui.showBuildPhase();
      }
    }
  }

  private _updateCameraSway(time: number): void {
    if (!gs.currentLevel) return;
    const t = time * 0.1;
    this._camera.position.x = gs.cameraBaseX + Math.sin(t) * 0.15;
  }
}
