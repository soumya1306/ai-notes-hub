const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const notesApi = {
  async getNotes() {
    const res = await fetch(`${API_BASE}/notes/`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },

  async createNote(content, tags) {
    const res = await fetch(`${API_BASE}/notes/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, tags }),
    });

    if(!res.ok) throw new Error("Failed to create");
    return res.json();
  },

  async updateNote(id, content, tags) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, tags }),
    });

    if(!res.ok) throw new Error("Failed to update");
    return res.json();
  },

  async deleteNote(id) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: "DELETE"
    });
    if(!res.ok) throw new Error("Failed to delete");
  }
};
