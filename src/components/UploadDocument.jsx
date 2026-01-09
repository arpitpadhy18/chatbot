import React, { useRef } from 'react';

function UploadDocument({ onUpload }) {
    const fileInputRef = useRef(null);

    return (
        <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
        >
            <div className="border-2 border-dashed border-slate-700 hover:border-primary/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-ui-dark/30 transition-all hover:bg-primary/5">
                <div className="bg-primary/10 rounded-full p-2 text-primary">
                    <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                </div>
                <div className="text-center">
                    <p className="text-xs font-bold text-white">Upload New Doc</p>
                    <p className="text-[10px] text-bolt-secondary mt-0.5">PDF, DOCX, XLSX, TXT</p>
                </div>
                <input
                    ref={fileInputRef}
                    className="hidden"
                    type="file"
                    multiple
                    onChange={onUpload}
                />
            </div>
        </div>
    );
}

export default UploadDocument;
