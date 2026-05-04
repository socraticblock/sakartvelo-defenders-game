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
  private era = 0;
  private levelNum = 1;
  worldPath: THREE.Vector3[] = [];
  private pathHighlightMeshes: THREE.Mesh[] = [];
  private waterMeshes: THREE.Mesh[] = [];
  private rngState = 1;

  readonly width: number;
  readonly height: number;

  constructor(level: LevelData) {
    this.width = level.grid_width;
    this.height = level.grid_height;
    this.theme = level.theme || 'colchis';
    this.defenseTarget = level.defense_target || 'village_gate';
    this.era = level.era ?? 0;
    this.levelNum = level.level ?? 1;
    this.seedRng();

    this.computePathCells(level.path_waypoints);
    this.computeWorldPath(level.path_waypoints);
    this.createOrganicGround();
    this.createPathRibbon(level.path_waypoints);
    this.createHitTestTiles();
    this.createPlinths(level.build_nodes || []);
    this.createThemeDecorations();
    this.createLevelSignature();
    this.createEnvironmentDecorations();
    this.createDefenseObjective();
    this.addDecorations();
  }

  /** Update method for animating pulsing auras and wall-path highlight. */
  
  private seedRng(): void {
    const seed = `${this.era}:${this.levelNum}:${this.theme}:${this.defenseTarget}:${this.width}x${this.height}`;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    this.rngState = (h >>> 0) || 1;
  }

  private rand(): number {
    let x = this.rngState >>> 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.rngState = x >>> 0;
    return this.rngState / 4294967296;
  }

  private safeRingGeometry(innerRadius: number, outerRadius: number, segments = 32): THREE.RingGeometry {
    const inner = Math.max(0.01, Math.min(innerRadius, outerRadius - 0.01));
    const outer = Math.max(inner + 0.01, outerRadius);
    return new THREE.RingGeometry(inner, outer, Math.max(3, segments));
  }
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

    for (const mesh of this.waterMeshes) {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.62 + Math.sin(time * 1.6 + mesh.position.x * 0.31) * 0.08;
      mesh.position.y = 0.012 + Math.sin(time * 1.1 + mesh.position.z) * 0.004;
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

  // â”€â”€â”€ ORGANIC GROUND (replaces visible grid tiles) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      const noise = Math.sin(x * 2.3) * Math.cos(z * 1.7) * 0.045;
      const ridge = Math.sin((x + z) * 0.65) * 0.018;
      const riverCool = this.theme.includes('river') || this.theme.includes('rioni') || this.theme.includes('tribes') || this.theme.includes('golden')
        ? Math.max(0, 1 - Math.abs(z - (this.height - 1.25)) / 2.8) * 0.045
        : 0;
      const r = 0.47 + noise + ridge - riverCool * 0.45;
      const g = 0.61 + noise * 1.25 + ridge + riverCool * 0.4;
      const b = 0.42 + noise * 0.55 + riverCool;
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

    this.createTerrainEdges();
  }

  private createTerrainEdges(): void {
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x5f624f, roughness: 0.96, metalness: 0.02 });
    const lipMat = new THREE.MeshLambertMaterial({ color: 0x7f9167 });
    const parts: Array<[number, number, number, number, number]> = [
      [this.width, 0.26, this.width / 2, -0.2, -0.13],
      [this.width, 0.32, this.width / 2, this.height + 0.2, -0.16],
      [0.28, this.height, -0.18, this.height / 2, -0.15],
      [0.28, this.height, this.width + 0.18, this.height / 2, -0.15],
    ];

    for (const [w, d, x, z, y] of parts) {
      const cliff = new THREE.Mesh(new THREE.BoxGeometry(w, 0.42, d), edgeMat);
      cliff.position.set(x, y, z);
      cliff.castShadow = true;
      cliff.receiveShadow = true;
      this.group.add(cliff);
    }

    const backLip = new THREE.Mesh(new THREE.BoxGeometry(this.width + 0.15, 0.08, 0.18), lipMat);
    backLip.position.set(this.width / 2, 0.025, -0.03);
    backLip.receiveShadow = true;
    this.group.add(backLip);
  }

  // â”€â”€â”€ PATH RIBBON (smooth organic winding road) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      color: 0xd7b968, 
      side: THREE.DoubleSide 
    });
    const pathMesh = new THREE.Mesh(geo, pathMat);
    pathMesh.receiveShadow = true;
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
    const borderMat = new THREE.MeshLambertMaterial({ color: 0x9b8146, side: THREE.DoubleSide });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.receiveShadow = true;
    this.group.add(borderMesh);
    this.group.add(pathMesh);
    this.pathHighlightMeshes.push(borderMesh);

    this.createPathDetails(curvePoints, pathWidth);
  }

  private createPathDetails(curvePoints: THREE.Vector3[], pathWidth: number): void {
    const rutMat = new THREE.MeshLambertMaterial({ color: 0xaa8845, transparent: true, opacity: 0.52 });
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x315f34 });
    const pebbleMat = new THREE.MeshLambertMaterial({ color: 0x8a8062 });

    for (let i = 3; i < curvePoints.length - 3; i += 3) {
      const p = curvePoints[i];
      const prev = curvePoints[i - 1];
      const next = curvePoints[i + 1];
      const dir = new THREE.Vector3().subVectors(next, prev).normalize();
      const normal = new THREE.Vector3(-dir.z, 0, dir.x);

      if (i % 6 === 0) {
        for (const side of [-1, 1]) {
          const rut = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.34), rutMat);
          rut.rotation.x = -Math.PI / 2;
          rut.rotation.z = Math.atan2(dir.x, dir.z);
          rut.position.copy(p).add(normal.clone().multiplyScalar(side * pathWidth * 0.23));
          rut.position.y = 0.018;
          this.group.add(rut);
        }
      }

      if (i % 5 === 0) {
        const side = i % 10 === 0 ? 1 : -1;
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.24, 5), grassMat);
        tuft.position.copy(p).add(normal.clone().multiplyScalar(side * pathWidth * 0.72));
        tuft.position.y = 0.14;
        tuft.rotation.y = i * 0.33;
        tuft.castShadow = true;
        this.group.add(tuft);
      }

      if (i % 8 === 0) {
        const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.055, 0), pebbleMat);
        pebble.position.copy(p).add(normal.clone().multiplyScalar((i % 16 === 0 ? 1 : -1) * pathWidth * 0.37));
        pebble.position.y = 0.045;
        pebble.scale.set(1.4, 0.45, 1);
        pebble.rotation.set(0.2, i * 0.24, 0.1);
        pebble.castShadow = true;
        this.group.add(pebble);
      }
    }
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
    const auraGeo = this.safeRingGeometry(mobile ? 0.58 : 0.45, mobile ? 0.72 : 0.55, 32);
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
          
          // CRITICAL: Synchronize the hit-test tile with the visual nudge
          const tile = this.tiles[y]?.[x];
          if (tile) {
            tile.position.x = pPos.x;
            tile.position.z = pPos.z;
          }
        }
      }

      group.position.copy(pPos);

      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.receiveShadow = true;
      stone.userData = { gx: x, gy: y, isPath: false };
      group.add(stone);

      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.y = 0.05; // Slightly above stone top
      aura.userData = { gx: x, gy: y, isPath: false };
      group.add(aura);

      group.userData = { gx: x, gy: y, aura, occupied: false };
      this.plinths.push(group);
      this.group.add(group);
    });
  }

  // â”€â”€â”€ HIT-TEST TILES (invisible, for raycasting only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private createHitTestTiles() {
    const tileGeo = new THREE.BoxGeometry(1.0, 0.12, 1.0);
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
      const cx = this.rand() * this.width;
      const cy = this.rand() * this.height;
      if (this.pathCells.has(`${Math.floor(cx)},${Math.floor(cy)}`)) continue;

      const itemsInCluster = 2 + Math.floor(this.rand() * 3);
      for (let i = 0; i < itemsInCluster; i++) {
        const ox = (this.rand() - 0.5) * 1.5;
        const oy = (this.rand() - 0.5) * 1.5;
        const finalX = cx + ox;
        const finalY = cy + oy;

        if (finalX < 0 || finalX >= this.width || finalY < 0 || finalY >= this.height) continue;
        if (this.pathCells.has(`${Math.floor(finalX)},${Math.floor(finalY)}`)) continue;

        if (rIdx < rockCount) {
          dummy.position.set(finalX, 0, finalY);
          dummy.rotation.set(this.rand(), this.rand(), this.rand());
          dummy.scale.setScalar(0.4 + this.rand() * 0.8);
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

  private addPropUnsafe(mesh: THREE.Object3D, x: number, y: number, scale = 1): void {
    mesh.position.set(x, 0, y);
    mesh.scale.setScalar(scale);
    this.group.add(mesh);
  }

  private makeTree(): THREE.Group {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.45, 5), new THREE.MeshLambertMaterial({ color: 0x5a3418 }));
    trunk.position.y = 0.22;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.65, 6), new THREE.MeshLambertMaterial({ color: 0x15562f }));
    crown.position.y = 0.72;
    g.add(trunk, crown);
    return g;
  }

  private makeQvevri(): THREE.Group {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshLambertMaterial({ color: 0xb66b26 }));
    body.scale.set(0.78, 1.14, 0.78);
    body.position.y = 0.28;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.18, 10), new THREE.MeshLambertMaterial({ color: 0xd19a45 }));
    neck.position.y = 0.55;
    body.castShadow = true;
    neck.castShadow = true;
    g.add(body, neck);
    return g;
  }

  private makeBanner(color = 0x9b1d20): THREE.Group {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.9, 6), new THREE.MeshLambertMaterial({ color: 0x5a3418 }));
    pole.position.y = 0.45;
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.22, 0.025), new THREE.MeshLambertMaterial({ color }));
    cloth.position.set(0.16, 0.68, 0);
    pole.castShadow = true;
    cloth.castShadow = true;
    g.add(pole, cloth);
    return g;
  }

  private makeWatchtower(): THREE.Group {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 1.05, 6), new THREE.MeshLambertMaterial({ color: 0x686856 }));
    base.position.y = 0.53;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.32, 6), new THREE.MeshLambertMaterial({ color: 0x6d4528 }));
    roof.position.y = 1.22;
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.018), new THREE.MeshBasicMaterial({ color: 0xe5d19a }));
    slit.position.set(0, 0.72, -0.32);
    base.castShadow = true;
    roof.castShadow = true;
    g.add(base, roof, slit);
    return g;
  }

  private makeArchRuin(color = 0x777766): THREE.Group {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.82, 0.24), mat);
    const right = left.clone();
    left.position.set(-0.28, 0.41, 0);
    right.position.set(0.28, 0.41, 0);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.24), mat);
    top.position.y = 0.84;
    left.castShadow = true;
    right.castShadow = true;
    top.castShadow = true;
    g.add(left, right, top);
    return g;
  }

  private makeVineyardRow(length = 5): THREE.Group {
    const g = new THREE.Group();
    const wood = new THREE.MeshLambertMaterial({ color: 0x5a3418 });
    const leaf = new THREE.MeshLambertMaterial({ color: 0x2e6b35 });
    for (let i = 0; i < length; i++) {
      const z = i * 0.38;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, 0.34, 5), wood);
      post.position.set(0, 0.17, z);
      const vine = new THREE.Mesh(new THREE.SphereGeometry(0.085, 7, 5), leaf);
      vine.scale.set(1.35, 0.55, 0.85);
      vine.position.set(0.02 * Math.sin(i), 0.34, z);
      post.castShadow = true;
      vine.castShadow = true;
      g.add(post, vine);
    }
    g.position.z = -length * 0.19;
    return g;
  }

  private makeBridge(width = 1.4): THREE.Group {
    const g = new THREE.Group();
    const wood = new THREE.MeshLambertMaterial({ color: 0x6b4325 });
    for (let i = 0; i < 7; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(width / 7, 0.08, 1.34), wood);
      plank.position.set((i - 3) * (width / 7), 0.08, 0);
      plank.rotation.y = Math.sin(i) * 0.035;
      plank.castShadow = true;
      plank.receiveShadow = true;
      g.add(plank);
    }
    for (const z of [-0.66, 0.66]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(width + 0.22, 0.08, 0.06), wood);
      rail.position.set(0, 0.28, z);
      rail.castShadow = true;
      g.add(rail);
    }
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
    this.waterMeshes.push(m);
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
      for (let i = 0; i < n; i++) this.addProp(this.makeTree(), 0.8 + this.rand() * (this.width - 1.6), 0.8 + this.rand() * (this.height - 1.6), 0.75 + this.rand() * 0.45);
    };
    const addStones = (n: number, color = 0x777766) => {
      for (let i = 0; i < n; i++) this.addProp(this.makeStone(color), 0.7 + this.rand() * (this.width - 1.4), 0.7 + this.rand() * (this.height - 1.4), 0.6 + this.rand() * 0.8);
    };

    const isRioniValley = this.theme.includes('river') || this.theme.includes('rioni') || this.theme.includes('tribes') || this.theme.includes('golden');

    if (this.theme.includes('river') || this.theme.includes('stream') || this.theme.includes('marsh')) {
      const water = this.makeWaterStrip(this.width, this.theme.includes('marsh') ? 1.5 : 0.75);
      water.position.set(this.width / 2, 0.01, this.height - 0.7);
      this.group.add(water);
      addStones(10, 0xd4a017);
    }

    if (isRioniValley) {
      this.createRioniValleySet();
    }

    if (this.theme.includes('grove') || this.theme.includes('oak') || this.theme.includes('sacred')) {
      this.createForestGroveSet();
    }

    if (this.theme.includes('coast') || this.theme.includes('cliffs') || this.theme.includes('sea') || this.theme.includes('pontus')) {
      this.createCoastCliffsSet();
    }

    if (this.theme.includes('devi') || this.theme.includes('ravine')) {
      this.createDeviSet();
    }

    if (this.theme.includes('smith') || this.theme.includes('forge') || this.theme.includes('village')) {
      this.createSmithVillageSet();
    }

    if (this.theme.includes('watchfire') || this.theme.includes('trial')) {
      this.createWatchfireSet();
    }

    if (this.theme.includes('trade') || this.theme.includes('road') || this.theme.includes('phasis')) {
      this.createTradeRoadSet();
    }

    if (this.theme.includes('marsh')) {
      this.createMarshSet();
    }

    if (this.theme.includes('palisade')) {
      this.createPalisadeSet();
    }

    if (this.theme.includes('fleece') && this.theme.includes('gate')) {
      this.createFleeceGateSet();
    }

    if (this.theme.includes('heart')) {
      this.createHeartShrineSet();
    }

    if (this.theme.includes('forest') || this.theme.includes('grove') || this.theme.includes('oak')) addTrees(24);
    else addTrees(isRioniValley ? 7 : 10);

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

  private createRioniValleySet(): void {
    const river = this.makeWaterStrip(this.width + 0.8, 1.0);
    river.position.set(this.width / 2, 0.008, this.height - 0.55);
    this.group.add(river);

    const end = this.worldPath[this.worldPath.length - 1];
    if (end) {
      const bridge = this.makeBridge(1.55);
      bridge.rotation.y = Math.PI / 2;
      this.addPropUnsafe(bridge, THREE.MathUtils.clamp(end.x, 1.2, this.width - 1.2), this.height - 0.58, 1);
    }

    const vineyardX = 0.9;
    for (let i = 0; i < 4; i++) {
      const row = this.makeVineyardRow(7);
      row.rotation.y = -0.08;
      this.addProp(row, vineyardX + i * 0.42, 2.2, 0.95);
    }

    this.addProp(this.makeArchRuin(0x77735f), 1.4, this.height * 0.48, 1.05);
    this.addProp(this.makeArchRuin(0x827a60), this.width - 1.5, this.height * 0.43, 0.9);
    this.addProp(this.makeWatchtower(), this.width - 1.15, 1.25, 0.95);

    const bannerA = this.makeBanner(0x9b1d20);
    bannerA.rotation.y = 0.4;
    this.addProp(bannerA, 2.1, this.height * 0.78, 1);

    const bannerB = this.makeBanner(0x9b1d20);
    bannerB.rotation.y = -0.6;
    this.addProp(bannerB, this.width - 2.1, this.height * 0.62, 1);

    for (const [x, z, s] of [
      [this.width - 1.55, this.height - 2.2, 0.75],
      [this.width - 2.05, this.height - 2.05, 0.64],
      [0.9, this.height - 1.0, 0.66],
      [1.35, this.height - 0.92, 0.55],
    ] as Array<[number, number, number]>) {
      this.addProp(this.makeQvevri(), x, z, s);
    }

    this.addRockCluster(1.05, this.height * 0.68, 9, 0.9, 0x7f7a64);
    this.addRockCluster(this.width - 1.25, this.height * 0.72, 8, 0.8, 0x6f705e);
    this.addRockCluster(this.width * 0.5, this.height * 0.44, 8, 0.95, 0x827d67);
  }

  private createForestGroveSet(): void {
    for (let i = 0; i < 4; i++) {
      this.addProp(this.makeArchRuin(0x6f6f5d), 1.4 + i * 0.9, 1.4 + Math.sin(i) * 0.35, 0.72 + i * 0.05);
    }
    this.addProp(this.makeShrine(0xd4a017), this.width - 2.1, this.height - 2.2, 1.25);
    this.addRockCluster(this.width * 0.55, this.height * 0.35, 9, 1.1, 0x6f6f5c);
    this.addRockCluster(this.width * 0.2, this.height * 0.7, 8, 1.0, 0x777866);
    for (let i = 0; i < 6; i++) {
      this.addProp(this.makeQvevri(), this.width - 1.8 + this.rand() * 0.7, this.height - 3.2 - i * 0.34, 0.5 + this.rand() * 0.25);
    }
  }

  private createCoastCliffsSet(): void {
    const sea = this.makeWaterStrip(this.width + 1.2, 1.35);
    sea.position.set(this.width / 2, 0.01, 0.36);
    this.group.add(sea);
    this.addProp(this.makeLandingMarker(), this.width - 1.6, 1.15, 1.2);
    this.addProp(this.makeWatchtower(), 1.1, 1.2, 0.95);
    this.addProp(this.makeBanner(0x245f73), this.width - 2.3, 2.0, 1.0);
    this.addRockCluster(this.width * 0.28, 1.2, 10, 1.35, 0x7e7e72);
    this.addRockCluster(this.width * 0.78, 1.1, 10, 1.3, 0x707060);
  }

  private createDeviSet(): void {
    this.addRockCluster(this.width * 0.5, this.height * 0.5, 16, 1.8, 0x534f47);
    this.addRockCluster(this.width * 0.25, this.height * 0.55, 12, 1.3, 0x4d4a44);
    this.addRockCluster(this.width * 0.75, this.height * 0.58, 12, 1.3, 0x4d4a44);
    this.addProp(this.makeGate(0xaa3333), this.width - 1.9, this.height - 1.4, 1.3);
    this.addProp(this.makeWatchfire(), 1.5, 2.1, 1.2);
    this.addProp(this.makeWatchfire(), this.width - 1.6, 2.3, 1.2);
  }

  private createSmithVillageSet(): void {
    this.addProp(this.makeForge(), 1.5, 2.0, 1.2);
    this.addProp(this.makeHut(), 2.6, 2.6, 1.05);
    this.addProp(this.makeFire(), 3.2, 2.0, 1.2);
    this.addProp(this.makeBanner(0x7a4f1c), this.width - 2.0, this.height * 0.42, 1.0);
    this.addRockCluster(this.width * 0.42, this.height * 0.32, 10, 1.2, 0x66665f);
  }

  private createWatchfireSet(): void {
    this.addProp(this.makeWatchfire(), 1.8, 2.0, 1.35);
    this.addProp(this.makeWatchfire(), this.width - 1.8, 2.0, 1.35);
    this.addProp(this.makeWatchfire(), this.width - 2.0, this.height - 2.0, 1.35);
    this.addProp(this.makeWatchfire(), 2.2, this.height - 2.3, 1.25);
    this.addRockCluster(this.width * 0.5, this.height * 0.45, 12, 1.2, 0x6a6758);
  }

  private createTradeRoadSet(): void {
    for (let i = 0; i < 3; i++) {
      this.addProp(this.makeQvevri(), 1.1 + i * 0.28, this.height - 1.0 - i * 0.26, 0.62);
    }
    this.addProp(this.makeGate(0xd4a017), this.width - 1.8, this.height - 1.2, 1.18);
    this.addProp(this.makeBanner(0x8a5c1f), this.width * 0.48, this.height * 0.25, 1.0);
    this.addRockCluster(this.width * 0.2, this.height * 0.58, 8, 1.05, 0x7a7765);
    this.addRockCluster(this.width * 0.8, this.height * 0.58, 8, 1.05, 0x7a7765);
  }

  private createMarshSet(): void {
    const marsh = this.makeWaterStrip(this.width + 0.8, 1.55);
    marsh.position.set(this.width / 2, 0.006, this.height - 0.75);
    this.group.add(marsh);
    for (let i = 0; i < 8; i++) {
      const tuft = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.26, 5),
        new THREE.MeshLambertMaterial({ color: 0x5a7a42 }),
      );
      this.addPropUnsafe(tuft, 0.9 + this.rand() * (this.width - 1.8), this.height - 1.45 + this.rand() * 1.1, 0.9 + this.rand() * 0.35);
    }
    this.addProp(this.makeLandingMarker(), this.width - 1.8, this.height - 1.1, 1.12);
    this.addRockCluster(this.width * 0.4, this.height * 0.62, 11, 1.2, 0x6d6e61);
  }

  private createPalisadeSet(): void {
    for (let i = 1.6; i < this.width - 1.4; i += 0.52) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5, 4), new THREE.MeshLambertMaterial({ color: 0x735938 }));
      spike.position.y = 0.25;
      this.addPropUnsafe(spike, i, this.height - 1.0, 1);
    }
    this.addProp(this.makeGate(0xd4a017), this.width / 2, this.height - 1.05, 1.22);
    this.addRockCluster(this.width * 0.25, this.height * 0.7, 10, 1.0, 0x706f63);
    this.addRockCluster(this.width * 0.75, this.height * 0.7, 10, 1.0, 0x706f63);
  }

  private createFleeceGateSet(): void {
    this.addProp(this.makeGate(0xd4a017), this.width / 2, this.height - 1.1, 1.35);
    this.addProp(this.makeShrine(0xd4a017), this.width - 2.1, this.height - 2.0, 1.2);
    this.addProp(this.makeBanner(0xd4a017), 1.6, this.height * 0.35, 1.02);
    this.addRockCluster(this.width * 0.5, this.height * 0.52, 12, 1.25, 0x77735d);
  }

  private createHeartShrineSet(): void {
    this.addProp(this.makeShrine(0xd4a017), this.width / 2, this.height - 2.1, 1.45);
    this.addProp(this.makeArchRuin(0x6c6b5a), this.width * 0.28, this.height * 0.46, 1.1);
    this.addProp(this.makeArchRuin(0x6c6b5a), this.width * 0.72, this.height * 0.46, 1.1);
    this.addRockCluster(this.width * 0.5, this.height * 0.36, 14, 1.45, 0x767462);
    for (let i = 0; i < 5; i++) {
      this.addProp(this.makeQvevri(), this.width * 0.4 + i * 0.28, this.height - 1.35 + Math.sin(i) * 0.12, 0.58);
    }
  }

  private createLevelSignature(): void {
    if (this.era !== 0) return;
    const cX = this.width * 0.5;
    const cZ = this.height * 0.5;

    switch (this.levelNum) {
      case 1:
        this.addProp(this.makeShrine(0xd4a017), cX, this.height - 2.0, 1.1);
        break;
      case 2:
        this.addProp(this.makeBanner(0x9b1d20), cX - 1.1, cZ + 1.5, 1.05);
        this.addProp(this.makeBanner(0x9b1d20), cX + 1.1, cZ + 1.4, 1.05);
        break;
      case 3:
        this.addProp(this.makeArchRuin(0x6f6f5a), cX, cZ - 0.2, 1.1);
        break;
      case 4:
        this.addProp(this.makeLandingMarker(), cX + 1.5, 1.5, 1.1);
        break;
      case 5:
        this.addProp(this.makeGate(0xaa3333), cX, cZ + 1.3, 1.15);
        break;
      case 6:
        this.addProp(this.makeQvevri(), cX - 1.0, cZ + 1.2, 0.75);
        this.addProp(this.makeQvevri(), cX - 0.65, cZ + 0.9, 0.62);
        this.addProp(this.makeQvevri(), cX - 1.3, cZ + 0.95, 0.56);
        break;
      case 7:
        this.addRockCluster(cX + 1.6, cZ + 0.9, 8, 0.8, 0x6d6d5f);
        break;
      case 8:
        this.addProp(this.makeForge(), cX + 1.2, cZ + 0.8, 1.0);
        break;
      case 9:
        this.addProp(this.makeWatchfire(), cX - 1.3, cZ + 1.2, 1.15);
        this.addProp(this.makeWatchfire(), cX + 1.3, cZ + 1.2, 1.15);
        break;
      case 10:
        this.addRockCluster(cX, cZ, 12, 1.2, 0x4d4a44);
        break;
      case 11:
        this.addProp(this.makeBanner(0x8a5c1f), cX, cZ + 1.2, 1.1);
        break;
      case 12:
        this.addProp(this.makeShrine(0xd4a017), cX, cZ + 1.0, 1.18);
        this.addRockCluster(cX, cZ + 1.0, 7, 0.75, 0x77735f);
        break;
      case 13:
        this.addProp(this.makeWatchtower(), cX + 1.8, cZ - 0.8, 0.9);
        break;
      case 14:
        this.addRockCluster(cX - 1.0, cZ + 0.9, 6, 0.7, 0x777766);
        this.addRockCluster(cX + 1.0, cZ + 0.9, 6, 0.7, 0x777766);
        break;
      case 15:
        this.addProp(this.makeShrine(0xaa3333), cX, cZ + 0.9, 1.25);
        break;
      case 16:
        this.addProp(this.makeGate(0xd4a017), cX, cZ + 1.1, 1.1);
        break;
      case 17:
        this.addProp(this.makeLandingMarker(), cX, this.height - 1.3, 1.0);
        break;
      case 18:
        this.addProp(this.makeGate(0xd4a017), cX, this.height - 1.1, 1.28);
        break;
      case 19:
        this.addProp(this.makeShrine(0xd4a017), cX, cZ + 1.25, 1.25);
        break;
      case 20:
        this.addProp(this.makeShrine(0xd4a017), cX, this.height - 2.0, 1.5);
        this.addProp(this.makeBanner(0xd4a017), cX - 1.6, this.height - 2.3, 1.08);
        this.addProp(this.makeBanner(0xd4a017), cX + 1.6, this.height - 2.3, 1.08);
        break;
      default:
        break;
    }
  }

  private addRockCluster(cx: number, cz: number, count: number, spread: number, color = 0x777766): void {
    for (let i = 0; i < count; i++) {
      const angle = this.rand() * Math.PI * 2;
      const radius = this.rand() * spread;
      this.addProp(
        this.makeStone(color),
        cx + Math.cos(angle) * radius,
        cz + Math.sin(angle) * radius,
        0.55 + this.rand() * 0.7,
      );
    }
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

  // â”€â”€â”€ PUBLIC API (unchanged) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    const meshes: THREE.Object3D[] = [...this.tiles.flat()];
    this.plinths.forEach(p => {
      p.children.forEach(c => {
        if (c instanceof THREE.Mesh && c.userData.gx !== undefined) {
          meshes.push(c);
        }
      });
    });
    return meshes;
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

