import React from 'react';
import { Home, Palette, Settings, LogOut, Lock, Battery } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useFocus } from '../context/FocusContext';
import { useAuth } from '../context/AuthContext';
import { Chatbot } from './Chatbot';
import { CognitiveMode } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentTheme } = useTheme();
  const { isLocked, cognitiveMode } = useFocus();
  const { logout } = useAuth();

  // ADAPTIVE UI LOGIC
  const isFlow = cognitiveMode === CognitiveMode.FLOW;
  const isReduced = cognitiveMode === CognitiveMode.REDUCED_LOAD;

  const NavItem = ({ id, icon: Icon, label }: any) => {
    const isActive = activeTab === id;
    const isDisabled = isLocked && id !== 'dashboard';

    return (
      <button
        onClick={() => !isDisabled && setActiveTab(id)}
        disabled={isDisabled}
        className={`p-4 rounded-xl transition-all duration-500 flex flex-col items-center gap-1 relative
          ${isActive ? 'shadow-lg' : ''} 
          ${isDisabled ? 'opacity-20 cursor-not-allowed grayscale' : 'opacity-60 hover:opacity-100'}
        `}
        style={{ 
          backgroundColor: isActive ? currentTheme.colors.surface : 'transparent',
          color: isActive ? currentTheme.colors.primary : currentTheme.colors.text 
        }}
      >
        <div className="relative">
          <Icon size={isReduced ? 28 : 24} />
          {isDisabled && (
            <div className="absolute -top-1 -right-2 bg-gray-200 rounded-full p-0.5">
              <Lock size={10} className="text-gray-500" />
            </div>
          )}
        </div>
        {/* Hide labels in Flow mode for minimal distraction */}
        {!isFlow && (
          <span className={`text-xs font-medium transition-opacity ${isReduced ? 'text-sm mt-1' : ''}`}>
            {label}
          </span>
        )}
      </button>
    );
  };

  return (
    <div 
      className="min-h-screen flex transition-colors duration-1000 ease-in-out" 
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      {/* Sidebar Navigation - Adapts opacity based on flow */}
      <motion.nav 
        animate={{ 
          width: isFlow ? '4rem' : '6rem',
          opacity: isFlow ? 0.3 : 1 
        }}
        whileHover={{ opacity: 1 }}
        className="hidden md:flex flex-col items-center py-8 gap-8 border-r border-gray-100/10 z-20"
        style={{ backgroundColor: `${currentTheme.colors.surface}80` }} 
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 mb-8 shadow-xl"></div>
        
        <div className="flex flex-col gap-4 flex-1">
          <NavItem id="dashboard" icon={Home} label="Focus" />
          <NavItem id="themes" icon={Palette} label="Themes" />
          <NavItem id="settings" icon={Settings} label="Settings" />
        </div>

        <button 
          onClick={logout}
          className="opacity-50 hover:opacity-100 transition-opacity p-2"
          title="Sign Out"
        >
          <LogOut size={24} style={{ color: currentTheme.colors.text }} />
        </button>
      </motion.nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full p-4 flex justify-around shadow-2xl z-40" style={{ backgroundColor: currentTheme.colors.surface }}>
        <NavItem id="dashboard" icon={Home} label="Focus" />
        <NavItem id="themes" icon={Palette} label="Themes" />
        <button onClick={logout} className="opacity-50"><LogOut size={24} style={{ color: currentTheme.colors.text }} /></button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative">
        {/* Cognitive Mode Indicator Overlay */}
        <AnimatePresence>
          {isReduced && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-4 left-0 right-0 mx-auto w-fit px-6 py-2 rounded-full shadow-lg z-30 flex items-center gap-2 border"
              style={{ backgroundColor: '#fff', borderColor: '#fbbf24' }}
            >
              <Battery className="text-amber-500" size={18} />
              <span className="text-amber-800 font-medium text-sm">Reduced Load Mode Active</span>
            </motion.div>
          )}
        </AnimatePresence>

        {children}
      </main>

      <Chatbot />
    </div>
  );
};
