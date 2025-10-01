# Fix NPM Package Publishing Workflow

**Created:** 2025-10-01
**Status:** Ready for Implementation
**Priority:** High

## Overview

The GitHub Actions release workflow is **successfully running** but **NOT publishing individual workspace packages** to NPM. The current workflow uses `semantic-release` which only handles the root monorepo package (which is private and correctly skips NPM publish). However, the publishable packages (`@rmbg/browser`, `@rmbg/cli`, `@rmbg/api`) are never published to NPM.

## Root Cause Analysis

### Current Workflow Behavior

1. **Semantic-release runs on root package** - Creates GitHub releases, updates CHANGELOG, creates git tags
2. **Root package is private** - Correctly skips NPM publish with `npmPublish: false`
3. **Individual packages are NEVER published** - No mechanism exists to publish workspace packages

### Key Findings from CI/CD Logs

```
[6:33:37 AM] [semantic-release] [@semantic-release/npm] › ℹ  Skip publishing to npm registry as npmPublish is false
[6:33:37 AM] [semantic-release] › ✔  Completed step "publish" of plugin "@semantic-release/npm"
```

This is **intentional** for the root package, but we need a separate step to publish workspace packages.

### Repository Structure

- **Monorepo:** pnpm workspace with multiple packages
- **Publishable Packages:**
  - `@rmbg/browser` (v0.0.3) - Browser SDK
  - `@rmbg/cli` (v0.0.1) - CLI tool
  - `@rmbg/api` (v0.0.1) - API server
  - Multiple `@rmbg/model-*` packages - ONNX model packages
- **Private Packages:**
  - `rmbg` (root) - Monorepo root
  - `@rmbg/website` - Documentation site
  - `@rmbg/desktop` - Tauri desktop app

### Current Issues

1. **No NPM authentication for workspace packages** - Individual packages require their own publish step
2. **Semantic-release only handles root package** - Doesn't publish workspace packages
3. **Changesets not being used** - Configured but not integrated into workflow
4. **Missing publish step** - No `pnpm publish -r` or equivalent command

## Solution Design

We have **two viable approaches** for fixing this issue:

### Option 1: Use Changesets (RECOMMENDED)

**Pros:**
- Already configured in the repository (`.changeset/config.json`)
- Better version management for monorepos
- Handles workspace dependencies automatically
- More flexible than semantic-release for monorepos

**Cons:**
- Requires switching from semantic-release
- Different workflow pattern

### Option 2: Add pnpm publish step to existing workflow

**Pros:**
- Keeps semantic-release for root package
- Simpler migration
- Less changes to existing workflow

**Cons:**
- Manual version management for workspace packages
- Semantic-release doesn't version workspace packages
- Less integrated solution

## Implementation Plan (Option 1 - Changesets - RECOMMENDED)

This approach provides better monorepo support and is already configured in the repository.

### Step 1: Update GitHub Actions Workflow

**File:** `.github/workflows/release.yml`

**Changes:**
1. Replace semantic-release with changesets publishing
2. Add proper NPM authentication
3. Add changeset status check
4. Publish workspace packages with provenance

**New workflow structure:**

```yaml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

permissions:
  contents: write
  issues: write
  pull-requests: write
  id-token: write

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build all packages
        run: pnpm -r build

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
          commit: 'chore: release packages'
          title: 'chore: release packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Step 2: Update Changesets Configuration

**File:** `.changeset/config.json`

**Changes:**
1. Set `access` to "public" (currently "restricted")
2. Keep `@rmbg/website` and `@rmbg/desktop` in ignore list

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@rmbg/website", "@rmbg/desktop", "rmbg"]
}
```

### Step 3: Add .npmrc Configuration

**File:** `.npmrc` (create at root)

**Content:**
```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
access=public
provenance=true
```

This ensures:
- NPM authentication works properly
- All packages default to public access
- Provenance attestation is enabled

### Step 4: Update Root package.json

**File:** `package.json`

**Changes:**
1. Mark root as private and non-publishable
2. Add release scripts using changesets

```json
{
  "name": "rmbg",
  "version": "1.0.0",
  "private": true,
  "publishConfig": {
    "access": "restricted"
  },
  "scripts": {
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "pnpm -r build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.1",
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/commit-analyzer": "^11.1.0",
    "@semantic-release/git": "^10.0.1",
    "@semantic-release/github": "^9.2.6",
    "@semantic-release/npm": "^11.0.2",
    "@semantic-release/release-notes-generator": "^12.1.0",
    "@typescript-eslint/eslint-plugin": "^6.11.0",
    "conventional-changelog-conventionalcommits": "^7.0.2",
    "eslint": "^8.53.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-config-standard-with-typescript": "^39.1.1",
    "eslint-plugin-import": "^2.29.0",
    "eslint-plugin-n": "^16.3.1",
    "eslint-plugin-promise": "^6.1.1",
    "semantic-release": "^23.0.0",
    "typescript": "^5.2.2"
  }
}
```

### Step 5: Verify Package Configurations

Ensure all publishable packages have correct configuration:

**Files to verify:**
- `packages/browser/package.json`
- `packages/cli/package.json`
- `packages/api/package.json`
- `packages/model-*/package.json`

**Required fields in each:**
```json
{
  "name": "@rmbg/...",
  "version": "x.x.x",
  "publishConfig": {
    "access": "public"
  }
}
```

**Current status:** All packages already have `publishConfig.access: public` ✓

### Step 6: Verify NPM Token Secret

**Action Required:**
1. Go to GitHub repository Settings → Secrets → Actions
2. Verify `NPM_TOKEN` secret exists with valid token
3. Token should have "Automation" permissions for publishing

**To create new token:**
1. Go to npmjs.com → Access Tokens
2. Generate new token (Type: "Automation")
3. Add token to GitHub Secrets as `NPM_TOKEN`

### Step 7: Create Initial Changeset

Before the workflow can publish, you need changesets for the packages:

**Command to run locally:**
```bash
cd /Users/duynguyen/www/rmbg
pnpm changeset
```

**Example changeset creation:**
1. Select packages to version: `@rmbg/browser`, `@rmbg/cli`, `@rmbg/api`
2. Select bump type: `patch` (or `minor`/`major`)
3. Write summary: "Initial NPM publish"

This creates a `.changeset/<random-id>.md` file that should be committed.

### Step 8: Update CLAUDE.md Documentation

**File:** `CLAUDE.md`

**Add section:**
```markdown
## Release Process

This repository uses **Changesets** for version management and publishing.

### Creating a Release

1. **Make changes** to packages
2. **Create changeset**: `pnpm changeset`
   - Select changed packages
   - Choose version bump (major/minor/patch)
   - Write description
3. **Commit changeset**: `.changeset/*.md` files
4. **Push to main**: Triggers release workflow
5. **Workflow actions**:
   - Creates "Version Packages" PR (if changesets exist)
   - Merging PR publishes packages to NPM

### Manual Publishing (if needed)

```bash
pnpm -r build
pnpm changeset version  # Update versions
pnpm changeset publish  # Publish to NPM
```

### Semantic Release (Deprecated)

The old semantic-release configuration (`.releaserc.json`) is kept for reference but no longer used.
```

### Step 9: Optional - Remove/Archive Semantic Release Config

**Files to handle:**
- `.releaserc.json` - Can be renamed to `.releaserc.json.backup` or deleted
- Root package.json semantic-release dependencies - Can be removed

**Note:** Keep these initially to allow rollback if needed.

## Implementation Plan (Option 2 - Add pnpm publish)

This is a **simpler but less robust** approach that keeps semantic-release.

### Step 1: Update GitHub Actions Workflow

**File:** `.github/workflows/release.yml`

**Add after "Build all packages" step:**

```yaml
      - name: Setup NPM authentication
        run: |
          echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc
          echo "access=public" >> ~/.npmrc

      - name: Publish workspace packages
        run: |
          # Get version from package.json
          VERSION=$(node -p "require('./package.json').version")

          # Update workspace package versions to match root
          pnpm -r exec -- npm version $VERSION --no-git-tag-version --allow-same-version

          # Publish workspace packages (exclude private packages)
          pnpm -r --filter='!rmbg' --filter='!@rmbg/website' --filter='!@rmbg/desktop' publish --no-git-checks --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Step 2: Update .releaserc.json

**No changes needed** - Keep existing configuration.

### Step 3: Verify NPM Token

Same as Option 1, Step 6.

## Testing Strategy

### Pre-deployment Testing

1. **Dry-run publish locally:**
   ```bash
   cd /Users/duynguyen/www/rmbg
   pnpm -r build
   pnpm -r exec -- npm pack --dry-run
   ```

2. **Verify package contents:**
   ```bash
   cd packages/browser
   npm pack
   tar -tzf rmbg-browser-*.tgz
   ```

3. **Test changesets workflow locally:**
   ```bash
   pnpm changeset
   pnpm changeset version
   # Review changes in git diff
   git reset --hard  # Don't commit yet
   ```

### Post-deployment Validation

1. **Check NPM registry:**
   - Visit `https://www.npmjs.com/package/@rmbg/browser`
   - Visit `https://www.npmjs.com/package/@rmbg/cli`
   - Visit `https://www.npmjs.com/package/@rmbg/api`

2. **Install published packages:**
   ```bash
   npm install @rmbg/browser@latest
   npm install @rmbg/cli@latest
   npm install @rmbg/api@latest
   ```

3. **Verify provenance:**
   ```bash
   npm view @rmbg/browser --json | jq .dist.attestations
   ```

4. **Test package functionality:**
   ```bash
   npx @rmbg/cli test-image.jpg
   ```

## Security Considerations

### NPM Token Security

- ✓ Token stored as GitHub Secret (encrypted)
- ✓ Token has "Automation" scope only
- ✓ Token not exposed in logs
- ✓ `NODE_AUTH_TOKEN` environment variable used

### Package Provenance

- ✓ `id-token: write` permission for OIDC
- ✓ Provenance attestation enabled in .npmrc
- ✓ Builds run in isolated GitHub Actions environment

### Access Control

- ✓ All packages use `publishConfig.access: public`
- ✓ Root package is private
- ✓ NPM 2FA recommended for maintainer accounts

## Performance Considerations

### Build Time

- Current: ~40 seconds for all packages
- No performance concerns

### Publish Time

- Estimated: ~10-20 seconds per package
- Total: ~1-2 minutes for all packages

### Cache Strategy

- pnpm store cached between runs
- node_modules not cached (uses pnpm store)
- Build outputs not cached (always fresh builds)

## Risks & Mitigations

### Risk 1: Publishing Fails Due to NPM Token

**Likelihood:** Medium
**Impact:** High
**Mitigation:**
- Verify NPM_TOKEN secret exists and is valid
- Test token locally before pushing
- Have backup token ready

### Risk 2: Version Conflicts

**Likelihood:** Low (with changesets)
**Impact:** Medium
**Mitigation:**
- Changesets handles version management
- Dry-run testing before real publish
- Semantic versioning prevents conflicts

### Risk 3: Breaking Changes Published

**Likelihood:** Low
**Impact:** High
**Mitigation:**
- All packages start at 0.x.x (no semver guarantees)
- Changeset requires manual version selection
- PR review before merge

### Risk 4: Workflow Fails Mid-publish

**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- GitHub Actions atomic operations
- pnpm publish retries failed packages
- Manual publish recovery possible

## Files to Modify

### Option 1 (Changesets - RECOMMENDED)

1. **`.github/workflows/release.yml`** - Complete rewrite using changesets/action
2. **`.changeset/config.json`** - Change `access` from "restricted" to "public"
3. **`.npmrc`** (create new) - Add NPM authentication and provenance
4. **`package.json`** - Add release scripts, mark as private
5. **`CLAUDE.md`** - Document new release process

### Option 2 (pnpm publish)

1. **`.github/workflows/release.yml`** - Add NPM auth and publish steps
2. **`.npmrc`** (create new) - Add NPM authentication

## Acceptance Criteria

- [ ] GitHub Actions workflow runs successfully
- [ ] Packages published to NPM registry
- [ ] Package versions incremented correctly
- [ ] Provenance attestation present
- [ ] No breaking changes to existing packages
- [ ] Documentation updated
- [ ] Local testing completed
- [ ] NPM token verified and working

## Post-Implementation Checklist

- [ ] Verify packages appear on npmjs.com
- [ ] Install packages in test project
- [ ] Run package CLI commands
- [ ] Check GitHub releases created
- [ ] Update CLAUDE.md with release notes
- [ ] Create GitHub issue for semantic-release removal (if using Option 1)

## Rollback Plan

If publishing fails or causes issues:

### Option 1 Rollback
1. Revert workflow changes: `git revert <commit>`
2. Re-enable semantic-release workflow
3. Manually unpublish broken packages: `npm unpublish @rmbg/package@version`

### Option 2 Rollback
1. Remove publish step from workflow
2. Revert to previous workflow version
3. Manually unpublish if needed

## Additional Notes

### Why Option 1 is Recommended

1. **Better monorepo support** - Changesets designed for monorepos
2. **Version management** - Handles workspace dependencies
3. **Already configured** - `.changeset/config.json` exists
4. **Industry standard** - Used by many monorepos (React, Vue, etc.)
5. **Flexible versioning** - Independent package versions

### Migration from Semantic Release

The current setup uses semantic-release for the root package only. This works for GitHub releases but doesn't handle NPM publishing for workspace packages. Changesets provides:

- Per-package versioning
- Workspace dependency updates
- Conventional commit messages (optional)
- Better CI/CD integration

## Timeline

**Estimated implementation time:** 1-2 hours

1. Update workflow file: 30 minutes
2. Update configuration files: 15 minutes
3. Create initial changeset: 10 minutes
4. Test locally: 15 minutes
5. Deploy and verify: 20 minutes
6. Documentation updates: 10 minutes

## References

- [Changesets Documentation](https://github.com/changesets/changesets)
- [GitHub Actions NPM Publishing](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
- [NPM Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [pnpm Workspace Publishing](https://pnpm.io/cli/publish)

---

**Prepared by:** Claude Code (Planner Agent)
**Date:** 2025-10-01
**Status:** Ready for Implementation
