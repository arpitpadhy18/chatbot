import React from 'react';

function DocumentItem({ file, isActive, onSelect, onDelete }) {

    const formatSize = (size) => {
        if (typeof size === 'string') return size;
        return size;
    };

    return (
        <div
            onClick={() => onSelect(file)}
            className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all border border-transparent ${isActive
                ? 'bg-ui-border border-slate-700 shadow-sm'
                : 'hover:bg-ui-border hover:border-slate-700'
                }`}
        >

            <div className="text-white flex items-center justify-center rounded-lg bg-ui-border shrink-0 size-10 relative overflow-hidden">
                <div className={`absolute inset-0 opacity-20 ${file.color ? file.color.replace('text-', 'bg-') : 'bg-gray-400'}`}></div>
                <span className={`material-symbols-outlined ${file.color} relative z-10`}>{file.icon}</span>
            </div>


            <div className="flex flex-col min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{file.name}</p>
                <p className="text-bolt-secondary text-[11px] flex gap-2">
                    <span>{file.date}</span>
                    <span>•</span>
                    <span>{formatSize(file.size)}</span>
                </p>
            </div>


            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(e, file.id);
                }}
                className="p-1.5 rounded-lg text-bolt-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Document"
            >
                <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
        </div>
    );
}

export default DocumentItem;
