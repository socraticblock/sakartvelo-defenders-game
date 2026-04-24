import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

export class VisualsManager {
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;

  init(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    // 1. Setup Environment Map (for PBR reflections)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Create a procedural "Golden Hour" environment
    const skyColor = new THREE.Color(0x151d15);
    const groundColor = new THREE.Color(0x050505);
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#1a2a1a');
    grad.addColorStop(0.5, '#d4a017'); // Horizon glow
    grad.addColorStop(1, '#050505');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    
    const envTexture = new THREE.CanvasTexture(canvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = pmremGenerator.fromEquirectangular(envTexture).texture;

    // 2. Setup Post-Processing (Bloom)
    const renderScene = new RenderPass(scene, camera);
    
    // UnrealBloomPass parameters: (resolution, strength, radius, threshold)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4,  // Strength: Subtle glow
      0.5,  // Radius: Tight bloom
      0.85  // Threshold: Only very bright things (gold/emissive) glow
    );

    this.composer = new EffectComposer(renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(this.bloomPass);

    // Handle Resize
    window.addEventListener('resize', () => {
      this.composer?.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // Called every frame by GameLoop
  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    if (this.composer) {
      this.composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  setBloomStrength(val: number): void {
    if (this.bloomPass) this.bloomPass.strength = val;
  }
}

export const visuals = new VisualsManager();
