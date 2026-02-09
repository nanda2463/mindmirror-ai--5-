import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserTheme } from '../types';
import { DEFAULT_THEME, DARK_THEME } from '../constants';

interface ThemeContextType {
  currentTheme: UserTheme;
  setTheme: (theme: UserTheme) => void;
  availableThemes: UserTheme[];
  saveTheme: (theme: UserTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<UserTheme>(DEFAULT_THEME);
  const [availableThemes, setAvailableThemes] = useState<UserTheme[]>([DEFAULT_THEME, DARK_THEME]);

  // Apply theme to CSS variables for Tailwind/Global usage
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', currentTheme.colors.primary);
    root.style.setProperty('--color-secondary', currentTheme.colors.secondary);
    root.style.setProperty('--color-bg', currentTheme.colors.background);
    root.style.setProperty('--color-surface', currentTheme.colors.surface);
    root.style.setProperty('--color-text', currentTheme.colors.text);
    root.style.setProperty('--color-accent', currentTheme.colors.accent);
    
    // Set body background immediately
    document.body.style.backgroundColor = currentTheme.colors.background;
    document.body.style.color = currentTheme.colors.text;
  }, [currentTheme]);

  const saveTheme = (newTheme: UserTheme) => {
    setAvailableThemes(prev => [...prev.filter(t => t.id !== newTheme.id), newTheme]);
    setCurrentTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: setCurrentTheme, availableThemes, saveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};