#!/usr/bin/env tsx
/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE
 * Admin Bootstrap Seed Script - NO HARDCODING
 * 
 * Creates initial admin user and roles from environment variables
 * Usage: SETUP_ADMIN_EMAIL=admin@example.com SETUP_ADMIN_PASSWORD=yourpass npm run seed-admin
 * 
 * SECURITY:
 * - Uses Argon2id password hashing
 * - Creates roles dynamically
 * - Fails safely if admin already exists
 * - Validates environment variables
 */

import { db } from '../server/db.js';
import { users, roles, userRoles } from '@shared/schema';
import { hashPassword, logAuditEvent } from '../server/rbac-middleware.js';
import { eq } from 'drizzle-orm';

// Environment variable validation
const REQUIRED_ENV_VARS = {
  SETUP_ADMIN_EMAIL: process.env.SETUP_ADMIN_EMAIL,
  SETUP_ADMIN_PASSWORD: process.env.SETUP_ADMIN_PASSWORD,
};

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const missing = Object.entries(REQUIRED_ENV_VARS)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Usage: SETUP_ADMIN_EMAIL=admin@example.com SETUP_ADMIN_PASSWORD=yourpass npm run seed-admin');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(REQUIRED_ENV_VARS.SETUP_ADMIN_EMAIL!)) {
    console.error('❌ Invalid email format:', REQUIRED_ENV_VARS.SETUP_ADMIN_EMAIL);
    process.exit(1);
  }

  // Validate password strength
  if (REQUIRED_ENV_VARS.SETUP_ADMIN_PASSWORD!.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
  }
}

/**
 * Check if admin user already exists
 */
async function checkExistingAdmin(): Promise<boolean> {
  try {
    const existingAdmins = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(userRoles, eq(users.id, userRoles.userId))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(roles.name, 'admin'))
      .limit(1);

    return existingAdmins.length > 0;
  } catch (error) {
    console.error('❌ Error checking existing admin:', error);
    return false;
  }
}

/**
 * Create or get role by name
 */
async function upsertRole(name: string, description: string): Promise<number> {
  try {
    // Try to get existing role
    const [existingRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);

    if (existingRole) {
      console.log(`✅ Role '${name}' already exists (ID: ${existingRole.id})`);
      return existingRole.id;
    }

    // Create new role
    const [newRole] = await db
      .insert(roles)
      .values({ name, description })
      .returning({ id: roles.id });

    console.log(`✅ Created role '${name}' (ID: ${newRole.id})`);
    return newRole.id;
  } catch (error) {
    console.error(`❌ Error upserting role '${name}':`, error);
    throw error;
  }
}

/**
 * Create admin user
 */
async function createAdminUser(): Promise<string> {
  const email = REQUIRED_ENV_VARS.SETUP_ADMIN_EMAIL!;
  const password = REQUIRED_ENV_VARS.SETUP_ADMIN_PASSWORD!;

  try {
    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        isActive: true,
        emailVerifiedAt: new Date(), // Pre-verify admin email
        role: 'admin', // Legacy field for backward compatibility
      })
      .returning({ id: users.id });

    console.log(`✅ Created admin user '${email}' (ID: ${newUser.id})`);
    return newUser.id;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

/**
 * Assign role to user
 */
async function assignUserRole(userId: string, roleId: number): Promise<void> {
  try {
    await db
      .insert(userRoles)
      .values({ userId, roleId })
      .onConflictDoNothing();

    console.log(`✅ Assigned role to user (User: ${userId}, Role: ${roleId})`);
  } catch (error) {
    console.error('❌ Error assigning user role:', error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function seedAdmin(): Promise<void> {
  console.log('🚀 Starting admin seed process...\n');

  // Validate environment
  validateEnvironment();

  // Check if admin already exists
  const adminExists = await checkExistingAdmin();
  if (adminExists) {
    console.log('✅ Admin user already exists. Skipping seed process.');
    console.log('💡 To reset, manually delete the admin user from the database first.');
    return;
  }

  try {
    // Create standard roles
    console.log('📝 Creating roles...');
    const adminRoleId = await upsertRole('admin', 'Full system administration access');
    const managerRoleId = await upsertRole('manager', 'Management and oversight capabilities');
    const userRoleId = await upsertRole('user', 'Standard user access');
    const investigatorRoleId = await upsertRole('investigator', 'Investigation and analysis capabilities');

    // Create admin user
    console.log('\n👤 Creating admin user...');
    const adminUserId = await createAdminUser();

    // Assign admin role
    console.log('\n🔐 Assigning admin role...');
    await assignUserRole(adminUserId, adminRoleId);

    // Log audit event
    await logAuditEvent(
      'admin_seeded',
      adminUserId,
      'users',
      adminUserId,
      { email: REQUIRED_ENV_VARS.SETUP_ADMIN_EMAIL }
    );

    console.log('\n✅ Admin seed completed successfully!');
    console.log('📋 Summary:');
    console.log(`   Admin Email: ${REQUIRED_ENV_VARS.SETUP_ADMIN_EMAIL}`);
    console.log(`   User ID: ${adminUserId}`);
    console.log(`   Roles Created: admin, manager, user, investigator`);
    console.log('\n🔒 Security Notes:');
    console.log('   - Password hashed with Argon2id');
    console.log('   - Email pre-verified');
    console.log('   - Audit log entry created');
    console.log('\n🚫 IMPORTANT: Remove SETUP_ADMIN_EMAIL and SETUP_ADMIN_PASSWORD from environment after seeding!');

  } catch (error) {
    console.error('\n❌ Admin seed failed:', error);
    process.exit(1);
  }
}

/**
 * Run seed if called directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin()
    .then(() => {
      console.log('\n🎉 Seed process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seed process failed:', error);
      process.exit(1);
    });
}

export { seedAdmin };