import React, { useState } from 'react';
import { FocusProvider } from './context/FocusContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ThemeEditor } from './components/ThemeEditor';
import { Auth } from './components/Auth';

const SettingsPlaceholder = () => (
  <div className="p-8 text-center opacity-60">
    <h2 className="text-2xl font-bold">Privacy & Settings</h2>
    <p className="mt-4">All processing happens locally or via secure secure endpoint.</p>
    <p>Version 2.0.0 - Cognitive Flow OS</p>
  </div>
);

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <FocusProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'themes' && <ThemeEditor />}
        {activeTab === 'settings' && <SettingsPlaceholder />}
      </Layout>
    </FocusProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AuthenticatedApp />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
