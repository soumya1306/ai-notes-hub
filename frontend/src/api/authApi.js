const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const authApi = {
  async register(email, password) {
    const res = await fetch(`${API_BASE}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      const errorMessage = errorData.detail || "Registration failed";
      throw new Error(errorMessage);
    }
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      const errorMessage = errorData.detail || "Login failed";
      throw new Error(errorMessage);
    }
    return res.json();
  },

  async refresh(refresh_token) {
    const res = await fetch(`${API_BASE}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });

    if (!res.ok) throw new Error("Session expired, please log in again");
    return res.json();
  },

  async logout(refresh_token) {
    const res = await fetch(`${API_BASE}/auth/logout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });
  },
};

export function loginWithGoogle() {
  window.location.href = `${API_BASE}/auth/google/login`;
}