import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

interface ProcessOptions {
  inputPath?: string;
  inputUrl?: string;
  outputDir: string;
  filename: string;
  interval?: number; // seconds between screenshots
  columns?: number;
  width?: number; // width of each screenshot
  onProgress?: (progress: number, status: string) => void;
}

export class VideoProcessor {
  // Fixed output resolution (4K 2160p)
  private static readonly OUTPUT_WIDTH = 3840;
  private static readonly OUTPUT_HEIGHT = 2160;

  // Quality presets with grid sizes
  private static readonly QUALITY_GRIDS = {
    high: { columns: 128, rows: 128 },
    medium: { columns: 64, rows: 64 },
    low: { columns: 32, rows: 32 }
  };

  static async processVideo(options: ProcessOptions & { quality?: 'high' | 'medium' | 'low' }): Promise<{ filename: string; metadata: any }> {
    const { inputPath, inputUrl, outputDir, filename, quality = 'medium', onProgress } = options;
    
    const input = inputUrl || inputPath;
    if (!input) {
      throw new Error('No input provided');
    }

    // Get grid configuration for selected quality
    const grid = this.QUALITY_GRIDS[quality];
    const { columns, rows } = grid;
    const totalFrames = columns * rows;

    const outputFilename = `processed-${filename}.jpg`;
    const outputPath = path.join(outputDir, outputFilename);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(input, (err, metadata) => {
        if (err) {
          return reject(err);
        }

        const duration = metadata.format.duration || 0;
        const size = metadata.format.size || 0;
        
        // Calculate interval based on duration and total frames needed
        // Ensure we don't exceed video duration
        const interval = duration / totalFrames;
        
        // Calculate individual frame dimensions to fit the fixed output resolution
        const frameWidth = Math.floor(this.OUTPUT_WIDTH / columns);
        const frameHeight = Math.floor(this.OUTPUT_HEIGHT / rows);
        
        console.log(`Processing with quality: ${quality}`);
        console.log(`Grid: ${columns}x${rows} = ${totalFrames} frames`);
        console.log(`Interval: ${interval.toFixed(2)}s`);
        console.log(`Frame size: ${frameWidth}x${frameHeight}`);
        console.log(`Output size: ${this.OUTPUT_WIDTH}x${this.OUTPUT_HEIGHT}`);

        // Report initial progress
        if (onProgress) {
          onProgress(0, 'Initializing...');
        }

        // Use fixed interval for progress updates (500ms)
        const progressUpdateInterval = 500; // Update every 500ms
        
        let simulatedProgress = 5;
        let progressTimer: NodeJS.Timeout | null = null;

        ffmpeg(input)
          .outputOptions([
            `-vf fps=1/${interval},scale=${frameWidth}:${frameHeight},tile=${columns}x${rows}`
          ])
          .frames(1)
          .on('start', (commandLine) => {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
            if (onProgress) {
              onProgress(5, 'Processing video...');
            }
            
            // Start simulated progress updates
            progressTimer = setInterval(() => {
              if (simulatedProgress < 95) {
                // Slow down as we approach 95%
                const increment = simulatedProgress < 50 ? 2 : (simulatedProgress < 80 ? 1 : 0.5);
                simulatedProgress = Math.min(95, simulatedProgress + increment);
                
                console.log(`Progress update: ${Math.round(simulatedProgress)}%`);
                
                if (onProgress) {
                  const timeProcessed = (simulatedProgress / 100) * duration;
                  const minutes = Math.floor(timeProcessed / 60);
                  const seconds = Math.floor(timeProcessed % 60);
                  onProgress(
                    Math.round(simulatedProgress), 
                    `Processing: ${minutes}:${seconds.toString().padStart(2, '0')}`
                  );
                }
              }
            }, progressUpdateInterval);
          })
          .on('progress', (progress) => {
            // This rarely fires with tile filter, but use it if available
            if (onProgress && progress.percent) {
              const percent = Math.min(Math.round(progress.percent), 99);
              simulatedProgress = percent;
              onProgress(percent, `Processing: ${progress.timemark || ''}`);
            }
          })
          .on('end', () => {
            if (progressTimer) {
              clearInterval(progressTimer);
            }
            if (onProgress) {
              onProgress(100, 'Complete');
            }
            resolve({
              filename: outputFilename,
              metadata: {
                duration,
                size,
                totalFrames,
                columns,
                rows,
                interval: parseFloat(interval.toFixed(2)),
                quality,
                outputWidth: this.OUTPUT_WIDTH,
                outputHeight: this.OUTPUT_HEIGHT,
                frameWidth,
                frameHeight
              }
            });
          })
          .on('error', (err) => {
            if (progressTimer) {
              clearInterval(progressTimer);
            }
            if (onProgress) {
              onProgress(0, 'Error occurred');
            }
            reject(err);
          })
          .save(outputPath);
      });
    });
  }

  static async getMetadata(input: string): Promise<{ duration: number; size: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(input, (err, metadata) => {
        if (err) return reject(err);
        const duration = metadata.format.duration || 0;
        const size = metadata.format.size || 0;
        resolve({ duration, size });
      });
    });
  }
}
