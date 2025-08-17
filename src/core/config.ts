/**
 * Configuration Management - Zero Hardcoding Policy
 * All application settings loaded and validated from environment variables
 */

import { z } from 'zod';

// Configuration schema with development-friendly defaults
const configSchema = z.object({
  // Server Configuration
  PORT: z.coerce.number().min(1000).max(65535).default(5000),
  APP_BASE_URL: z.string().default('http://localhost:5000'),
  
  // Database
  DATABASE_URL: z.string().min(1),
  
  // Authentication & Security
  JWT_SECRET: z.string().default('dev-secret-change-in-production-32-chars-long'),
  
  // RBAC Roles (comma-separated)
  ROLES: z.string().default('Reporter,Analyst,Approver,Admin'),
  
  // SLA Configuration
  SLA_PROFILE_STANDARD_HOURS: z.coerce.number().min(1).max(168).default(24),
  
  // SMTP Configuration (dev defaults)
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().min(1).max(65535).default(587),
  SMTP_USER: z.string().default('dev@localhost'),
  SMTP_PASS: z.string().default('dev-password'),
  MAIL_FROM: z.string().default('incidents@localhost'),
  
  // Redis
  REDIS_URL: z.string().optional(),
  
  // Dashboard Integration
  DASHBOARD_URL: z.string().optional(),
  DASHBOARD_API_KEY: z.string().optional(),
  
  // Evidence Storage Configuration
  DEFAULT_STORAGE_MODE: z.enum(['pointer', 'managed']).default('pointer'),
  ALLOW_POINTER: z.coerce.boolean().default(true),
  ALLOW_MANAGED_COPY: z.coerce.boolean().default(true),
  CACHE_TTL_SECONDS: z.coerce.number().min(0).default(0),
  BYO_STORAGE_PROVIDER: z.enum(['s3', 'gdrive', 'sharepoint', 'none']).default('none'),
  
  // Optional S3 Configuration
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
});

// Parse and validate configuration with development fallbacks
let config: z.infer<typeof configSchema>;

try {
  config = configSchema.parse(process.env);
  console.log('✅ Configuration loaded successfully');
} catch (error) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Configuration validation failed in production:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  } else {
    console.warn('⚠️  Some configuration missing, using development defaults');
    config = configSchema.parse({});
  }
}

// Derived configuration values
export const Config = {
  ...config,
  
  // Parsed roles array
  ROLES_ARRAY: config.ROLES.split(',').map(role => role.trim()),
  
  // SLA in milliseconds for calculations
  SLA_PROFILE_STANDARD_MS: config.SLA_PROFILE_STANDARD_HOURS * 60 * 60 * 1000,
  
  // Storage policy flags
  STORAGE_POLICIES: {
    ALLOW_POINTER: config.ALLOW_POINTER,
    ALLOW_MANAGED_COPY: config.ALLOW_MANAGED_COPY,
    DEFAULT_MODE: config.DEFAULT_STORAGE_MODE,
    BYO_PROVIDER: config.BYO_STORAGE_PROVIDER,
  },
  
  // SMTP configuration object
  SMTP_CONFIG: {
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
    from: config.MAIL_FROM,
  },
};

// Validation helper for required vs optional config
export const validateRequiredConfig = () => {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'APP_BASE_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Export individual config values for convenience
export const {
  PORT,
  APP_BASE_URL,
  DATABASE_URL,
  JWT_SECRET,
  ROLES_ARRAY,
  SLA_PROFILE_STANDARD_HOURS,
  SLA_PROFILE_STANDARD_MS,
  STORAGE_POLICIES,
  SMTP_CONFIG,
} = Config;

export default Config;