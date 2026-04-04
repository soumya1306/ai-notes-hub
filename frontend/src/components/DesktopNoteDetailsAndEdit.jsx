import { useState, useEffect, useRef } from "react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

import NoteForm  from "./NoteForm";
import NoteAttachments  from "./NoteAttachments";
import ShareModal from "./ShareModal";

import { summarizeNote, autoTagNote } from "../api/notesAPi";
import { useNoteSocket } from "../hooks/useNoteSocket";

import { FaArrowLeft, FaMagic, FaTags, FaShare, FaTrash } from "react-icons/fa";

const DesktopNoteDetailAndEdit = ({ note, onBack, updateNote, deleteNote }) => {
  const { refreshAccessToken, accessToken } = useAuth();
  const { addToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [loadingAI, setLoadingAI] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(null);
  const typingTimerRef = useRef(null);

  const isOwner = note.my_role === "owner";
  const canEdit = note.my_role === "owner" || note.my_role === "editor";

  const handleWsMessage = (payload) => {
    if (payload.type === "note_deleted" && payload.note_id === note.id) {
      addToast("This note was deleted.", "info");
      onBack();
    }
    if (payload.type === "typing" && payload.note_id === note.id) {
      setRemoteTyping(payload.user_email ?? "Someone");
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setRemoteTyping(null), 2500);
    }
  };

  const { send } = useNoteSocket(note.id, accessToken, handleWsMessage);
  useEffect(() => () => clearTimeout(typingTimerRef.current), []);

  const handleSave = async (content, tags) => {
    try {
      await updateNote(note.id, content, tags);
      onBack();
    }
    catch { /* toast shown by updateNote */ }
  };

  const handleTyping = () => send({ type: "typing", note_id: note.id });

  const handleDelete = async () => {
    await deleteNote(note.id);
  };

  const handleSummarize = async () => {
    setLoadingAI("summarize");
    try {
      const res = await summarizeNote(note.id, refreshAccessToken);
      const data = await res.json();
      setSummary(data.summary);
    } catch { setSummary("Failed to summarize."); }
    finally { setLoadingAI(null); }
  };

  const handleAutoTags = async () => {
    setLoadingAI("autotags");
    try {
      const res = await autoTagNote(note.id, refreshAccessToken);
      const data = await res.json();
      await updateNote(note.id, note.content, data.tags);
    } catch { /* toast shown by updateNote */ }
    finally { setLoadingAI(null); }
  };

  return (
    <div className="note-detail">
      <div className="note-detail-header">
        <button className="btn-back" onClick={onBack}>
          <FaArrowLeft /> Back
        </button>
        <div className="note-detail-actions">
          <button className="btn btn-ai" onClick={handleSummarize} disabled={!!loadingAI}>
            <FaMagic /> {loadingAI === "summarize" ? "Summarizing..." : "Summarize"}
          </button>
          <button className="btn btn-ai" onClick={handleAutoTags} disabled={!!loadingAI}>
            <FaTags /> {loadingAI === "autotags" ? "Tagging..." : "Auto Tags"}
          </button>
          {isOwner && (
            <button className="btn btn-share" onClick={() => setShowShare(true)}>
              <FaShare /> Share
            </button>
          )}
          {isOwner && (
            <button className="btn btn-delete" onClick={handleDelete}>
              <FaTrash /> Delete
            </button>
          )}
        </div>
      </div>

      <p className="note-detail-meta">
        Created {new Date(note.created_at).toLocaleDateString()}
        {note.updated_at && note.updated_at !== note.created_at && (
          <> · Updated {new Date(note.updated_at).toLocaleDateString()}</>
        )}
        {!isOwner && <span className="role-badge" style={{ marginLeft: 8 }}>{note.my_role}</span>}
      </p>

      {remoteTyping && <p className="remote-typing-detail">{remoteTyping} is editing…</p>}

      {summary && (
        <div className="note-summary">
          <span className="summary-label">✨ Summary</span>
          <p>{summary}</p>
        </div>
      )}

      {canEdit ? (
        <div className="note-detail-edit-layout">
          <div className="note-detail-editor-col">
            <NoteForm
              initialContent={note.content}
              initialTags={note.tags}
              onAdd={handleSave}
              onTyping={handleTyping}
              submitLabel="Save"
              clearOnSubmit={false}
            />
            <NoteAttachments noteId={note.id} />
          </div>

          <aside className="note-shortcuts-panel">
            <p className="shortcuts-heading">Shortcuts</p>

            <div className="shortcuts-group">
              <p className="shortcuts-group-label">Formatting</p>
              <div className="shortcut-item">
                <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">B</kbd></span></div>
                <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">B</kbd></span></div>
                <span className="shortcut-desc">Bold</span>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">I</kbd></span></div>
                <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">I</kbd></span></div>
                <span className="shortcut-desc">Italic</span>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">⇧</kbd><kbd className="shortcut-key">S</kbd></span></div>
                <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">⇧</kbd><kbd className="shortcut-key">S</kbd></span></div>
                <span className="shortcut-desc">Strikethrough</span>
              </div>
            </div>

            <div className="shortcuts-group">
              <p className="shortcuts-group-label">Blocks</p>
              <div className="shortcut-item">
                <span className="shortcut-keys"><kbd className="shortcut-key">##</kbd><kbd className="shortcut-key">␣</kbd></span>
                <span className="shortcut-desc">Heading</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-keys"><kbd className="shortcut-key">-</kbd><kbd className="shortcut-key">␣</kbd></span>
                <span className="shortcut-desc">Bullet list</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-keys"><kbd className="shortcut-key">1.</kbd><kbd className="shortcut-key">␣</kbd></span>
                <span className="shortcut-desc">Numbered list</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-keys"><kbd className="shortcut-key">{">"}</kbd><kbd className="shortcut-key">␣</kbd></span>
                <span className="shortcut-desc">Blockquote</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-keys"><kbd className="shortcut-key">```</kbd><kbd className="shortcut-key">↵</kbd></span>
                <span className="shortcut-desc">Code block</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-keys"><kbd className="shortcut-key">---</kbd><kbd className="shortcut-key">↵</kbd></span>
                <span className="shortcut-desc">Divider</span>
              </div>
            </div>

            <div className="shortcuts-group">
              <p className="shortcuts-group-label">Lists</p>
              <div className="shortcut-item">
                <span className="shortcut-keys"><kbd className="shortcut-key">Tab</kbd></span>
                <span className="shortcut-desc">Indent item</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-keys"><kbd className="shortcut-key">⇧</kbd><kbd className="shortcut-key">Tab</kbd></span>
                <span className="shortcut-desc">Outdent item</span>
              </div>
            </div>

            <div className="shortcuts-group">
              <p className="shortcuts-group-label">Editor</p>
              <div className="shortcut-item">
                <span className="shortcut-keys"><kbd className="shortcut-key">↵↵</kbd></span>
                <span className="shortcut-desc">Exit code mark</span>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">↵</kbd></span></div>
                <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">↵</kbd></span></div>
                <span className="shortcut-desc">Save note</span>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">Z</kbd></span></div>
                <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">Z</kbd></span></div>
                <span className="shortcut-desc">Undo</span>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">⇧</kbd><kbd className="shortcut-key">Z</kbd></span></div>
                <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">Y</kbd></span></div>
                <span className="shortcut-desc">Redo</span>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <>
          <div
            className="tiptap-output note-detail-readonly"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
          <NoteAttachments noteId={note.id} />
        </>
      )}
      {( showShare) && <ShareModal noteId={note.id} onClose={() => setShowShare(false)} />}
    </div>
  );
}

export default DesktopNoteDetailAndEdit;