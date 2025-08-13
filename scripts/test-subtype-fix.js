#!/usr/bin/env node

/**
 * SUBTYPE FIX TESTING SCRIPT
 * Validates the complete structured fix implementation
 */

const baseUrl = 'http://localhost:5000';

async function testSubtypeFix() {
  console.log("🔍 TESTING STRUCTURED SUBTYPE FIX");
  console.log("================================");

  try {
    // Test 1: Evidence Library API shows subtype names
    console.log("\n📋 Test 1: Evidence Library with Subtype Names");
    const evidenceResp = await fetch(`${baseUrl}/api/evidence-library`);
    const evidenceData = await evidenceResp.json();
    
    console.log("Evidence records:");
    evidenceData.forEach(item => {
      console.log(`- ${item.equipmentCode}: Group=${item.equipmentGroup}, Type=${item.equipmentType}, Subtype=${item.subtype || 'NULL'} (FK ID: ${item.equipmentSubtypeId || 'NULL'})`);
    });
    
    // Verify PMP-CEN-001 specifically
    const pmpRecord = evidenceData.find(item => item.equipmentCode === 'PMP-CEN-001');
    if (pmpRecord && pmpRecord.subtype === 'Centrifugal' && pmpRecord.equipmentSubtypeId === 4) {
      console.log("✅ PMP-CEN-001 subtype fix SUCCESSFUL - shows 'Centrifugal' via FK ID 4");
    } else {
      console.log("❌ PMP-CEN-001 subtype fix FAILED");
    }

    // Test 2: Enhanced taxonomy endpoints
    console.log("\n🔧 Test 2: Enhanced Taxonomy Endpoints");
    
    const typesResp = await fetch(`${baseUrl}/api/taxonomy/types-enhanced`);
    const typesData = await typesResp.json();
    console.log(`Types with hierarchy: ${typesData.length} found`);
    
    const subtypesResp = await fetch(`${baseUrl}/api/taxonomy/subtypes-enhanced`);
    if (subtypesResp.ok) {
      const subtypesData = await subtypesResp.json();
      console.log(`Subtypes with hierarchy: ${subtypesData.length} found`);
      
      subtypesData.forEach(subtype => {
        console.log(`- ${subtype.name}: Type=${subtype.typeName}, Group=${subtype.groupName}`);
      });
    } else {
      console.log("Subtypes enhanced endpoint not yet available");
    }

    // Test 3: Specific subtype lookup for Pump -> Centrifugal
    console.log("\n🔍 Test 3: Pump Subtypes");
    const pumpSubtypesResp = await fetch(`${baseUrl}/api/taxonomy/subtypes?typeId=30`);
    const pumpSubtypes = await pumpSubtypesResp.json();
    console.log(`Pump subtypes: ${JSON.stringify(pumpSubtypes)}`);

    console.log("\n✅ Subtype fix testing complete");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testSubtypeFix();