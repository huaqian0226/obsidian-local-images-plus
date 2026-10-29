export default {
  "Show notifications": "顯示通知",
  "Show notifications when pages were processed.": "頁面處理完成時顯示通知。",
  "Context menu: download single image": "右鍵選單: 下載單張圖片",
  "Show 'Download this image' when right-clicking a remote image in Live Preview. Downloads only that image and replaces its link.":
    "在即時預覽中右鍵點擊遠程圖片時顯示'下載此圖片'。僅下載該圖片並替換其連結。",
  "Disable additional commands": "停用額外指令",
  "Do not show additional commands in command palette. Reload the plugin in settings to take effect (turn off/on).":
    "在命令面板中不顯示額外指令。在設定中重新載入外掛以生效（關閉/開啟）。",
  "Automatic processing": "自動處理",
  "Process notes on create/copy/paste.": "建立/複製/貼上時處理筆記。",
  "Process images in frontmatter": "處理 Frontmatter 中的圖片",
  "Download and localize image links in the YAML frontmatter. When disabled the frontmatter block is left untouched ('source' key is still used as referer for body images).":
    "下載並本地化 YAML frontmatter 中的圖片連結。停用時 frontmatter 區塊保持不變（'source' 鍵仍用作正文圖片的參考來源）。",
  "Automatic processing interval": "自動處理間隔",
  "Interval in seconds for processing update. It takes some time to reveal changed content of a note to plugins.":
    "處理更新的間隔（秒）。外掛需要一些時間來偵測筆記的變更內容。",
  "Number of retries for every single attachment": "每個附件的重試次數",
  "If an error occurs during downloading (network etc.) try to re-download several times.":
    "如果下載過程中發生錯誤（網路等），嘗試重新下載多次。",
  "Process all new markdown files": "處理所有新的 Markdown 檔案",
  "Process all new created/cloud-synced files with corresponding extensions.":
    "處理所有新建/雲同步的、具有對應副檔名的檔案。",
  "Process all new attachments": "處理所有新附件",
  "The plugin will also move all attachments from obsidian default folder to plugin folder.":
    "外掛也會將所有附件從 Obsidian 預設資料夾移動到外掛資料夾。",
  "File name template": "檔案名稱範本",
  "Template for new attachment names. Variables: ${md5}, ${md5:N}, ${originalname}, ${notename}, ${date}, ${unique}. Default: ${md5}_MD5 (backward compatible). Examples: ${originalname}, ${notename}-${originalname}, ${date}-${md5:8}. Use 'Folder to save new attachments' for subfolders.":
    "新附件名稱範本。變數：${md5}, ${md5:N}, ${originalname}, ${notename}, ${date}, ${unique}。預設：${md5}_MD5（向後相容）。範例：${originalname}, ${notename}-${originalname}, ${date}-${md5:8}。使用'儲存新附件的資料夾'設定子資料夾。",
  "Use markdown link format with angle brackets ![](<link>)":
    "使用帶尖括號的 Markdown 連結格式 ![](<link>)",
  "Force using markdown link format with angle brackets instead of encoded URI when generating links.":
    "產生連結時強制使用帶尖括號的 Markdown 連結格式，而不是編碼的 URI。",
  "Process Canvas files": "處理 Canvas 檔案",
  "Process images in Obsidian Canvas (.canvas files)":
    "處理 Obsidian Canvas (.canvas 檔案) 中的圖片",
  "URL exclude regexps": "URL 排除正則表示式",
  "One per line: regexps to exclude URLs when downloading. Examples:\n^https://example\\.com/.*\n.*ads\\..*":
    "每行一個：下載時排除 URL 的正則表示式。範例：\n^https://example\\.com/.*\n.*ads\\..*",
  "Download unknown filetypes": "下載未知檔案類型",
  "Download unknown filetypes and save them with .unknown extension.":
    "下載未知檔案類型並以 .unknown 副檔名儲存。",
  "Compress images (Web Images)": "壓縮圖片 (網路圖片)",
  "Compress all downloaded images. May reduce file size by several times, but can also affect performance.":
    "壓縮所有下載的圖片。可將檔案大小減少數倍，但也可能影響效能。",
  "Compress images (Pasted Images)": "壓縮圖片 (貼上圖片)",
  "Compress all pasted images. May reduce file size by several times, but can also affect performance.":
    "壓縮所有貼上的圖片。可將檔案大小減少數倍，但也可能影響效能。",
  "Compression type": "壓縮類型",
  "Select image compression type. Keep in mind that webp format has image size limitations.":
    "選擇圖片壓縮類型。請注意 WebP 格式有圖片尺寸限制。",
  "Excluded folders": "排除資料夾",
  "Excluded folders. New files in these folders will not be processed automatically.":
    "排除資料夾。這些資料夾中的新檔案不會被自動處理。",
  "Image Quality": "圖片品質",
  "Image quality selection (30 to 100).": "圖片品質選擇 (30 到 100)。",
  "File size lower limit in Kb": "檔案大小下限 (KB)",
  "Do not download files with size less than this value. Set 0 for no limit.":
    "不下載小於此值的檔案。設為 0 表示無限制。",
  Exclusions: "排除項",
  "The plugin will not download attachments with these extensions.":
    "外掛不會下載這些副檔名的附件。",
  "Do not create Obsidian attachment folder (For compatibility with other plugins)":
    "不建立 Obsidian 附件資料夾（為與其他外掛相容）",
  "The plugin will not create an Obsidian attachments folder. This may cause the plugin to behave incorrectly. ":
    "外掛不會建立 Obsidian 附件資料夾。這可能導致外掛行為異常。",
  "Preserve link captions": "保留連結標題",
  "Add media links captions to converted tags.":
    "將媒體連結標題新增到轉換後的標籤。",
  "Include pattern": "包含模式",
  "Include only files with extensions only matching this pattern. Example: md|canvas":
    "僅包含副檔名符合此模式的檔案。範例：md|canvas",
  "Remove files completely": "完全刪除檔案",
  "Do not move orphaned files into the garbage can.":
    "不將孤立檔案移入資源回收筒。",
  "How to write paths in tags": "標籤中路徑的寫法",
  "Select whether to write full paths in tags or not.":
    "選擇是否在標籤中寫入完整路徑。",
  "Date format": "日期格式",
  "Date format for ${date} variable. E.g. \n                  | MMMM Do YYYY, h:mm:ss a (March 20th 2024, 10:54:46 am) \n                  | dddd  (Wednesday)\n                  | MMM Do YY  (Mar 20th 24)":
    "${date} 變數的日期格式。例如：\n                  | MMMM Do YYYY, h:mm:ss a (2024年3月20日, 10:54:46) \n                  | dddd  (星期三)\n                  | MMM Do YY  (3月 20 24)",
  "Folder to save new attachments": "儲存新附件的資料夾",
  "Select where all new attachments will be saved.\nYou can use templates e.g. _resouces/${date}/${notename}":
    "選擇所有新附件的儲存位置。\n可使用範本，如 _resources/${date}/${notename}",
  "Move/delete/rename media folder": "移動/刪除/重命名媒體資料夾",
  "Rename or move this folder to the obsidian or system garbage can when the associated note is deleted/renamed/moved. \n                  This setting takes effect only if the path contains ${notename} template at the end\n                  and the options 'Next to note in the folder specified below' / 'Relative to note' are selected.\n                  Use this setting at your own risk.":
    "當關聯筆記被刪除/重命名/移動時，重命名或移動此資料夾到 Obsidian 或系統資源回收筒。\n                  此設定僅在路徑以 ${notename} 範本結尾\n                  且勾選'下方指定資料夾中緊鄰筆記' / '相對於筆記'選項時生效。\n                  自擔風險使用。",
  "Media folder": "媒體資料夾",
  "Folder to keep all downloaded media files.":
    "儲存所有下載媒體檔案的資料夾。",
  Debug: "除錯",
  "Enable debug output to console.": "啟用主控台除錯輸出。",
  "Interface settings": "介面設定",
  "Processing settings": "處理設定",
  "Note settings": "筆記設定",
  "Orphaned attachments": "孤立附件",
  "Media folder settings": "媒體資料夾設定",
  Troubleshooting: "疑難排解",
  "The value should be a positive integer number between 5 and 3600!":
    "值必須是 5 到 3600 之間的正整數！",
  "The value should be a positive integer number between 1 and 6!":
    "值必須是 1 到 6 之間的正整數！",
  "File name template cannot contain path separators. Use 'Folder to save new attachments' to set subfolders.":
    "檔案名稱範本不能包含路徑分隔符。使用'儲存新附件的資料夾'設定子資料夾。",
  "The value should be a positive integer number between 10 and 100!":
    "值必須是 10 到 100 之間的正整數！",
  "The value should be a positive integer!": "值必須是正整數！",
  "Unsafe regex! https://www.npmjs.com/package/safe-regex":
    "不安全的正則表示式！ https://www.npmjs.com/package/safe-regex",
  "Unsafe folder name! Some chars are forbidden in some filesystems.":
    "不安全的資料夾名稱！某些字符在某些檔案系統中被禁止。",
  WebP: "WebP",
  JPEG: "JPEG",
  "Full path": "完整路徑",
  "Relative to note": "相對於筆記",
  "Only filename": "僅檔案名稱",
  "Copy Obsidian settings": "複製 Obsidian 設定",
  "In the root folder specified below": "在下方指定的根資料夾中",
  "Next to note in the folder specified below": "在下方指定資料夾中緊鄰筆記",

  "Cannot copy/download an attachment! Try to add referer in frontmatter 'source' field.": "無法複製/下載附件！請嘗試在 frontmatter 的 'source' 欄位中新增 referer。",

  "Attachment folder was renamed to {p}": "附件資料夾已重新命名為 {p}",

  "Attachment folder {p} was moved to trash can.": "附件資料夾 {p} 已移至垃圾桶。",

  "Attachments for '{p}' were processed.": "已處理 '{p}' 的附件。",

  "Cannot get current note! ": "無法獲取當前筆記! ",

  "Cannot get current note/canvas!": "無法獲取當前筆記/canvas!",

  "Cannot move attachment folder: \r\n{p}": "無法移動附件資料夾: \r\n{p}",

  "Cannot rename.": "無法重命名。",

  "Frontmatter of '{p}' skipped (parse error)": "已跳過 '{p}' 的 frontmatter（解析錯誤）",

  "Image downloaded and linked in '{p}'.": "圖片已下載並在 '{p}' 中連結。",

  "Media links were found, processing...": "找到媒體連結，正在處理...",

  "No orphaned files found!": "未找到孤立檔案!",

  "Page '{p}' has been processed, but nothing was changed.": "頁面 '{p}' 已處理，但無變化。",

  "Please select a note or click inside selected note in canvas.": "請選擇一條筆記或在畫布中點擊選中的筆記。",

  "Please, select a note or click inside a note in canvas!": "請選擇一條筆記或在畫布中點擊筆記!",

  "Remote image not found in '{p}' or it is already local.": "在 '{p}' 中未找到遠程圖片或其已為本地圖片。",

  "Single image download failed: {p}": "單張圖片下載失敗: {p}",

  "The attachment folder {p} does not exist!": "附件資料夾 {p} 不存在!",

  "The note was renamed to {p}": "筆記已重新命名為 {p}",

  "This command cannot run on vault's root or on subfolder next to note!\nPlease, change settings first!\r\n": "此命令無法在 vault 根目錄或筆記旁的子資料夾中運行!\n請先更改設置!\r\n",

  "This command requires the settings 'Next to note in the folder specified below' and pattern '${notename}' at the end to be enabled, also the path cannot contain ${date} pattern.\nPlease, change settings first!\r\n": "此命令需要啟用設置 '下方指定資料夾中的筆記旁' 和末尾的 '${notename}' 模式，路徑也不能包含 ${date} 模式。\n請先更改設置!\r\n",

  "WARNING!\r\nAttachments for \'{p}\' were processed, but some attachments were not downloaded/replaced...": "警告!\r\n已處理 \'{p}\' 的附件，但某些附件未下載/替換...",

  "You obsidian media folder set to {p}, and has been created by the plugin. Please, try again.": "您的 Obsidian 媒體資料夾設置為 {p} 並由外掛程式建立。請重試。",

  "{p} attachments for note {p} were processed.": "已處理筆記 {p} 的 {p} 個附件。",

  "{p} file(s) {p}": "{p} 個檔案 {p}",

  // HQ fork commands, previews and safety summaries.
  "Localize attachments (Plugin folder)": "本地化附件（外掛目錄）",
  "Localize attachments (Obsidian folder)": "本地化附件（Obsidian 目錄）",
  "Remove all orphaned attachments (Plugin folder)": "移除全部孤立附件（外掛目錄）",
  "Remove all orphaned attachments (Obsidian folder)": "移除全部孤立附件（Obsidian 目錄）",
  "Rename attachments to MD5 (Plugin folder)": "依 MD5 重新命名附件（外掛目錄）",
  "Rename attachments to MD5 (Obsidian folder)": "依 MD5 重新命名附件（Obsidian 目錄）",
  "Please, select a markdown note first.": "請先選擇 Markdown 筆記或 Canvas。",
  "This folder is excluded from localize.": "此目錄已排除本地化。",
  "This command cannot run on vault root.\nPlease, change settings first!\r\n": "此命令無法對儲存庫根目錄執行。\n請先變更設定！\r\n",
  "Invalid Obsidian attachment folder path.\r\n": "Obsidian 附件目錄路徑無效。\r\n",
  "No remote attachments found across all notes — nothing to localize.": "所有筆記中均未發現遠端附件，無需本地化。",
  "This command requires a per-note attachment path (e.g. './images').\nUse 'Rename attachments to MD5 (Obsidian folder)' to scan all sibling folders.\r\n": "此命令需要筆記旁的附件路徑（如 './images'）。\n處理多個目錄請使用「依 MD5 重新命名附件（Obsidian 目錄）」；該命令也要求 './…' 路徑。\r\n",
  "Path pattern cannot contain ${date}.\nPlease change the mediaRootDir setting.\r\n": "路徑範本不能含有 ${date}。\n請變更 mediaRootDir 設定。\r\n",
  "This command requires a per-note attachment path (e.g. './images').\r\n": "此命令需要筆記旁的附件路徑（如 './images'）。\r\n",
  "All attachments already in MD5 format!": "所有附件均已採用 MD5 檔名！",
  "No remote attachments found in \"{p}\" — nothing to localize.": "目錄「{p}」中未發現遠端附件，無需本地化。",
  "{p} → {p} link(s)": "{p} → {p} 個連結",
  "Localize {p} remote link(s) across {p} note(s) in folder:\r\n  {p}": "本地化此目錄中 {p} 個遠端連結，涉及 {p} 篇筆記：\r\n  {p}",
  "Confirm removal of orphaned attachments:": "確認移除孤立附件：",
  "{p} → {p} file(s)": "{p} → {p} 個檔案",
  "HTML-linked files may also be selected. Review the candidates before confirming.": "透過 HTML 引用的檔案也可能被選中，請確認候選附件後再執行。",
  "{p} file(s) were deleted completely.": "已永久刪除 {p} 個檔案。",
  "{p} file(s) were moved to the system garbage can.": "已將 {p} 個檔案移至系統垃圾桶。",
  "{p} file(s) were moved to the Obsidian garbage can.": "已將 {p} 個檔案移至 Obsidian 垃圾桶。",
  "Localize {p} remote link(s) across {p} note(s)": "本地化 {p} 個遠端連結，涉及 {p} 篇筆記",
  "{p} attachment(s) renamed to MD5 format. {p} failed, {p} skipped. {p} note update(s) failed.": "已依 MD5 重新命名 {p} 個附件。失敗 {p} 個，略過 {p} 個。筆記更新失敗 {p} 篇。",
  "Confirm MD5 rename:\r\n  {p} → {p} file(s)\r\n  Notes to update → {p}": "確認依 MD5 重新命名：\r\n  {p} → {p} 個檔案\r\n  待更新筆記 → {p}",
  "(vault root)": "（儲存庫根目錄）",
  "Rename {p} attachment(s) to MD5 format ({p} folder(s) scanned)": "依 MD5 重新命名 {p} 個附件（已掃描 {p} 個目錄）",
  "Excluded folders for orphan deletion": "孤立附件清理排除目錄",
  "Attachment folders excluded from orphan deletion. One path per line; references from all notes still count.": "不參與孤立附件清理的附件目錄，每行一個路徑；仍統計所有筆記的引用。",
  "Excluded folders for MD5 rename": "MD5 重新命名排除目錄",
  "Folders excluded from 'Rename attachments to MD5 (Obsidian folder)'. One path per line.": "不參與全庫 MD5 重新命名的筆記目錄，每行一個路徑。",
  "Excluded folders for localize": "附件本地化排除目錄",
  "Note folders excluded from both localize commands. One path per line.": "兩個本地化命令均略過的筆記目錄，每行一個路徑。",
  "Enter one full folder path per line, e.g. Archive/Keep": "每行輸入一個完整目錄路徑，例如 Archive/Keep",
  "Cancel": "取消",
  "Confirm": "確認",
  "OK": "確定",
};