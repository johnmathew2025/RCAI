const fs = require('fs');
const Papa = require('papaparse');
const { neonConfig } = require('@neondatabase/serverless');
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

async function importEnhancedLibrary() {
  console.log('Starting enhanced Evidence Library import...');
  
  // Read the enhanced CSV file
  const csvContent = fs.readFileSync('attached_assets/Enhanced_RCA_Library_1753177665976.csv', 'utf8');
  
  // Parse CSV with proper handling
  const results = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transform: (value, field) => {
      // Clean up field values
      return value ? value.trim() : null;
    }
  });

  if (results.errors.length > 0) {
    console.error('CSV parsing errors:', results.errors);
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Clear existing data
    console.log('Clearing existing evidence library...');
    await pool.query('DELETE FROM evidence_library');
    
    // Prepare batch insert with enhanced structure
    const insertPromises = results.data.map(async (row, index) => {
      try {
        const equipmentCode = row['Equipment Code'] || `AUTO-${index + 1}`;
        const failureCode = row['Failure Code'] || `F-${(index + 1).toString().padStart(3, '0')}`;
        
        await pool.query(`
          INSERT INTO evidence_library (
            equipment_group, equipment_type, subtype, component_failure_mode, 
            equipment_code, failure_code, risk_ranking, required_trend_data_evidence,
            ai_or_investigator_questions, attachments_evidence_required, root_cause_logic,
            confidence_level, diagnostic_value, industry_relevance, evidence_priority,
            time_to_collect, collection_cost, analysis_complexity, seasonal_factor,
            related_failure_modes, prerequisite_evidence, followup_actions, industry_benchmark,
            is_active, last_updated, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        `, [
          row['Equipment Group'],
          row['Equipment Type'], 
          row['Subtype / Example'],
          row['Component / Failure Mode'],
          equipmentCode,
          failureCode,
          row['Risk Ranking'],
          row['Required Trend Data / Evidence'],
          row['AI or Investigator Questions'],
          row['Attachments / Evidence Required'],
          row['Root Cause Logic'],
          row['Confidence Level'] || 'Medium', // Default if not specified
          'Important', // Default diagnostic value
          'All Industries', // Default industry relevance
          2, // Default priority
          'Days', // Default collection time
          'Medium', // Default cost
          'Moderate', // Default complexity
          'None', // Default seasonal factor
          row['Primary Root Cause'], // Store in related_failure_modes for now
          row['Contributing Factor'], // Store in prerequisite_evidence for now
          row['Detection Gap'], // Store in followup_actions for now
          row['Fault Signature Pattern'], // Store in industry_benchmark for now
          true,
          new Date(),
          'enhanced-import'
        ]);
        
        if ((index + 1) % 10 === 0) {
          console.log(`Imported ${index + 1} records...`);
        }
      } catch (error) {
        console.error(`Error importing row ${index + 1}:`, error.message);
        console.log('Problematic row:', row);
      }
    });

    await Promise.all(insertPromises);
    
    // Get final count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM evidence_library');
    console.log(`✅ Enhanced import complete! Total records: ${countResult.rows[0].count}`);
    
    // Show sample of enhanced data
    const sampleResult = await pool.query(`
      SELECT equipment_group, equipment_type, component_failure_mode, confidence_level, root_cause_logic
      FROM evidence_library 
      WHERE confidence_level IS NOT NULL
      LIMIT 5
    `);
    
    console.log('\n📊 Sample enhanced records:');
    sampleResult.rows.forEach(row => {
      console.log(`- ${row.equipment_group}/${row.equipment_type}: ${row.component_failure_mode}`);
      console.log(`  Confidence: ${row.confidence_level}`);
      console.log(`  Logic: ${row.root_cause_logic?.substring(0, 80)}...`);
    });
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
importEnhancedLibrary().catch(console.error);