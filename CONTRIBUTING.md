# Contributing to Kraaft

Thanks for your interest in contributing.

Project maintainer: Maniesh Sanwal

## Before you start

- Be respectful and collaborative
- Keep pull requests focused and easy to review
- Do not commit secrets, tokens, or real environment values
- Prefer small, incremental improvements over large unrelated changes

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `apps/web/.env.local` with the required variables from the README.

3. Start the app:

```bash
npm run dev
```

## Development guidelines

- Follow the existing monorepo structure
- Add new tools through the registry instead of hardcoding routes
- Reuse shared UI primitives from `packages/ui` when possible
- Keep naming and file placement consistent with nearby code
- Update documentation when behavior changes

## Pull request checklist

Before opening a pull request, please:

- Run `npm run typecheck`
- Run `npm run lint`
- Test the affected feature locally
- Include a clear description of what changed and why
- Add screenshots for UI changes when helpful

## Branches and commits

- Use descriptive branch names such as `feat/url-shortener-save-toggle`
- Write clear commit messages
- Avoid mixing refactors with unrelated feature work

## Reporting bugs

When reporting a bug, include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Screenshots or console errors if relevant
- Your environment details if the issue seems platform-specific

## Suggesting features

Feature requests are welcome. Please explain:

- The problem you are trying to solve
- The proposed solution
- Any tradeoffs or alternatives you considered

## Questions

If something is unclear, open an issue before starting a larger change so the implementation direction can be aligned early.
