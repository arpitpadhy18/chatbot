import React from "react";
import UploadDocument from "./UploadDocument";
import ChatbotNavigation from "./ChatbotNavigation";
import DocumentList from "./DocumentList";

function Documents({ files, activeFile, onUpload, onSelect, onDelete, onChatNavigation }) {
    return (
        <aside className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-ui-darker h-full transition-all flex-shrink-0">
            <div className="p-6 pb-4">

                <div className="flex gap-3 items-center mb-6">
                    <div className="bg-primary rounded-lg p-2 text-white">
                        <span className="material-symbols-outlined block">folder_managed</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-base font-semibold leading-none">DocManager</h1>
                        <p className="text-bolt-secondary text-xs font-normal mt-1">Enterprise Workspace</p>
                    </div>
                </div>


                <ChatbotNavigation onClick={onChatNavigation} />


                <div className="flex items-center gap-2 mb-4">
                    <div className="h-px bg-slate-800 flex-1"></div>
                    <span className="text-[10px] text-bolt-secondary uppercase font-bold tracking-wider">Actions</span>
                    <div className="h-px bg-slate-800 flex-1"></div>
                </div>


                <UploadDocument onUpload={onUpload} />
            </div>


            <div className="px-6 pb-2">
                <h3 className="text-bolt-secondary text-[11px] font-bold uppercase tracking-wider">Your Documents</h3>
            </div>


            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                <DocumentList
                    files={files}
                    activeFile={activeFile}
                    onSelect={onSelect}
                    onDelete={onDelete}
                />
            </div>
        </aside>
    );
}

export default Documents;