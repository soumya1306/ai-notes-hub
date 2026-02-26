import { useEffect, useState } from "react";
import {useAuth} from "./context/AuthContext";
import NoteForm from "./components/NoteForm";
import NotesList from "./components/NoteList";
import "./App.css";
import { notesApi } from "./api/notesApi";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";

function App() {
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
      .then(setNotes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated, refreshAccessToken]);

  const addNote = async (content, tags) => {
    const newNote = await notesApi.createNote(content, tags);
    setNotes((prev) => [newNote, ...prev]);
  };

  const deleteNote = async (id) => {
    await notesApi.deleteNote(id);
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const updateNote = async (id, content, tags = []) => {
    const updatedNote = await notesApi.updateNote(id, content, tags);

    setNotes(
      prev => prev.map(note => note.id === id ? updatedNote : note),
    );
  };

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterForm onSwitch={() => setShowRegister(false)} />
    ) : (
      <LoginForm onSwitch={() => setShowRegister(true)} />
    );
  }

  if (loading) return <div className="app-container"><p>Loading...</p></div>;
  if (error) return <div className="app-container"><p style={{color: "red"}}>{error}</p></div>

  return (
    <div className="app-container">
      <div className="header">
        <h1>AI Notes Hub</h1>
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

export default App;
