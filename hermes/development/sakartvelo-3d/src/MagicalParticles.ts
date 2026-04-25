import * as THREE from 'three';

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

export class MagicalParticles {
  private group: THREE.Group = new THREE.Group();
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  
  private MAX_PARTICLES = 2000;
  private positions = new Float32Array(this.MAX_PARTICLES * 3);
  private colors = new Float32Array(this.MAX_PARTICLES * 3);
  private sizes = new Float32Array(this.MAX_PARTICLES);

  constructor(scene: THREE.Scene, texturePath: string) {
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const loader = new THREE.TextureLoader();
    const texture = loader.load(texturePath);

    this.material = new THREE.PointsMaterial({
      size: 0.15,
      map: texture,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.8
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  spawn(pos: THREE.Vector3, vel: THREE.Vector3, color: number, size: number, life: number) {
    if (this.particles.length >= this.MAX_PARTICLES) return;
    
    this.particles.push({
      pos: pos.clone(),
      vel: vel.clone(),
      color: new THREE.Color(color),
      size,
      life,
      maxLife: life
    });
  }

  spawnBurst(pos: THREE.Vector3, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2.0,
        Math.random() * 2.0,
        (Math.random() - 0.5) * 2.0
      );
      this.spawn(pos, vel, color, 0.05 + Math.random() * 0.1, 0.5 + Math.random() * 0.5);
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.pos.add(p.vel.clone().multiplyScalar(dt));
      p.vel.y -= 2.0 * dt; // Gravity
      p.vel.multiplyScalar(0.98); // Air resistance
    }

    // Update buffers
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const ratio = p.life / p.maxLife;
        
        this.positions[i * 3] = p.pos.x;
        this.positions[i * 3 + 1] = p.pos.y;
        this.positions[i * 3 + 2] = p.pos.z;

        this.colors[i * 3] = p.color.r * ratio;
        this.colors[i * 3 + 1] = p.color.g * ratio;
        this.colors[i * 3 + 2] = p.color.b * ratio;

        this.sizes[i] = p.size * ratio;
      } else {
        this.positions[i * 3] = 0;
        this.positions[i * 3 + 1] = -100; // Far away
        this.positions[i * 3 + 2] = 0;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    // this.geometry.attributes.size.needsUpdate = true; // Note: size in PointsMaterial is uniform unless using ShaderMaterial
  }
}

export let magicParticles: MagicalParticles;

export function initMagicParticles(scene: THREE.Scene, texturePath: string) {
  magicParticles = new MagicalParticles(scene, texturePath);
}
