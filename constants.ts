import { UserTheme } from './types';

export const DEFAULT_THEME: UserTheme = {
  id: 'default',
  name: 'MindMirror Serenity',
  colors: {
    primary: '#6366f1', // Indigo 500
    secondary: '#a5b4fc', // Indigo 300
    background: '#f8fafc', // Slate 50
    surface: '#ffffff', // White
    text: '#1e293b', // Slate 800
    accent: '#ec4899', // Pink 500
  },
};

export const DARK_THEME: UserTheme = {
  id: 'dark',
  name: 'Deep Focus',
  colors: {
    primary: '#818cf8', // Indigo 400
    secondary: '#4f46e5', // Indigo 600
    background: '#0f172a', // Slate 900
    surface: '#1e293b', // Slate 800
    text: '#f1f5f9', // Slate 100
    accent: '#22d3ee', // Cyan 400
  },
};

// Heuristic Thresholds (Transparent Logic)
export const THRESHOLDS = {
  FLOW_KEYSTROKES: 60, // kpm
  IDLE_MINUTES: 5,
  FATIGUE_MINUTES: 90, // continuous work without break
  DISTRACTION_SWITCHES: 3, // per minute
  BURNOUT_SESSION_HOURS: 4,
};