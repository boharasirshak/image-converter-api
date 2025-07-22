const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const { fileURLToPath } = require('url');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

const upload = multer({ dest: 'uploads/' });

app.post('/convert', upload.single('image'), (req, res) => {
  const inputPath = req.file.path;
  const outputFileName = `${uuidv4()}.jpg`;
  const outputPath = path.join(__dirname, 'uploads', outputFileName);

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
