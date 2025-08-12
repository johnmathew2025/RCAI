const fs = require('fs');

// Read and parse the comprehensive CSV
const csvData = fs.readFileSync('attached_assets/Comprehensive_RCA_Template1_1753059052472.csv', 'utf8');
const lines = csvData.split('\n').filter(line => line.trim());

// Parse CSV with proper handling of quoted fields
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
console.log('Headers:', headers);

const items = [];
for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  if (values.length >= 11 && values[0] && values[1] && values[3]) { // Must have group, type, and failure mode
    items.push({
      equipmentGroup: values[0],
      equipmentType: values[1], 
      subtype: values[2] || null,
      componentFailureMode: values[3],
      equipmentCode: values[4],
      failureCode: values[5],
      riskRanking: values[6],
      requiredTrendData: values[7],
      aiQuestions: values[8],
      attachmentsRequired: values[9],
      rootCauseLogic: values[10],
      notes: values[11] || null,
    });
  }
}

console.log(`Parsed ${items.length} valid items`);
console.log('Sample items:');
items.slice(0, 3).forEach((item, idx) => {
  console.log(`${idx + 1}:`, item);
});

// Save as JSON for easy import
fs.writeFileSync('evidence-library-import.json', JSON.stringify(items, null, 2));
console.log('Saved to evidence-library-import.json');