import { useState, useEffect, useRef } from "react";
import { FaTrash, FaEdit, FaMagic, FaTags, FaShare } from "react-icons/fa";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { summarizeNote, autoTagNote, getCollaborators, shareNote, revokeShare, searchUsers } from "../api/notesAPi";
import { useAuth } from "../context/AuthContext";
import { NoteAttachments } from "./NoteAttachments";
import { useNoteSocket } from "../hooks/useNoteSocket";

function InlineEditor({ initialContent, onSave, onCancel, onTyping }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editorProps: {
      attributes: { class: "tiptap-editor" },
    },
    onUpdate: () => onTyping?.(),
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

function SharePanel({ noteId, onClose }) {
  const { refreshAccessToken } = useAuth();
  const [collaborators, setCollaborators] = useState([]);
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchTimer = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    getCollaborators(noteId, refreshAccessToken)
      .then((data) => setCollaborators(data))
      .catch(() => setError("Failed to fetch collaborators."));
  }, [noteId, refreshAccessToken]);

  // close dropdown on outside click
  useEffect(() => {
    const onClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    clearTimeout(searchTimer.current);
    if (val.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await searchUsers(val.trim(), refreshAccessToken);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.error("searchUsers failed:", err);
        setSuggestions([]);
      }
    }, 300);
  };

  const selectSuggestion = (user) => {
    setEmail(user.email);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleShare = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const perm = await shareNote(noteId, email.trim(), role, refreshAccessToken);
      setCollaborators((prev) => {
        const existing = prev.find((c) => c.user_id === perm.user_id);
        if (existing) {
          return prev.map((c) =>
            c.user_id === perm.user_id ? { ...c, role: perm.role } : c,
          );
        }
        return [...prev, perm];
      });
      setEmail("");
      setSuggestions([]);
    } catch (err) {
      setError(err.message || "Failed to share note.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (targetUserId) => {
    try {
      await revokeShare(noteId, targetUserId, refreshAccessToken);
      setCollaborators((prev) =>
        prev.filter((c) => c.user_id !== targetUserId),
      );
    } catch (err) {
      setError(err.message || "Failed to revoke access.");
    }
  };

  return (
    <div className="share-panel" ref={panelRef}>
      <div className="share-input-row">
        <div className="share-search-wrapper">
          <input
            className="share-email-input"
            type="text"
            value={email}
            onChange={handleEmailChange}
            onKeyDown={(e) => e.key === "Enter" && handleShare()}
            placeholder="Search by email..."
            autoComplete="off"
          />
          {showSuggestions && (
            <ul className="share-suggestions">
              {suggestions.map((u) => (
                <li
                  key={u.id}
                  className="share-suggestion-item"
                  onMouseDown={() => selectSuggestion(u)}
                >
                  {u.email}
                </li>
              ))}
            </ul>
          )}
        </div>
        <select
          className="share-role-select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <button className="btn btn-ai" onClick={handleShare} disabled={loading}>
          {loading ? "Sharing..." : "Share"}
        </button>
      </div>

      {error && <p className="share-error">{error}</p>}

      {collaborators.length > 0 && (
        <div className="collaborators-list">
          {collaborators.map((c) => (
            <div key={c.user_id} className="collaborator-item">
              <span className="collaborator-email">{c.email}</span>
              <span className={`collaborator-role role-${c.role}`}>
                ({c.role})
              </span>
              {c.role !== "owner" && (
                <button
                  className="btn-revoke"
                  onClick={() => handleRevoke(c.user_id)}
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, onDelete, onUpdate, onTagFilter, onLiveUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [summaries, setSummaries] = useState({});
  const [loadingAI, setLoadingAI] = useState({});
  const [remoteTyping, setRemoteTyping] = useState(null);
  const typingTimer = useRef(null);
  const [showSharePanel, setShowSharePanel] = useState(false);

  const { refreshAccessToken, user, accessToken } = useAuth();

  const isOwner = note.my_role === "owner";
  const canEdit = note.my_role === "owner" || note.my_role === "editor";

  const handleWsMessage = (payload) => {
    if (payload.type === "note_updated" && payload.note_id === note.id) {
      onLiveUpdate(note.id, payload.content, payload.tags);
    }
    if (payload.type === "note_deleted" && payload.note_id === note.id) {
      onDelete(note.id);
    }
    if (payload.type === "typing" && payload.note_id === note.id) {
      setRemoteTyping(payload.user_email ?? "Someone");
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setRemoteTyping(null), 2500);
    }
  };

  useEffect(() => () => { if (typingTimer.current) clearTimeout(typingTimer.current); }, []);

  const { send } = useNoteSocket(note.id, accessToken, handleWsMessage);

  const handleTyping = () => {
    send({ type: "typing", note_id: note.id });
  };

  const handleSummarize = async (note) => {
    setLoadingAI((prev) => ({ ...prev, [note.id]: "summarize" }));
    try {
      const res = await summarizeNote(note.id, refreshAccessToken);
      const data = await res.json();
      setSummaries((prev) => ({ ...prev, [note.id]: data.summary }));
    } catch (error) {
      console.error(error);
      setSummaries((prev) => ({ ...prev, [note.id]: "Failed to summarize." }));
    } finally {
      setLoadingAI((prev) => ({ ...prev, [note.id]: null }));
    }
  };

  const handleAutoTags = async (note) => {
    setLoadingAI((prev) => ({ ...prev, [note.id]: "autotags" }));
    try {
      const res = await autoTagNote(note.id, refreshAccessToken);
      const data = await res.json();
      onUpdate(note.id, note.content, data.tags);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI((prev) => ({ ...prev, [note.id]: null }));
    }
  };

  return (
    <div className="note-card">
      {remoteTyping && (
        <div className="remote-typing-indicator">
          {remoteTyping} is editing...
        </div>
      )}

      {editingId === note.id ? (
        <InlineEditor
          initialContent={note.content}
          onSave={(html) => {
            onUpdate(note.id, html, note.tags);
            setEditingId(null);
          }}
          onCancel={() => setEditingId(null)}
          onTyping={handleTyping}
        />
      ) : (
        <div>
          <div
            className="note-content tiptap-output"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />

          {summaries[note.id] && (
            <div className="note-summary">
              <span className="summary-label">✨ Summary</span>
              <p>{summaries[note.id]}</p>
            </div>
          )}

          {note.tags.length ? (
            <div className="note-tags">
              {note.tags.map((tag, index) => (
                <span
                  key={index}
                  className="tag"
                  onClick={() => onTagFilter?.(tag)}
                  title={`Filter by ${tag}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="note-meta">
            {new Date(note.created_at).toLocaleDateString()}
            {!isOwner && <span className="role-badge">{note.my_role}</span>}
          </div>

          <div className="note-actions">
            {canEdit && (
              <button
                onClick={() => setEditingId(note.id)}
                className="btn btn-edit"
              >
                <FaEdit /> Edit
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => onDelete(note.id)}
                className="btn btn-delete"
              >
                <FaTrash /> Delete
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setShowSharePanel((prev) => !prev)}
                className="btn btn-share"
              >
                <FaShare /> {showSharePanel ? "Close" : "Share"}
              </button>
            )}

            {showSharePanel && isOwner && (
              <SharePanel
                noteId={note.id}
                onClose={() => setShowSharePanel(false)}
              />
            )}
          </div>

          <div className="note-actions" style={{ marginTop: "8px" }}>
            <button
              onClick={() => handleSummarize(note)}
              className="btn btn-ai"
              disabled={!!loadingAI[note.id]}
            >
              <FaMagic />
              {loadingAI[note.id] === "summarize"
                ? "Summarizing..."
                : "Summarize"}
            </button>

            <button
              onClick={() => handleAutoTags(note)}
              className="btn btn-ai"
              disabled={!!loadingAI[note.id]}
            >
              <FaTags />
              {loadingAI[note.id] === "autotags" ? "Tagging..." : "Auto Tags"}
            </button>
          </div>

          <NoteAttachments noteId={note.id} />
        </div>
      )}
    </div>
  );
}

export default function NotesList({
  notes,
  onDelete,
  onUpdate,
  onTagFilter,
  onLiveUpdate,
}) {
  if (!notes.length) {
    return <div className="empty-state">No notes yet. Add one above!</div>;
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
          onLiveUpdate={onLiveUpdate}
        />
      ))}
    </div>
  );
}
