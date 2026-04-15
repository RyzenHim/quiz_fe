"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AppContext = createContext(null);

const STORAGE_KEY = "quiz-app-auth";

const applyTheme = (theme) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
};

export function AppProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [theme, setTheme] = useState("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setAuth(parsed);
        setTheme(parsed.themePreference || "light");
      }
      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const persistAuth = useCallback((nextAuth) => {
    setAuth(nextAuth);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
  }, []);

  const login = useCallback((payload) => {
    const nextAuth = {
      token: payload.token,
      role: payload.role,
      user: payload.user,
      landingPath: payload.landingPath,
      themePreference: payload.themePreference || "light",
    };

    persistAuth(nextAuth);
    setTheme(nextAuth.themePreference);
    applyTheme(nextAuth.themePreference);
  }, [persistAuth]);

  const logout = () => {
    setAuth(null);
    setTheme("light");
    applyTheme("light");
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const updateAuthUser = useCallback((user, overrides = {}) => {
    setAuth((current) => {
      if (!current) {
        return current;
      }

      const nextAuth = {
        ...current,
        ...overrides,
        user,
        themePreference: overrides.themePreference || current.themePreference,
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
      return nextAuth;
    });
  }, []);

  const toggleTheme = async () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);

    if (!auth?.token) {
      return;
    }

    try {
      const response = await api.patch(
        "/auth/theme",
        { themePreference: nextTheme },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      const nextAuth = {
        ...auth,
        user: response.data.user,
        themePreference: response.data.themePreference,
      };

      persistAuth(nextAuth);
      setTheme(response.data.themePreference);
      applyTheme(response.data.themePreference);
    } catch (error) {
      const fallbackTheme = auth.themePreference || "light";
      setTheme(fallbackTheme);
      applyTheme(fallbackTheme);
    }
  };

  return (
    <AppContext.Provider
      value={{
        auth,
        theme,
        isReady,
        login,
        logout,
        updateAuthUser,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
}
