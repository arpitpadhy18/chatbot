import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [view, setView] = useState('landing');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(uploadedFiles[0]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);


  useEffect(() => {
    if (view === 'dashboard') {
      setIsChatOpen(true);
    }
  }, [view]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (view === 'landing') {
      setView('dashboard');

    }

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      name: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        text: "I've started a new project based on your request. How can I help you further?",
        sender: 'bot',
        name: 'Ripers Bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => {
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
        url: URL.createObjectURL(file)
      };
    });
    setUploadedFiles(prev => [...prev, ...newFiles]);
    if (newFiles.length > 0) {
      setActiveFile(newFiles[0]);
      setIsChatOpen(true);
    }
  };

  const handleFileSelect = (file) => {
    setActiveFile(file);
    setIsChatOpen(true);
  };

  const deleteFile = (e, id) => {
    e.stopPropagation();
    const newFiles = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(newFiles);
    if (activeFile && activeFile.id === id) {
      setActiveFile(newFiles.length > 0 ? newFiles[0] : null);
    }
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[80%] bg-[#0047e1]/10 blur-[120px] rounded-full mix-blend-screen opacity-50"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[60%] bg-[#1e88e5]/10 blur-[100px] rounded-full mix-blend-screen opacity-30"></div>
        </div>

        <div className="z-10 w-full max-w-4xl px-4 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
            What will you upload <span className="text-[#3b82f6]">today?</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl">
            upload your files and get started by chatting with AI.
          </p>

          <div className="w-full max-w-2xl">
            {uploadedFiles.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="bg-[#18181b] border border-[#27272a] rounded-lg p-2 pr-3 flex items-center gap-3 shadow-lg">
                    <div className={`p-2 rounded-md ${file.color ? file.color.replace('text-', 'bg-') : 'bg-gray-600'} bg-opacity-10`}>
                      <span className={`material-symbols-outlined ${file.color} text-[20px]`}>{file.icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white max-w-[150px] truncate">{file.name}</span>
                      <span className="text-[10px] text-gray-400">{file.size}</span>
                    </div>
                    <button
                      onClick={(e) => deleteFile(e, file.id)}
                      className="ml-2 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="relative group w-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-30 group-hover:opacity-50 transition duration-300 blur-sm"></div>
              <div className="relative bg-[#18181b] rounded-2xl p-2 flex flex-col shadow-2xl border border-[#27272a]">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Ask about this..."
                  className="w-full bg-transparent text-white placeholder-gray-500 px-4 py-3 min-h-[50px] max-h-[200px] resize-none focus:outline-none text-base"
                  rows={1}
                />
                <div className="flex items-center justify-between pl-2 pr-1 pb-1">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#27272a]">
                      <span className="material-symbols-outlined text-[20px]">attach_file</span>
                    </button>
                  </div>
                  <button type="submit" className="bg-[#3b82f6] hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1">
                    <span>Start</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3 opacity-60">
            <button onClick={() => fileInputRef.current?.click()} className="bg-[#27272a] hover:bg-[#3f3f46] transition-colors px-3 py-1.5 rounded-full text-xs text-gray-300 border border-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">description</span>
              Upload docs
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-[#27272a] hover:bg-[#3f3f46] transition-colors px-3 py-1.5 rounded-full text-xs text-gray-300 border border-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">image</span>
              Upload images
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-[#27272a] hover:bg-[#3f3f46] transition-colors px-3 py-1.5 rounded-full text-xs text-gray-300 border border-gray-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">movie</span>
              Upload videos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-slate-100 font-sans overflow-hidden">

      <aside className="w-64 border-r border-[#27272a] flex flex-col bg-[#0a0a0a] h-full flex-shrink-0">
        <div className="p-4">
          <div className="flex gap-2 items-center mb-6 px-2">
            <div className="bg-white text-black rounded-md w-6 h-6 flex items-center justify-center font-bold text-xs">R</div>
            <span className="font-semibold text-lg tracking-tight">ripers.new</span>
          </div>

          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="border border-dashed border-[#27272a] hover:border-[#3b82f6]/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2 bg-[#18181b] transition-all">
              <span className="material-symbols-outlined text-[#3b82f6] text-xl">cloud_upload</span>
              <div className="text-center">
                <p className="text-[10px] font-medium text-gray-300">Upload Files</p>
              </div>
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                multiple
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-2 flex-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold text-[#52525b] mb-2 px-2">Recent</div>
          <div className="flex flex-col gap-1">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => handleFileSelect(file)}
                className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${activeFile?.id === file.id ? 'bg-[#27272a] text-white' : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'}`}
              >
                <span className={`material-symbols-outlined text-[16px] ${file.color}`}>{file.icon}</span>
                <span className="text-xs truncate flex-1">{file.name}</span>
                <button onClick={(e) => deleteFile(e, file.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>


      </aside>

      <main className="flex-1 flex flex-col bg-[#0a0a0a] relative overflow-hidden">
        <header className="h-12 border-b border-[#27272a] flex items-center justify-between px-4 bg-[#0a0a0a]">
          <div className="flex items-center gap-2">

          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${isChatOpen ? 'bg-[#3b82f6] text-white' : 'hover:bg-[#18181b] text-[#a1a1aa]'}`}
              title="Toggle Chat"
            >
              <span className="material-symbols-outlined text-[12px]">smart_toy</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">

          <div className={`flex-1 overflow-auto p-8 flex justify-center bg-[#000000] custom-scrollbar transition-all duration-300`}>
            {activeFile ? (
              <div className="w-full max-w-3xl bg-[#18181b] border border-[#27272a] rounded-lg min-h-[1000px] p-12 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-20"></div>
                {activeFile.url && activeFile.type.includes('image') ? (
                  <img src={activeFile.url} className="w-full h-auto rounded border border-[#27272a]" alt="preview" />
                ) : (
                  <div className="flex flex-col gap-6">
                    <h1 className="text-3xl font-bold text-white mb-4 border-b border-[#27272a] pb-4">{activeFile.name}</h1>
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-[#27272a] rounded w-full"></div>
                      <div className="h-4 bg-[#27272a] rounded w-5/6"></div>
                      <div className="h-4 bg-[#27272a] rounded w-4/6"></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center opacity-30">
                <span className="material-symbols-outlined text-6xl mb-4">dock_to_left</span>
                <p>Select a file to view</p>
              </div>
            )}
          </div>


          <div className={`${isChatOpen ? 'w-96 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'} border-l border-[#27272a] bg-[#0a0a0a] transition-all duration-300 ease-in-out flex flex-col z-20`}>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-[#27272a] ${msg.sender === 'user' ? 'bg-[#27272a] text-white' : 'bg-transparent text-white'}`}>
                    {msg.sender === 'user' ? 'U' : 'R'}
                  </div>
                  <div className={`p-3 rounded-xl text-sm leading-relaxed max-w-[85%] ${msg.sender === 'user' ? 'bg-[#3b82f6] text-white' : 'bg-[#18181b] border border-[#27272a] text-[#d4d4d8]'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-[#27272a] bg-[#0a0a0a]">
              <form onSubmit={handleSend} className="relative">
                <input
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg py-3 px-4 pr-10 text-sm focus:outline-none focus:border-[#3b82f6] transition-colors text-white"
                  placeholder="Ask Ripers AI..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-white">
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
