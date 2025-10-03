import React, { useMemo, useRef, useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentUser } from "../services/auth";
import { getApiUrl } from "../config/api";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const listRef = useRef(null);
  const WA_NUMBER = "94701269689"; // provided number without '+' for wa.me
  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    "Hi! I came from the website chat and need assistance."
  )}`;

  // Initial setup on component mount
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    
    if (user) {
      // Setup fresh chat for logged-in user
      setupNewUserChat(user);
    } else {
      // Generate new session ID for guest users
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      console.log('Created new guest session:', newSessionId);
    }
  }, []);

  // Watch for user changes (login/logout)
  useEffect(() => {
    const user = getCurrentUser();
    
    // Only process if user actually changed
    if (user !== currentUser) {
      const prevUser = currentUser;
      
      // If user logged out (had user before, now null)
      if (prevUser && !user) {
        console.log('User logged out, resetting chatbot');
        resetChatCompletely();
      }
      // If user logged in (was null, now has user)  
      else if (!prevUser && user) {
        console.log('User logged in, setting up new chat for:', user.username);
        setupNewUserChat(user);
      }
      // If different user logged in
      else if (prevUser && user && (prevUser.email !== user.email || prevUser.username !== user.username)) {
        console.log('Different user logged in, setting up new chat');
        setupNewUserChat(user);
      }
      
      setCurrentUser(user);
    }
  }, [currentUser]);

  // Load messages when session is restored
  useEffect(() => {
    if (sessionId && !showNameInput && customerName) {
      loadMessages();
    }
  }, [sessionId, showNameInput, customerName]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Load existing messages when chat opens
  useEffect(() => {
    if (open && sessionId && !showNameInput) {
      loadMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [open, sessionId, showNameInput]);

  // Setup new chat for logged-in user
  function setupNewUserChat(user) {
    setCustomerName(user.username);
    setShowNameInput(false);
    setMessages([]);
    setInput("");
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    console.log('Setup new chat for user:', user.username, 'with session:', newSessionId);
  }

  // Reset chatbot completely (when user logs out)
  function resetChatCompletely() {
    console.log('Resetting chatbot completely');
    // Clear all data
    setMessages([]);
    setCustomerName("");
    setShowNameInput(true);
    setInput("");
    
    // Generate completely new session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    console.log('Created fresh session:', newSessionId);
    
    // Close chat if open
    setOpen(false);
  }

  // Function to reset chat session (for leave chat button)
  function resetChatSession() {
    console.log('Resetting chat session');
    
    // Reset component state completely
    setMessages([]);
    setCustomerName("");
    setShowNameInput(true);
    setInput("");
    
    // Generate new session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Close chat if open
    setOpen(false);
  }

  // Periodic check for user changes (every 2 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const user = getCurrentUser();
      if (user !== currentUser) {
        setCurrentUser(user);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  async function loadMessages() {
    try {
      const response = await axios.get(getApiUrl(`/api/chat/${sessionId}`));
      const chatMessages = response.data.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'admin',
        text: msg.message,
        timestamp: msg.timestamp,
        senderName: msg.senderName
      }));
      
      // Only update if we have messages from backend or if local messages are empty
      if (chatMessages.length > 0 || messages.length === 0) {
        setMessages(chatMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  const quickReplies = useMemo(
    () => [
      "Show latest deals",
      "Track my order",
      "What are shipping charges?",
      "Help with returns",
    ],
    []
  );

  async function startChat() {
    if (!customerName.trim()) return;
    
    console.log('Starting new chat for:', customerName);
    setShowNameInput(false);
    
    const welcomeMessage = `Hello ${customerName}! Welcome to our store. How can I help you today?`;
    
    // Add welcome message to local state immediately
    setMessages([{
      role: 'admin',
      text: welcomeMessage,
      timestamp: new Date().toISOString(),
      senderName: 'Support Team'
    }]);
    
    // Send initial welcome message to backend
    try {
      await axios.post(getApiUrl('/api/chat'), {
        message: welcomeMessage,
        sender: 'admin',
        senderName: 'Support Team',
        sessionId: sessionId,
        userId: currentUser?.userId || null
      });
    } catch (error) {
      console.error('Failed to send welcome message:', error);
    }
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || !sessionId) return;
    
    // Add user message to local state immediately
    const userMessage = {
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
      senderName: customerName || 'Customer'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    try {
      await axios.post(getApiUrl('/api/chat'), {
        message: trimmed,
        sender: 'user',
        senderName: customerName || 'Customer',
        sessionId: sessionId,
        userId: currentUser?.userId || null
      });
      
      // Reload messages to sync with backend and get any admin responses
      setTimeout(loadMessages, 500);
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  function leaveChat() {
    // Clear localStorage data
    localStorage.removeItem('chatSession');
    localStorage.removeItem('chatCustomerName');
    
    // Reset component state
    setMessages([]);
    setCustomerName("");
    setShowNameInput(true);
    setInput("");
    
    // Generate new session ID for next chat
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Close chat
    setOpen(false);
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full shadow-xl bg-[#1A1E21] text-white w-14 h-14 flex items-center justify-center border border-white/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z"/></svg>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="mt-3 w-[320px] sm:w-[360px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-3 bg-[#1A1E21] text-white flex items-center justify-between">
              <div className="font-semibold">Live Chat Support</div>
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-80">Online</span>
                {!showNameInput && (
                  <button
                    onClick={leaveChat}
                    className="inline-flex items-center gap-1 text-xs bg-red-500/20 hover:bg-red-500/30 px-2 py-1 rounded border border-red-400/30 text-red-200"
                    title="Leave Chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Leave
                  </button>
                )}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded border border-white/20"
                  title="Continue on WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M20.52 3.48A11.78 11.78 0 0012.04 0C5.53 0 .26 5.27.26 11.78c0 2.07.55 4.08 1.6 5.86L0 24l6.5-1.7a11.73 11.73 0 005.54 1.4h.01c6.5 0 11.78-5.27 11.78-11.78 0-3.15-1.23-6.12-3.3-8.24zM12.05 21.5a9.7 9.7 0 01-4.95-1.35l-.35-.2-3.85 1.01 1.03-3.75-.22-.38a9.7 9.7 0 01-1.46-5.06c0-5.36 4.36-9.72 9.72-9.72 2.6 0 5.05 1.01 6.89 2.85a9.62 9.62 0 012.84 6.88c0 5.36-4.36 9.72-9.72 9.72zm5.56-7.26c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.78-1.68-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.21-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.51s1.08 2.91 1.23 3.11c.15.2 2.12 3.23 5.14 4.53.72.31 1.29.5 1.73.64.73.23 1.4.2 1.93.12.59-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Name Input Screen */}
            {showNameInput ? (
              <div className="h-72 flex flex-col items-center justify-center p-6 bg-white">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Start Live Chat</h3>
                  <p className="text-sm text-gray-600">Please enter your name to begin chatting with our support team</p>
                </div>
                <div className="w-full space-y-4">
                  <input
                    type="text"
                    placeholder="Enter your name..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") startChat();
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <motion.button
                    onClick={startChat}
                    disabled={!customerName.trim()}
                    className="w-full px-4 py-2 rounded-lg bg-[#1A1E21] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: customerName.trim() ? 1.02 : 1 }}
                    whileTap={{ scale: customerName.trim() ? 0.98 : 1 }}
                  >
                    Start Chat
                  </motion.button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages Area */}
                <div ref={listRef} className="h-72 overflow-y-auto p-3 space-y-2 bg-white">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                      Loading messages...
                    </div>
                  ) : (
                    messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm shadow ${
                          m.role === "user" ? "bg-[#1A1E21] text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"
                        }`}>
                          {m.text}
                          {m.timestamp && (
                            <div className="text-xs opacity-50 mt-1">
                              {new Date(m.timestamp).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Area */}
                <div className="px-3 py-2 border-t bg-gray-50">
                  <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
                    {quickReplies.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="px-2 py-1 text-xs rounded-full bg-white border border-gray-200 hover:bg-gray-100 whitespace-nowrap"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                      placeholder="Type your message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendMessage(input);
                      }}
                    />
                    <motion.button
                      className="px-3 py-2 rounded-lg bg-[#1A1E21] text-white"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => sendMessage(input)}
                    >
                      Send
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
