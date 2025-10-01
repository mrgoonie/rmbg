# NPM Token Setup Guide

This guide will help you configure the NPM token for automated releases via GitHub Actions.

## Prerequisites

- An NPM account ([sign up here](https://www.npmjs.com/signup))
- Access to the GitHub repository settings
- Admin rights to publish packages on NPM

## Step 1: Create an NPM Access Token

### Option A: Using NPM Website (Recommended)

1. **Log in to NPM**
   - Go to https://www.npmjs.com/
   - Click "Sign In" and enter your credentials

2. **Navigate to Access Tokens**
   - Click your profile picture (top right)
   - Select "Access Tokens" from the dropdown menu
   - Or go directly to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens

3. **Generate New Token**
   - Click the "Generate New Token" button
   - Select token type:
     - **Classic Token** → Choose "Automation" (recommended for CI/CD)
     - **Granular Access Token** → Configure specific package permissions

4. **Configure Token (for Automation type)**
   - Token will have full publish access
   - Copy the token immediately (it won't be shown again!)
   - Store it securely

5. **Configure Granular Token (if using Granular type)**
   - **Expiration**: Set to "No expiration" or choose a long duration
   - **Allowed IP ranges**: Leave empty (or add GitHub Actions IPs if desired)
   - **Packages and scopes**:
     - Select "Read and write" permission
     - Choose specific packages or "All packages"
   - **Organizations**: Select if applicable
   - Click "Generate Token"

### Option B: Using NPM CLI

```bash
# Login to NPM
npm login

# Generate token (classic automation token)
npm token create --type automation

# Or generate with specific settings
npm token create --read-only=false --cidr=0.0.0.0/0
```

**Copy the token output** - it looks like:
```
npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 2: Add NPM Token to GitHub Secrets

### Via GitHub Website

1. **Navigate to Repository Settings**
   - Go to your GitHub repository: https://github.com/YOUR_USERNAME/rmbg
   - Click "Settings" tab (top right)
   - If you don't see "Settings", you need admin access

2. **Access Secrets and Variables**
   - In the left sidebar, click "Secrets and variables"
   - Click "Actions"

3. **Add New Secret**
   - Click the "New repository secret" button
   - **Name**: `NPM_TOKEN`
   - **Value**: Paste your NPM token (starts with `npm_`)
   - Click "Add secret"

### Via GitHub CLI (Alternative)

```bash
# Install GitHub CLI if not already installed
brew install gh  # macOS
# or visit https://cli.github.com/

# Authenticate
gh auth login

# Add secret
gh secret set NPM_TOKEN --body "npm_your_token_here"

# Verify secret was added
gh secret list
```

## Step 3: Update Package Configurations

Ensure all publishable packages have proper configuration:

### packages/api/package.json
```json
{
  "name": "@rmbg/api",
  "version": "0.0.1",
  "publishConfig": {
    "access": "public"
  }
}
```

### packages/cli/package.json
```json
{
  "name": "@rmbg/cli",
  "version": "0.0.1",
  "publishConfig": {
    "access": "public"
  },
  "bin": {
    "rmbg": "./lib/cli.js"
  }
}
```

### packages/browser/package.json
```json
{
  "name": "@rmbg/browser",
  "version": "0.0.1",
  "publishConfig": {
    "access": "public"
  }
}
```

## Step 4: Verify Setup

1. **Check GitHub Secrets**
   ```bash
   gh secret list
   # Should show: NPM_TOKEN
   ```

2. **Test Locally (Optional)**
   ```bash
   # Set token temporarily
   export NPM_TOKEN=npm_your_token_here
   
   # Try semantic-release dry run
   npx semantic-release --dry-run
   ```

3. **Trigger Release**
   - Make a commit with conventional commit format
   - Push to main branch
   - Check GitHub Actions tab for workflow execution

## Step 5: Monitor First Release

1. **Check GitHub Actions**
   - Go to "Actions" tab in your repository
   - Click on the "Release" workflow
   - Monitor the execution

2. **Verify on NPM**
   - After successful release, check:
     - https://www.npmjs.com/package/@rmbg/api
     - https://www.npmjs.com/package/@rmbg/cli
     - https://www.npmjs.com/package/@rmbg/browser

3. **Check GitHub Releases**
   - Go to repository "Releases" page
   - Should see a new release with changelog

## Troubleshooting

### Issue: "Unable to authenticate"

**Solution:**
- Verify token is correctly copied (no extra spaces)
- Ensure token has "Automation" or "Publish" permissions
- Check token hasn't expired
- Regenerate token if necessary

### Issue: "403 Forbidden" when publishing

**Solution:**
- Ensure package name is available on NPM
- Check you have publish rights for scoped packages (@rmbg)
- Verify `publishConfig.access` is set to "public"

### Issue: "Package already exists"

**Solution:**
- Use a different package name or scope
- Or publish to an existing scope you control

### Issue: GitHub Action fails on "Release" step

**Solution:**
1. Check GitHub Actions logs for specific error
2. Verify NPM_TOKEN secret is set correctly
3. Ensure all packages build successfully
4. Check conventional commit format

## Security Best Practices

1. **Never commit tokens** to git repository
2. **Use Automation tokens** for CI/CD (not Classic tokens with user credentials)
3. **Set token expiration** if using Granular tokens
4. **Rotate tokens regularly** (every 6-12 months)
5. **Revoke old tokens** after rotation
6. **Use organization-level tokens** for team projects

## Token Management

### Rotate Token

```bash
# 1. Generate new token on NPM
npm token create --type automation

# 2. Update GitHub secret
gh secret set NPM_TOKEN --body "npm_new_token_here"

# 3. Revoke old token on NPM
npm token revoke <old-token-id>
```

### List All Tokens

```bash
npm token list
```

### Revoke Token

```bash
# Via CLI
npm token revoke <token-id>

# Via website
# Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
# Click "Delete" next to the token
```

## Testing Release Process

### Dry Run (No actual release)

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run semantic-release in dry-run mode
NPM_TOKEN=npm_your_token npx semantic-release --dry-run
```

### Manual Release (for testing)

```bash
# Ensure you're on main branch
git checkout main

# Make a commit with conventional format
git commit -m "feat: new feature to trigger release"

# Push to trigger GitHub Action
git push origin main

# Watch the release process
gh run watch
```

## Package Visibility

All packages are published as **public** packages under the `@rmbg` scope:
- @rmbg/api
- @rmbg/cli  
- @rmbg/browser
- @rmbg/model-* (if needed)

If you want **private packages**, change `publishConfig`:
```json
{
  "publishConfig": {
    "access": "restricted"
  }
}
```
Note: Private packages require a paid NPM plan.

## Additional Resources

- [NPM Access Tokens Documentation](https://docs.npmjs.com/about-access-tokens)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Semantic Release Documentation](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Quick Reference

| Task | Command |
|------|---------|
| Generate NPM token | `npm token create --type automation` |
| Add GitHub secret | `gh secret set NPM_TOKEN` |
| List secrets | `gh secret list` |
| Test release | `npx semantic-release --dry-run` |
| Watch workflow | `gh run watch` |
| List NPM tokens | `npm token list` |
| Revoke token | `npm token revoke <id>` |

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review GitHub Actions logs
3. Verify NPM token permissions
4. Check package.json configurations
