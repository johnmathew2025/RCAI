// Equipment-specific evidence requirements and prompts library
export interface EvidenceRequirement {
  id: string;
  label: string;
  type: 'trend_data' | 'measurement' | 'visual' | 'log' | 'text';
  required: boolean;
  prompt: string;
  validation?: string;
  units?: string;
  acceptedFormats?: string[];
}

export interface EquipmentEvidenceConfig {
  equipmentType: string;
  requiredTrendData: string[];
  criticalEvidence: EvidenceRequirement[];
  typicalSymptoms: string[];
  failurePatterns: { pattern: string; indicators: string[]; requiredEvidence: string[] }[];
  smartPrompts: { condition: string; prompt: string; action?: string }[];
}

export const EQUIPMENT_EVIDENCE_LIBRARY: Record<string, EquipmentEvidenceConfig> = {
  'Centrifugal Pump': {
    equipmentType: 'Centrifugal Pump',
    requiredTrendData: ['vibration', 'suction_pressure', 'discharge_pressure', 'flow_rate', 'bearing_temperature'],
    criticalEvidence: [
      {
        id: 'vibration_trend',
        label: 'Vibration Trend Data',
        type: 'trend_data',
        required: true,
        prompt: 'Upload vibration trend showing 1X, 2X, 3X running speed components. Look for: bearing frequencies (BPFI, BPFO), imbalance (1X), misalignment (2X), looseness (multiple frequencies).',
        validation: 'Vibration trend is essential for pump diagnosis. Without it, we cannot identify bearing wear, misalignment, or mechanical issues.',
        acceptedFormats: ['csv', 'xlsx', 'png', 'jpg', 'pdf']
      },
      {
        id: 'pressure_trend',
        label: 'Suction & Discharge Pressure Trend',
        type: 'trend_data',
        required: true,
        prompt: 'Provide pressure trends for both suction and discharge. Note any pressure drops, spikes, or oscillations. Include NPSH calculations if available.',
        validation: 'Pressure data reveals cavitation, blockages, or system issues that cause pump failures.',
        acceptedFormats: ['csv', 'xlsx', 'png', 'jpg']
      },
      {
        id: 'seal_inspection',
        label: 'Seal Physical Condition',
        type: 'visual',
        required: true,
        prompt: 'Document seal faces: any scoring (depth in μm), discoloration, carbon dust, spring condition, O-ring swelling. Was seal OEM or aftermarket? Installation torque verified?',
        validation: 'Seal condition directly indicates failure mode and root cause.',
        acceptedFormats: ['jpg', 'png', 'pdf']
      },
      {
        id: 'bearing_condition',
        label: 'Bearing Assessment',
        type: 'measurement',
        required: true,
        prompt: 'Provide bearing temperature readings, vibration at bearing locations, grease condition analysis. Any metallic particles? Discoloration? Running clearances?',
        validation: 'Bearing condition is critical for mechanical failure analysis.',
        units: '°C, mm/s'
      },
      {
        id: 'alignment_data',
        label: 'Alignment Measurements',
        type: 'measurement',
        required: false,
        prompt: 'Last alignment check date and dial indicator readings (angular and parallel). Foundation condition, coupling wear, soft foot measurements.',
        units: 'mm, mils'
      }
    ],
    typicalSymptoms: ['seal leakage', 'high vibration', 'bearing noise', 'temperature rise', 'flow loss', 'pressure drop'],
    failurePatterns: [
      {
        pattern: 'Seal Failure',
        indicators: ['leakage', 'seal wear', 'contamination'],
        requiredEvidence: ['seal_inspection', 'operating_conditions', 'maintenance_history']
      },
      {
        pattern: 'Bearing Failure',
        indicators: ['vibration increase', 'temperature rise', 'noise'],
        requiredEvidence: ['vibration_trend', 'bearing_condition', 'lubrication_analysis']
      },
      {
        pattern: 'Cavitation',
        indicators: ['pressure drop', 'noise', 'erosion'],
        requiredEvidence: ['pressure_trend', 'npsh_calculation', 'impeller_inspection']
      }
    ],
    smartPrompts: [
      {
        condition: 'vibration_high AND seal_leak',
        prompt: 'High vibration with seal leakage suggests misalignment or bearing wear causing shaft deflection. Check alignment data and bearing condition.',
        action: 'request_alignment_data'
      },
      {
        condition: 'pressure_drop AND vibration_normal',
        prompt: 'Pressure drop with normal vibration indicates internal wear or blockage. Check impeller condition and flow path.',
        action: 'request_impeller_inspection'
      },
      {
        condition: 'temperature_rise AND no_vibration',
        prompt: 'Temperature rise without vibration suggests lubrication issues or process conditions. Check bearing lubrication and fluid temperature.',
        action: 'request_lubrication_analysis'
      }
    ]
  },

  'Reciprocating Compressor': {
    equipmentType: 'Reciprocating Compressor',
    requiredTrendData: ['suction_pressure', 'discharge_pressure', 'cylinder_temperature', 'flow_rate', 'vibration'],
    criticalEvidence: [
      {
        id: 'pressure_trends',
        label: 'Suction/Discharge Pressure Trends',
        type: 'trend_data',
        required: true,
        prompt: 'Upload pressure trends for all stages. Look for pressure pulsations, valve leakage indicators, and capacity loss patterns.',
        validation: 'Pressure analysis is essential for compressor valve and capacity issues.',
        acceptedFormats: ['csv', 'xlsx', 'png']
      },
      {
        id: 'temperature_data',
        label: 'Cylinder Temperature Data',
        type: 'trend_data',
        required: true,
        prompt: 'Provide temperature readings for each cylinder head and discharge. Note any temperature spikes or asymmetry between cylinders.',
        validation: 'Temperature data reveals valve leakage, cooling issues, and internal problems.',
        units: '°C'
      },
      {
        id: 'valve_inspection',
        label: 'Valve Condition Assessment',
        type: 'visual',
        required: true,
        prompt: 'Document valve plate condition: cracking, erosion, deposits. Spring condition, seat wear, and closing patterns.',
        validation: 'Valve condition determines compressor performance and failure mode.'
      }
    ],
    typicalSymptoms: ['capacity loss', 'high temperature', 'pressure fluctuation', 'valve noise', 'excessive vibration'],
    failurePatterns: [
      {
        pattern: 'Valve Failure',
        indicators: ['capacity_loss', 'temperature_rise', 'pressure_fluctuation'],
        requiredEvidence: ['pressure_trends', 'temperature_data', 'valve_inspection']
      }
    ],
    smartPrompts: [
      {
        condition: 'temperature_spike AND pressure_drop',
        prompt: 'Temperature spike with pressure drop indicates valve leakage. Check valve condition and seating.',
        action: 'request_valve_inspection'
      }
    ]
  },

  'Electric Motor': {
    equipmentType: 'Electric Motor',
    requiredTrendData: ['current', 'voltage', 'temperature', 'vibration', 'power_factor'],
    criticalEvidence: [
      {
        id: 'current_signature',
        label: 'Motor Current Signature Analysis',
        type: 'trend_data',
        required: true,
        prompt: 'Provide current waveform analysis showing all three phases. Look for current imbalance, harmonics, and load variations.',
        validation: 'Current analysis reveals electrical and mechanical motor problems.',
        acceptedFormats: ['csv', 'xlsx', 'png']
      },
      {
        id: 'insulation_test',
        label: 'Insulation Resistance Test',
        type: 'measurement',
        required: true,
        prompt: 'Document insulation resistance values for each phase to ground and phase-to-phase. Include PI (Polarization Index) if available.',
        validation: 'Insulation condition is critical for electrical failure analysis.',
        units: 'MΩ'
      },
      {
        id: 'temperature_monitoring',
        label: 'Winding Temperature Data',
        type: 'trend_data',
        required: true,
        prompt: 'Provide winding temperature trends during operation. Note any hot spots or temperature imbalance between phases.',
        units: '°C'
      }
    ],
    typicalSymptoms: ['current imbalance', 'overheating', 'vibration', 'insulation breakdown', 'starting problems'],
    failurePatterns: [
      {
        pattern: 'Winding Failure',
        indicators: ['current_imbalance', 'temperature_rise', 'insulation_degradation'],
        requiredEvidence: ['current_signature', 'insulation_test', 'temperature_monitoring']
      }
    ],
    smartPrompts: [
      {
        condition: 'current_imbalance AND temperature_normal',
        prompt: 'Current imbalance without overheating suggests connection issues or phase problems. Check terminal connections and supply voltage.',
        action: 'request_connection_inspection'
      }
    ]
  }
};

export function getEquipmentEvidenceConfig(equipmentType: string): EquipmentEvidenceConfig | null {
  return EQUIPMENT_EVIDENCE_LIBRARY[equipmentType] || null;
}

export function getRequiredEvidence(equipmentType: string, symptom: string): EvidenceRequirement[] {
  const config = getEquipmentEvidenceConfig(equipmentType);
  if (!config) return [];

  // Find matching failure pattern
  const pattern = config.failurePatterns.find(p => 
    p.indicators.some(indicator => symptom.toLowerCase().includes(indicator.toLowerCase()))
  );

  if (pattern) {
    return config.criticalEvidence.filter(evidence => 
      pattern.requiredEvidence.includes(evidence.id)
    );
  }

  return config.criticalEvidence.filter(evidence => evidence.required);
}

export function getSmartPrompt(equipmentType: string, conditions: Record<string, boolean>): string | null {
  const config = getEquipmentEvidenceConfig(equipmentType);
  if (!config) return null;

  for (const smartPrompt of config.smartPrompts) {
    if (evaluateCondition(smartPrompt.condition, conditions)) {
      return smartPrompt.prompt;
    }
  }

  return null;
}

function evaluateCondition(condition: string, values: Record<string, boolean>): boolean {
  // Simple condition evaluator for AND/OR logic
  const tokens = condition.split(/\s+(AND|OR)\s+/);
  let result = values[tokens[0]] || false;
  
  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i];
    const variable = tokens[i + 1];
    const value = values[variable] || false;
    
    if (operator === 'AND') {
      result = result && value;
    } else if (operator === 'OR') {
      result = result || value;
    }
  }
  
  return result;
}