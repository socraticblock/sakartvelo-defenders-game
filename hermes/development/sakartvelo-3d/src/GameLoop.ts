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
import { warHorn } from './WarHorn';
import { bossCinematic } from './BossCinematic';
import { shareManager, ShareManager, type ShareCardData } from './ShareManager';
import { screenShake } from './ScreenShake';
import { comboIndicator } from './ComboIndicator';

const BOSS_NAMES: Record<string, string> = {
  devi: 'Devi, Terror of the Mountains',
  devi_chief: 'Devi Chief, Breaker of Gates',
  colchian_dragon: 'Colchian Dragon, Guardian of the Fleece',
  sassanid_general: 'Sassanid General, Fire of the East',
  roman_centurion: 'Roman Centurion, Eagle of Empire',
};

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
  private _wallDistTimer = 0;
  private _cachedWallDistances: number[] = [];
  private _occlusionTimer = 0;
  private _lastLives = -1;
  private _lastLevelKey = '';
  private _commandLinkLine: THREE.Line | null = null;
  private _defeatShown = false;
  private _bossCinematicPlayed = false;
  private _victoryCelebrating = false;
  private _victoryPhase = 0; // 0=none, 1=silence, 2=music, 3=chronicle, 4=share
  private _victoryTimer = 0;

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
    const isModalOpen = () => this._ui?.isBlockingModalOpen?.() ?? false;

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
    const rawDt = Math.min(this._clock.getDelta(), 0.05);
    const now = performance.now() * 0.001;

    // Time Dilation Lerp (smoothly transition to target speed)
    if (gs.currentTimeScale !== gs.targetTimeScale) {
      gs.currentTimeScale += (gs.targetTimeScale - gs.currentTimeScale) * Math.min(rawDt * 10.0, 1.0);
      if (Math.abs(gs.currentTimeScale - gs.targetTimeScale) < 0.01) {
        gs.currentTimeScale = gs.targetTimeScale;
      }
    }

    const dt = rawDt * gs.currentTimeScale;
    gs.gameTime += dt;

    // Boss cinematic runs even when game-over (it controls its own time scale)
    if (bossCinematic.active) {
      bossCinematic.update(rawDt, this._camera);
    }

    if (!gs.gameOver && !gs.paused && gs.waveMgr && gs.grid) {
      gs.levelElapsedTime += dt;
      this._updateBuildPhase(dt);
      this._updateWaveCountdown(dt);
      this._updateSpawn(dt);
      this._updateInfantryCooldown(dt);
      updateEnemySlow();
      this._updateEnemies(dt);
      this._updateFriendlies(dt);
      updateEnemyWallAttacks(this._scene, this._camera, dt);
      this._updateCommandLink(dt);
      this._updateWallSynergies();
      this._updateTowers(dt);
      this._updateProjectiles(dt);
      this._updateHero(dt);
      this._updateHeroUpgrades();
      this._updateHeroBuilding(dt);
      updateEnemyDeaths(this._scene, this._camera);
      this._updateLifeLossFeedback();
      this._checkBossSpawn();
      updateEffects(dt, this._camera);
      magicParticles?.update(dt);
      this._updateWallHpBillboards();
      this._checkWaveComplete();
      comboIndicator.update(dt);
      gs.grid.update(now, gs.selectedType);
      
      // Update WarHorn
      if (!gs.waveMgr.active || gs.waveMgr.inBuildPhase) {
        warHorn.show();
        // Shake it if auto-start is imminent
        const isVibrating = gs.waveMgr.waveNum > 0 && gs.waveCountdownActive && gs.waveCountdown < 3;
        warHorn.update(now, isVibrating);

        if (this._ui.$hornBonus) {
          const pos = warHorn.getScreenPosition(this._camera);
          this._ui.$hornBonus.style.left = `${pos.x}px`;
          this._ui.$hornBonus.style.top = `${pos.y}px`;
        }
      } else {
        warHorn.hide();
      }
    }

    this._updateHover();
    this._updateCameraSway(now);

    // Screen shake offset
    if (screenShake.active) {
      const shakeOffset = screenShake.update(rawDt);
      this._camera.position.add(shakeOffset);
    }

    ambientDust?.update(this._camera, now);

    // Use the visuals manager for high-end rendering
    visuals.render(this._renderer, this._scene, this._camera);

    // Restore camera after shake offset (prevents drift)
    if (screenShake.active) {
      // Shake offset is consumed by render, no need to restore since
      // _updateCameraSway recalculates position each frame
    }
  };

  private _updateHover(): void {
    this._input.updateHover(this._hover, gs.grid, gs.selectedType, gs.gold);
  }

  private _updateBuildPhase(dt: number): void {
    if (!gs.waveMgr?.inBuildPhase) return;
    const remaining = gs.waveMgr.updateBuildPhase(dt);
    if (remaining <= 0) {
      gs.waveMgr.endBuildPhase();
      // Wave 1 doesn't auto-start, others do
      if (gs.waveMgr.waveNum > 0) {
        gs.waveMgr.startNext();
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
      // During boss cinematic, freeze boss movement
      if (bossCinematic.active && enemy.type === 'boss') {
        enemy.speed = 0;
      }
      enemy.update(dt, this._camera);
      if (enemy.type === 'boss' && enemy.alive) {
        boss = enemy;
      }
    }

    if (boss) {
      this._ui.showBossHp(true);
      this._ui.updateBossHp(boss.hp, boss.maxHp, this._getBossDisplayName());
    } else {
      this._ui.showBossHp(false);
    }
  }

  /** Check if a boss just spawned and trigger the cinematic. */
  private _checkBossSpawn(): void {
    if (this._bossCinematicPlayed) return;
    const boss = gs.enemies.find(e => e.type === 'boss' && e.alive);
    if (!boss) return;

    if (this._currentWaveHasBoss()) {
      this._bossCinematicPlayed = true;
      const bossName = this._getBossDisplayName();
      bossCinematic.trigger(
        boss.getPos().clone(),
        bossName,
        () => {
          // Cinematic complete — boss is now active
          audio.playBossRoar();
        },
      );
    }
  }

  private _updateFriendlies(dt: number): void {
    const wallDistances = this._getWallDistancesFromHome(dt);
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

  private _getWallDistancesFromHome(dt: number): number[] {
    this._wallDistTimer -= dt;
    if (this._wallDistTimer > 0) return this._cachedWallDistances;
    this._wallDistTimer = 0.5;

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
    
    this._cachedWallDistances = fromHome;
    return fromHome;
  }

  private _updateTowers(dt: number): void {
    for (const tower of gs.towers) {
      const spawn = tower.update(dt, gs.enemies, gs.towers, gs.commandLinkTower);
      if (spawn) {
        gs.projectilePool.acquire(
          spawn.origin, spawn.target, spawn.damage, spawn.speed,
          spawn.towerType, spawn.isCrit, spawn.splashRadius,
          spawn.commandLinked ?? false,
        );
        if (spawn.towerType === 'archer') {
          this._audio.playArrow();
          if (spawn.isCrit) this._audio.playCriticalHit();
        } else if (spawn.towerType === 'catapult') {
          this._audio.playCatapultLaunch();
        }
      }
    }
    this._updateOcclusion(dt);
  }

  private _updateOcclusion(dt: number): void {
    this._occlusionTimer -= dt;
    if (this._occlusionTimer > 0) return;
    this._occlusionTimer = 0.1; // Run 10 times a second max
    
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
        if (proj.towerType === 'heroMagic') {
          this._audio.playHeroMagicImpact();
        } else if (proj.towerType === 'catapult') {
          this._audio.playCatapultImpact();
        }
        if (proj.splashRadius > 0) {
          spawnSplashRing(this._scene, hitPos, proj.splashRadius);
          for (const enemy of gs.enemies) {
            if (!enemy.alive) continue;
            if (enemy.getPos().distanceTo(hitPos) <= proj.splashRadius) {
              enemy.takeDamage(proj.damage * 0.5);
              if (proj.commandLinked && proj.towerType === 'catapult') {
                enemy.applyTemporarySlow(0.35, 1.0);
              }
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
    const spawn = gs.hero.update(dt, this._camera, gs.enemies);
    if (spawn) {
      const linked = !!gs.commandLinkTower && gs.hero.commandLinked;
      gs.projectilePool.acquire(
        spawn.origin,
        spawn.target,
        spawn.damage,
        spawn.speed,
        'heroMagic',
        false,
        0,
        linked,
      );
      this._audio.playHeroMagicAttack();
    }

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

    if (gs.upgradeTower(t)) this._audio.playTowerUpgrade();
    gs.pendingUpgradeTower = null;
    this._ui.update();
  }

  private _updateCommandLink(dt: number): void {
    const hero = gs.hero;
    if (!hero?.alive) {
      gs.commandLinkTower?.setSynergyActive(false);
      gs.commandLinkTower = null;
      this._setCommandLinkVisible(false);
      return;
    }

    let best = null as typeof gs.commandLinkTower;
    let bestDistSq = 2.5 * 2.5;
    for (const tower of gs.towers) {
      if (tower.type !== 'archer' && tower.type !== 'catapult') continue;
      const dx = tower.group.position.x - hero.group.position.x;
      const dz = tower.group.position.z - hero.group.position.z;
      const distSq = dx * dx + dz * dz;
      if (
        distSq < bestDistSq ||
        (Math.abs(distSq - bestDistSq) < 0.0001 && best?.type === 'catapult' && tower.type === 'archer')
      ) {
        bestDistSq = distSq;
        best = tower;
      }
    }

    if (gs.commandLinkTower && gs.commandLinkTower !== best) {
      gs.commandLinkTower.setSynergyActive(false);
    }
    gs.commandLinkTower = best;
    if (hero) hero.commandLinked = !!best; // Visual feedback on staff orb
    if (best) {
      best.setSynergyActive(true);
      this._updateCommandLinkLine(hero.group.position, best.group.position, dt);
    } else {
      this._setCommandLinkVisible(false);
    }
  }

  private _updateCommandLinkLine(from: THREE.Vector3, to: THREE.Vector3, dt: number): void {
    if (!this._commandLinkLine) {
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const material = new THREE.LineBasicMaterial({ color: 0xd4a017, transparent: true, opacity: 0.42 });
      this._commandLinkLine = new THREE.Line(geometry, material);
      this._scene.add(this._commandLinkLine);
    }

    const positions = this._commandLinkLine.geometry.attributes.position as THREE.BufferAttribute;
    positions.setXYZ(0, from.x, from.y + 1.2, from.z);
    positions.setXYZ(1, to.x, to.y + 0.9, to.z);
    positions.needsUpdate = true;
    this._commandLinkLine.visible = true;

    const pulse = Math.sin(gs.gameTime * 8) * 0.5 + 0.5;
    const mat = this._commandLinkLine.material as THREE.LineBasicMaterial;
    mat.opacity = 0.28 + pulse * 0.18;

    const particlePos = new THREE.Vector3().lerpVectors(from, to, (gs.gameTime * 0.8) % 1);
    particlePos.y += 1.05;
    magicParticles?.spawn(particlePos, new THREE.Vector3(0, 0.08 + dt, 0), 0xd4a017, 0.05, 0.25);
  }

  private _setCommandLinkVisible(visible: boolean): void {
    if (this._commandLinkLine) this._commandLinkLine.visible = visible;
  }

  private _updateWallSynergies(): void {
    const walls = gs.towers.filter(t => t.type === 'wall' && t.getWallHp() > 0);
    for (const wall of walls) {
      const hasNeighbor = walls.some(other => {
        if (other === wall) return false;
        const dx = other.group.position.x - wall.group.position.x;
        const dz = other.group.position.z - wall.group.position.z;
        return dx * dx + dz * dz <= 1.5 * 1.5;
      });
      wall.setBastionActive(hasNeighbor);
    }
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

  private _getBossDisplayName(): string {
    const rawBoss = gs.currentLevel?.boss;
    const id = typeof rawBoss === 'string' ? rawBoss : rawBoss?.id || rawBoss?.type;
    if (id && BOSS_NAMES[id]) return BOSS_NAMES[id];
    if (id) {
      return id
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    return 'Enemy Champion';
  }

  private _updateLifeLossFeedback(): void {
    const level = gs.currentLevel;
    if (!level) {
      this._lastLives = -1;
      this._lastLevelKey = '';
      return;
    }

    const levelKey = `${level.era}-${level.level}`;
    if (this._lastLevelKey !== levelKey) {
      this._lastLevelKey = levelKey;
      this._lastLives = gs.lives;
      this._defeatShown = false;
      this._bossCinematicPlayed = false; // Reset for level restart
      this._victoryCelebrating = false;
      this._victoryPhase = 0;
      return;
    }

    if (this._lastLives >= 0 && gs.lives < this._lastLives) {
      this._audio.playLifeLost();
      this._ui.showLifeLostFeedback();
    }
    this._lastLives = gs.lives;

    if (gs.gameOver && gs.lives <= 0 && !this._defeatShown) {
      this._defeatShown = true;
      this._audio.playGameOver();
      this._ui.screens.showGameOver(false, this._getDefeatText(), 0);
    }
  }

  private _getDefeatText(): string {
    const target = gs.currentLevel?.defense_target || gs.currentLevel?.name || 'Sakartvelo';
    return `${target} has fallen for now. Regroup, rebuild the chokepoints, and let Medea lead the next defense.`;
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

      // ─── Victory Celebration (phased) ───────────────────────
      // Instead of instant popup, run a phased emotional arc.
      gs.gameOver = true;
      gs.targetTimeScale = 0.0; // Freeze
      gs.currentTimeScale = 0.0;
      gs.saveLevelComplete(true);
      this._ui.screens.refreshLevelSelect();

      this._victoryCelebrating = true;
      this._victoryPhase = 1; // Phase 1: Silence
      this._victoryTimer = 0;

      // Pre-render share card while frozen
      const bossName = this._currentWaveHasBoss() ? this._getBossDisplayName() : undefined;
      const shareData = ShareManager.fromGameState(bossName);
      shareManager.renderCard(shareData); // Pre-render to canvas
      (window as any).__lastShareData = shareData;

      // Phase 1 → Phase 2 after 0.8s silence
      window.setTimeout(() => {
        if (!this._victoryCelebrating) return;
        this._victoryPhase = 2; // Phase 2: Music swell
        const stars = gs.getStars();
        this._audio.playVictory();
        this._audio.playVictoryMelody(stars);

        // Pulse towers gold
        for (const t of gs.towers) {
          t.group.traverse(c => {
            if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshLambertMaterial) {
              c.material.emissive.setHex(0x332200);
              window.setTimeout(() => c.material.emissive.setHex(0x000000), 1200);
            }
          });
        }

        // Phase 2 → Phase 3 after 1.5s
        window.setTimeout(() => {
          if (!this._victoryCelebrating) return;
          this._victoryPhase = 3; // Phase 3: Chronicle reveal

          const era = Number(gs.currentLevel?.era ?? 0);
          const level = Number(gs.currentLevel?.level ?? 1);
          const stars = gs.getStars();

          const finishFlow = () => {
            this._ui.screens.showLevelComplete('Level Complete', stars);
            // Add share button to level complete screen
            this._addShareButton();
          };

          if (this._currentWaveHasBoss() && gs.bossKilled) {
            showVictoryPopup('Boss Defeated!', this._getBossVictoryText(), finishFlow);
          } else {
            showPopup(era, level, finishFlow);
          }
        }, 1500);
      }, 800);
    } else {
      gs.waveMgr.clear();
      // No more popups between waves! Just start the build phase.
      if (gs.waveMgr.startBuildPhase()) {
        this._ui.showBuildPhase();
      }
    }
  }

  /** Add a share button to the level complete screen. */
  private _addShareButton(): void {
    const screen = document.getElementById('screen-level-complete');
    if (!screen) return;
    // Remove existing share button if any
    screen.querySelector('.share-btn')?.remove();

    const shareBtn = document.createElement('button');
    shareBtn.className = 'share-btn';
    shareBtn.textContent = 'Share Victory';
    shareBtn.style.cssText = `
      margin-top: 12px; padding: 10px 28px;
      background: linear-gradient(135deg, #d4a017, #8b6914);
      color: #fff; border: none; border-radius: 6px;
      font-size: 16px; font-weight: bold; cursor: pointer;
      text-transform: uppercase; letter-spacing: 1px;
    `;
    shareBtn.addEventListener('click', async () => {
      const data = (window as any).__lastShareData as ShareCardData | undefined;
      if (data) {
        await shareManager.share(data);
      }
    });

    const btnGroup = screen.querySelector('.lc-btn-group');
    if (btnGroup) {
      btnGroup.insertBefore(shareBtn, btnGroup.firstChild);
    } else {
      screen.appendChild(shareBtn);
    }
  }

  private _updateCameraSway(time: number): void {
    if (!gs.currentLevel) return;
    const t = time * 0.1;
    this._camera.position.x = gs.cameraBaseX + Math.sin(t) * 0.15;
  }

  /** Clean up resources when switching levels. Call from main.ts before initLevel. */
  cleanup(): void {
    if (this._commandLinkLine) {
      this._commandLinkLine.geometry.dispose();
      (this._commandLinkLine.material as THREE.Material).dispose();
      this._scene.remove(this._commandLinkLine);
      this._commandLinkLine = null;
    }
    this._bossCinematicPlayed = false;
    this._victoryCelebrating = false;
    this._victoryPhase = 0;
    this._victoryTimer = 0;
    this._defeatShown = false;
    this._waveCompleteProcessed = false;
    bossCinematic.dispose();
    comboIndicator.reset();
  }
}
