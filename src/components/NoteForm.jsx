import { useState } from "react";

export default function NoteForm({ onAdd }) {
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim().toLocaleLowerCase());
      onAdd(content, tags);
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
      <input
        type="text"
        placeholder="Tags: frontend, react, css (comma separated)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        className="note-input"
        style={{ minHeight: "auto", fontSize: "14px", marginTop: "10px" }}
      />
      <button type="submit" className="add-btn" disabled={!content.trim()}>
        Add Note
      </button>
    </form>
  );
}
