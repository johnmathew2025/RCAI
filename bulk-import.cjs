const fs = require('fs');

// Import the parsed data
const items = JSON.parse(fs.readFileSync('evidence-library-import.json', 'utf8'));

// Generate SQL INSERT statements
let sql = `INSERT INTO evidence_library (
  equipment_group, equipment_type, subtype, component_failure_mode, 
  equipment_code, failure_code, risk_ranking, required_trend_data, 
  ai_questions, attachments_required, root_cause_logic, notes, updated_by
) VALUES\n`;

const values = items.map(item => {
  const escape = (str) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';
  
  return `(${escape(item.equipmentGroup)}, ${escape(item.equipmentType)}, ${escape(item.subtype)}, ${escape(item.componentFailureMode)}, ${escape(item.equipmentCode)}, ${escape(item.failureCode)}, ${escape(item.riskRanking)}, ${escape(item.requiredTrendData)}, ${escape(item.aiQuestions)}, ${escape(item.attachmentsRequired)}, ${escape(item.rootCauseLogic)}, ${escape(item.notes)}, 'admin-bulk')`;
});

sql += values.join(',\n');
sql += ' ON CONFLICT (equipment_code) DO NOTHING;';

fs.writeFileSync('bulk-insert.sql', sql);
console.log(`Generated SQL for ${items.length} items`);
console.log('Saved to bulk-insert.sql');