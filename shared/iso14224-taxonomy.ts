// ISO 14224 Equipment Taxonomy Implementation
// Expandable taxonomy structure for dynamic dropdowns

export interface EquipmentTaxonomy {
  category: string;
  subcategories: EquipmentSubcategory[];
}

export interface EquipmentSubcategory {
  id: string;
  name: string;
  types: string[];
  commonFailureModes: string[];
  specificParameters: ParameterDefinition[];
}

export interface ParameterDefinition {
  id: string;
  name: string;
  type: 'number' | 'text' | 'select' | 'boolean';
  unit?: string;
  options?: string[];
  required: boolean;
}

// ISO 14224 Equipment Taxonomy
export const ISO14224_TAXONOMY: EquipmentTaxonomy[] = [
  {
    category: "Rotating Equipment",
    subcategories: [
      {
        id: "pumps",
        name: "Pumps",
        types: [
          "centrifugal_single_stage",
          "centrifugal_multi_stage", 
          "reciprocating_simplex",
          "reciprocating_duplex",
          "rotary_screw",
          "rotary_gear",
          "diaphragm",
          "submersible"
        ],
        commonFailureModes: [
          "mechanical_seal_failure",
          "bearing_failure", 
          "impeller_damage",
          "shaft_failure",
          "cavitation_damage",
          "corrosion_erosion",
          "vibration_excessive",
          "coupling_failure"
        ],
        specificParameters: [
          { id: "suction_pressure", name: "Suction Pressure", type: "number", unit: "bar", required: true },
          { id: "discharge_pressure", name: "Discharge Pressure", type: "number", unit: "bar", required: true },
          { id: "flow_rate", name: "Flow Rate", type: "number", unit: "m³/h", required: true },
          { id: "operating_speed", name: "Operating Speed", type: "number", unit: "RPM", required: false },
          { id: "vibration_level", name: "Vibration Level", type: "number", unit: "mm/s", required: false },
          { id: "seal_type", name: "Seal Type", type: "select", options: ["mechanical", "gland_packing", "magnetic_drive"], required: false },
          { id: "cavitation_signs", name: "Signs of Cavitation", type: "boolean", required: false }
        ]
      },
      {
        id: "compressors", 
        name: "Compressors",
        types: [
          "centrifugal_single_stage",
          "centrifugal_multi_stage",
          "reciprocating_single_acting", 
          "reciprocating_double_acting",
          "rotary_screw_oil_injected",
          "rotary_screw_oil_free",
          "scroll",
          "diaphragm"
        ],
        commonFailureModes: [
          "bearing_failure",
          "seal_failure", 
          "valve_failure",
          "piston_ring_wear",
          "surge_damage",
          "fouling_deposits",
          "vibration_excessive",
          "overheating"
        ],
        specificParameters: [
          { id: "suction_pressure", name: "Suction Pressure", type: "number", unit: "bar", required: true },
          { id: "discharge_pressure", name: "Discharge Pressure", type: "number", unit: "bar", required: true },
          { id: "discharge_temperature", name: "Discharge Temperature", type: "number", unit: "°C", required: true },
          { id: "operating_speed", name: "Operating Speed", type: "number", unit: "RPM", required: false },
          { id: "surge_detected", name: "Surge Detected", type: "boolean", required: false }
        ]
      },
      {
        id: "motors",
        name: "Motors", 
        types: [
          "induction_squirrel_cage",
          "induction_wound_rotor",
          "synchronous",
          "dc_motor",
          "servo_motor",
          "stepper_motor"
        ],
        commonFailureModes: [
          "bearing_failure",
          "winding_failure",
          "insulation_breakdown", 
          "rotor_bar_failure",
          "overheating",
          "vibration_excessive",
          "brush_wear",
          "coupling_misalignment"
        ],
        specificParameters: [
          { id: "operating_current", name: "Operating Current", type: "number", unit: "A", required: true },
          { id: "operating_voltage", name: "Operating Voltage", type: "number", unit: "V", required: true },
          { id: "power_factor", name: "Power Factor", type: "number", required: false },
          { id: "winding_temperature", name: "Winding Temperature", type: "number", unit: "°C", required: false },
          { id: "insulation_resistance", name: "Insulation Resistance", type: "number", unit: "MΩ", required: false }
        ]
      }
    ]
  },
  {
    category: "Static Equipment",
    subcategories: [
      {
        id: "valves",
        name: "Valves",
        types: [
          "gate_valve",
          "globe_valve", 
          "ball_valve",
          "butterfly_valve",
          "check_valve",
          "control_valve",
          "safety_relief_valve",
          "plug_valve"
        ],
        commonFailureModes: [
          "seat_leakage",
          "stem_leakage", 
          "body_leakage",
          "actuator_failure",
          "positioner_failure",
          "corrosion_erosion",
          "wear_tear",
          "blockage_fouling"
        ],
        specificParameters: [
          { id: "inlet_pressure", name: "Inlet Pressure", type: "number", unit: "bar", required: true },
          { id: "outlet_pressure", name: "Outlet Pressure", type: "number", unit: "bar", required: false },
          { id: "valve_position", name: "Valve Position", type: "number", unit: "%", required: false },
          { id: "actuator_type", name: "Actuator Type", type: "select", options: ["manual", "pneumatic", "electric", "hydraulic"], required: false },
          { id: "leak_location", name: "Leak Location", type: "select", options: ["seat", "stem", "body", "bonnet", "unknown"], required: false }
        ]
      },
      {
        id: "vessels",
        name: "Pressure Vessels",
        types: [
          "storage_tank",
          "reactor",
          "separator",
          "accumulator", 
          "heat_exchanger_shell",
          "column_tower",
          "filter_housing"
        ],
        commonFailureModes: [
          "corrosion_general",
          "corrosion_localized",
          "cracking_fatigue",
          "cracking_stress",
          "erosion",
          "fouling_deposits",
          "mechanical_damage",
          "weld_defects"
        ],
        specificParameters: [
          { id: "operating_pressure", name: "Operating Pressure", type: "number", unit: "bar", required: true },
          { id: "operating_temperature", name: "Operating Temperature", type: "number", unit: "°C", required: true },
          { id: "design_pressure", name: "Design Pressure", type: "number", unit: "bar", required: false },
          { id: "design_temperature", name: "Design Temperature", type: "number", unit: "°C", required: false },
          { id: "last_inspection", name: "Last Inspection Date", type: "text", required: false }
        ]
      }
    ]
  },
  {
    category: "Electrical Equipment", 
    subcategories: [
      {
        id: "switchgear",
        name: "Switchgear",
        types: [
          "low_voltage_switchgear",
          "medium_voltage_switchgear",
          "high_voltage_switchgear",
          "motor_control_center",
          "distribution_board"
        ],
        commonFailureModes: [
          "contact_deterioration",
          "insulation_failure",
          "arc_flash",
          "overheating",
          "mechanical_wear",
          "control_circuit_failure"
        ],
        specificParameters: [
          { id: "operating_voltage", name: "Operating Voltage", type: "number", unit: "V", required: true },
          { id: "load_current", name: "Load Current", type: "number", unit: "A", required: true },
          { id: "trip_record", name: "Recent Trips", type: "text", required: false }
        ]
      }
    ]
  },
  {
    category: "Instrumentation & Control",
    subcategories: [
      {
        id: "sensors",
        name: "Sensors & Transmitters", 
        types: [
          "pressure_transmitter",
          "temperature_transmitter",
          "flow_transmitter", 
          "level_transmitter",
          "vibration_sensor",
          "ph_analyzer",
          "conductivity_analyzer"
        ],
        commonFailureModes: [
          "sensor_drift",
          "calibration_error",
          "wiring_failure",
          "power_supply_failure",
          "environmental_damage",
          "communication_loss"
        ],
        specificParameters: [
          { id: "last_calibration", name: "Last Calibration", type: "text", required: false },
          { id: "measurement_range", name: "Measurement Range", type: "text", required: false },
          { id: "output_signal", name: "Output Signal Type", type: "select", options: ["4-20mA", "0-10V", "digital", "wireless"], required: false }
        ]
      }
    ]
  }
];

// Fault Tree Node Structure
export interface FaultTreeNode {
  id: string;
  type: 'top_event' | 'intermediate_event' | 'basic_event' | 'undeveloped_event';
  description: string;
  gate?: 'AND' | 'OR' | 'INHIBIT' | 'PRIORITY_AND';
  children?: FaultTreeNode[];
  probability?: number;
  evidenceRequired?: string[];
}

// Common Fault Tree Templates by Equipment Type
export const FAULT_TREE_TEMPLATES: Record<string, FaultTreeNode> = {
  pump_failure: {
    id: "pump_failure",
    type: "top_event",
    description: "Pump Failure",
    gate: "OR",
    children: [
      {
        id: "mechanical_failure",
        type: "intermediate_event", 
        description: "Mechanical Failure",
        gate: "OR",
        children: [
          {
            id: "seal_failure",
            type: "basic_event",
            description: "Mechanical Seal Failure",
            evidenceRequired: ["seal_condition", "leak_location", "operating_pressure"]
          },
          {
            id: "bearing_failure", 
            type: "basic_event",
            description: "Bearing Failure",
            evidenceRequired: ["vibration_level", "operating_temperature", "lubrication_condition"]
          },
          {
            id: "impeller_damage",
            type: "basic_event", 
            description: "Impeller Damage",
            evidenceRequired: ["cavitation_signs", "erosion_evidence", "flow_rate"]
          }
        ]
      },
      {
        id: "process_conditions",
        type: "intermediate_event",
        description: "Adverse Process Conditions", 
        gate: "OR",
        children: [
          {
            id: "cavitation",
            type: "basic_event",
            description: "Cavitation",
            evidenceRequired: ["suction_pressure", "npsh_available", "cavitation_signs"]
          },
          {
            id: "dry_running",
            type: "basic_event",
            description: "Dry Running",
            evidenceRequired: ["flow_rate", "suction_level", "pump_protection"]
          }
        ]
      }
    ]
  },
  
  valve_failure: {
    id: "valve_failure",
    type: "top_event", 
    description: "Valve Failure",
    gate: "OR",
    children: [
      {
        id: "internal_leakage",
        type: "intermediate_event",
        description: "Internal Leakage",
        gate: "OR", 
        children: [
          {
            id: "seat_damage",
            type: "basic_event",
            description: "Seat Damage",
            evidenceRequired: ["leak_location", "valve_cycling_frequency", "fluid_properties"]
          },
          {
            id: "foreign_object",
            type: "basic_event",
            description: "Foreign Object in Seat",
            evidenceRequired: ["process_contamination", "upstream_filtration", "maintenance_history"]
          }
        ]
      },
      {
        id: "external_leakage",
        type: "intermediate_event",
        description: "External Leakage",
        gate: "OR",
        children: [
          {
            id: "stem_seal_failure",
            type: "basic_event", 
            description: "Stem Seal Failure",
            evidenceRequired: ["leak_location", "packing_condition", "stem_wear"]
          },
          {
            id: "body_damage",
            type: "basic_event",
            description: "Body/Bonnet Damage", 
            evidenceRequired: ["leak_location", "pressure_rating", "corrosion_evidence"]
          }
        ]
      }
    ]
  }
};

// ECFA (Event-Causal Factor Analysis) Structure for Safety Events
export interface ECFANode {
  id: string;
  type: 'initiating_event' | 'contributing_factor' | 'barrier' | 'outcome';
  description: string;
  category?: 'human' | 'system' | 'environmental' | 'design' | 'management';
  timestamp?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  children?: ECFANode[];
  evidenceRequired?: string[];
}

export const ECFA_TEMPLATES: Record<string, ECFANode> = {
  process_safety_incident: {
    id: "process_safety_incident",
    type: "outcome",
    description: "Process Safety Incident",
    severity: "high",
    children: [
      {
        id: "equipment_failure_initiating",
        type: "initiating_event",
        description: "Equipment Failure",
        children: [
          {
            id: "maintenance_inadequate",
            type: "contributing_factor",
            category: "management",
            description: "Inadequate Maintenance",
            evidenceRequired: ["maintenance_schedule", "work_order_history", "inspection_records"]
          },
          {
            id: "design_deficiency",
            type: "contributing_factor", 
            category: "design",
            description: "Design Deficiency",
            evidenceRequired: ["design_specifications", "modification_history", "operating_conditions"]
          }
        ]
      },
      {
        id: "safeguard_failure",
        type: "barrier",
        description: "Safety System Failure",
        children: [
          {
            id: "alarm_system_failure",
            type: "contributing_factor",
            category: "system", 
            description: "Alarm System Failure",
            evidenceRequired: ["alarm_logs", "system_status", "maintenance_records"]
          }
        ]
      }
    ]
  }
};