import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {useAuth} from "./context/AuthContext";
import NoteForm from "./components/NoteForm";
import NotesList from "./components/NoteList";
import "./App.css";
import { notesApi } from "./api/notesAPi";
import RegisterForm from "./components/RegisterForm";
import OAuthCallback from "./components/OAuthCallback";
import LoginForm from "./components/LoginForm";

function NotesPage() {
  const { isAuthenticated, logout, refreshAccessToken } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    notesApi.getNotes(refreshAccessToken)
      .then((fetchedNotes) => setNotes(Array.isArray(fetchedNotes) ? fetchedNotes : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated, refreshAccessToken]);

  const addNote = async (content, tags) => {
    const newNote = await notesApi.createNote(content, tags, refreshAccessToken);
    setNotes((prev) => [newNote, ...prev]);
  };

  const deleteNote = async (id) => {
    await notesApi.deleteNote(id, refreshAccessToken);
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const updateNote = async (id, content, tags = []) => {
    const updatedNote = await notesApi.updateNote(id, content, tags, refreshAccessToken);

    setNotes(
      prev => prev.map(note => note.id === id ? updatedNote : note),
    );
  };

  if (loading) return <div className="app-container"><p>Loading...</p></div>;
  if (error) return <div className="app-container"><p style={{color: "red"}}>{error}</p></div>

  return (
    <div className="app-container">
      <div className="header">
        <h1>AI Notes Hub</h1>
        <button className="logout-btn" onClick={logout}>Sign Out</button>
      </div>
      <NoteForm onAdd={addNote} />
      <div className="notes-section">
        <NotesList
          notes={notes}
          onDelete={deleteNote}
          onUpdate={updateNote}
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
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />} />

      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterForm />} />

      <Route 
        path="/oauth-callback" 
        element={<OAuthCallback />} />

      <Route 
        path="/" 
        element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
      <Route 
        path="*"
        element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
