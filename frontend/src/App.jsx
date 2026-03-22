import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import NoteForm from "./components/NoteForm";
import NotesList from "./components/NoteList";
import "./App.css";
import { notesApi, semanticSearch } from "./api/notesAPi";
import RegisterForm from "./components/RegisterForm";
import OAuthCallback from "./components/OAuthCallback";
import LoginForm from "./components/LoginForm";
import QAPanel from "./components/QAPanel";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";

function NotesPage() {
  const { isAuthenticated, logout, refreshAccessToken, accessToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchMode, setSearchMode] = useState("keyword");
  const [semanticLoading, setSemanticLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // refs so WS handler always sees the latest values without reconnecting
  const debouncedSearchRef = useRef(debouncedSearch);
  const refreshRef = useRef(refreshAccessToken);
  useEffect(() => { debouncedSearchRef.current = debouncedSearch; }, [debouncedSearch]);
  useEffect(() => { refreshRef.current = refreshAccessToken; });

  // fetch (and re-fetch) notes whenever search/mode changes
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    if (searchMode === "semantic") return;

    const fetchNotes = async (query) => {
      try {
        const fetched = await notesApi.getNotes(refreshAccessToken, query);
        setNotes(Array.isArray(fetched) ? fetched : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes(debouncedSearch);
  }, [isAuthenticated, refreshAccessToken, debouncedSearch, searchMode]);

  // Per-user WS — backend pushes "note_shared" so we refetch instantly
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    let alive = true;
    let ws = null;

    const connect = () => {
      if (!alive) return;
      ws = new WebSocket(`${WS_BASE}/ws/user?token=${accessToken}`);
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "note_shared") {
            notesApi
              .getNotes(refreshRef.current, debouncedSearchRef.current)
              .then((fetched) => setNotes(Array.isArray(fetched) ? fetched : []))
              .catch(() => {});
          }
        } catch { /* ignore malformed frames */ }
      };
      ws.onclose = () => { if (alive) setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      alive = false;
      if (ws) { ws.onclose = null; ws.close(); }
    };
  }, [isAuthenticated, accessToken]);

  // 60 s fallback poll — catches anything the WS misses (e.g. if it's down)
  useEffect(() => {
    if (!isAuthenticated || searchMode === "semantic") return;
    const interval = setInterval(async () => {
      try {
        const fetched = await notesApi.getNotes(refreshRef.current, debouncedSearchRef.current);
        setNotes(Array.isArray(fetched) ? fetched : []);
      } catch { /* silently ignore */ }
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, searchMode]);

  const handleSemanticSearch = async () => {
    if (!search.trim()) return;
    setSemanticLoading(true);
    try {
      const results = await semanticSearch(search.trim(), refreshAccessToken);
      setNotes(results.map((r) => r.note));
    } catch (error) {
      setError(error.message);
    } finally {
      setSemanticLoading(false);
    }
  };

  const addNote = async (content, tags) => {
    const newNote = await notesApi.createNote(
      content,
      tags,
      refreshAccessToken,
    );
    setNotes((prev) => [newNote, ...prev]);
  };

  const deleteNote = async (id) => {
    await notesApi.deleteNote(id, refreshAccessToken);
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const updateNote = async (id, content, tags = []) => {
    const note = notes.find((n) => n.id === id);
    const resolvedTags = tags ?? note?.tags ?? [];
    const updatedNote = await notesApi.updateNote(
      id,
      content,
      resolvedTags,
      refreshAccessToken,
    );

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updatedNote } : n)),
    );
  };

  const liveUpdateNote = (id, content, tags) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, content, tags } : note)),
    );
  };

  if (loading)
    return (
      <div className="app-container">
        <p>Loading...</p>
      </div>
    );

  if (error)
    return (
      <div className="app-container">
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-brand">
          <img src="/logo.svg" alt="AI Notes Hub" className="header-logo" />
          <div>
            <h1>AI Notes Hub</h1>
            <p className="header-tagline">Smart notes, powered by AI</p>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          Sign Out
        </button>
      </div>
      <NoteForm onAdd={addNote} />

      <div className="search-bar-wrapper">
        <div className="search-mode-toggle">
          <button
            className={`mode-btn ${searchMode === "keyword" ? "mode-btn--active" : ""}`}
            onClick={() => {
              setSearchMode("keyword");
              setSearch("");
            }}
          >
            Keyword
          </button>
          <button
            className={`mode-btn ${searchMode === "semantic" ? "mode-btn--active" : ""}`}
            onClick={() => {
              setSearchMode("semantic");
              setSearch("");
            }}
          >
            ✨ Semantic
          </button>
        </div>

        <div className="search-input-row">
          <input
            className="search-input"
            type="text"
            placeholder={
              searchMode === "semantic"
                ? "Ask anything about your notes..."
                : "Search notes or tags"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchMode === "semantic")
                handleSemanticSearch();
            }}
          />
          {searchMode === "semantic" && (
            <button
              className="btn btn-ai search-semantic-btn"
              onClick={handleSemanticSearch}
              disabled={semanticLoading || !search.trim()}
            >
              {semanticLoading ? "Searching..." : "Search"}
            </button>
          )}
          {search && searchMode === "keyword" && (
            <button className="search-clear" onClick={() => setSearch("")}>
              x
            </button>
          )}
        </div>
      </div>

      <QAPanel />

      <div className="notes-section">
        <NotesList
          notes={notes}
          onDelete={deleteNote}
          onUpdate={updateNote}
          onTagFilter={(tag) => setSearch(tag)}
          onLiveUpdate={liveUpdateNote}
        />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />}
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <RegisterForm />
        }
      />

      <Route path="/oauth-callback" element={<OAuthCallback />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <NotesPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
