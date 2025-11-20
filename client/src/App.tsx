import { useState } from 'react';
import { Layout } from './components/Layout';
import { Upload } from './components/Upload';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [config, setConfig] = useState({
    interval: 10,
    columns: 5
  });

  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState('');

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
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
    
    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('video', selectedFile);
        formData.append('interval', config.interval.toString());
        formData.append('columns', config.columns.toString());

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
            interval: config.interval,
            columns: config.columns
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
        {!file && !processedImage ? (
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
              <h3 className="text-lg font-semibold mb-4">Configuration</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Interval (seconds)</label>
                  <input 
                    type="number" 
                    value={config.interval}
                    onChange={(e) => setConfig({...config, interval: Number(e.target.value)})}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Columns</label>
                  <input 
                    type="number" 
                    value={config.columns}
                    onChange={(e) => setConfig({...config, columns: Number(e.target.value)})}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    min="1"
                    max="20"
                  />
                </div>
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
            <div className="flex items-center justify-between">
              <p className="text-xl">
                {file ? `Selected: ${file.name}` : `URL: ${url}`}
              </p>
              <button 
                onClick={() => { setFile(null); setUrl(''); setProcessedImage(null); }}
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Start Over
              </button>
            </div>
            
            {processedImage && (
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 overflow-hidden">
                <img src={processedImage} alt="Processed Result" className="w-full h-auto rounded" />
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

            {isUploading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Processing video... This may take a while.</p>
              </div>
            )}


          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;
