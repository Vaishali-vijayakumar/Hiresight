// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { Parser } = require("json2csv");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/hiresight", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("✅ Connected to MongoDB (hiresight DB)");
});

// ✅ Resume Schema
const resumeSchema = new mongoose.Schema({
  fileName: String,
  textContent: String,
  csvContent: String,
  uploadedAt: { type: Date, default: Date.now },
});

const Resume = mongoose.model("resume", resumeSchema);

// ✅ Multer storage setup (temp folder)
const upload = multer({ dest: "uploads/" });

// ✅ Upload Resume API
app.post("/api/uploadResume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let extractedText = "";

    if (req.file.mimetype === "application/pdf") {
      // Parse PDF
      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(pdfBuffer);
      extractedText = pdfData.text;
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Parse DOCX
      const result = await mammoth.extractRawText({ path: req.file.path });
      extractedText = result.value;
    } else {
      return res.status(400).json({ error: "Only PDF and DOCX supported" });
    }

    // Convert text to CSV (line by line)
    const lines = extractedText.split("\n").filter((line) => line.trim() !== "");
    const jsonData = lines.map((line, i) => ({ lineNo: i + 1, text: line }));

    const parser = new Parser({ fields: ["lineNo", "text"] });
    const csvContent = parser.parse(jsonData);

    // Save to MongoDB
    const resume = new Resume({
      fileName: req.file.originalname,
      textContent: extractedText,
      csvContent: csvContent,
    });
    await resume.save();

    // Delete temp file
    fs.unlinkSync(req.file.path);

    res.json({
      message: "Resume uploaded and saved successfully",
      resumeId: resume._id,
    });
  } catch (err) {
    console.error("❌ Error processing resume:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ✅ Get all resumes
app.get("/api/resumes", async (req, res) => {
  const resumes = await Resume.find().sort({ uploadedAt: -1 });
  res.json(resumes);
});

// ✅ Start server
const PORT = 5007;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
