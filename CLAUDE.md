# CLAUDE.md - Project Guide

## Project Overview

This repository contains the **MantisHub Rotate Version GitHub Action**, a
Node.js-based GitHub Action that automates version management in MantisHub
bug tracking systems.

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

```text
.
├── action.yml      # GitHub Action manifest (inputs, outputs, runtime)
├── index.js        # Main implementation (Node.js 20)
├── package.json    # Project metadata (for npm/marketplace)
├── LICENSE         # MIT License
├── README.md       # User documentation
└── CLAUDE.md       # This file
```

## Architecture

### Runtime

- **Node.js 20** - Specified in action.yml
- **Dependencies** - Uses `@actions/core` for GitHub Actions toolkit and
  built-in `https` module for API requests

### Key Functions in index.js

| Function                              | Purpose                            |
| ------------------------------------- | ---------------------------------- |
| `run()`                               | Entry point, validates and runs    |
| `rotateVersion(data)`                 | Main logic for version rotation    |
| `httpRequest(url, method, body)`      | Generic HTTPS request wrapper      |
| `fetchProjects()`                     | GET /api/rest/projects             |
| `fetchVersions(projectID)`            | GET project versions               |
| `getProjectID(projectName)`           | Resolve project name to ID         |
| `getVersionID(projectID, versionName)`| Resolve version name to ID         |
| `updateVersion(projectID, ...)`       | PATCH to update version            |
| `createVersion(projectID, body)`      | POST to create new version         |
| `validateInput(data)`                 | Input validation                   |

### Workflow

1. Validate all inputs (url, api-key, project, etc.)
2. Fetch project ID from project name
3. Fetch placeholder version ID (e.g., "vNext")
4. Update placeholder: rename, mark released, set date to today
5. Create new placeholder version with target date (today + N days)
6. Output new version ID via `core.setOutput()`

## GitHub Action Inputs

| Input                  | Required | Description                       |
| ---------------------- | -------- | --------------------------------- |
| `url`                  | Yes      | Base URL (must be HTTPS)          |
| `api-key`              | Yes      | MantisHub API token               |
| `project`              | Yes      | Project name in MantisHub         |
| `placeholder-name`     | Yes      | Placeholder version name          |
| `release-name`         | Yes      | Release version name              |
| `next-release-in-days` | Yes      | Days until next planned release   |

## Security Considerations

### Implemented Security Measures

1. **HTTPS Required** - URL validation enforces HTTPS to protect API key
2. **@actions/core** - Uses official toolkit for secure input/output handling
3. **Input Validation** - All inputs validated before use

### Security Best Practices for Users

1. **Store API key as a secret** - Never hardcode in workflow files
2. **Use minimum required permissions** - API token should only have
   version management access
3. **Pin action version** - Use `@v1` or commit SHA, not `@main`

### Known Considerations

- API responses logged via `core.debug()` (visible with debug logging enabled)
- No request timeout configured on HTTP requests

## Development Notes

### Testing Changes

Since this action has no test suite, test manually:

1. Create a test workflow in a separate repository
2. Reference your branch: `uses: mantishub/action-rotate-version@your-branch`
3. Verify the version rotation works correctly

### Making Changes

- Use `@actions/core` for inputs, outputs, and logging
- Maintain backwards compatibility with existing workflows
- Update README.md when adding/changing inputs
- Run `npm install` after cloning to install dependencies
- Run `npx markdownlint-cli "**/*.md"` after editing markdown files

## MantisHub API Reference

The action interacts with these MantisHub REST API endpoints:

- `GET /api/rest/projects` - List all projects
- `GET /api/rest/projects/{id}/versions` - List project versions
- `PATCH /api/rest/projects/{id}/versions/{vid}` - Update version
- `POST /api/rest/projects/{id}/versions` - Create version

Authorization: API key in `Authorization` header (no Bearer prefix).
