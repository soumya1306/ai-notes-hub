import { useEffect, useState } from "react";
import NoteForm from "./components/NoteForm";
import NotesList from "./components/NoteList";
import "./App.css";

function App() {
  const [notes, setNotes] = useState(
    JSON.parse(localStorage.getItem("ai-notes-hub")) || [],
  );

  //saving the code in local storage
  useEffect(() => {
    localStorage.setItem("ai-notes-hub", JSON.stringify(notes));
  }, [notes]);

  const addNote = (content, tags) => {
    setNotes([
      ...notes,
      {
        id: Date.now(),
        content,
        tags,
        createdAt: new Date(),
      },
    ]);
  };

  const deleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const updateNote = (id, content) => {
    setNotes(
      notes.map((note) => (note.id === id ? { ...note, content } : note)),
    );
  };

  const sortedNotes = [...notes].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="app-container">
      <div className="header">
        <h1>AI Notes Hub</h1>
      </div>
      <NoteForm onAdd={addNote} />
      <div className="notes-section">
        <NotesList
          notes={sortedNotes}
          onDelete={deleteNote}
          onUpdate={updateNote}
        />
      </div>
    </div>
  );
}

export default App;
