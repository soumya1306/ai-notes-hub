import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./context/ToastContext";
import MobileNotes from "./components/MobileNotes";
import DesktopNotes from "./components/DesktopNotes";

import { useIsDesktop } from "./hooks/useIsDesktop";
import "./App.css";
import { notesApi, semanticSearch } from "./api/notesAPi";
import RegisterForm from "./components/RegisterForm";
import OAuthCallback from "./components/OAuthCallback";
import LoginForm from "./components/LoginForm";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";

function NotesShell() {
  const isDesktop = useIsDesktop();
  const { isAuthenticated, refreshAccessToken, accessToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchMode, setSearchMode] = useState("keyword");
  const [semanticLoading, setSemanticLoading] = useState(false);

  const { addToast } = useToast();

  // debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const debouncedSearchRef = useRef(debouncedSearch);
  const refreshRef = useRef(refreshAccessToken);
  useEffect(() => {
    debouncedSearchRef.current = debouncedSearch;
  }, [debouncedSearch]);
  useEffect(() => {
    refreshRef.current = refreshAccessToken;
  });

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
              .then((fetched) =>
                setNotes(Array.isArray(fetched) ? fetched : []),
              )
              .catch(() => {});
          }
        } catch {}
      };
      ws.onclose = () => {
        if (alive) setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => {
      alive = false;
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [isAuthenticated, accessToken]);

  // 60 s fallback poll
  useEffect(() => {
    if (!isAuthenticated || searchMode === "semantic") return;
    const interval = setInterval(async () => {
      try {
        const fetched = await notesApi.getNotes(
          refreshRef.current,
          debouncedSearchRef.current,
        );
        setNotes(Array.isArray(fetched) ? fetched : []);
      } catch {
        // silently ignore
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, searchMode]);

  const handleSemanticSearch = async () => {
    if (!search.trim()) return;
    setSemanticLoading(true);
    try {
      const results = await semanticSearch(search.trim(), refreshAccessToken);
      setNotes(results.map((r) => r.note));
    } catch (err) {
      setError(err.message);
    } finally {
      setSemanticLoading(false);
    }
  };

  const addNote = async (content, tags) => {
    try {
      const newNote = await notesApi.createNote(
        content,
        tags,
        refreshAccessToken,
      );
      setNotes((prev) => [newNote, ...prev]);
      addToast("Note created!", "success");
      return newNote;
    } catch (err) {
      addToast(`Failed to add note: ${err.message}`, "error");
    }
  };

  const deleteNote = async (id) => {
    try {
      await notesApi.deleteNote(id, refreshAccessToken);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      addToast("Note deleted.", "success");
    } catch (err) {
      addToast(`Failed to delete note: ${err.message}`, "error");
      throw err;
    }
  };

  const updateNote = async (id, content, tags = []) => {
    try {
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
      addToast("Note saved.", "success");
      return updatedNote;
    } catch (err) {
      addToast(err.message, "error");
      throw err;
    }
  };

  const liveUpdateNote = (id, content, tags) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, content, tags } : note)),
    );
  };

  return isDesktop ? (
    <DesktopNotes
      notes={notes}
      loading={loading}
      error={error}
      addNote={addNote}
      deleteNote={deleteNote}
      updateNote={updateNote}
      search={search}
      setSearch={setSearch}
      searchMode={searchMode}
      setSearchMode={setSearchMode}
      handleSemanticSearch={handleSemanticSearch}
      semanticLoading={semanticLoading}
      liveUpdateNote={liveUpdateNote}
    />
  ) : (
    <MobileNotes
      notes={notes}
      loading={loading}
      error={error}
      addNote={addNote}
      deleteNote={deleteNote}
      updateNote={updateNote}
      search={search}
      setSearch={setSearch}
      searchMode={searchMode}
      setSearchMode={setSearchMode}
      handleSemanticSearch={handleSemanticSearch}
      semanticLoading={semanticLoading}
      liveUpdateNote={liveUpdateNote}
    />
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !isLoading && isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <LoginForm />
          )
        }
      />
      <Route
        path="/register"
        element={
          !isLoading && isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <RegisterForm />
          )
        }
      />
      <Route path="/oauth-callback" element={<OAuthCallback />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <NotesShell />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
