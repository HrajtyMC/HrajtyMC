import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import hljs from 'highlight.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
export const base = '/' + (process.env.BASE_PATH || 'HrajtyMC').replace(/^\/+|\/+$/g, '') + '/';
const origin = 'https://hrajtymc.github.io';
const release = JSON.parse(await fs.readFile(path.join(root, 'data/release.json'), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = value => base + value.replace(/^\/+/, '');
const asset = value => url('assets/' + value);
const download = id => release.downloads.find(item => item.id === id);
const icon = (name, size = 20) => {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-16-2 20"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    external: '<path d="M14 3h7v7m0-7L11 13M9 3H3v18h18v-6"/>',
    book: '<path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>'
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
};
const nav = [
  ['Start here', [['overview', 'Introduction'], ['installation', 'Installation'], ['server', 'Dedicated server']]],
  ['Create a mod', [['first-mod', 'Your first mod'], ['project-structure', 'Project structure'], ['items-and-blocks', 'Items & blocks'], ['json-recipes', 'JSON recipes'], ['mod-metadata', 'Mod metadata']]],
  ['Reference', [['api-reference', 'API reference'], ['updating', 'Updating'], ['troubleshooting', 'Troubleshooting']]]
];
const searchEntries = [];

function header(active, docs = false) {
  return `<header class="site-header"><div class="header-inner">
    <a class="brand" href="${base}" aria-label="HrajtyMC home"><img src="${asset('brand/logo.svg')}" alt="" width="30" height="30"><span>Hrajty<span class="brand-mc">MC</span></span></a>
    <div class="header-tools"><button type="button" class="search-trigger ${docs ? 'wide-search' : ''}" data-search-button aria-label="Search documentation">${icon('search', 18)}<span>Search docs</span><kbd>Ctrl K</kbd></button>
    <nav class="top-nav" aria-label="Main navigation"><a ${active === 'docs' ? 'aria-current="page"' : ''} href="${url('docs/overview/')}">Docs</a><a ${active === 'changelog' ? 'aria-current="page"' : ''} href="${url('changelog/')}">Changelog</a><a class="github-link" href="https://github.com/HrajtyMC/HrajtyMC" target="_blank" rel="noreferrer">GitHub ${icon('external', 13)}</a></nav>
    <button type="button" class="icon-button theme-toggle" data-theme-toggle aria-label="Switch color theme">${icon('sun')}</button>
    <a class="button button-small" ${active === 'download' ? 'aria-current="page"' : ''} href="${url('download/')}">Download ${icon('download', 15)}</a>
    ${docs ? `<button type="button" class="icon-button mobile-docs-toggle" data-sidebar-toggle aria-label="Open documentation menu" aria-controls="docs-sidebar" aria-expanded="false">${icon('menu')}</button>` : ''}
    </div></div></header>`;
}
function footer() {
  return `<footer class="site-footer"><div class="footer-inner"><div><a class="brand" href="${base}"><img src="${asset('brand/logo.svg')}" alt="" width="24" height="24"><span>HrajtyMC</span></a><p>An independent mod loader.<br>Made by Hrajto Studio.</p></div><div class="footer-links"><a href="${url('download/')}">Downloads</a><a href="${url('docs/overview/')}">Documentation</a><a href="https://github.com/HrajtyMC/HrajtyMC">GitHub</a></div><div class="footer-fine"><p>© ${new Date().getUTCFullYear()} Hrajto Studio</p><p>Not an official Minecraft product.<br>Not approved by or associated with Mojang or Microsoft.</p></div></div></footer>`;
}
function searchDialog() {
  return `<dialog class="search-dialog" id="site-search" aria-labelledby="search-title"><div class="search-dialog-header">${icon('search')}<label class="sr-only" id="search-title" for="search-input">Search documentation</label><input id="search-input" type="search" placeholder="Search the documentation…" autocomplete="off" spellcheck="false"><button type="button" class="search-close" data-search-close aria-label="Close search"><kbd>Esc</kbd></button></div><div id="search-results" class="search-results" aria-live="polite"><p class="search-hint">Find guides, recipes, API types, and answers.</p></div><div class="search-dialog-footer"><span>HrajtyMC documentation</span><span><kbd>↑</kbd><kbd>↓</kbd> navigate <kbd>Enter</kbd> open</span></div></dialog>`;
}
function shell({ title, description, route, active = '', body, docs = false, noindex = false }) {
  const canonical = origin + url(route);
  return `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title === 'HrajtyMC' ? title + ' — Make Minecraft your own' : title + ' — HrajtyMC')}</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#13cd14"><link rel="canonical" href="${canonical}">${noindex ? '<meta name="robots" content="noindex">' : ''}<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin + asset('brand/og-card.png')}"><link rel="icon" type="image/svg+xml" href="${asset('brand/favicon.svg')}"><script src="${asset('theme-init.js')}"></script><link rel="stylesheet" href="${asset('site.css')}"><script type="module" src="${asset('site.js')}"></script></head><body class="${docs ? 'docs-page' : 'marketing-page'}" data-base="${base}"><a class="skip-link" href="#main-content">Skip to content</a>${header(active, docs)}${body}${docs ? '' : footer()}${searchDialog()}</body></html>`;
}
async function write(route, content) {
  const file = path.join(out, route);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}
function codeBlock(code, language = 'json', caption = '') {
  const rendered = hljs.getLanguage(language) ? hljs.highlight(code, { language }).value : esc(code);
  return `<div class="code-block"><div class="code-bar"><span>${esc(caption || language)}</span><button type="button" class="copy-button" data-copy aria-label="Copy code">Copy</button></div><pre><code class="hljs language-${esc(language)}">${rendered}</code></pre></div>`;
}
const rubyRecipe = `{
  "format": 1,
  "crafting": {
    "layout": ["RRR", "RRR", "RRR"],
    "using": { "R": "ruby:ruby" }
  },
  "output": {
    "item": "ruby:ruby_block",
    "count": 1
  }
}`;

function home() {
  const ruby = `<img src="${asset('ruby/ruby.png')}" alt="" width="32" height="32">`;
  return shell({ title: 'HrajtyMC', description: 'An independent Minecraft mod loader with a straightforward Java API and JSON recipes. Download HrajtyMC or build your first mod.', route: '', body: `
    <main id="main-content"><section class="hero"><div class="hero-grid container"><div class="hero-copy"><a class="release-pill" href="${url('changelog/')}"><span class="status-dot"></span>Meet HrajtyMC <span class="pill-version">${esc(release.version)}</span>${icon('arrow', 14)}</a>
    <h1>Make Minecraft<br><span>your own.</span></h1><p class="hero-lead">A new mod loader. A straightforward Java API.<br class="desktop-break"> A little more room for your ideas.</p><div class="hero-actions"><a class="button button-large" href="${url('download/')}">${icon('download')}Download HrajtyMC</a><a class="text-button" href="${url('docs/first-mod/')}">Build your first mod ${icon('arrow')}</a></div><div class="hero-platforms"><span>${icon('check', 15)}Minecraft ${esc(release.minecraft)}</span><span>Windows</span><span>Java ${release.java}</span></div></div>
    <div class="hero-art"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><img class="voxel-scene" src="${asset('brand/voxel-hero.svg')}" alt="An original isometric scene of green blocks and a ruby crystal" width="840" height="720" fetchpriority="high"><div class="art-label label-top"><span class="status-dot"></span>Built for your next idea</div><div class="art-label label-bottom">${icon('code', 16)}Java API <span>+</span> JSON recipes</div></div></div></section>
    <div class="release-strip"><div class="container"><span class="strip-caption">THE FIRST CHAPTER</span><p>A small foundation. Something worth building on.</p><a href="${url('changelog/')}">See what’s new ${icon('arrow', 17)}</a></div></div>
    <section class="section container getting-started"><div class="section-heading"><div><span class="eyebrow">FROM DOWNLOAD TO YOUR WORLD</span><h2>Three steps.<br>Then it’s your turn.</h2></div><p>You bring the curiosity.<br>We’ll help with the setup.</p></div><div class="steps"><article class="step"><span class="step-number">01</span><h3>Get the loader</h3><p>Download the installer for Minecraft ${esc(release.minecraft)}. You’ll need Java ${release.java} to run it.</p><a class="inline-link" href="${url('download/')}">Find your download ${icon('arrow', 16)}</a></article><article class="step"><span class="step-number">02</span><h3>Make yourself at home</h3><p>Choose Client or Server. The installer prepares your files and can add a profile to the Minecraft Launcher.</p><a class="inline-link" href="${url('docs/installation/')}">Follow the installation guide ${icon('arrow', 16)}</a></article><article class="step"><span class="step-number">03</span><h3>Add a little possibility</h3><p>Drop HrajtyMC mod JARs into your instance’s mods folder. Try the Ruby Example to see it in action.</p><a class="inline-link" href="${url('docs/overview/')}">Explore HrajtyMC ${icon('arrow', 16)}</a></article></div></section>
    <section class="recipe-section"><div class="container recipe-layout"><div class="recipe-copy"><span class="eyebrow">LESS CEREMONY. MORE CREATING.</span><h2>Good ideas start<br>with small files.</h2><p>Keep your items and blocks in Java. Give their crafting recipes a home in JSON.</p><p class="muted">HrajtyMC reads your own recipe format, checks it, and makes it available to the game. No recipe-registration boilerplate required.</p><a class="inline-link" href="${url('docs/json-recipes/')}">Explore JSON recipes ${icon('arrow', 17)}</a><div class="crafting-demo" aria-label="Nine rubies craft one ruby block"><div class="craft-grid">${Array.from({ length: 9 }, () => `<span>${ruby}</span>`).join('')}</div>${icon('arrow', 24)}<div class="craft-result"><img src="${asset('ruby/ruby_block.png')}" alt="Ruby Block texture" width="58" height="58"><span>Ruby Block</span></div></div></div><div class="recipe-editor"><div class="editor-top"><span class="editor-dots"><i></i><i></i><i></i></span><span>hrajtymc / recipes / ruby_block.json</span><span class="editor-language">JSON</span></div>${codeBlock(rubyRecipe, 'json', 'ruby_block.json')}<div class="editor-footer"><span class="status-dot"></span>One recipe. A whole new building block.</div></div></div></section>
    <section class="section container choose-path"><div class="section-heading"><div><span class="eyebrow">MAKE YOUR NEXT MOVE</span><h2>Play a little.<br>Or build something new.</h2></div></div><div class="path-grid"><a class="path-card" href="${url('docs/installation/')}"><span class="path-icon">${icon('download', 27)}</span><div><span class="eyebrow">FOR PLAYERS</span><h3>A place to start.</h3><p>Install HrajtyMC, add your mods, and get comfortable with your new setup.</p></div><span class="path-arrow">${icon('arrow', 24)}</span></a><a class="path-card path-card-green" href="${url('docs/first-mod/')}"><span class="path-icon">${icon('code', 27)}</span><div><span class="eyebrow">FOR CREATORS</span><h3>Your first “I made that.”</h3><p>Start with the SDK. Register an item, add a block, and write your first recipe.</p></div><span class="path-arrow">${icon('arrow', 24)}</span></a></div></section>
    <section class="final-cta container"><div><span class="eyebrow">YOUR IDEAS BELONG HERE</span><h2>Let’s make something.</h2><p>HrajtyMC is in early alpha. Start small, explore, and help shape what comes next.</p></div><a class="button button-large" href="${url('download/')}">Get HrajtyMC ${icon('download', 19)}</a></section></main>` });
}
function humanSize(bytes) { return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.round(bytes / 1024) + ' KB'; }
function downloadPage() {
  const installer = download('installer');
  return shell({ title: 'Download', description: `Download HrajtyMC ${release.version} for Minecraft ${release.minecraft}, plus the Ruby Example and public mod development SDK.`, route: 'download/', active: 'download', body: `<main id="main-content" class="container download-main"><div class="page-intro"><span class="eyebrow">YOUR NEXT WORLD STARTS HERE</span><h1>Get HrajtyMC<span class="green-dot">.</span></h1><p>A small download. A new place for your ideas.</p></div><section class="download-feature" aria-labelledby="installer-heading"><div class="download-feature-copy"><span class="release-pill"><span class="status-dot"></span>EARLY ALPHA <strong>${esc(release.version)}</strong></span><h2 id="installer-heading">HrajtyMC Installer</h2><p>One installer for your Minecraft client and dedicated server. Choose your folder, choose your mode, and make yourself at home.</p><div class="requirement-list"><span>Minecraft <strong>${esc(release.minecraft)}</strong></span><span>Java <strong>${release.java}</strong></span><span><strong>Windows</strong></span></div><a class="button button-large" data-download="installer" href="${installer.url}">${icon('download')}Download installer <span class="download-size">${humanSize(installer.size)}</span></a><p class="download-filename">${esc(installer.filename)}</p><a class="inline-link" href="${url('docs/installation/')}">Need a hand? Read the install guide ${icon('arrow', 16)}</a></div><div class="installer-visual"><img src="${asset('brand/logo.svg')}" width="70" height="70" alt="HrajtyMC logo"><h3>HrajtyMC Installer</h3><div class="mock-tabs"><span class="selected">Client</span><span>Server</span></div><div class="mock-field"><span>Minecraft</span><strong>${esc(release.minecraft)}</strong></div><div class="mock-field"><span>Loader</span><strong>${esc(release.version)}</strong></div><div class="mock-check">${icon('check', 15)}Create launcher profile</div><div class="mock-install">Install</div><p>Simplified installer preview</p></div></section>
    <div class="alpha-note"><strong>A quick note about alpha.</strong><p>HrajtyMC is an early development release for Minecraft ${esc(release.minecraft)} on Windows. Keep a backup of worlds you care about and try it in a separate instance first. HrajtyMC uses its own mod format.</p></div><section class="download-extras" aria-labelledby="more-downloads"><div class="section-heading"><div><span class="eyebrow">BRING A LITTLE EXTRA</span><h2 id="more-downloads">Try it. Build with it.</h2></div></div><div class="download-list">${[['ruby', 'Ruby Example', 'A ruby, a Ruby Block, and two reversible crafting recipes. Install on client and server.'], ['sdk', 'Mod Development SDK', 'The public API JAR, a Java mod template, and English documentation. A Java 25 JDK is required.'], ['api', 'Standalone API', 'The public API library for your own development setup. Included in the SDK.'], ['loader', 'Loader runtime', 'The standalone Java-agent runtime for advanced setups. Most players should use the installer.']].map(([id, title, text]) => { const d = download(id); return `<article class="download-row"><div class="download-row-icon">${icon(id === 'ruby' ? 'book' : 'code', 24)}</div><div><h3>${title}</h3><p>${text}</p><span class="file-meta">${esc(d.filename)} · ${humanSize(d.size)}</span></div><a class="button button-secondary" data-download="${id}" href="${d.url}" aria-label="Download ${title}">Download ${icon('download', 16)}</a></article>`; }).join('')}</div><div class="download-links"><a href="${release.checksumsUrl}">SHA-256 checksums ${icon('external', 14)}</a><a href="${url('changelog/')}">Release notes ${icon('arrow', 14)}</a><a href="https://github.com/HrajtyMC/HrajtyMC/releases">All GitHub releases ${icon('external', 14)}</a></div></section></main>` });
}
function changelogPage() {
  return shell({ title: 'Changelog', description: 'Follow HrajtyMC releases, fixes, and changes.', route: 'changelog/', active: 'changelog', body: `<main id="main-content" class="container narrow-page"><div class="page-intro"><span class="eyebrow">BUILT ONE STEP AT A TIME</span><h1>What’s new<span class="green-dot">.</span></h1><p>The small changes that move HrajtyMC forward.</p></div><article class="release-entry"><div class="release-entry-meta"><span class="release-pill"><span class="status-dot"></span>Latest alpha</span><time datetime="2026-11-17">November 17, 2026</time></div><h2>${esc(release.version)}</h2><p class="release-summary">JSON recipes, a smoother start, and a little more HrajtyMC in your launcher.</p><h3>New</h3><ul><li>Write recipes in <code>hrajtymc/recipes/*.json</code> using HrajtyMC’s own format.</li><li>Discover recipes in the recipe book when you obtain an ingredient.</li><li>Your launcher profile now gets the green-and-white HrajtyMC logo, including when upgrading an existing profile.</li></ul><h3>Fixed</h3><ul><li>Mod data packs are now available during the initial Create World data load, so the game finds and crafts the Ruby recipes.</li><li>The Ruby Example now declares its two recipes in JSON.</li></ul><h3>For developers</h3><p>Java recipe registration remains compatible. The current JSON format supports shaped and shapeless crafting with exact item IDs. Read the <a href="${url('docs/json-recipes/')}">JSON recipe guide</a> to get started.</p><div class="release-actions"><a class="button" href="${url('download/')}">Download this release ${icon('download', 16)}</a><a class="inline-link" href="https://github.com/HrajtyMC/HrajtyMC/releases/tag/${release.tag}">View on GitHub ${icon('external', 14)}</a></div></article></main>` });
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const meta = {};
  if (!match) throw new Error('Documentation requires title/description frontmatter');
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator > -1) meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return { meta, markdown: text.slice(match[0].length) };
}
function sidebar(current) {
  return `<aside class="docs-sidebar" id="docs-sidebar" aria-label="Documentation navigation"><a class="docs-home" href="${url('docs/overview/')}">${icon('book', 19)}Documentation<span class="version-label">α2</span></a><nav>${nav.map(([section, pages]) => `<div class="sidebar-group"><h2>${section}</h2>${pages.map(([slug, title]) => `<a ${current === slug ? 'aria-current="page"' : ''} href="${url('docs/' + slug + '/')}">${title}</a>`).join('')}</div>`).join('')}</nav><div class="sidebar-bottom"><span>Minecraft ${esc(release.minecraft)}</span><span>Java ${release.java} · Windows</span><a href="${url('download/')}">Get the latest alpha ${icon('arrow', 14)}</a></div></aside>`;
}
async function documentation() {
  const ordered = nav.flatMap(([, pages]) => pages);
  for (let index = 0; index < ordered.length; index++) {
    const [slug, fallbackTitle] = ordered[index];
    const source = await fs.readFile(path.join(root, 'content/docs', slug + '.md'), 'utf8');
    const { meta, markdown } = parseFrontmatter(source);
    const title = meta.title || fallbackTitle;
    const headings = [], usedIds = new Map();
    const renderer = {
      heading({ tokens, depth, text }) {
        const plain = text.replace(/[`*_]/g, '').replace(/<[^>]+>/g, '');
        const key = plain.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
        const count = usedIds.get(key) || 0; usedIds.set(key, count + 1);
        const id = key + (count ? '-' + count : '');
        if (depth === 2 || depth === 3) headings.push({ depth, id, text: plain });
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}<a class="heading-anchor" href="#${id}" aria-label="Link to ${esc(plain)}">#</a></h${depth}>`;
      },
      code({ text, lang }) { return codeBlock(text, (lang || 'text').split(/\s/)[0]); }
    };
    const parser = new Marked({ gfm: true, renderer });
    let html = parser.parse(markdown);
    html = html.replaceAll('href="/HrajtyMC/', `href="${base}`);
    const previous = ordered[index - 1], next = ordered[index + 1];
    const toc = headings.length ? `<aside class="docs-toc" aria-label="On this page"><span>On this page</span><nav>${headings.map(h => `<a class="toc-depth-${h.depth}" href="#${h.id}">${esc(h.text)}</a>`).join('')}</nav><a class="toc-edit" href="https://github.com/HrajtyMC/HrajtyMC/edit/main/content/docs/${slug}.md">Edit this page ${icon('external', 13)}</a></aside>` : '';
    const body = `<div class="docs-shell">${sidebar(slug)}<div class="sidebar-backdrop" data-sidebar-close></div><main class="docs-main" id="main-content"><div class="doc-breadcrumb"><a href="${url('docs/overview/')}">Docs</a><span>/</span><span>${esc(meta.section || 'Guide')}</span></div><article class="prose"><h1>${esc(title)}</h1><p class="doc-description">${esc(meta.description || '')}</p>${html}</article><nav class="doc-pagination" aria-label="Previous and next documentation pages">${previous ? `<a href="${url('docs/' + previous[0] + '/')}"><span>← Previous</span><strong>${previous[1]}</strong></a>` : '<span></span>'}${next ? `<a class="next" href="${url('docs/' + next[0] + '/')}"><span>Next →</span><strong>${next[1]}</strong></a>` : '<span></span>'}</nav><div class="doc-footnote">HrajtyMC ${esc(release.version)} · Hrajto Studio</div></main>${toc}</div>`;
    await write(`docs/${slug}/index.html`, shell({ title, description: meta.description || title, route: `docs/${slug}/`, active: 'docs', body, docs: true }));
    searchEntries.push({ title, url: url(`docs/${slug}/`), section: meta.section || 'Documentation', text: (meta.description + ' ' + markdown).replace(/```[\s\S]*?```/g, ' ').replace(/[#*`\[\]()]/g, ' ').replace(/\s+/g, ' ').slice(0, 12000) });
  }
}

// All generated files stay in this project's build directory.
if (path.dirname(out) !== root || path.basename(out) !== 'dist') throw new Error('Unsafe build output');
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });
await fs.cp(path.join(root, 'public'), out, { recursive: true });
await write('index.html', home());
await write('download/index.html', downloadPage());
await write('changelog/index.html', changelogPage());
await documentation();
await write('docs/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${url('docs/overview/')}"><title>HrajtyMC Docs</title><link rel="canonical" href="${origin + url('docs/overview/')}"></head><body><a href="${url('docs/overview/')}">Open HrajtyMC documentation</a></body></html>`);
await write('404.html', shell({ title: 'Page not found', description: 'This HrajtyMC page could not be found.', route: '404.html', noindex: true, body: `<main id="main-content" class="container error-page"><span class="eyebrow">404 · A BLOCK OUT OF PLACE</span><h1>Let’s get you<br>back on track.</h1><p>This page may have moved, or the link needs another look.</p><div class="hero-actions"><a class="button" href="${base}">Back to home ${icon('arrow')}</a><a class="text-button" href="${url('docs/overview/')}">Read the docs</a></div></main>` }));
await write('search-index.json', JSON.stringify(searchEntries));
await write('release.json', JSON.stringify(release, null, 2));
await write('updates.json', JSON.stringify({ version: release.version }, null, 2));
await write('.nojekyll', '');
const routes = ['', 'download/', 'changelog/', ...nav.flatMap(([, pages]) => pages.map(([slug]) => `docs/${slug}/`))];
await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route => `<url><loc>${origin + url(route)}</loc></url>`).join('')}</urlset>`);
console.log(`Built ${routes.length} pages for ${origin + base}`);
