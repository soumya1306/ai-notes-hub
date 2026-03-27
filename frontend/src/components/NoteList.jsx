import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaMagic, FaTags, FaShare } from "react-icons/fa";
import { useNoteSocket } from "../hooks/useNoteSocket";
import {
  summarizeNote,
  autoTagNote,
} from "../api/notesAPi";
import { useAuth } from "../context/AuthContext";
import NoteForm from "./NoteForm";
import ShareModal from "./ShareModal";

function NoteCard({ note, onDelete, onUpdate, onTagFilter, onSelect, isSelected, onLiveUpdate }) {
  const [summary, setSummary] = useState(null);
  const [loadingAI, setLoadingAI] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(null);
  const typingTimer = useRef(null);
  const navigate = useNavigate();
  const { refreshAccessToken, accessToken } = useAuth();

  const handleOpen = () => {
    if (onSelect) onSelect(note.id);
    else navigate(`/notes/${note.id}`);
  };

  const isOwner = note.my_role === "owner";
  const canEdit = note.my_role === "owner" || note.my_role === "editor";

  const handleWsMessage = (payload) => {
    if (payload.type === "note_updated" && payload.note_id === note.id) {
      onLiveUpdate?.(note.id, payload.content, payload.tags);
    }
    if (payload.type === "note_deleted" && payload.note_id === note.id) {
      onDelete(note.id);
    }
    if (payload.type === "typing" && payload.note_id === note.id) {
      setRemoteTyping(payload.user_email ?? "Someone");
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setRemoteTyping(null), 2500);
    }
  };

  useNoteSocket(note.id, accessToken, handleWsMessage);

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const handleSummarize = async () => {
    setLoadingAI("summarize");
    try {
      const res = await summarizeNote(note.id, refreshAccessToken);
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary("Failed to summarize.");
    } finally {
      setLoadingAI(null);
    }
  };

  const handleAutoTags = async () => {
    setLoadingAI("autotags");
    try {
      const res = await autoTagNote(note.id, refreshAccessToken);
      const data = await res.json();
      onUpdate(note.id, note.content, data.tags);
    } catch { /* ignore */ } finally {
      setLoadingAI(null);
    }
  };

  // Mobile inline save
  const handleInlineSave = async (content, tags) => {
    await onUpdate(note.id, content, tags);
    setEditing(false);
  };

  // Mobile inline edit mode
  if (!onSelect && editing && canEdit) {
    return (
      <div className="note-card note-card--editing">
        <NoteForm
          initialContent={note.content}
          initialTags={note.tags}
          onAdd={handleInlineSave}
          submitLabel="Save"
          clearOnSubmit={false}
          onTyping={() => {}}
        />
        <button
          className="btn-cancel-edit"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className={`note-card${isSelected ? " note-card--selected" : ""}`}
      onClick={onSelect ? (e) => { if (!e.target.closest(".note-actions")) handleOpen(); } : undefined}
    >
      {note.my_role !== "owner" && (
        <span className="note-shared-badge">shared</span>
      )}
      <div
        className={`note-content tiptap-output note-content--preview${!onSelect && !expanded ? " note-content--collapsed" : ""}`}
        dangerouslySetInnerHTML={{ __html: note.content }}
      />

      {/* Read more / Show less — mobile only (CSS controls display) */}
      {!onSelect && (
        <button
          className="btn-read-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {remoteTyping && (
        <p className="remote-typing-indicator">{remoteTyping} is typing…</p>
      )}

      {summary && (
        <div className="note-summary">
          <span className="summary-label">✨ Summary</span>
          <p>{summary}</p>
        </div>
      )}

      {note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="tag tag--clickable"
              onClick={() => onTagFilter?.(tag)}
              title={`Filter by ${tag}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="note-meta">
        <span>
          Updated{" "}
          {new Date(note.updated_at ?? note.created_at).toLocaleDateString()}
        </span>
        {!isOwner && <span className="role-badge">{note.my_role}</span>}
      </div>

      <div className="note-actions">
        {!onSelect && canEdit && (
          <button className="btn btn-edit" onClick={() => setEditing(true)}>Edit</button>
        )}
        {isOwner && (
          <button className="btn btn-delete" onClick={() => onDelete(note.id)}>
            <FaTrash /> Delete
          </button>
        )}
        {isOwner && (
          <button
            className="btn btn-share"
            onClick={() => setShowShareModal(true)}
          >
            <FaShare /> Share
          </button>
        )}
      </div>

      <div className="note-actions" style={{ marginTop: "8px" }}>
        <button
          className="btn btn-ai"
          onClick={handleSummarize}
          disabled={!!loadingAI}
        >
          <FaMagic />
          {loadingAI === "summarize" ? "Summarizing..." : "Summarize"}
        </button>
        <button
          className="btn btn-ai"
          onClick={handleAutoTags}
          disabled={!!loadingAI}
        >
          <FaTags />
          {loadingAI === "autotags" ? "Tagging..." : "Auto Tags"}
        </button>
      </div>

      {showShareModal && isOwner && (
        <ShareModal
          noteId={note.id}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

export default function NotesList({ notes, onDelete, onUpdate, onTagFilter, onSelect, selectedId, onLiveUpdate }) {
  if (!notes.length) {
    return <div className="empty-state">No notes yet. Add one!</div>;
  }

  return (
    <div className="notes-grid">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onTagFilter={onTagFilter}
          onSelect={onSelect}
          isSelected={selectedId === note.id}
          onLiveUpdate={onLiveUpdate}
        />
      ))}
    </div>
  );
}
