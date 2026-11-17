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

The build emits `updates.json` with the current `version`, `installerUrl`,
`releaseUrl` and `minecraftVersions` derived from the same release data. Alpha.3
uses `https://hrajtymc.github.io/HrajtyMC/updates.json` by default, offers a manual
download for compatible updates, and preserves custom feeds or disabled checks.
Original alpha.2 installations need a manual upgrade; see the public Updating
guide. The installer's version catalog reads GitHub releases and their attached
`hrajtymc-release.json` manifests independently of the website deployment.

The alpha.4 gameplay guide covers events, commands, world/player records,
networking and item-use behavior. Public SDK source is limited to the mod template
and the Ruby example; the loader and installer implementations remain private.

The Gameplay navigation group also provides focused food/durability, item-use,
event, command, persistence and networking tutorials. The API reference covers
all 32 public API types. Complete tutorial classes compile with the public API
JAR only, and JSON snippets are checked during documentation review.

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
