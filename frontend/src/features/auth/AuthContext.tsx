import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setAuthToken, setUnauthorizedHandler } from "@/lib/api";

interface AuthUser {
  name: string;
  email: string;
  picture?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

interface AuthContextValue extends AuthState {
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "turnus.auth";

function decodeJwt(token: string): AuthUser {
  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized));
    return {
      name: decoded.name ?? "",
      email: decoded.email ?? "",
      picture: decoded.picture,
    } as AuthUser;
  } catch {
    return { name: "", email: "" };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthState;
        if (parsed.token) {
          setState(parsed);
          setAuthToken(parsed.token);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persistState = useCallback((next: AuthState | null) => {
    if (next && next.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const signInWithGoogle = useCallback(
    async (credential: string) => {
      if (!credential) {
        throw new Error("El token de Google es inválido");
      }

      const user = decodeJwt(credential);
      if (!user.email) {
        throw new Error("No se pudo leer el email del usuario");
      }

      const nextState: AuthState = {
        token: credential,
        user,
      };

      setState(nextState);
      setAuthToken(credential);
      persistState(nextState);
    },
    [persistState],
  );

  const logout = useCallback(() => {
    setState({ token: null, user: null });
    setAuthToken(null);
    persistState(null);
  }, [persistState]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: state.token,
      user: state.user,
      loading,
      isAuthenticated: !!state.user,
      signInWithGoogle,
      logout,
    }),
    [state.token, state.user, loading, signInWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
