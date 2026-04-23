/**
 * InputManager.ts
 * All keyboard, mouse, and touch input.
 * Handles QWERTY/AZERTY auto-detection, raycasting, and event dispatch.
 */
import * as THREE from 'three';
import { Grid } from './Grid';
import { Tower } from './Tower';
import { TileUserData, TOWER_CONFIGS } from './types';
import { buildArcherMesh, buildCatapultMesh, buildWallMesh } from './TowerMeshes';

type MoveDir = { x: number; z: number };
type KBLayout = 'qwerty' | 'azerty';

interface InputCallbacks {
  onHeroMove: (x: number, z: number) => void;
  onGridClick: (gx: number, gy: number, isPath: boolean) => void;
  onTowerClick: (tower: Tower) => void;
  onAbility: (idx: number) => void;
  onEscape: () => void;
  onDeselect: () => void;
}

const MOVE_INTERVAL_MS = 33; // ~30 times/sec for hero movement
const HUD_SKIP_ZONE_PX = 100; // bottom HUD zone to skip for tap-to-move

export class InputManager {
  // ─── State ─────────────────────────────────────────────
  private _kbLayout: KBLayout = 'qwerty';
  private _layoutDetected = false;
  private _savedLayout = false;

  // Mouse tracking — process once per frame, not per event
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

  private readonly ABILITY_KEYS: string[] = ['q', 'e', 'r'];
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
      return;
    }

    if (selectedType !== this._lastHoverType) {
      this._lastHoverType = selectedType;
      this._rebuildGhost(hoverGroup, selectedType);
      this._mouseDirty = true; // Force update when type changes
    }

    if (!this._mouseDirty) return;
    this._mouseDirty = false;

    const cell = this.getMouseGrid(grid);
    if (!cell) {
      hoverGroup.visible = false;
      return;
    }

    const cost = TOWER_CONFIGS[selectedType]?.cost ?? Infinity;
    const ok = grid.isBuildable(cell.gx, cell.gy, selectedType === 'wall') && gold >= cost;

    hoverGroup.position.set(cell.gx + 0.5, 0.08, cell.gy + 0.5);
    hoverGroup.visible = true;

    // Fade the ghost based on buildability
    hoverGroup.traverse(c => {
      if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshLambertMaterial) {
        c.material.emissive.setHex(ok ? 0x000000 : 0x440000);
        c.material.opacity = ok ? 0.4 : 0.2;
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

  getAbilityKeys(): string[] { return this.ABILITY_KEYS[this._kbLayout]; }
  getAbilityLabels(): string[] { return this.ABILITY_LABELS[this._kbLayout]; }

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

    // Mouse move (just track position, don't raycast yet)
    this._renderer.domElement.addEventListener('pointermove', this._onPointerMove);

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

  private _detectLayout(key: string): void {
    if (this._layoutDetected) return;
    this._layoutDetected = true;
    if (key === 'w') this._kbLayout = 'qwerty';
    else if (key === 'z') this._kbLayout = 'azerty';
    else this._kbLayout = 'qwerty';
    requestAnimationFrame(() => localStorage.setItem('sakartvelo_kb_layout', this._kbLayout));
  }

  private _computeHeroDir(): MoveDir {
    let dx = 0, dz = 0;
    const move = this._kbLayout === 'azerty' ? this.AZERTY_MOVE : this.QWERTY_MOVE;
    for (const k of this._keysDown) {
      const d = move[k] || this.ARROW_MOVE[k];
      if (d) { dx += d.x; dz += d.z; }
    }
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len === 0) return { x: 0, z: 0 };
    return { x: dx / len, z: dz / len };
  }

  private _updateHeroMove(): void {
    const now = performance.now();
    if (now - this._lastHeroMove < MOVE_INTERVAL_MS) return;
    this._lastHeroMove = now;
    const next = this._computeHeroDir();
    if (next.x === this._heroKeyDir.x && next.z === this._heroKeyDir.z) return;
    this._heroKeyDir = next;
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

    const gs = (window as any).__gs;
    const grid = (window as any).__grid || (window as any).__gs_grid || gs?.grid;
    if (!gs || !grid) return;

    // 1. Check for Towers (Selection)
    const tower = this.getMouseTower(gs.towers);
    if (tower) {
      this._cb.onTowerClick(tower);
      return;
    }

    // 2. Check for Grid (Placement)
    const cell = this.getMouseGrid(grid);
    if (cell) {
      this._cb.onGridClick(cell.gx, cell.gy, cell.isPath);
    } else {
      // If we clicked empty space on the canvas, just deselect, don't exit to menu
      this._cb.onDeselect();
    }
  };

  private _dispatchClick(e: PointerEvent): void {
    this._mouseX = e.clientX;
    this._mouseY = e.clientY;

    // Callers will do tower check — we just expose position
    const grid = (window as any).__gs_grid as Grid | null;
    if (!grid) return;

    const cell = this.getMouseGrid(grid);
    if (cell) this._cb.onGridClick(cell.gx, cell.gy, cell.isPath);
  }

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
  };
}

export const input = new InputManager();
