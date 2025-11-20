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
}

export class VideoProcessor {
  static async processVideo(options: ProcessOptions & { quality?: 'high' | 'medium' | 'low' }): Promise<{ filename: string; metadata: any }> {
    const { inputPath, inputUrl, outputDir, filename, quality = 'medium' } = options;
    
    const input = inputUrl || inputPath;
    if (!input) {
      throw new Error('No input provided');
    }

    // Configuration based on quality
    // Target width 3840px (4K)
    const width = 3840;
    let columns: number;
    let interval: number;

    // We need duration to calculate interval dynamically if we want a specific density,
    // or we can set fixed intervals/columns. 
    // Let's try to make it "dense" vs "sparse".
    
    // Strategy:
    // High: Many small shots. High density.
    // Medium: Balanced.
    // Low: Fewer large shots.
    
    // However, for a fixed width of 3840px:
    // High: 20 columns -> ~192px width per frame
    // Medium: 10 columns -> ~384px width per frame
    // Low: 5 columns -> ~768px width per frame

    switch (quality) {
      case 'high':
        columns = 20;
        interval = 10; // Capture every 10 seconds (more frames)
        break;
      case 'low':
        columns = 5;
        interval = 60; // Capture every 60 seconds (fewer frames)
        break;
      case 'medium':
      default:
        columns = 10;
        interval = 30; // Capture every 30 seconds
        break;
    }

    const outputFilename = `processed-${filename}.jpg`;
    const outputPath = path.join(outputDir, outputFilename);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(input, (err, metadata) => {
        if (err) {
          return reject(err);
        }

        const duration = metadata.format.duration || 0;
        const size = metadata.format.size || 0;
        
        // Calculate total frames
        const totalFrames = Math.ceil(duration / interval);
        const rows = Math.ceil(totalFrames / columns);
        
        // Calculate frame dimensions
        // 4K width = 3840
        // frameWidth = 3840 / columns
        const frameWidth = Math.floor(width / columns);
        const frameHeight = Math.floor(frameWidth * 9 / 16); // Assuming 16:9
        
        // Total height check
        const totalHeight = rows * frameHeight;
        
        // Cap if too huge (JPEG limit ~65k)
        let finalRows = rows;
        if (totalHeight > 60000) {
           console.warn('Resulting image too tall, capping rows.');
           finalRows = Math.floor(60000 / frameHeight);
        }

        ffmpeg(input)
          .outputOptions([
            `-vf fps=1/${interval},scale=${frameWidth}:-1,tile=${columns}x${finalRows}`
          ])
          .frames(1)
          .on('start', (commandLine) => {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
          })
          .on('end', () => {
            resolve({
              filename: outputFilename,
              metadata: {
                duration,
                size,
                totalFrames,
                columns,
                rows: finalRows,
                interval,
                quality
              }
            });
          })
          .on('error', (err) => {
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
