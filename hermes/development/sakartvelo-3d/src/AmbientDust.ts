import * as THREE from 'three';

export class AmbientDust {
  private readonly _count = 96;
  private readonly _positions = new Float32Array(this._count * 3);
  private readonly _seeds = new Float32Array(this._count * 4);
  private readonly _geometry = new THREE.BufferGeometry();
  private readonly _material: THREE.PointsMaterial;
  private readonly _points: THREE.Points;

  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _up = new THREE.Vector3();
  private readonly _center = new THREE.Vector3();
  private readonly _tmp = new THREE.Vector3();

  constructor(scene: THREE.Scene, texturePath: string) {
    for (let i = 0; i < this._count; i++) {
      const seedIndex = i * 4;
      this._seeds[seedIndex + 0] = Math.random() * 2 - 1; // horizontal spread
      this._seeds[seedIndex + 1] = Math.random() * 2 - 1; // vertical spread
      this._seeds[seedIndex + 2] = Math.random() * 2 - 1; // depth spread
      this._seeds[seedIndex + 3] = 0.6 + Math.random() * 1.4; // speed
    }

    this._geometry.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));

    const texture = new THREE.TextureLoader().load(texturePath);

    this._material = new THREE.PointsMaterial({
      map: texture,
      color: 0xffd27a,
      size: 0.16,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      vertexColors: false,
    });

    this._points = new THREE.Points(this._geometry, this._material);
    this._points.frustumCulled = false;
    scene.add(this._points);
  }

  update(camera: THREE.PerspectiveCamera, time: number): void {
    camera.getWorldDirection(this._forward).normalize();
    this._right.crossVectors(this._forward, camera.up).normalize();
    this._up.crossVectors(this._right, this._forward).normalize();

    const depth = 8;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const height = 2 * Math.tan(vFov / 2) * depth;
    const width = height * camera.aspect;

    this._center.copy(camera.position).addScaledVector(this._forward, depth);

    for (let i = 0; i < this._count; i++) {
      const seedIndex = i * 4;
      const posIndex = i * 3;

      const sx = this._seeds[seedIndex + 0];
      const sy = this._seeds[seedIndex + 1];
      const sz = this._seeds[seedIndex + 2];
      const speed = this._seeds[seedIndex + 3];
      const phase = i * 1.731;

      const offsetX = sx * width * 0.6 + Math.sin(time * speed + phase) * 0.45;
      const offsetY = sy * height * 0.5 + Math.cos(time * (speed * 0.7) + phase) * 0.35 + 0.4;
      const offsetZ = sz * 3.0 + Math.sin(time * (speed * 0.45) + phase * 0.5) * 1.25;

      this._tmp.copy(this._center);
      this._tmp.addScaledVector(this._right, offsetX);
      this._tmp.addScaledVector(this._up, offsetY);
      this._tmp.addScaledVector(this._forward, offsetZ);

      this._positions[posIndex + 0] = this._tmp.x;
      this._positions[posIndex + 1] = this._tmp.y;
      this._positions[posIndex + 2] = this._tmp.z;
    }

    this._geometry.attributes.position.needsUpdate = true;
  }
}

export let ambientDust: AmbientDust | null = null;

export function initAmbientDust(scene: THREE.Scene, texturePath: string): void {
  ambientDust = new AmbientDust(scene, texturePath);
}
