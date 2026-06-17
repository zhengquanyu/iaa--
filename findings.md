# KillWxapkgGame Findings and Decisions

## Requirements
- Build a persistent project memory library for optimization work.
- Record project structure, patch strategy, previous optimizations, verification methods, errors, and constraints.
- Future complex work should follow the `planning-with-files` pattern: read memory first, update findings and progress during work.

## Project Shape
- Workspace: `C:\Users\admin\Desktop\KillWxapkgGame`
- Project type: WeChat mini-game decompile / restore / runtime patch project.
- Main runtime patch file: `game.js`.
- `game.js` first requires `./wx-restore-loader.js`, then `./game.bundle.js`, then installs many runtime patches.
- Large bundle: `game.bundle.js`. Avoid manual edits unless strictly necessary.
- Decompiled references: `subpackages/game/game.js`, `subpackages/game/import/**/*.json`, `subpackages/game2/**`.
- UI replacement source images: `ui_replacement_images/`.
- Runtime replacement images: `ui_replacement_runtime/`, including `pure_mode_entry.png`, `multi_mode_entry.png`, `home_rank_entry.png`, `home_share_entry.png`, `puzzle_frame.png`.
- Generation scripts/data: `gen_replace.js`, `illustrated-replacement-data.js`, `puzzle-replacement-data.js`, `animal-replacement-data.js`, `sheep-sequence-data.js`.

## Current Working Tree Notes
- `git status --short` previously showed modifications in `game.js`, `gen_replace.js`, `illustrated-replacement-data.js`, `project.config.json`, several replacement images, and two animal icon PNGs.
- `ui_replacement_runtime/` is currently untracked.
- Future Codex sessions must not revert these changes unless the user explicitly requests it.
- Use targeted diffs and targeted searches because full `game.js` diff may include older unrelated changes.

## Recent Optimization: First-Frame Old UI Flash
User-reported issue:
- On opening the game in WeChat DevTools, the old hidden-friend-circle / game-club style button still appeared on the first frame, then became covered by the pure-color entry button.
- On entering level gameplay, the original button to the left of the level board appeared on the first frame, then became covered by the new pure-color mode UI.

Fix strategy implemented in `game.js`:
- Added `clearNodeGraphics(node)` so fallback `cc.Graphics` drawings are cleared when the final sprite arrives.
- Added `hideNodeOwnSprite(node)` to synchronously clear and disable a node's own `cc.Sprite` before it can render old art.
- Added `keepNodeVisibleForTouch(node)` to keep parent nodes active for touch without recursively showing old child nodes.
- Updated `installHideGameCirclePatch()` so `clubBtn`, `gameClub*`, `circleBtn`, etc. clear their own sprite before hiding the node/parent.
- Updated `updateGameColorModeButton(button)` for gameplay `skinBtn`: hide the parent old sprite, create/show `restoreGameColorModeIcon`, hide original children, and preserve only the new icon plus `restoreGameColorModeHitProxy`.
- Updated `ensureHomeColorModeButton()` to draw a local fallback icon before async final images finish loading.
- Added `scrubFirstFrameButtonsSoon(duration)` and called it on startup and around `openGamePanel()` to cover the early window before the 500ms interval runs.
- Ran `node --check game.js`; syntax passed.
- Still needs visual confirmation in WeChat DevTools because syntax checks cannot prove first-frame rendering behavior.

## Useful Search Terms
- Home entry buttons: `rankBtn`, `shareBtn`, `clubBtn`, `restoreHomeColorModeBtn`, `homeColorPure`, `homeColorMulti`.
- Gameplay color-mode button: `skinBtn`, `restoreGameColorModeBtn`, `restoreGameColorModeIcon`, `restoreGameColorModeHitProxy`.
- Game club / friend circle hiding: `installHideGameCirclePatch`, `suppressGameClubButton`, `hideGameClub`, `GameClubButton`.
- Puzzle / level board: `img_huakuang`, `puzzleFrame`, `applyPuzzleFrameReplacement`.
- Puzzle panel: `PuzzlePanel`, `puzzleBtn`, `mask`, `blockNum`.
- Illustrated animals: `IllustratedPanel`, `AnimalDecPanel`, `illustrated-replacement-data.js`.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| For first-frame flash bugs, synchronously hide old visuals in runtime patches. | Async replacement image loading can happen after one frame has already rendered. |
| For `skinBtn`, keep the parent node but clear its own sprite and old children. | The parent still provides position and touch area; old visuals must not render. |
| Use short requestAnimationFrame-style scrub windows in addition to 500ms intervals. | 500ms polling is too slow for first-frame UI issues. |
| Draw local `cc.Graphics` fallbacks before final replacement images load. | Prevents old art or empty holes during async loading. |
| Be cautious with prefab JSON edits. | Decompiled prefab JSON is compact and easy to break without fully understanding fields. |
| Keep planning files ASCII. | This PowerShell environment displayed UTF-8 Chinese markdown as mojibake. |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| System `python` command was unavailable, so `session-catchup.py` did not run. | Logged it. Future sessions can call `load_workspace_dependencies` to find bundled Python or configure PATH. |
| `git diff --stat` showed a dirty tree before memory creation. | Preserve existing changes and use targeted diffs. |
| Full `game.js` diff is large and mixed with previous work. | Prefer `rg` for specific functions and small context reads. |
| Chinese text in memory files displayed as mojibake in PowerShell. | Rewrote memory files as ASCII English. |
| Home lower-left pure/colorful mode entry disappeared after the first-frame game-club flash fix. | Cause/risk: game-club cleanup hid too much of the home button hierarchy or left `restoreHomeColorModeBtn` under an inactive parent. Fix implemented in `game.js`: `hideGameClubNodeOnly()` now hides named game-club nodes locally; `getHomeColorModeButtonParent()` chooses a visible parent; `ensureHomeColorModeButton()` reparents/re-enables the entry and preserves position with world/local coordinate conversion. See `docs/superpowers/plans/2026-06-17-home-color-mode-entry-regression.md`. |
| Reparent-only fix did not restore the lower-left pure/colorful mode entry in DevTools. | Stronger fix: `ensureHomeColorModeButton()` now preferentially takes over the original `clubBtn`, marks it with `_restoreHomeColorModeSource`, renames it to `restoreHomeColorModeBtn`, clears its old sprite, and uses it as the mode entry. `hideGameClubNodeOnly()` skips nodes marked this way, and first-frame scrub runs `installHomeButtonPatch()` before `installHideGameCirclePatch()`. |
| Home color-mode logs toggled `multi`/`pure` while the entry remained invisible. | This proves the touch node exists and works; the missing piece is visual rendering. Added `ensureHomeColorModeFallbackLayer()` to create an independent `restoreColorModeFallbackIcon` Graphics layer above the sprite layer, so the entry remains visible even if replacement sprite loading/clearing fails. |
| Yellow circular fallback covered the official pure/colorful entry UI. | The fallback layer was too high and always redrawn. Fix: lower fallback z-order below the sprite layer and add `setHomeColorModeFallbackVisible()` so the fallback hides when `restoreColorModeIcon` has a valid `spriteFrame`; it remains visible only if official image loading fails. |
| Setting prefab `clubBtn` active field to `false` caused `TypeError: Cannot read property '_contentSize' of undefined` in `game.bundle.js`. | Do not change the compact decompiled prefab active field from numeric `1` to boolean `false`; it can break the loader's expected tuple shape/type handling. Reverted the JSON change. Safer fix: keep prefab intact and install `cc.Director.EVENT_BEFORE_UPDATE`, `EVENT_BEFORE_DRAW`, and `EVENT_AFTER_SCENE_LAUNCH` hooks in `game.js` so `installHomeButtonPatch()` can claim/clear `clubBtn` before drawing without damaging prefab data. |
| Home rank entry showed old UI for one frame before changing to the new UI. | Cause: `applyHomeEntryButtonReplacement()` loaded replacement images asynchronously while the original `rankBtn` sprite was still visible. Fix: immediately call `hideNodeOwnSprite(button)`, keep the button node only as touch/position container, and render the replacement image on an independent child node named `restoreHomeEntryIcon_<key>`. Applies to rank and share entries. |
| Home rank/share entries became blank for a moment after old UI was hidden. | Cause: replacement images still load asynchronously after the old sprite is cleared. Fix: call `preloadHomeEntryReplacementFrames()` before first-frame home patching and on each first-frame scrub, and draw a non-old temporary `drawHomeEntryFallback()` on `restoreHomeEntryIcon_<key>` until the real spriteFrame arrives. |
| Preloading color-mode images caused `GET .../multi_mode_entry.png 404`, and rank/share entries disappeared. | Do not preload `homeColorPure` / `homeColorMulti`; color mode already has asset fallback paths. Limit `preloadHomeEntryReplacementFrames()` to `homeRankEntry` and `homeShareEntry`. Also avoid drawing Graphics on the same node that has the replacement Sprite; use independent `restoreHomeEntryFallback_<key>` layers beneath `restoreHomeEntryIcon_<key>`, and hide fallback when the spriteFrame exists. |
| Home rank/share entries showed the temporary fallback UI instead of the intended PNG replacement UI. | Cause: `getUiReplacementImagePath()` did not map `homeRankEntry` / `homeShareEntry`, and `applyHomeEntryButtonReplacement()` only created the fallback layer after a later edit. Fix: map the two keys to `home_rank_entry.png` / `home_share_entry.png`, create `restoreHomeEntryIcon_<key>` sprite nodes, load the formal frame, and hide the fallback once the frame is available. |
| DevTools reported `GET /ui_replacement_runtime/home_share_entry.png 404` after path mapping was restored. | Cause: runtime PNGs are loaded by package path, but `project.config.json` did not explicitly include the untracked `ui_replacement_runtime` folder for DevTools packaging/serving. Fix: add `ui_replacement_runtime` to `packOptions.include`; reload/recompile DevTools after this config change. |
| DevTools still reported `GET /ui_replacement_runtime/home_share_entry.png 404` after `packOptions.include`. | `packOptions.include` did not make the root `ui_replacement_runtime` folder available in the current DevTools local game server. More robust fix: copy the runtime UI PNGs into the declared `subpackages/resources/` package and change `getUiReplacementImagePath()` to return `subpackages/resources/ui_replacement_runtime/<file>`. If DevTools still logs the old root URL, it is running cached old `game.js`. |
| DevTools still reported the old root `home_share_entry.png` URL even after clean-cache compile. | Full-text search showed current source code no longer generates the old root URL except in docs, so avoid the local file server entirely for home rank/share entry art. Fix: generate `ui-replacement-data.js` with data URLs for `homeRankEntry` and `homeShareEntry`, load those data URLs first in `loadUiReplacementFrame()`, and prevent those two keys from falling back to any local PNG path when data is unavailable. |

## Resources
- Planning skill file: `C:\Users\admin\.codex\skills\planning-with-files\SKILL.md`
- Planning templates: `C:\Users\admin\.codex\skills\planning-with-files\templates\`
- Main runtime patch file: `C:\Users\admin\Desktop\KillWxapkgGame\game.js`
- Original bundle: `C:\Users\admin\Desktop\KillWxapkgGame\game.bundle.js`
- Decompiled game logic reference: `C:\Users\admin\Desktop\KillWxapkgGame\subpackages\game\game.js`
- Prefab JSON with `skinBtn`: `C:\Users\admin\Desktop\KillWxapkgGame\subpackages\game\import\08\08325fccf.b5514.json`
- Main panel prefab JSON with `clubBtn`: `C:\Users\admin\Desktop\KillWxapkgGame\subpackages\game\import\05\05748e7e8.5da70.json`

## Visual/Browser Findings
- WeChat DevTools first-frame visual behavior cannot be fully verified with `node --check`.
- Old-UI first-frame flash usually means the runtime patch or async replacement image arrives after original prefab rendering.
- For similar bugs, identify the original node and its own sprite first; hiding only children or later overlays may not be enough.

---
Update this file after every two or more view/search/browser exploration actions during future complex optimization work.
