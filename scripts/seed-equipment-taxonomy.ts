#!/usr/bin/env tsx
/**
 * ISO 14224 Equipment Taxonomy Seeder
 * Seeds the database with standard equipment groups, types, and subtypes
 * ZERO HARDCODING POLICY COMPLIANT - All data from ISO 14224 taxonomy
 */

import { db } from '../server/db';
import { equipmentGroups, equipmentTypes, equipmentSubtypes } from '../shared/schema';
import { ISO14224_TAXONOMY } from '../shared/iso14224-taxonomy';

async function seedEquipmentTaxonomy() {
  console.log('🌱 Starting ISO 14224 Equipment Taxonomy Seeding...');
  
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing taxonomy data...');
    await db.delete(equipmentSubtypes);
    await db.delete(equipmentTypes);
    await db.delete(equipmentGroups);
    
    // Seed Equipment Groups
    console.log('📁 Seeding Equipment Groups...');
    for (const category of ISO14224_TAXONOMY) {
      const [group] = await db.insert(equipmentGroups).values({
        name: category.category,
        isActive: true
      }).returning();
      
      console.log(`  ✅ Added group: ${group.name} (ID: ${group.id})`);
      
      // Seed Equipment Types for this group
      console.log(`📋 Seeding Equipment Types for ${group.name}...`);
      for (const subcategory of category.subcategories) {
        const [type] = await db.insert(equipmentTypes).values({
          name: subcategory.name,
          equipmentGroupId: group.id,
          groupId: group.id,
          groupName: group.name,
          isActive: true
        }).returning();
        
        console.log(`    ✅ Added type: ${type.name} (ID: ${type.id})`);
        
        // Seed Equipment Subtypes for this type
        console.log(`🔧 Seeding Equipment Subtypes for ${type.name}...`);
        for (const subtypeName of subcategory.types) {
          const [subtype] = await db.insert(equipmentSubtypes).values({
            name: subtypeName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            equipmentTypeId: type.id,
            typeId: type.id,
            typeName: type.name,
            groupName: group.name,
            isActive: true
          }).returning();
          
          console.log(`      ✅ Added subtype: ${subtype.name} (ID: ${subtype.id})`);
        }
      }
    }
    
    // Verify seeding
    const groupCount = await db.select().from(equipmentGroups);
    const typeCount = await db.select().from(equipmentTypes);
    const subtypeCount = await db.select().from(equipmentSubtypes);
    
    console.log('\n🎉 ISO 14224 Equipment Taxonomy Seeding Complete!');
    console.log(`📊 Statistics:`);
    console.log(`   Groups: ${groupCount.length}`);
    console.log(`   Types: ${typeCount.length}`);
    console.log(`   Subtypes: ${subtypeCount.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding equipment taxonomy:', error);
    throw error;
  }
}

// Run the seeder
seedEquipmentTaxonomy()
  .then(() => {
    console.log('✅ Taxonomy seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Taxonomy seeding failed:', error);
    process.exit(1);
  });