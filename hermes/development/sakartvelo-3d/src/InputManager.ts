/**
 * InputManager.ts
 * All keyboard, mouse, and touch input.
 * Handles QWERTY/AZERTY auto-detection, raycasting, and event dispatch.
 */
import * as THREE from 'three';
import { gs } from './GameState';
import { Grid } from './Grid';
import { Tower } from './Tower';
import { TileUserData, TOWER_CONFIGS } from './types';
import { buildArcherMesh, buildCatapultMesh, buildWallMesh } from './TowerMeshes';

type KBLayout = 'qwerty' | 'azerty';

interface InputCallbacks {
  onHeroMove: (x: number, z: number) => void;
  onGridClick: (gx: number, gy: number, isPath: boolean) => void;
  onTowerClick: (tower: Tower) => void;
  onAbility: (idx: number) => void;
  onEscape: () => void;
  onDeselect: () => void;
}

const HUD_SKIP_ZONE_PX = 100; // bottom HUD zone to skip for tap-to-move

export class InputManager {
  // ─── State ─────────────────────────────────────────────
  private _kbLayout: KBLayout = 'qwerty';
  private _layoutDetected = false;
  private _savedLayout = false;

  // Mouse tracking — process once per frame, not per event.
  // Track viewport coordinates from document-level pointer events so the ray stays
  // correct while the cursor is over HTML UI (tower panel) or the canvas.
  private _mouseX = 0;
  private _mouseY = 0;
  private _mouseDirty = false;
  private _lastHoverType: string | null = null;

  // Three.js refs
  private _renderer!: THREE.WebGLRenderer;
  private _camera!: THREE.Camera;
  private _scene!: THREE.Scene;
  private _ray = new THREE.Raycaster();
  private _mouse = new THREE.Vector2();

  // Callbacks
  private _cb!: InputCallbacks;

  // Reusable vectors
  private _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private _groundTarget = new THREE.Vector3();

  private readonly ABILITY_LABELS: string[] = ['Q', 'E', 'R'];

  // ─── Init ──────────────────────────────────────────────

  init(
    renderer: THREE.WebGLRenderer,
    camera: THREE.Camera,
    scene: THREE.Scene,
    cb: InputCallbacks,
  ): void {
    this._renderer = renderer;
    this._camera = camera;
    this._scene = scene;
    this._cb = cb;

    // Restore saved layout preference
    const saved = localStorage.getItem('sakartvelo_kb_layout') as KBLayout | null;
    if (saved === 'azerty') {
      this._kbLayout = 'azerty';
      this._layoutDetected = true;
      this._savedLayout = true;
    }

    this._bindEvents();
    this._seedMouseAtCanvasCenter();
  }

  /** Call from HTML UI (e.g. tower buttons) so the ghost uses the cursor at click time. */
  syncPointer(clientX: number, clientY: number): void {
    this._mouseX = clientX;
    this._mouseY = clientY;
    this._mouseDirty = true;
  }

  /** Prime raycast coords before the first pointermove (instant ghost after UI click). */
  private _seedMouseAtCanvasCenter(): void {
    const r = this._renderer.domElement.getBoundingClientRect();
    this._mouseX = r.left + r.width * 0.5;
    this._mouseY = r.top + r.height * 0.5;
    this._mouseDirty = true;
  }

  // ─── Per-frame hover update ────────────────────────────
  // Call once per frame from game loop to process hover at 60fps cost.

  updateHover(
    hoverGroup: THREE.Group,
    grid: Grid | null,
    selectedType: string | null,
    gold: number,
  ): void {
    if (!selectedType || !grid) {
      hoverGroup.visible = false;
      this._lastHoverType = null;
      hoverGroup.clear();
      return;
    }

    if (selectedType !== this._lastHoverType) {
      this._lastHoverType = selectedType;
      this._rebuildGhost(hoverGroup, selectedType);
    }

    const rawCell = this.getMouseGrid(grid);
    if (!rawCell) {
      hoverGroup.visible = false;
      return;
    }

    // --- MAGNETIC SNAP LOGIC ---
    let cell = { ...rawCell };
    const MAGNET_RANGE = 2.5;
    let closestPlinth = null;
    let minDist = Infinity;

    // Search for nearest unoccupied plinth
    const plinths = (grid as any).plinths as THREE.Group[];
    if (plinths && selectedType !== 'wall') {
      for (const p of plinths) {
        if (p.userData.occupied) continue;
        const dx = rawCell.gx - p.userData.gx;
        const dy = rawCell.gy - p.userData.gy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAGNET_RANGE && dist < minDist) {
          minDist = dist;
          closestPlinth = p;
        }
      }
    }

    // If a plinth is nearby, SNAP!
    if (closestPlinth) {
      cell.gx = closestPlinth.userData.gx;
      cell.gy = closestPlinth.userData.gy;
    }
    // ----------------------------

    const cost = TOWER_CONFIGS[selectedType]?.cost ?? Infinity;
    const ok = grid.isBuildable(cell.gx, cell.gy, selectedType === 'wall') && gold >= cost;

    // Match Tower.group Y so the preview sits on the same footprint as a real tower.
    hoverGroup.position.set(cell.gx + 0.5, 0.06, cell.gy + 0.5);
    hoverGroup.visible = true;

    // Fade the ghost based on buildability
    hoverGroup.traverse(c => {
      if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshLambertMaterial) {
        // If snapped, use a brighter emissive
        const emissiveColor = ok ? (closestPlinth ? 0x222200 : 0x000000) : 0x440000;
        c.material.emissive.setHex(emissiveColor);
        c.material.opacity = ok ? 0.6 : 0.2;
      }
    });
  }

  private _rebuildGhost(group: THREE.Group, type: string) {
    group.clear();
    const color = TOWER_CONFIGS[type]?.color ?? 0xffffff;

    // We use a simplified version of the tower meshes with transparency
    if (type === 'archer') {
      buildArcherMesh(group, 1, 1, color);
    } else if (type === 'catapult') {
      buildCatapultMesh(group, 1, 1);
    } else if (type === 'wall') {
      // Provide dummy meshes for wall HP bar components to avoid crashes
      const dummyBg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
      const dummyFill = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1));
      buildWallMesh(group, 1, dummyBg, dummyFill);
      // Hide the dummy bars in the ghost
      dummyBg.visible = false;
      dummyFill.visible = false;
    }

    group.traverse(c => {
      if (c instanceof THREE.Mesh) {
        // Capture the color before replacing the material
        const origColor = (c.material as THREE.MeshLambertMaterial).color?.getHex() ?? color;
        c.material = new THREE.MeshLambertMaterial({
          color: origColor,
          transparent: true,
          opacity: 0.4,
          depthWrite: false
        });
      }
    });
  }

  // ─── Public: layout ─────────────────────────────────────

  get layout(): KBLayout { return this._kbLayout; }
  get layoutLabel(): string { return this._kbLayout.toUpperCase(); }

  getAbilityKeys(): string[] {
    return this._kbLayout === 'azerty' ? ['a', 'e', 'r'] : ['q', 'e', 'r'];
  }
  getAbilityLabels(): string[] {
    return this.ABILITY_LABELS;
  }

  toggleLayout(): void {
    // Keyboard layout no longer matters for movement, but we keep the toggle for ability label preference
    this._kbLayout = this._kbLayout === 'qwerty' ? 'azerty' : 'qwerty';
    localStorage.setItem('sakartvelo_kb_layout', this._kbLayout);
  }

  // ─── Public: raycasting ────────────────────────────────

  private _getNormalizedMouse(): void {
    const rect = this._renderer.domElement.getBoundingClientRect();
    // Calculate mouse position relative to the canvas, strictly bound to -1 to +1
    this._mouse.x = ((this._mouseX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((this._mouseY - rect.top) / rect.height) * 2 + 1;
  }

  getMouseGrid(grid: Grid): { gx: number; gy: number; isPath: boolean } | null {
    this._getNormalizedMouse();
    this._ray.setFromCamera(this._mouse, this._camera);

    // Specifically target the ground tiles to avoid character collision offset
    const tiles = grid.getAllTileMeshes();
    const hits = this._ray.intersectObjects(tiles);

    if (hits.length > 0) {
      const tile = hits[0].object;
      return tile.userData as TileUserData;
    }
    return null;
  }

  getMouseGround(): THREE.Vector3 | null {
    this._getNormalizedMouse();
    this._ray.setFromCamera(this._mouse, this._camera);
    const hit = this._ray.ray.intersectPlane(this._plane, this._groundTarget);
    return hit ? this._groundTarget.clone() : null;
  }

  getMouseTower(towers: Tower[]): Tower | null {
    this._getNormalizedMouse();
    this._ray.setFromCamera(this._mouse, this._camera);

    const meshes: THREE.Object3D[] = [];
    for (const t of towers) t.group.traverse(c => meshes.push(c));
    const hits = this._ray.intersectObjects(meshes);
    if (hits.length === 0) return null;

    let obj: THREE.Object3D | null = hits[0].object;
    while (obj) {
      if (obj.userData?.isTower) return obj.userData.tower as Tower;
      obj = obj.parent;
    }
    return null;
  }

  // ─── Private ───────────────────────────────────────────

  private _bindEvents(): void {
    // Keyboard
    addEventListener('keydown', this._onKeyDown);
    addEventListener('keyup', this._onKeyUp);

    // Global pointer move: cursor is often over the HTML HUD while choosing a tower type.
    document.addEventListener('pointermove', this._onPointerMove, { passive: true });

    // Mouse click — tower select or tower place
    this._renderer.domElement.addEventListener('pointerdown', this._onPointerDown);

    // Right click — hero move
    this._renderer.domElement.addEventListener('contextmenu', this._onContextMenu);

    // Touch — tap to move hero
    this._renderer.domElement.addEventListener('touchend', this._onTouchEnd, { passive: false });

    // Pointer lock — prevent it
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) document.exitPointerLock();
    });
    this._renderer.domElement.addEventListener('dragstart', e => e.preventDefault());

    // Window resize
    addEventListener('resize', this._onResize);
  }

  private _onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') { this._cb.onEscape(); return; }

    const k = e.key.toLowerCase();

    // Auto-detect layout for ability labels only
    if (!this._savedLayout && !this._layoutDetected) {
      if (k === 'w') { this._kbLayout = 'qwerty'; this._layoutDetected = true; }
      else if (k === 'z') { this._kbLayout = 'azerty'; this._layoutDetected = true; }
    }

    // Ability keys (mapping to standard QER regardless of layout for now, or use the layout preference)
    const qer = ['q', 'e', 'r'];
    const az = ['a', 'e', 'r'];
    const keys = this._kbLayout === 'azerty' ? az : qer;

    const idx = keys.indexOf(k);
    if (idx >= 0) this._cb.onAbility(idx);
  };

  private _onKeyUp = (e: KeyboardEvent): void => {
    // No longer tracking keys for movement
  };

  private _onPointerMove = (e: PointerEvent): void => {
    this._mouseX = e.clientX;
    this._mouseY = e.clientY;
    this._mouseDirty = true;
  };

  private _onPointerDown = (e: PointerEvent): void => {
    // Only handle Left Click (button 0)
    if (e.button !== 0) return;

    // Stop propagation so we don't trigger multiple handlers
    e.stopPropagation();

    this._mouseX = e.clientX;
    this._mouseY = e.clientY;

    const grid = gs.grid;
    if (!grid) return;

    // Placement mode: ray hits tall tower meshes before the ground tile — always use grid.
    if (gs.selectedType) {
      const rawCell = this.getMouseGrid(grid);
      if (rawCell) {
        let gx = rawCell.gx;
        let gy = rawCell.gy;
        
        // APPLY MAGNET
        const MAGNET_RANGE = 2.5;
        const plinths = (grid as any).plinths as THREE.Group[];
        if (plinths && gs.selectedType !== 'wall') {
          let minDist = Infinity;
          let snapP = null;
          for (const p of plinths) {
            if (p.userData.occupied) continue;
            const dx = gx - p.userData.gx;
            const dy = gy - p.userData.gy;
            const d = Math.sqrt(dx*dx + dy*dy);
            if (d < MAGNET_RANGE && d < minDist) {
              minDist = d;
              snapP = p;
            }
          }
          if (snapP) {
            gx = snapP.userData.gx;
            gy = snapP.userData.gy;
          }
        }
        
        this._cb.onGridClick(gx, gy, rawCell.isPath);
      } else {
        this._cb.onDeselect();
      }
      return;
    }

    const tower = this.getMouseTower(gs.towers);
    if (tower) {
      this._cb.onTowerClick(tower);
      return;
    }

    const cell = this.getMouseGrid(grid);
    if (cell) {
      const pos = this.getMouseGround();
      if (pos) {
        this._cb.onHeroMove(pos.x, pos.z);
        // Clear tower selection when moving hero or clicking away
        this._cb.onDeselect();
      }
    } else {
      this._cb.onDeselect();
    }
  };

  private _onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    const pos = this.getMouseGround();
    if (pos) this._cb.onHeroMove(pos.x, pos.z);
  };

  private _onTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (!t) return;
    if (t.clientY > window.innerHeight - HUD_SKIP_ZONE_PX) return;
    this._mouseX = t.clientX;
    this._mouseY = t.clientY;
    const pos = this.getMouseGround();
    if (pos) this._cb.onHeroMove(pos.x, pos.z);
  };

  private _onResize = (): void => {
    (this._camera as THREE.PerspectiveCamera).aspect = innerWidth / innerHeight;
    (this._camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    this._renderer.setSize(innerWidth, innerHeight);
    this._mouseDirty = true;
  };
}

export const input = new InputManager();
