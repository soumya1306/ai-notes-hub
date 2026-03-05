import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { askNotes } from "../api/notesAPi";

export default function QAPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { refreshAccessToken } = useAuth();

  const handleAsk = async () => {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setAnswer(null);
    setError(null);

    try {
      const data = await askNotes(q);
      setAnswer(data.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qa-panel">
      <h3 className="qa-title">💬 Ask Your Notes</h3>
      <div className="qa-input-row">
        <input
          className="search-input"
          type="text"
          placeholder="e.g What did I write about React hooks?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          disabled={loading}
        />
        <button
          className="btn btn-ai"
          onClick={handleAsk}
          disabled={loading || !question.trim()}
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>
      {answer && (
        <div className="qa-answer">
          <span className="summary-label">✨ Answer</span>
          <p>{answer}</p>
        </div>
      )}
      {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
    </div>
  );
}
