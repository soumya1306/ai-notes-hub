import { createContext, useCallback, useState, useContext, useMemo } from "react";
import { authApi } from "../api/authApi";


const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem("access_token") || null;
  });

  const [refreshToken, setRefreshToken] = useState(() => {
    return localStorage.getItem("refresh_token") || null;
  });

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
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
  }, [refreshToken]);

  const value = useMemo(
    () => ({
      accessToken,
      isAuthenticated: !!accessToken,
      login,
      register,
      logout,
      refreshAccessToken,
    }),
    [accessToken, login, register, logout, refreshAccessToken],
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
