"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
  const [auth, setAuth] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return "light";
    }

    const parsed = JSON.parse(raw);
    return parsed.themePreference || "light";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const persistAuth = (nextAuth) => {
    setAuth(nextAuth);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
  };

  const login = (payload) => {
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
  };

  const logout = () => {
    setAuth(null);
    setTheme("light");
    applyTheme("light");
    window.localStorage.removeItem(STORAGE_KEY);
  };

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
        isReady: true,
        login,
        logout,
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
