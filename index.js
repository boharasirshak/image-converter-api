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
const uploadsDir = path.join(dirname, 'uploads');
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
  console.log(`Input file exists: ${fs.existsSync(inputPath)}`);
  console.log(`Input file size: ${fs.statSync(inputPath).size} bytes`);
  console.log(`Original filename: ${req.file.originalname}`);
  console.log(`Mimetype: ${req.file.mimetype}`);

  // First try with heif-convert (more reliable for HEIC files)
  exec(`heif-convert "${inputPath}" "${outputPath}"`, (heifError, heifStdout, heifStderr) => {
    if (!heifError) {
      console.log('heif-convert succeeded');
      res.sendFile(outputPath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
        }
        // Clean up temp files
        fs.unlink(inputPath, () => {});
        fs.unlink(outputPath, () => {});
      });
      return;
    }

    console.error('heif-convert failed:', heifError);
    console.error('heif stderr:', heifStderr);
    
    // Try with ImageMagick as fallback with explicit format specification
    console.log('Trying ImageMagick as fallback...');
    exec(`convert "${inputPath}[0]" -quality 90 "${outputPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('ImageMagick conversion also failed:', error);
        console.error('stderr:', stderr);
        console.error('stdout:', stdout);
        
        // Try one more time with identify to check the file
        exec(`identify "${inputPath}"`, (identifyError, identifyStdout, identifyStderr) => {
          console.log('File identification:', identifyStdout);
          console.log('Identify error:', identifyError);
          return res.status(500).send('Image conversion failed. File may be corrupted or in an unsupported format.');
        });
        return;
      }

      console.log('ImageMagick conversion succeeded');
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
