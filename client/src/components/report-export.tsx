import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Image, FileSpreadsheet, FileCheck } from "lucide-react";
import type { Analysis } from "@shared/schema";

interface ReportExportProps {
  analysis: Analysis;
}

interface ExportOptions {
  format: 'pdf' | 'word' | 'excel' | 'image';
  sections: {
    summary: boolean;
    rcaTree: boolean;
    recommendations: boolean;
    operatingParams: boolean;
    historicalData: boolean;
    evidenceGathering: boolean;
    auditTrail: boolean;
  };
  includeCharts: boolean;
  includeBranding: boolean;
}

export default function ReportExport({ analysis }: ReportExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    sections: {
      summary: true,
      rcaTree: true,
      recommendations: true,
      operatingParams: true,
      historicalData: false,
      evidenceGathering: false,
      auditTrail: false,
    },
    includeCharts: true,
    includeBranding: true,
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const formatOptions = [
    { value: 'pdf', label: 'PDF Report', icon: FileText, description: 'Professional PDF document' },
    { value: 'word', label: 'Word Document', icon: FileCheck, description: 'Editable Microsoft Word format' },
    { value: 'excel', label: 'Excel Workbook', icon: FileSpreadsheet, description: 'Data tables and charts' },
    { value: 'image', label: 'High-Res Image', icon: Image, description: 'PNG image for presentations' },
  ];

  const sectionOptions = [
    { key: 'summary', label: 'Executive Summary', description: 'Key findings and recommendations' },
    { key: 'rcaTree', label: 'RCA Tree Diagram', description: 'Visual root cause analysis' },
    { key: 'recommendations', label: 'Action Items', description: 'Detailed recommendations' },
    { key: 'operatingParams', label: 'Operating Parameters', description: 'Equipment data and metrics' },
    { key: 'historicalData', label: 'Historical Analysis', description: 'Maintenance and failure history' },
    { key: 'evidenceGathering', label: 'Evidence Gathering', description: 'Q&A responses and context' },
    { key: 'auditTrail', label: 'Audit Trail', description: 'Version history and changes' },
  ];

  const generateReport = async () => {
    setIsExporting(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, parseInt(import.meta.env.VITE_REPORT_GENERATION_DELAY || '3000')));
      
      // In a real implementation, this would call the backend API
      // const response = await fetch('/api/reports/generate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     analysisId: analysis.id,
      //     options: exportOptions
      //   })
      // });
      
      // Simulate file download
      const filename = `RCA_${analysis.analysisId}_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      
      // Create a sample report content (in real app, this would come from backend)
      const reportContent = generateReportContent();
      
      // Create and trigger download
      const blob = new Blob([reportContent], { 
        type: getContentType(exportOptions.format) 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: `Your ${exportOptions.format.toUpperCase()} report has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateReportContent = () => {
    const sections = [];
    
    if (exportOptions.sections.summary) {
      sections.push(`
=== EXECUTIVE SUMMARY ===
Analysis ID: ${analysis.analysisId}
Equipment: ${analysis.equipmentId} (${analysis.equipmentType})
Location: ${analysis.location}
Issue: ${analysis.issueDescription}
Root Cause: ${analysis.rootCause}
Confidence: ${analysis.confidence}%
Priority: ${analysis.priority}
Status: ${analysis.status}
Completed: ${analysis.completedAt ? new Date(analysis.completedAt).toLocaleString() : 'In Progress'}
      `);
    }

    if (exportOptions.sections.recommendations) {
      sections.push(`
=== RECOMMENDATIONS ===
${(analysis.recommendations || []).map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}
      `);
    }

    if (exportOptions.sections.operatingParams && analysis.operatingParameters) {
      const params = analysis.operatingParameters as any;
      sections.push(`
=== OPERATING PARAMETERS ===
${Object.entries(params).map(([key, value]) => {
  if (typeof value === 'object' && value !== null) {
    return `${key.toUpperCase()}:\n${Object.entries(value).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`;
  }
  return `${key}: ${value}`;
}).join('\n\n')}
      `);
    }

    if (exportOptions.sections.historicalData && analysis.historicalData) {
      const histData = analysis.historicalData as any;
      sections.push(`
=== HISTORICAL DATA ===
Maintenance Records:
${histData.maintenanceRecords?.map((rec: any) => `- ${rec.date}: ${rec.type} - ${rec.description} ($${rec.cost})`).join('\n') || 'No records available'}

Previous Failures:
${histData.previousFailures?.map((fail: any) => `- ${fail.date}: ${fail.rootCause} (${fail.downtime}h downtime)`).join('\n') || 'No previous failures'}
      `);
    }

    return sections.join('\n\n');
  };

  const getContentType = (format: string) => {
    switch (format) {
      case 'pdf': return 'application/pdf';
      case 'word': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'image': return 'image/png';
      default: return 'text/plain';
    }
  };

  const updateSection = (section: keyof ExportOptions['sections'], enabled: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: enabled
      }
    }));
  };

  const selectedFormat = formatOptions.find(f => f.value === exportOptions.format);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Export Report</span>
          <Badge variant="outline">Professional</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Export Format</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              return (
                <div
                  key={format.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    exportOptions.format === format.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-sm">{format.label}</div>
                      <div className="text-xs text-gray-500">{format.description}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Report Sections</Label>
          <div className="space-y-3">
            {sectionOptions.map((section) => (
              <div key={section.key} className="flex items-start space-x-3">
                <Checkbox
                  id={section.key}
                  checked={exportOptions.sections[section.key as keyof ExportOptions['sections']]}
                  onCheckedChange={(checked) => updateSection(section.key as keyof ExportOptions['sections'], !!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={section.key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {section.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Additional Options</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="charts"
                checked={exportOptions.includeCharts}
                onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeCharts: !!checked }))}
              />
              <Label htmlFor="charts" className="text-sm">Include charts and visualizations</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="branding"
                checked={exportOptions.includeBranding}
                onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeBranding: !!checked }))}
              />
              <Label htmlFor="branding" className="text-sm">Include company branding</Label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Report Preview</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Format:</strong> {selectedFormat?.label}</div>
            <div><strong>Sections:</strong> {Object.values(exportOptions.sections).filter(Boolean).length} selected</div>
            <div><strong>Analysis:</strong> {analysis.analysisId} - {analysis.equipmentId}</div>
            <div><strong>File size:</strong> ~{exportOptions.format === 'image' ? '2-5' : '1-3'} MB (estimated)</div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button 
            onClick={generateReport} 
            disabled={isExporting || Object.values(exportOptions.sections).every(v => !v)}
            className="min-w-[140px]"
          >
            {isExporting ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}