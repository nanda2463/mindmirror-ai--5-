export enum FocusState {
  IDLE = 'IDLE',
  FOCUSED = 'FOCUSED',
  FLOW = 'FLOW',
  DISTRACTED = 'DISTRACTED',
  FATIGUED = 'FATIGUED',
  BURNOUT_WARNING = 'BURNOUT_WARNING'
}

// Higher-level abstraction for UI adaptation
export enum CognitiveMode {
  BALANCED = 'BALANCED',       // Normal operation
  FLOW = 'FLOW',               // High intensity, minimal UI
  REDUCED_LOAD = 'REDUCED_LOAD', // Low information density, larger text
  RECOVERY = 'RECOVERY'        // Locked down, guided breathing only
}

export interface UserTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: {
    themeId?: string;
    dailyGoalMinutes?: number;
  }
}

export interface SessionData {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  stateDistribution: Record<FocusState, number>;
  notes?: string;
}

export interface FocusMetrics {
  keystrokesPerMinute: number;
  mouseDistancePerMinute: number;
  tabSwitches: number;
  idleTimeMinutes: number;
  sessionDurationMinutes: number;
  timeSinceLastBreak: number;
  cognitiveMode: CognitiveMode;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  attachmentName?: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  focusState: FocusState;
  cognitiveMode: CognitiveMode;
  fileContext?: {
    name: string;
    content: string;
  };
}

export interface FocusContextType {
  focusState: FocusState;
  cognitiveMode: CognitiveMode;
  metrics: FocusMetrics;
  sessionDuration: number; // in seconds
  isSessionActive: boolean;
  toggleSession: (minutes?: number) => void;
  history: SessionData[];
  isLocked: boolean;
  targetDuration: number | null;
  resetSession: () => void;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
