# Lookup Tables Alignment Note
**Date**: August 11, 2025  
**Status**: Pre-Implementation Database Structure Analysis  
**Mandatory Approval Required Before Proceeding**

## Database Structure Analysis

### 1. equipment_groups
- **Table Name**: `equipment_groups`
- **Primary Key**: `id` (integer, auto-increment)
- **Display Label Column**: `name` (varchar, NOT NULL)
- **Parent FK Columns**: None (root level)
- **Additional Columns**: `is_active` (boolean), `created_at`, `updated_at` (timestamps)

**Sample Data** (12 total groups):
```
ID | Name                           | Active
1  | Rotating                       | true
2  | Static                         | true
3  | Electrical                     | true
4  | Instrumentation & Automation   | true
5  | Control Valves                 | true
6  | Instrumentation                | true
7  | HVAC & Utilities              | true
8  | Material Handling             | true
9  | Fire & Safety                 | true
10 | Plant Utilities               | true
11 | Utility                       | true
12 | Environmental                 | true
```

### 2. equipment_types
- **Table Name**: `equipment_types`
- **Primary Key**: `id` (integer, auto-increment)
- **Display Label Column**: `name` (varchar, NOT NULL)
- **Parent FK Columns**: `equipment_group_id` (integer, NOT NULL) → `equipment_groups.id`
- **Additional Columns**: `is_active` (boolean), `created_at`, `updated_at` (timestamps)

**Sample Data** (28 total types):
```
ID | Name                    | Group ID | Group Name           | Active
1  | Pumps                  | 1        | Rotating             | true
2  | Compressors            | 1        | Rotating             | true
6  | Heat Exchangers        | 2        | Static               | true
12 | Switchgear             | 3        | Electrical           | true
15 | Transmitters           | 4        | Instrumentation & Automation | true
17 | Control Valves         | 5        | Control Valves       | true
```

### 3. equipment_subtypes  
- **Table Name**: `equipment_subtypes`
- **Primary Key**: `id` (integer, auto-increment)
- **Display Label Column**: `name` (varchar, NOT NULL)
- **Parent FK Columns**: `equipment_type_id` (integer, NOT NULL) → `equipment_types.id`
- **Additional Columns**: `is_active` (boolean), `created_at`, `updated_at` (timestamps)

**Sample Data** (1 total subtype):
```
ID | Name         | Type ID | Type Name | Group Name | Active
1  | CENTRIFUGAL  | 1       | Pumps     | Rotating   | false (deactivated)
```

### 4. risk_rankings
- **Table Name**: `risk_rankings`
- **Primary Key**: `id` (integer, auto-increment)
- **Display Label Column**: `label` (varchar, NOT NULL)
- **Parent FK Columns**: None (independent lookup)
- **Additional Columns**: `is_active` (boolean), `created_at`, `updated_at` (timestamps)

**Sample Data** (4 total rankings):
```
ID | Label    | Active
1  | High     | true
2  | Medium   | true
3  | Low      | true
4  | Critical | true
```

## Data Integrity Analysis

### ✅ Positive Findings
1. **No Duplicate Names**: No case/space duplicate issues found in any table
2. **FK Integrity**: All foreign key relationships are valid (no orphaned records)
3. **Proper Hierarchy**: Types correctly belong to Groups; Subtypes correctly belong to Types
4. **Consistent Structure**: All tables follow same pattern (id, name/label, is_active, timestamps)

### ⚠️ Observations
1. **Limited Subtypes**: Only 1 subtype exists (deactivated), indicating this level may need population
2. **Naming Consistency**: Some potential overlap between groups:
   - "Instrumentation" (Group 6) vs "Instrumentation & Automation" (Group 4)
   - "Utility" (Group 11) vs "Plant Utilities" (Group 10)
3. **Control Valves Duplication**: 
   - Equipment Group 5: "Control Valves"
   - Equipment Type 17: "Control Valves" (under Group 5)

### 🔧 Recommended Actions
1. **Subtype Population**: Consider adding more subtypes for commonly used equipment types
2. **Group Consolidation**: Review if "Instrumentation" groups should be merged
3. **Naming Review**: Clarify distinction between "Utility" and "Plant Utilities"

## Implementation Readiness

### ✅ Ready for Implementation
- Database structure is sound and follows required pattern
- All FK relationships are properly established
- No data corruption or integrity issues detected
- Tables support required operations (CRUD, filtering, hierarchy validation)

### 📋 Implementation Requirements Confirmed
1. **Text-Only Evidence Storage**: Ready to implement with proper FK references
2. **Hierarchy Validation**: Structure supports type→group, subtype→type enforcement
3. **Lookup-Driven APIs**: All 4 tables ready for taxonomy endpoint creation
4. **Import Validation**: Structure supports name→ID resolution with FK validation
5. **Audit Trail**: Timestamp columns exist for tracking changes

---

**APPROVAL STATUS**: ⏳ Awaiting approval to proceed with Evidence Library implementation

**Next Step**: Upon approval, begin implementing text-only Evidence table with FK relationships to these 4 lookup tables.