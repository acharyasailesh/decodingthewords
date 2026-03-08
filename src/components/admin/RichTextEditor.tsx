"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Link } from "@tiptap/extension-link";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Table as TableIcon,
    Plus,
    Trash2,
    Columns,
    Rows
} from "lucide-react";

interface Props {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    language?: string;
    blockType?: string;
}

export default function RichTextEditor({ content, onChange, placeholder, language, blockType }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        immediatelyRender: false,
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[150px] p-4 text-justify ${language === "nepali" ? "font-nepali text-lg" : ""} ${blockType === "diary" ? "diary-mode font-mono" : ""
                    }`,
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-black/10 rounded-xl overflow-hidden bg-white shadow-sm transition-all focus-within:border-gold/50">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 bg-[#F4F5F9] border-b border-black/5">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive("bold") ? "text-gold bg-white shadow-sm" : "text-black/40"}`}
                    title="Bold"
                >
                    <Bold size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive("italic") ? "text-gold bg-white shadow-sm" : "text-black/40"}`}
                    title="Italic"
                >
                    <Italic size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive("underline") ? "text-gold bg-white shadow-sm" : "text-black/40"}`}
                    title="Underline"
                >
                    <UnderlineIcon size={16} />
                </button>

                <div className="w-px h-6 bg-black/5 mx-1" />

                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive("bulletList") ? "text-gold bg-white shadow-sm" : "text-black/40"}`}
                    title="Bullet List"
                >
                    <List size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive("orderedList") ? "text-gold bg-white shadow-sm" : "text-black/40"}`}
                    title="Ordered List"
                >
                    <ListOrdered size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded hover:bg-white transition-colors ${editor.isActive("blockquote") ? "text-gold bg-white shadow-sm" : "text-black/40"}`}
                    title="Quote"
                >
                    <Quote size={16} />
                </button>

                <div className="w-px h-6 bg-black/5 mx-1" />

                {/* Table Controls */}
                <button
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className="p-2 rounded hover:bg-white text-black/40 transition-colors"
                    title="Insert Table"
                >
                    <TableIcon size={16} />
                </button>
                {editor.isActive('table') && (
                    <>
                        <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="p-2 rounded hover:bg-white text-green-600/60" title="Add Column After"><Columns size={16} /></button>
                        <button onClick={() => editor.chain().focus().addRowAfter().run()} className="p-2 rounded hover:bg-white text-green-600/60" title="Add Row After"><Rows size={16} /></button>
                        <button onClick={() => editor.chain().focus().deleteColumn().run()} className="p-2 rounded hover:bg-white text-red-500/60" title="Delete Column"><Trash2 size={16} className="rotate-90" /></button>
                        <button onClick={() => editor.chain().focus().deleteRow().run()} className="p-2 rounded hover:bg-white text-red-500/60" title="Delete Row"><Trash2 size={16} /></button>
                    </>
                )}

                <div className="ml-auto flex items-center gap-1">
                    <button
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="p-2 rounded hover:bg-white text-black/40 disabled:opacity-20 flex items-center transition-colors"
                    >
                        <Undo size={14} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="p-2 rounded hover:bg-white text-black/40 disabled:opacity-20 flex items-center transition-colors"
                    >
                        <Redo size={14} />
                    </button>
                </div>
            </div>

            <EditorContent editor={editor} />

            <style jsx global>{`
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
          border: 1px solid #ddd;
        }
        .ProseMirror td, .ProseMirror th {
          min-width: 1em;
          border: 1px solid #ddd;
          padding: 3px 5px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .ProseMirror th {
          font-weight: bold;
          text-align: left;
          background-color: #f1f1f1;
        }
        .ProseMirror .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }
        .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          z-index: 20;
          background-color: #adf;
          pointer-events: none;
        }
        .ProseMirror p {
          margin: 0;
          text-align: justify !important;
          text-justify: inter-word !important;
          white-space: pre-wrap;
        }
        .ProseMirror {
          padding: 1.25rem;
          min-height: 200px;
          outline: none;
          text-align: justify !important;
          text-justify: inter-word !important;
          white-space: pre-wrap;
        }

        /* Specific diary mode styles (pre-tag behavior) */
        .ProseMirror.diary-mode, .ProseMirror.diary-mode p {
          text-align: justify !important;
          text-justify: inter-word !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
      `}</style>
        </div>
    );
}
