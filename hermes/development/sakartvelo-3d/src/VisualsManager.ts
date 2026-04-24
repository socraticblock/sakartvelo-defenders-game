import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class VisualsManager {
  private composer: EffectComposer | null = null;

  init(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
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

    // 2. High-Performance Post-Processing (Bloom Only)
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    
    // Subtle bloom for magical elements
    this.composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.35, 0.4, 0.85
    ));

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
}

export const visuals = new VisualsManager();
