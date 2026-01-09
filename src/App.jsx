import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  // --- State Managment ---
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey team, can someone check page 3 of the financial report?", sender: 'user', name: 'Sarah Chen', time: '10:45 AM', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNKGwVfyVZFhDAp2GTF5GQta1scyxTBIp2B7fKMDDJu7BxnEG_atx8tsWT0szigz6MvHW14o1x38C9UeSzWRRRxpD5qZpU3Awh_pvzI3ygD0N-4iRWlbJHvLCGq5lYwH0Sn6SnFxNq0GJpPBfmqckm9jdO0A1meZuvmZQTD7rwKeqXGfFLWKOCe1Ins8iQXiFzRFd344KxcOzulyy3DFWBj78mkmDz7zVkK-DlOI7Yq4mZJywoXsuozrEasYlA7UNlv3GB2aouSCjE' },
    { id: 2, text: "I've analyzed the table on page 3. It shows a discrepancy of $12,400.", sender: 'bot', name: 'Doc Bot', time: '10:46 AM' },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 'f1', name: 'Financial_Report_2023.pdf', type: 'application/pdf', size: '4.2 MB', date: '2 hours ago', icon: 'picture_as_pdf', color: 'text-red-400' },
    { id: 'f2', name: 'Project_Brief_Final.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: '1.8 MB', date: '5 hours ago', icon: 'description', color: 'text-blue-400' }
  ]);
  const [activeFile, setActiveFile] = useState(uploadedFiles[0]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handlers ---
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      name: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNKGwVfyVZFhDAp2GTF5GQta1scyxTBIp2B7fKMDDJu7BxnEG_atx8tsWT0szigz6MvHW14o1x38C9UeSzWRRRxpD5qZpU3Awh_pvzI3ygD0N-4iRWlbJHvLCGq5lYwH0Sn6SnFxNq0GJpPBfmqckm9jdO0A1meZuvmZQTD7rwKeqXGfFLWKOCe1Ins8iQXiFzRFd344KxcOzulyy3DFWBj78mkmDz7zVkK-DlOI7Yq4mZJywoXsuozrEasYlA7UNlv3GB2aouSCjE'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Simulate Bot Response
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        text: "I've logged that note. Anything else you need to add to the discussion?",
        sender: 'bot',
        name: 'Doc Bot',
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
    if (newFiles.length > 0) setActiveFile(newFiles[0]);
  };

  const deleteFile = (e, id) => {
    e.stopPropagation();
    const newFiles = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(newFiles);
    if (activeFile && activeFile.id === id) {
      setActiveFile(newFiles.length > 0 ? newFiles[0] : null);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans">

      {/* --- LEFT SIDEBAR: DocManager --- */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-ui-darker h-full transition-all">
        <div className="p-6 pb-2">
          {/* Brand */}
          <div className="flex gap-3 items-center mb-6">
            <div className="bg-primary rounded-lg p-2 text-white">
              <span className="material-symbols-outlined block">folder_managed</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-base font-semibold leading-none">DocManager</h1>
              <p className="text-bolt-secondary text-xs font-normal mt-1">Enterprise Workspace</p>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="border-2 border-dashed border-slate-700 hover:border-primary/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-ui-dark/30 transition-all hover:bg-primary/5">
              <div className="bg-primary/10 rounded-full p-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
              </div>
              <div className="text-center">
                <p class="text-xs font-bold text-white">Upload or drag file</p>
                <p className="text-[10px] text-bolt-secondary mt-0.5">PDF, DOCX, XLSX up to 10MB</p>
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

        {/* Search */}
        <div className="px-4 py-4">
          <label className="flex flex-col w-full">
            <div className="flex w-full items-stretch rounded-lg h-10">
              <div className="text-bolt-secondary flex bg-ui-border items-center justify-center pl-3 rounded-l-lg">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input className="flex w-full min-w-0 flex-1 border-none bg-ui-border focus:ring-0 text-white placeholder:text-bolt-secondary px-3 rounded-r-lg text-sm font-normal outline-none" placeholder="Search documents..." />
            </div>
          </label>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-ui-border text-white cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">description</span>
            <p className="text-sm font-medium">Documents</p>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 text-bolt-secondary hover:text-white cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-[20px]">share</span>
            <p className="text-sm font-medium">Shared with me</p>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 text-bolt-secondary hover:text-white cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-[20px]">archive</span>
            <p className="text-sm font-medium">Archive</p>
          </div>
        </nav>

        <div className="h-px bg-slate-200 dark:border-slate-800 mx-4 bg-slate-800"></div>

        {/* Recent Files List */}
        <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
          <h3 className="text-bolt-secondary text-[11px] font-bold uppercase tracking-wider px-4 pb-3">Recent Documents</h3>

          <div className="flex flex-col gap-1">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => setActiveFile(file)}
                className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all border border-transparent ${activeFile?.id === file.id ? 'bg-ui-border border-slate-700' : 'hover:bg-ui-border hover:border-slate-700'}`}
              >
                <div className="text-white flex items-center justify-center rounded-lg bg-ui-border shrink-0 size-10">
                  <span className={`material-symbols-outlined ${file.color}`}>{file.icon}</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <p className="text-bolt-secondary text-[11px]">{file.date}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => deleteFile(e, file.id)} className="p-1 hover:text-red-500 transition-colors text-bolt-secondary">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>


      {/* --- CENTER MAIN: Document Viewer --- */}
      <main className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-hidden relative">
        {/* Drag Overlay (Hidden logic for now) */}
        <div className="hidden absolute inset-0 z-50 bg-primary/20 backdrop-blur-sm border-4 border-dashed border-primary m-6 rounded-3xl flex-col items-center justify-center">
          <div className="bg-primary text-white rounded-full size-24 flex items-center justify-center shadow-2xl mb-6">
            <span className="material-symbols-outlined text-6xl">upload_file</span>
          </div>
          <h2 className="text-3xl font-bold text-white drop-shadow-md">Drop files here to upload</h2>
        </div>

        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-white dark:bg-ui-darker">
          <div className="flex items-center gap-4">
            {activeFile ? (
              <>
                <span className={`material-symbols-outlined ${activeFile.color} text-2xl`}>{activeFile.icon}</span>
                <div>
                  <h2 className="text-white text-sm font-semibold">{activeFile.name}</h2>
                  <p className="text-bolt-secondary text-[11px]">Modified {activeFile.date} • {activeFile.size}</p>
                </div>
              </>
            ) : (
              <div className="text-bolt-secondary text-sm">No document selected</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center size-9 rounded-lg hover:bg-ui-border text-bolt-secondary hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">zoom_in</span>
            </button>
            <button className="flex items-center justify-center size-9 rounded-lg hover:bg-ui-border text-bolt-secondary hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
            <div className="w-px h-6 bg-slate-800 mx-2"></div>
            <button className="flex items-center justify-center size-9 rounded-lg hover:bg-ui-border text-bolt-secondary hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </header>

        {/* Viewer Area (Mockup/Preview) */}
        <div className="flex-1 overflow-y-auto p-12 flex justify-center bg-slate-100 dark:bg-background-dark custom-scrollbar">
          {activeFile ? (
            <div className="w-full max-w-[800px] bg-white dark:bg-ui-darker shadow-2xl min-h-[1100px] p-16 flex flex-col gap-8 rounded-sm animate-in fade-in zoom-in-95 duration-300">
              {activeFile.url ? (
                /* Real Image Preview if available */
                activeFile.type.includes('image') ? <img src={activeFile.url} className="w-full h-auto rounded-lg" /> :
                  /* Fallback Mockup for PDFs/Docs */
                  <>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">{activeFile.name}</h1>
                    <div className="h-1 w-full bg-slate-200 dark:bg-ui-border mb-8"></div>
                    <div className="space-y-4">
                      <div className="h-4 w-full bg-slate-100 dark:bg-ui-dark rounded"></div>
                      <div className="h-4 w-full bg-slate-100 dark:bg-ui-dark rounded"></div>
                      <div className="h-4 w-[90%] bg-slate-100 dark:bg-ui-dark rounded"></div>
                      <div className="h-4 w-[95%] bg-slate-100 dark:bg-ui-dark rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 my-8">
                      <div className="aspect-video bg-slate-200 dark:bg-ui-border rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-700">image</span>
                      </div>
                      <div className="space-y-3">
                        <div className="h-3 w-full bg-slate-100 dark:bg-ui-dark rounded"></div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-ui-dark rounded"></div>
                        <div className="h-3 w-[70%] bg-slate-100 dark:bg-ui-dark rounded"></div>
                      </div>
                    </div>
                  </>
              ) : (
                /* Pure Mockup */
                <>
                  <div className="h-8 w-48 bg-slate-200 dark:bg-ui-border rounded"></div>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-slate-100 dark:bg-ui-dark rounded"></div>
                    <div className="h-4 w-full bg-slate-100 dark:bg-ui-dark rounded"></div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-bolt-secondary opacity-50">
              <span className="material-symbols-outlined text-6xl mb-4">description</span>
              <p>Select a document to preview</p>
            </div>
          )}
        </div>
      </main>


      {/* --- RIGHT SIDEBAR: Chat --- */}
      <aside className="w-96 border-l border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-ui-darker">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">chat_bubble</span>
            <h3 className="text-white text-sm font-semibold">Project Discussion</h3>
          </div>
          <div className="flex -space-x-2">
            <div className="size-7 rounded-full border-2 border-ui-darker bg-slate-600 flex items-center justify-center text-[10px] text-white">S</div>
            <div className="size-7 rounded-full border-2 border-ui-darker bg-primary flex items-center justify-center text-[10px] text-white">D</div>
            <div className="size-7 rounded-full border-2 border-ui-darker bg-slate-700 flex items-center justify-center text-[10px] text-white">+3</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col gap-2 max-w-[85%] ${msg.sender === 'bot' ? 'self-end items-end' : ''}`}>
              <div className="flex items-center gap-2">
                {msg.sender === 'user' ? (
                  <>
                    <span className="text-[11px] font-bold text-slate-400">{msg.name}</span>
                    <span className="text-[10px] text-bolt-secondary">{msg.time}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-bolt-secondary">{msg.time}</span>
                    <span className="text-[11px] font-bold text-primary">{msg.name}</span>
                  </>
                )}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'bot' ? 'bg-primary/20 border border-primary/30 rounded-tr-none text-slate-100' : 'bg-ui-border rounded-tl-none text-slate-200'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSend} className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              className="w-full bg-ui-dark border-none rounded-xl p-4 pr-12 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary min-h-[50px] max-h-[150px] resize-none overflow-hidden outline-none"
              placeholder="Type a message..."
              rows={1}
            />
            <button type="submit" className="absolute right-3 bottom-3 text-primary hover:text-white transition-colors bg-transparent border-none cursor-pointer">
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
          <div className="flex items-center gap-4 mt-3 px-1">
            <button className="text-bolt-secondary hover:text-white transition-colors"><span className="material-symbols-outlined text-[20px]">attach_file</span></button>
            <button className="text-bolt-secondary hover:text-white transition-colors"><span className="material-symbols-outlined text-[20px]">mood</span></button>
            <button className="text-bolt-secondary hover:text-white transition-colors"><span className="material-symbols-outlined text-[20px]">alternate_email</span></button>
            <div className="flex-1"></div>
            <p className="text-[10px] text-slate-600 font-medium">Press Enter to send</p>
          </div>
        </div>
      </aside>

    </div>
  );
}

export default App;
