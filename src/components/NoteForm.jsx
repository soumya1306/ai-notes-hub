import { useState } from "react";

export default function NoteForm({ onAdd }) {
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onAdd(content);
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your note..."
        className="note-input"
        maxLength={500}
      />
      <button type="submit" className="add-btn" disabled={!content.trim()}>
        Add Note
      </button>
    </form>
  );
}
