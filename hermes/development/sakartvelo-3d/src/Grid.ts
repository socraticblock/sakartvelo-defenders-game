import * as THREE from 'three';
import { LevelData } from './types';

export class Grid {
  group: THREE.Group = new THREE.Group();
  private tiles: THREE.Mesh[][] = [];
  private plinths: THREE.Group[] = [];
  private pathCells = new Set<string>();
  private occupiedCells = new Map<string, boolean>();
  private _curve: THREE.CatmullRomCurve3 | null = null;
  private theme = 'colchis';
  private defenseTarget = 'village_gate';
  worldPath: THREE.Vector3[] = [];
  private pathHighlightMeshes: THREE.Mesh[] = [];

  readonly width: number;
  readonly height: number;

  constructor(level: LevelData) {
    this.width = level.grid_width;
    this.height = level.grid_height;
    this.theme = level.theme || 'colchis';
    this.defenseTarget = level.defense_target || 'village_gate';

    this.computePathCells(level.path_waypoints);
    this.computeWorldPath(level.path_waypoints);
    this.createOrganicGround();
    this.createPathRibbon(level.path_waypoints);
    this.createPlinths(level.build_nodes || []);
    this.createHitTestTiles();
    this.createEnvironmentDecorations();
    this.createThemeDecorations();
    this.createDefenseObjective();
    this.addDecorations();
  }

  /** Update method for animating pulsing auras and wall-path highlight. */
  update(time: number, selectedType: string | null) {
    const isWallMode = selectedType === 'wall';
    const isBuildSelecting = selectedType !== null && !isWallMode;

    this.plinths.forEach(p => {
      const aura = p.userData.aura as THREE.Mesh;
      if (isBuildSelecting && !p.userData.occupied) {
        aura.visible = true;
        // Stronger pulse in placement mode for mobile readability.
        const mat = aura.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.45 + Math.sin(time * 5) * 0.22;
        aura.scale.setScalar(1.02 + Math.sin(time * 5) * 0.08);
      } else {
        aura.visible = false;
      }
    });

    for (const mesh of this.pathHighlightMeshes) {
      const mat = mesh.material as THREE.MeshLambertMaterial;
      if (isWallMode) {
        mat.emissive.setHex(0xd4a017);
        mat.emissiveIntensity = 0.16 + Math.sin(time * 6) * 0.06;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    }
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
    this._curve = curve;
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
    this.pathHighlightMeshes.push(pathMesh);

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
    this.pathHighlightMeshes.push(borderMesh);
  }

  private createPlinths(nodes: number[][]) {
    const mobile = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
    const baseRadius = mobile ? 0.54 : 0.42;
    const bottomRadius = mobile ? 0.62 : 0.48;
    // Octagonal beveled stone geometry
    const stoneGeo = new THREE.CylinderGeometry(baseRadius, bottomRadius, 0.08, 8);
    const stoneMat = new THREE.MeshStandardMaterial({ 
      color: 0x6a6a5a, 
      roughness: 0.9, 
      metalness: 0.1,
      emissive: mobile ? 0x2a210a : 0x1a1508,
      emissiveIntensity: mobile ? 0.28 : 0.15,
    });

    // Golden glow ring for building "intent"
    const auraGeo = new THREE.RingGeometry(mobile ? 0.58 : 0.45, mobile ? 0.72 : 0.55, 32);
    auraGeo.rotateX(-Math.PI / 2);

    const auraMat = new THREE.MeshBasicMaterial({ 
      color: 0xffd972, 
      transparent: true, 
      opacity: mobile ? 0.6 : 0.5, 
      visible: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    nodes.forEach(([x, y]) => {
      const group = new THREE.Group();
      const pPos = new THREE.Vector3(x + 0.5, 0.04, y + 0.5);

      // --- Repulsion Logic: Push plinth away from path center ---
      if (this._curve) {
        // Find closest point on curve (sampling for simplicity)
        let minDistSq = Infinity;
        let closestU = 0;
        const SAMPLES = 100;
        for (let i = 0; i <= SAMPLES; i++) {
          const u = i / SAMPLES;
          const cp = this._curve.getPoint(u);
          const dSq = cp.distanceToSquared(pPos);
          if (dSq < minDistSq) {
            minDistSq = dSq;
            closestU = u;
          }
        }
        
        const cp = this._curve.getPoint(closestU);
        const dist = Math.sqrt(minDistSq);
        
        if (dist < 1.8) { // If plinth is close to path
          const pushDir = new THREE.Vector3().subVectors(pPos, cp);
          pushDir.y = 0;
          pushDir.normalize();
          // Nudge by about half a cell so tapping/building stays readable.
          pPos.add(pushDir.multiplyScalar(mobile ? 0.58 : 0.45));
        }
      }

      group.position.copy(pPos);

      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.receiveShadow = true;
      group.add(stone);

      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.y = 0.05; // Slightly above stone top
      group.add(aura);

      group.userData = { gx: x, gy: y, aura, occupied: false };
      this.plinths.push(group);
      this.group.add(group);
    });
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

  private createEnvironmentDecorations() {
    // Keep only rocks as requested
    const rockCount = Math.floor(this.width * this.height * 0.4);
    const rockGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a7a72, roughness: 0.9 });
    const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);

    const dummy = new THREE.Object3D();
    let rIdx = 0;

    const numClusters = Math.floor((this.width * this.height) / 4);
    for (let c = 0; c < numClusters; c++) {
      const cx = Math.random() * this.width;
      const cy = Math.random() * this.height;
      if (this.pathCells.has(`${Math.floor(cx)},${Math.floor(cy)}`)) continue;

      const itemsInCluster = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < itemsInCluster; i++) {
        const ox = (Math.random() - 0.5) * 1.5;
        const oy = (Math.random() - 0.5) * 1.5;
        const finalX = cx + ox;
        const finalY = cy + oy;

        if (finalX < 0 || finalX >= this.width || finalY < 0 || finalY >= this.height) continue;
        if (this.pathCells.has(`${Math.floor(finalX)},${Math.floor(finalY)}`)) continue;

        if (rIdx < rockCount) {
          dummy.position.set(finalX, 0, finalY);
          dummy.rotation.set(Math.random(), Math.random(), Math.random());
          dummy.scale.setScalar(0.4 + Math.random() * 0.8);
          dummy.updateMatrix();
          rockMesh.setMatrixAt(rIdx++, dummy.matrix);
        }
      }
    }

    rockMesh.count = rIdx;
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;
    this.group.add(rockMesh);
  }

  private isDecorSafe(x: number, y: number): boolean {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return false;
    if (this.pathCells.has(`${gx},${gy}`)) return false;
    return !this.plinths.some(p => Math.abs(p.userData.gx + 0.5 - x) < 1.2 && Math.abs(p.userData.gy + 0.5 - y) < 1.2);
  }

  private addProp(mesh: THREE.Object3D, x: number, y: number, scale = 1): void {
    if (!this.isDecorSafe(x, y)) return;
    mesh.position.set(x, 0, y);
    mesh.scale.setScalar(scale);
    this.group.add(mesh);
  }

  private makeTree(): THREE.Group {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.45, 5), new THREE.MeshLambertMaterial({ color: 0x5a3418 }));
    trunk.position.y = 0.22;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.65, 6), new THREE.MeshLambertMaterial({ color: 0x1f5a32 }));
    crown.position.y = 0.72;
    g.add(trunk, crown);
    return g;
  }

  private makeStone(color = 0x777766): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), new THREE.MeshLambertMaterial({ color }));
    m.position.y = 0.12;
    m.castShadow = true;
    return m;
  }

  private makeHut(): THREE.Group {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.34, 6), new THREE.MeshLambertMaterial({ color: 0x735938 }));
    body.position.y = 0.17;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.28, 6), new THREE.MeshLambertMaterial({ color: 0x3a2a18 }));
    roof.position.y = 0.48;
    g.add(body, roof);
    return g;
  }

  private makeFire(): THREE.Group {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.06, 8), new THREE.MeshLambertMaterial({ color: 0x3a3020 }));
    base.position.y = 0.03;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 5), new THREE.MeshBasicMaterial({ color: 0xd4a017 }));
    flame.position.y = 0.24;
    g.add(base, flame);
    return g;
  }

  private makeWaterStrip(width: number, depth: number): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.03, depth),
      new THREE.MeshBasicMaterial({ color: 0x245f73, transparent: true, opacity: 0.75 }),
    );
    m.position.y = 0.015;
    return m;
  }

  private makeShrine(color = 0xd4a017): THREE.Group {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), new THREE.MeshLambertMaterial({ color: 0x6a6a5a }));
    const b = a.clone();
    a.position.set(-0.2, 0.28, 0);
    b.position.set(0.2, 0.28, 0);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.16), new THREE.MeshLambertMaterial({ color }));
    top.position.y = 0.58;
    g.add(a, b, top);
    return g;
  }

  private makeGate(color = 0xd4a017): THREE.Group {
    const g = new THREE.Group();
    const wood = new THREE.MeshLambertMaterial({ color: 0x735938 });
    const trim = new THREE.MeshLambertMaterial({ color });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.14), wood);
    const right = left.clone();
    left.position.set(-0.42, 0.4, 0);
    right.position.set(0.42, 0.4, 0);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, 0.16), trim);
    beam.position.y = 0.82;
    g.add(left, right, beam);
    return g;
  }

  private makeWatchfire(): THREE.Group {
    const g = new THREE.Group();
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.42, 6), new THREE.MeshLambertMaterial({ color: 0x5a3a22 }));
    tower.position.y = 0.21;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 5), new THREE.MeshBasicMaterial({ color: 0xffa726 }));
    flame.position.y = 0.56;
    g.add(tower, flame);
    return g;
  }

  private makeLandingMarker(): THREE.Group {
    const g = new THREE.Group();
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.1, 8), new THREE.MeshLambertMaterial({ color: 0x7b7a70 }));
    stone.position.y = 0.05;
    const banner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.08), new THREE.MeshLambertMaterial({ color: 0x245f73 }));
    banner.position.set(0, 0.3, 0);
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.04), new THREE.MeshLambertMaterial({ color: 0x3f89a3 }));
    cloth.position.set(0.2, 0.44, 0);
    g.add(stone, banner, cloth);
    return g;
  }

  private makeForge(): THREE.Group {
    const g = this.makeHut();
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.26), new THREE.MeshLambertMaterial({ color: 0x595959 }));
    anvil.position.set(0.34, 0.08, 0.1);
    const ember = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), new THREE.MeshBasicMaterial({ color: 0xff9800 }));
    ember.position.set(-0.26, 0.2, 0.1);
    g.add(anvil, ember);
    return g;
  }

  private createDefenseObjective(): void {
    const end = this.worldPath[this.worldPath.length - 1];
    if (!end) return;
    const candidates: Array<[number, number]> = [
      [end.x, Math.min(this.height - 1.1, end.z + 0.55)],
      [end.x - 1.1, Math.min(this.height - 1.1, end.z + 0.45)],
      [end.x + 1.1, Math.min(this.height - 1.1, end.z + 0.45)],
      [end.x - 1.7, Math.min(this.height - 1.35, end.z + 0.35)],
      [end.x + 1.7, Math.min(this.height - 1.35, end.z + 0.35)],
    ];
    const chosen = candidates.find(([x, z]) => this.isDecorSafe(x, z)) || candidates[0];
    const x = Math.max(1.0, Math.min(this.width - 1.0, chosen[0]));
    const z = Math.max(0.9, Math.min(this.height - 1.0, chosen[1]));
    let prop: THREE.Group;

    if (this.defenseTarget.includes('watchfire') || this.defenseTarget.includes('ridge')) {
      prop = this.makeWatchfire();
    } else if (this.defenseTarget.includes('forge') || this.defenseTarget.includes('smith')) {
      prop = this.makeForge();
    } else if (this.defenseTarget.includes('landing') || this.defenseTarget.includes('coast')) {
      prop = this.makeLandingMarker();
    } else if (this.defenseTarget.includes('shrine') || this.defenseTarget.includes('grove') || this.defenseTarget.includes('fleece') || this.defenseTarget.includes('heart')) {
      prop = this.makeShrine(this.defenseTarget.includes('devi') ? 0xaa3333 : 0xd4a017);
    } else if (this.defenseTarget.includes('crossing') || this.defenseTarget.includes('landing')) {
      prop = this.makeGate(0x245f73);
    } else if (this.defenseTarget.includes('gate') || this.defenseTarget.includes('palisade')) {
      prop = this.makeGate(0xd4a017);
    } else {
      prop = this.makeHut();
    }

    prop.position.set(x, 0.02, z);
    prop.scale.setScalar(this.defenseTarget.includes('heart') ? 1.35 : 1.22);
    this.group.add(prop);
  }

  private createThemeDecorations(): void {
    const addTrees = (n: number) => {
      for (let i = 0; i < n; i++) this.addProp(this.makeTree(), 0.8 + Math.random() * (this.width - 1.6), 0.8 + Math.random() * (this.height - 1.6), 0.75 + Math.random() * 0.45);
    };
    const addStones = (n: number, color = 0x777766) => {
      for (let i = 0; i < n; i++) this.addProp(this.makeStone(color), 0.7 + Math.random() * (this.width - 1.4), 0.7 + Math.random() * (this.height - 1.4), 0.6 + Math.random() * 0.8);
    };

    if (this.theme.includes('river') || this.theme.includes('stream') || this.theme.includes('marsh')) {
      const water = this.makeWaterStrip(this.width, this.theme.includes('marsh') ? 1.5 : 0.75);
      water.position.set(this.width / 2, 0.01, this.height - 0.7);
      this.group.add(water);
      addStones(10, 0xd4a017);
    }
    if (this.theme.includes('forest') || this.theme.includes('grove') || this.theme.includes('oak')) addTrees(24);
    else addTrees(10);

    if (this.theme.includes('coast') || this.theme.includes('cliffs')) {
      const sea = this.makeWaterStrip(this.width, 1.2);
      sea.position.set(this.width / 2, 0.01, 0.35);
      this.group.add(sea);
      addStones(16, 0x888880);
    }
    if (this.theme.includes('smith')) {
      this.addProp(this.makeHut(), 2.0, 2.0, 1.1);
      this.addProp(this.makeFire(), 3.0, 2.4, 1.2);
      addStones(8, 0x5f5f58);
    }
    if (this.theme.includes('watchfires') || this.theme.includes('trial')) {
      this.addProp(this.makeFire(), 2.0, 2.0, 1.3);
      this.addProp(this.makeFire(), this.width - 2.0, 2.0, 1.3);
      this.addProp(this.makeFire(), this.width - 2.0, this.height - 2.0, 1.3);
    }
    if (this.theme.includes('shrine') || this.theme.includes('fleece') || this.theme.includes('heart') || this.theme.includes('stones')) {
      this.addProp(this.makeShrine(this.theme.includes('dragon') ? 0xaa3333 : 0xd4a017), this.width - 2.2, this.height - 2.2, 1.2);
      addStones(12, 0x6a6a5a);
    }
    if (this.theme.includes('palisade') || this.theme.includes('gate')) {
      for (let i = 2; i < this.width - 2; i += 1.2) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5, 4), new THREE.MeshLambertMaterial({ color: 0x735938 }));
        spike.position.y = 0.25;
        this.addProp(spike, i, this.height - 1.0, 1);
      }
    }
    if (this.theme.includes('devi') || this.theme.includes('ravine')) addStones(22, 0x4d4a44);
  }

  private addDecorations() {
    // Markers are now redundant with plinths but kept for path debugging
    const startGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.02, 16);
    const startMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.2 });
    const start = new THREE.Mesh(startGeo, startMat);
    const first = this.worldPath[0];
    if (first) {
      start.position.set(first.x, 0.08, first.z);
      this.group.add(start);
    }
  }

  // ─── PUBLIC API (unchanged) ──────────────────────────────────────────

  isBuildable(gx: number, gy: number, isWall: boolean = false): boolean {
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return false;
    
    // If plinths are defined, only allow building ON plinths (except walls)
    if (this.plinths.length > 0 && !isWall) {
      const onPlinth = this.plinths.some(p => p.userData.gx === gx && p.userData.gy === gy && !p.userData.occupied);
      return onPlinth;
    }

    if (this.occupiedCells.has(`${gx},${gy}`)) return false;
    // Walls can be placed ON the path; others cannot
    if (this.pathCells.has(`${gx},${gy}`)) return isWall;
    // Walls can ONLY be built on the path; others (Archer/Catapult) can ONLY be built off-path.
    return !isWall;
  }

  occupy(gx: number, gy: number) {
    this.occupiedCells.set(`${gx},${gy}`, true);
    const plinth = this.plinths.find(p => p.userData.gx === gx && p.userData.gy === gy);
    if (plinth) plinth.userData.occupied = true;
  }

  free(gx: number, gy: number) {
    this.occupiedCells.delete(`${gx},${gy}`);
    const plinth = this.plinths.find(p => p.userData.gx === gx && p.userData.gy === gy);
    if (plinth) plinth.userData.occupied = false;
  }

  /** Flash a tile's emissive to signal successful placement */
  flashTile(gx: number, gy: number, colorHex: number) {
    // No-op in organic mode
  }

  getAllTileMeshes(): THREE.Object3D[] {
    return this.tiles.flat();
  }

  getPlinthVisualPos(gx: number, gy: number): THREE.Vector3 | null {
    const p = this.plinths.find(pl => pl.userData.gx === gx && pl.userData.gy === gy);
    return p ? p.position.clone() : null;
  }

  getWorldPath(): THREE.Vector3[] {
    return this.worldPath;
  }

  isPlinthCell(gx: number, gy: number): boolean {
    return this.plinths.some(p => p.userData.gx === gx && p.userData.gy === gy);
  }
}
