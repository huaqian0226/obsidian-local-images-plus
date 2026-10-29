// In-memory behavior tests. No real vault, filesystem writes, or network requests.
// LIP_SOURCE_ROOT can point at a historical checkout for regression proof.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const projectRoot = path.resolve(__dirname, '..');
const root = path.resolve(process.env.LIP_SOURCE_ROOT || projectRoot);
const ts = require(path.join(projectRoot, 'node_modules/typescript'));
const notices = [], dialogs = [];
let language = 'en';

class Element {
  constructor(tag = 'div', options = {}) {
    this.tag = tag; this.text = options.text || ''; this.children = [];
    this.listeners = {}; this.style = {};
  }
  createEl(tag, options) { const e = new Element(tag, options); this.children.push(e); return e; }
  createDiv(options) { return this.createEl('div', options); }
  setText(text) { this.text = text; }
  addEventListener(event, fn) { this.listeners[event] = fn; }
  empty() { this.children = []; }
}
class TFile {
  constructor(p) {
    this.path = p; this.name = path.basename(p); this.basename = path.parse(p).name;
    this.extension = path.extname(p).slice(1); this.parent = { path: path.dirname(p) };
    this.stat = { ctime: 0, mtime: 0 };
  }
}
class TFolder { constructor(p) { this.path = p; this.children = []; } }
class Plugin {
  addCommand(c) { (this.commands ||= []).push(c); }
  addRibbonIcon() {} registerDomEvent() {} registerEvent() {} addSettingTab() {} registerInterval() {}
  async loadData() { return this.data; }
}
class Modal {
  constructor(app) { this.app = app; this.contentEl = new Element(); this.titleEl = new Element(); }
  open() { dialogs.push(this); this.onOpen(); }
  close() { this.closed = true; this.onClose(); }
}
class Menu { showAtMouseEvent() {} }
const obsidian = {
  Plugin, Modal, TFile, TFolder, Menu, MenuItem: class {}, PluginSettingTab: class {}, MarkdownView: class {},
  Notice: class { constructor(s) { notices.push(s); } setMessage(s) { notices.push(s); } hide() {} },
  htmlToMarkdown: s => s, getLanguage: () => language,
  requestUrl: () => { throw Error('Network forbidden in harness'); },
};
const originalLoad = Module._load;
Module._load = function(req, parent, main) {
  if (req === 'obsidian') return obsidian;
  if (req === 'src/utils') req = path.join(root, 'src/utils.ts');
  // Historical source checkouts reuse the existing installed dependencies.
  if (!req.startsWith('.') && !path.isAbsolute(req) && !Module.builtinModules.includes(req)) {
    req = require.resolve(req, { paths: [projectRoot] });
  }
  return originalLoad.call(this, req, parent, main);
};
require.extensions['.ts'] = function(mod, file) {
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, file);
};
global.window = { setInterval: () => 1, clearInterval() {} };
global.document = {};
const config = require(path.join(root, 'src/config.ts'));
const utils = require(path.join(root, 'src/utils.ts'));
const cp = require(path.join(root, 'src/contentProcessor.ts'));
const i18n = require(path.join(root, 'src/i18n/index.ts'));
const LocalImagesPlugin = require(path.join(root, 'src/main.ts')).default;
const originalProcessor = cp.imageTagProcessor;

function setup(paths, contents = {}, caches = {}, overrides = {}, vaultConfig = {}) {
  dialogs.length = 0; notices.length = 0; language = 'en';
  const files = paths.map(p => new TFile(p));
  const byPath = Object.fromEntries(files.map(f => [f.path, f]));
  const folders = {};
  for (const f of files) {
    const dir = path.dirname(f.path);
    (folders[dir] ||= new TFolder(dir)).children.push(f);
  }
  const writes = [], renameAttempts = [];
  const settings = { attachmentFolderPath: './images', trashOption: 'system', useMarkdownLinks: true, ...vaultConfig };
  const vault = {
    getFiles: () => files, getMarkdownFiles: () => files.filter(f => f.extension === 'md'),
    getConfig: k => settings[k], getAbstractFileByPath: p => folders[p] || byPath[p],
    exists: async p => !!(folders[p] || byPath[p]),
    cachedRead: async f => contents[f.path] || '', read: async f => contents[f.path] || '',
    modify: async (f, s) => { writes.push(['modify', f.path, s]); contents[f.path] = s; },
    trash: async (f, system) => { writes.push(['trash', f.path, system]); delete byPath[f.path]; },
    delete: async f => { writes.push(['delete', f.path]); delete byPath[f.path]; },
    on() {},
    adapter: {
      basePath: '/virtual', exists: async p => !!(folders[p] || byPath[p]),
      rename: async (a, b) => {
        renameAttempts.push([a, b]);
        if (!byPath[a]) throw Error('Missing source');
        // Like POSIX rename, this deliberately permits overwriting a target.
        // Safety must come from the plugin's collision checks, not this stub.
        writes.push(['rename', a, b]);
        byPath[b] = byPath[a]; delete byPath[a];
        Object.assign(byPath[b], { path: b, name: path.basename(b), basename: path.parse(b).name });
      },
      readBinary: async () => new Uint8Array([1, 2, 3]).buffer,
    },
  };
  const app = {
    vault,
    metadataCache: { getCache: p => caches[p], getFileCache: f => caches[f.path] },
    workspace: { activeEditor: { file: files[0] }, getActiveFile: () => files[0], on() {}, off() {} },
    internalPlugins: { plugins: { canvas: { instance: { index: {
      parseText: async text => ({ links: [...text.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => ({ link: m[1] })) }),
    } } } } },
  };
  global.app = app;
  const plugin = new LocalImagesPlugin(); plugin.app = app;
  plugin.settings = { ...config.DEFAULT_SETTINGS, realTimeUpdate: false, ...overrides };
  plugin.getCurrentNote = () => files[0];
  return { plugin, app, files, writes, contents, folders, byPath, renameAttempts };
}
function plan(oldPath, newPath) {
  return { oldPath, newPath, oldName: path.basename(oldPath), newName: path.basename(newPath) };
}
async function confirm() {
  assert.equal(dialogs.length, 1, 'Expected one confirmation modal');
  await dialogs[0].callbackFunc();
}
async function cancel() {
  assert.equal(dialogs.length, 1, 'Expected one confirmation modal');
  const modal = dialogs[0];
  const button = modal.contentEl.children.find(e => e.tag === 'button' && e.text === 'Cancel');
  assert.ok(button, 'Actual Cancel button must exist');
  await button.listeners.click();
  assert.equal(modal.closed, true);
}
function deletedPaths(x) { return x.writes.filter(w => ['trash', 'delete'].includes(w[0])).map(w => w[1]).sort(); }
function assertReportedFailure() { assert.match(notices.join('\n'), /(?:failed|skipped|collision|error)/i); }
function assertRenameSummary(renamed, failed, skipped, noteFailures = 0) {
  const expected = `${renamed} attachment(s) renamed to MD5 format. ${failed} failed, ${skipped} skipped. ${noteFailures} note update(s) failed.`;
  assert.ok(notices.some(n => n.includes(expected)), `Missing numeric summary: ${expected}\n${notices.join('\n')}`);
}

test('exclude path parsing respects CRLF, whitespace and directory boundaries', () => {
  const paths = utils.parseExcludePaths(' /A/\r\n\n B \n');
  assert.deepEqual(paths, ['A', 'B']);
  assert.equal(utils.isPathInExcludedFolders('A/n', paths), true);
  assert.equal(utils.isPathInExcludedFolders('AB/n', paths), false);
});

test('prescan deduplicates overlapping patterns and filters local links', () => {
  const { plugin, files } = setup(['A/a.md']);
  assert.equal(plugin.countLocalizeLinks(files[0], '![](https://example.com/x.png) ![[images/local.png]]'), 1);
});
test('prescan distinguishes body/YAML, excludes source, and honors YAML toggle', () => {
  const { plugin, files } = setup(['A/a.md']);
  const yaml = '---\ncover: https://example.com/x.png\nsource: https://example.com/article.png\n---\n';
  assert.equal(plugin.countLocalizeLinks(files[0], yaml), 1);
  plugin.settings.processFrontmatter = false;
  assert.equal(plugin.countLocalizeLinks(files[0], yaml), 0);
  assert.equal(plugin.countLocalizeLinks(files[0], yaml + '![](https://example.com/body.png)'), 1);
});
test('prescan honors URL exclusions in body and YAML', () => {
  const { plugin, files } = setup(['A/a.md'], {}, {}, { UrlExcludeRegexps: 'example\\.com' });
  assert.equal(plugin.countLocalizeLinks(files[0], '---\ncover: https://example.com/y.png\n---\n![](https://example.com/x.png)'), 0);
});

test('legacy HQ settings migrate both MD5 flags without losing existing values', async () => {
  const { plugin } = setup(['A/a.md']);
  const oldData = {
    processCreated: false, ignoredExt: 'php', processAll: false, useCaptions: false,
    pathInTags: 'onlyRelative', downUnknown: true, saveAttE: 'nextToNoteS', realTimeUpdate: false,
    filesizeLimit: 11, tryCount: 3, realTimeUpdateInterval: 7, addNameOfFile: false,
    showNotifications: false, includeps: 'md|canvas', includepattern: 'custom', mediaRootDir: 'images',
    disAddCom: true, removeMediaFolder: false, removeOrphansCompl: false, PngToJpeg: true,
    PngToJpegLocal: false, JpegQuality: 75, DoNotCreateObsFolder: true, DateFormat: 'YYYY',
    ImgCompressionType: 'image/webp', ExcludedFoldersList: 'AutoKeep', ExcludedFoldersListRegexp: '^Keep',
    ExcludeOrphanFoldersList: 'OrphanKeep', ExcludeRenameFoldersList: 'RenameKeep', ExcludeLocalizeFoldersList: 'LocalKeep',
  };
  plugin.data = { ...oldData, useMD5ForNewAtt: true };
  await plugin.loadSettings();
  assert.equal(plugin.settings.FileNameTemplate, '${md5}_MD5');
  for (const [key, value] of Object.entries(oldData)) assert.deepEqual(plugin.settings[key], value, key);
  assert.equal('useMD5ForNewAtt' in plugin.settings, false);
  plugin.data = { ...oldData, useMD5ForNewAtt: false };
  await plugin.loadSettings();
  assert.equal(plugin.settings.FileNameTemplate, '${originalname}');
  plugin.data = { ...oldData, FileNameTemplate: '${notename}', useMD5ForNewAtt: false };
  await plugin.loadSettings();
  assert.equal(plugin.settings.FileNameTemplate, '${notename}');
});

test('command registry keeps two localizers and two MD5 commands', async () => {
  const { plugin } = setup(['A/a.md']);
  await plugin.onload();
  try {
    assert.deepEqual(plugin.commands.filter(c => c.id.startsWith('download-images')).map(c => c.id), ['download-images', 'download-images-def']);
    assert.equal(plugin.commands.filter(c => c.id.startsWith('rename-attachments-md5')).length, 2);
  } finally { await plugin.onunload(); }
});
test('folder localization scans sibling notes and performs zero writes before confirmation', async () => {
  const x = setup(['A/a.md', 'A/b.md', 'B/c.md'], {
    'A/a.md': '![](https://e.com/a.png)', 'A/b.md': '![](https://e.com/b.png)', 'B/c.md': '![](https://e.com/c.png)',
  });
  const processed = [];
  x.plugin.processPage = async (f, d) => processed.push([f.path, d]);
  await x.plugin.processActivePage(false)();
  assert.deepEqual(x.writes, []); assert.deepEqual(processed, []);
  await confirm();
  assert.deepEqual(processed, [['A/a.md', false], ['A/b.md', false]]);
});
test('localize exclusion limits vault localization and uses Obsidian destination', async () => {
  const x = setup(['A/a.md', 'Keep/b.md'], { 'A/a.md': '![](https://e.com/a.png)', 'Keep/b.md': '![](https://e.com/b.png)' }, {}, { ExcludeLocalizeFoldersList: 'Keep' });
  const processed = [];
  x.plugin.processPage = async (f, d) => processed.push([f.path, d]);
  await x.plugin.openProcessAllModal();
  assert.deepEqual(processed, []); await confirm();
  assert.deepEqual(processed, [['A/a.md', true]]);
});
test('localize Cancel button causes zero writes and zero processing', async () => {
  const x = setup(['A/a.md'], { 'A/a.md': '![](https://e.com/a.png)' });
  let processed = 0; x.plugin.processPage = async () => { processed++; };
  await x.plugin.processActivePage(false)(); await cancel();
  assert.equal(processed, 0); assert.deepEqual(x.writes, []);
});

test('YAML-only frontmatter cache link protects its attachment', async () => {
  const x = setup(['A/a.md', 'A/images/cover.png', 'A/images/orphan.png'], {}, {
    'A/a.md': { frontmatterLinks: [{ link: 'images/cover.png#heading' }] },
  });
  await x.plugin.removeOrphans('obsidian')(); await confirm();
  assert.deepEqual(deletedPaths(x), ['A/images/orphan.png']);
});
test('sibling ./images grouping combines sibling notes without mixing different parents', async () => {
  const x = setup(['A/a.md', 'A/b.md', 'B/b.md', 'A/images/shared.png', 'A/images/orphan.png', 'B/images/shared.png'], {}, {
    'A/b.md': { links: [{ link: 'images/shared.png' }] },
  });
  await x.plugin.removeOrphans('obsidian')(); assert.deepEqual(x.writes, []); await confirm();
  assert.deepEqual(deletedPaths(x), ['A/images/orphan.png', 'B/images/shared.png']);
});
test('Canvas file, text and upstream image nodes protect attachments', async () => {
  const x = setup(['A/a.md', 'A/board.canvas', 'A/images/file.png', 'A/images/text.png', 'A/images/image.png', 'A/images/orphan.png'], {
    'A/board.canvas': JSON.stringify({ nodes: [
      { type: 'file', file: 'A/images/file.png' },
      { type: 'text', text: '![[images/text.png]]' },
      { type: 'image', url: 'A/images/image.png' },
    ] }),
  });
  await x.plugin.removeOrphans('obsidian')(); await confirm();
  assert.deepEqual(deletedPaths(x), ['A/images/orphan.png']);
});
test('plugin orphan scan combines all sibling note references', async () => {
  const x = setup(['A/a.md', 'A/b.md', 'A/images/cover.png', 'A/images/orphan.png'], {}, {
    'A/b.md': { frontmatterLinks: [{ link: 'images/cover.png' }] },
  }, { saveAttE: 'nextToNoteS', mediaRootDir: 'images' });
  await x.plugin.removeOrphans('plugin')(); await confirm();
  assert.deepEqual(deletedPaths(x), ['A/images/orphan.png']);
});
test('orphan exclusion limits sibling-folder candidates', async () => {
  const x = setup(['Keep/a.md', 'Keep/images/orphan.png'], {}, {}, { ExcludeOrphanFoldersList: 'Keep' });
  await x.plugin.removeOrphans('obsidian')();
  assert.deepEqual(dialogs, []); assert.deepEqual(x.writes, []);
});
test('orphan Cancel button causes zero writes', async () => {
  const x = setup(['A/a.md', 'A/images/orphan.png']);
  await x.plugin.removeOrphans('obsidian')(); await cancel();
  assert.deepEqual(x.writes, []);
});

test('SAFETY orphan: excluded markdown, frontmatter and Canvas references count in fixed folder', async () => {
  const x = setup(['Keep/a.md', 'Keep/board.canvas', 'Assets/body.png', 'Assets/yaml.png', 'Assets/canvas.png', 'Assets/orphan.png'], {
    'Keep/board.canvas': JSON.stringify({ nodes: [{ type: 'file', file: 'Assets/canvas.png' }] }),
  }, { 'Keep/a.md': { embeds: [{ link: 'Assets/body.png' }], frontmatterLinks: [{ link: 'Assets/yaml.png' }] } },
  { ExcludeOrphanFoldersList: 'Keep' }, { attachmentFolderPath: 'Assets' });
  await x.plugin.removeOrphans('obsidian')(); await confirm();
  assert.deepEqual(deletedPaths(x), ['Assets/orphan.png']);
});
test('SAFETY orphan: plugin fixed folder counts references outside active note directory', async () => {
  const x = setup(['A/a.md', 'Keep/b.md', 'Assets/used.png', 'Assets/orphan.png'], {}, {
    'Keep/b.md': { links: [{ link: 'Assets/used.png' }] },
  }, { ExcludeOrphanFoldersList: 'Keep', saveAttE: 'inFolderBelow', mediaRootDir: 'Assets' });
  await x.plugin.removeOrphans('plugin')(); await confirm();
  assert.deepEqual(deletedPaths(x), ['Assets/orphan.png']);
});
test('SAFETY orphan: excluded fixed attachment folder is never a candidate', async () => {
  const x = setup(['A/a.md', 'Assets/orphan.png'], {}, {}, { ExcludeOrphanFoldersList: 'Assets' }, { attachmentFolderPath: 'Assets' });
  await x.plugin.removeOrphans('obsidian')();
  if (dialogs.length) await confirm();
  assert.deepEqual(deletedPaths(x), []);
});
test('SAFETY orphan: excluded plugin attachment folder is never a candidate', async () => {
  const x = setup(['A/a.md', 'Assets/orphan.png'], {}, {}, { ExcludeOrphanFoldersList: 'Assets', saveAttE: 'inFolderBelow', mediaRootDir: 'Assets' });
  await x.plugin.removeOrphans('plugin')();
  if (dialogs.length) await confirm();
  assert.deepEqual(deletedPaths(x), []);
});

test('MD5 success preserves relative Markdown/wiki anchors, query and alias', async () => {
  const x = setup(['A/a.md', 'A/b.md', 'A/images/x.png'], {
    'A/a.md': '![](images/x.png#h) ![[images/x.png?size=1#h|alias]]',
    'A/b.md': '[file](images/x.png?x=1#h)',
  });
  await x.plugin.renameMD5('execrename', [plan('A/images/x.png', 'A/images/hash.png')], x.files.slice(0, 2))();
  assert.equal(x.contents['A/a.md'], '![](images/hash.png#h) ![[images/hash.png?size=1#h|alias]]');
  assert.equal(x.contents['A/b.md'], '[file](images/hash.png?x=1#h)');
});
test('MD5 prescan reads bytes and performs zero writes before confirmation', async () => {
  const x = setup(['A/a.md', 'A/images/x.png'], { 'A/a.md': '![](images/x.png)' }, {}, { saveAttE: 'nextToNoteS', mediaRootDir: 'images' });
  const read = utils.readFromDisk; utils.readFromDisk = async () => Buffer.from('synthetic-image');
  try {
    await x.plugin.renameMD5('plugin')(); assert.deepEqual(x.writes, []); await confirm();
    assert.equal(x.writes[0][0], 'rename'); assert.match(x.contents['A/a.md'], /images\/[a-f0-9]{32}\.png/);
  } finally { utils.readFromDisk = read; }
});
test('rename exclusion limits vault MD5 scan', async () => {
  const x = setup(['Keep/a.md', 'Keep/images/x.png'], {}, {}, { ExcludeRenameFoldersList: 'Keep' });
  await x.plugin.renameMD5('obsidian')();
  assert.deepEqual(dialogs, []); assert.deepEqual(x.writes, []);
});
test('MD5 Cancel button causes zero writes', async () => {
  const x = setup(['A/a.md', 'A/images/x.png'], { 'A/a.md': '![](images/x.png)' }, {}, { saveAttE: 'nextToNoteS', mediaRootDir: 'images' });
  const read = utils.readFromDisk; utils.readFromDisk = async () => Buffer.from('synthetic-image');
  try { await x.plugin.renameMD5('plugin')(); await cancel(); assert.deepEqual(x.writes, []); }
  finally { utils.readFromDisk = read; }
});
test('SAFETY rename: thrown rename leaves original links unchanged and reports failure', async () => {
  const original = '![](images/x.png) ![[images/x.png#heading|alias]]';
  const x = setup(['A/a.md', 'A/images/x.png'], { 'A/a.md': original });
  x.app.vault.adapter.rename = async () => { throw Error('simulated failure'); };
  await x.plugin.renameMD5('execrename', [plan('A/images/x.png', 'A/images/hash.png')], [x.files[0]])();
  assert.equal(x.contents['A/a.md'], original); assert.deepEqual(x.writes, []); assertReportedFailure();
  assertRenameSummary(0, 1, 0);
});
test('SAFETY rename: existing target is never overwritten and its source links stay unchanged', async () => {
  const x = setup(['A/a.md', 'A/images/x.png', 'A/images/hash.png'], { 'A/a.md': '![](images/x.png)' });
  const originalTarget = x.byPath['A/images/hash.png'];
  await x.plugin.renameMD5('execrename', [plan('A/images/x.png', 'A/images/hash.png')], [x.files[0]])();
  assert.equal(x.contents['A/a.md'], '![](images/x.png)'); assert.deepEqual(x.writes, []);
  assert.ok(x.byPath['A/images/x.png']); assert.equal(x.byPath['A/images/hash.png'], originalTarget); assertReportedFailure();
  assertRenameSummary(0, 0, 1);
});
test('SAFETY rename: same MD5 target collision rewrites only successful source', async () => {
  const x = setup(['A/a.md', 'A/images/x.png', 'A/images/y.png'], { 'A/a.md': '![](images/x.png) ![](images/y.png)' });
  await x.plugin.renameMD5('execrename', [plan('A/images/x.png', 'A/images/hash.png'), plan('A/images/y.png', 'A/images/hash.png')], [x.files[0]])();
  assert.equal(x.contents['A/a.md'], '![](images/hash.png) ![](images/y.png)');
  assert.deepEqual(x.writes.filter(w => w[0] === 'rename'), [['rename', 'A/images/x.png', 'A/images/hash.png']]);
  assert.ok(x.byPath['A/images/y.png']); assert.ok(x.byPath['A/images/hash.png']); assertReportedFailure();
  assertRenameSummary(1, 0, 1);
});
test('SAFETY rename: existing hash target discovered during prescan is reported', async () => {
  const hash = utils.md5Sig(Buffer.from('same'));
  const x = setup(['A/a.md', 'A/images/x.png', `A/images/${hash}.png`], { 'A/a.md': '![](images/x.png)' }, {}, { saveAttE: 'nextToNoteS', mediaRootDir: 'images' });
  const read = utils.readFromDisk; utils.readFromDisk = async () => Buffer.from('same');
  try {
    await x.plugin.renameMD5('plugin')(); if (dialogs.length) await confirm();
    assert.equal(x.contents['A/a.md'], '![](images/x.png)'); assert.deepEqual(x.writes, []); assertReportedFailure();
    assertRenameSummary(0, 0, 1);
  } finally { utils.readFromDisk = read; }
});
test('SAFETY rename: actual Plugin prescan handles two files with identical bytes safely', async () => {
  const hash = utils.md5Sig(Buffer.from('identical-image-bytes'));
  const x = setup(['A/a.md', 'A/images/x.png', 'A/images/y.png'], {
    'A/a.md': '![](images/x.png) ![[images/y.png#heading|alias]]',
  }, {}, { saveAttE: 'nextToNoteS', mediaRootDir: 'images' });
  const read = utils.readFromDisk; utils.readFromDisk = async () => Buffer.from('identical-image-bytes');
  try {
    await x.plugin.renameMD5('plugin')();
    assert.deepEqual(x.writes, []);
    await confirm();
    assert.equal(x.contents['A/a.md'], `![](images/${hash}.png) ![[images/y.png#heading|alias]]`);
    assert.deepEqual(x.writes.filter(w => w[0] === 'rename'), [['rename', 'A/images/x.png', `A/images/${hash}.png`]]);
    assert.ok(x.byPath['A/images/y.png']); assert.ok(x.byPath[`A/images/${hash}.png`]);
    assertRenameSummary(1, 0, 1);
  } finally { utils.readFromDisk = read; }
});

test('upstream YAML/body processing preserves source referer and disabled YAML', async () => {
  const x = setup(['A/a.md'], { 'A/a.md': '---\ncover: https://e.com/cover.png\nsource: https://e.com/article\n---\n![](https://e.com/body.png)' });
  const calls = [];
  cp.imageTagProcessor = (_p, _f, _s, _d, source) => async o => {
    calls.push([o.link, source]); return [o.replp, o.replp.replace(o.link, 'local.png'), 'local.png'];
  };
  try {
    await x.plugin.processPage(x.files[0], false);
    assert.deepEqual(calls.map(c => c[0]).sort(), ['https://e.com/body.png', 'https://e.com/cover.png']);
    assert.ok(calls.every(c => c[1] === 'https://e.com/article'));
    const y = setup(['A/a.md'], { 'A/a.md': '---\ncover: https://e.com/cover.png\n---\n![](https://e.com/body.png)' }, {}, { processFrontmatter: false });
    await y.plugin.processPage(y.files[0]); assert.match(y.contents['A/a.md'], /cover: https:\/\/e.com\/cover.png/);
  } finally { cp.imageTagProcessor = originalProcessor; }
});
test('KNOWN upstream Canvas bare URL bug remains reproducible (not fixed in fork merge)', async () => {
  const x = setup(['A/board.canvas'], { 'A/board.canvas': '{"nodes":[{"type":"link","url":"https://e.com/x.png"}]}' });
  cp.imageTagProcessor = () => async o => [o.replp, o.replp.replace(o.link, 'local.png'), 'local.png'];
  try {
    await assert.rejects(x.plugin.processPage(x.files[0]), /regex\.forEach is not a function/);
    assert.deepEqual(x.writes, []);
  } finally { cp.imageTagProcessor = originalProcessor; }
});
