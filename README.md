# MantisHub Rotate Version GitHub Action

Automate your release version management in [MantisHub](https://www.mantishub.com)
directly from your GitHub workflows.

## Overview

This GitHub Action implements a common version rotation pattern for release
management:

1. **Mark as Released** - Sets the current placeholder version (e.g., "vNext")
   as released with today's date
2. **Rename Version** - Renames the placeholder to your actual release name
   (e.g., "1.0.0")
3. **Create New Placeholder** - Creates a new placeholder version for the next
   development cycle

This approach ensures you always have a version available to associate issues
with that are targeted for or fixed in the upcoming release.

### Visual Workflow

```text
Before Release:                    After Release:
┌─────────────────────┐           ┌─────────────────────┐
│ vNext (unreleased)  │  ──────►  │ 1.0.0 (released)    │
│ target: future date │           │ released: today     │
└─────────────────────┘           └─────────────────────┘
                                           +
                                  ┌─────────────────────┐
                                  │ vNext (unreleased)  │
                                  │ target: now + N days│
                                  └─────────────────────┘
```

## Prerequisites

- A [MantisHub](https://www.mantishub.com) account with an active project
- A MantisHub API token with permissions to manage versions
- A placeholder version (e.g., "vNext") already created in your MantisHub
  project

### Generating a MantisHub API Token

1. Log in to your MantisHub instance
2. Navigate to **My Account** (click your username in the top right)
3. Select the **API Tokens** tab
4. Enter a token name (e.g., "GitHub Actions") and click **Create API Token**
5. Copy the generated token and store it securely

## Inputs

All inputs are **required**.

- **`url`** - Base URL of your MantisHub instance
  (e.g., `https://example.mantishub.io`)
- **`api-key`** - MantisHub API token for authentication
  (e.g., `${{ secrets.MANTISHUB_API_KEY }}`)
- **`project`** - Name of the project in MantisHub (e.g., `MyProject`)
- **`placeholder-name`** - Placeholder version to rotate (e.g., `vNext`)
- **`release-name`** - Name for the released version (e.g., `1.0.0`)
- **`next-release-in-days`** - Days until the next planned release (e.g., `14`)

## Outputs

- **`version-id`** - The ID of the newly created placeholder version

## Usage

### Basic Example

```yaml
- name: Rotate Version
  uses: mantishub/action-rotate-version@v1
  with:
    url: https://example.mantishub.io
    api-key: ${{ secrets.MANTISHUB_API_KEY }}
    project: 'MyProject'
    placeholder-name: 'vNext'
    release-name: '1.0.0'
    next-release-in-days: 14
```

### Complete Release Workflow

This example shows a complete workflow that triggers on release creation:

```yaml
name: Release Version Management

on:
  release:
    types: [published]

jobs:
  rotate-mantishub-version:
    runs-on: ubuntu-latest
    steps:
      - name: Rotate MantisHub Version
        id: rotate-version
        uses: mantishub/action-rotate-version@v1
        with:
          url: https://example.mantishub.io
          api-key: ${{ secrets.MANTISHUB_API_KEY }}
          project: 'MyProject'
          placeholder-name: 'vNext'
          release-name: ${{ github.event.release.tag_name }}
          next-release-in-days: 14

      - name: Log New Version ID
        run: |
          echo "Created new placeholder version"
          echo "ID: ${{ steps.rotate-version.outputs.version-id }}"
```

### Manual Dispatch Workflow

Trigger version rotation manually with custom inputs:

```yaml
name: Manual Version Rotation

on:
  workflow_dispatch:
    inputs:
      release_name:
        description: 'Version name for this release'
        required: true
        type: string
      days_until_next:
        description: 'Days until next release'
        required: true
        default: '14'
        type: string

jobs:
  rotate-version:
    runs-on: ubuntu-latest
    steps:
      - name: Rotate MantisHub Version
        id: rotate-version
        uses: mantishub/action-rotate-version@v1
        with:
          url: https://example.mantishub.io
          api-key: ${{ secrets.MANTISHUB_API_KEY }}
          project: 'MyProject'
          placeholder-name: 'vNext'
          release-name: ${{ inputs.release_name }}
          next-release-in-days: ${{ inputs.days_until_next }}

      - name: Summary
        run: |
          echo "## Version Rotation Complete" >> $GITHUB_STEP_SUMMARY
          echo "- Released: ${{ inputs.release_name }}" >> $GITHUB_STEP_SUMMARY
          VID="${{ steps.rotate-version.outputs.version-id }}"
          echo "- New version ID: $VID" >> $GITHUB_STEP_SUMMARY
```

### Multi-Project Workflow

Rotate versions across multiple projects simultaneously:

```yaml
name: Multi-Project Release

on:
  release:
    types: [published]

jobs:
  rotate-versions:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: ['Frontend', 'Backend', 'API']
    steps:
      - name: Rotate ${{ matrix.project }} Version
        uses: mantishub/action-rotate-version@v1
        with:
          url: https://example.mantishub.io
          api-key: ${{ secrets.MANTISHUB_API_KEY }}
          project: ${{ matrix.project }}
          placeholder-name: 'vNext'
          release-name: ${{ github.event.release.tag_name }}
          next-release-in-days: 14
```

## Setting Up Secrets

Store your MantisHub API key securely as a GitHub secret:

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `MANTISHUB_API_KEY`
5. Value: Your MantisHub API token
6. Click **Add secret**

## How It Works

The action performs the following API operations against your MantisHub
instance:

1. **Fetch Project** - Retrieves the project ID using the project name via
   `GET /api/rest/projects`
2. **Fetch Version** - Finds the placeholder version ID via
   `GET /api/rest/projects/{id}/versions`
3. **Update Version** - Updates the placeholder via
   `PATCH /api/rest/projects/{id}/versions/{vid}`:
   - Renames to the release name
   - Sets `released: true`
   - Sets release date to today
4. **Create Version** - Creates new placeholder via
   `POST /api/rest/projects/{id}/versions`:
   - Uses the placeholder name
   - Sets `released: false`
   - Sets target date to now + specified days

## Troubleshooting

### Common Issues

**`Project not found`**
: Project name doesn't match. Verify exact name (case-sensitive).

**`Version not found`**
: Placeholder doesn't exist. Create the placeholder in MantisHub first.

**`401 Unauthorized`**
: Invalid or expired API key. Generate a new API token in MantisHub.

**`403 Forbidden`**
: Insufficient permissions. Check API token has version management access.

### Debug Mode

Enable debug logging by setting the `ACTIONS_STEP_DEBUG` secret to `true` in
your repository.

## Requirements

- Node.js 20 (handled automatically by GitHub Actions)
- MantisHub instance with REST API access

## Related Resources

- [MantisHub](https://www.mantishub.com) - Cloud-hosted bug tracking
- [MantisHub API Documentation](https://www.mantishub.com/docs) - REST API
  reference
- [GitHub Actions Documentation](https://docs.github.com/en/actions) - Learn
  more about GitHub Actions

## License

This project is licensed under the [MIT License](LICENSE).

## Support

For issues and feature requests, please
[open an issue](https://github.com/mantishub/action-rotate-version/issues)
on GitHub.
