import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { FocusState, CognitiveMode, FocusMetrics, SessionData, FocusContextType } from '../types';
import { THRESHOLDS } from '../constants';

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [focusState, setFocusState] = useState<FocusState>(FocusState.IDLE);
  const [cognitiveMode, setCognitiveMode] = useState<CognitiveMode>(CognitiveMode.BALANCED);
  
  const [sessionDuration, setSessionDuration] = useState(0);
  const [history, setHistory] = useState<SessionData[]>([]);
  
  // Focus Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [targetDuration, setTargetDuration] = useState<number | null>(null);

  // Metrics State
  const [keystrokes, setKeystrokes] = useState(0);
  const [mouseDist, setMouseDist] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const keystrokesRef = useRef(0);
  const mouseDistRef = useRef(0);
  const tabSwitchesRef = useRef(0);
  
  const stateDistRef = useRef<Record<FocusState, number>>({
    [FocusState.IDLE]: 0,
    [FocusState.FOCUSED]: 0,
    [FocusState.FLOW]: 0,
    [FocusState.DISTRACTED]: 0,
    [FocusState.FATIGUED]: 0,
    [FocusState.BURNOUT_WARNING]: 0
  });

  // Load history from API on mount (mocked here, in real app call API)
  useEffect(() => {
    // Placeholder for initial data fetch
  }, []);

  // Timer
  useEffect(() => {
    let interval: number;
    if (isSessionActive) {
      if (!sessionStartTime) setSessionStartTime(Date.now());
      interval = window.setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      setSessionDuration(0);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Input Listeners
  useEffect(() => {
    if (!isSessionActive) return;
    const handleKeyDown = () => { keystrokesRef.current++; setLastActivity(Date.now()); };
    const handleMouseMove = (e: MouseEvent) => { mouseDistRef.current += Math.sqrt(e.movementX ** 2 + e.movementY ** 2); setLastActivity(Date.now()); };
    const handleVisibilityChange = () => { if (document.hidden) tabSwitchesRef.current++; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSessionActive]);

  // COGNITIVE STATE ALGORITHM
  useEffect(() => {
    if (!isSessionActive) {
      setFocusState(FocusState.IDLE);
      setCognitiveMode(CognitiveMode.BALANCED);
      return;
    }

    const analysisInterval = setInterval(() => {
      const now = Date.now();
      const idleTimeSeconds = (now - lastActivity) / 1000;
      const durationMinutes = sessionDuration / 60;

      const currentKeystrokes = keystrokesRef.current;
      const currentMouse = mouseDistRef.current;
      const currentSwitches = tabSwitchesRef.current;

      setKeystrokes(currentKeystrokes);
      setMouseDist(Math.floor(currentMouse));
      setTabSwitches(currentSwitches);

      let newState = FocusState.FOCUSED;

      // 1. Determine granular FocusState
      if (durationMinutes > THRESHOLDS.BURNOUT_SESSION_HOURS * 60) {
        newState = FocusState.BURNOUT_WARNING;
      } else if (durationMinutes > THRESHOLDS.FATIGUE_MINUTES) {
        newState = FocusState.FATIGUED;
      } else if (idleTimeSeconds > THRESHOLDS.IDLE_MINUTES * 60) {
        newState = FocusState.IDLE;
      } else if (currentSwitches > THRESHOLDS.DISTRACTION_SWITCHES) {
        newState = FocusState.DISTRACTED;
      } else if (currentKeystrokes > THRESHOLDS.FLOW_KEYSTROKES || (currentKeystrokes > 30 && currentMouse < 300)) {
         newState = FocusState.FLOW;
      } else {
        newState = FocusState.FOCUSED;
      }

      setFocusState(newState);

      // 2. Derive Environment-Level CognitiveMode
      let newMode = CognitiveMode.BALANCED;
      
      switch (newState) {
        case FocusState.FLOW:
          newMode = CognitiveMode.FLOW;
          break;
        case FocusState.FATIGUED:
        case FocusState.BURNOUT_WARNING:
          newMode = CognitiveMode.REDUCED_LOAD;
          break;
        case FocusState.DISTRACTED:
          // If consistently distracted for a while, maybe suggest Reduced Load, but for now stick to Balanced
          newMode = CognitiveMode.BALANCED; 
          break;
        default:
          newMode = CognitiveMode.BALANCED;
      }

      // Override for recovery check (mock logic: if > 90 mins, force Reduced Load UI)
      if (durationMinutes > 90) {
        newMode = CognitiveMode.REDUCED_LOAD;
      }

      setCognitiveMode(newMode);

      if (stateDistRef.current) {
         stateDistRef.current[newState] = (stateDistRef.current[newState] || 0) + 2;
      }

      // Decay
      keystrokesRef.current = Math.max(0, keystrokesRef.current * 0.9);
      mouseDistRef.current = Math.max(0, mouseDistRef.current * 0.9); 
      
    }, 2000);

    return () => clearInterval(analysisInterval);
  }, [isSessionActive, lastActivity, sessionDuration]);

  const toggleSession = (minutes?: number) => {
    if (isSessionActive) {
      // END SESSION
      const endTime = Date.now();
      const calculatedStartTime = sessionStartTime || (endTime - sessionDuration * 1000);
      
      const newSession: SessionData = {
        id: Date.now().toString(),
        userId: 'local-user', // replaced in real app
        startTime: calculatedStartTime,
        endTime: endTime,
        durationSeconds: sessionDuration,
        stateDistribution: { ...stateDistRef.current }
      };

      setHistory(prev => [newSession, ...prev]);
      setIsSessionActive(false);
      setSessionStartTime(null);
      setIsLocked(false);
      setTargetDuration(null);
    } else {
      // START SESSION
      keystrokesRef.current = 0;
      mouseDistRef.current = 0;
      tabSwitchesRef.current = 0;
      stateDistRef.current = {
        [FocusState.IDLE]: 0,
        [FocusState.FOCUSED]: 0,
        [FocusState.FLOW]: 0,
        [FocusState.DISTRACTED]: 0,
        [FocusState.FATIGUED]: 0,
        [FocusState.BURNOUT_WARNING]: 0
      };

      setIsSessionActive(true);
      setSessionStartTime(Date.now());

      if (minutes && minutes > 0) {
        setIsLocked(true);
        setTargetDuration(minutes * 60);
      } else {
        setIsLocked(false);
        setTargetDuration(null);
      }
    }
  };

  const resetSession = () => {
    setIsSessionActive(false);
    setSessionDuration(0);
    setIsLocked(false);
    setTargetDuration(null);
  };

  const metrics: FocusMetrics = {
    keystrokesPerMinute: Math.floor(keystrokes),
    mouseDistancePerMinute: Math.floor(mouseDist),
    tabSwitches: tabSwitches,
    idleTimeMinutes: Math.floor((Date.now() - lastActivity) / 60000),
    sessionDurationMinutes: Math.floor(sessionDuration / 60),
    timeSinceLastBreak: Math.floor(sessionDuration / 60),
    cognitiveMode
  };

  return (
    <FocusContext.Provider value={{ 
      focusState, 
      cognitiveMode,
      metrics, 
      sessionDuration, 
      isSessionActive, 
      toggleSession, 
      history,
      isLocked,
      targetDuration,
      resetSession
    }}>
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) throw new Error("useFocus must be used within FocusProvider");
  return context;
};
