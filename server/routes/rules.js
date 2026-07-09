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

// GET all rules
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assignment_rules')
      .select('*')
      .order('position_pattern', { ascending: true });

    if (error) {
      if (isDbUnavailable(error)) {
        return res.json(localDb.getRules());
      }
      throw error;
    }
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching assignment rules:', error);
    res.json(localDb.getRules());
  }
});

// POST add or update rule
router.post('/', async (req, res) => {
  try {
    const rule = req.body;
    
    // First check if pattern already exists to perform upsert
    let { data: existing, error: fetchError } = await supabase
      .from('assignment_rules')
      .select('*')
      .eq('position_pattern', rule.position_pattern);

    if (fetchError && isDbUnavailable(fetchError)) {
      // Local DB Upsert
      const rules = localDb.getRules();
      const idx = rules.findIndex(r => r.position_pattern.toLowerCase() === rule.position_pattern.toLowerCase());
      const newRule = {
        id: idx >= 0 ? rules[idx].id : `r_${Date.now()}`,
        position_pattern: rule.position_pattern,
        assigned_tl: rule.assigned_tl,
        assigned_manager: rule.assigned_manager
      };
      
      if (idx >= 0) {
        rules[idx] = newRule;
      } else {
        rules.push(newRule);
      }
      localDb.saveRules(rules);
      return res.status(201).json(newRule);
    }

    let result;
    if (existing && existing.length > 0) {
      // Update
      const { data, error } = await supabase
        .from('assignment_rules')
        .update({
          assigned_tl: rule.assigned_tl,
          assigned_manager: rule.assigned_manager
        })
        .eq('id', existing[0].id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('assignment_rules')
        .insert({
          position_pattern: rule.position_pattern,
          assigned_tl: rule.assigned_tl,
          assigned_manager: rule.assigned_manager
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error saving assignment rule:', error);
    
    // Local DB fallback
    const rule = req.body;
    const rules = localDb.getRules();
    const idx = rules.findIndex(r => r.position_pattern.toLowerCase() === rule.position_pattern.toLowerCase());
    const newRule = {
      id: idx >= 0 ? rules[idx].id : `r_${Date.now()}`,
      position_pattern: rule.position_pattern,
      assigned_tl: rule.assigned_tl,
      assigned_manager: rule.assigned_manager
    };
    
    if (idx >= 0) {
      rules[idx] = newRule;
    } else {
      rules.push(newRule);
    }
    localDb.saveRules(rules);
    res.status(201).json(newRule);
  }
});

// DELETE rule
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('assignment_rules')
      .delete()
      .eq('id', id);

    if (error) {
      if (isDbUnavailable(error)) {
        const rules = localDb.getRules();
        const updated = rules.filter(r => r.id !== id);
        localDb.saveRules(updated);
        return res.json({ message: 'Rule deleted successfully' });
      }
      throw error;
    }
    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment rule:', error);
    const rules = localDb.getRules();
    const updated = rules.filter(r => r.id !== id);
    localDb.saveRules(updated);
    res.json({ message: 'Rule deleted successfully' });
  }
});

module.exports = router;
