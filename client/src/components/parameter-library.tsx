import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Settings, Trash2, Edit, Save, X, Info } from "lucide-react";

interface CustomParameter {
  id: string;
  name: string;
  category: string;
  dataType: 'number' | 'text' | 'select' | 'boolean';
  unit?: string;
  options?: string[];
  equipmentTypes: string[];
  critical: boolean;
  description: string;
}

interface ParameterLibraryProps {
  onParametersUpdate?: (parameters: CustomParameter[]) => void;
}

export default function ParameterLibrary({ onParametersUpdate }: ParameterLibraryProps) {
  const [parameters, setParameters] = useState<CustomParameter[]>([
    // Default critical parameters
    {
      id: 'oil_analysis_iso_code',
      name: 'Oil Analysis ISO Code',
      category: 'lubrication',
      dataType: 'text',
      equipmentTypes: ['pump', 'motor', 'compressor', 'gearbox'],
      critical: true,
      description: 'ISO cleanliness code from oil analysis (e.g., 18/16/13)'
    },
    {
      id: 'bearing_temperature_de',
      name: 'Drive End Bearing Temperature',
      category: 'temperature',
      dataType: 'number',
      unit: '°F',
      equipmentTypes: ['motor', 'pump'],
      critical: true,
      description: 'Temperature of drive end bearing housing'
    },
    {
      id: 'vibration_velocity_rms',
      name: 'Vibration Velocity RMS',
      category: 'vibration',
      dataType: 'number',
      unit: 'in/sec',
      equipmentTypes: ['pump', 'motor', 'compressor', 'turbine'],
      critical: true,
      description: 'Overall RMS vibration velocity measurement'
    },
    {
      id: 'npsh_margin',
      name: 'NPSH Margin',
      category: 'process',
      dataType: 'number',
      unit: 'ft',
      equipmentTypes: ['pump'],
      critical: true,
      description: 'NPSHa - NPSHr margin for cavitation prevention'
    }
  ]);

  const [isAddingParameter, setIsAddingParameter] = useState(false);
  const [editingParameter, setEditingParameter] = useState<CustomParameter | null>(null);
  const [newParameter, setNewParameter] = useState<Partial<CustomParameter>>({
    category: 'basic',
    dataType: 'number',
    equipmentTypes: [],
    critical: false
  });

  const categories = [
    'basic', 'lubrication', 'database-driven', 'temperature', 'vibration', 
    'process', 'environmental', 'runtime', 'alarm', 'maintenance'
  ];

  const equipmentTypes = [
    'pump', 'motor', 'compressor', 'turbine', 'gearbox', 'heat_exchanger', 
    'valve', 'fan', 'blower', 'conveyor', 'crusher', 'mill'
  ];

  const dataTypes = [
    { value: 'number', label: 'Number' },
    { value: 'text', label: 'Text' },
    { value: 'select', label: 'Select Options' },
    { value: 'boolean', label: 'Yes/No' }
  ];

  const handleAddParameter = () => {
    if (!newParameter.name || !newParameter.category || !newParameter.equipmentTypes?.length) {
      return;
    }

    const parameter: CustomParameter = {
      id: (() => {
        const timestamp = new Date().getTime();
        const randomSuffix = (timestamp % 10000);
        return `custom_${timestamp}_${randomSuffix}`;
      })(),
      name: newParameter.name!,
      category: newParameter.category!,
      dataType: newParameter.dataType!,
      unit: newParameter.unit,
      options: newParameter.options,
      equipmentTypes: newParameter.equipmentTypes!,
      critical: newParameter.critical!,
      description: newParameter.description || ''
    };

    const updated = [...parameters, parameter];
    setParameters(updated);
    onParametersUpdate?.(updated);
    
    setNewParameter({
      category: 'basic',
      dataType: 'number',
      equipmentTypes: [],
      critical: false
    });
    setIsAddingParameter(false);
  };

  const handleDeleteParameter = (id: string) => {
    const updated = parameters.filter(p => p.id !== id);
    setParameters(updated);
    onParametersUpdate?.(updated);
  };

  const handleEditParameter = (parameter: CustomParameter) => {
    setEditingParameter(parameter);
  };

  const handleSaveEdit = () => {
    if (!editingParameter) return;

    const updated = parameters.map(p => 
      p.id === editingParameter.id ? editingParameter : p
    );
    setParameters(updated);
    onParametersUpdate?.(updated);
    setEditingParameter(null);
  };

  const getParametersByCategory = (category: string) => {
    return parameters.filter(p => p.category === category);
  };

  const getCriticalParametersCount = () => {
    return parameters.filter(p => p.critical).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Parameter Library</h2>
          <p className="text-muted-foreground">
            Configure custom parameters for equipment-specific RCA analysis
          </p>
        </div>
        <Dialog open={isAddingParameter} onOpenChange={setIsAddingParameter}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Parameter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Custom Parameter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parameter Name</Label>
                  <Input
                    value={newParameter.name || ''}
                    onChange={(e) => setNewParameter(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Coupling Alignment"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={newParameter.category} 
                    onValueChange={(value) => setNewParameter(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Type</Label>
                  <Select 
                    value={newParameter.dataType} 
                    onValueChange={(value) => setNewParameter(prev => ({ ...prev, dataType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dataTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit (optional)</Label>
                  <Input
                    value={newParameter.unit || ''}
                    onChange={(e) => setNewParameter(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="e.g., psi, °F, mils"
                  />
                </div>
              </div>

              {newParameter.dataType === 'select' && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input
                    value={newParameter.options?.join(', ') || ''}
                    onChange={(e) => setNewParameter(prev => ({ 
                      ...prev, 
                      options: e.target.value.split(',').map(s => s.trim()) 
                    }))}
                    placeholder="e.g., Good, Fair, Poor"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Equipment Types</Label>
                <div className="grid grid-cols-3 gap-2">
                  {equipmentTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={type}
                        checked={newParameter.equipmentTypes?.includes(type)}
                        onChange={(e) => {
                          const types = newParameter.equipmentTypes || [];
                          if (e.target.checked) {
                            setNewParameter(prev => ({ 
                              ...prev, 
                              equipmentTypes: [...types, type] 
                            }));
                          } else {
                            setNewParameter(prev => ({ 
                              ...prev, 
                              equipmentTypes: types.filter(t => t !== type) 
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={type} className="text-sm">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newParameter.description || ''}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this parameter measures"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="critical"
                  checked={newParameter.critical}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, critical: e.target.checked }))}
                />
                <Label htmlFor="critical">Critical parameter for RCA analysis</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingParameter(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddParameter}>
                  Add Parameter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{parameters.length}</div>
            <div className="text-sm text-muted-foreground">Total Parameters</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{getCriticalParametersCount()}</div>
            <div className="text-sm text-muted-foreground">Critical Parameters</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{categories.length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{equipmentTypes.length}</div>
            <div className="text-sm text-muted-foreground">Equipment Types</div>
          </CardContent>
        </Card>
      </div>

      {/* Parameters by Category */}
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="lubrication">Lubrication</TabsTrigger>
          <TabsTrigger value="database-driven">Database-Driven</TabsTrigger>
          <TabsTrigger value="process">Process</TabsTrigger>
          <TabsTrigger value="all">All Parameters</TabsTrigger>
        </TabsList>

        {categories.slice(0, 4).map(category => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.charAt(0).toUpperCase() + category.slice(1)} Parameters
                  <Badge variant="outline">
                    {getParametersByCategory(category).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Critical</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getParametersByCategory(category).map(param => (
                      <TableRow key={param.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{param.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {param.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{param.dataType}</Badge>
                        </TableCell>
                        <TableCell>{param.unit || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {param.equipmentTypes.slice(0, 2).map(type => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                            {param.equipmentTypes.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{param.equipmentTypes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {param.critical && (
                            <Badge variant="destructive" className="text-xs">Critical</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditParameter(param)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteParameter(param.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Equipment Types</TableHead>
                    <TableHead>Critical</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.map(param => (
                    <TableRow key={param.id}>
                      <TableCell className="font-medium">{param.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{param.category}</Badge>
                      </TableCell>
                      <TableCell>{param.dataType}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {param.equipmentTypes.slice(0, 3).map(type => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          {param.equipmentTypes.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{param.equipmentTypes.length - 3} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {param.critical && (
                          <Badge variant="destructive" className="text-xs">Critical</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditParameter(param)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteParameter(param.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Best Practices Info */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          <div className="font-medium">Best Practice: Configurable Parameter Library</div>
          <div className="text-sm mt-1">
            Custom parameters allow for equipment-specific analysis. Mark critical parameters that AI should always request 
            when missing. The system learns which parameters matter most for your equipment types and suggests new ones over time.
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}