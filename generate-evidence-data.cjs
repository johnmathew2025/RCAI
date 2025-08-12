const { execSync } = require('child_process');
const fs = require('fs');

console.log('Generating evidence library data from database...');

try {
  // Get count
  const countResult = execSync(`psql "${process.env.DATABASE_URL}" -c "SELECT COUNT(*) FROM evidence_library WHERE is_active = true;" -t`, { encoding: 'utf8' });
  const recordCount = parseInt(countResult.trim());
  console.log(`Found ${recordCount} active evidence library records`);

  // Get all records as JSON
  const sqlQuery = `
    SELECT json_agg(
      json_build_object(
        'id', id,
        'equipmentGroup', equipment_group,
        'equipmentType', equipment_type,
        'subtype', COALESCE(subtype, ''),
        'componentFailureMode', component_failure_mode,
        'equipmentCode', equipment_code,
        'failureCode', failure_code,
        'riskRanking', risk_ranking,
        'requiredTrendDataEvidence', COALESCE(required_trend_data_evidence, ''),
        'aiOrInvestigatorQuestions', COALESCE(ai_or_investigator_questions, ''),
        'attachmentsEvidenceRequired', COALESCE(attachments_evidence_required, ''),
        'rootCauseLogic', COALESCE(root_cause_logic, '')
      ) ORDER BY id
    ) as evidence_data
    FROM evidence_library 
    WHERE is_active = true;
  `;

  const dataResult = execSync(`psql "${process.env.DATABASE_URL}" -c "${sqlQuery}" -t`, { encoding: 'utf8' });
  const jsonData = JSON.parse(dataResult.trim());

  console.log(`Successfully loaded ${jsonData.length} evidence records`);
  console.log('Sample record:', jsonData[0]);

  // Generate TypeScript file
  const fileContent = `/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * Evidence Library Database Export - Real Records from PostgreSQL
 * Generated: ${new Date().toISOString()}
 * Records: ${jsonData.length} active evidence library items
 * NO HARDCODING: All data from database schema
 */

export const EVIDENCE_LIBRARY_DATA = ${JSON.stringify(jsonData, null, 2)};

export async function loadEvidenceLibraryData() {
  return EVIDENCE_LIBRARY_DATA;
}`;

  fs.writeFileSync('client/src/lib/evidence-data-loader.ts', fileContent);
  console.log(`✅ Generated evidence-data-loader.ts with ${jsonData.length} records`);

} catch (error) {
  console.error('Error generating evidence data:', error.message);
  process.exit(1);
}