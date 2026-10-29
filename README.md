# Local Images Plus — hq fork

English | [简体中文](./README.zh-CN.md)

Personal fork: [huaqian0226/obsidian-local-images-plus](https://github.com/huaqian0226/obsidian-local-images-plus), branch `my-features`, maintained by hq. The original [Local Images Plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus) provides the media-localization engine. This fork is independent of upstream and is not a separate Community Store entry.

This branch merges upstream **0.17.1**, commit **`2b4dac116394dfab74a39c2406dea963b890bed4`**. The next planned personal version is **`0.17.1-hq.1`**; it has **not been released by this merge**. Version metadata remains `0.16.4-hq.2` until the coordinator's separate version commit.

## Upstream features retained (0.17.1)

- Download/localize external media, clipboard content and local document attachments; automatic processing and attachment-folder management.
- Filename templates: `${md5}`, `${md5:N}`, `${originalname}`, `${notename}`, `${date}`, `${unique}`. Legacy `useMD5ForNewAtt` migrates to `FileNameTemplate` without changing its naming choice.
- Optional YAML media downloads, source/referer handling and preservation of disabled frontmatter.
- Right-click single-image download, editor-drop handling and Canvas localization with its own toggle.
- `UrlExcludeRegexps`, improved Markdown/wikilink parsing, and upstream internationalization.

## hq additions and safety fixes

- **Two localize commands:** Plugin-folder mode scans Markdown siblings of the active note; with an active Canvas it scans that Canvas. Obsidian-folder mode scans all Markdown notes in the vault. Both honor the localize exclusion list and use their respective destination settings.
- **Read-only prescan and confirmation** for these bulk localize, orphan-removal and MD5 commands. The multi-line dialog shows per-note/per-folder counts. Cancel performs no writes. Localization prescan separates body/YAML, follows the YAML and Canvas toggles, filters local wiki links and excluded URLs, and deduplicates overlapping matches.
- **Orphan references:** include metadata-cache embeds, links and frontmatter links, plus Canvas file/text/image nodes and upstream Canvas content fallback. Sibling `./images` directories are grouped by the note's parent directory.
- **Orphan safety fix:** references from all Markdown and Canvas files count, including notes in excluded folders and notes outside the active directory. Orphan exclusions limit candidate attachment paths/folders; they never suppress reference collection. This protects in-use files in fixed folders, relative `./images` folders and plugin `${notename}` folders. Obsidian `resolvedLinks` and `getFirstLinkpathDest` resolve bare/shortest links across directories; a unique-basename fallback also protects links while the cache is unavailable.
- **MD5 batch rename:** Plugin-folder mode scans the active note's attachment directory; Obsidian-folder mode scans sibling attachment directories vault-wide. Markdown/wikilinks (including YAML) and Canvas file/image/text references are updated vault-wide, including excluded notes, while preserving query, heading and alias suffixes. Link destinations are resolved before renaming, so duplicate basenames follow Obsidian resolution.
- **Rename safety fix:** only successful renames enter the link-rewrite list. Existing targets and equal-hash collisions are skipped without overwriting; errors retain the original links. The result reports renamed, failed, skipped and note-update failure counts.
- **Three independent directory exclusions**, one full vault-relative path per line, including subfolders: orphan candidates; MD5 attachment candidates; note folders for both localize commands. The older automatic-processing exclusions and URL regex exclusions remain separate.
- **hq UI translations:** English sentence keys plus simplified and traditional Chinese for commands, settings, previews, dialogs and notices. Other supported languages fall back to English for missing hq keys, with parameters preserved. Existing `0.16.4-hq.2` settings are retained during loading.

## Commands

Names below are the English labels; Chinese locales show translated labels.

| Command | Scope and destination |
| --- | --- |
| Localize attachments (Plugin folder) | Current directory's Markdown notes, or active Canvas; plugin-configured destination. |
| Localize attachments (Obsidian folder) | All non-excluded Markdown notes; Obsidian-configured destination. |
| Remove all orphaned attachments (Plugin folder) | Current note's configured attachment directory; vault-wide references protect candidates. |
| Remove all orphaned attachments (Obsidian folder) | Fixed attachment directory or sibling `./images` groups; excluded candidate paths are skipped. |
| Rename attachments to MD5 (Plugin folder) | Current note's attachment directory; honors rename exclusions and updates Markdown/YAML/Canvas references vault-wide. |
| Rename attachments to MD5 (Obsidian folder) | All non-excluded attachment directories; requires an Obsidian `./…` attachment path; updates Markdown/YAML/Canvas references vault-wide. |

Utility commands remain: use the first header as the note name, encode selection as a URI, and convert selected HTML to Markdown. MD5 link updates cover Markdown/wikilinks and Canvas file/image/text nodes; arbitrary HTML references are not rewritten. Back up attachments before bulk deletion or rename; duplicate basenames and HTML links can limit orphan classification.

## Known upstream limitation and validation scope

The upstream Canvas **bare-URL** localization branch is intentionally unchanged: passing its single regex to `replaceAsync` can throw `regex.forEach is not a function`. A Canvas containing `{"nodes":[{"type":"link","url":"https://example.com/x.png"}]}` reproduces this when the first Markdown-pattern pass changes nothing. This also remains a TypeScript diagnostic.

Automated tests use an in-memory vault and stub Obsidian APIs. Actual Obsidian enable/disable, network downloads, editor-drop/right-click behavior and BRAT installation have not been validated for this merged build. The build emits JavaScript but upstream TypeScript diagnostics remain; passing `npm test` does not mean this Canvas bug is fixed (its test asserts the known error).

## BRAT installation — after the upcoming release

`0.17.1-hq.1` is a planned release, not an available asset promised by this README. After the coordinator publishes its installable assets:

1. Back up existing plugin settings/data. The fork keeps the original plugin ID, `obsidian-local-images-plus`; it replaces the original instance rather than installing alongside it.
2. In **Settings → BRAT → Add beta plugin**, enter `huaqian0226/obsidian-local-images-plus`.
3. Select the published `v0.17.1-hq.1` release when available, install and enable it. Confirm the installed version and retained settings before bulk operations.

Local builds output `main.js`, `manifest.json` and `styles.css` in `obsidian_local_images_plus_latest/`. This merge does not deploy them to a vault.

## Development

```sh
npm ci
npm run build
node --check obsidian_local_images_plus_latest/main.js
npm test
npx tsc --noEmit -p .
```

The final command currently reports upstream diagnostics. No dependencies were upgraded for the merge or tests. Edit TypeScript under `src/`; never hand-edit the generated bundle. `npm run version` synchronizes manifests and `versions.json` from `package.json`; version changes are a separate maintainer step.

## Acknowledgements and license

Original authors: **catalysm, aleksey-rezvov, Sergei Korneev**. Original plugin ID and authors remain unchanged. Upstream lineage:

- [niekcandaele/obsidian-local-images](https://github.com/niekcandaele/obsidian-local-images)
- [aleksey-rezvov/obsidian-local-images](https://github.com/aleksey-rezvov/obsidian-local-images)
- [Sergei-Korneev/obsidian-local-images-plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)

Support the upstream author: [Buy Me a Coffee](https://www.buymeacoffee.com/sergeikorneev).

By using this software, you accept the terms of the original [license agreement](./LICENSE). The author is not obligated to provide support and assumes no liability. This fork inherits the original license; all original copyright and attribution notices are retained.
