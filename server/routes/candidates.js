const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const localDb = require('../utils/localDb');

// Helper to check if a Supabase error is a "table does not exist" or similar DB issue
function isDbUnavailable(error) {
  if (!error) return false;
  const errMsg = error.message || '';
  return errMsg.includes('does not exist') || errMsg.includes('relation') || error.code === 'PGRST114' || error.code === '42P01';
}

// Helper to auto-assign TL & Manager based on position and rules
async function autoAssign(position) {
  let matchedRule = null;
  const posLower = (position || '').toLowerCase();

  try {
    const { data: rules, error } = await supabase.from('assignment_rules').select('*');
    if (!error && rules) {
      matchedRule = rules.find(r => posLower.includes(r.position_pattern.toLowerCase()));
    }
  } catch (e) {
    // ignore, fall back to local rules below
  }

  if (!matchedRule) {
    const rules = localDb.getRules();
    matchedRule = rules.find(r => posLower.includes(r.position_pattern.toLowerCase()));
  }

  if (matchedRule) {
    return {
      assigned_tl: matchedRule.assigned_tl,
      assigned_manager: matchedRule.assigned_manager
    };
  }

  // Generic fallback if no rule matches
  return {
    assigned_tl: 'HR Screening (TL)',
    assigned_manager: 'HR Manager'
  };
}

// GET all candidates
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (isDbUnavailable(error)) {
        console.log('⚠️ Supabase candidates table not found. Falling back to local JSON database.');
        const candidates = localDb.getCandidates();
        return res.json(candidates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
      throw error;
    }
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching candidates from Supabase:', error);
    // Fallback to local database on error
    const candidates = localDb.getCandidates();
    res.json(candidates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  }
});

// GET single candidate
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (isDbUnavailable(error)) {
        const candidates = localDb.getCandidates();
        const candidate = candidates.find(c => c.id === id);
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
        return res.json(candidate);
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching candidate from Supabase:', error);
    const candidates = localDb.getCandidates();
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate);
  }
});

// POST create single candidate (with auto TL/Manager assignment)
router.post('/', async (req, res) => {
  try {
    const candidateData = req.body;
    
    // Auto assignment logic
    if (!candidateData.assigned_tl || !candidateData.assigned_manager) {
      const assignments = await autoAssign(candidateData.position);
      candidateData.assigned_tl = candidateData.assigned_tl || assignments.assigned_tl;
      candidateData.assigned_manager = candidateData.assigned_manager || assignments.assigned_manager;
    }

    candidateData.status = candidateData.status || 'Applied';
    candidateData.created_at = new Date().toISOString();
    candidateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('candidates')
      .insert(candidateData)
      .select()
      .single();

    if (error) {
      if (isDbUnavailable(error)) {
        console.log('⚠️ Falling back to local storage for candidate creation.');
        const candidates = localDb.getCandidates();
        const newCandidate = {
          id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          ...candidateData
        };
        candidates.push(newCandidate);
        localDb.saveCandidates(candidates);
        return res.status(201).json(newCandidate);
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating candidate:', error);
    // Local fallback
    const candidates = localDb.getCandidates();
    const newCandidate = {
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...req.body,
      status: req.body.status || 'Applied',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Ensure assignments are set
    if (!newCandidate.assigned_tl || !newCandidate.assigned_manager) {
      const rules = localDb.getRules();
      const posLower = (newCandidate.position || '').toLowerCase();
      const matchedRule = rules.find(r => posLower.includes(r.position_pattern.toLowerCase()));
      newCandidate.assigned_tl = newCandidate.assigned_tl || (matchedRule ? matchedRule.assigned_tl : 'HR Screening (TL)');
      newCandidate.assigned_manager = newCandidate.assigned_manager || (matchedRule ? matchedRule.assigned_manager : 'HR Manager');
    }

    candidates.push(newCandidate);
    localDb.saveCandidates(candidates);
    res.status(201).json(newCandidate);
  }
});

// POST bulk upload candidates from CSV
router.post('/bulk', async (req, res) => {
  try {
    const { candidates } = req.body;
    if (!candidates || !Array.isArray(candidates)) {
      return res.status(400).json({ error: 'Candidates array is required' });
    }

    const processedCandidates = [];
    for (const cand of candidates) {
      const assignments = await autoAssign(cand.position);
      processedCandidates.push({
        first_name: cand.first_name || cand.name || 'Unknown',
        last_name: cand.last_name || '',
        email: cand.email || '',
        phone: cand.phone || '',
        position: cand.position || 'Software Engineer',
        experience: cand.experience || 'Not Specified',
        skills: cand.skills || '',
        linkedin_profile: cand.linkedin_profile || '',
        status: cand.status || 'Applied',
        assigned_tl: cand.assigned_tl || assignments.assigned_tl,
        assigned_manager: cand.assigned_manager || assignments.assigned_manager,
        source: cand.source || 'LinkedIn CSV',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert(processedCandidates)
      .select();

    if (error) {
      if (isDbUnavailable(error)) {
        console.log('⚠️ Falling back to local storage for bulk candidate creation.');
        const currentCandidates = localDb.getCandidates();
        const newCandidatesWithIds = processedCandidates.map((c, i) => ({
          id: `c_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
          ...c
        }));
        const updated = [...currentCandidates, ...newCandidatesWithIds];
        localDb.saveCandidates(updated);
        return res.status(201).json({ count: newCandidatesWithIds.length, data: newCandidatesWithIds });
      }
      throw error;
    }
    res.status(201).json({ count: data.length, data });
  } catch (error) {
    console.error('Error bulk uploading candidates:', error);
    // Local fallback
    const { candidates } = req.body;
    const currentCandidates = localDb.getCandidates();
    const rules = localDb.getRules();
    
    const newCandidatesWithIds = (candidates || []).map((cand, i) => {
      const posLower = (cand.position || '').toLowerCase();
      const matchedRule = rules.find(r => posLower.includes(r.position_pattern.toLowerCase()));
      const tl = matchedRule ? matchedRule.assigned_tl : 'HR Screening (TL)';
      const mgr = matchedRule ? matchedRule.assigned_manager : 'HR Manager';

      return {
        id: `c_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
        first_name: cand.first_name || cand.name || 'Unknown',
        last_name: cand.last_name || '',
        email: cand.email || '',
        phone: cand.phone || '',
        position: cand.position || 'Software Engineer',
        experience: cand.experience || 'Not Specified',
        skills: cand.skills || '',
        linkedin_profile: cand.linkedin_profile || '',
        status: cand.status || 'Applied',
        assigned_tl: cand.assigned_tl || tl,
        assigned_manager: cand.assigned_manager || mgr,
        source: cand.source || 'LinkedIn CSV',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    const updated = [...currentCandidates, ...newCandidatesWithIds];
    localDb.saveCandidates(updated);
    res.status(201).json({ count: newCandidatesWithIds.length, data: newCandidatesWithIds });
  }
});

// PATCH update candidate (status, feedback, assignment, etc.)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updateFields = { ...req.body, updated_at: new Date().toISOString() };

  try {
    const { data, error } = await supabase
      .from('candidates')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isDbUnavailable(error)) {
        const candidates = localDb.getCandidates();
        const idx = candidates.findIndex(c => c.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Candidate not found' });
        
        candidates[idx] = { ...candidates[idx], ...updateFields };
        localDb.saveCandidates(candidates);
        return res.json(candidates[idx]);
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error('Error updating candidate:', error);
    // Local fallback
    const candidates = localDb.getCandidates();
    const idx = candidates.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Candidate not found' });
    
    candidates[idx] = { ...candidates[idx], ...updateFields };
    localDb.saveCandidates(candidates);
    res.json(candidates[idx]);
  }
});

// DELETE candidate
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) {
      if (isDbUnavailable(error)) {
        const candidates = localDb.getCandidates();
        const updated = candidates.filter(c => c.id !== id);
        localDb.saveCandidates(updated);
        return res.json({ message: 'Candidate deleted successfully' });
      }
      throw error;
    }
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    // Local fallback
    const candidates = localDb.getCandidates();
    const updated = candidates.filter(c => c.id !== id);
    localDb.saveCandidates(updated);
    res.json({ message: 'Candidate deleted successfully' });
  }
});

// DELETE clear all candidates
router.delete('/', async (req, res) => {
  try {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

    if (error) {
      if (isDbUnavailable(error)) {
        localDb.saveCandidates([]);
        return res.json({ message: 'All candidates cleared successfully' });
      }
      throw error;
    }
    res.json({ message: 'All candidates cleared successfully' });
  } catch (error) {
    console.error('Error clearing candidates:', error);
    localDb.saveCandidates([]);
    res.json({ message: 'All candidates cleared successfully' });
  }
});

module.exports = router;
