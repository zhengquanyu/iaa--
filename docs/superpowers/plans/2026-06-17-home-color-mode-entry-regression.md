# Home Color Mode Entry Regression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the home page lower-left pure-color / colorful-mode entry button while keeping the previous first-frame game-club / friend-circle button flash fix.

**Architecture:** Keep the fix localized to `game.js`. Narrow the game-club hiding logic so it hides only the original game-club node's visual/touch surface, not shared home-button parents. Add a home color-mode safety pass that reparents/re-enables `restoreHomeColorModeBtn` when its current parent was hidden by old cleanup logic.

**Tech Stack:** WeChat mini-game runtime patching, Cocos Creator `cc.Node` / `cc.Sprite` APIs, PowerShell, `node --check`.

---

## File Structure

- Modify: `C:\Users\admin\Desktop\KillWxapkgGame\game.js`
  - Responsibility: Runtime UI patch layer. This plan changes only home game-club hiding and home color-mode entry placement/recovery.
- Modify: `C:\Users\admin\Desktop\KillWxapkgGame\findings.md`
  - Responsibility: Persistent project discoveries. Add the regression cause and chosen fix.
- Modify: `C:\Users\admin\Desktop\KillWxapkgGame\progress.md`
  - Responsibility: Session log. Record implementation and verification results.
- No changes planned: `game.bundle.js`, `subpackages/**/*.json`, image assets, generated data.

## Current Diagnosis

Relevant code:

```js
function hideNodeAndParents(node) {
  if (!node || !node.isValid) return;
  var target = node;
  for (var i = 0; i < 3 && target.parent && target.parent.isValid; i++) {
    if ((target.width || 0) > 80 || (target.height || 0) > 80 || target.name.indexOf("Btn") >= 0 || target.name.indexOf("btn") >= 0) break;
    target = target.parent;
  }
  target.active = false;
}

function installHideGameCirclePatch() {
  // ...
  var names = [
    "gameCircle", "gameCircleBtn", "gameClub", "gameClubBtn", "gameClubButton",
    "clubBtn", "circleBtn", "gameQuan", "gameq", "gameQun", "gameClubNode"
  ];
  for (var i = 0; i < names.length; i++) {
    var nodes = findNodes(scene, names[i]);
    for (var j = 0; j < nodes.length; j++) {
      hideNodeOwnSprite(nodes[j]);
      hideNodeAndParents(nodes[j]);
    }
  }
}
```

Risk:
- `clubBtn` is near the same lower-left home area where `restoreHomeColorModeBtn` is created.
- `ensureHomeColorModeButton()` currently parents the color button to `rankBtn.parent || scene`.
- If a shared parent or an old hidden parent remains inactive, the new button may be active locally but invisible in hierarchy.

Expected implementation direction:
- Replace broad parent hiding for game-club nodes with node-local hiding for known button nodes.
- Add a safe parent selection function for home color-mode button.
- Add a recovery step that reparents existing `restoreHomeColorModeBtn` to a visible home root if its current parent is inactive or invalid.

---

### Task 1: Add Safe Hiding Helper For Game-Club Buttons

**Files:**
- Modify: `C:\Users\admin\Desktop\KillWxapkgGame\game.js` near `hideNodeAndParents()`

- [ ] **Step 1: Add helper below `hideNodeAndParents()`**

Insert this function immediately after `hideNodeAndParents(node)`:

```js
  function hideGameClubNodeOnly(node) {
    if (!node || !node.isValid) return;
    hideNodeOwnSprite(node);
    node.active = false;
    node.opacity = 0;
    if (node.pauseSystemEvents) node.pauseSystemEvents(true);
  }
```

- [ ] **Step 2: Use the new helper for named game-club nodes**

In `installHideGameCirclePatch()`, replace this block:

```js
      for (var j = 0; j < nodes.length; j++) {
        hideNodeOwnSprite(nodes[j]);
        hideNodeAndParents(nodes[j]);
      }
```

with:

```js
      for (var j = 0; j < nodes.length; j++) {
        hideGameClubNodeOnly(nodes[j]);
      }
```

This keeps first-frame old button suppression but stops hiding nearby/shared parent containers.

- [ ] **Step 3: Keep label-based hiding unchanged**

Do not change this code in the same function:

```js
    hideLabelsWithText(scene, "\u6e38\u620f\u5708");
    hideLabelsWithText(scene, "\u670b\u53cb\u5708");
```

Reason: text-label wrappers may still need parent hiding because the label itself can be nested inside a tiny child node.

---

### Task 2: Add Safe Parent Selection For The Home Color-Mode Entry

**Files:**
- Modify: `C:\Users\admin\Desktop\KillWxapkgGame\game.js` near `fitHomeColorModeButtonToReference()` / `ensureHomeColorModeButton()`

- [ ] **Step 1: Add safe parent helper before `ensureHomeColorModeButton()`**

Insert this function immediately before `function ensureHomeColorModeButton(scene, rankBtn, shareBtn) {`:

```js
  function getHomeColorModeButtonParent(scene, rankBtn, shareBtn) {
    var parent = rankBtn && rankBtn.isValid && rankBtn.parent && rankBtn.parent.isValid ? rankBtn.parent : null;
    if (!parent && shareBtn && shareBtn.isValid && shareBtn.parent && shareBtn.parent.isValid) parent = shareBtn.parent;
    if (parent && parent.activeInHierarchy) return parent;
    var canvasNode = cc.Canvas && cc.Canvas.instance && cc.Canvas.instance.node;
    if (canvasNode && canvasNode.isValid && canvasNode.activeInHierarchy) return canvasNode;
    return scene;
  }
```

- [ ] **Step 2: Use the helper when creating the button**

In `ensureHomeColorModeButton()`, replace:

```js
      button.parent = rankBtn.parent || scene;
```

with:

```js
      button.parent = getHomeColorModeButtonParent(scene, rankBtn, shareBtn);
```

- [ ] **Step 3: Reparent existing button when parent is hidden or invalid**

Still inside `ensureHomeColorModeButton()`, after the creation block and before:

```js
    button.active = true;
```

insert:

```js
    var safeParent = getHomeColorModeButtonParent(scene, rankBtn, shareBtn);
    if (safeParent && safeParent.isValid && (!button.parent || !button.parent.isValid || !button.parent.activeInHierarchy)) {
      button.parent = safeParent;
    }
```

This recovers buttons previously parented under an inactive container.

---

### Task 3: Force Home Color-Mode Entry Visibility After Game-Club Cleanup

**Files:**
- Modify: `C:\Users\admin\Desktop\KillWxapkgGame\game.js`

- [ ] **Step 1: Add explicit local visibility after reparenting**

In `ensureHomeColorModeButton()`, keep this existing code:

```js
    button.active = true;
    button.opacity = 255;
```

Immediately after it, add:

```js
    if (button.resumeSystemEvents) button.resumeSystemEvents(true);
    button.setLocalZOrder && button.setLocalZOrder(1000);
```

- [ ] **Step 2: Ensure the icon is also visible**

Immediately before `drawModeFallbackIcon(findChild(button, "restoreColorModeIcon"), getHomeColorMode());`, add:

```js
    var colorIcon = findChild(button, "restoreColorModeIcon");
    if (colorIcon && colorIcon.isValid) {
      colorIcon.active = true;
      colorIcon.opacity = 255;
      colorIcon.setLocalZOrder && colorIcon.setLocalZOrder(1000);
    }
```

Then change:

```js
    drawModeFallbackIcon(findChild(button, "restoreColorModeIcon"), getHomeColorMode());
```

to:

```js
    drawModeFallbackIcon(colorIcon, getHomeColorMode());
```

---

### Task 4: Run Static Verification

**Files:**
- Verify: `C:\Users\admin\Desktop\KillWxapkgGame\game.js`

- [ ] **Step 1: Check JavaScript syntax**

Run:

```powershell
node --check game.js
```

Expected:

```text
```

No output and exit code `0`.

- [ ] **Step 2: Confirm key symbols exist once or in expected places**

Run:

```powershell
rg -n "hideGameClubNodeOnly|getHomeColorModeButtonParent|ensureHomeColorModeButton|installHideGameCirclePatch" game.js
```

Expected:
- `hideGameClubNodeOnly` appears at its definition and call site.
- `getHomeColorModeButtonParent` appears at its definition and use sites.
- `ensureHomeColorModeButton` remains callable from `installHomeButtonPatch()`.
- `installHideGameCirclePatch()` still exists and still suppresses platform game club buttons.

- [ ] **Step 3: Inspect targeted diff only**

Run:

```powershell
git diff -- game.js | Select-String -Pattern "hideGameClubNodeOnly|getHomeColorModeButtonParent|restoreHomeColorModeBtn|hideNodeAndParents|installHideGameCirclePatch" -Context 4,8
```

Expected:
- Diff shows only targeted runtime patch changes.
- No accidental edits to animal/puzzle/rank unrelated logic.

---

### Task 5: Manual WeChat DevTools Verification

**Files:**
- Manual verification only.

- [ ] **Step 1: Open/reload the game in WeChat DevTools**

Expected:
- The old friend-circle / game-club button does not flash on the first frame.
- The lower-left pure-color / colorful-mode entry is visible on the home page.

- [ ] **Step 2: Toggle the home color-mode entry**

Expected:
- The button toggles between pure-color and colorful modes.
- The icon updates.
- No old game-club/friend-circle button appears.

- [ ] **Step 3: Enter level gameplay**

Expected:
- The gameplay `skinBtn` old visual does not flash on the first frame.
- The new color-mode UI remains visible and clickable.

---

### Task 6: Update Project Memory

**Files:**
- Modify: `C:\Users\admin\Desktop\KillWxapkgGame\findings.md`
- Modify: `C:\Users\admin\Desktop\KillWxapkgGame\progress.md`

- [ ] **Step 1: Append finding to `findings.md`**

Add under `## Issues Encountered` or near the first-frame section:

```markdown
| Home color-mode entry disappeared after first-frame game-club flash fix. | Cause: game-club cleanup hid too much of the home button hierarchy or left `restoreHomeColorModeBtn` under an inactive parent. Fix: hide game-club nodes locally and reparent/re-enable home color-mode button under a visible parent. |
```

- [ ] **Step 2: Append progress to `progress.md`**

Add a new session subsection:

```markdown
### Phase 5: Home Color Mode Entry Regression Plan/Implementation
- **Status:** complete
- Actions taken:
  - Diagnosed regression where lower-left home pure/colorful mode entry disappeared after first-frame game-club flash fix.
  - Narrowed game-club hiding to avoid hiding shared parent containers.
  - Added safe parent recovery for `restoreHomeColorModeBtn`.
  - Ran `node --check game.js`.
- Files created/modified:
  - `game.js`
  - `findings.md`
  - `progress.md`
```

If implementation has not been executed yet, set status to `planned` instead of `complete`.

---

## Self-Review

- Spec coverage: The plan addresses the visible regression while preserving the previous first-frame suppression goal.
- Placeholder scan: No `TBD`, `TODO`, or undefined placeholder steps are used.
- Type consistency: Helper names are consistent: `hideGameClubNodeOnly`, `getHomeColorModeButtonParent`, `restoreHomeColorModeBtn`.
- Verification: Static syntax check plus targeted grep/diff are included; WeChat DevTools visual verification is explicitly required because this is a first-frame rendering issue.
