import NoteForm from "./NoteForm";
import NotesList from "./NoteList";
import UserMenu from "./UserMenu";

const MobileNotes = ({
  notes,
  loading,
  error,
  addNote,
  deleteNote,
  updateNote,
  search,
  setSearch,
  searchMode,
  setSearchMode,
  handleSemanticSearch,
  semanticLoading,
  liveUpdateNote,
}) => {
  if (loading)
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  if (error)
    return (
      <div
        className="page-error"
        style={{ padding: "24px 30px", color: "var(--color-red-600)" }}
      >
        {error}
      </div>
    );

  return (
    <div className="mobile-layout">
      <div className="shell-mobile-header">
        <div className="header-brand">
          <img src="/logo.svg" alt="AI Notes Hub" className="header-logo" />
          <h1>AI Notes Hub</h1>
        </div>
        <UserMenu />
      </div>

      <NoteForm onAdd={addNote} clearOnSubmit />

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
};

export default MobileNotes;
