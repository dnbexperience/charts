# Eufemia Charts

Chart integrations and the gallery are being prepared in a separate pull request.
This initial setup enables GitHub Pages and pull request previews before the
gallery lands.

## Pull request previews

CI uploads the static site as a `gallery-pages` artifact. The trusted Pages
workflow on `main` deploys successful builds for open pull requests from this
repository at their current revision. Preview links appear as GitHub deployments
at `https://dnbexperience.github.io/charts/previews/pr-N/`. Closing a pull request
removes its preview on the next deployment.

Until the gallery is added, Pages serves a small placeholder. The gallery must
build to `.pages` with relative asset paths and keep the `gallery-pages` artifact
name. Once its package manifest exists, Pages runs `yarn build` and
`yarn site:build` with the locked dependencies instead of copying the placeholder.

Merge this infrastructure first, then update the gallery pull request to trigger
CI and its preview deployment. GitHub only starts the trusted Pages workflow once
it exists on the default branch. This setup does not publish an npm package.

## Validate

Use the Node.js version in `.node-version`:

```sh
node --test tests/*.test.ts
```

The preview tests use only Node.js built-ins and need no dependency installation.
