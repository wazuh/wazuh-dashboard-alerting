---
name: issue-creation
description: Create a well-formed GitHub issue in a Wazuh Dashboard repo — pick the right issue template, run an issue-first duplicate check, and produce a ready-to-file body with the template's default labels. Use when the user asks to create, open, file, or draft an issue.
---

# Create a wazuh-dashboard-alerting issue

Pick the right issue template, check for duplicates first, then fill the
template verbatim and hand off a ready-to-file body.

## Workflow

Copy this checklist and track progress:

```
- [ ] 1. Classify intent → choose issue template (ask only if ambiguous)
- [ ] 2. Issue-first check: search existing issues for duplicates
- [ ] 3. Fill the chosen .github/ISSUE_TEMPLATE/*.md verbatim
- [ ] 4. Keep the template's default labels; add a triage label only if named
- [ ] 5. Emit the ready-to-file body + report (default stop; gh issue create only if asked)
```

### 1. Classify intent → choose template

Map the user's intent to a template. Ask the user only when genuinely
ambiguous between two rows.

| Intent | Template | Labels (from template frontmatter) |
|--------|----------|--------|
| Bug / defect report | `bug_report.md` | `bug, untriaged` |
| New feature / enhancement request | `feature_request.md` | `enhancement, untriaged` |
| New OpenSearch version compatibility tracking | `compatibility_request.md` | `request/operational, level/task, type/maintenance` |
| Documentation gap or fix | `documentation.md` | *(none — see note below)* |
| Engineering task / improvement | `task_template.md` | `level/task` |

### 2. Issue-first duplicate check

Before drafting, search for an existing issue covering the same problem:

```bash
gh issue list --search "<keywords>"
gh search issues "<keywords>" --repo wazuh/wazuh-dashboard-alerting
```

On a likely match, surface it to the user and ask whether to proceed with a
new issue or comment on the existing one instead.

### 3. Fill the template

Reference the chosen file under
[`.github/ISSUE_TEMPLATE`](../../../.github/ISSUE_TEMPLATE) — read it first and
fill it verbatim; do not inline template bodies in this skill.

> **repo-specific (wazuh-dashboard-alerting):** `bug_report.md` and
> `feature_request.md` are upstream-inherited templates with full frontmatter
> (`name`, `about`, `title`, `labels`) and are shown as chooser cards. Their
> claimed labels are **partly stale**: this repo's real label set (`gh label
> list`) has no `bug` or `enhancement` label — only the Wazuh taxonomy
> (`type/bug`, `type/enhancement`, `level/*`, `reporter/*`,
> `request/operational`, `untriaged`). GitHub silently drops a template label
> that doesn't exist in the repo, so filing via `bug_report.md` only actually
> attaches `untriaged` (not `bug`); `feature_request.md` likewise only attaches
> `untriaged` (not `enhancement`). Manually add the real `type/bug` /
> `type/enhancement` label during triage if you want that classification to
> stick — don't claim `bug`/`enhancement` will be applied automatically.
>
> `compatibility_request.md` is accurate: all three of its labels
> (`request/operational`, `level/task`, `type/maintenance`) exist in the repo
> and its title is a template you fill in (`Compatibility with OpenSearch
> (version)`), not a `[PREFIX]` tag.
>
> `documentation.md` has **no frontmatter at all** — no `name`/`about`/`title`/
> `labels` — so it won't show as a chooser card and applies no default label.
> It is not really meant for a person to file manually here: the
> `.github/workflows/create-documentation-issue.yml` workflow appends a PR link
> to it and files it as an issue in the **upstream**
> `opensearch-project/documentation-website` repo (label `documentation`,
> title `Add documentation related to new feature`) whenever a PR in this repo
> is labeled `needs-documentation`. If the user wants a documentation issue
> filed in *this* repo instead, use `documentation.md`'s body as free-form
> content with no default labels.
>
> [`config.yml`](../../../.github/ISSUE_TEMPLATE/config.yml) only declares
> `contact_links` (OpenSearch community support, AWS/Amazon security
> reporting) — it does **not** set `blank_issues_enabled: false`, so blank
> issues remain allowed alongside the templates. Regardless of template,
> `.github/workflows/add-untriaged.yml` auto-applies the `untriaged` label to
> every new issue on open/reopen/transfer — so the actual end-state label set
> always includes `untriaged`, even where the template's own frontmatter can't
> deliver it.

### 4. Labels

Keep the template's default labels as-is; add an extra triage label only if
the user explicitly names one. Do not invent labels or an approval workflow.

### 5. Emit the ready-to-file body + report

**Default deliverable — stop here.** Output the filled issue body plus a short
report for the human to review:

```
Issue pre-flight
- Template: <file>
- Labels: <label list>
- Duplicate check: no matches found / possible match: <issue-url>
- Command to open it: gh issue create --template <file> --label "<labels>"
```

Only run `gh issue create` when the user explicitly asks you to open the
issue.
