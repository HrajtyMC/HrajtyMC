const base = document.body.dataset.base;

document.querySelectorAll('[data-theme-toggle]').forEach(button => {
  const refresh = () => { const dark = document.documentElement.dataset.theme === 'dark'; button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme'); button.setAttribute('aria-pressed', String(dark)); };
  refresh();
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('hrajtymc-theme', next); } catch {}
    refresh();
  });
});

document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const code = button.closest('.code-block')?.querySelector('code');
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code.textContent);
    button.textContent = 'Copied!'; button.setAttribute('aria-label', 'Code copied');
    setTimeout(() => { button.textContent = 'Copy'; button.setAttribute('aria-label', 'Copy code'); }, 2000);
  } catch {
    const selection = window.getSelection(); const range = document.createRange(); range.selectNodeContents(code);
    selection.removeAllRanges(); selection.addRange(range); button.textContent = 'Code selected';
    setTimeout(() => { button.textContent = 'Copy'; }, 2500);
  }
}));

const sidebarButton = document.querySelector('[data-sidebar-toggle]');
function closeSidebar() { document.body.classList.remove('docs-sidebar-open'); sidebarButton?.setAttribute('aria-expanded', 'false'); }
sidebarButton?.addEventListener('click', () => {
  const open = document.body.classList.toggle('docs-sidebar-open'); sidebarButton.setAttribute('aria-expanded', String(open));
  if (open) document.querySelector('#docs-sidebar a[aria-current="page"]')?.focus();
});
document.querySelector('[data-sidebar-close]')?.addEventListener('click', closeSidebar);
document.querySelectorAll('#docs-sidebar a').forEach(link => link.addEventListener('click', closeSidebar));
window.matchMedia('(min-width:761px)').addEventListener('change', event => { if (event.matches) closeSidebar(); });

const dialog = document.querySelector('#site-search');
const input = document.querySelector('#search-input');
const results = document.querySelector('#search-results');
let indexPromise, searchIndex, selected = -1, returnFocus;
async function loadIndex() {
  if (!indexPromise) indexPromise = fetch(base + 'search-index.json').then(response => { if (!response.ok) throw new Error('Search index unavailable'); return response.json(); }).catch(error => { indexPromise = null; throw error; });
  return indexPromise;
}
async function openSearch(trigger) {
  closeSidebar(); returnFocus = trigger || document.activeElement;
  if (!dialog.open) dialog.showModal();
  input.focus();
  try { searchIndex = await loadIndex(); renderSearch(); }
  catch { results.replaceChildren(message('Search is temporarily unavailable. Browse the documentation menu instead.')); }
}
function message(text) { const paragraph = document.createElement('p'); paragraph.className = 'search-hint'; paragraph.textContent = text; return paragraph; }
function closeSearch() { dialog.close(); returnFocus?.focus(); }
function renderSearch() {
  results.replaceChildren(); selected = -1;
  const query = input.value.trim().toLowerCase();
  if (!query) { results.append(message('Find guides, recipes, API types, and answers.')); return; }
  const terms = query.split(/\s+/);
  const matches = (searchIndex || []).map(page => {
    const title = page.title.toLowerCase(), haystack = (page.title + ' ' + page.text).toLowerCase();
    if (!terms.every(term => haystack.includes(term))) return null;
    return { page, score: (title.includes(query) ? 50 : 0) + terms.reduce((n, term) => n + (title.includes(term) ? 10 : 0), 0) };
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 8);
  if (!matches.length) { results.append(message('No matches yet. Try “installation”, “recipes”, or “API”.')); return; }
  for (const { page } of matches) {
    const link = document.createElement('a'); link.className = 'search-result'; link.href = page.url;
    const section = document.createElement('span'); section.className = 'search-result-section'; section.textContent = page.section;
    const title = document.createElement('strong'); title.textContent = page.title;
    const description = document.createElement('p'); const found = page.text.toLowerCase().indexOf(terms[0]); const start = Math.max(0, found - 45);
    description.textContent = (start ? '…' : '') + page.text.slice(start, start + 170) + '…';
    link.append(section, title, description); results.append(link);
  }
}
document.querySelectorAll('[data-search-button]').forEach(button => button.addEventListener('click', () => openSearch(button)));
document.querySelector('[data-search-close]')?.addEventListener('click', closeSearch);
dialog?.addEventListener('cancel', () => { returnFocus?.focus(); });
dialog?.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeSearch(); } });
input?.addEventListener('input', renderSearch);
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(document.activeElement); }
  if (event.key === 'Escape') closeSidebar();
  if (!dialog?.open) return;
  const links = [...results.querySelectorAll('.search-result')];
  if (['ArrowDown', 'ArrowUp'].includes(event.key) && links.length) {
    event.preventDefault(); selected = (selected + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
    links.forEach((link, i) => { link.setAttribute('aria-selected', String(i === selected)); }); links[selected].scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'Enter' && selected >= 0 && links[selected] && document.activeElement === input) { event.preventDefault(); location.href = links[selected].href; }
});

const tocLinks = [...document.querySelectorAll('.docs-toc nav a')];
if (tocLinks.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      tocLinks.forEach(link => link.classList.toggle('active', link.hash === '#' + entry.target.id));
    }
  }, { rootMargin: '-90px 0px -65% 0px' });
  tocLinks.forEach(link => { const heading = document.getElementById(decodeURIComponent(link.hash.slice(1))); if (heading) observer.observe(heading); });
}
