import React from 'react';
import DocumentItem from './DocumentItem';

function DocumentList({ files, activeFile, onSelect, onDelete }) {
    if (!files || files.length === 0) {
        return (
            <div className="text-center py-8 opacity-50">
                <p className="text-xs text-bolt-secondary">No documents uploaded yet.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {files.map((file) => (
                <DocumentItem
                    key={file.id}
                    file={file}
                    isActive={activeFile?.id === file.id}
                    onSelect={onSelect}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}

export default DocumentList;
