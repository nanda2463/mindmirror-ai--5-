import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Sparkles, Paperclip, FileText, Trash2, Minimize2, Maximize2, AlertCircle } from 'lucide-react';
import { useFocus } from '../context/FocusContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, CognitiveMode } from '../types';
import { extractTextFromFile } from '../utils/fileParsing';
import ReactMarkdown from 'react-markdown';

const API_URL = 'http://localhost:3001/api/chat';

export const Chatbot: React.FC = () => {
  const { focusState, cognitiveMode } = useFocus();
  const { currentTheme } = useTheme();
  const { token, isAuthenticated } = useAuth();
  
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // File Handling State
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from Backend on mount/auth
  useEffect(() => {
    const fetchHistory = async () => {
      if (!isAuthenticated || !token) return;

      try {
        const response = await fetch('http://localhost:3001/api/chat/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const history = await response.json();
          if (history.length > 0) {
            setMessages(history);
          } else {
            // Default Welcome
            setMessages([
              { role: 'assistant', text: "I'm MindMirror. How can I support your flow?", timestamp: Date.now() }
            ]);
          }
        }
      } catch (error) {
        console.error("Failed to load chat history from DB", error);
      }
    };

    fetchHistory();
  }, [isAuthenticated, token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading, isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Max 5MB.");
      return;
    }

    setIsProcessingFile(true);
    try {
      const text = await extractTextFromFile(file);
      setAttachedFile({ name: file.name, content: text });
    } catch (error) {
      alert("Failed to read file.");
    } finally {
      setIsProcessingFile(false);
      event.target.value = '';
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const userMsg: ChatMessage = { 
      role: 'user', 
      text: input, 
      timestamp: Date.now(),
      attachmentName: attachedFile?.name
    };
    
    // Optimistic Update
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyContext = messages.slice(-10); 
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg.text || (attachedFile ? `Analyze ${attachedFile.name}` : "Hello"),
          history: historyContext,
          focusState,
          cognitiveMode, // KEY: Passing mode to backend
          fileContext: attachedFile || undefined
        }),
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();

      setMessages(prev => [...prev, { role: 'assistant', text: data.response, timestamp: Date.now() }]);
      if (attachedFile) setAttachedFile(null);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Connection issue. Please check your network.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Adaptive Styling
  const isReducedLoad = cognitiveMode === CognitiveMode.REDUCED_LOAD;

  const panelVariants: Variants = {
    hidden: { opacity: 0, y: 100, scale: 0.9 },
    visible: { 
      opacity: 1, y: 0, scale: 1, 
      width: isExpanded ? '600px' : '384px',
      height: isExpanded ? '80vh' : '550px',
    },
    exit: { opacity: 0, y: 50, scale: 0.95 }
  };

  return (
    <>
      <motion.button
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-50 flex items-center justify-center"
        style={{ backgroundColor: currentTheme.colors.primary, color: '#fff' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-50 border backdrop-blur-md"
            style={{ 
              backgroundColor: isReducedLoad ? '#fff' : currentTheme.colors.surface, 
              color: currentTheme.colors.text
            }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div 
              className="p-4 flex items-center justify-between border-b border-gray-100 cursor-pointer bg-gradient-to-r"
              style={{ backgroundImage: `linear-gradient(to right, ${currentTheme.colors.primary}15, ${currentTheme.colors.secondary}10)` }}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-3">
                <Sparkles size={18} style={{ color: currentTheme.colors.primary }} />
                <div className="flex flex-col">
                  <h3 className="font-bold text-sm">MindMirror AI</h3>
                  <span className="text-[10px] opacity-60 font-medium uppercase tracking-wide">
                    {isReducedLoad ? 'Eco Mode' : 'Standard'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                 {isExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'rounded-br-none' : 'rounded-bl-none border border-gray-100'}`}
                    style={{
                      backgroundColor: msg.role === 'user' ? currentTheme.colors.primary : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#1e293b',
                      fontSize: isReducedLoad ? '16px' : '14px', // Larger text for Reduced Load
                    }}
                  >
                    {msg.attachmentName && (
                       <div className="text-xs mb-2 flex items-center gap-2 opacity-80">
                         <FileText size={12}/> {msg.attachmentName}
                       </div>
                    )}
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  <span className="text-[10px] opacity-30 mt-1 mx-2">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              ))}
              {isLoading && <Loader2 className="animate-spin opacity-50 ml-4" size={20} />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 bg-white/80 backdrop-blur-sm relative">
              <div className="flex gap-2 items-end">
                <button 
                  className="p-3 text-gray-400 hover:bg-gray-100 rounded-xl"
                  onClick={() => !isProcessingFile && fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                >
                  {isProcessingFile ? <Loader2 size={20} className="animate-spin"/> : <Paperclip size={20} />}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                  placeholder={isReducedLoad ? "Keep it simple..." : "Ask MindMirror..."}
                  className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none max-h-32"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  className="p-3 rounded-xl text-white shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: currentTheme.colors.primary }}
                  disabled={(!input.trim() && !attachedFile) || isLoading}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
