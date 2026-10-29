# Local Images Plus — hq fork

[English](./README.md) | 简体中文

这是 hq 维护的个人 fork：[huaqian0226/obsidian-local-images-plus](https://github.com/huaqian0226/obsidian-local-images-plus)，分支为 `my-features`。媒体本地化引擎来自原版 [Local Images Plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)。本 fork 独立于上游，没有单独的社区商店条目。

本分支已合并上游 **0.17.1**，基点为 **`2b4dac116394dfab74a39c2406dea963b890bed4`**。下一计划个人版本为 **`0.17.1-hq.1`**，**本次合并尚未发布该版本**。版本元数据仍为 `0.16.4-hq.2`，由协调者另行提交升级。

## 保留的上游功能（0.17.1）

- 下载及本地化外部媒体、剪贴板内容和本地文档附件；自动处理与附件目录管理。
- 文件名模板：`${md5}`、`${md5:N}`、`${originalname}`、`${notename}`、`${date}`、`${unique}`。旧 `useMD5ForNewAtt` 会迁移到 `FileNameTemplate`，保留原有命名选择。
- 可选的 YAML 媒体下载、source/referer 处理，以及关闭该功能时保持 frontmatter 不变。
- 右键下载单张图片、编辑器拖放，以及带独立开关的 Canvas 本地化。
- `UrlExcludeRegexps`、改进的 Markdown/wikilink 解析和上游国际化。

## hq 新增功能与安全修复

- **两个本地化命令：**插件目录模式扫描当前笔记所在目录的 Markdown 笔记；当前文件为 Canvas 时只扫描该 Canvas。Obsidian 目录模式扫描全库 Markdown 笔记。两者均遵守本地化排除列表，使用各自的目标目录设置。
- **只读预扫描与确认：**以上批量本地化、孤立附件清理和 MD5 命令先在多行弹窗中显示每篇笔记/每个目录的数量。取消不会写入文件。本地化预扫描区分正文与 YAML，遵守 YAML/Canvas 开关，过滤本地 wiki 链接和排除的 URL，并消除重叠匹配的重复计数。
- **孤立附件引用：**统计 metadata cache 的 embeds、links、frontmatterLinks，以及 Canvas 的 file/text/image 节点和上游原始内容兜底。同级 `./images` 目录按笔记父目录分组。
- **孤立附件安全修复：**所有 Markdown 与 Canvas 文件的引用均计入，包括被排除目录中的笔记和当前目录之外的笔记。孤立附件排除列表只限制候选附件路径/目录，不会跳过引用收集，避免误删固定全局附件目录中仍被使用的文件。
- **MD5 批量重命名：**插件目录模式扫描当前笔记的附件目录；Obsidian 目录模式扫描全库各笔记的同级附件目录。常见 Markdown/wikilink 改写为相对路径，同时保留 query、heading 和 alias 后缀。
- **重命名安全修复：**只有成功重命名的文件才进入链接改写列表。已有目标与相同哈希碰撞会跳过，不覆盖文件；发生错误时保留原链接。结果通知统计成功、失败、跳过及笔记更新失败数量。
- **三组独立目录排除列表：**每行一个完整的库内相对路径，包含子目录；分别控制孤立附件候选、全库 MD5 重命名的笔记目录、两个本地化命令的笔记目录。旧的自动处理目录排除与 URL 正则排除仍独立保留。
- **hq 界面翻译：**命令、设置、预扫描、弹窗和通知使用英文句子键，并提供简体与繁体中文。其他已支持语言缺少 hq 翻译时回退到英文并保留参数。加载时保留现有 `0.16.4-hq.2` 设置。

## 命令

下表保留英文命令名，中文界面会显示对应译文。

| 命令 | 范围与目标目录 |
| --- | --- |
| Localize attachments (Plugin folder) | 当前目录的 Markdown 笔记，或当前 Canvas；保存至插件配置的目录。 |
| Localize attachments (Obsidian folder) | 全库未排除的 Markdown 笔记；保存至 Obsidian 配置的目录。 |
| Remove all orphaned attachments (Plugin folder) | 当前笔记配置的附件目录；全库引用保护候选附件。 |
| Remove all orphaned attachments (Obsidian folder) | 固定附件目录，或同级 `./images` 分组；跳过排除的候选路径。 |
| Rename attachments to MD5 (Plugin folder) | 当前笔记的附件目录；改写同目录 Markdown 笔记。 |
| Rename attachments to MD5 (Obsidian folder) | 所有未排除的笔记目录；要求 Obsidian 附件路径为 `./…`；改写这些目录中的 Markdown 笔记。 |

保留辅助命令：以首个标题命名笔记、将选区编码为 URI、将选中的 HTML 转为 Markdown。MD5 重命名不是通用的 Canvas/跨目录链接迁移工具。批量删除或重命名前请备份附件；重名文件和 HTML 链接会限制孤立附件判断的准确度。

## 已知上游限制与验证范围

上游 Canvas **裸 URL** 本地化分支按要求保持不变：它把单个正则传给 `replaceAsync`，可能抛出 `regex.forEach is not a function`。Canvas 内容为 `{"nodes":[{"type":"link","url":"https://example.com/x.png"}]}`，且第一轮 Markdown 模式处理没有改动时即可复现。这也仍是一条 TypeScript 诊断。

自动测试使用内存 vault 和 Obsidian API 替身。此合并构建尚未验证真实 Obsidian 启停、网络下载、编辑器拖放/右键或 BRAT 安装。构建能生成 JavaScript，但仍存在上游 TypeScript 诊断；`npm test` 通过不表示 Canvas bug 已修复，其测试明确断言该已知错误。

## BRAT 安装——待后续版本发布

`0.17.1-hq.1` 是计划版本，本 README 不承诺目前已有可下载资产。协调者发布可安装资产后：

1. 备份现有插件设置/数据。fork 保留原插件 ID `obsidian-local-images-plus`，会替换原实例，不能并列安装。
2. 打开 **设置 → BRAT → Add beta plugin**，输入 `huaqian0226/obsidian-local-images-plus`。
3. 待 `v0.17.1-hq.1` 发布后选中该版本，安装并启用。批量操作前确认实际安装版本及设置是否保留。

本地构建在 `obsidian_local_images_plus_latest/` 输出 `main.js`、`manifest.json`、`styles.css`。本次合并不部署到任何 vault。

## 开发

```sh
npm ci
npm run build
node --check obsidian_local_images_plus_latest/main.js
npm test
npx tsc --noEmit -p .
```

最后一条命令目前仍报告上游诊断。本次合并与测试未升级依赖。修改 `src/` 下的 TypeScript 后重新构建，不要手改生成的 bundle。`npm run version` 根据 `package.json` 同步两个 manifest 与 `versions.json`；版本升级由维护者另行操作。

## 致谢与许可证

原作者：**catalysm、aleksey-rezvov、Sergei Korneev**。原插件 ID 和作者保持不变。上游沿袭自：

- [niekcandaele/obsidian-local-images](https://github.com/niekcandaele/obsidian-local-images)
- [aleksey-rezvov/obsidian-local-images](https://github.com/aleksey-rezvov/obsidian-local-images)
- [Sergei-Korneev/obsidian-local-images-plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)

支持上游作者：[Buy Me a Coffee](https://www.buymeacoffee.com/sergeikorneev)。

使用本软件即表示接受原版[许可协议](./LICENSE)的条款。作者没有义务提供支持，也不承担责任。本 fork 继承原项目许可证，保留全部原版权及署名声明。
