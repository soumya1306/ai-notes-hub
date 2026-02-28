import { useState } from "react";
import { FaTrash, FaEdit } from "react-icons/fa";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

function InlineEditor({ initialContent, onSave, onCancel }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editorProps: {
      attributes: { class: "tiptap-editor" },
    },
  });

  return (
    <div>
      <div className="tiptap-wrapper tiptap-wrapper--edit">
        <EditorContent editor={editor} />
      </div>

      <div className="note-actions">
        <button
          onClick={() => onSave(editor?.getHTML() ?? "")}
          className="btn btn-save"
        >
          Save
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function NotesList({ notes, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const startEdit = (note) => {
    setEditingId(note.id);
  };

  const saveEdit = (id) => {
    onUpdate(id, editContent);
    setEditingId(null);
  };

  if (!notes.length) {
    return <div className="empty-state"> No notes yet. Add one above!</div>;
  }

  return (
    <div className="notes-grid">
      {notes.map((note) => (
        <div key={note.id} className="note-card">
          {editingId === note.id ? (
            <InlineEditor
              initialContent={note.content}
              onSave={(html) => saveEdit(note.id, html)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div>
              <div
                className="note-content tiptap-content"
                dangerouslySetInnerHTML={{ __html: note.content}}
              />
              {note.tags.length ? (
                <div className="note-tags">
                  {note.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="note-meta">
                {new Date(note.created_at).toLocaleDateString()}
              </div>
              <div className="note-actions">
                <button
                  onClick={() => startEdit(note)}
                  className="btn btn-edit"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => onDelete(note.id)}
                  className="btn btn-delete"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
