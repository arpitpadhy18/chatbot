import React, { useRef, useEffect, useState } from 'react';

function Chatbot({ messages, onSendMessage }) {
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef(null);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        onSendMessage(inputValue);
        setInputValue("");
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleViewSource = (msgId) => {

        alert(`Viewing source context for message ID: ${msgId}`);
    };

    return (
        <aside className="w-96 border-l border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-ui-darker h-full transition-all flex-shrink-0">

            <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                        <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                    </div>
                    <h3 className="text-white text-sm font-semibold">AI Assistant</h3>
                </div>
                <div className="flex -space-x-2">

                    <button className="text-bolt-secondary hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                    </button>
                </div>
            </div>


            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col gap-2 max-w-[85%] ${msg.sender === 'bot' ? 'self-start items-start' : 'self-end items-end'}`}>
                        <div className={`flex items-center gap-2 ${msg.sender === 'bot' ? 'flex-row' : 'flex-row-reverse'}`}>
                            <div className={`size-6 rounded-full flex items-center justify-center text-[10px] text-white shrink-0 ${msg.sender === 'bot' ? 'bg-primary' : 'bg-slate-600'}`}>
                                {msg.sender === 'bot' ? <span className="material-symbols-outlined text-[14px]">smart_toy</span> : 'U'}
                            </div>
                            <span className="text-[11px] font-bold text-slate-400">{msg.name}</span>
                            <span className="text-[10px] text-bolt-secondary">{msg.time}</span>
                        </div>

                        <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group ${msg.sender === 'bot'
                            ? 'bg-ui-border rounded-tl-none text-slate-200'
                            : 'bg-primary text-white rounded-tr-none'
                            }`}>
                            {msg.text}


                            {msg.sender === 'bot' && (
                                <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-end">
                                    <button
                                        onClick={() => handleViewSource(msg.id)}
                                        className="flex items-center gap-1 text-[10px] text-primary hover:text-blue-300 transition-colors uppercase font-bold tracking-wide"
                                    >
                                        <span className="material-symbols-outlined text-[12px]">menu_book</span>
                                        View Source
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>


            <div className="p-6 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-ui-dark border-none rounded-xl p-4 pr-12 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary min-h-[50px] max-h-[150px] resize-none overflow-hidden outline-none"
                        placeholder="Ask anything..."
                        rows={1}
                    />
                    <button type="submit" className="absolute right-3 bottom-3 text-primary hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </form>
                <div className="flex items-center gap-4 mt-3 px-1">
                    <button className="text-bolt-secondary hover:text-white transition-colors"><span className="material-symbols-outlined text-[20px]">attach_file</span></button>
                    <div className="flex-1"></div>
                    <p className="text-[10px] text-slate-600 font-medium">Press Enter to send</p>
                </div>
            </div>
        </aside>
    );
}

export default Chatbot;
