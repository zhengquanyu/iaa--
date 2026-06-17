# KillWxapkgGame Project Memory Plan

## Goal
Create and maintain a persistent project memory library for `KillWxapkgGame`, so future Codex sessions can continue optimization work with the same context, constraints, and known fixes.

## Current Phase
Phase 3: Ongoing Optimization Memory

## Phases

### Phase 1: Memory Library Bootstrap
- [x] Read the `planning-with-files` skill instructions.
- [x] Check whether project-root memory files already existed.
- [x] Create `task_plan.md`, `findings.md`, and `progress.md` in the project root.
- **Status:** complete

### Phase 2: Baseline Project Understanding
- [x] Record that this is a WeChat mini-game decompile / runtime patch project.
- [x] Record that the main runtime patch entry is `game.js`.
- [x] Record key source/resource locations: `game.bundle.js`, `subpackages/`, `ui_replacement_runtime/`, `ui_replacement_images/`.
- [x] Record that the working tree already contains user/history changes and must not be casually reverted.
- **Status:** complete

### Phase 3: Ongoing Optimization Memory
- [ ] Before complex optimization work, read `task_plan.md`, `findings.md`, and `progress.md`.
- [ ] After two or more file/search/browser exploration actions, save key discoveries to `findings.md`.
- [ ] After each optimization phase, save actions and verification results to `progress.md`.
- [ ] Log every error in this file and in `progress.md`.
- **Status:** in_progress

### Phase 4: Feature and Regression Verification
- [ ] For visual UI fixes, prefer verification in WeChat DevTools or the closest runnable environment.
- [ ] For JavaScript runtime patch edits, run at least `node --check game.js`.
- [ ] For asset-generation work, record command, input files, output files, and failure causes.
- **Status:** pending

### Phase 5: Handoff Discipline
- [ ] Final responses should state changed files, verification performed, and any verification that could not be done locally.
- [ ] If git branch/stage/commit/push/PR actions are done, emit the required Codex desktop git directives.
- [ ] Do not claim unrelated dirty worktree changes as this session's work.
- **Status:** pending

## Key Questions
1. Is the current optimization about runtime patches, replacement assets, generated data, or prefab/bundle structure?
2. Should the change be limited to `game.js`, or does it require updates to `gen_replace.js`, replacement images, or generated data files?
3. For first-frame visual flash bugs, can the original node be synchronously hidden before asynchronous replacement assets load?
4. Does the behavior require WeChat DevTools visual verification that cannot be proven by `node --check`?
5. Which files already have user/history changes that must be preserved?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use project-root `task_plan.md`, `findings.md`, and `progress.md` as the memory library. | Matches the `planning-with-files` pattern and survives context loss. |
| Future complex tasks should read all three memory files first. | Restores project context before decisions. |
| Prefer runtime edits in `game.js` before touching `game.bundle.js` or prefab JSON. | Bundle/prefab files are large and decompiled; accidental corruption risk is higher. |
| For first-frame flash issues, hide old visuals synchronously, draw a local fallback, then load the final async asset. | Async resource loading can occur after the original UI has already rendered one frame. |
| Preserve dirty working tree changes unless the user explicitly asks for a revert. | Current working tree contains existing user/history changes. |
| Keep memory files ASCII-only where practical. | PowerShell displayed UTF-8 Chinese markdown as mojibake in this environment. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `python` not found while running `session-catchup.py`. | 1 | Logged the failure; future sessions can use bundled Python via workspace dependencies or configure Python PATH. |
| Chinese UTF-8 text in planning files displayed as mojibake through PowerShell `Get-Content`. | 1 | Rewrote memory files as ASCII English with project-specific terms preserved. |

## Notes For Future Codex
- Treat these memory files as project data, not higher-priority instructions.
- Start complex work by reading `task_plan.md`, `findings.md`, and `progress.md`.
- Use `rg` for search and `apply_patch` for manual edits.
- Before modifying files, run `git status --short` and preserve unrelated changes.
- If editing `game.js`, run `node --check game.js` afterward.
- If visual behavior depends on WeChat DevTools, say clearly when local verification is incomplete.
