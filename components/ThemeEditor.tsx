import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { UserTheme } from '../types';
import { motion } from 'framer-motion';
import { Palette, Check, Save } from 'lucide-react';

export const ThemeEditor: React.FC = () => {
  const { currentTheme, setTheme, availableThemes, saveTheme } = useTheme();
  const [editingTheme, setEditingTheme] = useState<UserTheme>({ ...currentTheme, id: `custom-${Date.now()}`, name: 'My Custom Theme' });
  const [isEditing, setIsEditing] = useState(false);

  const handleColorChange = (key: keyof UserTheme['colors'], value: string) => {
    setEditingTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }));
  };

  const handleSave = () => {
    saveTheme(editingTheme);
    setIsEditing(false);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6" style={{ color: currentTheme.colors.text }}>Theme Studio</h2>
      
      {/* Theme Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
        {availableThemes.map(theme => (
          <motion.button
            key={theme.id}
            onClick={() => setTheme(theme)}
            className="relative p-6 rounded-2xl text-left border-2 transition-all overflow-hidden group"
            style={{ 
              borderColor: currentTheme.id === theme.id ? currentTheme.colors.primary : 'transparent',
              backgroundColor: theme.colors.surface
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute top-0 left-0 w-full h-2" style={{ background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary})` }}></div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold" style={{ color: theme.colors.text }}>{theme.name}</h3>
              {currentTheme.id === theme.id && <Check size={16} style={{ color: theme.colors.primary }} />}
            </div>
            <div className="flex gap-2">
              {Object.values(theme.colors).slice(0, 4).map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full shadow-sm border border-black/5" style={{ backgroundColor: c }}></div>
              ))}
            </div>
          </motion.button>
        ))}
        
        <button 
          onClick={() => setIsEditing(true)}
          className="p-6 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
        >
          <Palette size={24} />
          <span>Create New</span>
        </button>
      </div>

      {/* Editor Panel */}
      {isEditing && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl shadow-xl border border-gray-100"
          style={{ backgroundColor: currentTheme.colors.surface }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold" style={{ color: currentTheme.colors.text }}>Create Custom Theme</h3>
            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">Close</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase opacity-50 mb-1">Theme Name</label>
                <input 
                  type="text" 
                  value={editingTheme.name}
                  onChange={(e) => setEditingTheme(prev => ({...prev, name: e.target.value}))}
                  className="w-full p-2 rounded-lg border bg-transparent"
                  style={{ borderColor: currentTheme.colors.text, color: currentTheme.colors.text }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 {(Object.keys(editingTheme.colors) as Array<keyof UserTheme['colors']>).map((key) => (
                   <div key={key}>
                      <label className="block text-xs font-semibold uppercase opacity-50 mb-1">{key}</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={editingTheme.colors[key]}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                        />
                        <span className="text-xs font-mono opacity-70">{editingTheme.colors[key]}</span>
                      </div>
                   </div>
                 ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center gap-4"
              style={{ 
                backgroundColor: editingTheme.colors.background,
                color: editingTheme.colors.text
              }}
            >
              <h4 className="font-bold text-2xl">Preview</h4>
              <p className="opacity-80 text-center">This is how your focused workspace will look.</p>
              <button 
                className="px-6 py-2 rounded-full font-semibold shadow-lg"
                style={{ backgroundColor: editingTheme.colors.primary, color: '#fff' }}
              >
                Primary Button
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSave}
              className="px-8 py-3 rounded-xl font-bold text-white flex items-center gap-2"
              style={{ backgroundColor: currentTheme.colors.primary }}
            >
              <Save size={18} /> Save Theme
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};