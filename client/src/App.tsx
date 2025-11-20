import { useState } from 'react';
import { Layout } from './components/Layout';
import { Upload } from './components/Upload';

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};


function App() {
  const [file, setFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium');
  
  const [videoMetadata, setVideoMetadata] = useState<{
    duration: number;
    size: number;
  } | null>(null);
  
  const [outputStats, setOutputStats] = useState<{
    totalFrames: number;
    columns: number;
    rows: number;
    interval: number;
  } | null>(null);

  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState('');

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setVideoMetadata({
      duration: 0,
      size: selectedFile.size
    });
    await processVideo(selectedFile);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    await processVideo(null, url);
  };

  const processVideo = async (selectedFile: File | null, videoUrl?: string) => {
    setIsUploading(true);
    setProcessedImage(null);
    setOutputStats(null);
    
    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('video', selectedFile);
        formData.append('quality', quality);

        response = await fetch('http://localhost:3000/upload', {
          method: 'POST',
          body: formData,
        });
      } else if (videoUrl) {
        response = await fetch('http://localhost:3000/process-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: videoUrl,
            quality: quality
          }),
        });
      } else {
        return;
      }
      
      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const data = await response.json();
      setProcessedImage(`http://localhost:3000${data.processedPath}`);
      
      // Update metadata and output stats
      if (data.metadata) {
        setVideoMetadata({
          duration: data.metadata.duration,
          size: data.metadata.size
        });
        setOutputStats({
          totalFrames: data.metadata.totalFrames,
          columns: data.metadata.columns,
          rows: data.metadata.rows,
          interval: data.metadata.interval
        });
      }
    } catch (error) {
      console.error('Error processing video:', error);
      alert('Processing failed');
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {!file && !url ? (
          <div className="py-12 space-y-8">
            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={() => setInputMode('file')}
                className={`px-6 py-2 rounded-full transition-colors ${inputMode === 'file' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                Upload File
              </button>
              <button
                onClick={() => setInputMode('url')}
                className={`px-6 py-2 rounded-full transition-colors ${inputMode === 'url' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                Video URL
              </button>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Output Quality</h3>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="quality"
                    value="low"
                    checked={quality === 'low'}
                    onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
                    className="sr-only peer"
                  />
                  <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-4 text-center transition-all peer-checked:border-purple-500 peer-checked:bg-purple-500/10 hover:border-slate-600">
                    <div className="font-semibold text-white mb-1">Low</div>
                    <div className="text-xs text-slate-400">Fewer screenshots</div>
                    <div className="text-xs text-slate-500 mt-1">5 columns, 60s interval</div>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="quality"
                    value="medium"
                    checked={quality === 'medium'}
                    onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
                    className="sr-only peer"
                  />
                  <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-4 text-center transition-all peer-checked:border-purple-500 peer-checked:bg-purple-500/10 hover:border-slate-600">
                    <div className="font-semibold text-white mb-1">Medium</div>
                    <div className="text-xs text-slate-400">Balanced</div>
                    <div className="text-xs text-slate-500 mt-1">10 columns, 30s interval</div>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="quality"
                    value="high"
                    checked={quality === 'high'}
                    onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
                    className="sr-only peer"
                  />
                  <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-4 text-center transition-all peer-checked:border-purple-500 peer-checked:bg-purple-500/10 hover:border-slate-600">
                    <div className="font-semibold text-white mb-1">High</div>
                    <div className="text-xs text-slate-400">More screenshots</div>
                    <div className="text-xs text-slate-500 mt-1">20 columns, 10s interval</div>
                  </div>
                </label>
              </div>
            </div>

            {inputMode === 'file' ? (
              <Upload onFileSelect={handleFileSelect} />
            ) : (
              <form onSubmit={handleUrlSubmit} className="bg-slate-800/50 p-12 rounded-xl border border-slate-700 text-center">
                <div className="max-w-md mx-auto">
                  <input
                    type="url"
                    placeholder="Enter video URL (e.g., http://example.com/video.mp4)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Process URL
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center text-purple-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Current Video</p>
                  <p className="font-medium text-white truncate max-w-md">
                    {file ? file.name : url}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setFile(null); setUrl(''); setProcessedImage(null); }}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Upload New Video
              </button>
            </div>

            {videoMetadata && (
              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Video Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Duration</p>
                    <p className="text-lg font-medium text-white">{formatDuration(videoMetadata.duration)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">File Size</p>
                    <p className="text-lg font-medium text-white">{formatFileSize(videoMetadata.size)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <div className="flex items-end gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4">Output Quality</h3>
                  <div className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="quality-regenerate"
                        value="low"
                        checked={quality === 'low'}
                        onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
                        className="sr-only peer"
                      />
                      <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-3 text-center transition-all peer-checked:border-purple-500 peer-checked:bg-purple-500/10 hover:border-slate-600">
                        <div className="font-semibold text-white text-sm">Low</div>
                        <div className="text-xs text-slate-500 mt-1">5 cols, 60s</div>
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="quality-regenerate"
                        value="medium"
                        checked={quality === 'medium'}
                        onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
                        className="sr-only peer"
                      />
                      <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-3 text-center transition-all peer-checked:border-purple-500 peer-checked:bg-purple-500/10 hover:border-slate-600">
                        <div className="font-semibold text-white text-sm">Medium</div>
                        <div className="text-xs text-slate-500 mt-1">10 cols, 30s</div>
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="quality-regenerate"
                        value="high"
                        checked={quality === 'high'}
                        onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
                        className="sr-only peer"
                      />
                      <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-3 text-center transition-all peer-checked:border-purple-500 peer-checked:bg-purple-500/10 hover:border-slate-600">
                        <div className="font-semibold text-white text-sm">High</div>
                        <div className="text-xs text-slate-500 mt-1">20 cols, 10s</div>
                      </div>
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => processVideo(file, url)}
                  disabled={isUploading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed self-end"
                >
                  {isUploading ? 'Processing...' : 'Regenerate'}
                </button>
              </div>
            </div>

            {isUploading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Processing video... This may take a while.</p>
              </div>
            )}

            {processedImage && !isUploading && (
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 overflow-hidden animate-fade-in">
                <img src={processedImage} alt="Processed Result" className="w-full h-auto rounded" />
                
                {outputStats && (
                  <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Output Statistics</h4>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Total Screenshots</p>
                        <p className="text-lg font-bold text-purple-400">{outputStats.totalFrames}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Grid Size</p>
                        <p className="text-lg font-bold text-purple-400">{outputStats.rows} × {outputStats.columns}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Interval</p>
                        <p className="text-lg font-bold text-purple-400">{outputStats.interval}s</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Output Width</p>
                        <p className="text-lg font-bold text-purple-400">3840px</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <a 
                    href={processedImage} 
                    download={`processed-${file ? file.name : 'video'}.jpg`}
                    className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Download Image
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;
