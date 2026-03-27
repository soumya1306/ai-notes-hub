import { useState, useEffect, useRef } from "react";
import { FaShare } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import {
  getCollaborators,
  revokeShare,
  searchUsers,
  shareNote,
} from "../api/notesAPi";

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
      const perm = await shareNote(
        noteId,
        email.trim(),
        role,
        refreshAccessToken,
      );
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

const ShareModal = ({ noteId, onClose }) => {

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="share-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="share-modal" role="dialog" aria-modal="true" aria-label="Share note">
        <div className="share-modal-header">
          <span className="share-modal-title"><FaShare /> Share Note</span>
          <button className="share-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
         <SharePanel noteId={noteId} onClose={onClose} />
      </div>
    </div>
  );
}

export default ShareModal;
