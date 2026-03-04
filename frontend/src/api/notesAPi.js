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
      const retryHeaders = {
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      };

      if (options.body) {
        retryHeaders["Content-Type"] = "application/json";
      }
      const retried = await fetch(url, {
        ...options,
        headers: retryHeaders,
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
  async getNotes(refreshAccessToken, search = "") {
    const url = new URL(`${API_BASE}/notes/`);
    if (search.trim()) url.searchParams.set("search", search.trim());
    const res = await authFetch(url.toString(), {}, refreshAccessToken);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },

  async createNote(content, tags, refreshAccessToken) {
    const res = await authFetch(
      `${API_BASE}/notes/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, tags }),
      },
      refreshAccessToken,
    );

    if (!res.ok) throw new Error("Failed to create");
    return res.json();
  },

  async updateNote(id, content, tags, refreshAccessToken) {
    const res = await authFetch(
      `${API_BASE}/notes/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, tags }),
      },
      refreshAccessToken,
    );

    if (!res.ok) throw new Error("Failed to update");
    return res.json();
  },

  async deleteNote(id, refreshAccessToken) {
    const res = await authFetch(
      `${API_BASE}/notes/${id}`,
      {
        method: "DELETE",
      },
      refreshAccessToken,
    );
    if (!res.ok) throw new Error("Failed to delete");
  },
};

export const summarizeNote = async (noteId, refreshAccessToken) => {
  const res = await authFetch(
    `${API_BASE}/notes/${noteId}/summarize`,
    {
      method: "POST",
    },
    refreshAccessToken,
  );

  if (!res.ok) throw new Error("Failed to Summarize");
  return res;
};

export const autoTagNote = async (noteId, refreshAccessToken) => {
  const res = await authFetch(
    `${API_BASE}/notes/${noteId}/autotags`,
    {
      method: "POST",
    },
    refreshAccessToken,
  );

  if (!res.ok) throw new Error("Failed to autotag");
  return res;
};

export const semanticSearch = async (q, refreshAccessToken, limit = 10) => {
  const url = new URL(`${API_BASE}/notes/semantic`);
  url.searchParams.set("q", q.trim());
  url.searchParams.set("limit", limit);
  const res = await authFetch(url.toString(), {}, refreshAccessToken);
  if (!res.ok) throw new Error("Semantic search failed");
  return res.json();
};
