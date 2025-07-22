import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const app = express();
const port = process.env.PORT || 8080;

// Ensure uploads directory exists
const uploadsDir = path.join(dirname, '/app/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

app.post('/convert', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No image file provided.');
  }

  const inputPath = req.file.path;
  const outputFileName = `${uuidv4()}.jpg`;
  const outputPath = path.join(uploadsDir, outputFileName);

  console.log(`Converting: ${inputPath} -> ${outputPath}`);

  exec(`convert "${inputPath}" "${outputPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Conversion error:', error);
      console.error('stderr:', stderr);
      console.error('stdout:', stdout);
      return res.status(500).send('Image conversion failed.');
    }

    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Clean up temp files
      fs.unlink(inputPath, () => {});
      fs.unlink(outputPath, () => {});
    });
  });
});

app.get('/', (req, res) => {
  res.send('HEIC Image Converter is running.');
});

app.get('/health', (req, res) => {
  exec('convert --version', (error, stdout, stderr) => {
    if (error) {
      console.error('ImageMagick not available:', error);
      return res.status(500).json({
        status: 'error',
        message: 'ImageMagick not available',
        error: error.message
      });
    }
    
    res.json({
      status: 'healthy',
      imagemagick: stdout.trim(),
      uploadsDir: uploadsDir
    });
  });
});

app.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});
