# Contributing to NADI

NADI is led by @fchyoga with @dzakyfahrezy1013 as a fellow developer. Each task has one owner and receives review from another developer.

## Workflow

1. Select an issue with a clear objective and acceptance criteria. Agree on public API and schema changes before implementation.
2. Update main and create a short-lived `feat/`, `fix/`, `docs/`, or `chore/` branch.
3. Implement the task and run relevant checks. The repository currently contains product material and source placeholders; application setup and CI are tracked in the bootstrap issue.
4. Open a PR. Use `Closes #N` only for completed work; otherwise use `Refs #N`.
5. Obtain one approval from another developer and resolve review discussions. New commits invalidate earlier approval. Squash merge after required checks pass.

Main is protected against direct pushes without an approved PR, force pushes, and deletion, including for administrators. The public-content check is required. Application lint, typecheck, test, and build checks will become required once bootstrap implements and verifies them.

## Documentation access for the development team

Team members with access can clone the private guide repository from the application root:

```sh
git clone https://github.com/SvaraNova/nadi-dev-docs.git docs/internal
```

Before development, update that checkout with `git -C docs/internal pull --ff-only` and follow its entry-point README. Record the guide commit used when handing work to another team member. Edit, commit, and push guide changes from the private checkout; `docs/internal/` is ignored by the application repository.

Public contributors do not need private access. Maintainers provide approved task requirements in public issues. Keep internal discussions in the private documentation repository. Do not copy private specifications into public issues or PRs.

## Checks and data

Run `python3 scripts/check-public-content.py` after committing a proposed public change. It checks the candidate commit history for internal guide paths and common local credential/snapshot paths. It is a supplementary guard, not a content classifier or secret scanner: review what you publish.

Use visibly fictional, explicitly synthetic fixtures in public tests. Credentials, local environment files, restricted provider payloads, and private Git history must stay out of public commits. Routine tests must not spend provider credits.
