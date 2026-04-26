import * as THREE from 'three';
import { gs } from './GameState';

export class WarHorn {
  group: THREE.Group;
  private innerMesh: THREE.Mesh;
  private outerMesh: THREE.Mesh;
  private spawnPos = new THREE.Vector3();
  private baseHover = 1.8;

  constructor() {
    this.group = new THREE.Group();
    // Add custom userData so raycaster knows it's the horn
    this.group.userData = { isWarHorn: true };

    // Horn Body (Wide Cylinder/Cone)
    const hornGeo = new THREE.CylinderGeometry(0.5, 0.1, 1.2, 8);
    hornGeo.rotateZ(Math.PI / 4); // Angle it like a horn
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffa500,
      emissiveIntensity: 1.0,
      metalness: 0.9,
      roughness: 0.1
    });
    this.innerMesh = new THREE.Mesh(hornGeo, hornMat);
    this.innerMesh.userData = { isWarHorn: true };

    // Outer Glow / Shell
    const outerGeo = new THREE.CylinderGeometry(0.6, 0.15, 1.3, 8);
    outerGeo.rotateZ(Math.PI / 4);
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      transmission: 0.5,
      thickness: 1
    });
    this.outerMesh = new THREE.Mesh(outerGeo, outerMat);
    this.outerMesh.userData = { isWarHorn: true };

    // HITBOX: Large invisible sphere to make it easy to tap on mobile
    const hitGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.userData = { isWarHorn: true };

    this.group.add(this.innerMesh);
    this.group.add(this.outerMesh);
    this.group.add(hitMesh);
  }

  init(spawnPoint: THREE.Vector3) {
    // Place it slightly elevated and pushed backwards slightly from the gate
    this.spawnPos.copy(spawnPoint);
    // Move it up
    this.spawnPos.y = this.baseHover;
    // Assuming enemies walk towards center, we just place it right over the spawn for now
    this.group.position.copy(this.spawnPos);
    this.group.visible = true;
  }

  update(time: number, isVibrating: boolean) {
    if (!this.group.visible) return;

    // Slow rotation
    this.group.rotation.y = time * 0.5;

    // Bobbing
    const bob = Math.sin(time * 2) * 0.1;
    this.group.position.y = this.spawnPos.y + bob;

    if (isVibrating) {
      // Violent shake
      this.group.position.x = this.spawnPos.x + (Math.random() - 0.5) * 0.1;
      this.group.position.z = this.spawnPos.z + (Math.random() - 0.5) * 0.1;
      (this.innerMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
    } else {
      this.group.position.x = this.spawnPos.x;
      this.group.position.z = this.spawnPos.z;
      (this.innerMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xffa500);
    }
  }

  hide() {
    this.group.visible = false;
  }

  show() {
    this.group.visible = true;
  }

  getScreenPosition(camera: THREE.Camera): { x: number, y: number } {
    const vector = this.group.position.clone();
    // Project slightly above the horn for the text
    vector.y += 0.8;
    vector.project(camera);
    
    // Map to 2D screen space
    const x = (vector.x * .5 + .5) * window.innerWidth;
    const y = (vector.y * -.5 + .5) * window.innerHeight;
    return { x, y };
  }
}

export const warHorn = new WarHorn();
