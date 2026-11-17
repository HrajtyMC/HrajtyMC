# HrajtyMC website

The public website and documentation for **HrajtyMC**, by **Hrajto Studio**.

Live site: **https://hrajtymc.github.io/HrajtyMC/**

This repository contains the website, public user/developer documentation, and
release metadata. Compiled HrajtyMC packages are distributed through
[GitHub Releases](https://github.com/HrajtyMC/HrajtyMC/releases). The loader's
implementation source is maintained separately and is not part of this repository.

## Work on the site

Use Node.js 24 or newer:

```sh
npm ci
npm run build
npm test
npm run dev
```

The preview starts at `http://127.0.0.1:4173/HrajtyMC/`. Set `PORT` to use another
port. Build output is generated in `dist/` and is not committed.

## Edit documentation

Edit Markdown files in `content/docs/`. Each page begins with `title`,
`description`, and `section` frontmatter. Use H2/H3 headings in the body; the page
H1 comes from the title. Code fences get highlighting and copy buttons.

The navigation order is in `scripts/build.mjs`. Links between documentation pages
use `../page-slug/`. Search is built locally from these pages and needs no external
service. Add original public assets under `public/assets/`.

## Releases and update notifications

`data/release.json` defines the current version and the five public binary
downloads, with sizes and SHA-256 hashes. Update it only after checking the
intended release files. Upload compiled packages as GitHub Release assets rather
than committing JARs or SDK ZIPs to the site source.

The build emits `updates.json` as `{ "version": "0.1.0-alpha.2" }`. HrajtyMC can
use `https://hrajtymc.github.io/HrajtyMC/updates.json` for notification-only update
checks when a user configures that URL. Existing alpha.2 installs do not silently
gain a feed URL; see the public Updating guide.

## Deployment

GitHub Actions builds, checks, and deploys `main` to GitHub Pages. The workflow
publishes only `dist/`; it does not publish a parent directory or private project.
Actions are pinned to exact upstream commits. No deployment token is stored in
this repository: Pages uses the workflow's short-lived GitHub token.

## Ownership

Copyright 2026 Hrajto Studio. Original branding and illustration assets are
described in their asset-folder READMEs. This website uses marked and highlight.js;
their respective upstream licenses apply. HrajtyMC is not an official Minecraft
product and is not approved by or associated with Mojang or Microsoft.
