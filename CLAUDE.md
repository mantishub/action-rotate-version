# CLAUDE.md - Project Guide

## Project Overview

This repository contains the **MantisHub Rotate Version GitHub Action**, a Node.js-based GitHub Action that automates version management in MantisHub bug tracking systems.

## Quick Commands

```bash
# Test the action locally (requires environment variables)
INPUT_URL=https://example.mantishub.io \
INPUT_API-KEY=your-api-key \
INPUT_PROJECT=MyProject \
INPUT_PLACEHOLDER-NAME=vNext \
INPUT_RELEASE-NAME=1.0.0 \
INPUT_NEXT-RELEASE-IN-DAYS=14 \
node index.js
```

## Project Structure

```
.
├── action.yml      # GitHub Action manifest (inputs, outputs, runtime)
├── index.js        # Main implementation (Node.js 20, no dependencies)
├── package.json    # Project metadata (for npm/marketplace)
├── LICENSE         # MIT License
├── README.md       # User documentation
└── CLAUDE.md       # This file
```

## Architecture

### Runtime
- **Node.js 20** - Specified in action.yml
- **No npm dependencies** - Uses only built-in `https` and `fs` modules

### Key Functions in index.js

| Function | Purpose |
|----------|---------|
| `run()` | Entry point - validates inputs and orchestrates rotation |
| `rotateVersion(data)` | Main logic - fetches project/version, updates, creates new |
| `httpRequest(url, method, body)` | Generic HTTPS request wrapper |
| `fetchProjects()` | GET /api/rest/projects |
| `fetchVersions(projectID)` | GET /api/rest/projects/{id}/versions |
| `getProjectID(projectName)` | Resolve project name to ID |
| `getVersionID(projectID, versionName)` | Resolve version name to ID |
| `updateVersion(projectID, versionID, body)` | PATCH to update version |
| `createVersion(projectID, body)` | POST to create new version |
| `validateInput(data)` | Input validation |

### Workflow

1. Validate all inputs (url, api-key, project, etc.)
2. Fetch project ID from project name
3. Fetch placeholder version ID (e.g., "vNext")
4. Update placeholder: rename to release name, mark released, set date to today
5. Create new placeholder version with target date (today + N days)
6. Output new version ID via GITHUB_OUTPUT

## GitHub Action Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Base URL of MantisHub instance (must be HTTPS) |
| `api-key` | Yes | MantisHub API token |
| `project` | Yes | Project name in MantisHub |
| `placeholder-name` | Yes | Placeholder version name (e.g., vNext) |
| `release-name` | Yes | Release version name (e.g., 1.0.0) |
| `next-release-in-days` | Yes | Days until next planned release |

## Security Considerations

### Implemented Security Measures

1. **HTTPS Required** - URL validation enforces HTTPS to protect API key in transit
2. **GITHUB_OUTPUT** - Uses secure environment file for outputs (not deprecated ::set-output)
3. **Input Validation** - All inputs validated before use

### Security Best Practices for Users

1. **Store API key as a secret** - Never hardcode in workflow files
2. **Use minimum required permissions** - API token should only have version management access
3. **Pin action version** - Use `@v1` or commit SHA, not `@main`

### Known Considerations

- API responses are logged to console (may appear in workflow logs)
- No request timeout configured on HTTP requests

## Development Notes

### Testing Changes

Since this action has no test suite, test manually:
1. Create a test workflow in a separate repository
2. Reference your branch: `uses: mantishub/action-rotate-version@your-branch`
3. Verify the version rotation works correctly

### Making Changes

- Keep the action dependency-free (Node.js built-ins only)
- Maintain backwards compatibility with existing workflows
- Update README.md when adding/changing inputs
- Use GITHUB_OUTPUT for all action outputs

## MantisHub API Reference

The action interacts with these MantisHub REST API endpoints:

- `GET /api/rest/projects` - List all projects
- `GET /api/rest/projects/{id}/versions` - List project versions
- `PATCH /api/rest/projects/{id}/versions/{vid}` - Update version
- `POST /api/rest/projects/{id}/versions` - Create version

Authorization: API key in `Authorization` header (no Bearer prefix).
