const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

let isRefreshing = null; // Global flag to track ongoing refresh

const authFetch = async (url, options = {}, refreshAccessToken) => {
  const token = localStorage.getItem("access_token");
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...options.headers,
    },
  });

  //token expired or invalid - refresh and retry once
  if (res.status === 401 && refreshAccessToken) {
    try {
      // 2. Queue management: If a refresh is already happening, wait for it
      if (!isRefreshing) {
        isRefreshing = refreshAccessToken();
      }

      const newToken = await isRefreshing;
      isRefreshing = null; // Reset once finished

      // 3. Retry the request with the brand new token
      const retried = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
      });
      return retried;
    } catch (err) {
      // 4. Critical: If refresh fails (token revoked), log the user out
      console.error("Refresh failed, redirecting to login...");
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(err);
    }
  }
  return res;
};

export const notesApi = {
  async getNotes() {
    const res = await fetch(`${API_BASE}/notes`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },

  async createNote(content, tags) {
    const res = await fetch(`${API_BASE}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, tags }),
    });

    if (!res.ok) throw new Error("Failed to create");
    return res.json();
  },

  async updateNote(id, content, tags) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, tags }),
    });

    if (!res.ok) throw new Error("Failed to update");
    return res.json();
  },

  async deleteNote(id) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete");
  },
};
