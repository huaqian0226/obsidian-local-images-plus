# Local Images Plus — `my-features` fork

> English | [简体中文](./README.zh-CN.md)

A personal fork of the excellent **[Local Images Plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)** plugin for [Obsidian](https://obsidian.md/), customized to fit my own vault and workflow.

The base plugin downloads/localizes external media in your notes, saves attachments locally, de-duplicates them via MD5, and removes orphaned attachments. **All of that credit goes to the original authors** (see [Acknowledgements](#acknowledgements)). This fork only adds a few quality-of-life changes on top.

> ⚠️ This fork is **not** affiliated with the original project and is **not** published to the Obsidian Community Store. It is maintained for personal use. Use at your own risk and **keep backups** — several commands modify or delete files in bulk.

---

## What this fork adds

- **Confirm-before-run for every bulk action.** Localize, orphan removal, and MD5 rename now **pre-scan**, show exactly what will be affected (per-note / per-folder counts, one item per line in a scrollable dialog), and ask for confirmation **before** touching any file.

- **Localize is now folder / vault aware:**
  - `Localize attachments (Plugin folder)` scans **every note in the current note's folder**, not just the active note.
  - `Localize attachments (Obsidian folder)` scans the **whole vault** and honors the localize exclude list.
  - The old third "all notes" command was merged in — there are now **2 localize commands instead of 3**.

- **New — Rename attachments to MD5:**
  - `Rename attachments to MD5 (Plugin folder)` and `Rename attachments to MD5 (Obsidian folder)` rename attachments to their MD5 signature and **rewrite note links to relative paths**.

- **Smarter orphan removal:**
  - Supports per-note sibling attachment folders (e.g. `./images`), grouping and reporting orphans **per folder**.
  - Plugin-folder mode scans all notes that share the folder's attachment directory.

- **Exclude-folder settings** (one path per line, in the plugin settings tab):
  - *Excluded folders for orphan deletion*
  - *Excluded folders for MD5 rename*
  - *Excluded folders for localize*

> **ℹ️ Orphan detection coverage:** before deciding what is unused, orphan detection now collects references from each note's **body embeds/links**, its **YAML frontmatter links** (e.g. `banner` / cover properties), and **canvas files** — across *every* note in scope, not just the active note. This is broader than the original (which only checked the active note's references), so it should produce fewer false positives. It is still a delete operation, so keep backups and test on a sample folder first.

---

## Commands

| Command | What it does |
| --- | --- |
| **Localize attachments (Plugin folder)** | Localize remote attachments for every note in the current note's folder (saves to the plugin-configured folder). |
| **Localize attachments (Obsidian folder)** | Localize remote attachments across the whole vault (saves to the Obsidian-configured folder); respects the localize exclude list. |
| **Remove all orphaned attachments (Plugin folder)** | Remove unused attachments in the current folder's attachment directory. |
| **Remove all orphaned attachments (Obsidian folder)** | Remove unused attachments vault-wide; supports `./images`-style per-note folders; respects the orphan exclude list. |
| **Rename attachments to MD5 (Plugin folder)** | Rename the current note's attachments to MD5 and rewrite references to relative paths. |
| **Rename attachments to MD5 (Obsidian folder)** | Rename per-note attachments vault-wide to MD5; respects the MD5 exclude list. |

The original utility commands are kept too (set first header as note name, convert selection to URI, convert HTML selection to Markdown).

---

## Install (personal fork)

This fork is installed manually or via BRAT, not from the Community Store.

- **BRAT (recommended):** in BRAT, *Add Beta plugin* → `huaqian0226/obsidian-local-images-plus`. Releases are tagged `<upstream>-hq.N` (current: `0.16.4-hq.2`). If you previously installed `hq.1`, remove and re-add it once so BRAT picks up `hq.2` — the old `hq.1` release reported its version as plain `0.16.4`.
- **Manual:**
  1. Build (see below), which outputs to `obsidian_local_images_plus_latest/`.
  2. Copy `main.js`, `manifest.json`, and `styles.css` into `<your-vault>/.obsidian/plugins/obsidian-local-images-plus/`.
  3. Restart Obsidian and enable the plugin in **Community plugins**.
- To avoid conflicts, disable the original *Local Images Plus* / *obsidian-local-images* if installed.

## Build from source

```bash
npm install
npm run build   # production build → obsidian_local_images_plus_latest/
npm run dev     # watch / rebuild on change
```

> Source lives in `src/*.ts`. `main.js` is generated — never edit it by hand; change the source and rebuild.

---

## Acknowledgements

Huge thanks to **[Sergei Korneev](https://github.com/Sergei-Korneev)** and the original *Local Images Plus*, which does all the heavy lifting this fork builds on — and to the lineage it grew from:

- [niekcandaele/obsidian-local-images](https://github.com/niekcandaele/obsidian-local-images)
- [aleksey-rezvov/obsidian-local-images](https://github.com/aleksey-rezvov/obsidian-local-images)
- [Sergei-Korneev/obsidian-local-images-plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus) (author credits: *catalysm, aleksey-rezvov, Sergei Korneev*)

If you find the base plugin useful, please support the original author: [Buy Me a Coffee](https://www.buymeacoffee.com/sergeikorneev).

## License

This fork inherits the original project's license — see [`LICENSE`](./LICENSE). All original copyright and attribution remain with the upstream authors.
