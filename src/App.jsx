import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const [view, setView] = useState('auth'); // 'auth', 'home', 'documents', 'chatbot'
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, view]);

  // Fetch history function
  const refreshChatHistory = async (sessionId) => {
    try {
      const targetSession = (typeof sessionId === 'string' ? sessionId : null) || currentSessionId || "default";
      const historyResponse = await fetch(`${API_URL}/chat-history?session_id=${targetSession}`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.history) {
          const formattedHistory = [];
          historyData.history.forEach((h, index) => {
            formattedHistory.push({
              id: `hist-q-${index}`,
              text: h.question,
              sender: 'user',
              name: 'You',
              time: ''
            });
            formattedHistory.push({
              id: `hist-a-${index}`,
              text: h.answer,
              sender: 'bot',
              name: 'Ripers Bot',
              sources: [],
              time: ''
            });
          });
          setMessages(formattedHistory);
        }
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // Fetch files and history on mount
  useEffect(() => {
    const fetchResources = async () => {
      try {
        // Fetch Files
        const filesResponse = await fetch(`${API_URL}/files`);
        if (filesResponse.ok) {
          const data = await filesResponse.json();
          const backendFiles = data.files.map((filename, index) => {
            let icon = 'description';
            let color = 'text-gray-400';
            if (filename.includes('.pdf')) { icon = 'picture_as_pdf'; color = 'text-red-400'; }
            else if (filename.includes('.xls') || filename.includes('.sheet')) { icon = 'table_chart'; color = 'text-green-400'; }
            else if (filename.includes('.jpg') || filename.includes('.png')) { icon = 'image'; color = 'text-purple-400'; }

            return {
              id: `backend-${index}-${filename}`,
              name: filename,
              type: 'unknown',
              size: 'Server File',
              date: 'Synced',
              icon,
              color,
              url: null,
              status: 'success'
            };
          });

          setUploadedFiles(prev => {
            const currentNames = new Set(prev.map(f => f.name));
            const newFiles = backendFiles.filter(f => !currentNames.has(f.name));
            return [...prev, ...newFiles];
          });
        }

        // Fetch Sessions
        const sessionsResponse = await fetch(`${API_URL}/sessions`);
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          setSessions(sessionsData.sessions || []);
        }

        // Load history initially
        await refreshChatHistory();

      } catch (error) {
        console.error("Error fetching resources:", error);
      }
    };

    fetchResources();
  }, [API_URL]);

  const handleLogout = () => {
    setMessages([]);
    setView('auth');
    // setUploadedFiles([]); // Removed to persist files
  };

  const handleNewChat = () => {
    setCurrentSessionId(Date.now().toString());
    setMessages([]);
    setInputValue("");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      name: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");

    // Use current session or create new one
    let activeSessionId = currentSessionId || Date.now().toString();
    if (!currentSessionId) setCurrentSessionId(activeSessionId);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentInput,
          session_id: activeSessionId
        })
      });

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        text: data.answer || "I received your message.",
        sender: 'bot',
        name: 'Ripers Bot',
        sources: data.sources || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Error connecting to server. Please check your backend connection.",
        sender: 'bot',
        name: 'System',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newLocalFiles = files.map(file => {
      let icon = 'description';
      let color = 'text-gray-400';
      if (file.type.includes('pdf')) { icon = 'picture_as_pdf'; color = 'text-red-400'; }
      else if (file.type.includes('sheet') || file.type.includes('excel')) { icon = 'table_chart'; color = 'text-green-400'; }
      else if (file.type.includes('image')) { icon = 'image'; color = 'text-purple-400'; }

      return {
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.type,
        size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
        date: 'Just now',
        icon,
        color,
        url: URL.createObjectURL(file),
        status: 'uploading'
      };
    });

    setUploadedFiles(prev => [...prev, ...newLocalFiles]);

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const localFileId = newLocalFiles[i].id;
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          setUploadedFiles(prev => prev.map(f =>
            f.id === localFileId ? { ...f, status: 'success' } : f
          ));
        } else {
          setUploadedFiles(prev => prev.map(f =>
            f.id === localFileId ? { ...f, status: 'error', color: 'text-red-600' } : f
          ));
        }
      } catch (error) {
        console.error(`Upload Error for ${file.name}:`, error);
        setUploadedFiles(prev => prev.map(f =>
          f.id === localFileId ? { ...f, status: 'error', color: 'text-red-600' } : f
        ));
      }
    }
  };

  const deleteFile = async (e, id, filename) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/files/${filename}`, { method: 'DELETE' });
    } catch (error) {
      console.error(`Error deleting file ${filename}:`, error);
    }
    const newFiles = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(newFiles);
    if (activeFile && activeFile.id === id) {
      setActiveFile(null);
    }
  };

  // --- UI Components ---

  const NavLink = ({ label, targetView, icon }) => (
    <button
      onClick={() => setView(targetView)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${view === targetView
        ? 'bg-fuchsia-100 text-fuchsia-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
    >
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {label}
    </button>
  );

  /* --- AUTH ICONS --- */
  const UserIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const MailIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const ArrowRightIcon = () => (
    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );

  const [isLogin, setIsLogin] = useState(true);

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-pink-50/30 flex flex-col items-center justify-center p-4 font-sans text-slate-800">

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-fuchsia-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500 mb-1">
            Welcome to Ripers AI
          </h1>
          <p className="text-gray-500 text-sm">Your intelligent document assistant</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Get Started</h2>
            <p className="text-gray-500 text-sm">Sign in or create a new account to continue</p>
          </div>

          {/* Toggle */}
          <div className="bg-gray-100 p-1.5 rounded-xl flex mb-8">
            <button
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${!isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          {/* Google Auth Button */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors mb-6 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Forms */}
          <div className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 ml-1">
                {isLogin ? 'Email Address' : 'Email or Phone Number'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MailIcon />
                </div>
                <input
                  type={isLogin ? "email" : "text"}
                  placeholder={isLogin ? "you@example.com" : "you@example.com or +1234567890"}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setView('home')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/30 flex items-center justify-center mt-6"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRightIcon />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button className="text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors">
            — Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">description</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                Ripers AI
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <NavLink label="Home" targetView="home" icon="home" />
              <NavLink label="Documents" targetView="documents" icon="upload_file" />
              <NavLink label="Chatbot" targetView="chatbot" icon="chat_bubble" />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:block">Welcome, User!</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HOME VIEW */}
        {view === 'home' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="text-center py-20 px-4">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
                Your AI <span className="text-fuchsia-600">Document Assistant</span>
              </h1>
              <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
                Upload your documents and chat with an AI that understands them. Get instant answers, summaries, and insights from your files.
              </p>
              <button
                onClick={() => setView('documents')}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg hover:opacity-90 transition-all hover:-translate-y-0.5"
              >
                Go to Dashboard
              </button>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-24">
              {[
                { title: 'Upload Documents', desc: 'Support for PDF, DOCX, TXT', icon: 'upload_file', color: 'text-fuchsia-500' },
                { title: 'AI-Powered Chat', desc: 'Ask questions and get answers', icon: 'smart_toy', color: 'text-purple-500' },
                { title: 'Secure & Private', desc: 'Your documents are safe', icon: 'security', color: 'text-blue-500' },
                { title: 'Fast & Reliable', desc: 'Lightning fast processing', icon: 'bolt', color: 'text-amber-500' }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-lg ${feature.color.replace('text-', 'bg-')}/10 flex items-center justify-center mb-4`}>
                    <span className={`material-symbols-outlined ${feature.color}`}>{feature.icon}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mb-24">
              <h2 className="text-2xl font-bold text-slate-900 mb-12">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10 hidden md:block -translate-y-1/2"></div>
                {[
                  { step: '1', title: 'Upload Documents', desc: 'Upload your PDF, DOCX, TXT files', icon: 'cloud_upload' },
                  { step: '2', title: 'Ask Questions', desc: 'Chat comfortably with our AI', icon: 'chat' },
                  { step: '3', title: 'Get Answers', desc: 'Receive instant, accurate answers', icon: 'lightbulb' }
                ].map((step, i) => (
                  <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative group">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-fuchsia-200">
                      {step.step}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500">{step.step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-3xl p-12 text-center text-white shadow-xl shadow-fuchsia-200">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="mb-8 opacity-90">Join thousands of users who are already using Ripers AI.</p>
              <button
                onClick={() => setView('chatbot')}
                className="bg-white text-fuchsia-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Start Chatting Now
              </button>
            </div>

            <footer className="mt-20 text-center text-sm text-gray-400 pb-8">
              © 2026 Ripers AI. All rights reserved.
            </footer>
          </div>
        )}

        {/* DOCUMENTS VIEW */}
        {view === 'documents' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload Your Documents</h1>
              <p className="text-slate-500">Manage your files before chatting with the AI assistant</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
              <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
                Document Upload
              </h2>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-fuchsia-400 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-fuchsia-500 text-3xl">cloud_upload</span>
                </div>
                <p className="text-slate-700 font-medium mb-2">Drop your files here or click to browse</p>
                <p className="text-slate-400 text-sm mb-6">Supported formats: PDF, DOCX, TXT, XLSX</p>
                <button className="bg-fuchsia-100 text-fuchsia-700 px-6 py-2 rounded-full text-sm font-semibold group-hover:bg-fuchsia-200 transition-colors">
                  Upload Document
                </button>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 min-h-[300px]">
              <h2 className="font-semibold text-lg text-slate-800 mb-6">Uploaded Documents</h2>
              {uploadedFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">description</span>
                  <p>No documents uploaded yet</p>
                  <p className="text-xs mt-1">Upload your first document to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="group relative bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-fuchsia-200 hover:shadow-md transition-all flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${file.color ? file.color.replace('text-', 'bg-') : 'bg-gray-200'} bg-opacity-10`}>
                        <span className={`material-symbols-outlined ${file.color}`}>{file.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800 text-sm truncate">{file.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{file.size} • {file.date}</p>
                      </div>
                      <button
                        onClick={(e) => deleteFile(e, file.id, file.name)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all absolute top-2 right-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAT VIEW */}
        {view === 'chatbot' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-140px)] flex max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

            {/* Sidebar (Left Side) */}
            <div className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0">
              <div className="p-4 space-y-4">
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-3 w-full hover:bg-slate-50 p-2 rounded-lg transition-colors text-slate-700 hover:text-fuchsia-600"
                >
                  <span className="material-symbols-outlined text-[20px]">edit_square</span>
                  <span className="text-sm font-medium">New chat</span>
                </button>
                <button
                  onClick={() => refreshChatHistory(currentSessionId)}
                  className="flex items-center gap-3 w-full hover:bg-slate-50 p-2 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined text-[20px]">refresh</span>
                  <span className="text-sm">Refresh Chats</span>
                </button>
              </div>

              <div className="px-6 py-2 flex-1 overflow-y-auto custom-scrollbar">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Your chats</h3>
                <div className="space-y-1">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic px-2">No active chats</p>
                  ) : (
                    sessions.map((sessionId) => (
                      <button
                        key={sessionId}
                        onClick={() => {
                          setCurrentSessionId(sessionId);
                          refreshChatHistory(sessionId);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg truncate transition-colors ${currentSessionId === sessionId
                          ? 'bg-fuchsia-100 text-fuchsia-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        Session {new Date(parseInt(sessionId) || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-auto p-4 border-t border-slate-100">
                {/* User profile removed as requested */}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-bold text-slate-800">Chat Assistant</h2>
                  <p className="text-xs text-slate-500">{uploadedFiles.length} documents loaded</p>
                </div>
                <button
                  onClick={refreshChatHistory}
                  className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">history</span>
                  View History
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <div className="w-16 h-16 bg-fuchsia-100 rounded-2xl flex items-center justify-center mb-4 text-fuchsia-500">
                      <span className="material-symbols-outlined text-3xl">smart_toy</span>
                    </div>
                    <p className="text-slate-500 font-medium">No messages yet</p>
                    <p className="text-sm text-slate-400 mt-1">Start by asking a question about your documents</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.sender === 'user' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-fuchsia-600 border-fuchsia-100'}`}>
                      {msg.sender === 'user' ? (
                        <span className="material-symbols-outlined text-[16px] text-white">person</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                      )}
                    </div>
                    <div className={`max-w-[80%] space-y-1`}>
                      <div className="text-xs text-slate-400 px-1 flex items-center gap-2">
                        <span>{msg.name}</span>
                        <span>{msg.time}</span>
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                        {msg.text}
                        {msg.sender === 'bot' && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 mb-1">Sources:</p>
                            <div className="flex flex-wrap gap-1">
                              {msg.sources.map((src, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-fuchsia-50 text-fuchsia-700 rounded text-[10px] border border-fuchsia-100">{src}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSend} className="relative max-w-3xl mx-auto">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                  </button>
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-fuchsia-500 text-white rounded-full hover:bg-fuchsia-600 disabled:opacity-50 disabled:hover:bg-fuchsia-500 transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px] translate-x-0.5">send</span>
                  </button>
                </form>
                <div className="text-center mt-2">
                  <p className="text-[10px] text-slate-400">AI can make mistakes. Please verify important information.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
