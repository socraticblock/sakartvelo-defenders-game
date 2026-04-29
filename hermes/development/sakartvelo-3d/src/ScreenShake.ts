/**
 * ScreenShake.ts
 * Camera shake for dramatic impact moments — boss death, wall destruction, life lost.
 * Mobile-friendly: uses gentle pulses, not violent shaking.
 */
import * as THREE from 'three';

export class ScreenShake {
  private _intensity = 0;
  private _duration = 0;
  private _elapsed = 0;
  private _basePos = new THREE.Vector3();

  /** Trigger a shake. intensity 0–1, duration in seconds. */
  trigger(intensity: number, duration: number): void {
    // Only override if new shake is stronger
    if (intensity > this._intensity) {
      this._intensity = intensity;
      this._duration = duration;
      this._elapsed = 0;
    }
  }

  /** Call each frame. Returns offset to add to camera position. */
  update(dt: number): THREE.Vector3 {
    if (this._elapsed >= this._duration) {
      this._intensity = 0;
      return new THREE.Vector3();
    }

    this._elapsed += dt;
    const t = 1 - (this._elapsed / this._duration); // Fade out over time
    const currentIntensity = this._intensity * t * t; // Quadratic falloff

    // Subtle XY offset, no Z (no zoom jumping)
    const offsetX = (Math.random() - 0.5) * 2 * currentIntensity * 0.3;
    const offsetY = (Math.random() - 0.5) * 2 * currentIntensity * 0.15;

    return new THREE.Vector3(offsetX, offsetY, 0);
  }

  get active(): boolean {
    return this._elapsed < this._duration;
  }
}

export const screenShake = new ScreenShake();
