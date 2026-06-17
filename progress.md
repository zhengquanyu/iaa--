# KillWxapkgGame Progress Log

## Session: 2026-06-17

### Phase 1: Memory Library Bootstrap
- **Status:** complete
- **Started:** 2026-06-17 11:42:28 +08:00
- Actions taken:
  - Read `C:\Users\admin\.codex\skills\planning-with-files\SKILL.md` completely.
  - Attempted to run `session-catchup.py` using system `python`.
  - Checked project root for existing `task_plan.md`, `findings.md`, `progress.md`, and `.planning`; none were present.
  - Read planning templates from `C:\Users\admin\.codex\skills\planning-with-files\templates\`.
  - Reviewed `git diff --stat` to understand existing dirty worktree scope.
  - Created project-root memory files.
- Files created/modified:
  - `task_plan.md` created.
  - `findings.md` created.
  - `progress.md` created.

### Phase 2: Project Context Captured
- **Status:** complete
- Actions taken:
  - Recorded that this is a WeChat mini-game decompile / runtime patch project.
  - Recorded major files and folders: `game.js`, `game.bundle.js`, `subpackages/`, `ui_replacement_images/`, `ui_replacement_runtime/`, generated replacement data files.
  - Recorded current dirty worktree risk: existing code, generated data, config, and image changes must not be reverted casually.
  - Recorded recent first-frame old UI flash optimization strategy.
- Files created/modified:
  - `task_plan.md` updated with phases, decisions, and errors.
  - `findings.md` updated with project map and recent optimization notes.
  - `progress.md` updated with this session log.

### Phase 3: Encoding Stabilization
- **Status:** complete
- Actions taken:
  - Read the created memory files with PowerShell `Get-Content`.
  - Found that Chinese UTF-8 content displayed as mojibake in this environment.
  - Rewrote all three memory files as ASCII English to make future `Get-Content` reads reliable.
- Files created/modified:
  - `task_plan.md` rewritten as ASCII.
  - `findings.md` rewritten as ASCII.
  - `progress.md` rewritten as ASCII.

### Phase 4: Ongoing Optimization Memory
- **Status:** in_progress
- Actions taken:
  - Established the future-session rule: read `task_plan.md`, `findings.md`, and `progress.md` before complex work.
  - Established the update rule: save findings after repeated exploration, and save progress after each optimization phase.
- Files created/modified:
  - Planning memory files in the project root.

### Phase 5: Home Color Mode Entry Regression Plan
- **Status:** complete
- Actions taken:
  - Read project memory files before analysis.
  - Investigated the regression where the home lower-left pure/colorful mode entry disappeared after the game-club first-frame flash fix.
  - Identified likely risk area in `installHideGameCirclePatch()`, `hideNodeAndParents()`, and `ensureHomeColorModeButton()`.
  - Created an implementation plan to narrow game-club hiding and recover/reparent `restoreHomeColorModeBtn` under a visible parent.
  - Implemented `hideGameClubNodeOnly()` in `game.js` so named game-club nodes are hidden locally instead of hiding parent containers.
  - Implemented `getHomeColorModeButtonParent()` and safe reparent/re-enable logic for `restoreHomeColorModeBtn`.
  - Added world/local coordinate fallback when the color-mode button is reparented to a different visible parent.
  - Ran `node --check game.js`; syntax passed.
  - User reported the lower-left entry was still missing in DevTools.
  - Applied a stronger fix: reuse the original `clubBtn` as `restoreHomeColorModeBtn`, mark it with `_restoreHomeColorModeSource`, and make game-club hiding skip the claimed node.
  - Reordered first-frame scrub so `installHomeButtonPatch()` claims the home entry before `installHideGameCirclePatch()` hides game-club nodes.
  - Ran `node --check game.js` again; syntax passed.
  - User reported console logs toggling `restore home color mode multi/pure` while the visual entry still did not appear, proving touch routing worked but rendering did not.
  - Added `ensureHomeColorModeFallbackLayer()` and `restoreColorModeFallbackIcon`, an independent Graphics layer drawn above the sprite layer to force visible pure/colorful feedback.
  - Ran `node --check game.js` after the visual-layer fix; syntax passed.
  - User reported the fallback appeared as a yellow circle covering the official pure/colorful entry UI.
  - Lowered fallback z-order below the official sprite layer and added `setHomeColorModeFallbackVisible()` so fallback hides once `restoreColorModeIcon.spriteFrame` exists.
  - Ran `node --check game.js` after fallback visibility adjustment; syntax passed.
  - User reported the game-club UI still appeared on the first home frame and asked to fully disable the feature/UI without hurting the pure/colorful entry.
  - Tried setting the original home prefab `clubBtn` inactive in `subpackages/game/import/05/05748e7e8.5da70.json` so it could not render on the first frame.
  - User reported `TypeError: Cannot read property '_contentSize' of undefined` from `game.bundle.js`, indicating the compact prefab tuple should not be changed from numeric `1` to boolean `false`.
  - Reverted the prefab JSON active-field change back to `1`.
  - Added `installFirstFrameButtonScrubHooks()` in `game.js`, registering `EVENT_BEFORE_UPDATE`, `EVENT_BEFORE_DRAW`, and `EVENT_AFTER_SCENE_LAUNCH` hooks to run `scrubFirstFrameButtons()` before rendering without modifying prefab structure.
  - Ran `node --check game.js`; syntax passed.
  - Parsed `subpackages/game/import/05/05748e7e8.5da70.json` with Node `JSON.parse`; JSON valid.
  - User confirmed game-club no longer appears on the first home frame, then reported the rank entry still showed its old UI for one frame before switching to the new UI.
  - Updated `applyHomeEntryButtonReplacement()` so rank/share buttons immediately clear their own old sprite via `hideNodeOwnSprite(button)` and render replacement art through independent child nodes named `restoreHomeEntryIcon_homeRankEntry` / `restoreHomeEntryIcon_homeShareEntry`.
  - Ran `node --check game.js`; syntax passed.
  - User reported the old UI no longer appears, but rank/share entries are blank briefly while replacement images load.
  - Added `preloadHomeEntryReplacementFrames()` to start loading rank/share/color entry images before first-frame home patching.
  - Wired preload into `scrubFirstFrameButtons()` and immediately after installing first-frame scrub hooks.
  - Added `drawHomeEntryFallback()` so rank/share entries show a non-old temporary icon until the real `spriteFrame` arrives.
  - Ran `node --check game.js`; syntax passed.
  - User reported `GET .../ui_replacement_runtime/multi_mode_entry.png 404` and rank/share entries disappeared.
  - Removed `homeColorPure` and `homeColorMulti` from `preloadHomeEntryReplacementFrames()` to avoid noisy color-mode runtime image requests.
  - Split rank/share fallback into independent `restoreHomeEntryFallback_<key>` layers below `restoreHomeEntryIcon_<key>` instead of drawing Graphics on the Sprite node.
  - Added `setHomeEntryFallbackVisible()` so fallback hides when the official spriteFrame exists.
  - Ran `node --check game.js`; syntax passed.
  - User reported the home rank/share UI had been changed.
  - Reproduced the static regression: `homeRankEntry` / `homeShareEntry` were not mapped in `getUiReplacementImagePath()`, and `applyHomeEntryButtonReplacement()` no longer created a formal replacement sprite node.
  - Restored `restoreHomeEntryIcon_<key>` sprite nodes for rank/share entries, mapped the two keys to `home_rank_entry.png` / `home_share_entry.png`, and kept the fallback visible only until the formal PNG frame loads.
  - Ran `node --check game.js`; syntax passed.
  - Ran a Node static regression check for key mappings, formal sprite node creation, replacement frame loading, and non-empty runtime PNG files; check passed.
  - User reported DevTools error `GET /ui_replacement_runtime/home_share_entry.png 404`.
  - Added a failing static check proving `project.config.json` did not include `ui_replacement_runtime` even though `game.js` loads PNGs from that package path.
  - Added `ui_replacement_runtime` to `packOptions.include` in `project.config.json`.
  - Re-ran the config include check, `JSON.parse(project.config.json)`, `node --check game.js`, and listed runtime PNG files; all checks passed.
  - User reported DevTools still requested `/ui_replacement_runtime/home_share_entry.png` and got 404.
  - Added a failing static check requiring UI replacement paths to use the declared `subpackages/resources` subpackage and requiring all five runtime PNGs to exist there.
  - Copied runtime UI PNGs into `subpackages/resources/ui_replacement_runtime/`.
  - Changed `getUiReplacementImagePath()` to return `subpackages/resources/ui_replacement_runtime/<file>`.
  - Re-ran the subpackage path/resource check and `node --check game.js`; both passed.
  - User reported that clean-cache compile still showed the old root `/ui_replacement_runtime/home_share_entry.png` 404.
  - Searched the workspace for old URL/path generation; current source only generated subpackage paths, with old root URL remaining only in notes.
  - Generated `ui-replacement-data.js` containing data URLs for `homeRankEntry` and `homeShareEntry`.
  - Added `getUiReplacementDataUrl()` and made `loadUiReplacementFrame()` prefer data URLs before local paths.
  - Added a no-local-fallback guard so `homeRankEntry` / `homeShareEntry` do not request any local PNG path if data URLs are unavailable; they fall back to the existing graphics layer instead.
  - Ran data-url/no-local-fallback static checks and `node --check game.js; node --check ui-replacement-data.js`; all passed.
- Files created/modified:
  - `docs/superpowers/plans/2026-06-17-home-color-mode-entry-regression.md` created.
  - `game.js` modified.
  - `findings.md` updated.
  - `progress.md` updated.

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Check memory files absent before creation | `Get-ChildItem -Force -Name task_plan.md,findings.md,progress.md,.planning 2>$null` | No existing memory files, to avoid overwrite | No files returned | Pass |
| Read planning templates | `Get-Content` on three template files | Template content available | Templates read successfully | Pass |
| Check current diff summary | `git diff --stat` | Understand dirty tree | Existing code/resource changes detected | Pass |
| Verify memory files exist | `Get-ChildItem -Force task_plan.md,findings.md,progress.md` | Three project-root memory files | Three files present | Pass |
| Encoding sanity check | `Get-Content -TotalCount` on memory files | Readable ASCII text | Initial Chinese version showed mojibake; ASCII rewrite performed | Fixed |
| Home color-mode entry regression syntax check | `node --check game.js` | No syntax errors | Exit code 0, no output | Pass |
| Home color-mode entry second fix syntax check | `node --check game.js` after reusing `clubBtn` | No syntax errors | Exit code 0, no output | Pass |
| Home color-mode visual-layer fix syntax check | `node --check game.js` after adding `restoreColorModeFallbackIcon` | No syntax errors | Exit code 0, no output | Pass |
| Home color-mode fallback layering syntax check | `node --check game.js` after adding `setHomeColorModeFallbackVisible()` | No syntax errors | Exit code 0, no output | Pass |
| Unsafe prefab active-field rollback syntax check | `node --check game.js` | No syntax errors | Exit code 0, no output | Pass |
| Unsafe prefab active-field rollback JSON check | `JSON.parse(fs.readFileSync('subpackages/game/import/05/05748e7e8.5da70.json','utf8'))` | JSON parses | `json ok` | Pass |
| Home rank/share entry first-frame clearing syntax check | `node --check game.js` after child-icon replacement patch | No syntax errors | Exit code 0, no output | Pass |
| Home rank/share entry preload/fallback syntax check | `node --check game.js` after adding `preloadHomeEntryReplacementFrames()` and `drawHomeEntryFallback()` | No syntax errors | Exit code 0, no output | Pass |
| Home rank/share independent fallback syntax check | `node --check game.js` after removing color-mode preload and adding `restoreHomeEntryFallback_<key>` | No syntax errors | Exit code 0, no output | Pass |
| Home rank/share replacement regression check | Node static check for `homeRankEntry` / `homeShareEntry` image mappings, `restoreHomeEntryIcon_` node creation, formal frame loading, and non-empty runtime PNGs | Static invariants pass | `home entry replacement checks passed` | Pass |
| UI runtime folder packaging check | Node static check for `packOptions.include` containing folder `ui_replacement_runtime` | Runtime folder explicitly included | `ui runtime include check passed` | Pass |
| Project config parse after runtime include | `JSON.parse(fs.readFileSync('project.config.json','utf8'))` | JSON parses | `project config json ok` | Pass |
| UI runtime subpackage path check | Node static check that `game.js` uses `subpackages/resources/ui_replacement_runtime/` and all five PNGs exist in that folder | Paths use declared subpackage and files exist | `subpackage UI runtime path check passed` | Pass |
| Home rank/share data-url no-local-fallback check | Node static check for `getUiReplacementDataUrl()`, data URL priority, no local fallback for home rank/share, and generated inline data | Home rank/share bypass local PNG HTTP requests | `home entry data-url/no-local-fallback checks passed` | Pass |
| UI replacement data syntax check | `node --check ui-replacement-data.js` | No syntax errors | Exit code 0, no output | Pass |

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| 2026-06-17 11:42 +08:00 | `Python was not found` when running `session-catchup.py`. | 1 | Logged the failure. Future sessions can use bundled Python via workspace dependencies or configure Python PATH. |
| 2026-06-17 11:45 +08:00 | Chinese UTF-8 memory files displayed as mojibake through PowerShell `Get-Content`. | 1 | Rewrote memory files as ASCII English. |

## Current Known Project State
- `game.js` has substantial modifications, including recent first-frame scrub/hide changes.
- `gen_replace.js`, `illustrated-replacement-data.js`, image assets, and `project.config.json` have existing changes.
- `ui_replacement_runtime/` is currently untracked.
- `node --check game.js` passed after the recent first-frame flash optimization, but WeChat DevTools visual verification is still needed for that UI issue.

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | Phase 4: Ongoing Optimization Memory |
| Where am I going? | Continue optimizing the WeChat mini-game while persisting discoveries and progress to files. |
| What's the goal? | Maintain a project memory library so Codex can resume work coherently across sessions. |
| What have I learned? | See `findings.md` for project structure, recent first-frame UI fix, and risk notes. |
| What have I done? | Created and stabilized `task_plan.md`, `findings.md`, and `progress.md` in the project root. |

---
Update this file after each future optimization phase, test run, or error.
