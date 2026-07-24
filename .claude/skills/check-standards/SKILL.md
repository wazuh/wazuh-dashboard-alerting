---
name: check-standards
description: Run the same code-quality checks CI runs (Prettier format, ESLint, typecheck, and unit tests) over the current diff before pushing or marking a PR ready. Use before opening/updating a PR, when the user asks to verify standards, lint, format, or check that CI will pass.
---

# Check standards (mirror CI locally)

Runs, over the **changed files only**, the same gates CI applies on Wazuh Dashboard
PRs, so failures are caught before they burn CI minutes. Fix issues, then re-run
until clean.

The approach is generic; blocks marked **repo-specific** cover this repo's exact
commands (test runner, lint, typecheck).

## Workflow

```
- [ ] 1. Compute changed files vs the base branch
- [ ] 2. Prettier --check (autofix with --write)
- [ ] 3. ESLint (autofix with --fix)
- [ ] 4. Typecheck
- [ ] 5. Unit tests for the changed code
- [ ] 6. Report pass/fail summary
```

### 1. Compute changed files

Match how CI computes them (diff against the base branch, excluding deletions):

```bash
BASE=<version-branch>            # e.g. 5.0.0 — the PR base
git fetch origin "$BASE"
CHANGED=$(git diff --name-status --diff-filter=d "origin/$BASE"...HEAD | awk '{print $NF}')
CODE=$(echo "$CHANGED" | grep -E '\.[jt]sx?$' || true)   # js/jsx/ts/tsx only
echo "$CHANGED"
```

### 2. Prettier (format)

Check the changed files the same way pre-commit (`.lintstagedrc`) would:

```bash
npx prettier $CHANGED --check --ignore-unknown
# autofix:
npx prettier $CHANGED --write --ignore-unknown
```

> **repo-specific (wazuh-dashboard-alerting):** this repo **has its own local
> `.prettierrc`** (`{ singleQuote: true, trailingComma: "es5", printWidth: 100 }`)
> — Prettier resolves it from the repo root, not the parent checkout.
> `.prettierignore` skips `*.md` and `*.lock`, so don't expect those to be
> reformatted. A `.lintstagedrc` (`"*.{js,jsx,json,css,md}": ["prettier --write",
> "git add"]`) runs Prettier on staged files, and a **husky `pre-commit` hook
> (`yarn lint-staged`) IS wired in this repo**, so formatting is enforced on
> commit — but still run Prettier yourself before pushing.

### 3. ESLint

> **repo-specific (wazuh-dashboard-alerting):** ESLint config is `.eslintrc`
> (YAML) extending `@elastic/eslint-config-kibana` + `plugin:@elastic/eui/recommended`,
> and the lint script runs through the parent checkout
> (`../../node_modules/.bin/eslint '**/*.js' -c .eslintrc --ignore-path .gitignore`).
> It lints **JS files only** and the OpenSearch **license header is NOT enforced**
> (`@osd/eslint/require-license-header: off`) — do not add or expect one. Run it
> from this plugin's dir inside `wazuh-dashboard/plugins/<this-plugin>`:
>
> ```bash
> yarn lint            # lints the plugin's JS files
> yarn lint --fix      # autofix
> ```
>
> The `@elastic/eslint-import-resolver-kibana` resolver needs the parent
> checkout's `node_modules`, so keep running it from inside the checkout.

### 4. Typecheck

> **repo-specific (wazuh-dashboard-alerting):** there is **no `typecheck` script**
> and **no root `tsconfig.json`** — this is a **JS-first** plugin (`main` is
> `index.js`), so **typecheck is not applicable here; skip it**.

### 5. Unit tests (changed code)

> **repo-specific (wazuh-dashboard-alerting):** the test script is **`yarn test:jest`**
> (not `yarn test`); it runs `TZ=UTC ../../node_modules/.bin/jest --config
> ./test/jest.config.js` from inside the `wazuh-dashboard` checkout at
> `plugins/<this-plugin>`. Bootstrap once (`yarn osd bootstrap` from the
> `wazuh-dashboard` root), then:
>
> ```bash
> yarn test:jest
> ```
>
> Scope for speed with a path/pattern (`yarn test:jest <path>`). Refresh snapshots
> only when the change intends to (`yarn test:jest:update-snapshots`).

Remember: unit tests are **colocated** (`*.test.js` / `*.test.tsx`, typically in
`__tests__/` folders next to the source, snapshots under `__snapshots__/`). New
source files should ship with their colocated test.

### 6. Report

Summarize each gate as pass/fail; if anything failed, list the offending files and
either fix them or explain what needs manual attention:

```
Prettier:  PASS
ESLint:    FAIL (2 files) → public/pages/Monitors/Monitors.js, server/routes/monitors.js
Typecheck: N/A (JS-first, no tsconfig)
Jest:      PASS
```

Only report "ready for review" once every applicable gate passes.
