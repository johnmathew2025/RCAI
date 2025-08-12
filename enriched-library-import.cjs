const fs = require('fs');
const { Pool } = require('pg');

// Enhanced CSV parser that handles quoted fields with commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i += 2;
      } else {
        // Start or end of quoted field
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator outside quotes
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());
  return result;
}

async function importEnrichedLibrary() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log("🚀 Starting enriched Evidence Library import...");
    
    // Read and parse CSV file
    const csvContent = fs.readFileSync('./attached_assets/Enriched_RCA_Library_with_Universal_Elimination_1753256778935.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📄 Found ${lines.length} lines in CSV file`);
    
    // Parse header
    const header = parseCSVLine(lines[0]);
    console.log("📋 CSV Headers:", header);
    
    // Parse data rows
    const dataRows = lines.slice(1).map(line => parseCSVLine(line));
    console.log(`📊 Processing ${dataRows.length} data rows`);
    
    let importedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Skip empty rows
      if (!row[0] || row[0].trim() === '') {
        continue;
      }
      
      try {
        // Map CSV columns to database fields
        const [
          equipmentGroup,
          equipmentType,
          subtypeExample,
          componentFailureMode,
          equipmentCode,
          failureCode,
          riskRanking,
          requiredTrendData,
          aiQuestions,
          attachmentsRequired,
          rootCauseLogic,
          primaryRootCause,
          contributingFactor,
          latentCause,
          detectionGap,
          confidenceLevel,
          faultSignaturePattern,
          applicableToOtherEquipment,
          evidenceGapFlag,
          eliminatedIfConfirmed,
          whyEliminated
        ] = row;

        const insertQuery = `
          INSERT INTO evidence_library (
            equipment_group,
            equipment_type,
            subtype,
            component_failure_mode,
            equipment_code,
            failure_code,
            risk_ranking,
            required_trend_data_evidence,
            ai_or_investigator_questions,
            attachments_evidence_required,
            root_cause_logic,
            primary_root_cause,
            contributing_factor,
            latent_cause,
            detection_gap,
            confidence_level,
            fault_signature_pattern,
            applicable_to_other_equipment,
            evidence_gap_flag,
            eliminated_if_these_failures_confirmed,
            why_it_gets_eliminated,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
        `;

        const values = [
          equipmentGroup?.trim() || null,
          equipmentType?.trim() || null,
          subtypeExample?.trim() || null,
          componentFailureMode?.trim() || null,
          equipmentCode?.trim() || null,
          failureCode?.trim() || null,
          riskRanking?.trim() || null,
          requiredTrendData?.trim() || null,
          aiQuestions?.trim() || null,
          attachmentsRequired?.trim() || null,
          rootCauseLogic?.trim() || null,
          primaryRootCause?.trim() || null,
          contributingFactor?.trim() || null,
          latentCause?.trim() || null,
          detectionGap?.trim() || null,
          confidenceLevel?.trim() || null,
          faultSignaturePattern?.trim() || null,
          applicableToOtherEquipment?.trim() || null,
          evidenceGapFlag?.trim() || null,
          eliminatedIfConfirmed?.trim() || null,
          whyEliminated?.trim() || null
        ];

        await pool.query(insertQuery, values);
        importedCount++;
        
        if (importedCount % 10 === 0) {
          console.log(`✅ Imported ${importedCount} records...`);
        }
        
      } catch (error) {
        console.error(`❌ Error importing row ${i + 2}: ${error.message}`);
        console.error(`Row data:`, row.slice(0, 5)); // First 5 columns for debugging
        errorCount++;
      }
    }
    
    // Get final count
    const result = await pool.query('SELECT COUNT(*) as count FROM evidence_library');
    const finalCount = result.rows[0].count;
    
    console.log("\n🎉 ENRICHED EVIDENCE LIBRARY IMPORT COMPLETE!");
    console.log(`✅ Successfully imported: ${importedCount} records`);
    console.log(`❌ Errors encountered: ${errorCount} records`);
    console.log(`📊 Total records in database: ${finalCount}`);
    
    // Verify elimination logic data
    const eliminationResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM evidence_library 
      WHERE eliminated_if_these_failures_confirmed IS NOT NULL 
      AND why_it_gets_eliminated IS NOT NULL
    `);
    
    console.log(`🎯 Records with elimination logic: ${eliminationResult.rows[0].count}`);
    
  } catch (error) {
    console.error("💥 Import failed:", error);
  } finally {
    await pool.end();
  }
}

// Run the import
importEnrichedLibrary().catch(console.error);