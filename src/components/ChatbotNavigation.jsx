import React from 'react';

function ChatbotNavigation({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
        >
            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
            Go to Chatbot
        </button>
    );
}

export default ChatbotNavigation;
