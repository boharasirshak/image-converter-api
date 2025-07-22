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

const upload = multer({ dest: 'uploads/' });

app.post('/convert', upload.single('image'), (req, res) => {
  const inputPath = req.file.path;
  const outputFileName = `${uuidv4()}.jpg`;
  const outputPath = path.join(dirname, 'uploads', outputFileName);

  exec(`magick "${inputPath}" "${outputPath}"`, (error) => {
    if (error) {
      console.error('Conversion error:', error);
      return res.status(500).send('Image conversion failed.');
    }

    res.sendFile(outputPath, () => {
      // Clean up temp files
      fs.unlink(inputPath, () => {});
      fs.unlink(outputPath, () => {});
    });
  });
});

app.get('/', (req, res) => {
  res.send('HEIC Image Converter is running.');
});

app.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
});
