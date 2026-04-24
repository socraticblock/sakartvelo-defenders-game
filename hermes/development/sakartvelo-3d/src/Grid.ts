import * as THREE from 'three';
import { LevelData } from './types';

export class Grid {
  group: THREE.Group = new THREE.Group();
  private tiles: THREE.Mesh[][] = [];
  private pathCells = new Set<string>();
  private occupiedCells = new Map<string, boolean>();
  worldPath: THREE.Vector3[] = [];

  readonly width: number;
  readonly height: number;

  constructor(level: LevelData) {
    this.width = level.grid_width;
    this.height = level.grid_height;

    this.computePathCells(level.path_waypoints);
    this.computeWorldPath(level.path_waypoints);
    this.createOrganicGround();
    this.createPathRibbon(level.path_waypoints);
    this.createHitTestTiles();
    this.addDecorations();
  }

  private computePathCells(waypoints: number[][]) {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const [x1, y1] = waypoints[i];
      const [x2, y2] = waypoints[i + 1];
      if (x1 === x2) {
        const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
        for (let y = lo; y <= hi; y++) this.pathCells.add(`${x1},${y}`);
      } else {
        const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
        for (let x = lo; x <= hi; x++) this.pathCells.add(`${x},${y1}`);
      }
    }
  }

  private computeWorldPath(waypoints: number[][]) {
    this.worldPath = waypoints.map(([x, y]) => new THREE.Vector3(x + 0.5, 0.25, y + 0.5));
  }

  // ─── ORGANIC GROUND (replaces visible grid tiles) ───────────────────────

  private createOrganicGround() {
    // Single terrain plane covering the entire map
    const terrainGeo = new THREE.PlaneGeometry(this.width, this.height, this.width * 2, this.height * 2);
    terrainGeo.rotateX(-Math.PI / 2);
    terrainGeo.translate(this.width / 2, -0.01, this.height / 2);

    // Subtle vertex color variation for organic feel
    const colors = new Float32Array(terrainGeo.attributes.position.count * 3);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Procedural color variation using simple noise-like math
      const noise = Math.sin(x * 2.3) * Math.cos(z * 1.7) * 0.05;
      const r = 0.29 + noise;
      const g = 0.49 + noise * 1.5;
      const b = 0.31 + noise * 0.5;
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const terrainMat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      side: THREE.FrontSide,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    this.group.add(terrain);
  }

  // ─── PATH RIBBON (smooth organic winding road) ─────────────────────────

  private createPathRibbon(waypoints: number[][]) {
    if (waypoints.length < 2) return;

    // 1. Create a smooth spline from waypoints
    const points = waypoints.map(wp => new THREE.Vector3(wp[0] + 0.5, 0.01, wp[1] + 0.5));
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    const curvePoints = curve.getPoints(waypoints.length * 10); // High resolution for smoothness

    const pathWidth = 1.15;
    const vertices: number[] = [];
    const indices: number[] = [];
    let vi = 0;

    // 2. Generate the ribbon geometry along the curve
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const p1 = curvePoints[i];
      const p2 = curvePoints[i + 1];
      
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const normal = new THREE.Vector3(-dir.z, 0, dir.x); // Perpendicular to direction
      
      // Add subtle "Hand-drawn" jitter to the width
      const jitter = (Math.sin(i * 0.8) * 0.05) + (Math.cos(i * 0.4) * 0.03);
      const halfWidth = (pathWidth / 2) + jitter;

      // Outer points
      const v1 = p1.clone().add(normal.clone().multiplyScalar(halfWidth));
      const v2 = p1.clone().sub(normal.clone().multiplyScalar(halfWidth));
      const v3 = p2.clone().add(normal.clone().multiplyScalar(halfWidth));
      const v4 = p2.clone().sub(normal.clone().multiplyScalar(halfWidth));

      vertices.push(v1.x, 0.01, v1.z, v2.x, 0.01, v2.z, v3.x, 0.01, v3.z, v4.x, 0.01, v4.z);
      indices.push(vi, vi + 1, vi + 2, vi + 1, vi + 3, vi + 2);
      vi += 4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const pathMat = new THREE.MeshLambertMaterial({ 
      color: 0xc2a366, 
      side: THREE.DoubleSide 
    });
    const pathMesh = new THREE.Mesh(geo, pathMat);
    pathMesh.receiveShadow = true;
    this.group.add(pathMesh);

    // 3. Organic Path Border (Jagged dirt edge)
    const borderVertices: number[] = [];
    const borderIndices: number[] = [];
    let bvi = 0;
    const borderWidth = pathWidth + 0.2;

    for (let i = 0; i < curvePoints.length - 1; i++) {
      const p1 = curvePoints[i];
      const p2 = curvePoints[i + 1];
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const normal = new THREE.Vector3(-dir.z, 0, dir.x);
      
      const jitter = (Math.cos(i * 0.6) * 0.08); // More aggressive jitter for the dirt edge
      const halfWidth = (borderWidth / 2) + jitter;

      const v1 = p1.clone().add(normal.clone().multiplyScalar(halfWidth));
      const v2 = p1.clone().sub(normal.clone().multiplyScalar(halfWidth));
      const v3 = p2.clone().add(normal.clone().multiplyScalar(halfWidth));
      const v4 = p2.clone().sub(normal.clone().multiplyScalar(halfWidth));

      borderVertices.push(v1.x, 0.005, v1.z, v2.x, 0.005, v2.z, v3.x, 0.005, v3.z, v4.x, 0.005, v4.z);
      borderIndices.push(bvi, bvi + 1, bvi + 2, bvi + 1, bvi + 3, bvi + 2);
      bvi += 4;
    }

    const borderGeo = new THREE.BufferGeometry();
    borderGeo.setAttribute('position', new THREE.Float32BufferAttribute(borderVertices, 3));
    borderGeo.setIndex(borderIndices);
    const borderMat = new THREE.MeshLambertMaterial({ color: 0x8b7455 });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.receiveShadow = true;
    this.group.add(borderMesh);
  }

  // ─── HIT-TEST TILES (invisible, for raycasting only) ──────────────────

  private createHitTestTiles() {
    const tileGeo = new THREE.BoxGeometry(0.94, 0.12, 0.94);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        const isPath = this.pathCells.has(`${x},${y}`);
        const tile = new THREE.Mesh(tileGeo, hitMat);
        tile.position.set(x + 0.5, isPath ? -0.02 : 0, y + 0.5);
        tile.userData = { gx: x, gy: y, isPath };
        // Invisible but still in scene for raycasting
        this.group.add(tile);
        this.tiles[y][x] = tile;
      }
    }
  }

  private addDecorations() {
    // Start marker (green glow)
    const startGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.02, 16);
    const startMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.4 });
    const start = new THREE.Mesh(startGeo, startMat);
    const first = this.worldPath[0];
    if (first) {
      start.position.set(first.x, 0.08, first.z);
      this.group.add(start);
    }

    // End marker (red glow)
    const endMat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.4 });
    const end = new THREE.Mesh(startGeo.clone(), endMat);
    const last = this.worldPath[this.worldPath.length - 1];
    if (last) {
      end.position.set(last.x, 0.08, last.z);
      this.group.add(end);
    }
  }

  // ─── PUBLIC API (unchanged) ──────────────────────────────────────────

  isBuildable(gx: number, gy: number, isWall: boolean = false): boolean {
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return false;
    if (this.occupiedCells.has(`${gx},${gy}`)) return false;
    // Walls can be placed ON the path; others cannot
    if (this.pathCells.has(`${gx},${gy}`)) return isWall;
    return true;
  }

  occupy(gx: number, gy: number) {
    this.occupiedCells.set(`${gx},${gy}`, true);
  }

  free(gx: number, gy: number) {
    this.occupiedCells.delete(`${gx},${gy}`);
  }

  /** Flash a tile's emissive to signal successful placement */
  flashTile(gx: number, gy: number, colorHex: number) {
    // No-op in organic mode — placement feedback handled by tower mesh itself
  }

  getAllTileMeshes(): THREE.Object3D[] {
    return this.tiles.flat();
  }

  getWorldPath(): THREE.Vector3[] {
    return this.worldPath;
  }
}
