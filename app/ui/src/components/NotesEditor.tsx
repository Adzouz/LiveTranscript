import { useEffect, useRef, useState } from 'react'
import Editor from '@toast-ui/editor'
import colorSyntax from '@toast-ui/editor-plugin-color-syntax'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { Download } from 'lucide-react'

import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css'
import 'tui-color-picker/dist/tui-color-picker.css'
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css'

interface Props {
  sessionId: string
  initialMarkdown: string
}

type SaveState = '' | 'typing' | 'saved' | 'error'

export function NotesEditor({ sessionId, initialMarkdown }: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<InstanceType<typeof Editor> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('')

  const save = async () => {
    const editor = editorRef.current
    if (!editor) return
    try {
      await api(`/sessions/${sessionId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: editor.getMarkdown() }),
      })
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  useEffect(() => {
    if (!elRef.current) return
    const editor = new Editor({
      el: elRef.current,
      height: '100%',
      initialEditType: 'wysiwyg',
      initialValue: initialMarkdown,
      usageStatistics: false,
      theme: 'dark',
      placeholder: 'Your notes — headings, bold, lists, colors… saved as markdown.',
      plugins: [colorSyntax],
      toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task'],
        ['code', 'codeblock'],
        ['link'],
      ],
    })
    editor.on('change', () => {
      setSaveState('typing')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(save, 800)
    })
    editorRef.current = editor
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      editor.destroy()
      editorRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const exportMd = async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    await save()
    window.location.href = `/api/sessions/${sessionId}/notes.md`
  }

  return (
    <div className="notes-editor flex min-h-0 flex-1 flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Notes
          <span className="ml-2 font-normal normal-case tracking-normal">
            {saveState === 'typing' && 'typing…'}
            {saveState === 'saved' && 'saved'}
            {saveState === 'error' && 'save failed!'}
          </span>
        </span>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={exportMd}>
          <Download className="size-3.5" /> Export .md
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div ref={elRef} className="h-full" />
      </div>
    </div>
  )
}
