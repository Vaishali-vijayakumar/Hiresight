const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const supabase = require('../supabaseClient');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, buffer } = req.file;

    // First upload to Supabase Storage
    const fileName = `${Date.now()}_${originalname}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: mimetype,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload to storage', details: uploadError });
    }

    // Extract text for analysis
    let extractedText = '';
    if (mimetype === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const docxData = await mammoth.extractRawText({ buffer: buffer });
      extractedText = docxData.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    // Pass the extracted text and file URL back to the client
    const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/resumes/${fileName}`;

    // 2. Run AI Analysis (Choice of Model)
    // Simulated calling the analysis logic manually to avoid redundant code
    // In a real app we'd extract this to a separate service file.
    const keywordExtractor = require('keyword-extractor');
    const Sentiment = require('sentiment');
    const sentiment = new Sentiment();
    const compromise = require('compromise');

    const keywords = keywordExtractor.extract(extractedText, { language: 'english' });
    const sentimentResult = sentiment.analyze(extractedText);
    const doc = compromise(extractedText);
    const organizations = doc.organizations().out('array');
    const people = doc.people().out('array');
    const places = doc.places().out('array');

    const score = Math.min(100, Math.max(0, keywords.length * 2 + sentimentResult.score));

    // 3. Save metadata AND analysis to database
    const { data: dbData, error: dbError } = await supabase
      .from('resumes')
      .insert({
        file_name: originalname,
        file_url: fileUrl,
        extracted_text: extractedText,
        ai_score: score,
        keywords: keywords.slice(0, 10),
        entities: {
          organizations: [...new Set(organizations)].slice(0, 5),
          people: [...new Set(people)].slice(0, 5)
        },
        sentiment: {
          score: sentimentResult.score,
          comparative: sentimentResult.comparative
        },
        status: 'Pending',
        applicant_id: '00000000-0000-0000-0000-000000000000'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database Error:', dbError);
      return res.status(500).json({ error: 'Failed to save to database', details: dbError });
    }

    res.status(200).json({
      message: 'Upload and text extraction successful',
      id: dbData.id,
      fileUrl,
      fileName,
      extractedText,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Internal server error during upload.' });
  }
});

module.exports = router;
