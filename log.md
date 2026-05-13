# Local Images Plus — Feature Patch Log

## 本次目标

在原始插件基础上，新增以下功能：
1. Orphan deletion、Rename MD5、Localize 的功能增强；
2. Localize 三个入口都增加确认流程；
3. Orphan deletion / Rename MD5 / Localize 的全局模式都支持排除路径（exclude paths）。

---

## 新增功能总览

1. **Rename attachments to MD5**
   - 新增两个命令：
     - `rename-attachments-md5-plugin`
     - `rename-attachments-md5-obsidian`
   - 支持先预览再执行（确认 modal），并同步更新笔记中的文件引用。

2. **Localize 三个入口确认 modal**
   - 当前笔记（plugin folder）本地化：先统计远程链接数，再确认执行。
   - 当前笔记（Obsidian folder）本地化：同样先统计再确认。
   - 全库本地化（all notes）：先预扫描、列出涉及笔记与链接数量，再确认执行。

3. **全局 exclude path 支持**
   - 新增 3 个设置项（每行一个路径）：
     - `ExcludeOrphanFoldersList`
     - `ExcludeRenameFoldersList`
     - `ExcludeLocalizeFoldersList`
   - 分别用于：
     - 全局 orphan 删除排除目录
     - 全局 MD5 重命名排除目录
     - 全局 localize 排除目录

---

## main.js 代码变更明细

### 1) 默认设置新增字段

在 `DEFAULT_SETTINGS` 中新增：
- `ExcludeOrphanFoldersList`
- `ExcludeRenameFoldersList`
- `ExcludeLocalizeFoldersList`

对应位置：`main.js` 约 `L6418-L6420`。

### 2) 设置页新增 3 个排除路径输入框

在设置 UI 中新增三个 `TextArea`：
- Excluded folders for orphan deletion
- Excluded folders for MD5 rename
- Excluded folders for localize

对应位置：`main.js` 约 `L14163-L14204`。

### 3) Localize 当前笔记增加确认流程（两个命令共用）

`processActivePage(defaultdir)` 改为：
1. 读取当前 note；
2. 用 `MD_SEARCH_PATTERN` 预统计远程链接数量；
3. 若为 0，提示“nothing to localize”；
4. 若 >0，弹出确认 modal，确认后才执行 `processPage`。

对应位置：`main.js` 约 `L20713-L20737`。

### 4) Localize 全局模式增强（确认 + 明细 + 排除目录）

`openProcessAllModal` 改为异步预扫描流程：
1. 读取 `ExcludeLocalizeFoldersList`；
2. 过滤掉排除目录下的 markdown；
3. 逐 note 统计远程链接数量；
4. 无匹配时直接提示；
5. 有匹配时在 modal 中列出“note path -> N link(s)”后确认执行。

对应位置：`main.js` 约 `L20948-L20980`。

### 5) Orphan deletion 全局模式增加排除目录

在 `removeOrphans("obsidian")` 分支中新增：
- 解析 `ExcludeOrphanFoldersList`
- 判断 `isOrphanExcluded(parentPath)`
- 跳过排除目录文件

对应位置：`main.js` 约 `L20837-L20846`。

### 6) Rename MD5 功能实现与命令注册

新增 `renameMD5(type, filesToRename, notesToUpdate)` 主流程：
- `plugin` 模式：处理当前 note 对应附件目录，确认后重命名并更新同目录相关笔记引用；
- `obsidian` 模式：遍历全库 per-note 附件目录，支持 `ExcludeRenameFoldersList`；
- `execrename` 模式：执行重命名并批量改写引用。

对应位置：`main.js` 约 `L20981` 起。

命令注册新增：
- `rename-attachments-md5-plugin`
- `rename-attachments-md5-obsidian`

对应位置：`main.js` 约 `L21412-L21419`。

---

## 功能测试结果

### 手动测试

用户手动测试结论：**全部通过**。

### 本地复测（代码侧）

1. `node --check main.js`：**PASS**
2. Feature smoke check（关键功能标识检索）：
   - 3 个 exclude 设置字段存在；
   - 2 个 rename MD5 command 存在；
   - `renameMD5` 主流程存在；
   - localize 预扫描/确认相关关键逻辑存在；
   - 结果：**PASS**

结论：本次新增功能在代码层和手动验证层均通过。

---

## 第二轮修改记录（对应 2026-05-10 前 4 点）

## 本轮目标

在第一轮补丁基础上，修复以下剩余问题：
1. Rename MD5 后，引用链接统一改为 relative path；
2. 所有确认 modal 中的多行内容按换行显示（一个文件夹一行）；
3. Orphan removal（plugin folder）支持 `./images` 这类 note 同级附件目录；
4. Orphan removal（obsidian folder）同样支持 `./images` 这类 note 同级附件目录。

---

## main.js 代码变更明细

### 1) 确认 modal 支持多行显示

在 `ModalW1.onOpen()` 中将消息区域改为 `pre`，并设置：
- `whiteSpace = "pre-wrap"`
- `wordBreak = "break-word"`

效果：确认弹窗中的 `\r\n` 将按行显示，不再挤成一行。

对应位置：`main.js` 约 `L20673-L20681`。

### 2) Orphan removal（plugin folder）修复 `./images` 场景

`removeOrphans("plugin")` 改为通过 `getMDir(...)` 动态计算当前 note 的实际附件目录，不再强依赖 `${notename}` 模板路径。

同时补充：
- 对排除路径（`ExcludeOrphanFoldersList`）的当前 note 目录检查；
- 确认 modal 文案改为“每个文件夹一行”的格式。

对应位置：`main.js` 约 `L20769-L20834`。

### 3) Orphan removal（obsidian folder）修复 `./images` 场景

`removeOrphans("obsidian")` 新增分支：
- 当 Obsidian 附件目录是 `./images` 这类“note 同级子目录”时，按每个 note 的父目录分组统计引用；
- 对每个 `parent/images` 文件夹分别判断 orphan；
- 确认 modal 逐文件夹显示 `folder -> N file(s)`。

保留原有“固定全局附件目录”分支，并统一确认文案格式。

对应位置：`main.js` 约 `L20846-L21057`。

### 4) Rename MD5 后链接改为 relative path

`renameMD5("execrename")` 中新增链接重写流程：
- `resolveLinkToVaultPath`：把 markdown/wiki 链接解析到 vault 路径；
- `buildRelativeLink`：按 note 位置计算新的 relative path；
- `rewriteMdLink` / `rewriteWikiLink`：仅重写命中的旧附件引用，并输出 relative path。

结果：重命名后，链接更新不再只替换文件名，而是会写入相对路径。

对应位置：`main.js` 约 `L21264-L21380`。

---

## 功能测试结果

### 手动测试

用户将手动复测（待反馈）。

### 本地复测（代码侧）

1. `rtk proxy node --check main.js`：**PASS**
2. Rename-link rewrite smoke test（Node snippet）：
   - 覆盖 markdown / wikilink / 绝对路径到相对路径重写；
   - 结果：**PASS**
3. Feature smoke check（关键逻辑标识检索）：
   - modal 多行显示逻辑存在；
   - orphan plugin/obsidian 修复分支存在；
   - rename 相对路径重写逻辑存在；
   - 结果：**PASS**

结论：第二轮针对前 4 点的问题已完成代码修复，等待用户手动验证交互效果。

---

## 第三轮修改记录（对应 2026-05-10 第 5、6 点）

## 本轮目标

修复最新回归与命令收敛需求：
1. Orphan removal（Plugin folder）恢复生效，并按“当前 note 所在文件夹内所有 note 共用附件目录”做 orphan 判定；
2. Localize 命令从 3 个收敛为 2 个：
   - `Localize attachments (Plugin folder)`：扫描当前 note 所在文件夹内所有 note；
   - `Localize attachments (Obsidian folder)`：全库扫描（并遵守 exclude）。

---

## main.js 代码变更明细

### 1) 修复 Orphan removal（Plugin folder）不生效

在 `removeOrphans("plugin")` 中：
- 去掉了导致回归的父目录读取写法，改为稳定的 `noteFile.parent.path` 获取；
- orphan 引用收集范围从“当前 note”扩展到“当前文件夹内所有 markdown note（以及同目录 canvas）”；
- 继续使用当前 note 的附件目录（`getMDir(...)`）作为判定目标目录。

效果：Plugin folder 模式会按文件夹级别正确扫描并识别 orphan。

对应位置：`main.js` 约 `L20818-L20902`。

### 2) Localize（Plugin folder）改为文件夹级扫描

`processActivePage(false)` 改为：
- 以当前 note 所在目录为范围，统计该目录内所有 markdown note 的远程链接；
- 确认 modal 中列出“每个 note 一行”的明细；
- 确认后批量处理该目录内命中的 note。

对应位置：`main.js` 约 `L20715-L20770`。

### 3) Localize（Obsidian folder）执行范围与预扫描一致

`openProcessAllModal` 执行阶段改为：
- 只处理预扫描命中的 note 列表；
- 使用 `processPage(file, true)`（Obsidian folder 模式）执行；
- 不再回退到“全库所有 markdown 都跑一遍”的旧行为。

对应位置：`main.js` 约 `L21150-L21187`。

### 4) Localize 命令收敛为 2 个

在 `onload()` 命令注册中：
- 保留并重命名：
  - `download-images` → `Localize attachments (Plugin folder)`
  - `download-images-def` → `Localize attachments (Obsidian folder)`
- 移除第三个全局命令 `download-images-all`。

对应位置：`main.js` 约 `L21661-L21689`。

---

## 功能测试结果

### 手动测试

用户将手动复测（待反馈）。

### 本地复测（代码侧）

1. `rtk proxy node --check main.js`：**PASS**
2. Feature smoke check（关键逻辑标识检索）：
   - localize 命令仅保留 2 个（plugin / obsidian）；
   - plugin orphan 分支已切换为“同目录所有 note”引用收集；
   - obsidian localize 执行已绑定到预扫描命中的 note 集合；
   - 结果：**PASS**

结论：第三轮已完成第 5、6 点修复，等待用户手动验证交互行为。
