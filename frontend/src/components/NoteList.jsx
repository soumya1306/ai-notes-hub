import { useState } from "react";
import { FaTrash, FaEdit } from "react-icons/fa";

export default function NotesList({ notes, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const startEdit = (note) => {
    console.log(note.id);
    console.log(note.content);
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = (id) => {
    onUpdate(id, editContent);
    setEditingId(null);
    setEditContent("");
  };

  if (!notes.length) {
    return <div className="empty-state"> No notes yet. Add one above!</div>;
  }

  return (
    <div className="notes-grid">
      {notes.map((note) => (
        <div key={note.id} className="note-card">
          {editingId === note.id ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="note-input"
              />
              <div className="note-actions">
                <button
                  onClick={() => saveEdit(note.id)}
                  className="btn btn-save"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="btn btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="note-content"> {note.content} </p>
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
