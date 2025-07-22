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

  // Check file magic numbers to determine actual file type
  const buffer = fs.readFileSync(inputPath);
  const firstBytes = buffer.subarray(0, 12);
  console.log(`First 12 bytes (hex): ${firstBytes.toString('hex')}`);
  console.log(`First 12 bytes (ascii): ${firstBytes.toString('ascii').replace(/[^\x20-\x7E]/g, '.')}`);
  
  // Check for HEIC magic numbers
  const heicMagic1 = buffer.indexOf('ftyp') !== -1 && buffer.indexOf('heic') !== -1;
  const heicMagic2 = buffer.indexOf('ftyp') !== -1 && buffer.indexOf('mif1') !== -1;
  const heicMagic3 = buffer.subarray(4, 8).toString() === 'ftyp';
  
  console.log(`HEIC magic check 1 (ftyp+heic): ${heicMagic1}`);
  console.log(`HEIC magic check 2 (ftyp+mif1): ${heicMagic2}`);
  console.log(`HEIC magic check 3 (ftyp at pos 4): ${heicMagic3}`);

  if (!heicMagic1 && !heicMagic2 && !heicMagic3) {
    return res.status(400).send('File does not appear to be a valid HEIC image. Please upload a .heic or .heif file.');
  }

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

app.post('/test-upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided.' });
  }

  const buffer = fs.readFileSync(req.file.path);
  const firstBytes = buffer.subarray(0, 20);
  
  const fileInfo = {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    firstBytesHex: firstBytes.toString('hex'),
    firstBytesAscii: firstBytes.toString('ascii').replace(/[^\x20-\x7E]/g, '.'),
    hasHeicMagic: buffer.indexOf('ftyp') !== -1 && (buffer.indexOf('heic') !== -1 || buffer.indexOf('mif1') !== -1),
    ftypPosition: buffer.indexOf('ftyp'),
    heicPosition: buffer.indexOf('heic'),
    mif1Position: buffer.indexOf('mif1')
  };

  // Clean up the test file
  fs.unlink(req.file.path, () => {});

  res.json(fileInfo);
});

app.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});
