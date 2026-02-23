import { useState } from "react";
import NoteForm from "./components/NoteForm";
import NotesList from "./components/NoteList";
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);

  const addNote = (content) => {
    setNotes([
      ...notes,
      {
        id: Date.now(),
        content,
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

  console.log(notes)
  
  return (
    <div className="app-container">
      <div className="header">
        <h1>AI Notes Hub</h1>
      </div>
      <NoteForm onAdd={addNote} />
      <div className="notes-section">
        <NotesList notes={notes} onDelete={deleteNote} onUpdate={updateNote} />
      </div>
    </div>
  );
}

export default App;
