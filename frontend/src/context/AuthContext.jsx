import { createContext, useCallback, useState, useContext, useMemo, useEffect } from "react";
import { authApi } from "../api/authApi";
import { setModuleAccessToken } from "../api/notesAPi";


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
  const [accessToken, setAccessToken] = useState(null);

  const [refreshToken, setRefreshToken] = useState(() => {
    return localStorage.getItem("refresh_token") || null;
  });

  const [user, setUser] = useState(null);

  // True while we're attempting a silent refresh on mount
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem("refresh_token"));

  // On mount: silently restore the session using the stored refresh token
  useEffect(() => {
    const storedRefresh = localStorage.getItem("refresh_token");
    if (!storedRefresh) {
      setIsLoading(false);
      return;
    }
    authApi.refresh(storedRefresh)
      .then((data) => {
        setAccessToken(data.access_token);
        setModuleAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setUser(decodeToken(data.access_token));
        localStorage.setItem("refresh_token", data.refresh_token);
      })
      .catch((err) => {
        if (err.isAuthError) {
          setRefreshToken(null);
          localStorage.removeItem("refresh_token");
        }
      })
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setAccessToken(data.access_token);
    setModuleAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setUser(decodeToken(data.access_token));
    localStorage.setItem("refresh_token", data.refresh_token);
  }, []);

  const loginWithTokens = useCallback((access_token, refresh_token) => {
    setAccessToken(access_token);
    setModuleAccessToken(access_token);
    setRefreshToken(refresh_token);
    setUser(decodeToken(access_token));
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
    setModuleAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem("refresh_token");
  }, [refreshToken]);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) throw new Error("No refresh token available");
    const data = await authApi.refresh(refreshToken);
    setAccessToken(data.access_token);
    setModuleAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  }, [refreshToken]);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      isAuthenticated: !!accessToken,
      isLoading,
      login,
      loginWithTokens,
      register,
      logout,
      refreshAccessToken,
    }),
    [accessToken, user, isLoading, login, loginWithTokens, register, logout, refreshAccessToken],
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
