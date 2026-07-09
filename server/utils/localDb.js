const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const candidatesFile = path.join(dataDir, 'candidates.json');
const rulesFile = path.join(dataDir, 'rules.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure default files exist
if (!fs.existsSync(candidatesFile)) {
  fs.writeFileSync(candidatesFile, JSON.stringify([], null, 2));
}

const defaultRules = [
  { id: "r1", position_pattern: 'Software Engineer', assigned_tl: 'Marcus Aurelius (TL)', assigned_manager: 'Sarah Jenkins (MGR)' },
  { id: "r2", position_pattern: 'Frontend Developer', assigned_tl: 'Lucas Miller (TL)', assigned_manager: 'Sarah Jenkins (MGR)' },
  { id: "r3", position_pattern: 'Backend Developer', assigned_tl: 'Vikram Singh (TL)', assigned_manager: 'David Chen (MGR)' },
  { id: "r4", position_pattern: 'Full Stack Engineer', assigned_tl: 'Marcus Aurelius (TL)', assigned_manager: 'David Chen (MGR)' },
  { id: "r5", position_pattern: 'Data Scientist', assigned_tl: 'Elena Rostova (TL)', assigned_manager: 'Robert Carter (MGR)' },
  { id: "r6", position_pattern: 'Product Manager', assigned_tl: 'Diana Prince (TL)', assigned_manager: 'Sophia Martinez (MGR)' }
];

if (!fs.existsSync(rulesFile)) {
  fs.writeFileSync(rulesFile, JSON.stringify(defaultRules, null, 2));
}

const localDb = {
  getCandidates: () => {
    try {
      const data = fs.readFileSync(candidatesFile, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },
  saveCandidates: (candidates) => {
    fs.writeFileSync(candidatesFile, JSON.stringify(candidates, null, 2));
  },
  getRules: () => {
    try {
      const data = fs.readFileSync(rulesFile, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return defaultRules;
    }
  },
  saveRules: (rules) => {
    fs.writeFileSync(rulesFile, JSON.stringify(rules, null, 2));
  }
};

module.exports = localDb;
