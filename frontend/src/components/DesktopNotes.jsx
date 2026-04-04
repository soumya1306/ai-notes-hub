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
        {/* LEFT PANE: ask AI + search + notes list */}
        <div className="pane-left">
          <div className="pane-qa-section">
            <QAPanel />
          </div>

          <div className="pane-left-header">
            <h2 className="pane-left-title">Notes</h2>
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
              <div className="search-input-wrapper">
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
                {search && searchMode === "semantic" && (
                  <button
                    className="qa-clear-btn"
                    type="button"
                    aria-label="Clear semantic search"
                    onClick={() => {
                      setSearch("");
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
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

        {/* RIGHT PANE: editor / create note */}
        <div className="pane-right">
          {selectedNote ? (
            <DesktopNoteDetailAndEdit
              key={selectedNote.id}
              note={selectedNote}
              onBack={() => setSelectedNoteId(null)}
              updateNote={updateNote}
              deleteNote={deleteNote}
            />
          ) : (
            <div className="pane-right-home">
              <div className="note-detail-edit-layout">
                <div className="note-detail-editor-col">
                  <p className="pane-section-label">New Note</p>
                  <NoteForm
                    onAdd={async (content, tags) => {
                      const n = await addNote(content, tags);
                      if (n) setSelectedNoteId(n.id);
                    }}
                  />
                </div>

                <aside className="note-shortcuts-panel">
                  <p className="shortcuts-heading">Shortcuts</p>

                  <div className="shortcuts-group">
                    <p className="shortcuts-group-label">Formatting</p>
                    <div className="shortcut-item">
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">B</kbd></span></div>
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">B</kbd></span></div>
                      <span className="shortcut-desc">Bold</span>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">I</kbd></span></div>
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">I</kbd></span></div>
                      <span className="shortcut-desc">Italic</span>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">⇧</kbd><kbd className="shortcut-key">S</kbd></span></div>
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">⇧</kbd><kbd className="shortcut-key">S</kbd></span></div>
                      <span className="shortcut-desc">Strikethrough</span>
                    </div>
                  </div>

                  <div className="shortcuts-group">
                    <p className="shortcuts-group-label">Blocks</p>
                    <div className="shortcut-item">
                      <span className="shortcut-keys"><kbd className="shortcut-key">##</kbd><kbd className="shortcut-key">␣</kbd></span>
                      <span className="shortcut-desc">Heading</span>
                    </div>
                    <div className="shortcut-item">
                      <span className="shortcut-keys"><kbd className="shortcut-key">-</kbd><kbd className="shortcut-key">␣</kbd></span>
                      <span className="shortcut-desc">Bullet list</span>
                    </div>
                    <div className="shortcut-item">
                      <span className="shortcut-keys"><kbd className="shortcut-key">1.</kbd><kbd className="shortcut-key">␣</kbd></span>
                      <span className="shortcut-desc">Numbered list</span>
                    </div>
                    <div className="shortcut-item">
                      <span className="shortcut-keys"><kbd className="shortcut-key">&gt;</kbd><kbd className="shortcut-key">␣</kbd></span>
                      <span className="shortcut-desc">Blockquote</span>
                    </div>
                    <div className="shortcut-item">
                      <span className="shortcut-keys"><kbd className="shortcut-key">```</kbd><kbd className="shortcut-key">↵</kbd></span>
                      <span className="shortcut-desc">Code block</span>
                    </div>
                    <div className="shortcut-item">
                      <span className="shortcut-keys"><kbd className="shortcut-key">---</kbd><kbd className="shortcut-key">↵</kbd></span>
                      <span className="shortcut-desc">Divider</span>
                    </div>
                  </div>

                  <div className="shortcuts-group">
                    <p className="shortcuts-group-label">Lists</p>
                    <div className="shortcut-item">
                      <span className="shortcut-keys"><kbd className="shortcut-key">Tab</kbd></span>
                      <span className="shortcut-desc">Indent item</span>
                    </div>
                    <div className="shortcut-item">
                      <span className="shortcut-keys"><kbd className="shortcut-key">⇧</kbd><kbd className="shortcut-key">Tab</kbd></span>
                      <span className="shortcut-desc">Outdent item</span>
                    </div>
                  </div>

                  <div className="shortcuts-group">
                    <p className="shortcuts-group-label">Editor</p>
                    <div className="shortcut-item">
                      <span className="shortcut-keys"><kbd className="shortcut-key">↵↵</kbd></span>
                      <span className="shortcut-desc">Exit code mark</span>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">↵</kbd></span></div>
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">↵</kbd></span></div>
                      <span className="shortcut-desc">Save note</span>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">Z</kbd></span></div>
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">Z</kbd></span></div>
                      <span className="shortcut-desc">Undo</span>
                    </div>
                    <div className="shortcut-item">
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Mac</span><span className="shortcut-keys"><kbd className="shortcut-key">⌘</kbd><kbd className="shortcut-key">⇧</kbd><kbd className="shortcut-key">Z</kbd></span></div>
                      <div className="shortcut-os-row"><span className="shortcut-os-label">Win</span><span className="shortcut-keys"><kbd className="shortcut-key">Ctrl</kbd><kbd className="shortcut-key">Y</kbd></span></div>
                      <span className="shortcut-desc">Redo</span>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopNotes;
