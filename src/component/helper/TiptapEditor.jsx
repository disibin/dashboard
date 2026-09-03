'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  FiBold, FiItalic, FiList, FiCheckSquare,
  FiCode, FiRotateCcw, FiRotateCw
} from 'react-icons/fi'

export default function TiptapEditor({ value = '', onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      if (onChange) onChange(html)
    },
  })

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) {
    return <div className="h-32 bg-slate-50 rounded-2xl border border-slate-200 animate-pulse p-4 text-slate-400 text-xs">Loading...</div>
  }

  return (
    <div className="w-full border border-slate-200 rounded-2xl overflow-hidden bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-100 text-slate-600">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-xl text-xs font-semibold transition-all ${
            editor.isActive('bold') ? 'bg-slate-900 text-white' : 'hover:bg-slate-200 text-slate-700'
          }`}
          title="Bold"
        >
          <FiBold size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-xl text-xs font-semibold transition-all ${
            editor.isActive('italic') ? 'bg-slate-900 text-white' : 'hover:bg-slate-200 text-slate-700'
          }`}
          title="Italic"
        >
          <FiItalic size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-xl text-xs font-semibold transition-all ${
            editor.isActive('strike') ? 'bg-slate-900 text-white' : 'hover:bg-slate-200 text-slate-700'
          }`}
          title="Strikethrough"
        >
          <s>S</s>
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-xl text-xs font-semibold transition-all ${
            editor.isActive('bulletList') ? 'bg-slate-900 text-white' : 'hover:bg-slate-200 text-slate-700'
          }`}
          title="Bullet List"
        >
          <FiList size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-xl text-xs font-semibold transition-all ${
            editor.isActive('orderedList') ? 'bg-slate-900 text-white' : 'hover:bg-slate-200 text-slate-700'
          }`}
          title="Numbered List"
        >
          <FiCheckSquare size={14} />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-xl text-xs font-semibold transition-all ${
            editor.isActive('codeBlock') ? 'bg-slate-900 text-white' : 'hover:bg-slate-200 text-slate-700'
          }`}
          title="Code Block"
        >
          <FiCode size={14} />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded-xl text-xs font-semibold hover:bg-slate-200 text-slate-700 transition-all"
          title="Undo"
        >
          <FiRotateCcw size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 rounded-xl text-xs font-semibold hover:bg-slate-200 text-slate-700 transition-all"
          title="Redo"
        >
          <FiRotateCw size={14} />
        </button>
      </div>

      <div className="p-4 min-h-[140px] max-h-[350px] overflow-y-auto text-sm text-slate-800 focus:outline-none prose prose-slate max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
