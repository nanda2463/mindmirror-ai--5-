import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocus } from '../context/FocusContext';
import { useTheme } from '../context/ThemeContext';
import { Play, Pause, Activity, Brain, Coffee, AlertTriangle, Clock, Calendar, Lock, Unlock, Timer } from 'lucide-react';
import { FocusState } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const { focusState, metrics, isSessionActive, toggleSession, sessionDuration, history, isLocked, targetDuration } = useFocus();
  const { currentTheme } = useTheme();
  
  const [selectedDuration, setSelectedDuration] = useState(25); // Default 25 min

  // Helper to format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDurationMin = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return `${m}m`;
  };

  // State Colors
  const getStateColor = (state: FocusState) => {
    switch (state) {
      case FocusState.FLOW: return '#8b5cf6'; // Purple
      case FocusState.FOCUSED: return currentTheme.colors.primary;
      case FocusState.DISTRACTED: return '#f59e0b'; // Amber
      case FocusState.FATIGUED: return '#f43f5e'; // Rose
      case FocusState.BURNOUT_WARNING: return '#ef4444'; // Red
      default: return '#94a3b8'; // Slate
    }
  };

  const getSuggestion = () => {
    if (isLocked) return "Focus Lock Active. Distractions are minimized.";
    switch (focusState) {
      case FocusState.FLOW: return "You are in Flow. Keep going, the world is yours.";
      case FocusState.FOCUSED: return "Great focus. Maintain this steady rhythm.";
      case FocusState.DISTRACTED: return "You seem a bit scattered. Try closing one tab.";
      case FocusState.FATIGUED: return "Your pattern suggests fatigue. Consider a 5-minute walk.";
      case FocusState.BURNOUT_WARNING: return "Please stop. Sustainable productivity requires rest.";
      default: return "Ready to start your session?";
    }
  };

  // Prepare chart data (Last 7 sessions)
  const chartData = history.slice(0, 7).reverse().map(s => {
    const durationSec = (s.endTime! - s.startTime) / 1000;
    return {
        name: new Date(s.startTime).toLocaleDateString(undefined, { weekday: 'short' }),
        minutes: Math.round(durationSec / 60),
        fullDate: new Date(s.startTime).toLocaleString()
    };
  });

  const remainingTime = targetDuration ? Math.max(0, targetDuration - sessionDuration) : 0;
  const progressPercent = targetDuration ? (sessionDuration / targetDuration) * 100 : 0;

  return (
    <div className="flex-1 p-8 overflow-y-auto transition-colors duration-500 relative">
      
      {/* Locked Mode Background Effect */}
      {isLocked && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at 50% 50%, ${currentTheme.colors.primary}10 0%, transparent 70%)` 
          }}
        />
      )}

      {/* Hero Section */}
      <motion.div 
        className="rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl mb-8 z-10"
        animate={{ 
          backgroundColor: isSessionActive ? getStateColor(focusState) : currentTheme.colors.surface,
          color: isSessionActive ? '#fff' : currentTheme.colors.text
        }}
        transition={{ duration: 1 }}
      >
        {/* Animated Background blob */}
        {isSessionActive && (
          <motion.div 
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        )}

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <motion.div 
               className="flex items-center gap-2 justify-center md:justify-start mb-2"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-sm font-semibold tracking-wider uppercase opacity-80">
                {isLocked ? "Focus Lock Mode" : "Current State"}
              </h2>
              {isLocked && <Lock size={14} className="opacity-70" />}
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-4"
              key={focusState + (isLocked ? '_locked' : '_unlocked')}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring' }}
            >
              {isSessionActive ? focusState.replace('_', ' ') : 'Ready'}
            </motion.h1>
            <p className="text-lg opacity-90 max-w-md">{getSuggestion()}</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            
            {/* Timer Display */}
            <div className="flex flex-col items-center">
              <div className="text-4xl font-mono font-medium mb-1">
                {isLocked ? formatTime(remainingTime) : formatTime(sessionDuration)}
              </div>
              {isLocked && (
                <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              )}
            </div>

            {/* Controls */}
            {isSessionActive ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSession()} // End Session
                className={`px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 shadow-lg transition-colors border-2
                  ${isLocked 
                    ? 'bg-transparent border-white/50 text-white hover:bg-white/10' 
                    : 'bg-white text-gray-900 border-white'
                  }`}
              >
                {isLocked ? <><Unlock size={20}/> Emergency Unlock</> : <><Pause size={20}/> Pause Session</>}
              </motion.button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {/* Duration Selector for inactive state */}
                <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                  {[15, 25, 45, 60].map(m => (
                    <button
                      key={m}
                      onClick={() => setSelectedDuration(m)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedDuration === m ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSession()} // Open Session
                    className="px-6 py-3 rounded-full font-bold text-base flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  >
                    <Play size={18}/> Free Flow
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSession(selectedDuration)} // Locked Session
                    className="px-6 py-3 rounded-full font-bold text-base flex items-center gap-2 text-white shadow-lg"
                    style={{ backgroundColor: currentTheme.colors.primary }}
                  >
                     <Lock size={18}/> Focus Lock
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Conditional Content */}
      <AnimatePresence mode="wait">
        {isLocked ? (
           // LOCKED VIEW
           <motion.div 
             key="locked-view"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-6 opacity-60"
           >
              <div className="w-24 h-24 rounded-full border-4 border-dashed animate-spin-slow flex items-center justify-center"
                   style={{ borderColor: currentTheme.colors.primary }}>
                 <Brain size={40} style={{ color: currentTheme.colors.primary }} />
              </div>
              <div>
                <h3 className="text-xl font-medium" style={{ color: currentTheme.colors.text }}>Distraction-Free Zone</h3>
                <p className="max-w-md mx-auto mt-2 text-sm opacity-70">
                  Analytics and settings are hidden to help you stay in the zone. 
                  You are doing great.
                </p>
              </div>
           </motion.div>
        ) : (
          // STANDARD DASHBOARD VIEW
          <motion.div
             key="standard-view"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
          >
            {/* Real-time Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <MetricCard 
                icon={<Activity />} 
                title="Activity Level" 
                value={`${metrics.keystrokesPerMinute} kpm`} 
                desc="Keystrokes per minute"
                theme={currentTheme}
              />
              <MetricCard 
                icon={<Brain />} 
                title="Cognitive Load" 
                value={metrics.tabSwitches.toString()} 
                desc="Context switches"
                theme={currentTheme}
              />
              <MetricCard 
                icon={focusState === FocusState.FATIGUED ? <AlertTriangle className="text-red-500" /> : <Coffee />} 
                title="Time to Break" 
                value={`${Math.max(0, 90 - metrics.sessionDurationMinutes)}m`} 
                desc="Recommended break in"
                theme={currentTheme}
              />
            </div>

            {/* History & Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Weekly Chart */}
              <motion.div 
                className="rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col min-h-[300px]"
                style={{ backgroundColor: currentTheme.colors.surface }}
              >
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: currentTheme.colors.text }}>
                  <Activity size={18} className="opacity-50"/> 
                  Weekly Focus Time
                </h3>
                <div className="flex-1 w-full">
                  {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" stroke={currentTheme.colors.text} opacity={0.5} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#000' }}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                          />
                          <Bar dataKey="minutes" fill={currentTheme.colors.primary} radius={[6, 6, 6, 6]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-40 gap-2">
                        <Activity size={32} />
                        <span className="text-sm">No recent sessions recorded</span>
                      </div>
                  )}
                </div>
              </motion.div>

              {/* Recent Sessions List */}
              <motion.div 
                className="rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-[300px]"
                style={{ backgroundColor: currentTheme.colors.surface }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: currentTheme.colors.text }}>
                    <Calendar size={18} className="opacity-50"/> 
                    Recent Sessions
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {history.length > 0 ? history.map((session, idx) => {
                        // Calculate stats
                        const durationSec = (session.endTime! - session.startTime) / 1000;
                        
                        // Find Primary State
                        const entries = Object.entries(session.stateDistribution);
                        const primaryStateEntry = entries.sort((a, b) => b[1] - a[1])[0];
                        const primaryState = (primaryStateEntry ? primaryStateEntry[0] : FocusState.IDLE) as FocusState;
                        
                        // Efficiency: (Flow + Focused) / Total Duration
                        const flowTime = session.stateDistribution[FocusState.FLOW] || 0;
                        const focusedTime = session.stateDistribution[FocusState.FOCUSED] || 0;
                        const efficiency = durationSec > 0 ? Math.round(((flowTime + focusedTime) / durationSec) * 100) : 0;

                        return (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                        style={{ backgroundColor: getStateColor(primaryState) }}>
                                        {efficiency}%
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm" style={{ color: currentTheme.colors.text }}>
                                            {new Date(session.startTime).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs opacity-50 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-sm" style={{ color: currentTheme.colors.primary }}>
                                        {formatDurationMin(durationSec)}
                                    </div>
                                    <div className="text-[10px] opacity-50 uppercase tracking-wider font-semibold">
                                        {primaryState.replace('BURNOUT_WARNING', 'BURNOUT')}
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 gap-2">
                            <Clock size={32} />
                            <span className="text-sm">Start a session to build history</span>
                        </div>
                    )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

const MetricCard = ({ icon, title, value, desc, theme }: any) => (
  <motion.div 
    className="p-6 rounded-2xl shadow-sm border border-gray-100"
    style={{ backgroundColor: theme.colors.surface }}
    whileHover={{ y: -5 }}
  >
    <div className="flex items-center gap-3 mb-2 opacity-70" style={{ color: theme.colors.primary }}>
      {icon}
      <span className="text-sm font-medium uppercase tracking-wide">{title}</span>
    </div>
    <div className="text-3xl font-bold mb-1" style={{ color: theme.colors.text }}>{value}</div>
    <div className="text-xs opacity-50" style={{ color: theme.colors.text }}>{desc}</div>
  </motion.div>
);
