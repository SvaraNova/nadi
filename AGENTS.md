# NADI development

Read README.md, CONTRIBUTING.md, and the assigned issue before making changes.

Authorized team members: if `docs/internal/` is available, read its README.md,
00-AI-DEVELOPMENT-GUIDE.md, and 12-DECISIONS-AND-STATUS.md, then the relevant
contracts. In these internal guides, historical `docs/<file>.md` references
mean `docs/internal/<file>.md` in the public application workspace.

Keep internal specifications, private discussion, credentials, and provider
snapshots out of public commits, issues, PR descriptions, and CI logs.
Commit internal guide updates only within the separate docs/internal repository.
Do not copy private Git history or use mirror/all-branch pushes to this remote.

Public contributions must have sufficient approved requirements in their issue;
private documentation is not required to run public checks. Never invent missing
contracts or claim that an unavailable application, dataset, or test succeeded.
