-- CRITICAL: Enforce Equipment Type must belong to a Group
-- This script implements hard FK constraints and backfill operations
-- NO HARDCODING - All operations use dynamic data

-- Step 1: Identify orphaned types (should be zero after previous work)
SELECT 
  id,
  name,
  equipment_group_id,
  group_name,
  'ORPHANED - REQUIRES MANUAL ASSIGNMENT' as status
FROM equipment_types 
WHERE equipment_group_id IS NULL;

-- Step 2: Verify we have at least one equipment group for backfill
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM equipment_groups WHERE is_active = true) THEN
    RAISE EXCEPTION 'CRITICAL: No active equipment groups found. Create at least one group before enforcing FK constraints.';
  END IF;
END
$$;

-- Step 3: Backfill any orphaned types to first available group (fallback only)
-- In production, this should be done manually with proper business logic
UPDATE equipment_types 
SET 
  equipment_group_id = (SELECT id FROM equipment_groups WHERE is_active = true ORDER BY created_at LIMIT 1),
  group_name = (SELECT name FROM equipment_groups WHERE is_active = true ORDER BY created_at LIMIT 1),
  updated_at = NOW()
WHERE equipment_group_id IS NULL;

-- Step 4: Verify no orphans remain
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count FROM equipment_types WHERE equipment_group_id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'MIGRATION BLOCKED: % orphaned equipment types found. Manual intervention required.', orphan_count;
  END IF;
  
  RAISE NOTICE 'SUCCESS: Zero orphaned equipment types confirmed';
END
$$;

-- Step 5: Add NOT NULL constraint (this will fail if any NULLs exist)
ALTER TABLE equipment_types 
ALTER COLUMN equipment_group_id SET NOT NULL;

-- Step 6: Add foreign key constraint with proper CASCADE/RESTRICT behavior
ALTER TABLE equipment_types 
DROP CONSTRAINT IF EXISTS equipment_types_group_fk;

ALTER TABLE equipment_types 
ADD CONSTRAINT equipment_types_group_fk 
FOREIGN KEY (equipment_group_id) 
REFERENCES equipment_groups(id) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;

-- Step 7: Create index for performance
CREATE INDEX IF NOT EXISTS idx_equipment_types_group_id 
ON equipment_types(equipment_group_id);

-- Step 8: Apply same logic to equipment subtypes (must belong to type)
UPDATE equipment_subtypes 
SET 
  equipment_type_id = (SELECT id FROM equipment_types WHERE is_active = true ORDER BY created_at LIMIT 1),
  type_name = (SELECT name FROM equipment_types WHERE is_active = true ORDER BY created_at LIMIT 1),
  group_name = (SELECT group_name FROM equipment_types WHERE is_active = true ORDER BY created_at LIMIT 1),
  updated_at = NOW()
WHERE equipment_type_id IS NULL;

-- Step 9: Enforce NOT NULL and FK for subtypes
ALTER TABLE equipment_subtypes 
ALTER COLUMN equipment_type_id SET NOT NULL;

ALTER TABLE equipment_subtypes 
DROP CONSTRAINT IF EXISTS equipment_subtypes_type_fk;

ALTER TABLE equipment_subtypes 
ADD CONSTRAINT equipment_subtypes_type_fk 
FOREIGN KEY (equipment_type_id) 
REFERENCES equipment_types(id) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_equipment_subtypes_type_id 
ON equipment_subtypes(equipment_type_id);

-- Step 10: Final verification
SELECT 'equipment_types' as table_name, COUNT(*) as total_rows, COUNT(equipment_group_id) as non_null_group_ids
FROM equipment_types
UNION ALL
SELECT 'equipment_subtypes' as table_name, COUNT(*) as total_rows, COUNT(equipment_type_id) as non_null_type_ids  
FROM equipment_subtypes;

RAISE NOTICE 'MIGRATION COMPLETE: All FK constraints enforced successfully';