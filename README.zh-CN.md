# Local Images Plus — `my-features` 个人分支

> [English](./README.md) | 简体中文

这是对优秀插件 **[Local Images Plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)**（[Obsidian](https://obsidian.md/) 插件）的个人分支，按我自己的 vault 和工作流做了定制。

原插件负责把笔记中的外链媒体下载/本地化、把附件保存到本地、用 MD5 去重、并清理孤立附件。**这些核心能力的功劳全部归于原作者**（见 [致谢](#致谢)）。本分支只是在其之上加了一些顺手的小改进。

> ⚠️ 本分支与原项目**无官方关联**，也**未**发布到 Obsidian 社区插件商店，仅供个人使用。请自担风险，并**务必做好备份**——其中若干命令会批量修改或删除文件。

---

## 本分支新增的内容

- **所有批量操作都先确认再执行。** 本地化（Localize）、孤儿清理（Orphan）、MD5 重命名（Rename）现在都会**先预扫描**，在弹窗里逐行列出将要影响的对象（按笔记 / 按文件夹计数），确认之后**才会**真正动文件。

- **本地化支持文件夹 / 全库范围：**
  - `Localize attachments (Plugin folder)`：扫描**当前笔记所在文件夹内的所有笔记**，而不只是当前这一篇。
  - `Localize attachments (Obsidian folder)`：扫描**整个 vault**，并遵守「localize 排除列表」。
  - 旧的第三个「all notes」命令已被合并——本地化命令从 **3 个收敛为 2 个**。

- **新增——按 MD5 重命名附件：**
  - `Rename attachments to MD5 (Plugin folder)` 与 `Rename attachments to MD5 (Obsidian folder)`：把附件重命名为其 MD5 签名，并**把笔记中的链接改写为相对路径**。

- **更智能的孤儿清理：**
  - 支持「笔记同级」的附件子目录（例如 `./images`），并**按文件夹**分组统计、报告孤儿。
  - Plugin folder 模式会扫描共用同一附件目录的同文件夹内所有笔记。

- **排除文件夹设置**（在插件设置页，每行一个路径）：
  - *Excluded folders for orphan deletion*（孤儿清理排除）
  - *Excluded folders for MD5 rename*（MD5 重命名排除）
  - *Excluded folders for localize*（本地化排除）

> **ℹ️ 孤儿检测的覆盖范围：** 在判断哪些附件未被使用之前，孤儿检测会综合每篇笔记的**正文嵌入/链接**、**YAML frontmatter 中的链接**（如 `banner` / 封面属性）以及 **canvas 文件**中的引用——并覆盖范围内的*所有*笔记，而不只是当前这一篇。这比原版（只检查当前笔记的引用）更全面，误判更少。但它终究是删除操作，请先备份并在小范围文件夹上测试。

---

## 命令一览

| 命令 | 作用 |
| --- | --- |
| **Localize attachments (Plugin folder)** | 把当前笔记所在文件夹内每篇笔记的外链附件本地化（保存到插件配置的目录）。 |
| **Localize attachments (Obsidian folder)** | 在整个 vault 范围本地化外链附件（保存到 Obsidian 配置的目录）；遵守 localize 排除列表。 |
| **Remove all orphaned attachments (Plugin folder)** | 清理当前文件夹附件目录中未被使用的附件。 |
| **Remove all orphaned attachments (Obsidian folder)** | 全库清理未使用附件；支持 `./images` 这类笔记同级目录；遵守孤儿排除列表。 |
| **Rename attachments to MD5 (Plugin folder)** | 把当前笔记的附件重命名为 MD5，并将引用改写为相对路径。 |
| **Rename attachments to MD5 (Obsidian folder)** | 全库按笔记把附件重命名为 MD5；遵守 MD5 排除列表。 |

原有的辅助命令也予以保留（把首个标题设为笔记名、把选区转为 URI、把 HTML 选区转为 Markdown）。

---

## 安装（个人分支）

本分支通过手动方式或 BRAT 安装，而非社区商店。

- **BRAT（推荐）：** 在 BRAT 里 *Add Beta plugin* → `huaqian0226/obsidian-local-images-plus`。release 以 `<上游版本>-hq.N` 形式打 tag（当前 `0.16.4-hq.2`）。如果你之前装过 `hq.1`，请先移除再重新添加一次，BRAT 才能识别到 `hq.2`——旧的 `hq.1` release 报告的版本是普通的 `0.16.4`。
- **手动安装：**
  1. 构建（见下文），产物输出到 `obsidian_local_images_plus_latest/`。
  2. 把 `main.js`、`manifest.json`、`styles.css` 复制到 `<你的-vault>/.obsidian/plugins/obsidian-local-images-plus/`。
  3. 重启 Obsidian，并在**社区插件**中启用。
- 为避免冲突，请先停用已安装的原版 *Local Images Plus* / *obsidian-local-images*。

## 从源码构建

```bash
npm install
npm run build   # 生产构建 → obsidian_local_images_plus_latest/
npm run dev     # 监听 / 改动即重建
```

> 源码在 `src/*.ts`。`main.js` 是生成产物——切勿手改，请修改源码后重新构建。

---

## 致谢

衷心感谢 **[Sergei Korneev](https://github.com/Sergei-Korneev)** 以及原版 *Local Images Plus*——本分支所有真正繁重的工作都建立在它之上；也感谢这一脉相承的前作：

- [niekcandaele/obsidian-local-images](https://github.com/niekcandaele/obsidian-local-images)
- [aleksey-rezvov/obsidian-local-images](https://github.com/aleksey-rezvov/obsidian-local-images)
- [Sergei-Korneev/obsidian-local-images-plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)（作者署名：*catalysm, aleksey-rezvov, Sergei Korneev*）

如果你觉得原插件好用，请支持原作者：[Buy Me a Coffee](https://www.buymeacoffee.com/sergeikorneev)。

## 许可证

本分支沿用原项目的许可证——见 [`LICENSE`](./LICENSE)。所有原始版权与署名归上游作者所有。
