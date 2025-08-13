#!/usr/bin/env node

/**
 * FK Constraint Testing Script - Universal Protocol Standard Compliant
 * Tests all the requirements from the "Type must belong to a Group" specification
 * NO HARDCODING - All tests use dynamic data from API
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { response, data };
}

async function testFKConstraints() {
  console.log('🔍 TESTING FK CONSTRAINTS: Type must belong to a Group');
  console.log('==========================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Creating type without groupId should return 400
  console.log('Test 1: Create equipment type without groupId (should fail with 400)');
  try {
    const { response } = await makeRequest('/api/equipment-types', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Pump' })
    });
    
    if (response.status === 400) {
      console.log('✅ PASS: Correctly rejected type without groupId');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Should have returned 400, got:', response.status);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
    testsFailed++;
  }

  // Test 2: Get equipment groups to use valid groupId
  console.log('\nTest 2: Get equipment groups for valid groupId');
  let validGroupId = null;
  try {
    const { response, data } = await makeRequest('/api/equipment-groups');
    
    if (response.ok && data.length > 0) {
      validGroupId = data[0].id;
      console.log(`✅ PASS: Found ${data.length} groups, using groupId: ${validGroupId}`);
      testsPassed++;
    } else {
      console.log('❌ FAIL: No equipment groups found - cannot test with valid groupId');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Failed to fetch equipment groups:', error.message);
    testsFailed++;
  }

  // Test 3: Creating type with valid groupId should succeed
  if (validGroupId) {
    console.log('\nTest 3: Create equipment type with valid groupId (should succeed with 201)');
    try {
      const { response, data } = await makeRequest('/api/equipment-types', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'FK Test Pump',
          equipmentGroupId: validGroupId
        })
      });
      
      if (response.status === 201 && data.id) {
        console.log('✅ PASS: Successfully created type with valid groupId, ID:', data.id);
        console.log('   Group assigned:', data.groupName || 'N/A');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Should have returned 201, got:', response.status);
        testsFailed++;
      }
    } catch (error) {
      console.log('❌ FAIL: Request failed:', error.message);
      testsFailed++;
    }
  }

  // Test 4: Creating type with invalid groupId should fail
  console.log('\nTest 4: Create equipment type with invalid groupId (should fail with 400)');
  try {
    const { response } = await makeRequest('/api/equipment-types', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Invalid Group Test',
        equipmentGroupId: 99999 // Non-existent ID
      })
    });
    
    if (response.status === 400) {
      console.log('✅ PASS: Correctly rejected type with invalid groupId');
      testsPassed++;
    } else {
      console.log('❌ FAIL: Should have returned 400, got:', response.status);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
    testsFailed++;
  }

  // Test 5: Check database integrity - no NULL group_ids should exist
  console.log('\nTest 5: Verify database integrity - no orphaned types');
  try {
    const { response, data } = await makeRequest('/api/equipment-types');
    
    if (response.ok) {
      const orphanedTypes = data.filter(type => !type.equipmentGroupId);
      
      if (orphanedTypes.length === 0) {
        console.log('✅ PASS: No orphaned equipment types found in database');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Found', orphanedTypes.length, 'orphaned equipment types');
        orphanedTypes.forEach(type => {
          console.log(`   - ID: ${type.id}, Name: ${type.name}`);
        });
        testsFailed++;
      }
    } else {
      console.log('❌ FAIL: Could not fetch equipment types for integrity check');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Database integrity check failed:', error.message);
    testsFailed++;
  }

  // Test 6: Enhanced API endpoint test
  console.log('\nTest 6: Test enhanced types endpoint with hierarchy');
  try {
    const { response, data } = await makeRequest('/api/taxonomy/types-enhanced');
    
    if (response.ok) {
      const unlinkedTypes = data.filter(type => type.status === 'unlinked');
      
      if (unlinkedTypes.length === 0) {
        console.log('✅ PASS: No unlinked types in enhanced endpoint');
        console.log(`   Total types with groups: ${data.length}`);
        testsPassed++;
      } else {
        console.log('❌ FAIL: Found', unlinkedTypes.length, 'unlinked types in enhanced endpoint');
        testsFailed++;
      }
    } else {
      console.log('❌ FAIL: Enhanced types endpoint not accessible');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Enhanced endpoint test failed:', error.message);
    testsFailed++;
  }

  // Test Results Summary
  console.log('\n==========================================');
  console.log('🧪 FK CONSTRAINT TEST RESULTS');
  console.log('==========================================');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! FK constraints properly enforced.');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED! FK constraint enforcement needs attention.');
    process.exit(1);
  }
}

// Run tests if called directly
testFKConstraints().catch(console.error);