import {
  Notice,
  Plugin,
  TFile,
  Editor,
  htmlToMarkdown,
  MarkdownView,
  TFolder,
} from "obsidian"

import SettingTab from "./settingstab"

import {
  imageTagProcessor,
  getMDir,
  getRDir,
} from "./contentProcessor"

import {
  replaceAsync,
  cFileName,
  md5Sig,
  trimAny,
  logError,
  showBalloon,
  displayError,
  encObsURI,
  pathJoin,
  blobToJpegArrayBuffer,
  getFileExt,
  readFromDiskB,
  readFromDisk,
  normalizePath,
  parseExcludePaths,
  isPathInExcludedFolders,
  countRemoteLinksInContent
} from "./utils"

import {
  APP_TITLE,
  ISettings,
  DEFAULT_SETTINGS,
  MD_SEARCH_PATTERN,
  NOTICE_TIMEOUT,
  TIMEOUT_LIKE_INFINITY,
  TIME_DIFF
} from "./config"

import { UniqueQueue } from "./uniqueQueue"
import path from "path"
import { ModalW1 } from "./modal"
import { isNull } from "util"
const fs = require('fs').promises;






//import { count, log } from "console"

interface RenamePlanItem {
  oldPath: string
  newPath: string
  oldName: string
  newName: string
}


export default class LocalImagesPlugin extends Plugin {
  settings: ISettings
  modifiedQueue = new UniqueQueue<TFile>()
  intervalId = 0
  newfProcInt: number
  newfCreated: Array<string> = []
  noteModified: Array<TFile> = []
  newfMoveReq: boolean = true
  newfCreatedByDownloader: Array<string> = []



  async onload() {

    await this.loadSettings()

    this.addCommand({
      id: "download-images",
      name: "Localize attachments (Plugin folder)",
      callback: this.processActivePage(false),
    })


    this.addCommand({
      id: "download-images-def",
      name: "Localize attachments (Obsidian folder)",
      callback: this.openProcessAllModal,
    })

    if (!this.settings.disAddCom) {

      this.addRibbonIcon("dice", APP_TITLE + "\r\nLocalize attachments (plugin folder)", () => {
        this.processActivePage(false)()
      });

      this.addCommand({
        id: "set-title-as-name",
        name: "Set the first found # header as a note name.",
        callback: this.setTitleAsName,
      })

      this.addCommand({
        id: "convert-selection-to-URI",
        name: "Convert selection to URI",
        callback: this.convertSelToURI,
      })

      this.addCommand({
        id: "convert-selection-to-md",
        name: "Convert selection from html to markdown",
        callback: this.convertSelToMD,
      })

      this.addCommand({
        id: "remove-orphans-from-obsidian-folder",
        name: "Remove all orphaned attachments (Obsidian folder)",
        callback: () => { this.removeOrphans("obsidian")() },
      })

      this.addCommand({
        id: "remove-orphans-from-plugin-folder",
        name: "Remove all orphaned attachments (Plugin folder)",
        callback: () => { this.removeOrphans("plugin")() },
      })

      this.addCommand({
        id: "rename-attachments-md5-plugin",
        name: "Rename attachments to MD5 (Plugin folder)",
        callback: () => { this.renameMD5("plugin")() },
      })

      this.addCommand({
        id: "rename-attachments-md5-obsidian",
        name: "Rename attachments to MD5 (Obsidian folder)",
        callback: () => { this.renameMD5("obsidian")() },
      })
    }





    // Some file has been created

    this.app.vault.on('create', async (file: TFile) => {
      
      logError("New file created: " + file.path)

      if (this.ExemplaryOfMD(file.path) && !this.ThePathExcluded(String(file.parent?.path))){
        this.onMdCreateFunc(file)
      } else{
        this.onFCreateFunc(file)
      }

    })


    // Some file has been deleted

    this.app.vault.on('delete', async (file: TFile) => {
 
      if (!file ||
        !(file instanceof TFile) ||
        !(this.ExemplaryOfMD(file.path)) ||
        !this.settings.removeMediaFolder ||
        this.settings.saveAttE != "nextToNoteS") {
        return
      }


      let rootdir = this.settings.mediaRootDir
      const useSysTrash = (this.app.vault.getConfig("trashOption") === "system")
    
      if (this.settings.saveAttE !== "obsFolder" &&
        path.basename(rootdir).includes("${notename}") &&
        !rootdir.includes("${date}")) {

        rootdir = rootdir.replace("${notename}", file.basename)

        if (this.settings.saveAttE == "nextToNoteS") {
          rootdir = pathJoin([path.dirname(file?.path || ""), rootdir])
        }

        try {
          if (this.app.vault.getAbstractFileByPath(rootdir) instanceof TFolder) {
            this.app.vault.trash(app.vault.getAbstractFileByPath(rootdir), useSysTrash)
            showBalloon("Attachment folder " + rootdir + " was moved to trash can.", this.settings.showNotifications)
          }
        } catch (e) {
          logError(e)
          return
        };
      }
    })



    this.app.vault.on('rename', async (file: TFile, oldPath: string) => {
     
      if (!file ||
        !(file instanceof TFile) ||
        !this.ExemplaryOfMD(file.path) ||
        this.ThePathExcluded(String(file.parent?.path)) ||
        !this.settings.removeMediaFolder ||
        this.settings.saveAttE != "nextToNoteS" ||
        this.settings.pathInTags != "onlyRelative") {
        return
      }

      let oldRootdir = this.settings.mediaRootDir

      if (path.basename(oldRootdir).includes("${notename}") &&
        !oldRootdir.includes("${date}")) {

        oldRootdir = oldRootdir.replace("${notename}", path.parse(oldPath)?.name)
        let newRootDir = oldRootdir.replace(path.parse(oldPath)?.name, path.parse(file.path)?.name)
        let newRootDir_ = newRootDir
        let oldRootdir_ = oldRootdir

        oldRootdir_ = pathJoin([(path.dirname(oldPath) || ""), oldRootdir])
        newRootDir_ = pathJoin([(path.dirname(file.path) || ""), newRootDir])


        try {
          if (this.app.vault.getAbstractFileByPath(oldRootdir_) instanceof TFolder) {
            await this.ensureFolderExists(path.dirname(newRootDir_))
            //await this.app.fileManager.renameFile(app.vault.getAbstractFileByPath(oldRootdir),newRootDir)
            await this.app.vault.adapter.rename(oldRootdir_, newRootDir_)
            showBalloon("Attachment folder was renamed to " + newRootDir_, this.settings.showNotifications)
          }
        } catch (e) {
          showBalloon("Cannot move attachment folder: \r\n" + e, this.settings.showNotifications)
          logError(e)
          return
        };
        let content = await this.app.vault.cachedRead(file)
        content = content
          .replaceAll("](" + encodeURI(oldRootdir), "](" + encodeURI(newRootDir))
          .replaceAll("[" + oldRootdir, "[" + newRootDir)
        this.app.vault.modify(file, content)

      }
    })



    // Some file has been modified

    this.app.vault.on('modify', async (file: TFile) => {
      if (!this.newfMoveReq)
        return
      logError("File modified: " + file.path , false)
 
      if (!file ||
        !(file instanceof TFile) ||
        this.ThePathExcluded(String(file.parent?.path)) ||
        !this.ExemplaryOfMD(file.path)) {
        return
      } else {
        if (this.settings.processAll) {
          if (!this.noteModified.includes(file)) {
            this.noteModified.push(file)
          }
          this.setupNewMdFilesProcInterval()
        }


      }

    })




    this.app.workspace.on(

      "editor-paste",
      (evt: ClipboardEvent, editor: Editor, info: MarkdownView) => {
        this.onPasteFunc(evt, editor, info)

      }
    )

    this.setupQueueInterval()
    this.addSettingTab(new SettingTab(this.app, this))

  }





  setupQueueInterval() {
    if (this.intervalId) {
      const intervalId = this.intervalId
      this.intervalId = 0
      window.clearInterval(intervalId)
    }
    if (
      this.settings.realTimeUpdate &&
      this.settings.realTimeUpdateInterval > 0
    ) {
      this.intervalId = window.setInterval(
        this.processModifiedQueue,
        this.settings.realTimeUpdateInterval * 1000
      )
      this.registerInterval(this.intervalId)
    }
  }


  private getCurrentNote(): TFile | null {
    try {
      const noteFile = app.workspace.activeEditor.file
      return noteFile
    } catch (e) {
      showBalloon("Cannot get current note! ", this.settings.showNotifications)

    }
    return null

  }


  private async processPage(file: TFile, defaultdir: boolean = false): Promise<any> {
    
 
    if (file == null ) {return null}

    const content = await this.app.vault.cachedRead(file)
    if (content.length == 0) {return null}
      

    const fixedContent = await replaceAsync(
      content,
      MD_SEARCH_PATTERN,
      imageTagProcessor(this,
        file,
        this.settings,
        defaultdir
      )
    )





    if (content != fixedContent[0] && fixedContent[1] === false) {
      this.modifiedQueue.remove(file)
      await this.app.vault.modify(file, fixedContent[0])

      fixedContent[2].forEach((element: string) => {
        this.newfCreatedByDownloader.push(element)
      })

      showBalloon(`Attachments for "${file.path}" were processed.`, this.settings.showNotifications)

    }

    else if (content != fixedContent[0] && fixedContent[1] === true) {

      this.modifiedQueue.remove(file)
      await this.app.vault.modify(file, fixedContent[0])

      fixedContent[2].forEach((element: string) => {
        this.newfCreatedByDownloader.push(element)
      })

      showBalloon(`WARNING!\r\nAttachments for "${file.path}" were processed, but some attachments were not downloaded/replaced...`, this.settings.showNotifications)
    }
    else {
      if (this.settings.showNotifications) {
        showBalloon(`Page "${file.path}" has been processed, but nothing was changed.`, this.settings.showNotifications)
      }
    }
  }

  // using arrow syntax for callbacks to correctly pass this context

  processActivePage = (defaultdir: boolean = false) => async () => {
    logError("processActivePage")
    try {
      const activeFile = this.getCurrentNote()
      if (!activeFile) {
        showBalloon("Please select a note or click inside selected note in canvas.", this.settings.showNotifications)
        return
      }
      if (!this.ExemplaryOfMD(activeFile.path)) {
        showBalloon("Please, select a markdown note first.", this.settings.showNotifications)
        return
      }
      const noteParentPath = path.dirname(activeFile.path)
      const excludeLocalizePaths = parseExcludePaths(this.settings.ExcludeLocalizeFoldersList)
      if (isPathInExcludedFolders(noteParentPath, excludeLocalizePaths)) {
        showBalloon("This folder is excluded from localize.", this.settings.showNotifications)
        return
      }
      // Folder-level scan: every markdown note that shares the active note's folder.
      const files = this.app.vault.getMarkdownFiles().filter(f => this.ExemplaryOfMD(f.path) && path.dirname(f.path) === noteParentPath)
      const noteList: Array<{ file: TFile, matchCount: number }> = []
      for (const file of files) {
        const content = await this.app.vault.cachedRead(file)
        const matchCount = countRemoteLinksInContent(content)
        if (matchCount > 0)
          noteList.push({ file, matchCount })
      }
      if (noteList.length == 0) {
        showBalloon("No remote attachments found in \"" + noteParentPath + "\" — nothing to localize.", this.settings.showNotifications)
        return
      }
      noteList.sort((a, b) => a.file.path.localeCompare(b.file.path))
      const totalLinks = noteList.reduce((s, n) => s + n.matchCount, 0)
      let detail = ""
      for (const { file, matchCount } of noteList) {
        detail += "\r\n  " + file.path + "  →  " + matchCount + " link(s)"
      }
      const mod = new ModalW1(this.app)
      mod.messg = "Localize " + totalLinks + " remote link(s) across " + noteList.length + " note(s) in folder:\r\n  " + noteParentPath + detail + "\r\n      "
      mod.plugin = this
      const filesToProcess = noteList.map(x => x.file)
      const _dd = defaultdir
      mod.callbackFunc = async () => {
        for (const file of filesToProcess) {
          await this.processPage(file, _dd)
        }
      }
      mod.open()
    } catch (e) {
      showBalloon(`Please select a note or click inside selected note in canvas.`, this.settings.showNotifications)
      return
    }
  }

  processAllPages = async () => {
    const files = this.app.vault.getMarkdownFiles()
 
    const pagesCount = files.length

    const notice = this.settings.showNotifications

      ? new Notice(
        APP_TITLE + `\nStart processing. Total ${pagesCount} pages. `,
        TIMEOUT_LIKE_INFINITY
      )
      : null

    for (const [index, file] of files.entries()) {
      if (this.ExemplaryOfMD(file.path)) {
        if (notice) {
          //setMessage() is undeclared but factically existing, so ignore the TS error  //@ts-expect-error
          notice.setMessage(
            APP_TITLE + `\nProcessing \n"${file.path}" \nPage ${index} of ${pagesCount}`
          )
        }
        await this.processPage(file)
      }
    }
    if (notice) {
      // dum @ts-expect-error
      notice.setMessage(APP_TITLE + `\n${pagesCount} pages were processed.`)

      setTimeout(() => {
        notice.hide()
      }, NOTICE_TIMEOUT)
    }
  }




  private async onPasteFunc(evt: ClipboardEvent = undefined, editor: Editor = undefined, info: MarkdownView = undefined) {

    if (evt === undefined) { return }

    if (!this.settings.realTimeUpdate) { return }

    try {
      const activeFile = this.getCurrentNote()
      const fItems = evt.clipboardData.files
      const tItems = evt.clipboardData.items
 
      if (fItems.length != 0 || this.ThePathExcluded(String(activeFile.parent?.path))) { return }
      
      for (const key in tItems) {

        // Check if it was a text/html
        if (tItems[key].kind == "string") {
          
          if (this.settings.realTimeUpdate) {
            
            const cont = htmlToMarkdown(evt.clipboardData.getData("text/html")) +
            
            htmlToMarkdown(evt.clipboardData.getData("text"))
            



            for (const reg_p of MD_SEARCH_PATTERN) {
              if (reg_p.test(cont)) {
                logError("content: " + cont)
                showBalloon("Media links were found, processing...", this.settings.showNotifications)

                this.enqueueActivePage(activeFile)
                this.setupQueueInterval()
                break
              }
            }
          }
          return
        }

      }




    } catch (e) {
      showBalloon(`Please select a note or click inside selected note in canvas.`, this.settings.showNotifications)
      return
    }



  }




  private removeOrphans = (type: string = undefined, filesToRemove: Array<TFile> = undefined, noteFile: TFile = undefined) => async () => {

    const obsmediadir = app.vault.getConfig("attachmentFolderPath")
    const allFiles = this.app.vault.getFiles()

    const excludeOrphanPaths = parseExcludePaths(this.settings.ExcludeOrphanFoldersList)
    const isOrphanExcluded = (p: string) => isPathInExcludedFolders(p, excludeOrphanPaths)

    // Push the basename of a link into a bucket, stripping #headings and ?queries.
    const collectBasename = (bucket: Array<string>, linkValue: string) => {
      if (!linkValue) {
        return
      }
      const cleanPath = String(linkValue).split("#")[0].split("?")[0]
      const basename = path.basename(cleanPath)
      if (basename.length > 0) {
        bucket.push(basename)
      }
    }

    // Collect every attachment link a note/canvas references and feed each to pushLink.
    const collectFileLinks = async (file: TFile, pushLink: (link: string) => void) => {
      if (!file) {
        return
      }
      if (this.ExemplaryOfCANVAS(file.path)) {
        let canvasData
        try {
          canvasData = JSON.parse(await app.vault.cachedRead(file))
        } catch (e) {
          return
        }
        if (canvasData.nodes && canvasData.nodes.length > 0) {
          for (const node of canvasData.nodes) {
            if (node.type === "file") {
              pushLink(node.file)
            } else if (node.type == "text") {
              //https://github.com/Fevol/obsidian-typings
              //Undocumented API, may be altered in the future
              const parsedNodeLinks = await this.app.internalPlugins.plugins.canvas.instance.index.parseText(node.text)
              const allNodeLinks = parsedNodeLinks?.links
              if (allNodeLinks === undefined) {
                continue
              }
              for (const nodeLink of allNodeLinks) {
                pushLink(nodeLink.link)
              }
            }
          }
        }
      }
      if (this.ExemplaryOfMD(file.path)) {
        const metaCache = this.app.metadataCache.getCache(file.path)
        const embeds = metaCache?.embeds
        const links = metaCache?.links
        // frontmatterLinks: attachments referenced in YAML frontmatter (e.g. banner/cover
        // properties). Not in the pinned obsidian.d.ts stub but present at runtime (Obsidian 1.4+),
        // so read it via an any-cast to avoid flagging such attachments as orphans.
        const frontmatterLinks = (metaCache as any)?.frontmatterLinks
        if (embeds) {
          for (const embed of embeds) {
            pushLink(embed.link)
          }
        }
        if (links) {
          for (const link of links) {
            pushLink(link.link)
          }
        }
        if (frontmatterLinks) {
          for (const fmLink of frontmatterLinks) {
            pushLink(fmLink.link)
          }
        }
      }
    }

    if (type == "plugin") {
      let orphanedAttachments = []
      let allAttachmentsLinks: Array<string> = []

      if (!noteFile) {
        noteFile = this.getCurrentNote()
        if (!noteFile) {
          showBalloon("Please, select a note or click inside a note in canvas!", this.settings.showNotifications)
          return
        }
      }

      if (this.ExemplaryOfMD(noteFile.path)) {
        const noteParentPath = (noteFile.parent && noteFile.parent.path) ? noteFile.parent.path : ""
        if (isOrphanExcluded(noteParentPath)) {
          showBalloon("This note folder is excluded from orphan deletion.", this.settings.showNotifications)
          return
        }
        // Use the note's actual attachment dir (handles ./images and ${notename} alike).
        const oldRootdir = await getMDir(this.app, noteFile, this.settings)
        if (! await this.app.vault.exists(oldRootdir)) {
          showBalloon("The attachment folder " + oldRootdir + " does not exist!", this.settings.showNotifications)
          return
        }
        const attachFolder: any = this.app.vault.getAbstractFileByPath(oldRootdir)
        const allAttachments = attachFolder?.children || []
        // Folder-level: collect links from every note/canvas sharing this folder.
        for (const file of allFiles) {
          const parentPath = (file?.parent && file.parent.path) ? file.parent.path : ""
          if (parentPath !== noteParentPath || (!this.ExemplaryOfCANVAS(file.path) && !this.ExemplaryOfMD(file.path))) {
            continue
          }
          await collectFileLinks(file, (linkValue) => collectBasename(allAttachmentsLinks, linkValue))
        }
        for (const attach of allAttachments) {
          if (!allAttachmentsLinks.includes(attach.name) && attach.children == undefined) {
            logError("orph: " + attach.basename)
            orphanedAttachments.push(attach)
          }
        }
        if (orphanedAttachments.length > 0) {
          const mod = new ModalW1(this.app)
          mod.messg = "Confirm remove orphaned attachments:\r\n  " + oldRootdir + "  →  " + orphanedAttachments.length + " file(s)\r\n      "
          mod.plugin = this
          mod.callbackFunc = this.removeOrphans("execremove", orphanedAttachments)
          mod.open()
        } else {
          showBalloon("No orphaned files found!", this.settings.showNotifications)
        }
      }
    }

    if (type == "obsidian") {
      if (obsmediadir == "/") {
        showBalloon("This command cannot run on vault root.\nPlease, change settings first!\r\n", this.settings.showNotifications)
        return
      }

      if (obsmediadir.slice(0, 2) == "./") {
        // Per-note sibling attachment dir (e.g. "./images"): scan folder-by-folder.
        const subfolderName = obsmediadir.slice(2)
        if (!subfolderName.length) {
          showBalloon("Invalid Obsidian attachment folder path.\r\n", this.settings.showNotifications)
          return
        }
        const usedByParentFolder = new Map<string, Set<string>>()
        const addFolderUsage = (parentPath: string, linkValue: string) => {
          if (!linkValue) {
            return
          }
          const cleanPath = String(linkValue).split("#")[0].split("?")[0]
          const baseName = path.basename(cleanPath)
          if (!baseName.length) {
            return
          }
          if (!usedByParentFolder.has(parentPath)) {
            usedByParentFolder.set(parentPath, new Set())
          }
          usedByParentFolder.get(parentPath).add(baseName)
        }
        for (const file of allFiles) {
          const parentPath = (file?.parent && file.parent.path) ? file.parent.path : ""
          if (isOrphanExcluded(parentPath)) {
            continue
          }
          if (!file || (!this.ExemplaryOfCANVAS(file.path) && !this.ExemplaryOfMD(file.path))) {
            continue
          }
          await collectFileLinks(file, (linkValue) => addFolderUsage(parentPath, linkValue))
        }
        const scannedFolders = new Set<string>()
        let orphanedAttachments = []
        const folderCounts = new Map<string, number>()
        for (const file of allFiles) {
          if (!(file && this.ExemplaryOfMD(file.path))) {
            continue
          }
          const parentPath = (file?.parent && file.parent.path) ? file.parent.path : ""
          if (isOrphanExcluded(parentPath)) {
            continue
          }
          const attachFolderPath = parentPath ? parentPath + "/" + subfolderName : subfolderName
          if (scannedFolders.has(attachFolderPath)) {
            continue
          }
          scannedFolders.add(attachFolderPath)
          const attachFolder: any = this.app.vault.getAbstractFileByPath(attachFolderPath)
          if (!(attachFolder && attachFolder.children)) {
            continue
          }
          const usedSet = usedByParentFolder.get(parentPath) || new Set()
          let folderOrphanCount = 0
          for (const attach of attachFolder.children) {
            if (attach.children != undefined) {
              continue
            }
            if (!usedSet.has(attach.name)) {
              orphanedAttachments.push(attach)
              folderOrphanCount++
            }
          }
          if (folderOrphanCount > 0) {
            folderCounts.set(attachFolderPath, folderOrphanCount)
          }
        }
        if (orphanedAttachments.length > 0) {
          let detail = ""
          for (const [p, cnt] of Array.from(folderCounts.entries()).sort()) {
            detail += "\r\n  " + p + "  →  " + cnt + " file(s)"
          }
          const mod = new ModalW1(this.app)
          mod.messg = "Confirm remove orphaned attachments:" + detail + "\r\n      "
          mod.plugin = this
          mod.callbackFunc = this.removeOrphans("execremove", orphanedAttachments)
          mod.open()
        } else {
          showBalloon("No orphaned files found!", this.settings.showNotifications)
        }
      } else {
        // Fixed global attachment folder.
        const attachFolder: any = this.app.vault.getAbstractFileByPath(obsmediadir)
        const allAttachments = attachFolder?.children || []
        let orphanedAttachments = []
        let allAttachmentsLinks: Array<string> = []
        for (const file of allFiles) {
          const parentPath = (file?.parent && file.parent.path) ? file.parent.path : ""
          if (isOrphanExcluded(parentPath)) {
            continue
          }
          if (!file || (!this.ExemplaryOfCANVAS(file.path) && !this.ExemplaryOfMD(file.path))) {
            continue
          }
          await collectFileLinks(file, (linkValue) => collectBasename(allAttachmentsLinks, linkValue))
        }
        for (const attach of allAttachments) {
          if (!allAttachmentsLinks.includes(attach.name) && attach.children == undefined) {
            logError(allAttachmentsLinks)
            logError(attach.name)
            logError("orph: " + attach.name)
            orphanedAttachments.push(attach)
          }
        }
        logError("Orphaned: ")
        logError(orphanedAttachments, true)
        if (orphanedAttachments.length > 0) {
          const mod = new ModalW1(this.app)
          mod.messg = "Confirm remove orphaned attachments:\r\n  " + obsmediadir + "  →  " + orphanedAttachments.length + " file(s)\r\n  NOTE: Be careful when running this command on Obsidian attachments folder, since some html-linked files may also be moved.\r\n      "
          mod.plugin = this
          mod.callbackFunc = this.removeOrphans("execremove", orphanedAttachments)
          mod.open()
        } else {
          showBalloon("No orphaned files found!", this.settings.showNotifications)
        }
      }
    }

    if (type == "execremove") {
      const useSysTrash = (this.app.vault.getConfig("trashOption") === "system")
      const remcompl = this.settings.removeOrphansCompl
      let msg = "";

      if (filesToRemove) {

        filesToRemove.forEach((el: TFile) => {

          if (remcompl) {
            msg = "were deleted completely."
            this.app.vault.delete(el, true)
          } else {
            if (useSysTrash) {
              msg = "were moved to the system garbage can."
            } else {
              msg = "were moved to the Obsidian garbage can."
            }
            this.app.vault.trash(el, useSysTrash)
          }

        })
      }

      showBalloon(filesToRemove.length + " file(s) " + msg, this.settings.showNotifications)

    }

  }




  private openProcessAllModal = async () => {
    const excludeLocalizePaths = parseExcludePaths(this.settings.ExcludeLocalizeFoldersList)
    const files = this.app.vault.getMarkdownFiles().filter(f => this.ExemplaryOfMD(f.path) && !isPathInExcludedFolders(path.dirname(f.path), excludeLocalizePaths))
    const noteList: Array<{ file: TFile, matchCount: number }> = []
    for (const file of files) {
      const content = await this.app.vault.cachedRead(file)
      const matchCount = countRemoteLinksInContent(content)
      if (matchCount > 0) {
        noteList.push({ file, matchCount })
      }
    }
    if (noteList.length == 0) {
      showBalloon("No remote attachments found across all notes — nothing to localize.", this.settings.showNotifications)
      return
    }
    noteList.sort((a, b) => a.file.path.localeCompare(b.file.path))
    const totalLinks = noteList.reduce((s, n) => s + n.matchCount, 0)
    let detail = ""
    for (const { file, matchCount } of noteList) {
      detail += "\r\n  " + file.path + "  →  " + matchCount + " link(s)"
    }
    const mod = new ModalW1(this.app)
    mod.messg = "Localize " + totalLinks + " remote link(s) across " + noteList.length + " note(s)" + detail + "\r\n      "
    mod.plugin = this
    const filesToProcess = noteList.map(x => x.file)
    mod.callbackFunc = async () => {
      for (const file of filesToProcess) {
        await this.processPage(file, true)
      }
    }
    mod.open()
  }


  // Rename attachments to their MD5 signature and rewrite note references to relative paths.
  private renameMD5 = (type: string, filesToRename: Array<RenamePlanItem> = undefined, notesToUpdate: Array<TFile> = undefined) => async () => {
    const obsmediadir = app.vault.getConfig("attachmentFolderPath")

    if (type == "plugin") {
      let oldRootdir = this.settings.mediaRootDir
      if (this.settings.saveAttE === "obsFolder") {
        if (obsmediadir.slice(0, 2) === "./") {
          oldRootdir = obsmediadir.slice(2)
        } else {
          showBalloon("This command requires a per-note attachment path (e.g. './images').\nUse 'Rename attachments to MD5 (Obsidian folder)' for global folders.\r\n", this.settings.showNotifications)
          return
        }
      }
      if (oldRootdir.includes("${date}")) {
        showBalloon("Path pattern cannot contain ${date}.\nPlease change the mediaRootDir setting.\r\n", this.settings.showNotifications)
        return
      }
      const noteFile = this.getCurrentNote()
      if (!noteFile) {
        showBalloon("Please, select a note or click inside a note in canvas!", this.settings.showNotifications)
        return
      }
      if (this.ExemplaryOfMD(noteFile.path)) {
        oldRootdir = oldRootdir.replace("${notename}", path.parse(noteFile.path)?.name)
        oldRootdir = trimAny(pathJoin([path.parse(noteFile.path)?.dir, oldRootdir]), ["\/"])
        if (! await this.app.vault.exists(oldRootdir)) {
          showBalloon("The attachment folder " + oldRootdir + " does not exist!", this.settings.showNotifications)
          return
        }
        const attachFolder: any = this.app.vault.getAbstractFileByPath(oldRootdir)
        const allFolderFiles = attachFolder?.children || []
        const noteDir = path.dirname(noteFile.path)
        const allVaultFiles = this.app.vault.getFiles()
        const siblingNotes = allVaultFiles.filter(f => this.ExemplaryOfMD(f.path) && path.dirname(f.path) === noteDir)
        const planRename: Array<RenamePlanItem> = []
        for (const f of allFolderFiles) {
          if (f.children != undefined) {
            continue
          }
          const ext = path.extname(f.name)
          if (path.basename(f.name, ext).endsWith("_MD5")) {
            continue
          }
          const binData = await readFromDisk(pathJoin([this.app.vault.adapter.basePath, f.path]))
          if (!binData) {
            continue
          }
          const newBaseName = md5Sig(binData)
          if (!newBaseName) {
            continue
          }
          const newName = newBaseName + ext
          if (newName === f.name) {
            continue
          }
          const newPath = pathJoin([oldRootdir, newName])
          if (await this.app.vault.adapter.exists(newPath)) {
            continue
          }
          planRename.push({ oldPath: f.path, newPath, oldName: f.name, newName })
        }
        if (planRename.length == 0) {
          showBalloon("All attachments already in MD5 format!", this.settings.showNotifications)
          return
        }
        const mod = new ModalW1(this.app)
        mod.messg = "Confirm MD5 rename:\r\n  " + oldRootdir + "  →  " + planRename.length + " file(s)\r\n  Notes to update  →  " + siblingNotes.length + "\r\n      "
        mod.plugin = this
        mod.callbackFunc = this.renameMD5("execrename", planRename, siblingNotes)
        mod.open()
      }
    }

    if (type == "obsidian") {
      if (obsmediadir.slice(0, 2) !== "./") {
        showBalloon("This command requires a per-note attachment path (e.g. './images').\r\n", this.settings.showNotifications)
        return
      }
      const subfolderName = obsmediadir.slice(2)
      const excludeRenamePaths = parseExcludePaths(this.settings.ExcludeRenameFoldersList)
      const allVaultFiles = this.app.vault.getFiles()
      const dirMap = new Map<string, { notes: Array<TFile>, sub: any }>()
      for (const file of allVaultFiles) {
        if (!file || !this.ExemplaryOfMD(file.path)) {
          continue
        }
        const parentPath = path.dirname(file.path)
        if (isPathInExcludedFolders(parentPath, excludeRenamePaths)) {
          continue
        }
        if (!dirMap.has(parentPath)) {
          const subPath = parentPath ? parentPath + "/" + subfolderName : subfolderName
          const sub: any = this.app.vault.getAbstractFileByPath(subPath)
          if (sub && sub.children) {
            dirMap.set(parentPath, { notes: [], sub })
          }
        }
        if (dirMap.has(parentPath)) {
          dirMap.get(parentPath).notes.push(file)
        }
      }
      const planRename: Array<RenamePlanItem> = []
      const folderCounts = new Map<string, number>()
      const allNotesToUpdate: Array<TFile> = []
      for (const [parentPath, entry] of dirMap) {
        const notes = entry.notes
        const sub = entry.sub
        const folderPlan: Array<string> = []
        for (const f of sub.children) {
          if (f.children != undefined) {
            continue
          }
          const ext = path.extname(f.name)
          if (path.basename(f.name, ext).endsWith("_MD5")) {
            continue
          }
          const binData = await readFromDisk(pathJoin([this.app.vault.adapter.basePath, f.path]))
          if (!binData) {
            continue
          }
          const newBaseName = md5Sig(binData)
          if (!newBaseName) {
            continue
          }
          const newName = newBaseName + ext
          if (newName === f.name) {
            continue
          }
          const newPath = pathJoin([sub.path, newName])
          if (await this.app.vault.adapter.exists(newPath)) {
            continue
          }
          planRename.push({ oldPath: f.path, newPath, oldName: f.name, newName })
          folderPlan.push(f.name)
        }
        if (folderPlan.length > 0) {
          folderCounts.set(parentPath, folderPlan.length)
          for (const n of notes) {
            if (!allNotesToUpdate.includes(n)) {
              allNotesToUpdate.push(n)
            }
          }
        }
      }
      if (planRename.length == 0) {
        showBalloon("All attachments already in MD5 format!", this.settings.showNotifications)
        return
      }
      let detail = ""
      for (const [p, cnt] of Array.from(folderCounts.entries()).sort()) {
        detail += "\r\n  " + (p || "(vault root)") + "/" + subfolderName + "/  →  " + cnt + " file(s)"
      }
      const mod = new ModalW1(this.app)
      mod.messg = "Rename " + planRename.length + " attachment(s) to MD5 format (" + dirMap.size + " folder(s) scanned)" + detail + "\r\n      "
      mod.plugin = this
      mod.callbackFunc = this.renameMD5("execrename", planRename, allNotesToUpdate)
      mod.open()
    }

    if (type == "execrename") {
      const normalizeVaultPath = (p: string) => trimAny(normalizePath(String(p || "")), ["\/"])
      const resolveLinkToVaultPath = (notePath: string, linkPath: string) => {
        if (!linkPath) {
          return ""
        }
        let decoded = String(linkPath)
        try {
          decoded = decodeURI(decoded)
        } catch (e) {
        }
        decoded = decoded.trim().replace(/^<|>$/g, "")
        if (!decoded || /^(https?:|data:|file:|mailto:)/i.test(decoded)) {
          return ""
        }
        const pathPart = decoded.split("#")[0].split("?")[0]
        if (!pathPart) {
          return ""
        }
        if (pathPart.startsWith("/")) {
          return normalizeVaultPath(pathPart.slice(1))
        }
        const noteDir = normalizeVaultPath(path.dirname(notePath))
        return normalizeVaultPath(pathJoin([noteDir, pathPart]))
      }
      const buildRelativeLink = (notePath: string, targetPath: string) => {
        const noteDir = normalizeVaultPath(path.dirname(notePath))
        const normalizedTargetPath = normalizeVaultPath(targetPath)
        const relPath = path.relative(path.sep + noteDir, path.sep + normalizedTargetPath)
        const normalizedRelPath = relPath && relPath.length > 0
          ? relPath
          : path.basename(normalizedTargetPath)
        return normalizePath(normalizedRelPath)
      }
      const rewriteMdLink = (content: string, note: TFile, item: RenamePlanItem) => content.replace(/(!?\[[^\]]*?\]\()([^)]+)(\))/g, (full, prefix, target, suffix) => {
        const trimmedTarget = String(target).trim()
        if (!trimmedTarget.length) {
          return full
        }
        const wsIndex = trimmedTarget.search(/\s/)
        const rawLinkPart = wsIndex === -1 ? trimmedTarget : trimmedTarget.slice(0, wsIndex)
        const trailingPart = wsIndex === -1 ? "" : trimmedTarget.slice(wsIndex)
        const rawLinkClean = rawLinkPart.replace(/^<|>$/g, "")
        const resolvedPath = resolveLinkToVaultPath(note.path, rawLinkClean)
        const oldPath = normalizeVaultPath(item.oldPath)
        const basePathPart = rawLinkClean.split("#")[0].split("?")[0]
        const baseNameOnlyMatch = path.basename(basePathPart) === item.oldName &&
          !basePathPart.includes("/") &&
          !basePathPart.includes("\\")
        if (resolvedPath !== oldPath && !baseNameOnlyMatch) {
          return full
        }
        const suffixMatch = rawLinkClean.match(/([?#].*)$/)
        const relPath = buildRelativeLink(note.path, item.newPath) + (suffixMatch ? suffixMatch[1] : "")
        const wrappedRelPath = rawLinkPart.startsWith("<") && rawLinkPart.endsWith(">")
          ? "<" + encodeURI(relPath) + ">"
          : encodeURI(relPath)
        return prefix + wrappedRelPath + trailingPart + suffix
      })
      const rewriteWikiLink = (content: string, note: TFile, item: RenamePlanItem) => content.replace(/(\!\[\[|\[\[)([^\]]+)(\]\])/g, (full, opener, inner, closer) => {
        let pathPart = String(inner)
        let aliasPart = ""
        let anchorPart = ""
        const pipeIndex = pathPart.indexOf("|")
        if (pipeIndex !== -1) {
          aliasPart = pathPart.slice(pipeIndex)
          pathPart = pathPart.slice(0, pipeIndex)
        }
        const hashIndex = pathPart.indexOf("#")
        if (hashIndex !== -1) {
          anchorPart = pathPart.slice(hashIndex)
          pathPart = pathPart.slice(0, hashIndex)
        }
        const cleanPathPart = pathPart.trim()
        const resolvedPath = resolveLinkToVaultPath(note.path, cleanPathPart)
        const oldPath = normalizeVaultPath(item.oldPath)
        const baseNameOnlyMatch = path.basename(cleanPathPart) === item.oldName &&
          !cleanPathPart.includes("/") &&
          !cleanPathPart.includes("\\")
        if (resolvedPath !== oldPath && !baseNameOnlyMatch) {
          return full
        }
        const relPath = buildRelativeLink(note.path, item.newPath)
        return opener + relPath + anchorPart + aliasPart + closer
      })
      let renamedCount = 0
      for (const item of filesToRename) {
        try {
          await this.app.vault.adapter.rename(item.oldPath, item.newPath)
          renamedCount++
        } catch (e) {
          logError("Rename to MD5 failed: " + e)
        }
      }
      for (const note of notesToUpdate) {
        try {
          let filedata = await this.app.vault.read(note)
          let changed = false
          for (const item of filesToRename) {
            const updatedMd = rewriteMdLink(filedata, note, item)
            const updatedWiki = rewriteWikiLink(updatedMd, note, item)
            if (updatedWiki !== filedata) {
              filedata = updatedWiki
              changed = true
            }
          }
          if (changed) {
            await this.app.vault.modify(note, filedata)
          }
        } catch (e) {
          logError("Update note refs failed: " + e)
        }
      }
      showBalloon(renamedCount + " attachment(s) renamed to MD5 format.", this.settings.showNotifications)
    }
  }


  private async onMdCreateFunc(file: TFile) {

 
    if (!file ||
      !(file instanceof TFile) ||
      !(this.settings.processCreated) ||
      !this.ExemplaryOfMD(file.path)
       )
      return


    const timeGapMs = Math.abs(Date.now() - file.stat.ctime)

    if (timeGapMs > TIME_DIFF)
      return

    logError("func onMdCreateFunc: " + file.path)
    logError(file,true)
 

    var cont = await this.app.vault.cachedRead(file)
 
    logError(cont)
  
        this.enqueueActivePage(file)
        this.setupQueueInterval()
        this.setupNewMdFilesProcInterval()
 
    
  }

  private async onFCreateFunc(file: TFile) {
 
    if (!file ||
      !(file instanceof TFile) ||
      this.ExemplaryOfMD(file.path)||
      this.ExemplaryOfCANVAS(file.path)||
      !(this.settings.processAll))
      return

    if (!file.stat.ctime)
      return

    const timeGapMs = Math.abs(Date.now() - file.stat.mtime)

    if (timeGapMs > TIME_DIFF)
      return

    this.newfCreated.push(file.path)
    this.newfMoveReq = true
    this.setupNewMdFilesProcInterval()
    logError("file created  ")
  }


  private ExemplaryOfMD(pat: string){
    const includeRegex = new RegExp(this.settings.includepattern, "i")
    return (pat.match(includeRegex)?.groups?.md != undefined)
  }


  private ExemplaryOfCANVAS(pat: string){
    const includeRegex = new RegExp(this.settings.includepattern, "i")
    return (pat.match(includeRegex)?.groups?.canvas != undefined)
  }


  private ThePathExcluded(pat: string){
    const includeRegex = new RegExp(this.settings.ExcludedFoldersListRegexp, "i")
    logError(pat.match(includeRegex))
    // if (pat.match(includeRegex) != null && trimAny(this.settings.ExcludedFoldersList, [" "]).length != 0){
    //    showBalloon("The path " + pat + " is excluded in your settings. ", true)}
    return (pat.match(includeRegex) != null && trimAny(this.settings.ExcludedFoldersList, [" "]).length != 0)
  }

  private processMdFilesOnTimer = async () => {

    const th = this
    function onRet() {
      th.newfCreated = []
      th.newfCreatedByDownloader = []
      th.noteModified = []
      th.newfMoveReq = false
      window.clearInterval(th.newfProcInt)
      th.newfProcInt = 0
    }

    logError("func processMdFilesOnTimer:\r\n")
    logError(this.noteModified, true)

    try {


      window.clearInterval(this.newfProcInt)
      this.newfProcInt = 0
      this.newfMoveReq = false
      let itemcount = 0
      const useMdLinks = this.app.vault.getConfig("useMarkdownLinks")



      for (let note of this.noteModified) {

        const metaCache = this.app.metadataCache.getFileCache(note)
        let filedata = await this.app.vault.cachedRead(note)
        

        let pr = false
        for (const reg_p of MD_SEARCH_PATTERN) {
          if (reg_p.test(filedata)) {
            pr = true
            break
          }
        }

 

        const mdir = await getMDir(this.app, note, this.settings)
        const obsmdir = await getMDir(this.app, note, this.settings, true)
        let embeds = metaCache?.embeds



        if (obsmdir != "" && ! await this.app.vault.adapter.exists(obsmdir)) {
         if ( ! this.settings.DoNotCreateObsFolder){
          this.ensureFolderExists(obsmdir)
          showBalloon("You obsidian media folder set to '" + obsmdir + "', and has been created by the plugin. Please, try again. ", this.settings.showNotifications)
          onRet()
        }
          return
        }



        if (embeds || pr) {


          await this.ensureFolderExists(mdir)

          for (let el of embeds) {

            logError(el)

            let oldpath = pathJoin([obsmdir, path.basename(el.link)])
            let oldtag = el["original"];
            logError(useMdLinks)



            logError(this.newfCreated)
            
            if ((this.newfCreated.indexOf(el.link) != -1 || (obsmdir != "" && (this.newfCreated.includes(oldpath) || this.newfCreated.includes(el.link)))) &&
              !this.newfCreatedByDownloader.includes(oldtag)) {


              if (! await this.app.vault.adapter.exists(oldpath)) {
                logError("Cannot find " + el.link + " skipping...")
                continue
              }


              let newpath = pathJoin([mdir, cFileName(path.basename(el.link))])
              let newlink: Array<string> = await getRDir(note, this.settings, newpath)

              logError(el.link)

              //let newBinData: Buffer | null = null

              let newBinData: ArrayBuffer | null = null
              let newMD5: string | null = null
              const oldBinData = await readFromDiskB(pathJoin([this.app.vault.adapter.basePath, oldpath]), 5000)
              const oldMD5 = md5Sig(oldBinData)
              const fileExt = await getFileExt(oldBinData, oldpath)

              logError("oldbindata: " + oldBinData)
              logError("oldext: " + fileExt)
           
              if (this.settings.PngToJpegLocal && fileExt == "png") {


                let compType = "image/jpg";
                let compExt = ".jpg";

                if (this.settings.ImgCompressionType == "image/webp") {
                   compType = "image/webp";
                   compExt = ".webp";
                }

                logError("Compressing image to ")

                const blob = new Blob([new Uint8Array(await this.app.vault.adapter.readBinary(oldpath))]);
                newBinData = await blobToJpegArrayBuffer(blob, this.settings.JpegQuality*0.01, compType)
                
                newMD5 = md5Sig(newBinData)
                logError(newBinData)
                if (newBinData != null) {

                  if (this.settings.useMD5ForNewAtt) {
                    newpath = pathJoin([mdir, newMD5 + compExt])
                  } else {
                    newpath = pathJoin([mdir, cFileName(path.parse(el.link)?.name + compExt)])
                  }
                  newlink = await getRDir(note, this.settings, newpath)
                }

              } else if (this.settings.useMD5ForNewAtt) {
                newpath = pathJoin([mdir, oldMD5 + path.extname(el.link)])
                newlink = await getRDir(note, this.settings, newpath)

              } else if (!this.settings.useMD5ForNewAtt) {
                newpath = pathJoin([mdir, cFileName(path.basename(el.link))])
                newlink = await getRDir(note, this.settings, newpath)
              }



              if (await this.app.vault.adapter.exists(newpath)) {

                let newFMD5
                if (newBinData != null) {
                  newFMD5 = md5Sig(await this.app.vault.adapter.readBinary(newpath))
                } else {
                  newFMD5 = md5Sig(await readFromDiskB(pathJoin([this.app.vault.adapter.basePath, newpath]), 5000))
                }


                if (newMD5 === newFMD5 || (oldMD5 === newFMD5 && oldpath != newpath)) {

                  logError(path.dirname(oldpath))
                  logError("Deleting duplicate file: " + oldpath)
                  await this.app.vault.adapter.remove(oldpath)

                } else if (oldpath != newpath) {

                  logError("Renaming existing: " + oldpath)
                  let inc = 1
                  while (await this.app.vault.adapter.exists(newpath)) {
                    newpath = pathJoin([mdir, `(${inc}) ` + cFileName(path.basename(el.link))])
                    inc++
                  }

                  newlink = await getRDir(note, this.settings, newpath)
                  await this.app.vault.adapter.rename(oldpath, newpath)
                }

              } else {
                logError(`renaming  ${oldpath}  to  ${newpath}`)
                try {
                  if (newBinData != null) {
                    await this.app.vault.adapter.writeBinary(newpath, newBinData).then(
                    ); {
                      await this.app.vault.adapter.remove(oldpath)
                    }

                  } else {
                    await this.app.vault.adapter.rename(oldpath, newpath)
                  }

                } catch (error) {
                  logError(error)
                }


              }


              let addName = "";
              if (this.settings.addNameOfFile) {
                if (useMdLinks) {
                  addName = `[Open: ${path.basename(el.link)}](${newlink[1]})\r\n`
                } else {
                  addName = `[[${newlink[0]}|Open: ${path.basename(el.link)}]]\r\n`
                }

              }


              let newtag = addName + oldtag.replace(el.link, newlink[0])

              if (useMdLinks) {
                newtag = addName + oldtag.replace(encObsURI(el.link), newlink[1])
              }


              filedata = filedata.replaceAll(oldtag, newtag)
              itemcount++
            }
          }


        }
        if (itemcount > 0) {
          await this.app.vault.modify(note, filedata)
          showBalloon(itemcount + " attachments for note " + note.path + " were processed.", this.settings.showNotifications)
          itemcount = 0
        }
      }
    } catch (e) {
      logError(e)
      onRet()
    }
    onRet()

  }





  private setTitleAsName = async () => {
    try {
      const noteFile = this.getCurrentNote()
      const fileData = await this.app.vault.cachedRead(noteFile)
      const title = fileData.match(/^#{1,6} .+?($|\n)/gm)
      var ind = 0
      if (title !== null) {
        const newName = cFileName(trimAny(title[0].toString(), ["#", " "])).slice(0, 200)
        var fullPath = pathJoin([noteFile.parent.path, newName + ".md"])
        var fExist = await this.app.vault.exists(fullPath)
        if (trimAny(noteFile.path, ["\\", "/"]) != trimAny(fullPath, ["\\", "/"])) {
          while (fExist) {
            ind++
            var fullPath = pathJoin([noteFile.parent.path, newName + " (" + ind + ")" + ".md"])
            var fExist = await this.app.vault.exists(fullPath)
          }
          await this.app.vault.rename(noteFile, fullPath)

          showBalloon(`The note was renamed to ` + fullPath, this.settings.showNotifications)

        }
      }

    } catch (e) {
      showBalloon(`Cannot rename.`, this.settings.showNotifications)
      return
    }
  }





  setupNewMdFilesProcInterval() {
    logError("func setupNewFilesProcInterval: \r\n")
    window.clearInterval(this.newfProcInt)
    this.newfProcInt = 0
    this.newfProcInt = window.setInterval(
      this.processMdFilesOnTimer,
      this.settings.realTimeUpdateInterval * 1000
    )
    this.registerInterval(this.newfProcInt)
  }

  private convertSelToURI = async () => {
    this.app.workspace.activeEditor.editor.replaceSelection(encObsURI(await this.app.workspace.activeEditor.getSelection()))
  }

  private convertSelToMD = async () => {
    this.app.workspace.activeEditor.editor.replaceSelection(htmlToMarkdown(await this.app.workspace.activeEditor.getSelection()))
  }



  processModifiedQueue = async () => {
    const iteration = this.modifiedQueue.iterationQueue();
    for (const page of iteration) {
      this.processPage(page, false);
    }
  };

  enqueueActivePage(activeFile: TFile) {
    this.modifiedQueue.push(
      activeFile,
      1//this.settings.realTim3AttemptsToProcess
    )
  }




  // ------------  Load / Save settings -----------------



  async onunload() {
    this.app.workspace.off("editor-drop", null)
    this.app.workspace.off("editor-paste", null)
    this.app.workspace.off('file-menu', null)
    //this.app.vault.off("create",  null)
    logError(" unloaded.")
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
    this.setupQueueInterval()
  }

  async saveSettings() {
    try {
      await this.saveData(this.settings)
    } catch (error) {
      displayError(error)
    }
  }

  async ensureFolderExists(folderPath: string) {
    try {
      await this.app.vault.createFolder(folderPath)
      return
    } catch (e) {
      logError(e)
      return
    }
  }
}
