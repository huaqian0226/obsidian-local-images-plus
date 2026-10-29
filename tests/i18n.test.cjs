const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
const root = path.resolve(process.env.LIP_SOURCE_ROOT || path.join(__dirname, '..'));
let language = 'en';
const originalLoad = Module._load;
Module._load = function(req, parent, main) {
  if (req === 'obsidian') return { getLanguage: () => language };
  if (req === 'src/utils') return { logError() {} };
  return originalLoad.call(this, req, parent, main);
};
require.extensions['.ts'] = function(mod, file) {
  mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, file);
};
const { translate } = require(path.join(root, 'src/i18n/index.ts'));
const zh = require(path.join(root, 'src/i18n/zh.ts')).default;
const zhTW = require(path.join(root, 'src/i18n/zh-TW.ts')).default;
const fr = require(path.join(root, 'src/i18n/fr.ts')).default;

function source(relative) {
  const filename = path.join(root, relative);
  return ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
}
function walk(node, fn) { fn(node); ts.forEachChild(node, child => walk(child, fn)); }
const keys = new Set();
function collectKeys(node) {
  walk(node, child => {
    if (ts.isCallExpression(child) && child.expression.getText() === 'translate') {
      assert.ok(child.arguments[0] && ts.isStringLiteralLike(child.arguments[0]), 'Translation keys must be English string literals');
      keys.add(child.arguments[0].text);
    }
  });
}
const hqMethods = new Set(['countLocalizeLinks', 'processActivePage', 'removeOrphans', 'openProcessAllModal', 'renameMD5']);
const hqCommands = new Set(['download-images', 'download-images-def', 'rename-attachments-md5-plugin', 'rename-attachments-md5-obsidian', 'remove-orphans-from-plugin-folder', 'remove-orphans-from-obsidian-folder']);
const main = source('src/main.ts');
walk(main, node => {
  if ((ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node)) && node.name && hqMethods.has(node.name.getText())) collectKeys(node);
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'addCommand') {
    const command = node.arguments[0];
    if (!command || !ts.isObjectLiteralExpression(command)) return;
    const id = command.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText() === 'id');
    if (id && ts.isStringLiteralLike(id.initializer) && hqCommands.has(id.initializer.text)) {
      const name = command.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText() === 'name');
      assert.ok(name && ts.isCallExpression(name.initializer) && name.initializer.expression.getText() === 'translate', `Command ${id.initializer.text} must use translate()`);
      collectKeys(command);
    }
  }
});
collectKeys(source('src/modal.ts'));
const settings = source('src/settingstab.ts');
walk(settings, node => {
  if (!ts.isExpressionStatement(node) || !node.getText().includes('new Setting')) return;
  if (!/Exclude(?:Orphan|Rename|Localize)FoldersList/.test(node.getText())) return;
  collectKeys(node);
  walk(node, child => {
    if (!ts.isCallExpression(child) || !ts.isPropertyAccessExpression(child.expression)) return;
    if (!['setName', 'setDesc', 'setPlaceholder'].includes(child.expression.name.text)) return;
    assert.ok(child.arguments[0] && ts.isCallExpression(child.arguments[0]) && child.arguments[0].expression.getText() === 'translate', `${child.expression.name.text} in HQ settings must use translate()`);
  });
});
function placeholders(text) { return (text.match(/\{p\}/g) || []).length; }
function format(text, params) { for (const param of params) text = text.replace('{p}', param); return text; }
const summaryKey = '{p} attachment(s) renamed to MD5 format. {p} failed, {p} skipped. {p} note update(s) failed.';

test('HQ command, setting, dialog and notice keys have simplified/traditional Chinese coverage', t => {
  assert.ok(keys.size >= 25, `Expected HQ translation inventory, found ${keys.size}`);
  for (const key of ['Cancel', 'Confirm', 'OK', summaryKey]) assert.ok(keys.has(key), `Missing translated UI key: ${key}`);
  for (const key of keys) {
    for (const [locale, dictionary] of [['zh', zh], ['zh-TW', zhTW]]) {
      assert.equal(typeof dictionary[key], 'string', `${locale}: ${key}`);
      assert.ok(dictionary[key].trim(), `${locale}: empty translation for ${key}`);
      assert.equal(placeholders(dictionary[key]), placeholders(key), `${locale}: parameter count for ${key}`);
    }
  }
  t.diagnostic(`${keys.size} unique HQ UI keys verified in zh and zh-TW`);
});
test('English sentence keys and positional parameters render correctly', () => {
  language = 'en';
  for (const key of keys) {
    const params = Array.from({ length: placeholders(key) }, (_, i) => `value-${i + 1}`);
    assert.equal(translate(key, params), format(key, params), key);
  }
});
test('all 13 other supported languages fall back to formatted English for HQ additions', () => {
  assert.equal(fr[summaryKey], undefined, 'French should use the English HQ fallback');
  for (const locale of ['ru', 'pl', 'de', 'fr', 'es', 'it', 'pt', 'pt-br', 'ja', 'ko', 'uk', 'tr', 'nl']) {
    language = locale;
    assert.equal(translate(summaryKey, ['2', '1', '3', '0']), '2 attachment(s) renamed to MD5 format. 1 failed, 3 skipped. 0 note update(s) failed.', locale);
  }
});
test('unsupported language falls back to English and still formats parameters', () => {
  language = 'xx-unsupported';
  assert.equal(translate(summaryKey, ['2', '1', '3', '0']), '2 attachment(s) renamed to MD5 format. 1 failed, 3 skipped. 0 note update(s) failed.');
});
test('simplified and traditional Chinese render all positional parameters', () => {
  for (const locale of ['zh', 'zh-TW']) {
    language = locale;
    const result = translate(summaryKey, ['SUCCESS', 'FAILED', 'SKIPPED', 'NOTE_FAILED']);
    for (const value of ['SUCCESS', 'FAILED', 'SKIPPED', 'NOTE_FAILED']) assert.ok(result.includes(value), `${locale}: ${value}`);
    assert.ok(!result.includes('{p}'));
  }
});
