/*
 Backfill Applicant details from a CSV into existing MongoDB records.

 Usage (PowerShell):
   node scripts/backfill-applicants-from-csv.js --file "C:\\full\\path\\applicants.csv"

 Options:
   --file <path>         CSV file path (required)
   --match email         Match strategy: email | email+position | name+position (default: email)
   --dry                 Dry-run (no DB writes)
   --limit <n>           Only process first n rows

 CSV header examples supported (case-insensitive):
   Email, Name, Position, Department, LinkedIn Profile, Current Position, Current Company,
   Total Experience, Expected Salary, Location, Education, Skills, Work Authorization,
   Willing to Relocate, Available Start Date, Application Date, Key Achievements,
   Cover Letter Summary, Language Skills, Certifications, Industry Experience,
   Management Experience, Technical Proficiency, Soft Skills, References Available,
   Notice Period, Reason for Job Change, Resume
*/

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');

// Mongo
const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/hiresight';
const mongoConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
};

// Simple arg parser
function parseArgs() {
  const args = process.argv.slice(2);
  const out = { match: 'email', dry: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--file' && args[i+1]) { out.file = args[++i]; }
    else if (a === '--match' && args[i+1]) { out.match = args[++i]; }
    else if (a === '--dry') { out.dry = true; }
    else if (a === '--limit' && args[i+1]) { out.limit = parseInt(args[++i], 10); }
  }
  return out;
}

// Field mapping helpers
const pick = (row, keys) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return String(row[k]).trim();
    // try case-insensitive direct matches
    const foundKey = Object.keys(row).find(rk => rk.toLowerCase() === k.toLowerCase());
    if (foundKey && String(row[foundKey]).trim() !== '') return String(row[foundKey]).trim();
  }
  return '';
};

function toBool(val) {
  if (typeof val === 'boolean') return val;
  const s = String(val || '').trim().toLowerCase();
  if (!s) return undefined;
  return ['yes','y','true','1'].includes(s);
}

function toDate(val) {
  if (!val) return undefined;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  // try dd/mm/yyyy
  const m = String(val).match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (m) {
    const dd = parseInt(m[1], 10), mm = parseInt(m[2], 10) - 1, yy = parseInt(m[3], 10);
    const y = yy < 100 ? 2000 + yy : yy;
    const alt = new Date(y, mm, dd);
    if (!isNaN(alt.getTime())) return alt;
  }
  return undefined;
}

function toSkills(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return String(val)
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(Boolean);
}

async function run() {
  const args = parseArgs();
  if (!args.file) {
    console.error('❌ Missing --file <path> argument');
    process.exit(1);
  }
  const filePath = path.resolve(args.file);
  if (!fs.existsSync(filePath)) {
    console.error('❌ CSV file not found:', filePath);
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(mongoUrl, mongoConfig);
  console.log('✅ Connected to MongoDB');

  // Define Applicant model inline to avoid import churn
  const applicantSchema = new mongoose.Schema({}, { strict: false, collection: 'applicants' });
  const Applicant = mongoose.model('Applicant_Backfill', applicantSchema);

  let processed = 0, updated = 0, notFound = 0, skipped = 0, errors = 0;

  function buildUpdate(row) {
    const upd = {};
    const linkedinProfile = pick(row, ['LinkedIn Profile','linkedinProfile','LinkedIn','linkedin']);
    const resumeUrl = pick(row, ['Resume','resume','Resume URL']);

    const currentPosition = pick(row, ['Current Position','currentPosition']);
    const currentCompany = pick(row, ['Current Company','currentCompany']);
    const totalExperience = pick(row, ['Total Experience','totalExperience','Experience']);
    const expectedSalary = pick(row, ['Expected Salary','expectedSalary']);
    const location = pick(row, ['Location','location','City']);
    const qualification = pick(row, ['Education','education','Qualification']);
    const skills = toSkills(pick(row, ['Skills','skills','Technical Skills']));
    const workAuthorization = pick(row, ['Work Authorization','workAuthorization']);
    const willingToRelocate = toBool(pick(row, ['Willing to Relocate','willingToRelocate']));
    const availableStartDate = toDate(pick(row, ['Available Start Date','availableStartDate']));
    const applicationDate = toDate(pick(row, ['Application Date','applicationDate','Applied Date']));
    const keyAchievements = pick(row, ['Key Achievements','keyAchievements']);
    const coverLetterSummary = pick(row, ['Cover Letter Summary','coverLetterSummary']);
    const languageSkills = pick(row, ['Language Skills','languageSkills']);
    const certifications = pick(row, ['Certifications','certifications']);
    const industryExperience = pick(row, ['Industry Experience','industryExperience']);
    const managementExperience = pick(row, ['Management Experience','managementExperience']);
    const technicalProficiency = pick(row, ['Technical Proficiency','technicalProficiency']);
    const softSkills = pick(row, ['Soft Skills','softSkills']);
    const referencesAvailable = toBool(pick(row, ['References Available','referencesAvailable']));
    const noticePeriod = pick(row, ['Notice Period','noticePeriod']);
    const reasonForJobChange = pick(row, ['Reason for Job Change','reasonForJobChange']);

    const mapping = {
      linkedinProfile,
      resumeUrl,
      currentPosition,
      currentCompany,
      totalExperience,
      expectedSalary: expectedSalary ? parseInt(String(expectedSalary).replace(/[^0-9]/g,''),10) : undefined,
      location,
      qualification,
      skills: skills.length ? skills : undefined,
      workAuthorization,
      willingToRelocate,
      availableStartDate,
      applicationDate,
      keyAchievements,
      coverLetterSummary,
      languageSkills,
      certifications,
      industryExperience,
      managementExperience,
      technicalProficiency,
      softSkills,
      referencesAvailable,
      noticePeriod,
      reasonForJobChange,
      lastUpdated: new Date(),
    };

    // Remove undefined so we don't overwrite with empties
    Object.keys(mapping).forEach(k => mapping[k] === undefined || mapping[k] === '' ? delete mapping[k] : null);
    return mapping;
  }

  const matchStrategy = String(args.match || 'email').toLowerCase();

  const stream = fs.createReadStream(filePath).pipe(csv());
  for await (const row of stream) {
    if (args.limit && processed >= args.limit) break;
    processed++;

    try {
      const email = pick(row, ['Email','email']).toLowerCase();
      const name = pick(row, ['Name','Full Name','FullName']);
      const position = pick(row, ['Position','Job Title','position']);
      const department = pick(row, ['Department','department']);

      let query = null;
      if (matchStrategy === 'email+position' && email && position) {
        query = { email, position };
      } else if (matchStrategy === 'name+position' && name && position) {
        query = { name, position };
      } else if (email) {
        query = { email };
      } else if (name && position) {
        query = { name, position };
      }

      if (!query) {
        skipped++;
        console.log(`⚠️  Skipping row ${processed}: insufficient identifiers`);
        continue;
      }

      const update = buildUpdate(row);
      if (Object.keys(update).length === 0) {
        skipped++;
        continue;
      }

      if (args.dry) {
        console.log('DRY-RUN would update', query, 'with', update);
        updated++;
        continue;
      }

      const found = await Applicant.findOneAndUpdate(query, { $set: update }, { new: true });
      if (found) {
        updated++;
        console.log(`✅ Updated: ${found.name || name} (${found.email || email})`);
      } else {
        notFound++;
        console.log(`❌ Not found:`, query);
      }
    } catch (e) {
      errors++;
      console.error('Row error:', e.message);
    }
  }

  console.log('\n📊 Backfill Summary');
  console.log('  Processed:', processed);
  console.log('  Updated  :', updated);
  console.log('  Not found:', notFound);
  console.log('  Skipped  :', skipped);
  console.log('  Errors   :', errors);

  await mongoose.connection.close();
  console.log('\n🔌 MongoDB connection closed');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});