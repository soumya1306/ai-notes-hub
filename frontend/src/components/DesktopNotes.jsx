import { useState } from "react";

import NoteForm from "./NoteForm";
import NotesList from "./NoteList";
import DesktopNoteDetailAndEdit from "./DesktopNoteDetailsAndEdit";
import UserMenu from "./UserMenu";
import QAPanel from "./QAPanel";

const DesktopNotes = ({
  notes,
  loading,
  error,
  handleSemanticSearch,
  addNote,
  updateNote,
  deleteNote,
  search,
  setSearch,
  searchMode,
  setSearchMode,
  semanticLoading,
  liveUpdateNote,
}) => {

  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  return (
    <div className="desktop-layout">
      <div className="desktop-topbar">
        <div className="desktop-brand">
          <img
            src="/logo.svg"
            alt="AI Notes Hub"
            className="desktop-brand-logo"
          />
          <span className="desktop-brand-name">AI Notes Hub</span>
        </div>
        <UserMenu />
      </div>

      <div className="desktop-panes">
        {/* LEFT PANE: create + ask AI, or note detail */}
        <div className="pane-left">
          {selectedNote ? (
            <DesktopNoteDetailAndEdit
              key={selectedNote.id}
              note={selectedNote}
              onBack={() => setSelectedNoteId(null)}
              updateNote={updateNote}
              deleteNote={deleteNote}
            />
          ) : (
            <div className="pane-left-home">
              <div className="pane-qa-section">
                <QAPanel />
              </div>
              <div className="pane-create-section">
                <p className="pane-section-label">New Note</p>
                <NoteForm
                  onAdd={async (content, tags) => {
                    const n = await addNote(content, tags);
                    if (n) setSelectedNoteId(n.id);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANE: search + notes list */}
        <div className="pane-right">
          <div className="pane-right-header">
            <h2 className="pane-right-title">Notes</h2>
          </div>

          <div className="search-bar-wrapper">
            <div className="search-mode-toggle">
              <button
                className={`mode-btn${searchMode === "keyword" ? " mode-btn--active" : ""}`}
                onClick={() => {
                  setSearchMode("keyword");
                  setSearch("");
                }}
              >
                Keyword
              </button>
              <button
                className={`mode-btn${searchMode === "semantic" ? " mode-btn--active" : ""}`}
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
                  ✕
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="page-loading">
              <div className="spinner" />
            </div>
          ) : error ? (
            <p style={{ color: "var(--color-red-600)", padding: "20px 0" }}>
              {error}
            </p>
          ) : (
            <NotesList
              notes={notes}
              onDelete={deleteNote}
              onUpdate={updateNote}
              onTagFilter={(tag) => setSearch(tag)}
              onSelect={setSelectedNoteId}
              selectedId={selectedNoteId}
              onLiveUpdate={liveUpdateNote}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopNotes;
