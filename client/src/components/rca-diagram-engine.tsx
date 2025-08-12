import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Network, 
  GitBranch, 
  Clock, 
  Shield, 
  Eye, 
  Edit3, 
  Plus, 
  Trash2,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download
} from "lucide-react";

interface RCANode {
  id: string;
  label: string;
  type: 'root_cause' | 'contributing_factor' | 'immediate_cause' | 'top_event' | 'barrier' | 'threat';
  confidence: number;
  evidence: string[];
  children?: RCANode[];
  parent?: string;
  position?: { x: number; y: number };
  category?: string;
}

interface RCADiagramEngineProps {
  analysisData: any;
  investigationType: 'equipment_failure' | 'safety_incident';
  onNodeUpdate: (nodeId: string, updates: Partial<RCANode>) => void;
  onNodeAdd: (parentId: string, newNode: Omit<RCANode, 'id'>) => void;
  onNodeDelete: (nodeId: string) => void;
}

export default function RCADiagramEngine({ 
  analysisData, 
  investigationType,
  onNodeUpdate,
  onNodeAdd,
  onNodeDelete 
}: RCADiagramEngineProps) {
  const [currentView, setCurrentView] = useState<'tree' | 'fishbone' | 'timeline' | 'bowtie'>('tree');
  const [selectedNode, setSelectedNode] = useState<RCANode | null>(null);
  const [nodes, setNodes] = useState<RCANode[]>([]);
  const [zoom, setZoom] = useState(1);
  const [editingNode, setEditingNode] = useState<RCANode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (analysisData) {
      parseAnalysisData();
    }
  }, [analysisData]);

  const parseAnalysisData = () => {
    if (!analysisData?.causes) return;

    const parsedNodes: RCANode[] = [];
    
    // Parse the analysis results into node structure
    if (investigationType === 'equipment_failure') {
      // Fault Tree Analysis structure
      const topEvent: RCANode = {
        id: 'top-event',
        label: analysisData.topEvent || 'Equipment Failure',
        type: 'top_event',
        confidence: analysisData.confidence || 0.8,
        evidence: ['Equipment failed during operation'],
        position: { x: 400, y: 50 }
      };
      parsedNodes.push(topEvent);

      // Parse causes
      analysisData.causes.forEach((cause: any, index: number) => {
        const node: RCANode = {
          id: `cause-${index}`,
          label: cause.description || cause.name || 'Unknown Cause',
          type: cause.type === 'root' ? 'root_cause' : 'contributing_factor',
          confidence: cause.confidence || 0.7,
          evidence: cause.evidence || [],
          parent: 'top-event',
          category: cause.category || 'Technical',
          position: { x: 200 + (index * 250), y: 200 }
        };
        parsedNodes.push(node);

        // Add sub-causes if they exist
        if (cause.subCauses) {
          cause.subCauses.forEach((subCause: any, subIndex: number) => {
            const subNode: RCANode = {
              id: `subcause-${index}-${subIndex}`,
              label: subCause.description || subCause.name,
              type: 'immediate_cause',
              confidence: subCause.confidence || 0.6,
              evidence: subCause.evidence || [],
              parent: `cause-${index}`,
              position: { x: 150 + (index * 250) + (subIndex * 100), y: 350 }
            };
            parsedNodes.push(subNode);
          });
        }
      });
    } else {
      // ECFA structure for safety incidents
      const topEvent: RCANode = {
        id: 'incident',
        label: 'Safety Incident',
        type: 'top_event',
        confidence: 1.0,
        evidence: ['Incident occurred'],
        position: { x: 400, y: 50 }
      };
      parsedNodes.push(topEvent);

      // Add event sequence and causal factors
      if (analysisData.eventSequence) {
        analysisData.eventSequence.forEach((event: any, index: number) => {
          const node: RCANode = {
            id: `event-${index}`,
            label: event.description,
            type: 'contributing_factor',
            confidence: event.confidence || 0.8,
            evidence: event.evidence || [],
            parent: index === 0 ? 'incident' : `event-${index - 1}`,
            position: { x: 200 + (index * 200), y: 150 + (index * 50) }
          };
          parsedNodes.push(node);
        });
      }
    }

    setNodes(parsedNodes);
  };

  const handleNodeClick = (node: RCANode) => {
    setSelectedNode(node);
  };

  const handleNodeEdit = (node: RCANode) => {
    setEditingNode(node);
  };

  const handleNodeSave = (updates: Partial<RCANode>) => {
    if (editingNode) {
      const updatedNodes = nodes.map(n => 
        n.id === editingNode.id ? { ...n, ...updates } : n
      );
      setNodes(updatedNodes);
      onNodeUpdate(editingNode.id, updates);
      setEditingNode(null);
    }
  };

  const handleAddChild = (parentNode: RCANode) => {
    const newNode: Omit<RCANode, 'id'> = {
      label: 'New Cause',
      type: 'contributing_factor',
      confidence: 0.5,
      evidence: [],
      parent: parentNode.id,
      position: { 
        x: parentNode.position!.x + 100, 
        y: parentNode.position!.y + 150 
      }
    };
    
    const nodeWithId: RCANode = {
      ...newNode,
      id: (() => {
        const timestamp = new Date().getTime();
        const randomSuffix = (timestamp % 10000);
        return `new-${timestamp}-${randomSuffix}`;
      })()
    };
    
    setNodes([...nodes, nodeWithId]);
    onNodeAdd(parentNode.id, newNode);
  };

  const renderTreeView = () => {
    const rootNodes = nodes.filter(n => !n.parent || n.type === 'top_event');
    
    return (
      <div className="relative w-full h-96 overflow-auto border rounded-lg bg-gray-50">
        <svg
          ref={svgRef}
          width="800"
          height="600"
          viewBox="0 0 800 600"
          className="w-full h-full"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Render connections */}
          {nodes.map(node => {
            if (!node.parent || !node.position) return null;
            const parent = nodes.find(n => n.id === node.parent);
            if (!parent?.position) return null;
            
            return (
              <line
                key={`line-${node.id}`}
                x1={parent.position.x}
                y1={parent.position.y + 30}
                x2={node.position.x}
                y2={node.position.y}
                stroke="#6b7280"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6b7280"
              />
            </marker>
          </defs>
          
          {/* Render nodes */}
          {nodes.map(node => {
            if (!node.position) return null;
            
            const nodeColor = getNodeColor(node.type);
            const isSelected = selectedNode?.id === node.id;
            
            return (
              <g key={node.id}>
                <rect
                  x={node.position.x - 60}
                  y={node.position.y - 15}
                  width="120"
                  height="30"
                  rx="5"
                  fill={nodeColor}
                  stroke={isSelected ? "#2563eb" : "#d1d5db"}
                  strokeWidth={isSelected ? "3" : "1"}
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(node)}
                />
                <text
                  x={node.position.x}
                  y={node.position.y + 5}
                  textAnchor="middle"
                  fontSize="12"
                  fill="white"
                  className="pointer-events-none"
                >
                  {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
                </text>
                
                {/* Confidence badge */}
                <circle
                  cx={node.position.x + 50}
                  cy={node.position.y - 10}
                  r="8"
                  fill="#059669"
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(node)}
                />
                <text
                  x={node.position.x + 50}
                  y={node.position.y - 6}
                  textAnchor="middle"
                  fontSize="8"
                  fill="white"
                  className="pointer-events-none"
                >
                  {Math.round(node.confidence * 100)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderFishboneView = () => {
    const categories = ['People', 'Process', 'Equipment', 'Environment', 'Materials', 'Methods'];
    const topEvent = nodes.find(n => n.type === 'top_event');
    
    return (
      <div className="relative w-full h-96 overflow-auto border rounded-lg bg-gray-50">
        <svg width="800" height="400" viewBox="0 0 800 400" className="w-full h-full">
          {/* Main spine */}
          <line x1="100" y1="200" x2="700" y2="200" stroke="#374151" strokeWidth="4" />
          
          {/* Problem box */}
          <rect
            x="680"
            y="170"
            width="100"
            height="60"
            rx="5"
            fill="#dc2626"
            stroke="#991b1b"
            strokeWidth="2"
          />
          <text
            x="730"
            y="190"
            textAnchor="middle"
            fontSize="12"
            fill="white"
          >
            {topEvent?.label || 'Problem'}
          </text>
          <text
            x="730"
            y="205"
            textAnchor="middle"
            fontSize="10"
            fill="white"
          >
            Event
          </text>
          
          {/* Category branches */}
          {categories.map((category, index) => {
            const isTop = index % 2 === 0;
            const x = 150 + (index * 90);
            const y1 = 200;
            const y2 = isTop ? 120 : 280;
            
            // Get causes for this category
            const categoryCauses = nodes.filter(n => 
              n.category === category || (category === 'Equipment' && n.type !== 'top_event')
            ).slice(0, 3);
            
            return (
              <g key={category}>
                {/* Main branch */}
                <line
                  x1={x}
                  y1={y1}
                  x2={x}
                  y2={y2}
                  stroke="#6b7280"
                  strokeWidth="3"
                />
                
                {/* Category label */}
                <rect
                  x={x - 30}
                  y={y2 - 15}
                  width="60"
                  height="30"
                  rx="3"
                  fill="#3b82f6"
                  stroke="#1e40af"
                />
                <text
                  x={x}
                  y={y2 + 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                >
                  {category}
                </text>
                
                {/* Sub-branches for causes */}
                {categoryCauses.map((cause, causeIndex) => {
                  const subX = x + (isTop ? -60 + (causeIndex * 30) : -60 + (causeIndex * 30));
                  const subY = y2 + (isTop ? -40 : 40);
                  
                  return (
                    <g key={cause.id}>
                      <line
                        x1={x}
                        y1={y2}
                        x2={subX}
                        y2={subY}
                        stroke="#9ca3af"
                        strokeWidth="2"
                      />
                      <rect
                        x={subX - 25}
                        y={subY - 10}
                        width="50"
                        height="20"
                        rx="3"
                        fill={getNodeColor(cause.type)}
                        className="cursor-pointer"
                        onClick={() => handleNodeClick(cause)}
                      />
                      <text
                        x={subX}
                        y={subY + 5}
                        textAnchor="middle"
                        fontSize="8"
                        fill="white"
                        className="pointer-events-none"
                      >
                        {cause.label.substring(0, 8)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderTimelineView = () => {
    const timelineNodes = nodes.filter(n => n.type !== 'top_event').sort((a, b) => a.id.localeCompare(b.id));
    
    return (
      <div className="relative w-full h-96 overflow-auto border rounded-lg bg-gray-50">
        <svg width="800" height="300" viewBox="0 0 800 300" className="w-full h-full">
          {/* Timeline line */}
          <line x1="50" y1="150" x2="750" y2="150" stroke="#374151" strokeWidth="3" />
          
          {/* Timeline events */}
          {timelineNodes.map((node, index) => {
            const x = 80 + (index * 120);
            const y = 150;
            const isAbove = index % 2 === 0;
            const textY = isAbove ? y - 40 : y + 60;
            
            return (
              <g key={node.id}>
                {/* Timeline marker */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={getNodeColor(node.type)}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(node)}
                />
                
                {/* Connecting line */}
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={textY + (isAbove ? 15 : -15)}
                  stroke="#6b7280"
                  strokeWidth="2"
                />
                
                {/* Event box */}
                <rect
                  x={x - 40}
                  y={textY - 15}
                  width="80"
                  height="30"
                  rx="5"
                  fill={getNodeColor(node.type)}
                  stroke="#d1d5db"
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(node)}
                />
                <text
                  x={x}
                  y={textY}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                >
                  {node.label.substring(0, 12)}
                </text>
                <text
                  x={x}
                  y={textY + 10}
                  textAnchor="middle"
                  fontSize="8"
                  fill="white"
                >
                  {Math.round(node.confidence * 100)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderBowtieView = () => {
    const topEvent = nodes.find(n => n.type === 'top_event');
    const threats = nodes.filter(n => n.type === 'root_cause');
    const consequences = nodes.filter(n => n.type === 'contributing_factor');
    
    return (
      <div className="relative w-full h-96 overflow-auto border rounded-lg bg-gray-50">
        <svg width="800" height="400" viewBox="0 0 800 400" className="w-full h-full">
          {/* Central event */}
          <rect
            x="350"
            y="175"
            width="100"
            height="50"
            rx="5"
            fill="#dc2626"
            stroke="#991b1b"
            strokeWidth="2"
          />
          <text
            x="400"
            y="195"
            textAnchor="middle"
            fontSize="12"
            fill="white"
          >
            {topEvent?.label || 'Top Event'}
          </text>
          <text
            x="400"
            y="210"
            textAnchor="middle"
            fontSize="10"
            fill="white"
          >
            Failure
          </text>
          
          {/* Threats (left side) */}
          {threats.map((threat, index) => {
            const y = 100 + (index * 60);
            
            return (
              <g key={threat.id}>
                <line x1="250" y1={y + 15} x2="350" y2="200" stroke="#6b7280" strokeWidth="2" />
                <rect
                  x="150"
                  y={y}
                  width="100"
                  height="30"
                  rx="5"
                  fill="#f59e0b"
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(threat)}
                />
                <text
                  x="200"
                  y={y + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                >
                  {threat.label.substring(0, 15)}
                </text>
              </g>
            );
          })}
          
          {/* Consequences (right side) */}
          {consequences.map((consequence, index) => {
            const y = 100 + (index * 60);
            
            return (
              <g key={consequence.id}>
                <line x1="450" y1="200" x2="550" y2={y + 15} stroke="#6b7280" strokeWidth="2" />
                <rect
                  x="550"
                  y={y}
                  width="100"
                  height="30"
                  rx="5"
                  fill="#ef4444"
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(consequence)}
                />
                <text
                  x="600"
                  y={y + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                >
                  {consequence.label.substring(0, 15)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'root_cause': return '#dc2626';
      case 'contributing_factor': return '#f59e0b';
      case 'immediate_cause': return '#3b82f6';
      case 'top_event': return '#7c2d12';
      case 'barrier': return '#059669';
      case 'threat': return '#b45309';
      default: return '#6b7280';
    }
  };

  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case 'root_cause': return 'Root Cause';
      case 'contributing_factor': return 'Contributing Factor';
      case 'immediate_cause': return 'Immediate Cause';
      case 'top_event': return 'Top Event';
      case 'barrier': return 'Barrier';
      case 'threat': return 'Threat';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Interactive RCA Diagrams</h2>
          <Badge variant="outline">{nodes.length} nodes</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-mono">{Math.round(zoom * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(1)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Diagram tabs */}
      <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tree" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            RCA Tree
          </TabsTrigger>
          <TabsTrigger value="fishbone" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Fishbone
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="bowtie" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Bowtie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tree">
          <Card>
            <CardHeader>
              <CardTitle>Fault Tree Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTreeView()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fishbone">
          <Card>
            <CardHeader>
              <CardTitle>Fishbone Diagram</CardTitle>
            </CardHeader>
            <CardContent>
              {renderFishboneView()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>ECFA Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTimelineView()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bowtie">
          <Card>
            <CardHeader>
              <CardTitle>Bowtie Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {renderBowtieView()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected node details panel */}
      {selectedNode && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Node Details: {selectedNode.label}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNodeEdit(selectedNode)}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddChild(selectedNode)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Child
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-600">Type</div>
                <Badge variant="outline">{getNodeTypeLabel(selectedNode.type)}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Confidence</div>
                <div className="text-lg font-bold text-green-600">
                  {Math.round(selectedNode.confidence * 100)}%
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm font-medium text-gray-600 mb-2">Supporting Evidence</div>
                <div className="space-y-1">
                  {selectedNode.evidence.length > 0 ? (
                    selectedNode.evidence.map((evidence, index) => (
                      <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {evidence}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">No evidence recorded</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit node dialog */}
      <Dialog open={!!editingNode} onOpenChange={(open) => !open && setEditingNode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Node: {editingNode?.label}</DialogTitle>
          </DialogHeader>
          {editingNode && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Label</label>
                <Input
                  defaultValue={editingNode.label}
                  onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confidence (0-1)</label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue={editingNode.confidence}
                  onChange={(e) => setEditingNode({ ...editingNode, confidence: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Evidence (one per line)</label>
                <Textarea
                  defaultValue={editingNode.evidence.join('\n')}
                  onChange={(e) => setEditingNode({ 
                    ...editingNode, 
                    evidence: e.target.value.split('\n').filter(line => line.trim()) 
                  })}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingNode(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleNodeSave(editingNode)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}