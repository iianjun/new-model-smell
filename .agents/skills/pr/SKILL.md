---
name: pr
description: Prepare and open a focused GitHub pull request from the current branch using the repository pull request template. Use when asked to create, open, submit, or update a PR for completed repository changes.
---

# PR

Create a focused pull request that accurately describes the current branch.

## Workflow

1. Read the applicable `AGENTS.md` files and `.github/pull_request_template.md`.
2. Resolve the base branch from `origin/HEAD`, falling back to `main`, and ensure the current branch is not the base branch.
3. Inspect `git status`, the staged and unstaged diffs, and commits relative to the base branch. Keep unrelated user changes out of the PR.
4. If task changes are uncommitted, stage only the files in scope and commit them with a concise conventional commit message.
5. Run the relevant repository checks. For this repository, run `pnpm lint` and `pnpm build` when applicable. Never mark a check as complete unless it passed.
6. Fill every pull request template section:
   - Summarize what changed and why in one to three bullets.
   - List the exact verification commands and outcomes.
   - Put screenshots, asset/source links, follow-ups, or `N/A` in Notes.
7. Push the branch with `git push -u origin HEAD`.
8. Use `gh pr view` to avoid duplicate pull requests. Update an existing open PR with `gh pr edit`, or create one with `gh pr create`.
9. Return the pull request URL and mention any failed or skipped checks.

Do not merge the pull request unless the user explicitly asks.
