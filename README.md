# MantisHub Rotate Version GitHub Action

One pattern is to always have the upcoming release be named "vNext" and renaming such release
to the appropriate name when the version is released and then creating a new "vNext".
This approach provides a version to associate issues with that are either targeted or fixed in
the upcoming release.

The github rotate version action does the following:

1. Marks current "vNext" version as released with release date of now.
2. Renames "vNext" to the specified release name.
3. Creates a new "vNext" that is marked as not released with release date N days in the future.

## Usage

Following is a sample workflow that leverages this action:

```yaml
name: "MantisHub Example Workflow"

on:
  workflow_dispatch:

jobs:
  rotate-version:
    runs-on: ubuntu-latest
    steps:
      - name: Check out code
        uses: actions/checkout@v4
        with:
          repository: mantishub/action-rotate-version
      - name: Rotate Version Action
        id: rotate-version
        uses: mantishub/action-rotate-version@v1
        with:
          url: https://example.mantishub.io
          api-key: ${{ secrets.API_KEY }}
          project: 'MyProject'
          placeholder-name: 'vNext'
          release-name: ${{ inputs.TAG_NAME }}
          next-release-in-days: 7
      - name: Get new version id 
        run: echo  ${{ steps.rotate-version.outputs.version-id }}
```

This will do the following:

- Rename `vNext` to `{{tag-name}}` and mark it as released by setting `released = true` and `release-date = now`
- Create a new `vNext` release with `release-date` of `now + 7` days and `released = false` and `obsolete = false`.
- Echo the id of the created version
