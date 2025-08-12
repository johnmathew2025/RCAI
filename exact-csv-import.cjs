const fs = require('fs');

// Read the CSV and parse with exact column mapping
const csvData = fs.readFileSync('attached_assets/Comprehensive_RCA_Template1_1753059052472.csv', 'utf8');
const lines = csvData.split('\n').filter(line => line.trim());

// Parse CSV properly handling quotes and commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const headers = parseCSVLine(lines[0]);
console.log('CSV Headers:', headers);
console.log('Expected mapping:');
console.log('  0: Equipment Group ->   equipmentGroup');
console.log('  1: Equipment Type ->    equipmentType'); 
console.log('  2: Subtype / Example -> subtypeExample');
console.log('  3: Component / Failure Mode -> componentFailureMode');
console.log('  4: Equipment Code ->    equipmentCode');
console.log('  5: Failure Code ->      failureCode');
console.log('  6: Risk Ranking ->      riskRanking');
console.log('  7: Required Trend Data / Evidence -> requiredTrendDataEvidence');
console.log('  8: AI or Investigator Questions -> aiOrInvestigatorQuestions');
console.log('  9: Attachments / Evidence Required -> attachmentsEvidenceRequired');
console.log(' 10: Root Cause Logic ->  rootCauseLogic');
console.log(' 11: Blank Column 1 ->    blankColumn1');
console.log(' 12: Blank Column 2 ->    blankColumn2');
console.log(' 13: Blank Column 3 ->    blankColumn3');

// Generate exact SQL with correct column names
let sql = `INSERT INTO evidence_library (
  equipment_group, equipment_type, subtype_example, component_failure_mode, 
  equipment_code, failure_code, risk_ranking, required_trend_data_evidence, 
  ai_or_investigator_questions, attachments_evidence_required, root_cause_logic, 
  blank_column_1, blank_column_2, blank_column_3, updated_by
) VALUES\n`;

const values = [];
for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  if (row.length >= 11 && row[0] && row[1] && row[3]) { // Must have key fields
    const escape = (str) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';
    
    values.push(`(${escape(row[0])}, ${escape(row[1])}, ${escape(row[2])}, ${escape(row[3])}, ${escape(row[4])}, ${escape(row[5])}, ${escape(row[6])}, ${escape(row[7])}, ${escape(row[8])}, ${escape(row[9])}, ${escape(row[10])}, ${escape(row[11] || '')}, ${escape(row[12] || '')}, ${escape(row[13] || '')}, 'csv-import')`);
  }
}

sql += values.join(',\n');
sql += ' ON CONFLICT (equipment_code) DO UPDATE SET\n';
sql += '  equipment_group = EXCLUDED.equipment_group,\n';
sql += '  equipment_type = EXCLUDED.equipment_type,\n';
sql += '  subtype_example = EXCLUDED.subtype_example,\n';
sql += '  component_failure_mode = EXCLUDED.component_failure_mode,\n';
sql += '  failure_code = EXCLUDED.failure_code,\n';
sql += '  risk_ranking = EXCLUDED.risk_ranking,\n';
sql += '  required_trend_data_evidence = EXCLUDED.required_trend_data_evidence,\n';
sql += '  ai_or_investigator_questions = EXCLUDED.ai_or_investigator_questions,\n';
sql += '  attachments_evidence_required = EXCLUDED.attachments_evidence_required,\n';
sql += '  root_cause_logic = EXCLUDED.root_cause_logic,\n';
sql += '  blank_column_1 = EXCLUDED.blank_column_1,\n';
sql += '  blank_column_2 = EXCLUDED.blank_column_2,\n';
sql += '  blank_column_3 = EXCLUDED.blank_column_3,\n';
sql += '  updated_by = EXCLUDED.updated_by,\n';
sql += '  last_updated = NOW();';

fs.writeFileSync('exact-csv-import.sql', sql);
console.log(`Generated SQL for ${values.length} items with exact column mapping`);
console.log('Saved to exact-csv-import.sql');