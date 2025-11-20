import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 3000;

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

  try {
    const { VideoProcessor } = await import('./services/VideoProcessor');
    const interval = req.body.interval ? parseInt(req.body.interval) : 10;
    const columns = req.body.columns ? parseInt(req.body.columns) : 5;

    const processedImage = await VideoProcessor.processVideo({
      inputPath: req.file.path,
      outputDir: uploadDir,
      filename: req.file.filename,
      interval,
      columns
    });

    res.json({ 
      message: 'File processed successfully', 
      filename: req.file.filename,
      originalPath: `/uploads/${req.file.filename}`,
      processedPath: `/uploads/${processedImage}`
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Video processing failed' });
  }
});

app.post('/process-url', async (req, res) => {
  const { url, interval = 10, columns = 5 } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  try {
    const { VideoProcessor } = await import('./services/VideoProcessor');
    // Generate a filename from URL or random
    const filename = `stream-${Date.now()}`;
    
    const processedImage = await VideoProcessor.processVideo({
      inputUrl: url,
      outputDir: uploadDir,
      filename: filename,
      interval: parseInt(interval),
      columns: parseInt(columns)
    });

    res.json({ 
      message: 'URL processed successfully', 
      processedPath: `/uploads/${processedImage}`
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Video processing failed' });
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
