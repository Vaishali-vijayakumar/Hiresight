const express = require('express');
const router = express.Router();
const compromise = require('compromise');
const keywordExtractor = require('keyword-extractor');
const Sentiment = require('sentiment');

const sentiment = new Sentiment();

const HARD_SKILLS_LIST = ['javascript', 'python', 'java', 'c++', 'react', 'angular', 'node.js', 'sql', 'nosql', 'aws', 'azure', 'docker', 'kubernetes', 'typescript'];

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided for analysis' });
    }

    const lowerText = text.toLowerCase();

    // 1. Keyword Extraction
    const keywords = keywordExtractor.extract(text, {
      language: 'english',
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: true,
    });

    // 2. Named Entity Recognition (NER)
    const doc = compromise(text);
    const people = doc.people().out('array');
    const places = doc.places().out('array');
    const organizations = doc.organizations().out('array');

    // 3. Sentiment & Tone
    const sentimentResult = sentiment.analyze(text);
    let tone = 'Neutral';
    if (sentimentResult.score > 5) tone = 'Confident & Positive';
    else if (sentimentResult.score > 2) tone = 'Professional';
    else if (sentimentResult.score < -2) tone = 'Concerning';

    // 4. Skills Categorization (Simulated Model)
    const hardSkills = keywords.filter(k => HARD_SKILLS_LIST.includes(k.toLowerCase()));
    const otherKeywords = keywords.filter(k => !HARD_SKILLS_LIST.includes(k.toLowerCase()));

    // 5. Scoring logic (Sophisticated)
    // - Based on hard skills found (40%)
    // - Based on keyword density (30%)
    // - Based on entities (20%)
    // - Sentiment/Tone (10%)
    const skillScore = Math.min(40, hardSkills.length * 8);
    const keywordScore = Math.min(30, keywords.length / 2);
    const entityScore = Math.min(20, (organizations.length + places.length) * 2);
    const toneScore = Math.min(10, Math.max(0, sentimentResult.score + 5));

    const finalScore = Math.round(skillScore + keywordScore + entityScore + toneScore);

    // 6. Generate Summary (Simulated Model)
    const summary = `The candidate shows expertise in ${hardSkills.slice(0, 3).join(', ') || 'multiple areas'} and has associations with ${organizations.length} organizations. The overall tone is ${tone}.`;

    const analysis = {
      score: finalScore,
      summary,
      tone,
      keywords: keywords.slice(0, 30),
      skills: {
        hard: [...new Set(hardSkills)],
        others: otherKeywords.slice(0, 10),
      },
      entities: {
        people: [...new Set(people)].slice(0, 5),
        places: [...new Set(places)].slice(0, 5),
        organizations: [...new Set(organizations)].slice(0, 5),
      },
      sentiment: {
        score: sentimentResult.score,
        comparative: sentimentResult.comparative,
        details: sentimentResult.words,
      }
    };

    res.status(200).json(analysis);
  } catch (error) {
    console.error('Analyze Error:', error);
    res.status(500).json({ error: 'Internal server error during analysis.' });
  }
});

module.exports = router;
