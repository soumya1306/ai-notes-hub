import { useEffect, useState } from "react";
import NoteForm from "./components/NoteForm";
import NotesList from "./components/NoteList";
import "./App.css";
import { notesApi } from "./api/notesAPi";

function App() {
  const [notes, setNotes] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //saving the code in local storage
  useEffect(() => {
    notesApi
      .getNotes()
      .then(setNotes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <div className="app-container"><p>Loading...</p></div>;
  if (error) return <div className="app-container"><p style={{color:red}}>{error}</p></div>

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
