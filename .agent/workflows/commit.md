---
description: Commit and push all changes to the dev branch
---

// turbo-all

1. Stage all changes
```bash
git add -A
```

2. Commit with the provided message
```bash
git commit -m "[MESSAGE]"
```
Replace `[MESSAGE]` with the commit message describing the changes.

3. Push to dev branch
```bash
git push origin dev
```

## Usage
When the user says "commit" or "push to github", use this workflow to stage, commit, and push all changes automatically.

## Commit Message Format
Follow conventional commits format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `refactor:` for code refactoring
- `style:` for styling changes
- `chore:` for maintenance tasks
