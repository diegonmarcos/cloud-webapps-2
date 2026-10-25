import { ref, computed, watch } from 'vue'
import type { OpenDoc, Notification } from '@/types/json'
import { useDebounce } from './useDebounce'

// Check if File System Access API is available (requires secure context)
const hasFileSystemAccess = typeof window !== 'undefined'
  && 'showDirectoryPicker' in window
  && window.isSecureContext

// Debug: log API availability on load
if (typeof window !== 'undefined') {
  console.info('[JSON Vision] Debug — API Check:', {
    showDirectoryPicker: 'showDirectoryPicker' in window,
    isSecureContext: window.isSecureContext,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    hasFileSystemAccess,
    userAgent: navigator.userAgent,
  })
}

export function useJsonFiles() {
  const files = ref<string[]>([])
  const openDocs = ref<OpenDoc[]>([])
  const activeDocIndex = ref(-1)
  const input = ref('')
  const parsedData = ref<unknown>(null)
  const error = ref<string | null>(null)
  const notification = ref<Notification | null>(null)
  const isSaving = ref(false)
  const useFallback = ref(!hasFileSystemAccess)

  const dirHandle = ref<FileSystemDirectoryHandle | null>(null)
  const fileHandles: Record<string, FileSystemFileHandle> = {}
  const fallbackFileContents: Record<string, string> = {}

  const debouncedInput = useDebounce(input, 1000)

  const activeDoc = computed(() =>
    activeDocIndex.value >= 0 ? openDocs.value[activeDocIndex.value] : null
  )

  const showNotification = (msg: string, isError = false) => {
    notification.value = { msg, isError }
    setTimeout(() => notification.value = null, 3000)
  }

  const handleOpenFolder = async () => {
    console.info('[JSON Vision] Open Folder clicked — useFallback:', useFallback.value)
    if (useFallback.value) {
      console.warn('[JSON Vision] Folder API unavailable (Brave/Firefox or non-secure context). Use File button instead.')
      showNotification('Folder API blocked by browser — use File button', true)
      return
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      dirHandle.value = handle
      await refreshFileList(handle)
      showNotification('Folder opened')
    } catch (err: any) {
      console.error('[JSON Vision] Open Folder error:', err?.name, err?.message, err)
      if (err?.name === 'AbortError') return // User cancelled picker
      showNotification(`Folder error: ${err?.message || 'Unknown'}`, true)
    }
  }

  const handleFallbackFiles = async (fileList: FileList | null) => {
    console.info('[JSON Vision] File input triggered — files:', fileList?.length ?? 0)
    if (!fileList || fileList.length === 0) return

    const jsonFiles = Array.from(fileList).filter(f => f.name.endsWith('.json'))
    if (jsonFiles.length === 0) {
      showNotification('No JSON files selected', true)
      return
    }

    // Clear previous fallback data
    Object.keys(fallbackFileContents).forEach(k => delete fallbackFileContents[k])

    const newFiles: string[] = []
    for (const file of jsonFiles) {
      const text = await file.text()
      newFiles.push(file.name)
      fallbackFileContents[file.name] = text
    }

    files.value = newFiles.sort()
    showNotification(`Loaded ${jsonFiles.length} JSON file(s)`)
  }

  const refreshFileList = async (handle: FileSystemDirectoryHandle) => {
    const newFiles: string[] = []
    Object.keys(fileHandles).forEach(k => delete fileHandles[k])
    console.info('[JSON Vision] Scanning directory:', handle.name)

    const scanDirectory = async (dirHandle: FileSystemDirectoryHandle, pathPrefix: string, depth: number) => {
      if (depth > 4) {
        console.warn('[JSON Vision] Max depth reached at:', pathPrefix)
        return
      }

      try {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file' && entry.name.endsWith('.json')) {
            const filePath = pathPrefix + entry.name
            newFiles.push(filePath)
            fileHandles[filePath] = entry as FileSystemFileHandle
            console.info('[JSON Vision] Registered file handle:', filePath, '→', entry.name)
          } else if (entry.kind === 'directory') {
            await scanDirectory(entry as FileSystemDirectoryHandle, pathPrefix + entry.name + '/', depth + 1)
          }
        }
      } catch (scanErr: any) {
        console.error('[JSON Vision] Scan error at', pathPrefix, ':', scanErr?.name, scanErr?.message, scanErr)
      }
    }

    await scanDirectory(handle, '', 1)
    console.info('[JSON Vision] Scan complete:', newFiles.length, 'files found. Handles:', Object.keys(fileHandles))
    files.value = newFiles.sort()
  }

  const handleOpenFile = async (filename: string) => {
    console.info('[JSON Vision] Open File:', filename, {
      useFallback: useFallback.value,
      hasHandle: !!fileHandles[filename],
      hasFallbackContent: !!fallbackFileContents[filename],
      registeredHandles: Object.keys(fileHandles),
      registeredFallback: Object.keys(fallbackFileContents),
    })

    const existingIndex = openDocs.value.findIndex(d => d.filename === filename)
    if (existingIndex >= 0) {
      console.info('[JSON Vision] File already open at index', existingIndex)
      activeDocIndex.value = existingIndex
      return
    }

    try {
      let text: string

      if (useFallback.value) {
        // Fallback mode: read from cached content
        text = fallbackFileContents[filename]
        console.info('[JSON Vision] Fallback read:', { filename, found: !!text, contentLength: text?.length })
        if (!text) throw new Error(`Fallback content not found for "${filename}"`)
      } else {
        // File System Access API mode
        let handle = fileHandles[filename]
        console.info('[JSON Vision] FS API read:', { filename, handleExists: !!handle, handleKind: handle?.kind, handleName: handle?.name })
        if (!handle) throw new Error(`File handle not found for "${filename}" — registered: [${Object.keys(fileHandles).join(', ')}]`)

        // Check permission
        try {
          const perm = await (handle as any).queryPermission({ mode: 'read' })
          console.info('[JSON Vision] Permission status:', perm)
          if (perm !== 'granted') {
            const req = await (handle as any).requestPermission({ mode: 'read' })
            console.info('[JSON Vision] Permission after request:', req)
          }
        } catch (permErr: any) {
          console.warn('[JSON Vision] Permission check failed (API may not exist):', permErr?.message)
        }

        // Try getFile, if it fails try re-resolving from dirHandle
        let file: File
        try {
          file = await handle.getFile()
        } catch (readErr: any) {
          console.warn('[JSON Vision] getFile() failed:', readErr?.name, readErr?.message, '— trying re-resolve from dirHandle')
          if (dirHandle.value) {
            // Re-resolve: walk the path segments to get a fresh handle
            const parts = filename.split('/')
            let currentDir = dirHandle.value
            for (let i = 0; i < parts.length - 1; i++) {
              currentDir = await currentDir.getDirectoryHandle(parts[i])
            }
            const freshHandle = await currentDir.getFileHandle(parts[parts.length - 1])
            fileHandles[filename] = freshHandle
            console.info('[JSON Vision] Re-resolved handle for:', filename)
            file = await freshHandle.getFile()
          } else {
            throw readErr
          }
        }

        console.info('[JSON Vision] Got File object:', { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified })
        text = await file.text()
        console.info('[JSON Vision] Read text OK, length:', text.length)
      }

      const newDoc: OpenDoc = { filename, content: text, originalContent: text }
      openDocs.value.push(newDoc)
      activeDocIndex.value = openDocs.value.length - 1
      console.info('[JSON Vision] File opened successfully:', filename)
    } catch (e: any) {
      console.error('[JSON Vision] Failed to read file:', e?.name, e?.message, e)
      showNotification(`Failed to read: ${e?.message || 'Unknown error'}`, true)
    }
  }

  const loadFromUrl = async (url: string, label: string, pinned = false, method = 'GET') => {
    const existing = openDocs.value.findIndex(d => d.filename === label)
    if (existing >= 0) { activeDocIndex.value = existing; return }
    try {
      const res = await fetch(url, { method })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      // Validate JSON
      JSON.parse(text)
      const doc: OpenDoc = { filename: label, content: text, originalContent: text, pinned, sourceUrl: url }
      openDocs.value.push(doc)
      activeDocIndex.value = openDocs.value.length - 1
    } catch (e: any) {
      console.error('[JSON Vision] Failed to load URL:', url, e)
      showNotification(`Failed to load: ${e?.message || 'Unknown'}`, true)
    }
  }

  const handleRefresh = async () => {
    if (activeDocIndex.value === -1) return
    const doc = openDocs.value[activeDocIndex.value]
    if (!doc) return

    if (doc.sourceUrl) {
      // Re-fetch from URL
      try {
        const res = await fetch(doc.sourceUrl, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        JSON.parse(text)
        doc.content = text
        doc.originalContent = text
        input.value = text
        showNotification('Refreshed from API')
      } catch (e: any) {
        showNotification(`Refresh failed: ${e?.message || 'Unknown'}`, true)
      }
    } else if (fileHandles[doc.filename]) {
      // Re-read from local file handle
      try {
        let file: File
        try {
          file = await fileHandles[doc.filename].getFile()
        } catch {
          if (dirHandle.value) {
            const parts = doc.filename.split('/')
            let currentDir = dirHandle.value
            for (let i = 0; i < parts.length - 1; i++) currentDir = await currentDir.getDirectoryHandle(parts[i])
            const fresh = await currentDir.getFileHandle(parts[parts.length - 1])
            fileHandles[doc.filename] = fresh
            file = await fresh.getFile()
          } else throw new Error('No directory handle')
        }
        const text = await file.text()
        doc.content = text
        doc.originalContent = text
        input.value = text
        showNotification('Refreshed from file')
      } catch (e: any) {
        showNotification(`Refresh failed: ${e?.message || 'Unknown'}`, true)
      }
    } else if (fallbackFileContents[doc.filename]) {
      showNotification('File loaded from input — re-open to refresh', true)
    } else {
      showNotification('No source to refresh from', true)
    }
  }

  const handleCloseTab = (index: number) => {
    if (openDocs.value[index]?.pinned) return
    openDocs.value.splice(index, 1)
    if (activeDocIndex.value >= index) {
      activeDocIndex.value = Math.max(0, activeDocIndex.value - 1)
    }
    if (openDocs.value.length === 0) {
      activeDocIndex.value = -1
      input.value = ''
      parsedData.value = null
    }
  }

  const handleSaveFile = async (contentToSave: string, silent = false) => {
    if (activeDocIndex.value === -1) return
    const doc = openDocs.value[activeDocIndex.value]

    if (useFallback.value) {
      // Fallback mode: download the file instead
      if (!silent) {
        const blob = new Blob([contentToSave], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.filename
        a.click()
        URL.revokeObjectURL(url)
        openDocs.value[activeDocIndex.value].originalContent = contentToSave
        showNotification(`Downloaded ${doc.filename}`)
      }
      return
    }

    const handle = fileHandles[doc.filename]
    if (!handle) {
      if (!silent) showNotification('Cannot save: File handle lost', true)
      return
    }

    isSaving.value = true
    try {
      const writable = await handle.createWritable()
      await writable.write(contentToSave)
      await writable.close()

      openDocs.value[activeDocIndex.value].originalContent = contentToSave
      if (!silent) showNotification(`Saved ${doc.filename}`)
    } catch (e) {
      console.error(e)
      if (!silent) showNotification('Save error', true)
    } finally {
      isSaving.value = false
    }
  }

  // Sync active doc to input
  watch(activeDocIndex, (newIndex) => {
    if (newIndex >= 0 && openDocs.value[newIndex]) {
      input.value = openDocs.value[newIndex].content
    } else if (newIndex === -1) {
      input.value = ''
      parsedData.value = null
    }
  })

  // Parse input
  watch(input, (newInput) => {
    try {
      if (!newInput.trim()) {
        parsedData.value = null
        error.value = null
        return
      }
      parsedData.value = JSON.parse(newInput)
      error.value = null
    } catch (err) {
      error.value = (err as Error).message
    }
  })

  // Auto-save
  watch(debouncedInput, (newValue) => {
    if (activeDocIndex.value !== -1 && openDocs.value[activeDocIndex.value]) {
      const doc = openDocs.value[activeDocIndex.value]
      if (newValue !== doc.originalContent && !error.value) {
        handleSaveFile(newValue, true)
      }
    }
  })

  const updateInput = (value: string) => {
    input.value = value
    if (activeDocIndex.value >= 0) {
      openDocs.value[activeDocIndex.value].content = value
    }
  }

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(input.value)
      updateInput(JSON.stringify(parsed, null, 2))
      showNotification('Formatted JSON')
    } catch (e) {
      showNotification('Cannot format: Invalid JSON', true)
    }
  }

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(input.value)
      updateInput(JSON.stringify(parsed))
      showNotification('Minified JSON')
    } catch (e) {
      showNotification('Cannot minify: Invalid JSON', true)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(input.value)
    showNotification('Raw JSON copied')
  }

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path)
    showNotification(`Path copied: ${path}`)
  }

  return {
    files,
    openDocs,
    activeDocIndex,
    activeDoc,
    input,
    parsedData,
    error,
    notification,
    isSaving,
    useFallback,
    handleOpenFolder,
    handleFallbackFiles,
    handleOpenFile,
    handleCloseTab,
    loadFromUrl,
    handleRefresh,
    handleSaveFile,
    updateInput,
    handleFormat,
    handleMinify,
    handleCopy,
    handleCopyPath,
    showNotification
  }
}
