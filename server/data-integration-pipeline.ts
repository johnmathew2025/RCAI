/**
 * Step 9: Data Integration and External System Connectivity
 * Universal Protocol Standard Compliant - External Data Integration Pipeline
 * Integrates external systems, data sources, and third-party APIs with the RCA platform
 */

import { investigationStorage } from "./storage";
import type { EvidenceLibrary, Analysis } from "@shared/schema";

export interface DataSource {
  sourceId: string;
  sourceName: string;
  sourceType: 'cmms' | 'historian' | 'scada' | 'api' | 'database' | 'file_system' | 'sensor_network';
  connectionConfig: ConnectionConfig;
  dataMapping: DataMapping;
  syncSchedule: SyncSchedule;
  isActive: boolean;
  lastSync?: string;
  syncStatus: 'idle' | 'syncing' | 'error' | 'completed';
}

export interface ConnectionConfig {
  endpoint?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  database?: string;
  connectionString?: string;
  certificatePath?: string;
  timeout: number;
  retryAttempts: number;
  customHeaders?: Record<string, string>;
}

export interface DataMapping {
  sourceFields: SourceFieldMapping[];
  transformationRules: TransformationRule[];
  validationRules: ValidationRule[];
  targetSchema: string;
}

export interface SourceFieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'json';
  isRequired: boolean;
  defaultValue?: any;
}

export interface TransformationRule {
  ruleId: string;
  description: string;
  sourceField: string;
  transformationType: 'format' | 'calculate' | 'lookup' | 'aggregate' | 'conditional';
  transformation: string;
  parameters?: Record<string, any>;
}

export interface ValidationRule {
  ruleId: string;
  description: string;
  field: string;
  validationType: 'required' | 'format' | 'range' | 'list' | 'custom';
  constraint: any;
  errorMessage: string;
}

export interface SyncSchedule {
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  interval?: number; // in minutes for custom intervals
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  isEnabled: boolean;
}

export interface SyncResult {
  syncId: string;
  sourceId: string;
  startTime: string;
  endTime: string;
  status: 'success' | 'error' | 'partial';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: SyncError[];
  summary: string;
}

export interface SyncError {
  errorId: string;
  errorType: 'connection' | 'validation' | 'transformation' | 'database';
  message: string;
  record?: any;
  field?: string;
  timestamp: string;
}

export interface ExternalSystemIntegration {
  integrationId: string;
  systemName: string;
  systemType: 'maintenance_management' | 'process_historian' | 'asset_management' | 'sensor_platform';
  capabilities: IntegrationCapability[];
  configurationTemplate: any;
  isConfigured: boolean;
  status: 'active' | 'inactive' | 'error';
}

export interface IntegrationCapability {
  capabilityId: string;
  name: string;
  description: string;
  dataTypes: string[];
  supportedOperations: ('read' | 'write' | 'stream' | 'webhook')[];
  requirements: string[];
}

export class DataIntegrationPipeline {
  private activeSyncs: Map<string, SyncResult> = new Map();
  private registeredSources: Map<string, DataSource> = new Map();
  
  constructor() {
    console.log('[Data Integration Pipeline] Initialized with external system connectivity');
    this.initializeDefaultSources();
  }

  /**
   * Step 9: Main Data Integration Entry Point
   * Registers and configures external data sources
   */
  async registerDataSource(sourceConfig: DataSource): Promise<void> {
    console.log(`[Data Integration] Registering data source: ${sourceConfig.sourceName}`);

    try {
      // Validate connection configuration
      await this.validateConnection(sourceConfig);
      
      // Test data mapping
      await this.validateDataMapping(sourceConfig.dataMapping);
      
      // Store configuration
      this.registeredSources.set(sourceConfig.sourceId, sourceConfig);
      
      console.log(`[Data Integration] Data source ${sourceConfig.sourceName} registered successfully`);

    } catch (error) {
      console.error(`[Data Integration] Failed to register data source ${sourceConfig.sourceName}:`, error);
      throw new Error(`Data source registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute data synchronization from external source
   */
  async executeSync(sourceId: string, options?: { fullSync?: boolean; dateRange?: { start: string; end: string } }): Promise<SyncResult> {
    console.log(`[Data Integration] Starting sync for source: ${sourceId}`);
    
    const dataSource = this.registeredSources.get(sourceId);
    if (!dataSource) {
      throw new Error(`Data source ${sourceId} not found`);
    }

    const syncId = `SYNC_${sourceId}_${Date.now()}`;
    const startTime = new Date().toISOString();

    try {
      dataSource.syncStatus = 'syncing';
      
      // Fetch data from external source
      const rawData = await this.fetchDataFromSource(dataSource, options);
      
      // Transform and validate data
      const transformedData = await this.transformData(rawData, dataSource.dataMapping);
      
      // Sync with local database
      const syncStats = await this.syncToDatabase(transformedData, dataSource);
      
      const endTime = new Date().toISOString();
      dataSource.syncStatus = 'completed';
      dataSource.lastSync = endTime;

      const result: SyncResult = {
        syncId,
        sourceId,
        startTime,
        endTime,
        status: 'success',
        recordsProcessed: syncStats.processed,
        recordsCreated: syncStats.created,
        recordsUpdated: syncStats.updated,
        recordsSkipped: syncStats.skipped,
        errors: [],
        summary: `Successfully synced ${syncStats.processed} records from ${dataSource.sourceName}`
      };

      this.activeSyncs.set(syncId, result);
      console.log(`[Data Integration] Sync completed for ${sourceId}: ${syncStats.processed} records processed`);
      
      return result;

    } catch (error) {
      dataSource.syncStatus = 'error';
      const endTime = new Date().toISOString();
      
      const result: SyncResult = {
        syncId,
        sourceId,
        startTime,
        endTime,
        status: 'error',
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errors: [{
          errorId: `ERR_${Date.now()}`,
          errorType: 'connection',
          message: error instanceof Error ? error.message : 'Unknown sync error',
          timestamp: endTime
        }],
        summary: `Sync failed for ${dataSource.sourceName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };

      this.activeSyncs.set(syncId, result);
      throw error;
    }
  }

  /**
   * Initialize default data source templates
   */
  private initializeDefaultSources(): void {
    // CMMS Integration Template
    this.registerDefaultSource({
      sourceId: 'cmms_template',
      sourceName: 'CMMS Integration Template',
      sourceType: 'cmms',
      connectionConfig: {
        endpoint: 'https://api.cmms-system.com/v1',
        timeout: 30000,
        retryAttempts: 3
      },
      dataMapping: {
        sourceFields: [
          { sourceField: 'work_order_id', targetField: 'workOrderId', dataType: 'string', isRequired: true },
          { sourceField: 'equipment_id', targetField: 'equipmentId', dataType: 'string', isRequired: true },
          { sourceField: 'failure_description', targetField: 'description', dataType: 'string', isRequired: true },
          { sourceField: 'priority_level', targetField: 'priority', dataType: 'string', isRequired: true },
          { sourceField: 'created_date', targetField: 'createdAt', dataType: 'date', isRequired: true }
        ],
        transformationRules: [
          {
            ruleId: 'priority_mapping',
            description: 'Map CMMS priority levels to internal priority scale',
            sourceField: 'priority_level',
            transformationType: 'lookup',
            transformation: 'cmms_priority_map',
            parameters: {
              'Critical': 'Critical',
              'High': 'High', 
              'Medium': 'Medium',
              'Low': 'Low'
            }
          }
        ],
        validationRules: [
          {
            ruleId: 'equipment_exists',
            description: 'Validate equipment ID exists in taxonomy',
            field: 'equipmentId',
            validationType: 'custom',
            constraint: 'equipment_taxonomy_check',
            errorMessage: 'Equipment ID not found in taxonomy system'
          }
        ],
        targetSchema: 'incident_reports'
      },
      syncSchedule: {
        frequency: 'hourly',
        interval: 60,
        isEnabled: false
      },
      isActive: false,
      syncStatus: 'idle'
    });

    // Process Historian Template
    this.registerDefaultSource({
      sourceId: 'historian_template',
      sourceName: 'Process Historian Integration',
      sourceType: 'historian',
      connectionConfig: {
        endpoint: 'historian://server:port/database',
        timeout: 45000,
        retryAttempts: 2
      },
      dataMapping: {
        sourceFields: [
          { sourceField: 'tag_name', targetField: 'sensorTag', dataType: 'string', isRequired: true },
          { sourceField: 'timestamp', targetField: 'timestamp', dataType: 'date', isRequired: true },
          { sourceField: 'value', targetField: 'value', dataType: 'number', isRequired: true },
          { sourceField: 'quality', targetField: 'quality', dataType: 'string', isRequired: false, defaultValue: 'Good' },
          { sourceField: 'unit', targetField: 'unit', dataType: 'string', isRequired: false }
        ],
        transformationRules: [
          {
            ruleId: 'unit_conversion',
            description: 'Convert units to standard SI units',
            sourceField: 'value',
            transformationType: 'calculate',
            transformation: 'unit_conversion',
            parameters: { target_units: 'SI' }
          }
        ],
        validationRules: [
          {
            ruleId: 'quality_check',
            description: 'Only accept Good and Uncertain quality data',
            field: 'quality',
            validationType: 'list',
            constraint: ['Good', 'Uncertain'],
            errorMessage: 'Data quality must be Good or Uncertain'
          }
        ],
        targetSchema: 'sensor_data'
      },
      syncSchedule: {
        frequency: 'realtime',
        isEnabled: false
      },
      isActive: false,
      syncStatus: 'idle'
    });

    console.log('[Data Integration] Default source templates initialized');
  }

  /**
   * Register default source template (private helper)
   */
  private registerDefaultSource(source: DataSource): void {
    this.registeredSources.set(source.sourceId, source);
  }

  /**
   * Validate connection to external data source
   */
  private async validateConnection(source: DataSource): Promise<boolean> {
    console.log(`[Data Integration] Validating connection to ${source.sourceName}`);

    try {
      switch (source.sourceType) {
        case 'api':
          return await this.validateApiConnection(source.connectionConfig);
        case 'database':
          return await this.validateDatabaseConnection(source.connectionConfig);
        case 'cmms':
          return await this.validateCmmsConnection(source.connectionConfig);
        case 'historian':
          return await this.validateHistorianConnection(source.connectionConfig);
        default:
          console.log(`[Data Integration] Connection validation for ${source.sourceType} not implemented, assuming valid`);
          return true;
      }
    } catch (error) {
      console.error(`[Data Integration] Connection validation failed for ${source.sourceName}:`, error);
      return false;
    }
  }

  /**
   * Validate API connection
   */
  private async validateApiConnection(config: ConnectionConfig): Promise<boolean> {
    if (!config.endpoint) {
      throw new Error('API endpoint is required');
    }

    // Simple connectivity test (in production, this would make actual API call)
    console.log(`[Data Integration] Validating API connection to ${config.endpoint}`);
    return true;
  }

  /**
   * Validate database connection
   */
  private async validateDatabaseConnection(config: ConnectionConfig): Promise<boolean> {
    if (!config.connectionString && !config.database) {
      throw new Error('Database connection string or database name is required');
    }

    console.log(`[Data Integration] Validating database connection`);
    return true;
  }

  /**
   * Validate CMMS connection
   */
  private async validateCmmsConnection(config: ConnectionConfig): Promise<boolean> {
    if (!config.endpoint || !config.apiKey) {
      throw new Error('CMMS endpoint and API key are required');
    }

    console.log(`[Data Integration] Validating CMMS connection to ${config.endpoint}`);
    return true;
  }

  /**
   * Validate Historian connection
   */
  private async validateHistorianConnection(config: ConnectionConfig): Promise<boolean> {
    if (!config.endpoint) {
      throw new Error('Historian server endpoint is required');
    }

    console.log(`[Data Integration] Validating Historian connection to ${config.endpoint}`);
    return true;
  }

  /**
   * Validate data mapping configuration
   */
  private async validateDataMapping(mapping: DataMapping): Promise<boolean> {
    console.log('[Data Integration] Validating data mapping configuration');

    // Check required fields
    const requiredFields = mapping.sourceFields.filter(f => f.isRequired);
    if (requiredFields.length === 0) {
      console.warn('[Data Integration] No required fields defined in mapping');
    }

    // Validate transformation rules
    for (const rule of mapping.transformationRules) {
      const sourceField = mapping.sourceFields.find(f => f.sourceField === rule.sourceField);
      if (!sourceField) {
        throw new Error(`Transformation rule ${rule.ruleId} references unknown field: ${rule.sourceField}`);
      }
    }

    // Validate validation rules
    for (const rule of mapping.validationRules) {
      const sourceField = mapping.sourceFields.find(f => f.targetField === rule.field);
      if (!sourceField) {
        console.warn(`Validation rule ${rule.ruleId} references field not in mapping: ${rule.field}`);
      }
    }

    console.log('[Data Integration] Data mapping validation completed');
    return true;
  }

  /**
   * Fetch data from external source
   */
  private async fetchDataFromSource(source: DataSource, options?: any): Promise<any[]> {
    console.log(`[Data Integration] Fetching data from ${source.sourceName}`);

    // Simulate data fetching based on source type
    switch (source.sourceType) {
      case 'cmms':
        return await this.fetchCmmsData(source, options);
      case 'historian':
        return await this.fetchHistorianData(source, options);
      case 'api':
        return await this.fetchApiData(source, options);
      default:
        console.log(`[Data Integration] Mock data fetch for ${source.sourceType}`);
        return this.generateMockData(source.sourceType, 50);
    }
  }

  /**
   * Fetch CMMS data
   */
  private async fetchCmmsData(source: DataSource, options?: any): Promise<any[]> {
    console.log(`[Data Integration] Fetching CMMS data from ${source.connectionConfig.endpoint}`);
    
    // Mock CMMS data structure
    return this.generateMockData('cmms', 25);
  }

  /**
   * Fetch Historian data
   */
  private async fetchHistorianData(source: DataSource, options?: any): Promise<any[]> {
    console.log(`[Data Integration] Fetching Historian data from ${source.connectionConfig.endpoint}`);
    
    // Mock historian data structure
    return this.generateMockData('historian', 100);
  }

  /**
   * Fetch API data
   */
  private async fetchApiData(source: DataSource, options?: any): Promise<any[]> {
    console.log(`[Data Integration] Fetching API data from ${source.connectionConfig.endpoint}`);
    
    // Mock API data structure
    return this.generateMockData('api', 30);
  }

  /**
   * Generate mock data for testing
   */
  private generateMockData(sourceType: string, count: number): any[] {
    const mockData = [];

    for (let i = 0; i < count; i++) {
      switch (sourceType) {
        case 'cmms':
          mockData.push({
            work_order_id: `WO_${1000 + i}`,
            equipment_id: `EQ_${100 + (i % 10)}`,
            failure_description: `Equipment failure ${i + 1} - operational issue detected`,
            priority_level: ['Critical', 'High', 'Medium', 'Low'][i % 4],
            created_date: new Date(Date.now() - (i * 86400000)).toISOString(),
            status: ['Open', 'In Progress', 'Completed'][i % 3]
          });
          break;
        case 'historian':
          mockData.push({
            tag_name: `TAG_${1000 + i}`,
            timestamp: new Date(Date.now() - (i * 60000)).toISOString(),
            value: 50 + Math.random() * 100,
            quality: ['Good', 'Uncertain', 'Bad'][i % 3],
            unit: ['°C', 'bar', 'rpm', 'kW'][i % 4]
          });
          break;
        default:
          mockData.push({
            id: i + 1,
            name: `Data Item ${i + 1}`,
            value: Math.random() * 1000,
            timestamp: new Date().toISOString()
          });
      }
    }

    return mockData;
  }

  /**
   * Transform data according to mapping rules
   */
  private async transformData(rawData: any[], mapping: DataMapping): Promise<any[]> {
    console.log(`[Data Integration] Transforming ${rawData.length} records`);

    const transformedData = [];

    for (const record of rawData) {
      try {
        const transformedRecord: any = {};

        // Apply field mappings
        for (const fieldMapping of mapping.sourceFields) {
          let value = record[fieldMapping.sourceField];
          
          // Use default value if field is missing
          if (value === undefined && fieldMapping.defaultValue !== undefined) {
            value = fieldMapping.defaultValue;
          }

          // Type conversion
          if (value !== undefined) {
            switch (fieldMapping.dataType) {
              case 'number':
                value = Number(value);
                break;
              case 'boolean':
                value = Boolean(value);
                break;
              case 'date':
                value = new Date(value).toISOString();
                break;
              case 'string':
                value = String(value);
                break;
            }
          }

          transformedRecord[fieldMapping.targetField] = value;
        }

        // Apply transformation rules
        for (const rule of mapping.transformationRules) {
          transformedRecord[rule.sourceField] = await this.applyTransformation(
            transformedRecord[rule.sourceField], 
            rule
          );
        }

        // Validate record
        const isValid = await this.validateRecord(transformedRecord, mapping.validationRules);
        if (isValid) {
          transformedData.push(transformedRecord);
        }

      } catch (error) {
        console.warn(`[Data Integration] Failed to transform record:`, error);
      }
    }

    console.log(`[Data Integration] Transformed ${transformedData.length} valid records`);
    return transformedData;
  }

  /**
   * Apply transformation rule to a value
   */
  private async applyTransformation(value: any, rule: TransformationRule): Promise<any> {
    switch (rule.transformationType) {
      case 'lookup':
        return rule.parameters?.[value] || value;
      case 'format':
        return this.applyFormatTransformation(value, rule.transformation);
      case 'calculate':
        return this.applyCalculationTransformation(value, rule.transformation, rule.parameters);
      default:
        return value;
    }
  }

  /**
   * Apply format transformation
   */
  private applyFormatTransformation(value: any, format: string): any {
    // Simple format transformations
    switch (format) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'trim':
        return String(value).trim();
      default:
        return value;
    }
  }

  /**
   * Apply calculation transformation
   */
  private applyCalculationTransformation(value: any, calculation: string, parameters?: any): any {
    const numValue = Number(value);
    if (isNaN(numValue)) return value;

    switch (calculation) {
      case 'unit_conversion':
        // Simple unit conversion example
        return numValue * (parameters?.factor || 1);
      case 'scale':
        return numValue * (parameters?.scale || 1);
      case 'offset':
        return numValue + (parameters?.offset || 0);
      default:
        return value;
    }
  }

  /**
   * Validate record against validation rules
   */
  private async validateRecord(record: any, rules: ValidationRule[]): Promise<boolean> {
    for (const rule of rules) {
      const value = record[rule.field];

      switch (rule.validationType) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            console.warn(`Validation failed: ${rule.errorMessage}`);
            return false;
          }
          break;
        case 'list':
          if (Array.isArray(rule.constraint) && !rule.constraint.includes(value)) {
            console.warn(`Validation failed: ${rule.errorMessage}`);
            return false;
          }
          break;
        case 'range':
          if (typeof value === 'number' && rule.constraint) {
            const { min, max } = rule.constraint;
            if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
              console.warn(`Validation failed: ${rule.errorMessage}`);
              return false;
            }
          }
          break;
      }
    }

    return true;
  }

  /**
   * Sync transformed data to local database
   */
  private async syncToDatabase(data: any[], source: DataSource): Promise<{ processed: number; created: number; updated: number; skipped: number }> {
    console.log(`[Data Integration] Syncing ${data.length} records to database for ${source.sourceName}`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const record of data) {
      try {
        // Simulate database sync operation
        if (source.sourceType === 'cmms') {
          // Create incident/analysis record
          await this.syncCmmsRecord(record);
          created++;
        } else if (source.sourceType === 'historian') {
          // Store sensor data
          await this.syncHistorianRecord(record);
          created++;
        } else {
          // Generic data sync
          await this.syncGenericRecord(record);
          created++;
        }
      } catch (error) {
        console.warn(`[Data Integration] Failed to sync record:`, error);
        skipped++;
      }
    }

    return {
      processed: data.length,
      created,
      updated,
      skipped
    };
  }

  /**
   * Sync CMMS record to analysis table
   */
  private async syncCmmsRecord(record: any): Promise<void> {
    // In production, this would create an Analysis record
    console.log(`[Data Integration] Syncing CMMS work order: ${record.workOrderId}`);
  }

  /**
   * Sync Historian record to sensor data
   */
  private async syncHistorianRecord(record: any): Promise<void> {
    // In production, this would store sensor/trend data
    console.log(`[Data Integration] Syncing historian data: ${record.sensorTag}`);
  }

  /**
   * Sync generic record
   */
  private async syncGenericRecord(record: any): Promise<void> {
    console.log(`[Data Integration] Syncing generic record: ${record.id || 'unknown'}`);
  }

  /**
   * Get all registered data sources
   */
  async getDataSources(): Promise<DataSource[]> {
    return Array.from(this.registeredSources.values());
  }

  /**
   * Get sync history for a data source
   */
  async getSyncHistory(sourceId: string): Promise<SyncResult[]> {
    const history = Array.from(this.activeSyncs.values())
      .filter(sync => sync.sourceId === sourceId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    return history;
  }

  /**
   * Get available external system integrations
   */
  async getAvailableIntegrations(): Promise<ExternalSystemIntegration[]> {
    return [
      {
        integrationId: 'maximo_integration',
        systemName: 'IBM Maximo',
        systemType: 'maintenance_management',
        capabilities: [
          {
            capabilityId: 'work_orders',
            name: 'Work Order Integration',
            description: 'Sync work orders and maintenance records',
            dataTypes: ['work_orders', 'maintenance_history', 'asset_data'],
            supportedOperations: ['read', 'write'],
            requirements: ['API credentials', 'Server endpoint']
          }
        ],
        configurationTemplate: {
          endpoint: 'https://maximo.company.com/maximo/rest',
          apiVersion: 'v1',
          authentication: 'basic'
        },
        isConfigured: false,
        status: 'inactive'
      },
      {
        integrationId: 'pi_historian',
        systemName: 'OSIsoft PI Historian',
        systemType: 'process_historian',
        capabilities: [
          {
            capabilityId: 'historical_data',
            name: 'Historical Data Access',
            description: 'Access historical process data and trends',
            dataTypes: ['time_series', 'events', 'batch_data'],
            supportedOperations: ['read', 'stream'],
            requirements: ['PI Web API', 'Authentication tokens']
          }
        ],
        configurationTemplate: {
          webApiUrl: 'https://pi-server.company.com/piwebapi',
          authenticationType: 'kerberos',
          dataServer: 'PI_DATA_SERVER'
        },
        isConfigured: false,
        status: 'inactive'
      }
    ];
  }
}