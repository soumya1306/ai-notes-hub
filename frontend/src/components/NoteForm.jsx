import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Extension from "@tiptap/core";
import { useCallback, useState } from "react";

const DoubleEnterExitMark = Extension.create({
  name: "doubleEnterExitMark",

  addStorage() {
    return {
      lastEnterTime: 0,
    };
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor.view;
        const { selection, storedMarks } = state;
        const { $from } = selection;

        const marksAtCursor = storedMarks || $from.marks();
        if (marksAtCursor.length === 0) return false;

        const now = Date.now();
        const timeSinceLast = now - this.storage.lastEnterTime;
        this.storage.lastEnterTime = now;

        const isDoubleEnter = timeSinceLast < 500; // 500 ms window

        if (isDoubleEnter) {
          editor.commands.splitBlock();
          editor.commands.unsetAllMarks();
          return true;
        }

        return false;
      },
    };
  },
});

function Toolbar({ editor }) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive("bold"),
      isItalic: ctx.editor.isActive("italic"),
      isStrike: ctx.editor.isActive("strike"),
      isH2: ctx.editor.isActive("heading", { level: 2 }),
      isBullet: ctx.editor.isActive("bulletList"),
      isOrdered: ctx.editor.isActive("orderedList"),
      isCode: ctx.editor.isActive("codeBlock"),
      isBlockquote: ctx.editor.isActive("blockquote"),
    }),
  });

  if (!editor) return null;

  return (
    <div className="tiptap-toolbar">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`toolbar-btn ${editorState.isBold ? "is-active" : ""}`}
        title="Bold"
      >
        <strong>B</strong>
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`toolbar-btn ${editorState.isItalic ? "is-active" : ""}`}
        title="Italic"
      >
        <em>I</em>
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`toolbar-btn ${editorState.isStrike ? "is-active" : ""}`}
        title="Strikethrough"
      >
        <s>S</s>
      </button>

      <span className="toolbar-divider" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`toolbar-btn ${editorState.isH2 ? "is-active" : ""}`}
        title="Heading"
      >
        H2
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`toolbar-btn ${editorState.isBullet ? "is-active" : ""}`}
        title="Bullet List"
      >
        &#8226; List
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`toolbar-btn ${editorState.isOrdered ? "is-active" : ""}`}
        title="Ordered List"
      >
        1. List
      </button>

      <span className="toolbar-divider" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`toolbar-btn ${editorState.isCode ? "is-active" : ""}`}
        title="Code Block"
      >
        {"</>"}
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`toolbar-btn ${editorState.isBlockquote ? "is-active" : ""}`}
        title="Blockquote"
      >
        "
      </button>
    </div>
  );
}

export default function NoteForm({ onAdd }) {
  const [tagsInput, setTagsInput] = useState("");

  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ code: false }),
      Code.configure({}),
      DoubleEnterExitMark,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },

    onTransaction: useCallback(() => {
      forceUpdate((n) => n + 1);
    }, []),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = editor.getHTML() ?? "";
    const isEmpty = editor.isEmpty ?? true;

    if (!isEmpty) {
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim().toLocaleLowerCase())
        .filter(Boolean);
      onAdd(content, tags);
      editor.commands.clearContent();
      setTagsInput("");
    }
  };

  const isEmpty = editor?.isEmpty ?? true;

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <div className="tiptap-wrapper">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <input
        type="text"
        placeholder="Tags: frontend, react, css (comma separated)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        className="note-input"
        style={{ minHeight: "auto", fontSize: "14px", marginTop: "10px" }}
      />
      <button type="submit" className="add-btn" disabled={isEmpty}>
        Add Note
      </button>
    </form>
  );
}
