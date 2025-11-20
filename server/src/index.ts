import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 3000;

// Progress tracking
interface JobProgress {
  progress: number;
  status: string;
  complete: boolean;
  result?: any;
  error?: string;
}

const jobProgress = new Map<string, JobProgress>();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Routes
app.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const jobId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const quality = req.body.quality || 'medium';

  // Initialize progress
  jobProgress.set(jobId, {
    progress: 0,
    status: 'Starting...',
    complete: false
  });

  // Return jobId immediately
  res.json({ 
    jobId,
    filename: req.file.filename
  });

  // Process video in background
  (async () => {
    try {
      const { VideoProcessor } = await import('./services/VideoProcessor');
      
      const result = await VideoProcessor.processVideo({
        inputPath: req.file!.path,
        outputDir: uploadDir,
        filename: req.file!.filename,
        quality,
        onProgress: (progress: number, status: string) => {
          jobProgress.set(jobId, {
            progress,
            status,
            complete: false
          });
        }
      });

      // Mark as complete
      jobProgress.set(jobId, {
        progress: 100,
        status: 'Complete',
        complete: true,
        result: {
          message: 'File processed successfully',
          filename: req.file!.filename,
          originalPath: `/uploads/${req.file!.filename}`,
          processedPath: `/uploads/${result.filename}`,
          metadata: result.metadata
        }
      });

      // Clean up after 5 minutes
      setTimeout(() => {
        jobProgress.delete(jobId);
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Processing error:', error);
      jobProgress.set(jobId, {
        progress: 0,
        status: 'Error',
        complete: true,
        error: 'Video processing failed'
      });
    }
  })();
});

// Progress endpoint
app.get('/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  const progress = jobProgress.get(jobId);
  
  if (!progress) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(progress);
});
app.post('/process-url', async (req, res) => {
  try {
    const { VideoProcessor } = await import('./services/VideoProcessor');
    const { url, quality } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    const filename = `url-${Date.now()}`;
    const result = await VideoProcessor.processVideo({
      inputUrl: url,
      outputDir: 'public/uploads',
      filename,
      quality: quality || 'medium'
    });

    res.json({
      message: 'URL processed successfully',
      processedPath: `/uploads/${result.filename}`,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Video processing failed' });
  }
});

app.post('/probe', async (req, res) => {
  try {
    const { VideoProcessor } = await import('./services/VideoProcessor');
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }
    const metadata = await VideoProcessor.getMetadata(url);
    res.json(metadata);
  } catch (error) {
    console.error('Probe error:', error);
    res.status(500).json({ error: 'Failed to probe video' });
  }
});

app.post('/probe-file', async (req, res) => {
  try {
    const { VideoProcessor } = await import('./services/VideoProcessor');
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'No filename provided' });
    }
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const metadata = await VideoProcessor.getMetadata(filePath);
    res.json(metadata);
  } catch (error) {
    console.error('Probe error:', error);
    res.status(500).json({ error: 'Failed to probe video' });
  }
});

app.get('/', (req, res) => {
  res.send('One Second Movie Server');
});

// Serve static files
app.use('/uploads', express.static(uploadDir));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
