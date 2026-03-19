import { createContext, useCallback, useState, useContext, useMemo } from "react";
import { authApi } from "../api/authApi";


const AuthContext = createContext();

function decodeToken(token) {
  try {
    const base64url = token.split(".")[1];
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem("access_token") || null;
  });

  const [refreshToken, setRefreshToken] = useState(() => {
    return localStorage.getItem("refresh_token") || null;
  });

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("access_token");
    return stored ? decodeToken(stored) : null;
  });

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setUser(decodeToken(data.access_token));
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
  }, []);

  const loginWithTokens = useCallback((access_token, refresh_token) => {
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setUser(decodeToken(access_token));
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
  }, []);

  const register = useCallback(
    async (email, password) => {
      await authApi.register(email, password);
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }, [refreshToken]);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) throw new Error("No refresh token available");
    const data = await authApi.refresh(refreshToken);
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  }, [refreshToken]);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      isAuthenticated: !!accessToken,
      login,
      loginWithTokens,
      register,
      logout,
      refreshAccessToken,
    }),
    [accessToken, user, login, loginWithTokens, register, logout, refreshAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;

export function useAuth() {
  const context = useContext (AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
