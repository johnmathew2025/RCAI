import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";

interface RCATreeProps {
  analysis: any;
  incident?: any;
  onEdit?: (analysis: any) => void;
}

interface TreeNode {
  id: string;
  label: string;
  confidence: number;
  evidence: string[];
  children?: TreeNode[];
  type: 'root' | 'primary' | 'secondary' | 'evidence';
}

export default function RCATreeVisualization({ analysis, incident, onEdit }: RCATreeProps) {
  const [viewMode, setViewMode] = useState<'tree' | 'fishbone'>('tree');
  const [zoom, setZoom] = useState(1);

  // Generate tree structure from analysis data with enhanced universal logic
  const generateTreeData = (): TreeNode & { 
    equipmentContext?: string; 
    evidenceAdequacy?: number; 
    eliminatedCauses?: TreeNode[];
    originalSymptoms?: string[];
    operatingContext?: string[];
  } => {
    if (!analysis) {
      return {
        id: 'root',
        label: 'No Analysis Data',
        confidence: 0,
        evidence: [],
        type: 'root'
      };
    }

    // Universal equipment identification logic - works for ANY equipment combination
    const equipmentContext = analysis.equipmentGroup && analysis.equipmentType 
      ? `${analysis.equipmentGroup} → ${analysis.equipmentType}${analysis.equipmentSubtype ? ` → ${analysis.equipmentSubtype}` : ''}`
      : 'Equipment Type Not Specified';
      
    // Universal equipment ID/tag extraction from incident data
    const equipmentId = analysis.equipmentId || incident?.equipmentId || analysis.equipmentTag || 'ID Not Specified';
      
    const rootCause = analysis.failureMode || analysis.rootCause || 'Equipment Failure';
    
    // Extract original symptoms from incident data (universal for all equipment)
    const originalSymptoms: string[] = [];
    if (analysis.symptoms) originalSymptoms.push(...analysis.symptoms);
    if (analysis.description) originalSymptoms.push(`Reported: ${analysis.description}`);
    
    // Extract operating context (universal approach)
    const operatingContext: string[] = [];
    if (analysis.operatingParameters) {
      const params = analysis.operatingParameters;
      Object.keys(params).forEach(key => {
        if (params[key] && typeof params[key] === 'object') {
          Object.entries(params[key]).forEach(([subKey, value]) => {
            operatingContext.push(`${key}.${subKey}: ${value}`);
          });
        } else if (params[key]) {
          operatingContext.push(`${key}: ${params[key]}`);
        }
      });
    }
    
    // Calculate evidence adequacy score (universal formula)
    let evidenceAdequacy = 0;
    const evidenceFactors = [
      analysis.evidenceFiles?.length || 0, // Files uploaded
      analysis.evidenceChecklist?.filter((item: any) => item.completed)?.length || 0, // Checklist completion
      analysis.crossMatchResults?.libraryMatches?.length || 0, // Library matches
      originalSymptoms.length, // Symptom detail
      operatingContext.length // Operating context detail
    ];
    evidenceAdequacy = Math.min(100, Math.round((evidenceFactors.reduce((a, b) => a + b, 0) / 15) * 100));
    
    // Extract contributing factors from analysis results
    const contributingFactors: TreeNode[] = [];
    
    // Extract eliminated causes (universal logic for all equipment)
    const eliminatedCauses: TreeNode[] = [];
    if (analysis.eliminationResults) {
      analysis.eliminationResults.forEach((elimination: any, index: number) => {
        eliminatedCauses.push({
          id: `eliminated-${index}`,
          label: elimination.failureMode || `Eliminated Cause ${index + 1}`,
          confidence: 0, // Eliminated = 0% confidence
          evidence: [elimination.reason || 'Eliminated by analysis'],
          type: 'evidence'
        });
      });
    }

    // Extract root causes from analysis
    if (analysis.rootCauses && Array.isArray(analysis.rootCauses)) {
      analysis.rootCauses.forEach((cause: any, index: number) => {
        contributingFactors.push({
          id: `root-cause-${index}`,
          label: cause.description || cause.title || `Root Cause ${index + 1}`,
          confidence: cause.confidence || 75,
          evidence: cause.evidence || [cause.rationale || 'Analysis evidence'],
          type: 'primary',
          children: cause.contributingFactors?.map((factor: any, factorIndex: number) => ({
            id: `factor-${index}-${factorIndex}`,
            label: factor.description || factor.name || `Contributing Factor ${factorIndex + 1}`,
            confidence: factor.confidence || 70,
            evidence: factor.evidence || [],
            type: 'secondary'
          })) || []
        });
      });
    }

    // Extract recommendations as potential preventive measures
    if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
      const preventiveMeasures = analysis.recommendations.slice(0, 3).map((rec: any, index: number) => ({
        id: `prevention-${index}`,
        label: rec.title || rec.description || `Preventive Measure ${index + 1}`,
        confidence: 90,
        evidence: [rec.rationale || 'Recommended prevention'],
        type: 'evidence' as const
      }));

      if (preventiveMeasures.length > 0) {
        contributingFactors.push({
          id: 'prevention-root',
          label: 'Preventive Measures',
          confidence: 90,
          evidence: ['Analysis recommendations'],
          type: 'primary',
          children: preventiveMeasures
        });
      }
    }

    // Add default contributing factors if none detected
    if (contributingFactors.length === 0) {
      contributingFactors.push({
        id: 'default-factor',
        label: 'Analysis Results',
        confidence: analysis.overallConfidence || 75,
        evidence: ['AI analysis findings'],
        type: 'primary',
        children: [
          {
            id: 'default-evidence',
            label: 'Investigation Evidence',
            confidence: 70,
            evidence: ['Collected evidence from investigation'],
            type: 'evidence'
          }
        ]
      });
    }

    // Return the enhanced tree structure with universal context
    return {
      id: 'root',
      label: rootCause,
      confidence: analysis.overallConfidence || 85,
      evidence: ['Analysis results'],
      type: 'root',
      children: contributingFactors,
      equipmentContext,
      equipmentId,
      evidenceAdequacy,
      eliminatedCauses,
      originalSymptoms,
      operatingContext
    };
  };

  const treeData = generateTreeData();

  // Enhanced causal arrow connector with cause → effect indicators (universal for all failure types)
  const renderCausalArrow = (fromType: string, toType: string, parentLabel?: string, childLabel?: string) => {
    const getArrowColor = () => {
      if (fromType === 'root' && toType === 'primary') return 'text-red-600';
      if (fromType === 'primary' && toType === 'secondary') return 'text-orange-600';
      return 'text-blue-600';
    };
    
    const getArrowLabel = () => {
      if (fromType === 'root') return 'causes';
      if (fromType === 'primary') return 'leads to';
      return 'results in';
    };
    
    return (
      <div className={`flex items-center justify-center my-3 ${getArrowColor()}`}>
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
          <div className="text-lg font-bold">↓</div>
          <span className="text-xs font-medium">{getArrowLabel()}</span>
          <div className="text-lg font-bold">→</div>
        </div>
      </div>
    );
  };

  // Enhanced tree node rendering with color coding and tooltips (universal logic)
  const renderTreeNode = (node: TreeNode, depth: number = 0, parentType?: string): JSX.Element => {
    // Universal color coding system based on node type and confidence
    const getNodeColor = (type: string, confidence: number) => {
      const baseColors = {
        root: 'bg-red-50 border-red-400 text-red-900 shadow-red-100',
        primary: 'bg-orange-50 border-orange-400 text-orange-900 shadow-orange-100', 
        secondary: 'bg-blue-50 border-blue-400 text-blue-900 shadow-blue-100',
        evidence: 'bg-green-50 border-green-400 text-green-900 shadow-green-100',
        recommendation: 'bg-purple-50 border-purple-400 text-purple-900 shadow-purple-100'
      };
      
      // Low confidence gets muted colors (universal rule)
      if (confidence < 60) {
        return baseColors[type as keyof typeof baseColors]?.replace('50', '25').replace('400', '300') || 'bg-gray-50 border-gray-300 text-gray-700';
      }
      
      return baseColors[type as keyof typeof baseColors] || 'bg-gray-50 border-gray-400 text-gray-800';
    };
    
    // Universal confidence explanation generator
    const getConfidenceExplanation = (node: TreeNode) => {
      const factors = [];
      if (node.evidence && node.evidence.length > 0) factors.push(`${node.evidence.length} evidence item(s)`);
      if (analysis?.crossMatchResults?.libraryMatches) factors.push('Library pattern match');
      if (analysis?.eliminationResults?.eliminationReasons?.length) factors.push('Elimination logic applied');
      if (node.confidence >= 80) factors.push('High data quality');
      else if (node.confidence >= 60) factors.push('Moderate data quality');
      else factors.push('Limited data available');
      
      return `Confidence ${node.confidence}% based on: ${factors.join(', ')}`;
    };

    return (
      <div key={node.id} className={`ml-${depth * 8} mb-4`}>
        {/* Causal arrow from parent (universal logic) */}
        {parentType && depth > 0 && renderCausalArrow(parentType, node.type)}
        
        <div 
          className={`inline-block p-4 rounded-lg border-2 shadow-lg ${getNodeColor(node.type, node.confidence)} max-w-md hover:shadow-xl transition-shadow cursor-help`}
          title={getConfidenceExplanation(node)}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">{node.label}</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium">
                {node.confidence}%
              </Badge>
              <div className="text-xs px-2 py-1 bg-white/70 rounded-full">
                {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
              </div>
            </div>
          </div>
          
          {node.evidence && node.evidence.length > 0 && (
            <div className="text-xs opacity-90 bg-white/50 p-2 rounded border mb-2">
              <strong>Evidence:</strong> {node.evidence[0]}
              {node.evidence.length > 1 && <span className="text-gray-600"> (+{node.evidence.length - 1} more)</span>}
            </div>
          )}
          
          {/* Show failure logic connection for root nodes */}
          {node.type === 'root' && node.children && node.children.length > 0 && (
            <div className="text-xs mt-2 p-2 bg-white/70 rounded border border-dashed">
              <strong>Failure Logic:</strong> {node.children.length} contributing factor{node.children.length > 1 ? 's' : ''} identified
            </div>
          )}
          
          {/* Confidence explanation tooltip on hover */}
          <div className="text-xs mt-1 opacity-60">
            Hover for confidence explanation
          </div>
        </div>
        
        {node.children && node.children.map(child => renderTreeNode(child, depth + 1, node.type))}
      </div>
    );
  };

  // Fishbone diagram nodes
  const renderFishboneNode = (node: TreeNode, position: string) => {
    return (
      <div key={node.id} className={`p-2 rounded border ${position === 'main' ? 'bg-red-100 border-red-300' : 'bg-blue-100 border-blue-300'} text-sm`}>
        <div className="font-semibold">{node.label}</div>
        <div className="text-xs">Confidence: {node.confidence}%</div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'tree' | 'fishbone')}>
          <TabsList>
            <TabsTrigger value="tree">Tree View</TabsTrigger>
            <TabsTrigger value="fishbone">Fishbone View</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(1)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="bg-white border rounded-lg p-6 min-h-[400px] overflow-auto" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        {viewMode === 'tree' ? (
          <div className="space-y-4">
            {/* Enhanced header with equipment ID/type and comprehensive context */}
            <div className="text-center mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Root Cause Analysis Tree</h3>
              
              {/* Equipment ID and Type Display (Universal) */}
              <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-blue-700">Equipment ID:</strong> 
                    <span className="ml-2 font-mono bg-blue-50 px-2 py-1 rounded">{treeData.equipmentId}</span>
                  </div>
                  <div>
                    <strong className="text-green-700">Equipment Type:</strong> 
                    <span className="ml-2 text-green-800">{treeData.equipmentContext}</span>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <strong className="text-purple-700">Analysis Confidence:</strong> 
                  <span className="ml-2 text-purple-800 font-semibold">{analysis?.overallConfidence || 0}%</span>
                </div>
              </div>
              
              {/* Quality Indicators */}
              <div className="flex justify-center items-center gap-4 flex-wrap">
                <Badge variant={treeData.evidenceAdequacy >= 80 ? 'default' : treeData.evidenceAdequacy >= 60 ? 'secondary' : 'destructive'} className="text-sm">
                  Evidence Quality: {treeData.evidenceAdequacy}%
                </Badge>
                {treeData.eliminatedCauses && treeData.eliminatedCauses.length > 0 && (
                  <Badge variant="outline" className="text-sm">
                    {treeData.eliminatedCauses.length} Causes Eliminated
                  </Badge>
                )}
                
                {/* Node Type Legend */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-200 border border-red-400 rounded"></div>
                    <span>Root</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-200 border border-orange-400 rounded"></div>
                    <span>Primary</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded"></div>
                    <span>Secondary</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
                    <span>Evidence</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Original symptoms and operating context (universal) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {treeData.originalSymptoms && treeData.originalSymptoms.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border-2 border-blue-300 shadow-md">
                  <h4 className="font-bold text-sm text-blue-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">🔍</span> Initial Symptoms
                    <Badge variant="default" className="text-xs">Starting Point</Badge>
                  </h4>
                  <div className="space-y-2">
                    {treeData.originalSymptoms.map((symptom, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                        <span className="text-xs font-medium text-blue-800">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {treeData.operatingContext && treeData.operatingContext.length > 0 && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-sm text-green-800 mb-2">⚙️ Operating Context</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    {treeData.operatingContext.slice(0, 4).map((context, index) => (
                      <li key={index}>• {context}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Main RCA Tree */}
            {renderTreeNode(treeData)}
            
            {/* Enhanced eliminated causes section with professional styling */}
            {treeData.eliminatedCauses && treeData.eliminatedCauses.length > 0 && (
              <div className="mt-8 bg-gradient-to-r from-gray-50 to-red-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                <h4 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-red-500">❌</span> 
                  Rejected/Eliminated Causes
                  <Badge variant="outline" className="ml-2">{treeData.eliminatedCauses.length} eliminated</Badge>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {treeData.eliminatedCauses.map((cause, index) => (
                    <div key={index} className="bg-white/60 p-4 rounded-lg border-2 border-dashed border-gray-400 opacity-70 hover:opacity-90 transition-opacity">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium line-through text-gray-700">{cause.label}</span>
                        <Badge variant="destructive" className="text-xs ml-auto">REJECTED</Badge>
                      </div>
                      <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded border-l-4 border-l-red-400 ml-7">
                        <strong>Reason:</strong> {cause.evidence[0] || 'Engineering logic elimination'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-gray-600 text-center italic">
                  These failure modes were systematically eliminated through engineering analysis and evidence review
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Fishbone Diagram</h3>
              <p className="text-sm text-gray-600">Cause and Effect Analysis</p>
            </div>
            
            <div className="grid grid-cols-3 gap-6 relative">
              {/* Main problem */}
              <div className="col-span-3 flex justify-center">
                {renderFishboneNode(treeData, 'main')}
              </div>
              
              {/* Contributing factors */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-center">Primary Causes</h4>
                {treeData.children?.filter(child => child.type === 'primary').slice(0, 2).map(node => renderFishboneNode(node, 'branch'))}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-center">Secondary Causes</h4>
                {treeData.children?.filter(child => child.type === 'secondary').slice(0, 2).map(node => renderFishboneNode(node, 'branch'))}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-center">Evidence</h4>
                {treeData.children?.filter(child => child.type === 'evidence').slice(0, 2).map(node => renderFishboneNode(node, 'branch'))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-sm mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Root Cause</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span>Primary Factor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Secondary Factor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Evidence</span>
          </div>
        </div>
      </div>
    </div>
  );
}