import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class VisualsManager {
  private composer: EffectComposer | null = null;
  private quality: 'low' | 'medium' | 'high' = 'medium';

  init(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.quality = this._loadQuality();
    renderer.setPixelRatio(this.quality === 'high' ? Math.min(devicePixelRatio, 2) : this.quality === 'medium' ? Math.min(devicePixelRatio, 1.5) : 1);

    // 1. Procedural Environment Map (God-tier reflections)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#1a2a1a');
    grad.addColorStop(0.5, '#d4a017'); 
    grad.addColorStop(1, '#050505');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    
    const envTexture = new THREE.CanvasTexture(canvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = pmremGenerator.fromEquirectangular(envTexture).texture;

    this._installCinematicOverlay();

    if (this.quality !== 'low') {
      this.composer = new EffectComposer(renderer);
      this.composer.addPass(new RenderPass(scene, camera));
      
      this.composer.addPass(new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.quality === 'high' ? 0.42 : 0.28,
        0.4,
        0.85,
      ));
    }

    window.addEventListener('resize', () => {
      this.composer?.setSize(window.innerWidth, window.innerHeight);
    });
  }

  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    if (this.composer) {
      this.composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  setQuality(value: 'low' | 'medium' | 'high'): void {
    this.quality = value;
    localStorage.setItem('sakartvelo_visual_quality', value);
    location.reload();
  }

  getQuality(): 'low' | 'medium' | 'high' {
    return this.quality;
  }

  private _loadQuality(): 'low' | 'medium' | 'high' {
    const saved = localStorage.getItem('sakartvelo_visual_quality');
    if (saved === 'low' || saved === 'medium' || saved === 'high') return saved;
    return window.matchMedia('(max-width: 768px)').matches ? 'low' : 'medium';
  }

  private _installCinematicOverlay(): void {
    if (document.getElementById('visual-vignette')) return;
    const overlay = document.createElement('div');
    overlay.id = 'visual-vignette';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 3; pointer-events: none;
      background:
        radial-gradient(circle at center, transparent 48%, rgba(0,0,0,${this.quality === 'low' ? 0.18 : 0.28}) 100%),
        linear-gradient(180deg, rgba(212,160,23,0.05), rgba(38,18,60,0.05));
      mix-blend-mode: multiply;
    `;
    document.body.appendChild(overlay);

    if (this.quality === 'high') {
      const grain = document.createElement('div');
      grain.id = 'visual-grain';
      grain.style.cssText = `
        position: fixed; inset: 0; z-index: 4; pointer-events: none; opacity: 0.08;
        background-image: repeating-radial-gradient(circle at 17% 23%, rgba(255,255,255,0.9) 0 1px, transparent 1px 3px);
        mix-blend-mode: overlay;
      `;
      document.body.appendChild(grain);
    }
  }
}

export const visuals = new VisualsManager();
