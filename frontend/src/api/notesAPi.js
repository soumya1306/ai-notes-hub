const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

let isRefreshing = null; // Global flag to track ongoing refresh

const authFetch = async (url, options = {}, refreshAccessToken) => {
  const buildHeaders = (token) => {
    const isFormData = options.body instanceof FormData;
    return {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
  };

  const res = await fetch(url, {
    ...options,
    headers: buildHeaders(localStorage.getItem("access_token")),
  });

  if (res.status !== 401 || !refreshAccessToken) return res;

  try {
    if (!isRefreshing) isRefreshing = refreshAccessToken();
    const newToken = await isRefreshing;
    isRefreshing = null;

    return fetch(url, {
      ...options,
      headers: buildHeaders(newToken),
    });
  } catch (err) {
    console.error("Refresh failed, redirecting to login...");
    localStorage.clear();
    window.location.href = "/login";
    return Promise.reject(err);
  }
};

//crud operations
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

//AI summarize, autotags, and askAPI
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

export const askNotes = async (question, refreshAccessToken, top_k = 5) => {
  const url = new URL(`${API_BASE}/notes/ask`);
  url.searchParams.set("top_k", top_k);
  const res = await authFetch(
    url.toString(),
    {
      method: "POST",
      body: JSON.stringify({ question }),
    },
    refreshAccessToken,
  );
  if (!res.ok) throw new Error("Failed to get answer");
  return res.json();
};

// Attachments
export const getAttachments = async (noteId, refreshAccessToken) => {
  const res = await authFetch(
    `${API_BASE}/attachments/notes/${noteId}`,
    {},
    refreshAccessToken,
  );
  if (!res.ok) throw new Error("Failed to fetch attachments.");
  return res.json();
};

export const uploadAttachments = async (noteId, file, refreshAccessToken) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(
    `${API_BASE}/attachments/notes/${noteId}`,
    {
      method: "POST",
      body: formData,
    },
    refreshAccessToken,
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed.");
  }
  return res.json();
};

export const deleteAttachment = async (attachmentId, refreshAccessToken) => {
  const res = await authFetch(
    `${API_BASE}/attachments/${attachmentId}`,
    {
      method: "DELETE",
    },
    refreshAccessToken,
  );
  if (!res.ok) throw new Error("Failed to delete attachment.");
};
