/**
 * BossCinematic.ts
 * 2.5-second boss entrance cinematic.
 *
 * Phase 1 (0–0.8s): Warning — BGM dips, drum hit, vignette darkens.
 * Phase 2 (0.8–2.2s): Name reveal — gold text overlay, boss frozen,
 *   slow-mo 0.15×, camera lerps toward boss, particle ring.
 * Phase 3 (2.2–2.5s): Break — unfreeze, time scale back to 1.0,
 *   vignette fades, text fades out.
 */
import * as THREE from 'three';
import { gs } from './GameState';
import { audio } from './AudioManager';
import { magicParticles } from './MagicalParticles';

const CINEMATIC_DURATION = 2.5;
const PHASE1_END = 0.8;
const PHASE2_END = 2.2;

export class BossCinematic {
  private _active = false;
  private _elapsed = 0;
  private _bossPos = new THREE.Vector3();
  private _bossName = '';
  private _onComplete: (() => void) | null = null;

  // DOM overlays (created lazily)
  private _vignette: HTMLDivElement | null = null;
  private _nameOverlay: HTMLDivElement | null = null;

  // Camera lerp
  private _camStartPos = new THREE.Vector3();
  private _camTargetPos = new THREE.Vector3();

  // Particle ring state
  private _ringSpawned = false;

  get active(): boolean { return this._active; }

  /** Trigger the cinematic. bossPos in world space, bossName display string. */
  trigger(bossPos: THREE.Vector3, bossName: string, onComplete: () => void): void {
    if (this._active) return;
    this._active = true;
    this._elapsed = 0;
    this._bossPos.copy(bossPos);
    this._bossName = bossName;
    this._onComplete = onComplete;
    this._ringSpawned = false;

    // Store camera start for lerp
    const cam = (window as any).__camera as THREE.PerspectiveCamera | undefined;
    if (cam) this._camStartPos.copy(cam.position);

    // Compute camera target: pull slightly toward boss
    if (cam) {
      this._camTargetPos.copy(cam.position);
      const dx = bossPos.x - cam.position.x;
      const dz = bossPos.z - cam.position.z;
      // Move camera 15% toward boss on XZ
      this._camTargetPos.x += dx * 0.15;
      this._camTargetPos.z += dz * 0.15;
    }

    // Phase 1: Audio warning
    audio.playBossEntrance();
  }

  /** Call from game loop with raw (unscaled) dt. */
  update(rawDt: number, camera: THREE.PerspectiveCamera): void {
    if (!this._active) return;
    this._elapsed += rawDt;

    const t = this._elapsed;

    // ─── Time scale ─────────────────────────────────────────
    if (t < PHASE1_END) {
      // Phase 1: ramp down to 0.15×
      gs.targetTimeScale = 1.0 - (1.0 - 0.15) * (t / PHASE1_END);
    } else if (t < PHASE2_END) {
      // Phase 2: hold at 0.15×
      gs.targetTimeScale = 0.15;
    } else if (t < CINEMATIC_DURATION) {
      // Phase 3: ramp back to 1.0
      const phase3T = (t - PHASE2_END) / (CINEMATIC_DURATION - PHASE2_END);
      gs.targetTimeScale = 0.15 + 0.85 * phase3T;
    }

    // ─── Vignette ───────────────────────────────────────────
    this._ensureVignette();
    if (this._vignette) {
      let opacity = 0;
      if (t < PHASE1_END) {
        opacity = 0.5 * (t / PHASE1_END);
      } else if (t < PHASE2_END) {
        opacity = 0.5;
      } else {
        opacity = 0.5 * (1 - (t - PHASE2_END) / (CINEMATIC_DURATION - PHASE2_END));
      }
      this._vignette.style.opacity = String(opacity);
    }

    // ─── Camera lerp ────────────────────────────────────────
    if (t >= PHASE1_END && t < PHASE2_END) {
      const lerpT = (t - PHASE1_END) / (PHASE2_END - PHASE1_END);
      camera.position.lerpVectors(this._camStartPos, this._camTargetPos, lerpT * 0.3);
    }

    // ─── Name reveal ────────────────────────────────────────
    this._ensureNameOverlay();
    if (this._nameOverlay) {
      if (t >= PHASE1_END && t < PHASE2_END) {
        this._nameOverlay.style.opacity = '1';
        this._nameOverlay.textContent = this._bossName;
      } else if (t >= PHASE2_END) {
        const fadeT = (t - PHASE2_END) / (CINEMATIC_DURATION - PHASE2_END);
        this._nameOverlay.style.opacity = String(Math.max(0, 1 - fadeT * 2));
      }
    }

    // ─── Particle ring ──────────────────────────────────────
    if (t >= PHASE1_END + 0.2 && !this._ringSpawned) {
      this._ringSpawned = true;
      // Spawn a ring of golden particles around the boss
      const count = 24;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const r = 1.2;
        const px = this._bossPos.x + Math.cos(angle) * r;
        const pz = this._bossPos.z + Math.sin(angle) * r;
        magicParticles?.spawn(
          new THREE.Vector3(px, 0.3, pz),
          new THREE.Vector3(0, 0.6 + Math.random() * 0.4, 0),
          0xd4a017, // Gold
          0.06,
          0.6 + Math.random() * 0.4,
        );
      }
    }

    // ─── Completion ─────────────────────────────────────────
    if (t >= CINEMATIC_DURATION) {
      this._cleanup();
    }
  }

  private _cleanup(): void {
    this._active = false;
    gs.targetTimeScale = 1.0;
    gs.currentTimeScale = 1.0;

    if (this._vignette) {
      this._vignette.style.opacity = '0';
    }
    if (this._nameOverlay) {
      this._nameOverlay.style.opacity = '0';
    }

    this._onComplete?.();
    this._onComplete = null;
  }

  private _ensureVignette(): void {
    if (this._vignette) return;
    let el = document.getElementById('boss-cinematic-vignette');
    if (!el) {
      el = document.createElement('div');
      el.id = 'boss-cinematic-vignette';
      el.style.cssText = `
        position:fixed; inset:0; z-index:900;
        pointer-events:none;
        background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%);
        opacity:0; transition: opacity 0.1s;
      `;
      document.body.appendChild(el);
    }
    this._vignette = el as HTMLDivElement;
  }

  private _ensureNameOverlay(): void {
    if (this._nameOverlay) return;
    let el = document.getElementById('boss-cinematic-name');
    if (!el) {
      el = document.createElement('div');
      el.id = 'boss-cinematic-name';
      el.style.cssText = `
        position:fixed; top:35%; left:50%; transform:translate(-50%,-50%);
        z-index:910; pointer-events:none;
        font-family:serif; font-size:clamp(24px,5vw,48px); font-weight:bold;
        color:#d4a017; text-shadow: 0 0 20px rgba(212,160,23,0.6), 0 2px 8px rgba(0,0,0,0.9);
        letter-spacing:3px; text-transform:uppercase;
        opacity:0; transition: opacity 0.3s;
      `;
      document.body.appendChild(el);
    }
    this._nameOverlay = el as HTMLDivElement;
  }

  /** Call on level cleanup to remove DOM elements. */
  dispose(): void {
    this._vignette?.remove();
    this._nameOverlay?.remove();
    this._vignette = null;
    this._nameOverlay = null;
    this._active = false;
  }
}

export const bossCinematic = new BossCinematic();
