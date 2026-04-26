import * as THREE from 'three';

class GeometryCache {
  private cache = new Map<string, THREE.BufferGeometry>();

  getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `box_${w}_${h}_${d}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.BoxGeometry(w, h, d));
    }
    return this.cache.get(key) as THREE.BoxGeometry;
  }

  getCylinder(rt: number, rb: number, h: number, rs: number): THREE.CylinderGeometry {
    const key = `cyl_${rt}_${rb}_${h}_${rs}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.CylinderGeometry(rt, rb, h, rs));
    }
    return this.cache.get(key) as THREE.CylinderGeometry;
  }

  getCone(r: number, h: number, rs: number): THREE.ConeGeometry {
    const key = `cone_${r}_${h}_${rs}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.ConeGeometry(r, h, rs));
    }
    return this.cache.get(key) as THREE.ConeGeometry;
  }

  getSphere(r: number, ws: number, hs: number): THREE.SphereGeometry {
    const key = `sph_${r}_${ws}_${hs}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.SphereGeometry(r, ws, hs));
    }
    return this.cache.get(key) as THREE.SphereGeometry;
  }

  getIcosahedron(r: number, detail: number): THREE.IcosahedronGeometry {
    const key = `ico_${r}_${detail}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.IcosahedronGeometry(r, detail));
    }
    return this.cache.get(key) as THREE.IcosahedronGeometry;
  }
  getTorus(r: number, t: number, rs: number, ts: number, arc: number): THREE.TorusGeometry {
    const key = `torus_${r}_${t}_${rs}_${ts}_${arc}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.TorusGeometry(r, t, rs, ts, arc));
    }
    return this.cache.get(key) as THREE.TorusGeometry;
  }

  getPlane(w: number, h: number, ws: number, hs: number): THREE.PlaneGeometry {
    const key = `plane_${w}_${h}_${ws}_${hs}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.PlaneGeometry(w, h, ws, hs));
    }
    return this.cache.get(key) as THREE.PlaneGeometry;
  }
}

export const geoCache = new GeometryCache();
