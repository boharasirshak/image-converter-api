// index.js
const express = require("express");
const multer = require("multer");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const upload = multer({ dest: "uploads/" });
const app = express();

app.post("/convert", upload.single("image"), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `${inputPath}.jpg`;

  execFile("convert", [inputPath, outputPath], (err) => {
    if (err) return res.status(500).send("Conversion failed");

    res.download(outputPath, "converted.jpg", () => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
