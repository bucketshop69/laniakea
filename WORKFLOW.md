# Laniakea Development Workflow

## Quick Start Guide for Solo Development

This guide explains how to use GitHub issues and CI/CD to stay organized.

---

## The Workflow

```
1. CREATE ISSUE (use template)
   ↓
2. Work on it locally
   ↓
3. COMMIT & PUSH
   ↓
4. CI runs automatically (build + lint)
   ↓
5. CREATE PULL REQUEST (optional but recommended)
   ↓
6. MERGE to main
   ↓
7. CLOSE ISSUE
```

---

## Creating Issues

When you go to create a new issue on GitHub, you'll see these templates:

### 1. **Feature Request** - For new features
Use when: Building something new
Example: "Add Jupiter swap integration"

### 2. **Bug Report** - For fixing bugs
Use when: Something is broken
Example: "Wallet connection fails on mobile"

### 3. **Design Phase** - For planning before coding
Use when: Need to design/plan first
Example: "Design unified trading terminal"

### 4. **Refactor** - For code cleanup
Use when: Improving existing code
Example: "Consolidate duplicate swap logic"

---

## Issue Labels (Auto-Applied)

Your templates automatically add labels:
- `enhancement` - New features
- `bug` - Bugs to fix
- `design` - Design work
- `refactor` - Code cleanup
- `tech-debt` - Technical debt

You can add more labels manually:
- `priority: high`
- `priority: low`
- `mobile`
- `web`
- `jupiter`, `meteora`, `drift` (protocol-specific)

---

## CI/CD - What Happens Automatically

Every time you push code to GitHub:

1. **Linter runs** (`npm run lint`)
   - Checks code quality
   - Catches common mistakes

2. **Build runs** (`npm run build`)
   - Makes sure your code compiles
   - Catches TypeScript errors

3. **You get notified** if something fails
   - Check the "Actions" tab on GitHub
   - Fix the errors before merging

---

## Best Practices

### Before You Start Coding
1. **Create an issue** describing what you'll build
2. **Add labels** to categorize it
3. **Write acceptance criteria** (checkboxes in the issue)

### While Coding
1. **Commit often** with clear messages
2. **Reference the issue** in commits: `git commit -m "feat: add swap button #16"`
3. **Push regularly** to trigger CI checks

### When Done
1. **Create a PR** (even if you're the only dev - good habit)
2. **Link the issue** in the PR description: `Closes #16`
3. **Wait for CI** to pass (green checkmark)
4. **Merge and close**

---

## Commit Message Format

Use conventional commits for clarity:

```
feat: add new feature
fix: fix a bug
refactor: refactor code
docs: update documentation
style: formatting changes
test: add tests
chore: misc tasks
```

Examples:
- `feat: add Jupiter swap integration #12`
- `fix: resolve wallet connection issue #23`
- `refactor: consolidate swap logic #45`

---

## Updating Issue #16

To update issue #16 with your design content:

```bash
# Set your GitHub token (one time)
export GITHUB_TOKEN="your_github_personal_access_token"

# Run the script
bash /tmp/update_issue.sh
```

**Get a token:** https://github.com/settings/tokens
- Generate new token (classic)
- Select `repo` scope
- Copy and paste it above

---

## Checking CI Status

1. Go to: https://github.com/bucketshop69/laniakea/actions
2. See all your workflow runs
3. Click on any run to see details
4. Green checkmark = passed
5. Red X = failed (click to see what broke)

---

## Tips for Staying Organized

1. **Review open issues weekly** - Close stale ones
2. **Use milestones** for bigger features (group related issues)
3. **Add projects** if you want a kanban board
4. **Keep issues small** - Big features = multiple issues
5. **Close issues when done** - Don't let them pile up

---

## Example Flow

Let's say you want to add a new swap button:

```bash
# 1. Create issue on GitHub (use Feature template)
#    Title: "[FEATURE] Add swap button to Jupiter panel"
#    Fill in the template
#    Issue #50 is created

# 2. Work locally
git checkout -b feature/swap-button

# Make changes...

# 3. Commit
git add .
git commit -m "feat: add swap button to Jupiter panel #50"

# 4. Push
git push origin feature/swap-button

# 5. CI runs automatically (you'll get email if it fails)

# 6. Create PR on GitHub
#    Title: "Add swap button to Jupiter panel"
#    Description: "Closes #50"

# 7. Merge PR (issue #50 closes automatically)

# 8. Delete branch
git checkout main
git pull
git branch -d feature/swap-button
```

---

## Questions?

- Check GitHub Actions tab for CI status
- Read the CI workflow: `.github/workflows/ci.yml`
- Check issue templates: `.github/ISSUE_TEMPLATE/`

Happy coding!
