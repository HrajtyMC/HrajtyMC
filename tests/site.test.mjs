import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = join(siteRoot, 'dist');
const origin = 'https://hrajtymc.github.io';
const basePath = `/${(process.env.BASE_PATH ?? '/HrajtyMC/').replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');
const sourceRelease = JSON.parse(await readFile(join(siteRoot, 'data/release.json'), 'utf8'));
const version = sourceRelease.version;
const tag = `v${version}`;
const releaseBase = `https://github.com/${sourceRelease.repository}/releases/download/${tag}/`;
const expectedAssets = new Map([
  ['installer', `HrajtyMC-Installer-${version}.jar`],
  ['ruby', 'ruby-example-1.1.0.jar'],
  ['sdk', 'HrajtyMC-Mod-SDK.zip'],
  ['api', 'hrajtymc-api.jar'],
  ['loader', 'hrajtymc-loader.jar'],
]);
const documents = new Map();

function slash(path) { return path.split(sep).join('/'); }
function decode(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const numeric = entity.slice(2, -1);
    return String.fromCodePoint(numeric[0].toLowerCase() === 'x' ? parseInt(numeric.slice(1), 16) : parseInt(numeric, 10));
  });
}
function attributes(tagText) {
  const result = new Map();
  const opening = tagText.slice(0, tagText.indexOf('>') + 1);
  for (const match of opening.matchAll(/\s([a-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    result.set(match[1].toLowerCase(), decode(match[2] ?? match[3]));
  }
  return result;
}
function textContent(html) { return decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim(); }
async function exists(path) { try { await access(path); return true; } catch { return false; } }
async function walk(root, skipped = new Set()) {
  const paths = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const path = join(root, entry.name);
    assert.ok(!entry.isSymbolicLink(), `Published files must not be symbolic links: ${path}`);
    if (entry.isDirectory()) paths.push(...await walk(path, skipped));
    else if (entry.isFile()) paths.push(path);
  }
  return paths;
}
async function htmlDocument(path) {
  if (!documents.has(path)) {
    const html = await readFile(path, 'utf8');
    const ids = new Set();
    for (const match of html.matchAll(/<[a-z][^>]*>/gi)) {
      const id = attributes(match[0]).get('id');
      if (!id) continue;
      assert.ok(!ids.has(id), `Duplicate id ${id} in ${relative(outputRoot, path)}`);
      ids.add(id);
    }
    documents.set(path, { html, ids });
  }
  return documents.get(path);
}
function pageUrl(path) {
  return new URL(basePath + slash(relative(outputRoot, path)).replace(/index\.html$/, ''), origin);
}
async function checkReference(value, from, { fragment = false, allowImageData = false } = {}) {
  assert.ok(value.trim(), `Empty reference in ${relative(outputRoot, from)}`);
  assert.ok(!value.startsWith('#') || value.length > 1, `Placeholder # link in ${relative(outputRoot, from)}`);
  assert.ok(!/^(?:javascript|vbscript):/i.test(value), `Executable URL in ${relative(outputRoot, from)}`);
  if (/^data:/i.test(value)) {
    assert.ok(allowImageData && /^data:image\//i.test(value), `Unexpected data URL in ${relative(outputRoot, from)}`);
    return;
  }
  const target = new URL(value, pageUrl(from));
  if (target.origin !== origin) {
    assert.ok(['https:', 'mailto:', 'tel:'].includes(target.protocol), `Unsupported public link ${target.href}`);
    assert.ok(!/HrajtyMC-Installer-0\.1\.0-alpha\.1\.jar/i.test(target.href), `Old installer download: ${target.href}`);
    return;
  }
  assert.ok(target.pathname.startsWith(basePath), `Internal URL escaped project base ${basePath}: ${value} in ${relative(outputRoot, from)}`);
  const targetPath = decodeURIComponent(target.pathname.slice(basePath.length));
  let local = resolve(outputRoot, targetPath || '.');
  const localRelative = relative(outputRoot, local);
  assert.ok(!isAbsolute(localRelative) && localRelative !== '..' && !localRelative.startsWith(`..${sep}`), `Unsafe internal path: ${value}`);
  assert.ok(await exists(local), `Broken internal reference ${value} in ${relative(outputRoot, from)}`);
  if ((await stat(local)).isDirectory()) local = join(local, 'index.html');
  assert.ok(await exists(local), `Missing page index for ${value}`);
  if (fragment && target.hash && extname(local) === '.html') {
    const id = decodeURIComponent(target.hash.slice(1));
    assert.ok((await htmlDocument(local)).ids.has(id), `Broken fragment ${value} in ${relative(outputRoot, from)}`);
  }
}
async function releaseMetadata() { return JSON.parse(await readFile(join(outputRoot, 'release.json'), 'utf8')); }

test('build includes the public routes, docs, and machine-readable discovery files', async () => {
  for (const path of ['index.html', 'download/index.html', 'changelog/index.html', 'search-index.json', 'release.json', 'updates.json']) {
    assert.ok(await exists(join(outputRoot, path)), `Missing generated ${path}; run npm run build first`);
  }
  const docPages = (await walk(join(outputRoot, 'docs'))).filter(path => path.endsWith('index.html'));
  assert.ok(docPages.length >= 11, `Expected the complete documentation, found ${docPages.length} pages`);
});

test('every generated page has usable navigation, safe links, and working fragment targets', async () => {
  const htmlFiles = (await walk(outputRoot)).filter(path => path.endsWith('.html'));
  assert.ok(htmlFiles.length >= 14, 'Expected home, download, changelog, and documentation pages');
  for (const path of htmlFiles) {
    const { html } = await htmlDocument(path);
    assert.match(html, /<html\b[^>]*\blang=["']en["']/i, `English document language missing: ${path}`);
    assert.match(html, /<title>[^<]+<\/title>/i, `Page title missing: ${path}`);
    const redirect = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]))
      .find(attrs => attrs.get('http-equiv')?.toLowerCase() === 'refresh');
    if (redirect) {
      assert.equal(slash(relative(outputRoot, path)), 'docs/index.html', 'Only the documentation root is an intentional redirect page');
      const target = redirect.get('content')?.match(/^\s*0\s*;\s*url\s*=\s*(\S+)\s*$/i)?.[1];
      assert.ok(target, 'Documentation redirect must specify an immediate destination');
      await checkReference(target, path, { fragment: true });
      const destination = new URL(target, pageUrl(path)).href;
      assert.notEqual(destination, pageUrl(path).href, 'Documentation redirect must not loop to itself');
      assert.ok([...html.matchAll(/<a\b[^>]*>/gi)].some(match => {
        const href = attributes(match[0]).get('href');
        return href && new URL(href, pageUrl(path)).href === destination;
      }), 'Documentation redirect needs a working fallback link to the same destination');
      assert.ok([...html.matchAll(/<link\b[^>]*>/gi)].some(match => {
        const attrs = attributes(match[0]);
        return attrs.get('rel') === 'canonical' && new URL(attrs.get('href'), pageUrl(path)).href === destination;
      }), 'Documentation redirect canonical must match its destination');
    } else {
      const navigation = html.match(/<(header|nav)\b[^>]*>([\s\S]*?)<\/\1>/i)?.[2];
      assert.ok(navigation, `No semantic navigation in ${relative(outputRoot, path)}`);
      assert.ok([...navigation.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].some(match => /\bdownloads?\b/i.test(textContent(match[1]))
        && /\/downloads?\/?(?:[?#]|$)/.test(attributes(match[0]).get('href') ?? '')), `Download navigation missing: ${relative(outputRoot, path)}`);
    }
    assert.ok(!/<[a-z][^>]*\son[a-z]+\s*=/i.test(html), `Inline event handler in ${relative(outputRoot, path)}`);
    for (const match of html.matchAll(/<([a-z][\w:-]*)\b[^>]*>/gi)) {
      const attrs = attributes(match[0]);
      for (const attribute of ['href', 'src', 'poster']) {
        if (attrs.has(attribute)) await checkReference(attrs.get(attribute), path, { fragment: match[1].toLowerCase() === 'a', allowImageData: ['img', 'source'].includes(match[1].toLowerCase()) });
      }
    }
  }
});

test('stylesheet asset URLs resolve beneath the Pages base path', async () => {
  for (const path of (await walk(outputRoot)).filter(path => path.endsWith('.css'))) {
    const css = await readFile(path, 'utf8');
    for (const match of css.matchAll(/url\(\s*(['"]?)([^'"()]+)\1\s*\)/gi)) {
      const value = match[2].trim();
      if (value.startsWith('data:') || value.startsWith('#')) continue;
      await checkReference(value, path, { allowImageData: true });
    }
  }
});

test('documentation code examples have native, accessible copy controls', async () => {
  let totalExamples = 0;
  for (const path of (await walk(join(outputRoot, 'docs'))).filter(path => path.endsWith('.html'))) {
    const { html } = await htmlDocument(path);
    const examples = [...html.matchAll(/<pre\b[^>]*>\s*<code\b/gi)].length;
    totalExamples += examples;
    const controls = [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)].filter(match => {
      const attrs = attributes(match[0]);
      return /\bcopy\b/i.test(attrs.get('aria-label') ?? textContent(match[1]));
    });
    assert.ok(controls.length >= examples, `Missing copy controls for code examples in ${relative(outputRoot, path)}`);
    for (const control of controls) assert.equal(attributes(control[0]).get('type'), 'button', `Copy control must be type=button in ${path}`);
  }
  assert.ok(totalExamples >= 5, 'Expected useful runnable documentation examples');
});

test('release metadata contains the versioned public binary downloads', async () => {
  const release = await releaseMetadata();
  assert.deepEqual(release, sourceRelease, 'Build output must reflect data/release.json; rebuild after updating release data');
  assert.equal(release.version, version);
  assert.equal(release.tag, tag);
  assert.equal(release.repository, 'HrajtyMC/HrajtyMC');
  assert.equal(String(release.minecraft), '26.3');
  assert.equal(Number(release.java), 25);
  assert.equal(release.platform, 'Windows');
  assert.ok(Array.isArray(release.downloads));
  assert.equal(release.downloads.length, expectedAssets.size);
  const ids = new Set();
  for (const asset of release.downloads) {
    assert.ok(expectedAssets.has(asset.id), `Unexpected public release asset: ${asset.id}`);
    assert.ok(!ids.has(asset.id), `Repeated asset ID: ${asset.id}`);
    ids.add(asset.id);
    assert.ok(typeof asset.name === 'string' && asset.name.trim(), `Asset name missing: ${asset.id}`);
    assert.equal(asset.filename, expectedAssets.get(asset.id));
    assert.equal(asset.url, releaseBase + encodeURIComponent(asset.filename));
    assert.match(asset.sha256, /^[a-f\d]{64}$/i, `Invalid SHA-256 for ${asset.id}`);
    assert.ok(Number.isSafeInteger(asset.size) && asset.size > 0 && asset.size < 1024 * 1024, `Invalid release size for ${asset.id}`);
  }
  assert.equal(release.checksumsUrl ?? release.checksumurl, releaseBase + 'SHA256SUMS.txt');
  const downloadPage = (await htmlDocument(join(outputRoot, 'download/index.html'))).html;
  for (const asset of release.downloads) assert.ok(downloadPage.includes(asset.url), `Download page does not offer ${asset.id}`);
});

test('the update feed announces exactly the public release and the search index links to real pages', async () => {
  const release = await releaseMetadata();
  const feed = JSON.parse(await readFile(join(outputRoot, 'updates.json'), 'utf8'));
  assert.deepEqual(feed, {
    version: release.version,
    installerUrl: release.downloads.find(asset => asset.id === 'installer').url,
    releaseUrl: release.releaseUrl || `https://github.com/${release.repository}/releases/tag/${release.tag}`,
    minecraftVersions: release.minecraftVersions || [String(release.minecraft)]
  }, 'Update discovery must expose the selected release, official installer, release page, and declared Minecraft compatibility');
  assert.match(feed.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/);
  assert.equal(feed.installerUrl, releaseBase + encodeURIComponent(expectedAssets.get('installer')));
  assert.equal(feed.releaseUrl, `https://github.com/HrajtyMC/HrajtyMC/releases/tag/${tag}`);
  assert.ok(Array.isArray(feed.minecraftVersions) && feed.minecraftVersions.length > 0, 'The update feed needs declared Minecraft versions');
  assert.ok(feed.minecraftVersions.every(value => typeof value === 'string' && value.trim()), 'Minecraft compatibility entries must be version strings');
  const index = JSON.parse(await readFile(join(outputRoot, 'search-index.json'), 'utf8'));
  const entries = Array.isArray(index) ? index : index.pages ?? index.documents;
  assert.ok(Array.isArray(entries) && entries.length >= 11, 'Documentation search index is empty or incomplete');
  for (const entry of entries) {
    assert.ok(typeof entry.title === 'string' && entry.title.trim(), 'Search entry has no title');
    const link = entry.url ?? entry.href ?? entry.path;
    assert.ok(typeof link === 'string' && link.trim(), `Search entry has no destination: ${entry.title}`);
    await checkReference(link, join(outputRoot, 'index.html'), { fragment: true });
  }
});

test('documentation version badges follow the configured release', async () => {
  const alpha = version.match(/-alpha\.(\d+)(?:[.+-]|$)/)?.[1];
  const expected = alpha ? `α${alpha}` : version;
  const pages = (await walk(join(outputRoot, 'docs'))).filter(path => path.endsWith('index.html') && slash(relative(join(outputRoot, 'docs'), path)) !== 'index.html');
  assert.ok(pages.length >= 11);
  for (const path of pages) {
    const { html } = await htmlDocument(path);
    const labels = [...html.matchAll(/<span\b[^>]*class="version-label"[^>]*>([\s\S]*?)<\/span>/g)];
    assert.equal(labels.length, 1, `One release badge is required in ${relative(outputRoot, path)}`);
    assert.equal(textContent(labels[0][1]), expected, `Outdated release badge in ${relative(outputRoot, path)}`);
  }
});

test('focused gameplay guides are in navigation, search and the overview', async () => {
  const guides = [
    ['food-and-durability', ['FoodDefinition', 'nutrition', 'saturationModifier', 'alwaysEdible', 'withDurability']],
    ['item-behaviors', ['UseContext', 'damageItem', 'consume', 'cooldown', 'UseResult']],
    ['events', ['onServerStarting', 'onServerStopped', 'onPlayerDeath', 'beforeBlockBreak', 'Subscription']],
    ['commands', ['CommandRegistry', 'permissionLevel', 'rawArguments', 'CommandSource']],
    ['persistent-data', ['DataView', 'getString', 'getLong', 'getDouble', 'getBoolean', 'UUID']],
    ['play-networking', ['ModNetwork', 'registerServerReceiver', 'registerClientReceiver', 'sendToServer', 'sendToPlayer']],
  ];
  const index = JSON.parse(await readFile(join(outputRoot, 'search-index.json'), 'utf8'));
  const { html: overview } = await htmlDocument(join(outputRoot, 'docs/overview/index.html'));
  const { html: combined } = await htmlDocument(join(outputRoot, 'docs/gameplay-api/index.html'));
  const { html: reference } = await htmlDocument(join(outputRoot, 'docs/api-reference/index.html'));
  for (const [slug, members] of guides) {
    const destination = `${basePath}docs/${slug}/`;
    const { html } = await htmlDocument(join(outputRoot, `docs/${slug}/index.html`));
    assert.ok(html.includes(`href="${destination}"`), `Guide missing from navigation: ${slug}`);
    assert.ok(overview.includes(`href="${destination}"`), `Guide missing from overview: ${slug}`);
    assert.ok(combined.includes(`href="${destination}"`), `Guide missing from gameplay overview: ${slug}`);
    assert.ok(reference.includes(`href="${destination}"`), `Guide missing from API reference: ${slug}`);
    assert.ok(index.some(entry => entry.url === destination && entry.section === 'Gameplay'), `Guide missing from gameplay search: ${slug}`);
    assert.ok(/public[\s\S]*?class/.test(textContent(html)), `Guide needs a complete Java example: ${slug}`);
    assert.ok(html.includes('schemaVersion'), `Guide needs metadata for its example: ${slug}`);
    for (const member of members) assert.ok(textContent(html).includes(member), `Missing ${member} in ${slug}`);
  }
});

test('changelog describes the configured release and retains published history', async () => {
  const { html } = await htmlDocument(join(outputRoot, 'changelog/index.html'));
  const currentHeading = html.match(/<article\b[^>]*class="release-entry"[^>]*>[\s\S]*?<h2>([\s\S]*?)<\/h2>/)?.[1];
  assert.equal(textContent(currentHeading ?? ''), version, 'The first changelog entry must match release metadata');
  if (version === '0.1.0-alpha.4') {
    for (const feature of ['cancellable block-break attempts', 'persistent', 'Brigadier', 'Ruby Example 1.1.0', 'login protocol 2'])
      assert.ok(textContent(html).includes(feature), `Alpha.4 changelog is missing ${feature}`);
    assert.ok(html.includes('<h2>0.1.0-alpha.3</h2>'), 'Published alpha.3 history must remain available');
    const { html: guide } = await htmlDocument(join(outputRoot, 'docs/gameplay-api/index.html'));
    for (const facade of ['context.events()', 'context.commands()', 'context.network()', 'context.data()', 'context.itemBehaviors()'])
      assert.ok(textContent(guide).includes(facade), `Gameplay guide is missing ${facade}`);
  } else if (version === '0.1.0-alpha.3') {
    for (const feature of ['GitHub release catalog', 'bundled version selected by default', 'Check for updates', 'official runtime update feed']) {
      assert.ok(textContent(html).includes(feature), `Alpha.3 changelog is missing ${feature}`);
    }
    assert.ok(html.includes('<h2>0.1.0-alpha.2</h2>'), 'Published alpha.2 history must remain available');
  } else if (version === '0.1.0-alpha.2') {
    assert.ok(!html.includes('<h2>0.1.0-alpha.3</h2>'), 'Do not announce an unreleased alpha.3 while release data still points to alpha.2');
  }
});

test('public site output and public repository source exclude private implementations and binaries', async () => {
  let sourcePaths;
  try {
    const gitRoot = execFileSync('git', ['-C', siteRoot, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (resolve(gitRoot).toLowerCase() === siteRoot.toLowerCase()) {
      sourcePaths = execFileSync('git', ['-C', siteRoot, 'ls-files', '-z'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean);
    }
  } catch { /* A preview can be built before the public Git repository is initialized. */ }
  const filesystemPaths = (await walk(siteRoot, new Set(['node_modules', 'dist', '.git', '.release-staging', '.preview']))).map(path => slash(relative(siteRoot, path)));
  sourcePaths = [...new Set([...(sourcePaths ?? []), ...filesystemPaths])];
  const outputPaths = (await walk(outputRoot)).map(path => slash(relative(outputRoot, path)));
  for (const path of [...sourcePaths, ...outputPaths]) {
    assert.ok(!/(?:^|\/)(?:loader|installer|minecraft)\/(?:src|test|build)(?:\/|$)/i.test(path), `Private implementation path in public tree: ${path}`);
    assert.ok(!/(?:^|\/)(?:\.codex|\.agents|\.aws|\.cache|\.release-staging|\.preview|node_modules|saves|world|libraries)(?:\/|$)/i.test(path), `Private workspace content in public tree: ${path}`);
    assert.ok(!/\.(?:jar|zip|class|jks|pem|key|log)$/i.test(path), `Binary or private file committed to the public website: ${path}`);
    assert.ok(!/(?:^|\/)\.env(?:\.|$)/i.test(path), `Environment file in public tree: ${path}`);
    if (path.endsWith('.java')) assert.match(path, /(?:^|\/)(?:examples?|mod-template)\/.*\/ExampleMod\.java$/, `Private Java source in website: ${path}`);
  }
});

function zipEntryNames(bytes) {
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) { end = offset; break; }
  }
  assert.ok(end >= 0, 'Invalid ZIP/JAR central directory');
  const count = bytes.readUInt16LE(end + 10);
  let cursor = bytes.readUInt32LE(end + 16);
  const names = [];
  for (let index = 0; index < count; index++) {
    assert.equal(bytes.readUInt32LE(cursor), 0x02014b50, 'Invalid central-directory entry');
    const nameLength = bytes.readUInt16LE(cursor + 28);
    names.push(bytes.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8'));
    cursor += 46 + nameLength + bytes.readUInt16LE(cursor + 30) + bytes.readUInt16LE(cursor + 32);
  }
  return names;
}

test('local release assets match the announced hashes and contain no private source files', async context => {
  const artifacts = resolve(siteRoot, '..', 'dist');
  if (!(await exists(join(artifacts, expectedAssets.get('installer'))))) {
    context.skip('Public website CI has no access to the private build workspace; release metadata is still validated above');
    return;
  }
  for (const asset of (await releaseMetadata()).downloads) {
    const bytes = await readFile(join(artifacts, asset.filename));
    assert.equal(bytes.length, asset.size, `Asset size differs: ${asset.filename}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256.toLowerCase(), `Asset hash differs: ${asset.filename}`);
    const names = zipEntryNames(bytes);
    for (const name of names) {
      assert.ok(!name.includes('\\') && !name.split('/').some(part => part === '..' || part === '.'), `Unsafe packaged path: ${name}`);
      if (name.endsWith('.java')) assert.match(name, /^(?:mod-template\/src\/main\/java\/.*\/ExampleMod\.java|examples\/ruby\/src\/main\/java\/studio\/hrajto\/ruby\/RubyMod\.java)$/, `Private Java source in ${asset.filename}: ${name}`);
      assert.ok(!/(?:^|\/)(?:\.codex|\.agents|\.aws|saves|world)(?:\/|$)/i.test(name), `Private packaged data in ${asset.filename}: ${name}`);
      if (asset.id === 'sdk' && name.endsWith('.jar')) assert.equal(name, 'hrajtymc-api.jar', 'SDK must expose only the public API JAR');
    }
  }
});
