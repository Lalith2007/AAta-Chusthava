# AAta Chusthava — Git & CI/CD Development Policy

## Repository Information
- **URL**: `https://github.com/Lalith2007/AAta-Chusthava.git`
- **Default Branch**: `main`

---

## 1. Branching Model

Direct commits and direct pushes to `main` are strictly prohibited.

Every feature, bug fix, task, or refactor must be developed on a dedicated branch created from `main`:

```text
feature/<feature-name>      # New functionality or domain features
fix/<bug-name>              # Bug fixes and defect corrections
chore/<task-name>           # Tooling, CI/CD, dependency updates
refactor/<task-name>        # Code restructuring without behavioral changes
```

### Examples:
- `feature/movie-database`
- `feature/clue-engine`
- `feature/game-engine`
- `feature/daily-puzzles`
- `feature/friend-challenges`
- `feature/tmdb-ingestion`
- `feature/admin-dashboard`
- `fix/duplicate-guesses`
- `fix/target-secrecy`
- `chore/ci-pipeline`
- `chore/deployment`

---

## 2. Commit Message Guidelines

Use structured, descriptive commit messages following the Conventional Commits specification:

```text
feat: add normalized movie schema and repository
feat: implement 11 deterministic clue evaluators
feat: add daily puzzle scheduling and archive service
feat: add friend challenge creation with opaque 6-char codes
fix: reject duplicate guesses under REJECT_NO_PENALTY policy
fix: conceal target movie metadata until game completion
chore: configure GitHub Actions CI/CD workflows and PR template
docs: add master architecture and database specifications
```

---

## 3. Pull Request & Review Standard Workflow

```text
1. Fetch latest changes: git checkout main && git pull origin main
2. Create dedicated branch: git checkout -b feature/my-feature
3. Implement code changes with unit & integration tests
4. Verify locally:
   - npm test
   - npm run build
5. Commit: git commit -m "feat: description of change"
6. Push branch: git push -u origin feature/my-feature
7. Open Pull Request on GitHub with the standard PR template
8. Automated CI executes:
   ├── Lint & Typecheck
   ├── Unit & Integration Tests (PostgreSQL container)
   └── Production Build
9. Review PR and obtain approvals
10. Merge PR into main (Squash or Rebase Merge)
```

---

## 4. GitHub Branch Protection for `main`

Configure the following rules on `main` in GitHub Settings:
1. **Require a pull request before merging**.
2. **Require status checks to pass before merging**:
   - `Lint & Typecheck`
   - `Unit & Integration Tests`
   - `Production Build Validation`
3. **Require conversation resolution before merging**.
4. **Do not allow bypassing the above settings**.
5. **Do not allow force pushes or branch deletion**.

---

## 5. Staging & Production Release Lifecycle

- **Merge to `main`**: Automatically triggers staging deployment and smoke verification.
- **Tagged Release (`v*.*.*`)**: Promotes approved build to production after deployment gate checks.
