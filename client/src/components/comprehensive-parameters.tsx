import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, Plus, Info, AlertTriangle } from "lucide-react";
import type { OperatingParameters } from "@shared/schema";

interface ComprehensiveParametersProps {
  initialParameters?: OperatingParameters;
  equipmentType: string;
  onParametersChange: (parameters: OperatingParameters) => void;
  onComplete?: () => void;
}

export default function ComprehensiveParameters({ 
  initialParameters = {}, 
  equipmentType, 
  onParametersChange,
  onComplete 
}: ComprehensiveParametersProps) {
  const [parameters, setParameters] = useState<OperatingParameters>(initialParameters);
  const [activeTab, setActiveTab] = useState("basic");

  const updateParameter = (category: keyof OperatingParameters, field: string, value: any) => {
    const updated = {
      ...parameters,
      [category]: {
        ...parameters[category],
        [field]: value
      }
    };
    setParameters(updated);
    onParametersChange(updated);
  };

  const getEquipmentSpecificFields = () => {
    const fields = [];
    
    if (['pump', 'compressor'].includes(equipmentType)) {
      fields.push('process', 'lubrication');
    }
    
    if (['motor', 'generator'].includes(equipmentType)) {
      fields.push('electrical', 'lubrication');
    }
    
    if (['pump', 'motor', 'compressor', 'turbine', 'gearbox'].includes(equipmentType)) {
      fields.push('runtime', 'environmental');
    }
    
    return fields;
  };

  const getMissingCriticalParams = () => {
    const missing = [];
    const criticalFields = getEquipmentSpecificFields();
    
    criticalFields.forEach(field => {
      if (!parameters[field as keyof OperatingParameters]) {
        missing.push(field);
      }
    });
    
    return missing;
  };

  return (
    <div className="space-y-6">
      {/* Missing Parameters Alert */}
      {getMissingCriticalParams().length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <div className="font-medium">Missing Critical Parameters</div>
            <div className="text-sm mt-1">
              For better RCA accuracy, consider adding: {getMissingCriticalParams().join(', ')}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="lubrication">Lubrication</TabsTrigger>
          <TabsTrigger value="electrical">Electrical</TabsTrigger>
          <TabsTrigger value="runtime">Runtime</TabsTrigger>
          <TabsTrigger value="environmental">Environment</TabsTrigger>
          <TabsTrigger value="process">Process</TabsTrigger>
        </TabsList>

        {/* Basic Parameters */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Basic Operating Parameters</span>
                <Badge variant="outline">{equipmentType}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pressure */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Suction Pressure</Label>
                  <Input
                    type="number"
                    value={parameters.pressure?.suction || ''}
                    onChange={(e) => updateParameter('pressure', 'suction', parseFloat(e.target.value))}
                    placeholder="psig"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discharge Pressure</Label>
                  <Input
                    type="number"
                    value={parameters.pressure?.discharge || ''}
                    onChange={(e) => updateParameter('pressure', 'discharge', parseFloat(e.target.value))}
                    placeholder="psig"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Flow Rate</Label>
                  <Input
                    type="number"
                    value={parameters.flow?.rate || ''}
                    onChange={(e) => updateParameter('flow', 'rate', parseFloat(e.target.value))}
                    placeholder="gpm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Design Flow</Label>
                  <Input
                    type="number"
                    value={parameters.flow?.design_rate || ''}
                    onChange={(e) => updateParameter('flow', 'design_rate', parseFloat(e.target.value))}
                    placeholder="gpm"
                  />
                </div>
              </div>

              <Separator />

              {/* Temperature & Vibration */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Bearing Temp</Label>
                  <Input
                    type="number"
                    value={parameters.temperature?.bearing || ''}
                    onChange={(e) => updateParameter('temperature', 'bearing', parseFloat(e.target.value))}
                    placeholder="°F"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ambient Temp</Label>
                  <Input
                    type="number"
                    value={parameters.temperature?.ambient || ''}
                    onChange={(e) => updateParameter('temperature', 'ambient', parseFloat(e.target.value))}
                    placeholder="°F"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RPM</Label>
                  <Input
                    type="number"
                    value={parameters.speed?.rpm || ''}
                    onChange={(e) => updateParameter('speed', 'rpm', parseFloat(e.target.value))}
                    placeholder="rpm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Power Consumption</Label>
                  <Input
                    type="number"
                    value={parameters.power?.consumption || ''}
                    onChange={(e) => updateParameter('power', 'consumption', parseFloat(e.target.value))}
                    placeholder="kW"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lubrication Parameters */}
        <TabsContent value="lubrication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lubrication System Parameters</CardTitle>
              <div className="text-sm text-muted-foreground">
                Critical for rotating equipment reliability analysis
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Oil Level</Label>
                  <Select 
                    value={parameters.lubrication?.oil_level || ''} 
                    onValueChange={(value) => updateParameter('lubrication', 'oil_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Oil Pressure (psig)</Label>
                  <Input
                    type="number"
                    value={parameters.lubrication?.oil_pressure || ''}
                    onChange={(e) => updateParameter('lubrication', 'oil_pressure', parseFloat(e.target.value))}
                    placeholder="psig"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Oil Temperature (°F)</Label>
                  <Input
                    type="number"
                    value={parameters.lubrication?.oil_temperature || ''}
                    onChange={(e) => updateParameter('lubrication', 'oil_temperature', parseFloat(e.target.value))}
                    placeholder="°F"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Particle Contamination (ppm)</Label>
                  <Input
                    type="number"
                    value={parameters.lubrication?.oil_condition?.particle_ppm || ''}
                    onChange={(e) => updateParameter('lubrication', 'oil_condition', {
                      ...parameters.lubrication?.oil_condition,
                      particle_ppm: parseFloat(e.target.value)
                    })}
                    placeholder="ppm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Water Content (%)</Label>
                  <Input
                    type="number"
                    value={parameters.lubrication?.oil_condition?.water_content || ''}
                    onChange={(e) => updateParameter('lubrication', 'oil_condition', {
                      ...parameters.lubrication?.oil_condition,
                      water_content: parseFloat(e.target.value)
                    })}
                    placeholder="%"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Electrical Parameters */}
        <TabsContent value="electrical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Electrical Parameters</CardTitle>
              <div className="text-sm text-muted-foreground">
                Critical for motor and electrical equipment analysis
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Current (Amps)</Label>
                  <Input
                    type="number"
                    value={parameters.electrical?.current_amps || ''}
                    onChange={(e) => updateParameter('electrical', 'current_amps', parseFloat(e.target.value))}
                    placeholder="A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Voltage (V)</Label>
                  <Input
                    type="number"
                    value={parameters.electrical?.voltage || ''}
                    onChange={(e) => updateParameter('electrical', 'voltage', parseFloat(e.target.value))}
                    placeholder="V"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Power Factor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={parameters.electrical?.power_factor || ''}
                    onChange={(e) => updateParameter('electrical', 'power_factor', parseFloat(e.target.value))}
                    placeholder="0.85"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Insulation Resistance (MΩ)</Label>
                  <Input
                    type="number"
                    value={parameters.electrical?.insulation_resistance || ''}
                    onChange={(e) => updateParameter('electrical', 'insulation_resistance', parseFloat(e.target.value))}
                    placeholder="MΩ"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Runtime Parameters */}
        <TabsContent value="runtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Runtime & Duty Cycle</CardTitle>
              <div className="text-sm text-muted-foreground">
                Operating history and usage patterns
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Hours Since Maintenance</Label>
                  <Input
                    type="number"
                    value={parameters.runtime?.hours_since_maintenance || ''}
                    onChange={(e) => updateParameter('runtime', 'hours_since_maintenance', parseFloat(e.target.value))}
                    placeholder="hours"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start/Stop Cycles</Label>
                  <Input
                    type="number"
                    value={parameters.runtime?.start_stop_cycles || ''}
                    onChange={(e) => updateParameter('runtime', 'start_stop_cycles', parseFloat(e.target.value))}
                    placeholder="cycles"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duty Cycle (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={parameters.runtime?.duty_cycle_percentage || ''}
                    onChange={(e) => updateParameter('runtime', 'duty_cycle_percentage', parseFloat(e.target.value))}
                    placeholder="%"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environmental Parameters */}
        <TabsContent value="environmental" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environmental Conditions</CardTitle>
              <div className="text-sm text-muted-foreground">
                External factors affecting equipment reliability
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Ambient Temperature (°F)</Label>
                  <Input
                    type="number"
                    value={parameters.environmental?.ambient_temperature || ''}
                    onChange={(e) => updateParameter('environmental', 'ambient_temperature', parseFloat(e.target.value))}
                    placeholder="°F"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Humidity (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={parameters.environmental?.humidity_percentage || ''}
                    onChange={(e) => updateParameter('environmental', 'humidity_percentage', parseFloat(e.target.value))}
                    placeholder="%"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dust Level</Label>
                  <Select 
                    value={parameters.environmental?.dust_level || ''} 
                    onValueChange={(value) => updateParameter('environmental', 'dust_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Process Parameters */}
        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process Conditions</CardTitle>
              <div className="text-sm text-muted-foreground">
                Process-specific parameters for pumps and process equipment
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>NPSH Available (ft)</Label>
                  <Input
                    type="number"
                    value={parameters.process?.npsh_available || ''}
                    onChange={(e) => updateParameter('process', 'npsh_available', parseFloat(e.target.value))}
                    placeholder="ft"
                  />
                </div>
                <div className="space-y-2">
                  <Label>NPSH Required (ft)</Label>
                  <Input
                    type="number"
                    value={parameters.process?.npsh_required || ''}
                    onChange={(e) => updateParameter('process', 'npsh_required', parseFloat(e.target.value))}
                    placeholder="ft"
                  />
                </div>
                <div className="space-y-2">
                  <Label>pH Level</Label>
                  <Input
                    type="number"
                    min="0"
                    max="14"
                    step="0.1"
                    value={parameters.process?.ph_level || ''}
                    onChange={(e) => updateParameter('process', 'ph_level', parseFloat(e.target.value))}
                    placeholder="7.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Solids Content (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={parameters.process?.solids_content_percentage || ''}
                    onChange={(e) => updateParameter('process', 'solids_content_percentage', parseFloat(e.target.value))}
                    placeholder="%"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Media Type</Label>
                <Select 
                  value={parameters.process?.media_type || ''} 
                  onValueChange={(value) => updateParameter('process', 'media_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select media type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="oil">Oil</SelectItem>
                    <SelectItem value="slurry">Slurry</SelectItem>
                    <SelectItem value="chemical">Chemical</SelectItem>
                    <SelectItem value="steam">Steam</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onComplete}>
          Save Parameters
        </Button>
        <Button onClick={onComplete}>
          Continue Analysis
        </Button>
      </div>
    </div>
  );
}