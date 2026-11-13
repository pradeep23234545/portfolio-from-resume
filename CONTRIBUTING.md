# Contributing

Thanks for your interest in improving Resume-to-Portfolio!

## Local setup

Follow the [Getting started](README.md#getting-started) steps in the README.

## Workflow

1. Fork the repo and create a branch from `main`:
   `git checkout -b feat/short-description`
2. Make your change. Keep pull requests focused on one thing.
3. Run the checks before pushing:
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:` …).
5. Open a pull request describing **what** changed and **why**. Add screenshots
   for UI changes.

## Code style

- TypeScript everywhere; avoid `any` in new code.
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`,
  `GEMINI_API_KEY`, `GITHUB_CLIENT_SECRET`) must never be imported into client
  components.
- Reusable UI lives in `src/components/ui`; feature components live next to
  their feature folder.

## Reporting bugs

Open an issue with steps to reproduce, what you expected, and what happened.
Please **do not** include API keys or personal data in issues.
