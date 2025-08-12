// Test the elimination engine implementation
const { Pool } = require('pg');

async function testEliminationEngine() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    console.log('🔍 Testing Elimination Engine Logic...\n');

    // Sample test: Pump shaft break scenario
    const equipmentGroup = 'Rotating';
    const equipmentType = 'Pumps'; 
    const equipmentSubtype = 'Centrifugal';
    const symptoms = 'Pump shaft broke during operation, loud noise heard, high vibration before failure';

    console.log(`Test Scenario: ${equipmentGroup} → ${equipmentType} → ${equipmentSubtype}`);
    console.log(`Symptoms: ${symptoms}\n`);

    // Query for all failure modes for this equipment
    const query = `
      SELECT 
        equipment_code,
        component_failure_mode,
        root_cause_logic,
        eliminated_if_these_failures_confirmed,
        why_it_gets_eliminated,
        ai_or_investigator_questions
      FROM evidence_library 
      WHERE equipment_group = $1 
        AND equipment_type = $2 
        AND (subtype = $3 OR subtype IS NULL OR subtype = '')
        AND is_active = true
      ORDER BY equipment_code;
    `;

    const result = await pool.query(query, [equipmentGroup, equipmentType, equipmentSubtype]);
    const failureModes = result.rows;

    console.log(`📋 Found ${failureModes.length} failure modes for analysis:`);
    
    // Simulate elimination logic
    const confirmedFailures = ['shaft break', 'shaft failure', 'mechanical failure'];
    let eliminatedCount = 0;
    let remainingModes = [];

    failureModes.forEach(mode => {
      console.log(`\n🔧 ${mode.equipment_code}: ${mode.component_failure_mode}`);
      
      // Check if this failure mode should be eliminated
      if (mode.eliminated_if_these_failures_confirmed) {
        const eliminationTriggers = mode.eliminated_if_these_failures_confirmed.toLowerCase();
        const shouldEliminate = confirmedFailures.some(failure => 
          eliminationTriggers.includes(failure.toLowerCase())
        );
        
        if (shouldEliminate) {
          console.log(`   ❌ ELIMINATED: ${mode.why_it_gets_eliminated}`);
          eliminatedCount++;
        } else {
          console.log(`   ✅ REMAINS: Active for investigation`);
          console.log(`   💡 Key Question: ${mode.ai_or_investigator_questions}`);
          remainingModes.push(mode);
        }
      } else {
        console.log(`   ✅ REMAINS: No elimination criteria set`);
        console.log(`   💡 Key Question: ${mode.ai_or_investigator_questions}`);
        remainingModes.push(mode);
      }
    });

    // Summary
    console.log(`\n📊 ELIMINATION RESULTS:`);
    console.log(`   • Total failure modes analyzed: ${failureModes.length}`);
    console.log(`   • Failure modes eliminated: ${eliminatedCount}`);
    console.log(`   • Failure modes remaining: ${remainingModes.length}`);
    console.log(`   • Confidence boost: +${Math.round(eliminatedCount * 10)}%`);

    console.log(`\n🎯 TARGETED INVESTIGATION FOCUS:`);
    remainingModes.slice(0, 5).forEach((mode, index) => {
      console.log(`   ${index + 1}. ${mode.component_failure_mode}`);
      console.log(`      → ${mode.ai_or_investigator_questions}`);
    });

    console.log('\n✅ Elimination Engine Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testEliminationEngine();