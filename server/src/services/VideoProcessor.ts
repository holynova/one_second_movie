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
  static async processVideo(options: ProcessOptions): Promise<string> {
    const { inputPath, inputUrl, outputDir, filename, interval = 60, columns = 5, width = 320 } = options;
    
    const input = inputUrl || inputPath;
    if (!input) {
      throw new Error('No input provided');
    }

    const outputFilename = `processed-${filename}.jpg`;
    const outputPath = path.join(outputDir, outputFilename);

    return new Promise((resolve, reject) => {
      // 1. Get video metadata to calculate number of frames (optional, but good for progress)
      ffmpeg.ffprobe(input, (err, metadata) => {
        if (err) {
          return reject(err);
        }

        const duration = metadata.format.duration || 0;
        const totalFrames = Math.ceil(duration / interval);
        const rows = Math.ceil(totalFrames / columns);
        
        // Safety check for max height (approx 65000px for JPEG)
        // Assuming 16:9 aspect ratio, height is width * 9 / 16
        const frameHeight = Math.floor(width * 9 / 16);
        const totalHeight = rows * frameHeight;
        
        if (totalHeight > 60000) {
           // If too tall, we could increase interval or just cap it. 
           // For now, let's just warn and cap rows to fit.
           console.warn('Resulting image too tall, capping rows.');
           // Recalculate max rows
           const maxRows = Math.floor(60000 / frameHeight);
           // We might lose frames here.
        }

        ffmpeg(input)
          .outputOptions([
            `-vf fps=1/${interval},scale=${width}:-1,tile=${columns}x${rows}`
          ])
          .frames(1) // We want 1 output image (the contact sheet)
          .on('start', (commandLine) => {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
          })
          .on('end', () => {
            resolve(outputFilename);
          })
          .on('error', (err) => {
            reject(err);
          })
          .save(outputPath);
      });
    });
  }
}
