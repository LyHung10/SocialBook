'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useAskChapterAIMutation } from '@/features/chapters/api/chaptersApi'
import { useCreateHighlightMutation } from '@/features/user-highlights/api/userHighlightsApi'

export interface Selection {
  text: string
  paraId: string
  rect: DOMRect
}

export interface AiState {
  type: string
  content: string
  isLoading: boolean
}

interface UseSelectionToolbarOptions {
  bookId: string
  chapterId: string
  bookSlug: string
  room: { currentChapterSlug: string } | null
  addHighlight: (data: { chapterSlug: string; paragraphId: string; content: string }) => void
  addQuote: (chapterSlug: string, paraId: string, text: string) => void
}

export function useSelectionToolbar({
  bookId, chapterId, bookSlug,
  room, addHighlight, addQuote,
}: UseSelectionToolbarOptions) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<AiState | null>(null)
  const [askAI] = useAskChapterAIMutation()
  const [createPersonalHighlight] = useCreateHighlightMutation()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close toolbar on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const sel = window.getSelection()
        if (!sel || sel.toString().trim().length < 5) {
          setSelection(null)
          setAiAnalysis(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseUp = useCallback((paraId: string) => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.toString().trim().length < 5) return

    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setSelection({ text: sel.toString(), paraId, rect })
    setAiAnalysis(null)
  }, [])

  const handleAIAction = useCallback(async (type: 'explain' | 'summarize' | 'character' | 'translate') => {
    if (!selection) return

    const prompts = {
      explain: `Giải thích ý nghĩa và ngữ cảnh của đoạn văn này trong truyện: "${selection.text}"`,
      summarize: `Tóm tắt ngắn gọn và súc tích đoạn văn này: "${selection.text}"`,
      character: `Phân tích tâm lý, hành động hoặc vai trò của các nhân vật xuất hiện trong đoạn này: "${selection.text}"`,
      translate: `Dịch đoạn văn này sang tiếng Việt một cách mượt mà và giải thích các thuật ngữ khó (nếu có): "${selection.text}"`,
    }

    setAiAnalysis({ type, content: '', isLoading: true })

    try {
      const response = await askAI({ bookSlug, chapterId, question: prompts[type] }).unwrap()
      setAiAnalysis({ type, content: response.answer, isLoading: false })
    } catch {
      toast.error('AI không thể xử lý lúc này.')
      setAiAnalysis(null)
    }
  }, [selection, askAI, bookSlug, chapterId])

  const getSelectionPerParagraph = useCallback((): { paraId: string; text: string }[] | null => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0)
    const startPara = range.startContainer instanceof Element
      ? range.startContainer.closest('[data-para-id]')
      : range.startContainer.parentElement?.closest('[data-para-id]')
    const endPara = range.endContainer instanceof Element
      ? range.endContainer.closest('[data-para-id]')
      : range.endContainer.parentElement?.closest('[data-para-id]')
    if (!startPara || !endPara || startPara === endPara) return null

    const results: { paraId: string; text: string }[] = []
    let currentEl: Element | null = startPara
    while (currentEl) {
      const paraId = currentEl.getAttribute('data-para-id')
      if (!paraId) { currentEl = currentEl.nextElementSibling; continue }
      const walker = document.createTreeWalker(currentEl, NodeFilter.SHOW_TEXT)
      const fragments: string[] = []
      let node: Node | null
      while ((node = walker.nextNode())) {
        const tc = node.textContent || ''
        if (node === range.startContainer && node === range.endContainer) {
          fragments.push(tc.substring(range.startOffset, range.endOffset)); break
        } else if (node === range.startContainer) {
          fragments.push(tc.substring(range.startOffset))
        } else if (node === range.endContainer) {
          fragments.push(tc.substring(0, range.endOffset)); break
        } else {
          fragments.push(tc)
        }
      }
      const text = fragments.join('').replace(/\s+/g, ' ').trim()
      if (text) results.push({ paraId, text })
      if (currentEl === endPara) break
      currentEl = currentEl.nextElementSibling
    }
    return results.length > 0 ? results : null
  }, [])

  const handleAddHighlight = useCallback(() => {
    if (!selection || !room) return
    const paras = getSelectionPerParagraph()
    if (!paras) {
      addHighlight({
        chapterSlug: room.currentChapterSlug,
        paragraphId: selection.paraId,
        content: selection.text.replace(/\s+/g, ' ').trim(),
      })
    } else {
      for (const p of paras) {
        addHighlight({
          chapterSlug: room.currentChapterSlug,
          paragraphId: p.paraId,
          content: p.text,
        })
      }
    }
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [selection, room, addHighlight, getSelectionPerParagraph])

  const handleAddQuote = useCallback(() => {
    if (!selection || !room) return
    addQuote(room.currentChapterSlug, selection.paraId, selection.text)
    toast.success('Đã thêm trích dẫn!')
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [selection, room, addQuote])

  const handleAddPersonalHighlight = useCallback(async () => {
    if (!selection) return
    const paras = getSelectionPerParagraph()
    if (!paras) {
      try {
        await createPersonalHighlight({
          bookId, chapterId, paragraphId: selection.paraId,
          content: selection.text.replace(/\s+/g, ' ').trim(),
        }).unwrap()
        toast.success('Đã lưu highlight cá nhân')
      } catch {
        toast.error('Không thể lưu highlight cá nhân')
      }
    } else {
      try {
        for (const p of paras) {
          await createPersonalHighlight({ bookId, chapterId, paragraphId: p.paraId, content: p.text }).unwrap()
        }
        toast.success(`Đã lưu ${paras.length} highlight`)
      } catch {
        toast.error('Không thể lưu highlight cá nhân')
      }
    }
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [selection, bookId, chapterId, createPersonalHighlight, getSelectionPerParagraph])

  return {
    selection,
    aiAnalysis,
    setAiAnalysis,
    menuRef,
    handleMouseUp,
    handleAIAction,
    handleAddHighlight,
    handleAddPersonalHighlight,
    handleAddQuote,
  }
}
