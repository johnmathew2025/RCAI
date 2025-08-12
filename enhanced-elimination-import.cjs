const fs = require('fs');
const Papa = require('papaparse');  
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function importEliminationLibrary() {
  try {
    console.log('Starting elimination logic import...');
    
    // Read the enhanced CSV file with elimination logic
    const csvData = fs.readFileSync('./attached_assets/RCA_Library_with_Elimination_Logic_1753233094452.csv', 'utf8');
    
    // Parse CSV with proper handling of quoted fields containing commas
    const parseResult = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => value.trim()
    });
    
    const records = parseResult.data;
    
    console.log(`Parsed ${records.length} records from elimination logic CSV`);
    
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const record of records) {
      // Check if this equipment code already exists
      const existingQuery = 'SELECT id FROM evidence_library WHERE equipment_code = $1';
      const existingResult = await pool.query(existingQuery, [record['Equipment Code']]);
      
      if (existingResult.rows.length > 0) {
        // Update existing record with elimination logic fields
        const updateQuery = `
          UPDATE evidence_library SET
            eliminated_if_these_failures_confirmed = $1,
            why_it_gets_eliminated = $2,
            last_updated = NOW()
          WHERE equipment_code = $3
        `;
        
        await pool.query(updateQuery, [
          record['Eliminated If These Failures Confirmed'] || null,
          record['Why It Gets Eliminated'] || null,
          record['Equipment Code']
        ]);
        
        updatedCount++;
        console.log(`Updated elimination logic for ${record['Equipment Code']}`);
      } else {
        // Insert new record with full data including elimination logic
        const insertQuery = `
          INSERT INTO evidence_library (
            equipment_group, equipment_type, subtype, component_failure_mode, equipment_code, failure_code,
            risk_ranking, required_trend_data_evidence, ai_or_investigator_questions, attachments_evidence_required,
            root_cause_logic, eliminated_if_these_failures_confirmed, why_it_gets_eliminated, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
        `;
        
        await pool.query(insertQuery, [
          record['Equipment Group'],
          record['Equipment Type'],
          record['Subtype / Example'],
          record['Component / Failure Mode'],
          record['Equipment Code'],
          record['Failure Code'],
          record['Risk Ranking'],
          record['Required Trend Data / Evidence'],
          record['AI or Investigator Questions'],
          record['Attachments / Evidence Required'],
          record['Root Cause Logic'],
          record['Eliminated If These Failures Confirmed'] || null,
          record['Why It Gets Eliminated'] || null
        ]);
        
        insertedCount++;
        console.log(`Inserted new record: ${record['Equipment Code']}`);
      }
    }
    
    console.log(`\n✅ Elimination logic import completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Records processed: ${records.length}`);
    console.log(`   - New records inserted: ${insertedCount}`);
    console.log(`   - Existing records updated: ${updatedCount}`);
    console.log(`   - Total records with elimination logic: ${insertedCount + updatedCount}`);
    
    // Verify the import
    const verifyQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(eliminated_if_these_failures_confirmed) as records_with_elimination
      FROM evidence_library 
      WHERE is_active = true
    `;
    const verifyResult = await pool.query(verifyQuery);
    const { total_records, records_with_elimination } = verifyResult.rows[0];
    
    console.log(`\n🔍 Verification:`);
    console.log(`   - Total active records: ${total_records}`);
    console.log(`   - Records with elimination logic: ${records_with_elimination}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importEliminationLibrary();