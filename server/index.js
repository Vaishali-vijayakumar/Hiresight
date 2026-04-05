const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: '*', // Allow all for now, can be restricted to Vercel domain later
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
const uploadRouter = require('./routes/upload');
const analyzeRouter = require('./routes/analyze');
const resumesRouter = require('./routes/resumes');

app.use('/api/upload', uploadRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/resumes', resumesRouter);

app.get('/', (req, res) => {
  res.send('HireSight API is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
