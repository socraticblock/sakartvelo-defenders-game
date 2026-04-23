# Coding Standards — Sakartvelo Defenders

## Rule 1: No .ts File Over 300 Lines

This is enforced by a pre-commit hook at `~/hermes-workspace/.git/hooks/pre-commit`.

If a file hits **250+ lines**, split it. Don't wait until it breaks 300.

**How to split:**
1. Find the natural seam — a set of methods or data that belong together but separate from the rest
2. Create a new file with those methods/data
3. Import the new file from the original
4. Delete the old code from the original file
5. Build — fix any import errors
6. Verify the new file is under 300 lines

**Common split patterns:**
- Long class → class + extracted module of helpers
- Long class → base class + subclass (if inheritance fits the domain)
- Data-only code → extract to `*Configs.ts` or `*Data.ts`
- Styles/CSS → extract to `*Styles.ts`
- AI/behavior logic → extract to `*AI.ts`

## Rule 2: One Responsibility Per File

If you can't name the file in one clear word, it probably has too many responsibilities.

| Good | Bad |
|------|-----|
| `Tower.ts` (tower attack logic) | `Tower.ts` (tower attack + mesh building + config data) |
| `TowerMeshes.ts` (mesh builders) | `Tower.ts` (everything about towers) |
| `EnemyAI.ts` (enemy behavior) | `GameLoop.ts` (loop + enemy AI + tower targeting) |

## Rule 3: JSON Data Files — Compact Format

**Never pretty-print JSON data files.** Store them compact.

```bash
# Good — 202 lines
{"levels":[{"era":0,"level":1,...},{"era":0,"level":2,...}]}

# Bad — 30,852 lines (don't do this)
{
  "levels": [
    {
      "era": 0,
      "level": 1,
      ...
    }
  ]
}
```

To compact a JSON file:
```javascript
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('public/data/levels.json', 'utf8'));
const compact = d.levels.map(l => JSON.stringify(l)).join('\n');
fs.writeFileSync('public/data/levels.json', '{\"levels\":[\n' + compact + '\n]}\n');
```

## Rule 4: Dead Code → Delete, Don't Comment

If code is no longer used, **delete it**. Do not leave `.old.ts` files or commented-out blocks.

```bash
# Wrong — leaving a backup
mv Tower.ts Tower_old.ts

# Right — git handles history
rm Tower.ts
git commit -m "refactor: split Tower into Tower + TowerConfigs + TowerMeshes"
```

If you need to rollback, use `git checkout HEAD~1 -- src/Tower.ts`.

## Rule 5: Import Only What You Use

Don't import entire modules if you only need one export. This helps the bundler tree-shake better and makes dependencies explicit.

```typescript
// Good
import { gs } from './GameState';
import { TOWER_CONFIGS } from './types';

// Bad
import * as Game from './GameState';
```

## Rule 6: No `require()` in TypeScript

Use ES module `import/export`. If you see `require()` in a `.ts` file, replace it with a proper import at the top of the file.

```typescript
// Good
import { addOutlineTo } from './CelShader';

// Bad
const { addOutlineTo } = require('./CelShader');
```

## Rule 7: The Sakartvelo Codex (Premium Standards)

- **Prefixing**: All interactive DOM elements must use semantic prefixes: `btn-` (buttons), `screen-` (overlays), `hud-` (status bars), and `txt-` (labels).
- **Time-Safe Logic**: Every `update()` method must use the delta time (`dt`) parameter to ensure frame-rate independence. No hardcoded constants for time.
- **Singletons**: Core managers (Audio, Screens, GameState) must be accessed via their exported constants (e.g., `audio`, `screenMgr`, `gs`). Never instantiate new versions.
- **Strict Type Safety**: Avoid `any`. If a type is unknown, use `unknown` or define a proper Interface.
- **Design Excellence**: Every UI change must follow the "Premium Georgian" aesthetic (gold accents, serif typography, soft gradients).

## Rule 8: Input & Coordination Strategy

To ensure a high-precision feel in the 3D environment, the following input rules apply:

1. **Global Pointer Tracking**: Never track `pointermove` only on the canvas. Use the `document` level to ensure coordinates remain fresh even when the user is hovering over HTML UI elements (like the Tower Panel).
2. **Explicit Pointer Sync**: UI elements (buttons) must call `input.syncPointer(e.clientX, e.clientY)` on click. This ensures that the very next game loop frame uses the exact mouse position of the click for raycasting.
3. **Contextual Priority**: Input managers must prioritize the active intent. If `placementMode` is active, the grid should be targeted exclusively, ignoring incidental clicks on existing tower meshes or the hero.
4. **Interaction Interrupts**: New user intents (like a move command) should immediately clear secondary states. If the Hero is moved, any `pendingBuild` or `buildTimer` must be nullified to maintain a responsive "Action" feel.

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Class files | PascalCase | `Tower.ts`, `GameLoop.ts` |
| Type files | PascalCase | `types.ts`, `EnemyModels.ts` |
| Config/data files | PascalCase | `TowerConfigs.ts` | `historical_facts.ts` |
| Enum-like types | PascalCase | `EnemyArchetype` |
| Private methods | _camelCase | `_updateHover`, `_updateEnemies` |
| Constants | SCREAMING_SNAKE | `SLOW_RANGE_SQ`, `ATTACK_RANGE_SQ` |
| DOM element refs | $camelCase | `$waveBtn`, `$buildOverlay` |

## Pre-commit Hook Setup

The hook is at `~/hermes-workspace/.git/hooks/pre-commit`. It was installed manually (not via Husky).

If you need to reinstall it:
```bash
cat > ~/hermes-workspace/.git/hooks/pre-commit << 'EOF'
#!/bin/bash
MAX_LINES=300
FAIL=0

for file in $(git diff --cached --name-only | grep '\.ts$'); do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt "$MAX_LINES" ]; then
    echo "ERROR: $file has $lines lines (max $MAX_LINES)"
    FAIL=1
  fi
done

[ "$FAIL" -eq 1 ] && exit 1
exit 0
EOF
chmod +x ~/hermes-workspace/.git/hooks/pre-commit
```

## Verifying Before Commit

```bash
# Check all .ts files over 250 lines
cd hermes/development/sakartvelo-3d/src
wc -l *.ts | sort -n | awk '$1 > 250 { print }'

# Build to catch type errors
cd hermes/development/sakartvelo-3d
npm run build
```
