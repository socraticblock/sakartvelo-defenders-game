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
import { warHorn } from './WarHorn';

type KBLayout = 'qwerty' | 'azerty';

interface InputCallbacks {
  onHeroMove: (x: number, z: number) => void;
  onGridClick: (gx: number, gy: number, isPath: boolean) => void;
  onBuildNodeClick: (gx: number, gy: number) => void;
  onTowerClick: (tower: Tower) => void;
  onAbility: (idx: number) => void;
  onEscape: () => void;
  onDeselect: () => void;
}

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

  // Pinch-to-zoom
  private _activePointers = new Map<number, PointerEvent>();
  private _isPinching = false;
  private _initialPinchDist = 0;
  private _initialZoom = 100;
  private _wheelDilationTimer: any = null;

  // Camera Drag-to-pan
  private _isDragging = false;
  private _dragStartX?: number;
  private _dragStartY?: number;
  private _camStartBaseX = 0;
  private _camStartBaseZ = 0;

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

  private readonly ABILITY_LABELS: string[] = ['Q', 'W', 'E'];

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

    // --- VISUAL SNAP LOGIC ---
    let cell = { ...rawCell };
    const groundPos = this.getMouseGround();
    const closestPlinth = this._getClosestPlinth(grid, selectedType, groundPos);

    if (closestPlinth) {
      cell.gx = closestPlinth.userData.gx;
      cell.gy = closestPlinth.userData.gy;
      hoverGroup.position.copy(closestPlinth.position);
      hoverGroup.position.y += 0.02; 
    } else {
      hoverGroup.position.set(cell.gx + 0.5, 0.06, cell.gy + 0.5);
    }

    const cost = TOWER_CONFIGS[selectedType]?.cost ?? Infinity;
    const ok = grid.isBuildable(cell.gx, cell.gy, selectedType === 'wall') && gold >= cost;

    hoverGroup.visible = true;

    hoverGroup.traverse(c => {
      if (c instanceof THREE.Mesh) {
        const mat = c.material as any;
        if (mat.isMaterial) {
          mat.opacity = ok ? 0.7 : 0.2;
        }
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
      buildCatapultMesh(group, 1, 1, color);
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
        if (c.userData.isOutline) {
          c.visible = false;
          return;
        }
        const mat = Array.isArray(c.material) ? c.material[0] : c.material;
        const origColor = (mat as any).color?.getHex() ?? color;

        c.material = new THREE.MeshBasicMaterial({
          color: origColor,
          transparent: true,
          opacity: 0.7,
          depthWrite: false
        });
      }
    });
  }

  private _getClosestPlinth(
    grid: Grid,
    selectedType: string | null,
    groundPos: THREE.Vector3 | null,
  ): THREE.Group | null {
    if (!groundPos || !selectedType || selectedType === 'wall') return null;
    const plinths = (grid as any).plinths as THREE.Group[] | undefined;
    if (!plinths?.length) return null;
    const SNAP_RADIUS = 2.0; // world units, shared by ghost + placement
    let closest: THREE.Group | null = null;
    let minDist = SNAP_RADIUS;
    for (const p of plinths) {
      if (p.userData.occupied) continue;
      const dist = p.position.distanceTo(groundPos);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }
    return closest;
  }

  // ─── Public: layout ─────────────────────────────────────

  get layout(): KBLayout { return this._kbLayout; }
  get layoutLabel(): string { return this._kbLayout.toUpperCase(); }

  getAbilityKeys(): string[] {
    return this._kbLayout === 'azerty' ? ['a', 'z', 'e'] : ['q', 'w', 'e'];
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

    for (const hit of hits) {
      if ((hit.object as any).userData?.ignoreTowerPick) continue;
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if ((obj as any).userData?.isTower) return (obj as any).userData.tower as Tower;
        obj = obj.parent;
      }
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
    document.addEventListener('pointerup', this._onPointerUp);
    document.addEventListener('pointercancel', this._onPointerUp);

    // Prevent native browser pinch-to-zoom
    this._renderer.domElement.addEventListener('touchmove', (e) => {
      if (e.touches.length >= 2) e.preventDefault();
    }, { passive: false });

    // Touchpad pinch-to-zoom
    this._renderer.domElement.addEventListener('wheel', this._onWheel, { passive: false });

    // Right click — hero move
    this._renderer.domElement.addEventListener('contextmenu', this._onContextMenu);

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

    // Ability keys: Q/W/E on QWERTY, A/Z/E on AZERTY.
    const keys = this.getAbilityKeys();

    const idx = keys.indexOf(k);
    if (idx >= 0) this._cb.onAbility(idx);
  };

  private _onKeyUp = (e: KeyboardEvent): void => {
    // No longer tracking keys for movement
  };

  private _onPointerUp = (e: PointerEvent): void => {
    this._activePointers.delete(e.pointerId);

    const wasPinching = this._isPinching;
    const wasDragging = this._isDragging;

    if (this._isPinching && this._activePointers.size < 2) {
      this._isPinching = false;
      // Restore time if no UI menus are open
      if (!gs.selectedTower && !document.getElementById('build-circle')?.classList.contains('visible')) {
        gs.targetTimeScale = 1.0;
      }
    }

    // Reset drag start tracking coordinates
    this._dragStartX = undefined;
    this._dragStartY = undefined;
    this._isDragging = false;

    // Only process tap/click if the pointer did not pinch or drag
    if (!wasPinching && !wasDragging) {
      if (this._isBlockedByUi(e.clientX, e.clientY)) return;

      this._mouseX = e.clientX;
      this._mouseY = e.clientY;
      this._mouseDirty = true;

      const grid = gs.grid;
      if (!grid) return;

      // Check WarHorn FIRST
      if (warHorn.group.visible && gs.waveMgr && (!gs.waveMgr.active || gs.waveMgr.inBuildPhase)) {
        this._getNormalizedMouse();
        this._ray.setFromCamera(this._mouse, this._camera);
        const hits = this._ray.intersectObject(warHorn.group, true);
        if (hits.length > 0) {
          console.log('--- WAR HORN HIT! ---');
          const bonus = gs.waveMgr.inBuildPhase ? gs.getBuildPhaseBonus() : (gs.waveCountdownActive ? gs.getCountdownBonus() : 0);
          gs.startWave(bonus);
          return; // Click swallowed
        }
      }

      // Placement mode: ray hits tall tower meshes before the ground tile — always use grid.
      if (gs.selectedType) {
        const rawCell = this.getMouseGrid(grid);
        if (rawCell) {
          let gx = rawCell.gx;
          let gy = rawCell.gy;

          const groundPos = this.getMouseGround();
          const snapP = this._getClosestPlinth(grid, gs.selectedType, groundPos);
          if (snapP) {
            gx = snapP.userData.gx;
            gy = snapP.userData.gy;
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
        if (grid.isPlinthCell(cell.gx, cell.gy)) {
          this._cb.onBuildNodeClick(cell.gx, cell.gy);
          return;
        }
        const pos = this.getMouseGround();
        if (pos) {
          this._cb.onHeroMove(pos.x, pos.z);
          // Clear tower selection when moving hero or clicking away
          this._cb.onDeselect();
        }
      } else {
        this._cb.onDeselect();
      }
    }
  };

  private _onPointerMove = (e: PointerEvent): void => {
    if (this._activePointers.has(e.pointerId)) {
      this._activePointers.set(e.pointerId, e);
    }

    if (this._activePointers.size >= 2) {
      const pts = Array.from(this._activePointers.values());
      const dx = pts[0].clientX - pts[1].clientX;
      const dy = pts[0].clientY - pts[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!this._isPinching) {
        if (Math.abs(dist - this._initialPinchDist) > 10) { // Deadzone
          this._isPinching = true;
          this._initialPinchDist = dist;
          gs.targetTimeScale = 0.1; // Tactical Time Dilation
        }
      }

      if (this._isPinching) {
        const delta = dist - this._initialPinchDist;
        const targetZoom = this._initialZoom + delta * 0.3;
        if ((window as any).__setCameraZoom) {
          (window as any).__setCameraZoom(targetZoom);
        }
      }
      return; // Do not process hover or dragging while pinching
    }

    // Camera Drag-to-pan handling
    if (this._dragStartX !== undefined && this._dragStartY !== undefined) {
      const dx = e.clientX - this._dragStartX;
      const dy = e.clientY - this._dragStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!this._isDragging) {
        const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
        const dragThreshold = isTouch ? 16 : 8;
        if (dist > dragThreshold) { // Drag deadzone threshold
          this._isDragging = true;
        }
      }

      if (this._isDragging) {
        // Compute pan factor dynamically based on height of camera
        const factor = (gs.cameraHeight || 15) * 0.0018;
        
        // Boundaries based on level grid size + cushion for expanded scenery
        const gridWidth = gs.currentLevel?.grid_width ?? 18;
        const gridHeight = gs.currentLevel?.grid_height ?? 10;
        let minX = -6;
        let maxX = gridWidth + 6;
        let minZ = -4;
        let maxZ = gridHeight + 4;

        if (gs.currentLevel && gs.currentLevel.map_presentation === 'full_field') {
          const w = gs.currentLevel.visual_width ?? gridWidth;
          const h = gs.currentLevel.visual_height ?? gridHeight;
          const ox = gs.currentLevel.visual_offset_x ?? 0;
          const oz = gs.currentLevel.visual_offset_y ?? 0;
          const cx = gridWidth / 2 + ox;
          const cz = gridHeight / 2 + oz;
          
          // Clamp to visual boundaries minus margins to prevent showing empty backdrop scenery
          minX = cx - w / 2 + 4;
          maxX = cx + w / 2 - 4;
          minZ = cz - h / 2 + 3;
          maxZ = cz + h / 2 - 3;
        }

        gs.cameraBaseX = THREE.MathUtils.clamp(this._camStartBaseX - dx * factor, minX, maxX);
        gs.cameraBaseZ = THREE.MathUtils.clamp(this._camStartBaseZ - dy * factor, minZ, maxZ);
        return; // Skip hover updates while dragging
      }
    }

    this._mouseX = e.clientX;
    this._mouseY = e.clientY;
    this._mouseDirty = true;
  };

  private _onPointerDown = (e: PointerEvent): void => {
    this._activePointers.set(e.pointerId, e);

    if (this._activePointers.size >= 2) {
      const pts = Array.from(this._activePointers.values());
      const dx = pts[0].clientX - pts[1].clientX;
      const dy = pts[0].clientY - pts[1].clientY;
      this._initialPinchDist = Math.sqrt(dx * dx + dy * dy);
      this._initialZoom = (window as any).__getCameraZoom?.() || 100;
      this._isPinching = true;
      this._isDragging = false;
      this._dragStartX = undefined;
      this._dragStartY = undefined;
      return; // Cancel regular click
    }

    // Only handle Left Click (button 0) for primary interactions
    if (e.button !== 0) return;
    if (this._isBlockedByUi(e.clientX, e.clientY)) return;

    // Stop propagation so we don't trigger multiple handlers
    e.stopPropagation();

    // Start tracking drag
    this._isDragging = false;
    this._dragStartX = e.clientX;
    this._dragStartY = e.clientY;
    this._camStartBaseX = gs.cameraBaseX;
    this._camStartBaseZ = gs.cameraBaseZ;

    this._mouseX = e.clientX;
    this._mouseY = e.clientY;
    this._mouseDirty = true;
  };

  private _onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    if (this._isBlockedByUi(e.clientX, e.clientY)) return;
    const pos = this.getMouseGround();
    if (pos) this._cb.onHeroMove(pos.x, pos.z);
  };

  private _isBlockedByUi(clientX: number, clientY: number): boolean {
    if (document.getElementById('game-info-modal')?.classList.contains('visible')) return true;
    if (document.getElementById('game-settings-modal')?.classList.contains('visible')) return true;
    if (document.getElementById('pause-menu-modal')?.classList.contains('visible')) return true;
    if (document.getElementById('bestiary-modal')?.classList.contains('visible')) return true;
    if (document.getElementById('enemy-intro-modal')?.classList.contains('visible')) return true;
    const topElement = document.elementFromPoint(Math.max(0, clientX), Math.max(0, clientY));
    if (topElement?.closest('.game-ui') && !topElement.closest('canvas')) return true;
    const bottomBar = document.getElementById('bottom-bar');
    const heroBar = document.getElementById('hero-bar');
    const towerPanel = document.getElementById('tower-panel');
    const rects = [bottomBar, heroBar, towerPanel]
      .filter((el): el is HTMLElement => Boolean(el) && getComputedStyle(el!).display !== 'none')
      .map(el => el.getBoundingClientRect());
    return rects.some(r =>
      clientX >= r.left - 6 &&
      clientX <= r.right + 6 &&
      clientY >= r.top - 6 &&
      clientY <= r.bottom + 6
    );
  }

  private _onResize = (): void => {
    (this._camera as THREE.PerspectiveCamera).aspect = innerWidth / innerHeight;
    (this._camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    this._renderer.setSize(innerWidth, innerHeight);
    this._mouseDirty = true;
  };

  private _onWheel = (e: WheelEvent): void => {
    // Only intercept if it's a touchpad pinch (ctrlKey) or standard scroll zoom
    // Note: deltaY is positive when zooming OUT (scrolling down)
    if (e.ctrlKey) {
      e.preventDefault();
      
      const currentZoom = (window as any).__getCameraZoom?.() || 100;
      // Invert delta: scrolling down/pinching in = negative delta in some browsers, but let's assume standard
      // deltaY > 0 means zoom OUT -> targetZoom should decrease.
      const targetZoom = currentZoom - e.deltaY * 0.15;
      
      if ((window as any).__setCameraZoom) {
        (window as any).__setCameraZoom(targetZoom);
      }

      // Tactical Time Dilation for touchpad
      gs.targetTimeScale = 0.1;
      clearTimeout(this._wheelDilationTimer);
      this._wheelDilationTimer = setTimeout(() => {
        // Only restore if no other menus are open and no physical pinch is active
        const buildMenuOpen = document.getElementById('build-circle')?.classList.contains('visible');
        if (!this._isPinching && !gs.selectedTower && !buildMenuOpen) {
          gs.targetTimeScale = 1.0;
        }
      }, 250);
    }
  };
}

export const input = new InputManager();
