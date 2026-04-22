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
    this.createTiles();
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

  private createTiles() {
    const tileGeo = new THREE.BoxGeometry(0.94, 0.12, 0.94);
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x4a7c4f });
    const pathMat = new THREE.MeshLambertMaterial({ color: 0xc2a366 });

    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        const isPath = this.pathCells.has(`${x},${y}`);
        const tile = new THREE.Mesh(tileGeo, isPath ? pathMat.clone() : grassMat.clone());
        tile.position.set(x + 0.5, isPath ? -0.02 : 0, y + 0.5);
        tile.receiveShadow = true;
        tile.userData = { gx: x, gy: y, isPath };
        this.group.add(tile);
        this.tiles[y][x] = tile;
      }
    }
  }

  private addDecorations() {
    // Path arrows / direction indicators - subtle darker tiles at waypoints
    const arrowMat = new THREE.MeshLambertMaterial({ color: 0xa89050 });
    // Just add subtle dots along path for visual guidance

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

  isBuildable(gx: number, gy: number, isWall: boolean = false): boolean {
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return false;
    if (this.occupiedCells.has(`${gx},${gy}`)) return false;
    // Walls can be placed ON the path; others cannot
    if (this.pathCells.has(`${gx},${gy}`)) return isWall;
    return true;
  }

  occupy(gx: number, gy: number) {
    this.occupiedCells.set(`${gx},${gy}`, true);
    const tile = this.tiles[gy]?.[gx];
    if (tile) {
      (tile.material as THREE.MeshLambertMaterial).color.setHex(0x3a5c3f);
    }
  }

  free(gx: number, gy: number) {
    this.occupiedCells.delete(`${gx},${gy}`);
    const tile = this.tiles[gy]?.[gx];
    if (tile) {
      const isPath = this.pathCells.has(`${gx},${gy}`);
      (tile.material as THREE.MeshLambertMaterial).color.setHex(isPath ? 0xc2a366 : 0x4a7c4f);
    }
  }

  /** Flash a tile's emissive to signal successful placement */
  flashTile(gx: number, gy: number, colorHex: number) {
    const tile = this.tiles[gy]?.[gx];
    if (!tile) return;
    (tile.material as THREE.MeshLambertMaterial).emissive.setHex(colorHex);
    setTimeout(() => (tile.material as THREE.MeshLambertMaterial).emissive.setHex(0x000000), 200);
  }

  getAllTileMeshes(): THREE.Object3D[] {
    return this.tiles.flat();
  }

  getWorldPath(): THREE.Vector3[] {
    return this.worldPath;
  }
}
