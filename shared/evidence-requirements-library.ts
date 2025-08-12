// Comprehensive Evidence Requirements Library
// ISO 14224 compliant equipment classification with detailed evidence requirements

export interface TrendDataRequirement {
  id: string;
  name: string;
  description: string;
  units: string;
  mandatory: boolean;
  samplingFrequency: string;
  typicalRange?: string;
  alertThresholds?: {
    warning: string;
    alarm: string;
  };
}

export interface AttachmentRequirement {
  id: string;
  name: string;
  description: string;
  fileTypes: string[];
  mandatory: boolean;
  maxSizeMB: number;
  validationCriteria?: string;
}

export interface AIPromptTemplate {
  fieldType: 'observed_problem' | 'maintenance_history' | 'operating_conditions' | 'inspection_results' | 'trend_analysis';
  context: string;
  prompt: string;
  examples: string[];
  validation: string;
  followUpQuestions?: string[];
}

export interface FailureMode {
  id: string;
  name: string;
  description: string;
  typicalSymptoms: string[];
  criticalEvidence: string[]; // References to trend/attachment IDs
  diagnosticQuestions: string[];
  commonCauses: string[];
}

export interface EquipmentEvidenceProfile {
  equipmentType: string;
  iso14224Code: string;
  subtypes: string[];
  requiredTrendData: TrendDataRequirement[];
  requiredAttachments: AttachmentRequirement[];
  aiPromptTemplates: AIPromptTemplate[];
  failureModes: FailureMode[];
  smartSuggestions: {
    condition: string;
    suggestion: string;
    additionalEvidence?: string[];
  }[];
  lastUpdated: string;
  updatedBy: string;
  notes?: string;
}

// Main Evidence Requirements Library
export const EVIDENCE_REQUIREMENTS_LIBRARY: Record<string, EquipmentEvidenceProfile> = {
  'pumps_centrifugal': {
    equipmentType: 'Pumps',
    iso14224Code: 'PU-001',
    subtypes: ['Centrifugal', 'End Suction', 'Between Bearings', 'Vertical Turbine'],
    requiredTrendData: [
      {
        id: 'vibration_overall',
        name: 'Overall Vibration',
        description: 'RMS vibration velocity at pump and motor bearings',
        units: 'mm/s',
        mandatory: true,
        samplingFrequency: '1 Hz continuous',
        typicalRange: '1.8-7.1 mm/s',
        alertThresholds: {
          warning: '7.1 mm/s',
          alarm: '11.2 mm/s'
        }
      },
      {
        id: 'vibration_spectrum',
        name: 'Vibration Spectrum Analysis',
        description: 'FFT analysis showing 1X, 2X, 3X running speed and bearing frequencies',
        units: 'mm/s at frequency',
        mandatory: true,
        samplingFrequency: 'Weekly or on condition',
        typicalRange: 'Varies by frequency'
      },
      {
        id: 'discharge_pressure',
        name: 'Discharge Pressure',
        description: 'Pump discharge pressure trend',
        units: 'bar(g)',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: 'Per design specification'
      },
      {
        id: 'suction_pressure',
        name: 'Suction Pressure',
        description: 'Pump suction pressure for NPSH calculation',
        units: 'bar(g)',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: 'Above vapor pressure + NPSH required'
      },
      {
        id: 'flow_rate',
        name: 'Flow Rate',
        description: 'Actual pump flow rate',
        units: 'm³/h',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: '70-110% of BEP'
      },
      {
        id: 'bearing_temperature',
        name: 'Bearing Temperature',
        description: 'Drive end and non-drive end bearing temperatures',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Ambient + 40°C max',
        alertThresholds: {
          warning: '85°C',
          alarm: '95°C'
        }
      },
      {
        id: 'motor_current',
        name: 'Motor Current',
        description: 'Three-phase motor current consumption',
        units: 'A',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: '80-105% of FLA'
      },
      {
        id: 'seal_pot_level',
        name: 'Seal Pot Level',
        description: 'Mechanical seal support system fluid level',
        units: '%',
        mandatory: false,
        samplingFrequency: '1 minute',
        typicalRange: '40-80%'
      }
    ],
    requiredAttachments: [
      {
        id: 'vibration_analysis_report',
        name: 'Vibration Analysis Report',
        description: 'Detailed spectrum analysis with bearing fault frequencies',
        fileTypes: ['pdf', 'xlsx', 'csv'],
        mandatory: true,
        maxSizeMB: 25,
        validationCriteria: 'Must include time waveform, spectrum, and trend data'
      },
      {
        id: 'dcs_trend_screenshot',
        name: 'DCS Trend Screenshot',
        description: 'Process control system trends showing pressure, flow, temperature',
        fileTypes: ['png', 'jpg', 'pdf'],
        mandatory: true,
        maxSizeMB: 10,
        validationCriteria: 'Must show 24-48 hours of data including failure event'
      },
      {
        id: 'pump_inspection_photos',
        name: 'Pump Inspection Photos',
        description: 'Visual documentation of pump condition, seal, coupling, alignment',
        fileTypes: ['jpg', 'png'],
        mandatory: true,
        maxSizeMB: 50,
        validationCriteria: 'Clear, well-lit photos of critical components'
      },
      {
        id: 'maintenance_work_order',
        name: 'Maintenance Work Order',
        description: 'Recent maintenance history with parts used and procedures',
        fileTypes: ['pdf', 'xlsx', 'docx'],
        mandatory: true,
        maxSizeMB: 15,
        validationCriteria: 'Must include dates, parts list, and work performed'
      },
      {
        id: 'seal_replacement_record',
        name: 'Seal Replacement Record',
        description: 'Documentation of seal installation with torque values and alignment',
        fileTypes: ['pdf', 'xlsx'],
        mandatory: false,
        maxSizeMB: 10,
        validationCriteria: 'Include part numbers, installation procedure, test results'
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'For centrifugal pump failures, specific technical details are critical for accurate diagnosis',
        prompt: 'Describe the pump failure with precise technical details: What type of leak (mechanical seal, packing, casing)? Vibration amplitude and frequency? Temperature readings? Flow and pressure values? Include timeline of symptom development.',
        examples: [
          'Mechanical seal leaking 2 L/min clear water, overall vibration 8.5 mm/s (normal 2.1), DE bearing temperature 85°C (normal 65°C), grinding noise from bearing area, started gradually over 3 hours',
          'Pump cavitation noise, suction pressure dropped to 0.8 bar (normal 1.2), discharge pressure fluctuating ±0.5 bar, flow reduced from 180 to 140 m³/h'
        ],
        validation: 'Response must include quantified measurements, not just descriptions',
        followUpQuestions: [
          'What was the exact leak rate and fluid appearance?',
          'What were the vibration readings at pump and motor bearings?',
          'Did you notice any changes in operating parameters before the failure?'
        ]
      },
      {
        fieldType: 'maintenance_history',
        context: 'Recent maintenance work often contributes to pump failures',
        prompt: 'Document all maintenance performed in the last 6 months. Include: parts replaced (OEM vs aftermarket), who performed the work, installation procedures followed, torque specifications used, post-work testing, any deviations from standard procedures.',
        examples: [
          'Mechanical seal replaced 2025-07-15 by ABC Contractors, OEM Flowserve Type 28 seal PN 123456, installed per API 682 procedure, torque 25 Nm per specification, post-installation alignment verified 0.002" TIR, test run 4 hours at design flow 180 m³/h with no leakage',
          'Bearing replacement 2025-06-20, OEM SKF 6309 bearings, proper heating to 80°C, shaft clearance verified, grease quantity per manual, vibration baseline established'
        ],
        validation: 'Must include specific dates, part numbers, procedures, and verification steps',
        followUpQuestions: [
          'Were OEM parts used or aftermarket equivalents?',
          'Was the installation procedure documented and followed?',
          'What post-installation testing was performed?'
        ]
      },
      {
        fieldType: 'operating_conditions',
        context: 'Operating parameters at time of failure reveal root causes',
        prompt: 'Provide actual operating conditions during failure: suction pressure, discharge pressure, flow rate, fluid temperature, NPSH available vs required, system resistance curve position, any process upsets or changes.',
        examples: [
          'Flow 165 m³/h (design 180), suction pressure 1.1 bar (design 1.5), discharge 8.2 bar (design 8.5), fluid temperature 68°C (design 65°C), NPSH available 3.2m (required 2.8m)',
          'Operating at minimum flow 120 m³/h due to process demand, recirculation valve 40% open, fluid temperature stable 65°C, no recent process changes'
        ],
        validation: 'Must include actual numerical values and comparison to design conditions'
      }
    ],
    failureModes: [
      {
        id: 'mechanical_seal_failure',
        name: 'Mechanical Seal Failure',
        description: 'Failure of primary or secondary seal elements',
        typicalSymptoms: ['Visible leakage', 'Seal chamber pressure loss', 'High seal face temperature', 'Abnormal noise'],
        criticalEvidence: ['seal_inspection_photos', 'operating_conditions', 'maintenance_work_order'],
        diagnosticQuestions: [
          'Was the seal recently replaced or maintained?',
          'What is the condition of the seal faces and O-rings?',
          'Are there signs of dry running or contamination?',
          'Was proper installation procedure followed?'
        ],
        commonCauses: ['Dry running', 'Contamination', 'Improper installation', 'Process upset', 'Thermal shock']
      },
      {
        id: 'bearing_failure',
        name: 'Bearing Failure',
        description: 'Rolling element or journal bearing degradation',
        typicalSymptoms: ['High vibration', 'Temperature increase', 'Unusual noise', 'Metal particles in lubricant'],
        criticalEvidence: ['vibration_analysis_report', 'bearing_temperature', 'pump_inspection_photos'],
        diagnosticQuestions: [
          'What are the vibration levels and frequencies?',
          'Are bearing temperatures elevated?',
          'Is there evidence of lubrication issues?',
          'When was the last alignment check?'
        ],
        commonCauses: ['Misalignment', 'Lubrication failure', 'Contamination', 'Fatigue', 'Improper installation']
      },
      {
        id: 'cavitation',
        name: 'Cavitation',
        description: 'Formation and collapse of vapor bubbles due to insufficient NPSH',
        typicalSymptoms: ['Crackling noise', 'Vibration', 'Performance loss', 'Impeller erosion'],
        criticalEvidence: ['suction_pressure', 'flow_rate', 'pump_inspection_photos'],
        diagnosticQuestions: [
          'What is the NPSH available vs required?',
          'Is there evidence of impeller erosion?',
          'Have suction conditions changed?',
          'Are there signs of vapor formation?'
        ],
        commonCauses: ['Insufficient NPSH', 'Suction line restrictions', 'High fluid temperature', 'System design issues']
      }
    ],
    smartSuggestions: [
      {
        condition: 'vibration_high AND seal_leak',
        suggestion: 'High vibration combined with seal leakage typically indicates misalignment or bearing wear causing shaft deflection. Check alignment measurements and bearing condition immediately.',
        additionalEvidence: ['alignment_data', 'bearing_condition_assessment']
      },
      {
        condition: 'recent_maintenance AND current_failure',
        suggestion: 'Failure shortly after maintenance suggests installation issues. Verify procedures were followed, correct parts used, and proper torque applied.',
        additionalEvidence: ['installation_procedure_checklist', 'part_verification_photos']
      },
      {
        condition: 'pressure_drop AND performance_loss',
        suggestion: 'Pressure drop with performance loss indicates internal wear or blockage. Inspect impeller for erosion, corrosion, or foreign object damage.',
        additionalEvidence: ['impeller_inspection_photos', 'internal_clearance_measurements']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin',
    notes: 'Based on API 610 standards and field experience database'
  },

  'compressors_reciprocating': {
    equipmentType: 'Compressors',
    iso14224Code: 'CO-002',
    subtypes: ['Single Acting', 'Double Acting', 'Multi-stage'],
    requiredTrendData: [
      {
        id: 'suction_pressure',
        name: 'Suction Pressure',
        description: 'Compressor inlet pressure for all stages',
        units: 'bar(g)',
        mandatory: true,
        samplingFrequency: '5 seconds',
        typicalRange: 'Per process design'
      },
      {
        id: 'discharge_pressure',
        name: 'Discharge Pressure',
        description: 'Compressor outlet pressure for all stages',
        units: 'bar(g)',
        mandatory: true,
        samplingFrequency: '5 seconds',
        typicalRange: 'Per compression ratio'
      },
      {
        id: 'cylinder_temperature',
        name: 'Cylinder Temperature',
        description: 'Individual cylinder head temperatures',
        units: '°C',
        mandatory: true,
        samplingFrequency: '30 seconds',
        typicalRange: 'Discharge temp < 180°C',
        alertThresholds: {
          warning: '150°C',
          alarm: '175°C'
        }
      },
      {
        id: 'vibration_overall',
        name: 'Overall Vibration',
        description: 'Compressor frame vibration',
        units: 'mm/s',
        mandatory: true,
        samplingFrequency: '1 Hz continuous',
        typicalRange: '4.5-11.2 mm/s'
      }
    ],
    requiredAttachments: [
      {
        id: 'pressure_trends',
        name: 'Pressure Trend Charts',
        description: 'Suction and discharge pressure trends showing pulsations and valve behavior',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 20
      },
      {
        id: 'trip_log',
        name: 'Compressor Trip Log',
        description: 'Control system trip and alarm history',
        fileTypes: ['pdf', 'csv', 'xlsx'],
        mandatory: true,
        maxSizeMB: 15
      },
      {
        id: 'valve_inspection',
        name: 'Valve Inspection Report',
        description: 'Condition assessment of suction and discharge valves',
        fileTypes: ['pdf', 'jpg', 'png'],
        mandatory: true,
        maxSizeMB: 30
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Reciprocating compressor failures often relate to valve condition and capacity loss',
        prompt: 'Describe compressor symptoms with specific measurements: capacity loss percentage, temperature readings by cylinder, pressure fluctuations, vibration levels, unusual noises. Include timeline of performance degradation.',
        examples: [
          'Capacity loss 25% from design, cylinder #2 temperature 165°C (others 135°C), suction pressure pulsations ±0.3 bar, discharge valve noise audible, started over 2 weeks',
          'High vibration 15 mm/s (normal 6), temperature spike cylinder #1 to 180°C, pressure ratio dropped from 3.2 to 2.8, metallic noise from valve area'
        ],
        validation: 'Must include quantified performance loss and temperature differentials'
      }
    ],
    failureModes: [
      {
        id: 'valve_failure',
        name: 'Compressor Valve Failure',
        description: 'Failure of suction or discharge valve plates, springs, or seats',
        typicalSymptoms: ['Capacity loss', 'Temperature rise', 'Pressure fluctuation', 'Unusual noise'],
        criticalEvidence: ['pressure_trends', 'cylinder_temperature', 'valve_inspection'],
        diagnosticQuestions: [
          'Which cylinders show elevated temperatures?',
          'Are pressure pulsations excessive?',
          'What is the extent of capacity loss?',
          'When were valves last serviced?'
        ],
        commonCauses: ['Valve plate fatigue', 'Spring failure', 'Contamination', 'Thermal stress', 'Inadequate maintenance']
      }
    ],
    smartSuggestions: [
      {
        condition: 'temperature_spike AND capacity_loss',
        suggestion: 'Temperature spike with capacity loss indicates valve leakage. Check valve condition and seating for affected cylinder.',
        additionalEvidence: ['valve_disassembly_photos', 'seat_condition_assessment']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'turbines_gas': {
    equipmentType: 'Turbines',
    iso14224Code: 'TU-003',
    subtypes: ['Gas', 'Steam'],
    requiredTrendData: [
      {
        id: 'rotor_vibration',
        name: 'Rotor Vibration',
        description: 'Rotor vibration in axial and radial directions',
        units: 'mm/s',
        mandatory: true,
        samplingFrequency: '1 Hz continuous',
        typicalRange: '2.8-7.1 mm/s'
      },
      {
        id: 'bearing_temperature',
        name: 'Bearing Temperature',
        description: 'Journal and thrust bearing temperatures',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Ambient + 50°C max'
      },
      {
        id: 'exhaust_temperature',
        name: 'Exhaust Temperature',
        description: 'Turbine exhaust gas temperature',
        units: '°C',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: 'Per design specification'
      }
    ],
    requiredAttachments: [
      {
        id: 'vibration_charts',
        name: 'Vibration Charts',
        description: 'Vibration trend plots and spectrum analysis',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 25
      },
      {
        id: 'oil_analysis',
        name: 'Oil Analysis Report',
        description: 'Lube oil condition and contamination analysis',
        fileTypes: ['pdf', 'csv'],
        mandatory: true,
        maxSizeMB: 10
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Gas turbine failures often relate to vibration, bearing issues, or hot gas path problems',
        prompt: 'Describe turbine symptoms with measurements: vibration levels, bearing temperatures, exhaust temps, speed/load variations. Include timeline and any trips.',
        examples: [
          'Rotor vibration increased to 12 mm/s (normal 4), bearing #2 temp 95°C (others 70°C), exhaust temp fluctuating ±15°C, started 3 days ago',
          'High vibration at 1X running speed 8 mm/s, oil pressure drop to 2.1 bar, trip on bearing temperature alarm'
        ],
        validation: 'Must include vibration measurements and temperature readings'
      }
    ],
    failureModes: [
      {
        id: 'bearing_failure',
        name: 'Bearing Failure',
        description: 'Journal or thrust bearing deterioration',
        typicalSymptoms: ['High vibration', 'Temperature rise', 'Oil pressure drop'],
        criticalEvidence: ['vibration_charts', 'bearing_temperature', 'oil_analysis'],
        diagnosticQuestions: [
          'Which bearing shows elevated temperature?',
          'Is vibration at 1X or 2X running speed?',
          'What does oil analysis show?'
        ],
        commonCauses: ['Oil contamination', 'Misalignment', 'Bearing wear', 'Insufficient lubrication']
      }
    ],
    smartSuggestions: [
      {
        condition: 'vibration_high AND bearing_temp_high',
        suggestion: 'High vibration with bearing temperature indicates bearing distress. Check oil condition and alignment.',
        additionalEvidence: ['oil_sample_recent', 'alignment_check_data']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'motors_electric': {
    equipmentType: 'Electric Motors',
    iso14224Code: 'MO-004',
    subtypes: ['Squirrel Cage', 'Slip Ring', 'DC'],
    requiredTrendData: [
      {
        id: 'motor_current',
        name: 'Motor Current',
        description: 'Three-phase motor current consumption',
        units: 'A',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: '80-105% of FLA'
      },
      {
        id: 'stator_temperature',
        name: 'Stator Temperature',
        description: 'Motor stator winding temperature',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Class F: <155°C'
      },
      {
        id: 'vibration_overall',
        name: 'Overall Vibration',
        description: 'Motor vibration at drive and non-drive ends',
        units: 'mm/s',
        mandatory: true,
        samplingFrequency: '1 Hz continuous',
        typicalRange: '1.8-4.5 mm/s'
      }
    ],
    requiredAttachments: [
      {
        id: 'insulation_resistance',
        name: 'Insulation Resistance Test',
        description: 'Megger test results for winding insulation',
        fileTypes: ['pdf', 'csv'],
        mandatory: true,
        maxSizeMB: 5
      },
      {
        id: 'current_signature',
        name: 'Motor Current Signature Analysis',
        description: 'MCSA for rotor bar and bearing condition',
        fileTypes: ['csv', 'png'],
        mandatory: false,
        maxSizeMB: 15
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Electric motor failures typically involve current imbalance, overheating, or vibration',
        prompt: 'Describe motor symptoms with specific data: current readings per phase, temperatures, vibration levels, any trips or overloads. Include operational timeline.',
        examples: [
          'Phase A current 52A, B=48A, C=55A (imbalance 7%), stator temp 165°C, vibration 6 mm/s, tripped on overload twice',
          'Motor current increased 15% above normal, bearing vibration 8 mm/s, temperature rise 25°C above baseline'
        ],
        validation: 'Must include current readings and temperature measurements'
      }
    ],
    failureModes: [
      {
        id: 'bearing_failure',
        name: 'Motor Bearing Failure',
        description: 'Rolling element bearing deterioration',
        typicalSymptoms: ['High vibration', 'Noise', 'Temperature rise'],
        criticalEvidence: ['vibration_overall', 'current_signature'],
        diagnosticQuestions: [
          'Is vibration at bearing frequencies?',
          'Any bearing noise audible?',
          'Current signature shows bearing defects?'
        ],
        commonCauses: ['Bearing wear', 'Lubrication failure', 'Contamination', 'Misalignment']
      }
    ],
    smartSuggestions: [
      {
        condition: 'current_imbalance AND temperature_high',
        suggestion: 'Current imbalance with high temperature suggests winding problems. Check insulation resistance.',
        additionalEvidence: ['winding_resistance_test', 'thermal_imaging']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'heat_exchangers_shell_tube': {
    equipmentType: 'Heat Exchangers',
    iso14224Code: 'HE-005',
    subtypes: ['Shell & Tube', 'Plate', 'Air Cooler'],
    requiredTrendData: [
      {
        id: 'inlet_temperature',
        name: 'Inlet Temperature',
        description: 'Hot and cold side inlet temperatures',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per process design'
      },
      {
        id: 'outlet_temperature',
        name: 'Outlet Temperature',
        description: 'Hot and cold side outlet temperatures',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per process design'
      },
      {
        id: 'pressure_drop',
        name: 'Pressure Drop',
        description: 'Differential pressure across shell and tube sides',
        units: 'bar',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Clean condition + 20%'
      }
    ],
    requiredAttachments: [
      {
        id: 'temperature_trends',
        name: 'Temperature Trend Charts',
        description: 'Inlet/outlet temperature trends showing heat transfer performance',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 20
      },
      {
        id: 'inspection_photos',
        name: 'Internal Inspection Photos',
        description: 'Photos of tube condition, fouling, or corrosion',
        fileTypes: ['jpg', 'png'],
        mandatory: true,
        maxSizeMB: 50
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Heat exchanger problems typically involve fouling, tube leaks, or thermal performance degradation',
        prompt: 'Describe heat exchanger symptoms: temperature differences, pressure drops, flow rates, any tube leaks or fouling evidence. Include performance compared to baseline.',
        examples: [
          'Outlet temp dropped 15°C from design, pressure drop increased 0.8 bar, flow reduced 10%, brown deposits visible',
          'Tube leak detected, cross-contamination between process streams, pressure test failed at 12 bar'
        ],
        validation: 'Must include temperature and pressure drop measurements'
      }
    ],
    failureModes: [
      {
        id: 'fouling',
        name: 'Heat Exchanger Fouling',
        description: 'Accumulation of deposits reducing heat transfer',
        typicalSymptoms: ['Poor heat transfer', 'High pressure drop', 'Temperature deviation'],
        criticalEvidence: ['temperature_trends', 'pressure_drop', 'inspection_photos'],
        diagnosticQuestions: [
          'What type of fouling is observed?',
          'How much has pressure drop increased?',
          'When was last cleaning performed?'
        ],
        commonCauses: ['Process contamination', 'Corrosion products', 'Scaling', 'Biological growth']
      }
    ],
    smartSuggestions: [
      {
        condition: 'pressure_drop_high AND temperature_low',
        suggestion: 'High pressure drop with poor heat transfer indicates fouling. Inspect tubes and consider cleaning.',
        additionalEvidence: ['fouling_analysis', 'cleaning_effectiveness_data']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'valves_control': {
    equipmentType: 'Valves',
    iso14224Code: 'VA-006',
    subtypes: ['Gate', 'Globe', 'Ball', 'Control', 'Safety Relief'],
    requiredTrendData: [
      {
        id: 'stem_position',
        name: 'Valve Stem Position',
        description: 'Actual valve position feedback',
        units: '%',
        mandatory: true,
        samplingFrequency: '1 second',
        typicalRange: '0-100% per command'
      },
      {
        id: 'upstream_pressure',
        name: 'Upstream Pressure',
        description: 'Pressure before valve',
        units: 'bar(g)',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: 'Per process design'
      },
      {
        id: 'downstream_pressure',
        name: 'Downstream Pressure',
        description: 'Pressure after valve',
        units: 'bar(g)',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: 'Per process design'
      }
    ],
    requiredAttachments: [
      {
        id: 'position_trends',
        name: 'Position Trend Charts',
        description: 'Valve position vs setpoint showing response and stiction',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 15
      },
      {
        id: 'stroke_test',
        name: 'Valve Stroke Test Report',
        description: 'Full stroke test results and travel times',
        fileTypes: ['pdf', 'csv'],
        mandatory: true,
        maxSizeMB: 10
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Control valve problems typically involve stiction, leakage, or poor response',
        prompt: 'Describe valve symptoms: position deviation, response time, pressure drops, any leakage or sticking. Include control loop performance impact.',
        examples: [
          'Valve sticking at 45% position, oscillation ±5%, response time increased to 8 seconds, process upset',
          'Internal leakage observed, position shows 0% but flow continues, pressure drop across seat'
        ],
        validation: 'Must include position data and response characteristics'
      }
    ],
    failureModes: [
      {
        id: 'actuator_failure',
        name: 'Valve Actuator Failure',
        description: 'Pneumatic or electric actuator malfunction',
        typicalSymptoms: ['Poor response', 'Position deviation', 'Stiction'],
        criticalEvidence: ['position_trends', 'stroke_test'],
        diagnosticQuestions: [
          'Is actuator air supply adequate?',
          'Any position feedback errors?',
          'When was last calibration?'
        ],
        commonCauses: ['Air supply issues', 'Positioner drift', 'Actuator wear', 'Contamination']
      }
    ],
    smartSuggestions: [
      {
        condition: 'position_deviation AND response_slow',
        suggestion: 'Position deviation with slow response indicates actuator problems. Check air supply and calibration.',
        additionalEvidence: ['air_supply_pressure', 'positioner_calibration']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'generators_synchronous': {
    equipmentType: 'Generators',
    iso14224Code: 'GE-007',
    subtypes: ['Synchronous', 'Induction'],
    requiredTrendData: [
      {
        id: 'output_voltage',
        name: 'Output Voltage',
        description: 'Generator terminal voltage',
        units: 'V',
        mandatory: true,
        samplingFrequency: '1 second',
        typicalRange: '±5% of rated'
      },
      {
        id: 'output_current',
        name: 'Output Current',
        description: 'Three-phase generator current',
        units: 'A',
        mandatory: true,
        samplingFrequency: '1 second',
        typicalRange: '0-100% of rated'
      },
      {
        id: 'frequency',
        name: 'Frequency',
        description: 'Generator output frequency',
        units: 'Hz',
        mandatory: true,
        samplingFrequency: '1 second',
        typicalRange: '±0.5% of rated'
      }
    ],
    requiredAttachments: [
      {
        id: 'trend_chart',
        name: 'Generator Output Trends',
        description: 'Voltage, current, and frequency trend charts',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 25
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Generator failures often involve voltage regulation, frequency control, or excitation system issues',
        prompt: 'Describe generator symptoms: voltage/frequency deviations, current imbalance, any trips or load rejections. Include excitation system status.',
        examples: [
          'Voltage regulation poor ±8% variation, frequency drift to 49.2 Hz under load, exciter current 15% above normal',
          'Generator trip on undervoltage, unable to maintain 11kV output, excitation system fault alarm'
        ],
        validation: 'Must include voltage, current, and frequency measurements'
      }
    ],
    failureModes: [
      {
        id: 'excitation_failure',
        name: 'Excitation System Failure',
        description: 'AVR or exciter malfunction affecting voltage control',
        typicalSymptoms: ['Voltage instability', 'Poor regulation', 'Exciter trips'],
        criticalEvidence: ['trend_chart', 'output_voltage'],
        diagnosticQuestions: [
          'Is AVR functioning properly?',
          'Any exciter system alarms?',
          'Voltage regulation within limits?'
        ],
        commonCauses: ['AVR failure', 'Exciter winding fault', 'Control system malfunction']
      }
    ],
    smartSuggestions: [
      {
        condition: 'voltage_unstable AND frequency_drift',
        suggestion: 'Voltage instability with frequency drift indicates excitation or governor control issues.',
        additionalEvidence: ['excitation_system_status', 'governor_response_test']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'fans_centrifugal': {
    equipmentType: 'Fans / Blowers',
    iso14224Code: 'FN-008',
    subtypes: ['Axial', 'Centrifugal'],
    requiredTrendData: [
      {
        id: 'vibration_overall',
        name: 'Overall Vibration',
        description: 'Fan vibration levels',
        units: 'mm/s',
        mandatory: true,
        samplingFrequency: '1 Hz continuous',
        typicalRange: '2.8-7.1 mm/s'
      },
      {
        id: 'flow_rate',
        name: 'Flow Rate',
        description: 'Air flow through fan',
        units: 'm³/h',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per design specification'
      },
      {
        id: 'static_pressure',
        name: 'Static Pressure',
        description: 'Fan discharge pressure',
        units: 'Pa',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per design curve'
      }
    ],
    requiredAttachments: [
      {
        id: 'vibration_chart',
        name: 'Vibration Chart',
        description: 'Fan vibration trend analysis',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 20
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Fan failures typically involve imbalance, bearing issues, or aerodynamic problems',
        prompt: 'Describe fan symptoms: vibration levels, flow/pressure changes, unusual noise, bearing temperatures. Include operational conditions.',
        examples: [
          'High vibration 12 mm/s at 1X speed, flow reduced 20%, unusual noise from impeller area',
          'Bearing temperature 95°C (normal 65°C), vibration increased gradually over 2 weeks'
        ],
        validation: 'Must include vibration measurements and performance data'
      }
    ],
    failureModes: [
      {
        id: 'imbalance',
        name: 'Fan Imbalance',
        description: 'Impeller imbalance causing vibration',
        typicalSymptoms: ['High vibration', 'Bearing wear', 'Noise'],
        criticalEvidence: ['vibration_chart', 'vibration_overall'],
        diagnosticQuestions: [
          'Is vibration at 1X running frequency?',
          'Any recent impeller damage?',
          'When was last balancing performed?'
        ],
        commonCauses: ['Blade erosion', 'Debris buildup', 'Manufacturing tolerance', 'Blade loss']
      }
    ],
    smartSuggestions: [
      {
        condition: 'vibration_high AND flow_reduced',
        suggestion: 'High vibration with reduced flow indicates impeller problems. Check for damage or debris.',
        additionalEvidence: ['impeller_inspection_photos', 'blade_condition_assessment']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'boilers_water_tube': {
    equipmentType: 'Boilers',
    iso14224Code: 'BO-009',
    subtypes: ['Water Tube', 'Fire Tube'],
    requiredTrendData: [
      {
        id: 'drum_pressure',
        name: 'Drum Pressure',
        description: 'Steam drum pressure',
        units: 'bar(g)',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: 'Per design pressure'
      },
      {
        id: 'steam_temperature',
        name: 'Steam Temperature',
        description: 'Superheated steam temperature',
        units: '°C',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: 'Per design specification'
      },
      {
        id: 'feedwater_level',
        name: 'Feedwater Level',
        description: 'Drum water level',
        units: '%',
        mandatory: true,
        samplingFrequency: '5 seconds',
        typicalRange: '40-60% normal operating'
      }
    ],
    requiredAttachments: [
      {
        id: 'trend_plots',
        name: 'Boiler Trend Plots',
        description: 'Pressure, temperature, and level trends',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 30
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Boiler problems involve pressure/temperature control, water level, or combustion issues',
        prompt: 'Describe boiler symptoms: pressure/temperature deviations, level control issues, combustion problems, safety valve operations.',
        examples: [
          'Drum pressure fluctuating ±2 bar, steam temp 50°C below setpoint, frequent level alarms',
          'Safety valve lifted at 8.5 bar (set 8.2), pressure control unstable, feedwater pump trips'
        ],
        validation: 'Must include pressure, temperature, and level data'
      }
    ],
    failureModes: [
      {
        id: 'tube_failure',
        name: 'Boiler Tube Failure',
        description: 'Water tube leak or rupture',
        typicalSymptoms: ['Pressure loss', 'Water loss', 'Steam plume', 'Level deviation'],
        criticalEvidence: ['trend_plots', 'drum_pressure', 'feedwater_level'],
        diagnosticQuestions: [
          'Location of tube failure?',
          'Rate of pressure/level loss?',
          'Any overheating indications?'
        ],
        commonCauses: ['Overheating', 'Corrosion', 'Erosion', 'Thermal stress', 'Poor water quality']
      }
    ],
    smartSuggestions: [
      {
        condition: 'pressure_loss AND level_drop',
        suggestion: 'Pressure loss with level drop indicates tube leak. Locate and isolate affected section.',
        additionalEvidence: ['tube_inspection_photos', 'water_chemistry_analysis']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'transformers_power': {
    equipmentType: 'Transformers',
    iso14224Code: 'TR-010',
    subtypes: ['Power', 'Distribution', 'Instrument'],
    requiredTrendData: [
      {
        id: 'oil_temperature',
        name: 'Oil Temperature',
        description: 'Transformer oil temperature',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Ambient + 55°C max'
      },
      {
        id: 'winding_temperature',
        name: 'Winding Temperature',
        description: 'Transformer winding temperature',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Oil temp + 23°C max'
      },
      {
        id: 'load_current',
        name: 'Load Current',
        description: 'Primary and secondary current',
        units: 'A',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: '0-100% of rated'
      }
    ],
    requiredAttachments: [
      {
        id: 'dga_report',
        name: 'Dissolved Gas Analysis Report',
        description: 'DGA results showing gas concentrations and ratios',
        fileTypes: ['pdf', 'csv'],
        mandatory: true,
        maxSizeMB: 10
      },
      {
        id: 'oil_test',
        name: 'Oil Quality Test',
        description: 'Oil dielectric strength, moisture, acidity tests',
        fileTypes: ['pdf', 'csv'],
        mandatory: true,
        maxSizeMB: 10
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Transformer failures involve insulation breakdown, overheating, or oil degradation',
        prompt: 'Describe transformer symptoms: temperature rises, oil condition, DGA results, any partial discharge or arcing sounds.',
        examples: [
          'Oil temp 85°C (normal 65°C), DGA shows H2=150ppm, C2H2=25ppm, crackling sounds observed',
          'Winding temp alarm 120°C, oil level low, moisture content 35ppm (limit 20ppm)'
        ],
        validation: 'Must include temperature readings and oil analysis data'
      }
    ],
    failureModes: [
      {
        id: 'insulation_breakdown',
        name: 'Insulation System Breakdown',
        description: 'Deterioration of transformer insulation',
        typicalSymptoms: ['High temperature', 'Abnormal DGA', 'Partial discharge', 'Oil degradation'],
        criticalEvidence: ['dga_report', 'oil_test', 'winding_temperature'],
        diagnosticQuestions: [
          'What gases are elevated in DGA?',
          'Is insulation resistance adequate?',
          'Any evidence of arcing or tracking?'
        ],
        commonCauses: ['Thermal aging', 'Moisture ingress', 'Overvoltage', 'Contamination', 'Design defects']
      }
    ],
    smartSuggestions: [
      {
        condition: 'temperature_high AND dga_abnormal',
        suggestion: 'High temperature with abnormal DGA indicates insulation stress. Monitor closely and consider offline inspection.',
        additionalEvidence: ['insulation_resistance_test', 'partial_discharge_measurement']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'agitators_mixers': {
    equipmentType: 'Agitators / Mixers',
    iso14224Code: 'AG-011',
    subtypes: ['Top Entry', 'Bottom Entry', 'Side Entry'],
    requiredTrendData: [
      {
        id: 'vibration_overall',
        name: 'Overall Vibration',
        description: 'Agitator vibration levels',
        units: 'mm/s',
        mandatory: true,
        samplingFrequency: '1 Hz continuous',
        typicalRange: '2.8-7.1 mm/s'
      },
      {
        id: 'motor_current',
        name: 'Motor Current',
        description: 'Drive motor current consumption',
        units: 'A',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: '80-105% of FLA'
      },
      {
        id: 'bearing_temperature',
        name: 'Bearing Temperature',
        description: 'Agitator bearing temperatures',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Ambient + 50°C max'
      }
    ],
    requiredAttachments: [
      {
        id: 'vibration_chart',
        name: 'Vibration Chart',
        description: 'Agitator vibration trend analysis',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 20
      },
      {
        id: 'maintenance_record',
        name: 'Maintenance Record',
        description: 'Recent maintenance and inspection history',
        fileTypes: ['pdf', 'doc'],
        mandatory: true,
        maxSizeMB: 15
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Agitator problems typically involve imbalance, bearing wear, or seal failures',
        prompt: 'Describe agitator symptoms: vibration levels, current changes, unusual noise, bearing temperatures, any seal leaks.',
        examples: [
          'High vibration 12 mm/s, motor current increased 15%, unusual noise from gearbox area',
          'Bearing temperature 85°C (normal 60°C), seal leak observed, vibration increased gradually'
        ],
        validation: 'Must include vibration and current measurements'
      }
    ],
    failureModes: [
      {
        id: 'bearing_failure',
        name: 'Agitator Bearing Failure',
        description: 'Bearing deterioration in thrust or radial bearings',
        typicalSymptoms: ['High vibration', 'Temperature rise', 'Noise'],
        criticalEvidence: ['vibration_chart', 'bearing_temperature'],
        diagnosticQuestions: [
          'Which bearing shows elevated temperature?',
          'Is vibration at 1X or 2X frequency?',
          'When was last lubrication?'
        ],
        commonCauses: ['Lubrication failure', 'Contamination', 'Misalignment', 'Overload']
      }
    ],
    smartSuggestions: [
      {
        condition: 'vibration_high AND current_high',
        suggestion: 'High vibration with increased current indicates mechanical stress. Check alignment and bearing condition.',
        additionalEvidence: ['alignment_check', 'lubrication_analysis']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'pressure_vessels': {
    equipmentType: 'Pressure Vessels',
    iso14224Code: 'PV-012', 
    subtypes: ['Accumulators', 'Reactors', 'Separators'],
    requiredTrendData: [
      {
        id: 'internal_pressure',
        name: 'Internal Pressure',
        description: 'Vessel internal pressure',
        units: 'bar(g)',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per design pressure rating'
      },
      {
        id: 'vessel_level',
        name: 'Vessel Level',
        description: 'Liquid level in vessel',
        units: '%',
        mandatory: true,
        samplingFrequency: '30 seconds',
        typicalRange: '20-80% normal operating'
      },
      {
        id: 'shell_temperature',
        name: 'Shell Temperature',
        description: 'Vessel shell temperature',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per process design'
      }
    ],
    requiredAttachments: [
      {
        id: 'ut_scan',
        name: 'Ultrasonic Thickness Scan',
        description: 'Wall thickness measurements for corrosion assessment',
        fileTypes: ['pdf', 'csv'],
        mandatory: true,
        maxSizeMB: 15
      },
      {
        id: 'pressure_chart',
        name: 'Pressure/Level Chart',
        description: 'Pressure and level trend data',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 25
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Pressure vessel problems involve pressure deviations, level control, or structural integrity',
        prompt: 'Describe vessel symptoms: pressure variations, level control issues, any structural concerns, wall thickness changes.',
        examples: [
          'Pressure fluctuating ±1.5 bar, level control unstable, wall thickness reduced 2mm from baseline',
          'Internal pressure drop to 85% of normal, level sensor drift, visual corrosion on shell'
        ],
        validation: 'Must include pressure and wall thickness measurements'
      }
    ],
    failureModes: [
      {
        id: 'corrosion_thinning',
        name: 'Corrosion Wall Thinning',
        description: 'Reduction in wall thickness due to corrosion',
        typicalSymptoms: ['Wall thickness reduction', 'Pressure rating concern', 'Visual corrosion'],
        criticalEvidence: ['ut_scan', 'pressure_chart'],
        diagnosticQuestions: [
          'What is current wall thickness vs. design?',
          'Rate of corrosion progress?',
          'Process chemistry changes?'
        ],
        commonCauses: ['Corrosive environment', 'Poor material selection', 'Process upset', 'Inadequate protection']
      }
    ],
    smartSuggestions: [
      {
        condition: 'thickness_reduced AND pressure_variation',
        suggestion: 'Wall thinning with pressure variations indicates structural integrity concerns. Review pressure rating.',
        additionalEvidence: ['stress_analysis', 'material_certification']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'columns_towers': {
    equipmentType: 'Columns/Towers',
    iso14224Code: 'CT-013',
    subtypes: ['Distillation', 'Absorber', 'Stripper'],
    requiredTrendData: [
      {
        id: 'column_pressure',
        name: 'Column Pressure',
        description: 'Operating pressure at various column heights',
        units: 'bar(g)',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per design pressure profile'
      },
      {
        id: 'temperature_profile',
        name: 'Temperature Profile',
        description: 'Temperature at multiple column trays',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per process simulation'
      },
      {
        id: 'differential_pressure',
        name: 'Differential Pressure',
        description: 'Pressure drop across column sections',
        units: 'mbar',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per hydraulic design'
      }
    ],
    requiredAttachments: [
      {
        id: 'trend_chart',
        name: 'Process Trend Chart',
        description: 'Pressure and temperature trends across column',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 30
      },
      {
        id: 'inspection_photo',
        name: 'Internal Inspection Photos',
        description: 'Photos of tray condition, damage, or fouling',
        fileTypes: ['jpg', 'png'],
        mandatory: true,
        maxSizeMB: 50
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Column problems involve flooding, weeping, tray damage, or pressure/temperature deviations',
        prompt: 'Describe column symptoms: pressure/temperature profile changes, differential pressure variations, product quality issues.',
        examples: [
          'Differential pressure increased 50%, flooding observed on tray 15, overhead purity dropped 2%',
          'Temperature inversion between trays 8-12, pressure fluctuating, weeping evident during inspection'
        ],
        validation: 'Must include pressure and temperature profile data'
      }
    ],
    failureModes: [
      {
        id: 'tray_damage',
        name: 'Distillation Tray Damage',
        description: 'Physical damage to column internals affecting separation',
        typicalSymptoms: ['Flooding', 'Poor separation', 'High differential pressure', 'Entrainment'],
        criticalEvidence: ['trend_chart', 'inspection_photo', 'differential_pressure'],
        diagnosticQuestions: [
          'Which trays show abnormal performance?',
          'Evidence of mechanical damage?',
          'Process upsets recently?'
        ],
        commonCauses: ['Hydraulic upset', 'Corrosion', 'Erosion', 'Thermal shock', 'Mechanical stress']
      }
    ],
    smartSuggestions: [
      {
        condition: 'differential_pressure_high AND flooding',
        suggestion: 'High differential pressure with flooding indicates tray hydraulic problems. Inspect for damage or fouling.',
        additionalEvidence: ['tray_inspection_report', 'hydraulic_simulation']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'filters_strainers': {
    equipmentType: 'Filters/Strainers',
    iso14224Code: 'FI-014',
    subtypes: ['Basket', 'Cartridge', 'Backwash'],
    requiredTrendData: [
      {
        id: 'differential_pressure',
        name: 'Differential Pressure',
        description: 'Pressure drop across filter element',
        units: 'bar',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Clean: 0.1 bar, Changeout: 1.5 bar'
      },
      {
        id: 'flow_rate',
        name: 'Flow Rate',
        description: 'Filtrate flow rate through filter',
        units: 'm³/h',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per design flow capacity'
      }
    ],
    requiredAttachments: [
      {
        id: 'dp_chart',
        name: 'Differential Pressure Chart',
        description: 'Pressure drop trend showing filter loading',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 20
      },
      {
        id: 'inspection_photo',
        name: 'Filter Element Inspection Photos',
        description: 'Photos of filter condition, plugging, or damage',
        fileTypes: ['jpg', 'png'],
        mandatory: true,
        maxSizeMB: 30
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Filter problems typically involve plugging, element rupture, or bypass',
        prompt: 'Describe filter symptoms: differential pressure rise rate, flow reduction, element condition, any bypass evidence.',
        examples: [
          'Differential pressure increased from 0.2 to 1.8 bar over 2 days, flow reduced 25%',
          'Filter element ruptured, bypass valve opened, contamination downstream detected'
        ],
        validation: 'Must include differential pressure and flow measurements'
      }
    ],
    failureModes: [
      {
        id: 'filter_plugging',
        name: 'Filter Element Plugging',
        description: 'Excessive fouling of filter media reducing capacity',
        typicalSymptoms: ['High differential pressure', 'Flow reduction', 'Frequent changeouts'],
        criticalEvidence: ['dp_chart', 'inspection_photo'],
        diagnosticQuestions: [
          'What contaminants are present?',
          'Filtration efficiency adequate?',
          'Upstream process changes?'
        ],
        commonCauses: ['Contamination increase', 'Undersized filter', 'Poor pretreatment', 'Process upset']
      }
    ],
    smartSuggestions: [
      {
        condition: 'differential_pressure_high AND flow_reduced',
        suggestion: 'High differential pressure with reduced flow indicates filter plugging. Inspect elements and upstream contamination.',
        additionalEvidence: ['contamination_analysis', 'upstream_process_review']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'tanks_atmospheric': {
    equipmentType: 'Tanks',
    iso14224Code: 'TK-015',
    subtypes: ['Atmospheric', 'Pressurized'],
    requiredTrendData: [
      {
        id: 'tank_level',
        name: 'Tank Level',
        description: 'Liquid level in tank',
        units: '%',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: '10-90% normal operating'
      },
      {
        id: 'tank_pressure',
        name: 'Tank Pressure',
        description: 'Internal tank pressure (if applicable)',
        units: 'mbar(g)',
        mandatory: false,
        samplingFrequency: '1 minute',
        typicalRange: 'Per design specification'
      },
      {
        id: 'tank_temperature',
        name: 'Tank Temperature',
        description: 'Product temperature in tank',
        units: '°C',
        mandatory: true,
        samplingFrequency: '5 minutes',
        typicalRange: 'Per product specifications'
      }
    ],
    requiredAttachments: [
      {
        id: 'level_chart',
        name: 'Level/Pressure Chart',
        description: 'Tank level and pressure trend data',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 25
      },
      {
        id: 'inspection_photo',
        name: 'Tank Inspection Photos',
        description: 'Photos of tank condition, roof, shell, or foundation',
        fileTypes: ['jpg', 'png'],
        mandatory: true,
        maxSizeMB: 40
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Tank problems involve level control, structural deformation, or leakage',
        prompt: 'Describe tank symptoms: level control issues, structural observations, roof movement, foundation settlement, any leaks.',
        examples: [
          'Tank level fluctuating ±5%, roof sagging observed, foundation cracks visible around perimeter',
          'Level sensor drift detected, pressure relief valve weeping, shell deformation at 3m height'
        ],
        validation: 'Must include level data and visual inspection details'
      }
    ],
    failureModes: [
      {
        id: 'roof_deformation',
        name: 'Floating Roof Deformation',
        description: 'Structural damage to floating roof affecting operation',
        typicalSymptoms: ['Roof sagging', 'Tilting', 'Seal leakage', 'Sticking'],
        criticalEvidence: ['level_chart', 'inspection_photo'],
        diagnosticQuestions: [
          'Is roof moving freely with level changes?',
          'Any visible structural damage?',
          'Seal condition adequate?'
        ],
        commonCauses: ['Structural overload', 'Foundation settlement', 'Corrosion', 'Design inadequacy']
      }
    ],
    smartSuggestions: [
      {
        condition: 'level_anomaly AND structural_deformation',
        suggestion: 'Level control issues with structural deformation indicate tank integrity concerns. Inspect foundation and shell.',
        additionalEvidence: ['foundation_survey', 'shell_thickness_measurement']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'piping_systems': {
    equipmentType: 'Piping',
    iso14224Code: 'PI-016',
    subtypes: ['Process', 'Utility', 'Steam', 'Water'],
    requiredTrendData: [
      {
        id: 'line_pressure',
        name: 'Line Pressure',
        description: 'Operating pressure in piping system',
        units: 'bar(g)',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per design pressure rating'
      },
      {
        id: 'flow_rate',
        name: 'Flow Rate',
        description: 'Flow rate through piping',
        units: 'm³/h',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per design flow capacity'
      },
      {
        id: 'pipe_temperature',
        name: 'Pipe Temperature',
        description: 'Process temperature in piping',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Per process design'
      }
    ],
    requiredAttachments: [
      {
        id: 'leak_report',
        name: 'Leak Detection Report',
        description: 'Leak detection sensor data or visual inspection report',
        fileTypes: ['pdf', 'csv'],
        mandatory: true,
        maxSizeMB: 15
      },
      {
        id: 'pressure_trend',
        name: 'Pressure Trend',
        description: 'Pressure and flow trend data',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 20
      },
      {
        id: 'inspection_photo',
        name: 'Piping Inspection Photos',
        description: 'Photos of pipe condition, supports, or damage',
        fileTypes: ['jpg', 'png'],
        mandatory: true,
        maxSizeMB: 30
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Piping problems involve leaks, blockages, support failures, or thermal expansion issues',
        prompt: 'Describe piping symptoms: pressure/flow variations, leaks, support condition, thermal expansion effects, vibration.',
        examples: [
          'Pressure drop 15% from normal, leak detected at flange connection, pipe support loose at bend',
          'Flow restriction observed, temperature cycling ±25°C, expansion joint failure, vibration 8 mm/s'
        ],
        validation: 'Must include pressure, flow, and visual inspection data'
      }
    ],
    failureModes: [
      {
        id: 'pipe_leak',
        name: 'Piping System Leak',
        description: 'Loss of containment through pipe wall or joints',
        typicalSymptoms: ['Pressure loss', 'Visible leak', 'Flow reduction', 'Environmental contamination'],
        criticalEvidence: ['leak_report', 'pressure_trend', 'inspection_photo'],
        diagnosticQuestions: [
          'Location and size of leak?',
          'Rate of pressure/flow loss?',
          'Cause - corrosion, erosion, mechanical?'
        ],
        commonCauses: ['Corrosion', 'Erosion', 'Thermal stress', 'Mechanical damage', 'Joint failure']
      }
    ],
    smartSuggestions: [
      {
        condition: 'pressure_loss AND leak_detected',
        suggestion: 'Pressure loss with detected leak requires immediate containment. Isolate section and assess damage extent.',
        additionalEvidence: ['leak_rate_assessment', 'corrosion_survey']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  'switchgear_electrical': {
    equipmentType: 'Switchgear',
    iso14224Code: 'SW-017',
    subtypes: ['LV', 'MV', 'HV', 'GIS'],
    requiredTrendData: [
      {
        id: 'bus_voltage',
        name: 'Bus Voltage',
        description: 'Busbar voltage per phase',
        units: 'V',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: '±5% of rated voltage'
      },
      {
        id: 'load_current',
        name: 'Load Current',
        description: 'Current through breakers and feeders',
        units: 'A',
        mandatory: true,
        samplingFrequency: '10 seconds',
        typicalRange: '0-80% of rated current'
      },
      {
        id: 'enclosure_temperature',
        name: 'Enclosure Temperature',
        description: 'Internal temperature of switchgear',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 minute',
        typicalRange: 'Ambient + 20°C max'
      }
    ],
    requiredAttachments: [
      {
        id: 'trend_chart',
        name: 'Electrical Trend Chart',
        description: 'Voltage, current, and temperature trends',
        fileTypes: ['csv', 'xlsx', 'png'],
        mandatory: true,
        maxSizeMB: 25
      },
      {
        id: 'ir_scan',
        name: 'Infrared Thermal Scan',
        description: 'Thermal imaging of electrical connections',
        fileTypes: ['jpg', 'png', 'pdf'],
        mandatory: true,
        maxSizeMB: 30
      },
      {
        id: 'maintenance_log',
        name: 'Maintenance Log',
        description: 'Recent maintenance and testing records',
        fileTypes: ['pdf', 'doc'],
        mandatory: true,
        maxSizeMB: 15
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Switchgear problems involve breaker misoperations, overheating, or insulation failures',
        prompt: 'Describe switchgear symptoms: breaker operations, trip events, temperature rises, any arcing or hot spots detected.',
        examples: [
          'Breaker failed to trip on overcurrent, hot spot 85°C on bus connection, phase A current 120% of rated',
          'Unexpected trip of feeder breaker, insulation resistance 50MΩ (normal 1000MΩ), moisture detected'
        ],
        validation: 'Must include electrical measurements and thermal scan results'
      }
    ],
    failureModes: [
      {
        id: 'breaker_malfunction',
        name: 'Circuit Breaker Malfunction',
        description: 'Failure of breaker to operate correctly during fault conditions',
        typicalSymptoms: ['Failed to trip', 'Failed to close', 'Nuisance tripping', 'Arcing'],
        criticalEvidence: ['trend_chart', 'ir_scan', 'maintenance_log'],
        diagnosticQuestions: [
          'Type of breaker malfunction?',
          'Recent maintenance performed?',
          'Trip coil and mechanism condition?'
        ],
        commonCauses: ['Mechanism wear', 'Contact deterioration', 'Control circuit failure', 'Contamination']
      }
    ],
    smartSuggestions: [
      {
        condition: 'temperature_high AND current_imbalance',
        suggestion: 'High temperature with current imbalance indicates connection problems. Check for loose connections and hot spots.',
        additionalEvidence: ['connection_torque_check', 'contact_resistance_test']
      }
    ],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  // UPS/Rectifiers - from user comprehensive data
  ups_rectifiers: {
    equipmentType: 'UPS/Rectifiers',
    iso14224Code: 'UP-018',
    subtypes: ['Static', 'Rotary'],
    requiredTrendData: [
      {
        id: 'output_voltage',
        name: 'Output Voltage',
        description: 'UPS output voltage monitoring',
        units: 'V',
        mandatory: true,
        samplingFrequency: '1 minute'
      },
      {
        id: 'battery_voltage', 
        name: 'Battery Voltage',
        description: 'Battery bank voltage monitoring',
        units: 'V',
        mandatory: true,
        samplingFrequency: '1 minute'
      },
      {
        id: 'ups_temperature',
        name: 'Temperature',
        description: 'UPS internal temperature',
        units: '°C',
        mandatory: true,
        samplingFrequency: '5 minutes'
      }
    ],
    requiredAttachments: [
      {
        id: 'voltage_chart',
        name: 'Voltage Chart',
        description: 'Output and battery voltage logs, alarm history',
        fileTypes: ['csv', 'xlsx'],
        mandatory: true,
        maxSizeMB: 20
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'UPS problems involve battery failures, inverter faults, or load transfer issues',
        prompt: 'Upload output and battery voltage logs, alarm history. Any battery replacement or faults?',
        examples: ['Battery voltage dropped to 10.8V, backup time reduced to 5 minutes, temperature alarm at 55°C'],
        validation: 'Must include voltage trends and alarm data'
      }
    ],
    failureModes: [
      {
        id: 'battery_failure',
        name: 'UPS Battery Failure',
        description: 'Battery degradation reducing backup capacity',
        typicalSymptoms: ['Low voltage', 'Reduced backup time', 'Temperature rise'],
        criticalEvidence: ['voltage_chart'],
        diagnosticQuestions: ['Battery age and last replacement?', 'Backup duration vs design?'],
        commonCauses: ['End of life', 'Overcharging', 'Temperature', 'Sulfation']
      }
    ],
    smartSuggestions: [],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  // Cables/Busbars - from user comprehensive data
  cables_busbars: {
    equipmentType: 'Cables/Busbars',
    iso14224Code: 'CB-019',
    subtypes: ['Power', 'Control'],
    requiredTrendData: [
      {
        id: 'cable_current',
        name: 'Current',
        description: 'Cable/busbar current loading',
        units: 'A',
        mandatory: true,
        samplingFrequency: '1 minute'
      },
      {
        id: 'cable_temperature',
        name: 'Temperature',
        description: 'Cable/busbar surface temperature',
        units: '°C',
        mandatory: true,
        samplingFrequency: '5 minutes'
      },
      {
        id: 'insulation_resistance',
        name: 'Insulation Resistance',
        description: 'IR test results',
        units: 'MΩ',
        mandatory: false,
        samplingFrequency: 'Monthly'
      }
    ],
    requiredAttachments: [
      {
        id: 'ir_test_report',
        name: 'IR Test Report',
        description: 'Insulation resistance test results and current/temp logs',
        fileTypes: ['pdf', 'xlsx'],
        mandatory: true,
        maxSizeMB: 10
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Cable problems involve insulation breakdown, overheating, or mechanical damage',
        prompt: 'Provide current/temp logs and last insulation resistance test.',
        examples: ['IR test dropped from 5000 MΩ to 500 MΩ, cable temperature 85°C, current 80% of rating'],
        validation: 'Must include IR test results and temperature data'
      }
    ],
    failureModes: [
      {
        id: 'insulation_failure',
        name: 'Cable Insulation Failure',
        description: 'Degradation of cable insulation leading to faults',
        typicalSymptoms: ['Low IR', 'High temperature', 'Partial discharge'],
        criticalEvidence: ['ir_test_report'],
        diagnosticQuestions: ['IR test trend over time?', 'Any moisture or contamination?'],
        commonCauses: ['Aging', 'Moisture', 'Overloading', 'Mechanical damage']
      }
    ],
    smartSuggestions: [],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  // Sensors/Transmitters - from user comprehensive data
  sensors_transmitters: {
    equipmentType: 'Sensors/Transmitters',
    iso14224Code: 'ST-020',
    subtypes: ['Temperature', 'Pressure', 'Flow', 'Level'],
    requiredTrendData: [
      {
        id: 'output_signal',
        name: 'Output Signal',
        description: 'Transmitter output signal (4-20mA)',
        units: 'mA',
        mandatory: true,
        samplingFrequency: '1 minute'
      },
      {
        id: 'input_value',
        name: 'Input Value',
        description: 'Measured process variable',
        units: 'varies',
        mandatory: true,
        samplingFrequency: '1 minute'
      }
    ],
    requiredAttachments: [
      {
        id: 'signal_chart',
        name: 'Signal Chart',
        description: 'Signal output trend and calibration history',
        fileTypes: ['csv', 'xlsx'],
        mandatory: true,
        maxSizeMB: 15
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Sensor problems involve drift, noise, failure, or calibration issues',
        prompt: 'Upload signal trend and last calibration record. Any drift or signal dropout?',
        examples: ['Output drifted from 12.5mA to 11.2mA over 3 months, calibration off by 2.5%'],
        validation: 'Must include signal data and calibration information'
      }
    ],
    failureModes: [
      {
        id: 'sensor_drift',
        name: 'Sensor Measurement Drift',
        description: 'Gradual change in sensor accuracy over time',
        typicalSymptoms: ['Signal drift', 'Calibration error', 'Process deviation'],
        criticalEvidence: ['signal_chart'],
        diagnosticQuestions: ['Rate and direction of drift?', 'When was last calibration?'],
        commonCauses: ['Aging', 'Contamination', 'Temperature effects', 'Vibration']
      }
    ],
    smartSuggestions: [],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  // PLCs/DCS Systems - from user comprehensive data
  plcs_dcs: {
    equipmentType: 'PLCs/DCS Systems',
    iso14224Code: 'PL-021',
    subtypes: ['Redundant', 'Non-redundant'],
    requiredTrendData: [
      {
        id: 'power_supply_voltage',
        name: 'Power Supply Voltage',
        description: 'System power supply monitoring',
        units: 'V',
        mandatory: true,
        samplingFrequency: '1 minute'
      },
      {
        id: 'cpu_temperature',
        name: 'CPU Temperature',
        description: 'Controller CPU temperature',
        units: '°C',
        mandatory: true,
        samplingFrequency: '5 minutes'
      }
    ],
    requiredAttachments: [
      {
        id: 'system_logs',
        name: 'System Logs',
        description: 'Fault/alarm log and I/O status history',
        fileTypes: ['csv', 'txt'],
        mandatory: true,
        maxSizeMB: 20
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'PLC/DCS problems involve power issues, communication faults, or hardware failures',
        prompt: 'Provide fault/alarm log and I/O status history. Any unexpected restarts or power dips?',
        examples: ['CPU fault 3 times this week, power supply voltage dropped to 21V, I/O card offline'],
        validation: 'Must include system logs and power/temperature data'
      }
    ],
    failureModes: [
      {
        id: 'power_supply_failure',
        name: 'Power Supply Failure',
        description: 'System power supply degradation or failure',
        typicalSymptoms: ['Voltage fluctuation', 'System restarts', 'I/O faults'],
        criticalEvidence: ['system_logs'],
        diagnosticQuestions: ['Voltage stability over time?', 'Any correlation with system faults?'],
        commonCauses: ['Power supply aging', 'Overloading', 'Temperature', 'Input voltage issues']
      }
    ],
    smartSuggestions: [],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  // Control Valves - from user comprehensive data
  control_valves_pneumatic: {
    equipmentType: 'Control Valves',
    iso14224Code: 'CV-022',
    subtypes: ['Pneumatic', 'Electric', 'Hydraulic'],
    requiredTrendData: [
      {
        id: 'stem_position_cv',
        name: 'Stem Position',
        description: 'Valve position feedback',
        units: '%',
        mandatory: true,
        samplingFrequency: '1 second'
      },
      {
        id: 'setpoint_signal',
        name: 'Setpoint Signal',
        description: 'Control signal from controller',
        units: 'mA',
        mandatory: true,
        samplingFrequency: '1 second'
      },
      {
        id: 'travel_time',
        name: 'Travel Time',
        description: 'Full stroke operation time',
        units: 'seconds',
        mandatory: false,
        samplingFrequency: 'Weekly test'
      }
    ],
    requiredAttachments: [
      {
        id: 'position_trends',
        name: 'Position Trends',
        description: 'Position vs setpoint, pressure trends, travel time data',
        fileTypes: ['csv', 'xlsx'],
        mandatory: true,
        maxSizeMB: 20
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Control valve problems involve stiction, hunting, leakage, or calibration issues',
        prompt: 'Upload position and setpoint signal trend, pressure trends, travel time data. Any stiction or calibration issue?',
        examples: ['Valve sticking at 45% position, travel time increased from 8s to 15s, hunting ±3%'],
        validation: 'Must include position data and performance characteristics'
      }
    ],
    failureModes: [
      {
        id: 'valve_stiction',
        name: 'Control Valve Stiction',
        description: 'Friction preventing smooth valve movement',
        typicalSymptoms: ['Jerky movement', 'Position lag', 'Control oscillation'],
        criticalEvidence: ['position_trends'],
        diagnosticQuestions: ['Position response to signal changes?', 'Any dead band or hysteresis?'],
        commonCauses: ['Packing wear', 'Stem corrosion', 'Actuator problems', 'Valve sizing']
      }
    ],
    smartSuggestions: [],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  // Analyzers - from user comprehensive data
  analyzers: {
    equipmentType: 'Analyzers',
    iso14224Code: 'AN-023',
    subtypes: ['Gas Chromatograph', 'pH', 'Conductivity', 'Moisture'],
    requiredTrendData: [
      {
        id: 'analyzer_output',
        name: 'Output Signal',
        description: 'Analyzer measurement output',
        units: 'varies',
        mandatory: true,
        samplingFrequency: '1 minute'
      },
      {
        id: 'calibration_trend',
        name: 'Calibration Trend',
        description: 'Calibration check results over time',
        units: '% error',
        mandatory: true,
        samplingFrequency: 'Daily check'
      }
    ],
    requiredAttachments: [
      {
        id: 'analyzer_charts',
        name: 'Signal/Calibration Charts',
        description: 'Output/calibration trends and validation records',
        fileTypes: ['csv', 'xlsx'],
        mandatory: true,
        maxSizeMB: 20
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Analyzer problems involve calibration drift, contamination, or component failures',
        prompt: 'Attach output/calibration trends and validation records. Any sudden shifts or error codes?',
        examples: ['GC baseline shifted 15%, retention time drift 0.2 min, detector response down 20%'],
        validation: 'Must include calibration data and validation records'
      }
    ],
    failureModes: [
      {
        id: 'calibration_drift',
        name: 'Analyzer Calibration Drift',
        description: 'Gradual change in analyzer accuracy requiring recalibration',
        typicalSymptoms: ['Reading offset', 'Validation failures', 'Baseline drift'],
        criticalEvidence: ['analyzer_charts'],
        diagnosticQuestions: ['Rate and direction of drift?', 'Sample contamination possible?'],
        commonCauses: ['Detector aging', 'Contamination', 'Temperature effects', 'Component wear']
      }
    ],
    smartSuggestions: [],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  // HVAC Units - from user comprehensive data
  hvac_units: {
    equipmentType: 'HVAC Units',
    iso14224Code: 'HV-025',
    subtypes: ['Air Handler', 'Split', 'Chiller'],
    requiredTrendData: [
      {
        id: 'hvac_temp',
        name: 'Temperature',
        description: 'Supply/return air temperature',
        units: '°C',
        mandatory: true,
        samplingFrequency: '1 min'
      },
      {
        id: 'hvac_pressure',
        name: 'Pressure',
        description: 'System pressure monitoring',
        units: 'kPa',
        mandatory: true,
        samplingFrequency: '1 min'
      },
      {
        id: 'hvac_flow',
        name: 'Flow',
        description: 'Air flow rate',
        units: 'm³/hr',
        mandatory: true,
        samplingFrequency: '5 min'
      },
      {
        id: 'hvac_current',
        name: 'Current',
        description: 'Motor current',
        units: 'A',
        mandatory: true,
        samplingFrequency: '1 min'
      }
    ],
    requiredAttachments: [
      {
        id: 'hvac_trends',
        name: 'HVAC Trend Charts',
        description: 'Temperature, pressure, flow and current trends',
        fileTypes: ['csv', 'xlsx'],
        mandatory: true,
        maxSizeMB: 10
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'HVAC problems involve temperature control, pressure issues, or mechanical failures',
        prompt: 'Upload temp, pressure and current trend. Any refrigerant leaks, trip events, or abnormal noise?',
        examples: ['Temperature control ±5°C from setpoint, compressor tripping on high pressure, refrigerant leak detected'],
        validation: 'Must include temperature, pressure and current data'
      }
    ],
    failureModes: [
      {
        id: 'refrigerant_leak',
        name: 'Refrigerant System Leak',
        description: 'Loss of refrigerant affecting cooling capacity',
        typicalSymptoms: ['Poor cooling', 'Low pressure', 'Ice formation'],
        criticalEvidence: ['hvac_trends'],
        diagnosticQuestions: ['Refrigerant pressure levels?', 'Any visible leaks?'],
        commonCauses: ['Joint failure', 'Corrosion', 'Vibration', 'Age deterioration']
      }
    ],
    smartSuggestions: [],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  // Cranes/Hoists - from user comprehensive data
  cranes_hoists: {
    equipmentType: 'Cranes/Hoists',
    iso14224Code: 'CR-026',
    subtypes: ['Bridge', 'Gantry', 'Jib'],
    requiredTrendData: [
      {
        id: 'crane_load',
        name: 'Load',
        description: 'Current load on crane',
        units: 'tonnes',
        mandatory: true,
        samplingFrequency: '1 min'
      },
      {
        id: 'crane_current',
        name: 'Motor Current',
        description: 'Hoist motor current',
        units: 'A',
        mandatory: true,
        samplingFrequency: '1 min'
      },
      {
        id: 'limit_switch_status',
        name: 'Limit Switch Status',
        description: 'Position limit switches',
        units: 'boolean',
        mandatory: true,
        samplingFrequency: '1 sec'
      },
      {
        id: 'brake_temp',
        name: 'Brake Temperature',
        description: 'Brake system temperature',
        units: '°C',
        mandatory: true,
        samplingFrequency: '5 min'
      }
    ],
    requiredAttachments: [
      {
        id: 'crane_charts',
        name: 'Load/Current Charts',
        description: 'Load and motor current trends, limit switch logs',
        fileTypes: ['csv', 'xlsx'],
        mandatory: true,
        maxSizeMB: 10
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Crane problems involve load handling, brake issues, or structural problems',
        prompt: 'Provide load/motor current trends, limit switch logs. Any brake overheating or trip events?',
        examples: ['Load swinging excessively, brake temperature 95°C, motor current spiking to 150A'],
        validation: 'Must include load data and inspection results'
      }
    ],
    failureModes: [
      {
        id: 'brake_overheating',
        name: 'Crane Brake Overheating',
        description: 'Excessive brake temperature due to overuse or malfunction',
        typicalSymptoms: ['High brake temp', 'Smoking', 'Load slippage'],
        criticalEvidence: ['crane_charts'],
        diagnosticQuestions: ['Brake temperature readings?', 'Frequency of use?'],
        commonCauses: ['Brake adjustment', 'Overloading', 'Brake wear', 'Cooling issues']
      }
    ],
    smartSuggestions: [],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  },

  // Fire Protection Systems - from user comprehensive data
  fire_protection: {
    equipmentType: 'Fire Protection Systems',
    iso14224Code: 'FP-027',
    subtypes: ['Deluge', 'Sprinkler', 'Alarm', 'Hydrant'],
    requiredTrendData: [
      {
        id: 'fire_pressure',
        name: 'System Pressure',
        description: 'Fire water system pressure',
        units: 'bar',
        mandatory: true,
        samplingFrequency: '1 min'
      },
      {
        id: 'fire_flow_test',
        name: 'Flow Test',
        description: 'Flow test results',
        units: 'L/min',
        mandatory: true,
        samplingFrequency: 'Monthly'
      },
      {
        id: 'alarm_history',
        name: 'Alarm History',
        description: 'Fire alarm activation log',
        units: 'count',
        mandatory: true,
        samplingFrequency: 'Event'
      }
    ],
    requiredAttachments: [
      {
        id: 'fire_test_records',
        name: 'Test Records',
        description: 'Pressure/flow test and alarm logs',
        fileTypes: ['pdf', 'csv'],
        mandatory: true,
        maxSizeMB: 5
      }
    ],
    aiPromptTemplates: [
      {
        fieldType: 'observed_problem',
        context: 'Fire protection problems involve pressure loss, flow issues, or system failures',
        prompt: 'Upload pressure/flow test and alarm logs. Any failed activations or leaks?',
        examples: ['System pressure dropped to 5.2 bar, flow test 15% below spec, pump failed to start on demand'],
        validation: 'Must include pressure and flow test data'
      }
    ],
    failureModes: [
      {
        id: 'fire_pump_failure',
        name: 'Fire Pump Failure',
        description: 'Fire pump unable to maintain required pressure/flow',
        typicalSymptoms: ['Low pressure', 'Pump trips', 'Flow deficiency'],
        criticalEvidence: ['fire_test_records'],
        diagnosticQuestions: ['Pump performance vs spec?', 'Any trips or alarms?'],
        commonCauses: ['Pump wear', 'Motor failure', 'Suction problems', 'Control issues']
      }
    ],
    smartSuggestions: [],
    lastUpdated: '2025-01-20',
    updatedBy: 'RCA System Admin'
  }
};

// Administrative functions for library management
export interface LibraryUpdateLog {
  timestamp: string;
  equipmentType: string;
  changeType: 'ADD' | 'MODIFY' | 'DELETE' | 'DEPRECATE';
  fieldChanged: string;
  oldValue?: any;
  newValue?: any;
  updatedBy: string;
  reason: string;
}

export class EvidenceLibraryManager {
  private updateLog: LibraryUpdateLog[] = [];

  addEquipmentProfile(profile: EquipmentEvidenceProfile): void {
    EVIDENCE_REQUIREMENTS_LIBRARY[profile.equipmentType.toLowerCase().replace(' ', '_')] = profile;
    this.logUpdate('ADD', profile.equipmentType, 'equipment_profile', undefined, profile, profile.updatedBy, 'New equipment type added');
  }

  updateTrendRequirement(equipmentType: string, trendId: string, updates: Partial<TrendDataRequirement>, updatedBy: string): void {
    const profile = EVIDENCE_REQUIREMENTS_LIBRARY[equipmentType];
    if (!profile) throw new Error(`Equipment type ${equipmentType} not found`);

    const trendIndex = profile.requiredTrendData.findIndex(t => t.id === trendId);
    if (trendIndex === -1) throw new Error(`Trend ${trendId} not found`);

    const oldValue = { ...profile.requiredTrendData[trendIndex] };
    profile.requiredTrendData[trendIndex] = { ...profile.requiredTrendData[trendIndex], ...updates };
    profile.lastUpdated = new Date().toISOString();
    profile.updatedBy = updatedBy;

    this.logUpdate('MODIFY', equipmentType, `trend_${trendId}`, oldValue, profile.requiredTrendData[trendIndex], updatedBy, 'Trend requirement updated');
  }

  addAIPromptTemplate(equipmentType: string, template: AIPromptTemplate, updatedBy: string): void {
    const profile = EVIDENCE_REQUIREMENTS_LIBRARY[equipmentType];
    if (!profile) throw new Error(`Equipment type ${equipmentType} not found`);

    profile.aiPromptTemplates.push(template);
    profile.lastUpdated = new Date().toISOString();
    profile.updatedBy = updatedBy;

    this.logUpdate('ADD', equipmentType, `ai_prompt_${template.fieldType}`, undefined, template, updatedBy, 'New AI prompt template added');
  }

  exportLibrary(): string {
    return JSON.stringify({
      library: EVIDENCE_REQUIREMENTS_LIBRARY,
      updateLog: this.updateLog,
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  importLibrary(jsonData: string, updatedBy: string): void {
    const data = JSON.parse(jsonData);
    Object.assign(EVIDENCE_REQUIREMENTS_LIBRARY, data.library);
    if (data.updateLog) {
      this.updateLog.push(...data.updateLog);
    }
    this.logUpdate('MODIFY', 'SYSTEM', 'library_import', undefined, 'Library imported', updatedBy, 'Library data imported from backup');
  }

  private logUpdate(changeType: LibraryUpdateLog['changeType'], equipmentType: string, fieldChanged: string, oldValue: any, newValue: any, updatedBy: string, reason: string): void {
    this.updateLog.push({
      timestamp: new Date().toISOString(),
      equipmentType,
      changeType,
      fieldChanged,
      oldValue,
      newValue,
      updatedBy,
      reason
    });
  }

  getUpdateHistory(equipmentType?: string): LibraryUpdateLog[] {
    if (equipmentType) {
      return this.updateLog.filter(log => log.equipmentType === equipmentType);
    }
    return [...this.updateLog];
  }
}

// Helper functions for RCA system integration
export function getEquipmentProfile(equipmentType: string): EquipmentEvidenceProfile | null {
  const key = equipmentType.toLowerCase().replace(' ', '_');
  return EVIDENCE_REQUIREMENTS_LIBRARY[key] || null;
}

export function getRequiredTrendsForEquipment(equipmentType: string): TrendDataRequirement[] {
  const profile = getEquipmentProfile(equipmentType);
  return profile ? profile.requiredTrendData.filter(t => t.mandatory) : [];
}

export function getRequiredAttachmentsForEquipment(equipmentType: string): AttachmentRequirement[] {
  const profile = getEquipmentProfile(equipmentType);
  return profile ? profile.requiredAttachments.filter(a => a.mandatory) : [];
}

export function getAIPromptsForField(equipmentType: string, fieldType: AIPromptTemplate['fieldType']): AIPromptTemplate | null {
  const profile = getEquipmentProfile(equipmentType);
  if (!profile) return null;
  
  return profile.aiPromptTemplates.find(template => template.fieldType === fieldType) || null;
}

export function identifyLikelyFailureMode(equipmentType: string, symptoms: string[]): FailureMode | null {
  const profile = getEquipmentProfile(equipmentType);
  if (!profile) return null;

  // Find failure mode with most matching symptoms
  let bestMatch: FailureMode | null = null;
  let maxMatches = 0;

  for (const failureMode of profile.failureModes) {
    const matches = failureMode.typicalSymptoms.filter(symptom => 
      symptoms.some(userSymptom => userSymptom.toLowerCase().includes(symptom.toLowerCase()))
    ).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = failureMode;
    }
  }

  return bestMatch;
}

export function getSmartSuggestionsForCondition(equipmentType: string, conditions: Record<string, boolean>): string[] {
  const profile = getEquipmentProfile(equipmentType);
  if (!profile) return [];

  return profile.smartSuggestions
    .filter(suggestion => evaluateCondition(suggestion.condition, conditions))
    .map(suggestion => suggestion.suggestion);
}

function evaluateCondition(condition: string, values: Record<string, boolean>): boolean {
  // Simple condition evaluator - can be enhanced for complex logic
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

// Initialize library manager
export const libraryManager = new EvidenceLibraryManager();