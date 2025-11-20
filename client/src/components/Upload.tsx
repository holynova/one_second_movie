import React, { useCallback, useState } from 'react';

interface UploadProps {
  onFileSelect: (file: File) => void;
}

export const Upload: React.FC<UploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer
        ${isDragging 
          ? 'border-purple-500 bg-purple-500/10 scale-[1.02]' 
          : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        accept="video/*"
        onChange={handleFileInput}
      />
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-200">Upload Video</h3>
        <p className="text-slate-400 max-w-sm">
          Drag and drop your video file here, or click to browse.
          Supports MP4, MKV, MOV.
        </p>
      </div>
    </div>
  );
};
