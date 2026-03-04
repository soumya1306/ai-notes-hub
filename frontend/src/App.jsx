import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import NoteForm from "./components/NoteForm";
import NotesList from "./components/NoteList";
import "./App.css";
import { notesApi, semanticSearch } from "./api/notesAPi";
import RegisterForm from "./components/RegisterForm";
import OAuthCallback from "./components/OAuthCallback";
import LoginForm from "./components/LoginForm";

function NotesPage() {
  const { isAuthenticated, logout, refreshAccessToken } = useAuth();
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

  const handleSemanticSearch = async () => {
    if (!search.trim()) return;
    setSemanticLoading(true);
    try {
      const results = await semanticSearch(search.trim());
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
      prev.map((note) => (note.id === id ? updatedNote : note)),
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
        <h1>AI Notes Hub</h1>
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

      <div className="notes-section">
        <NotesList
          notes={notes}
          onDelete={deleteNote}
          onUpdate={updateNote}
          onTagFilter={(tag) => setSearch(tag)}
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
