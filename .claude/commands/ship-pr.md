---
description: Pre-PR review — enforce lean, performant code before shipping
allowed-tools: Bash(git *), Bash(npm *), Bash(yarn *), Bash(pnpm *), Bash(node *), Bash(python *), Bash(rg:*), Read, Grep, Glob, Edit
---

# Ship-PR: Lean & Performance Review

You are reviewing the changes on this branch before a pull request is opened. Your job is to ensure the diff is **lean, fast, and free of avoidable overhead**. Be strict. Apply fixes in-place where they are safe and obvious; flag the rest in the final report.

## Context (gather first)

- Branch: !`git branch --show-current`
- Base diff: !`git diff --stat $(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)..HEAD`
- Full patch: !`git diff $(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)..HEAD`
- Changed files only: !`git diff --name-only $(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main)..HEAD`

## Review pass — go through every changed file

### 1. Leanness
Flag and remove:
- Dead code, unreachable branches, commented-out blocks, and unused imports/exports/variables.
- Duplicated logic across files — extract or delete.
- Over-engineered abstractions (premature interfaces, single-use wrappers, factories with one implementation).
- Verbose patterns where a one-liner is equally clear (e.g. manual loops that could be `map`/`filter`/`reduce`, redundant intermediate variables).
- `console.log`, debug prints, `TODO`/`FIXME` introduced in this diff, and any leftover scaffolding.
- Dependencies added but barely used — prefer the standard library.

### 2. Performance — runtime
Hunt for and fix:
- **N+1 queries** and loops that hit a DB / API per iteration — batch them.
- **Sync work in hot paths** that should be async, parallel (`Promise.all`, `asyncio.gather`), or streamed.
- **Quadratic loops** over arrays where a `Set`/`Map` lookup is O(1).
- **Re-computation inside loops** — hoist invariants out.
- **Missing memoization** for pure expensive functions called repeatedly with the same inputs.
- **Unbounded data structures** — paginate, stream, or cap.
- **Blocking I/O on the main thread** (UI freezes, event-loop stalls).

### 3. Performance — frontend (if applicable)
- Re-renders: missing `useMemo`/`useCallback` or unstable props passed to memoized children. Don't add them prophylactically — only where a profiler would flag the component.
- Bundle weight: any newly imported heavy library? Suggest a lighter alternative or a dynamic `import()`.
- Images/assets: unoptimized formats, missing `loading="lazy"`, no width/height.
- Layout thrash: reads-after-writes on the DOM inside loops.

### 4. Performance — backend (if applicable)
- Indexes on new query columns.
- `SELECT *` where specific columns suffice.
- Missing connection pooling / cache layer for hot reads.
- Large JSON payloads that should be paginated or compressed.

### 5. Correctness adjacent to performance
- New error paths that swallow exceptions silently.
- Resources not closed (`finally`, context managers, `using`).
- Race conditions from shared mutable state.

## Apply fixes
For each issue:
1. If the fix is **mechanical and low-risk** (dead code, imports, obvious algorithm swap, missing `await`), apply it directly with `Edit`.
2. If the fix needs **judgement or a behavior change**, leave the code, add it to the report below.

After edits, run whatever the project uses:
- `npm test` / `pnpm test` / `yarn test` / `pytest` / `cargo test` — whichever is configured.
- The linter/formatter if present (`eslint`, `ruff`, `prettier`, etc.).

## Final report

Print a concise summary in this exact shape, then stop:

**Fixes applied** — bullet list, file:line, one sentence each.
**Needs human decision** — bullet list, file:line, the issue, and the suggested fix.
**Benchmarks/measurements** — only include if you actually ran something; never fabricate numbers.
**Ship verdict** — one of: `READY`, `READY WITH NOTES`, `DO NOT SHIP`. Justify in one sentence.

Do not pad the report. No prose preamble, no "great work" — just the four sections.
