import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { History, User, Clock, GitBranch, Eye, RotateCcw, FileText } from "lucide-react";
import type { Analysis } from "@shared/schema";

interface VersionHistoryProps {
  analysis: Analysis;
  onRevert?: (version: number) => void;
}

interface AuditEntry {
  timestamp: string;
  user: string;
  reason: string;
  changes: Record<string, { from: any; to: any }>;
  version: number;
  type: 'manual_adjustment' | 'ai_reanalysis' | 'evidence_gathering' | 'initial_creation';
}

export default function VersionHistory({ analysis, onRevert }: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const { toast } = useToast();

  // Get audit history from analysis data
  const getAuditHistory = (): AuditEntry[] => {
    const entries: AuditEntry[] = [];
    
    // Initial creation
    entries.push({
      timestamp: analysis.createdAt.toString(),
      user: "AI System",
      reason: "Initial root cause analysis",
      changes: {},
      version: 1,
      type: 'initial_creation'
    });

    // Add manual adjustments if they exist
    const adjustmentHistory = (analysis as any).adjustmentHistory || [];
    entries.push(...adjustmentHistory.map((entry: any) => ({
      ...entry,
      type: 'manual_adjustment'
    })));

    // Add evidence gathering entries if they exist
    const evidenceHistory = (analysis as any).evidenceGatheringHistory || [];
    entries.push(...evidenceHistory.map((entry: any) => ({
      ...entry,
      type: 'evidence_gathering'
    })));

    // Sort by timestamp (newest first)
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const auditHistory = getAuditHistory();
  const currentVersion = Math.max(...auditHistory.map(entry => entry.version), 1);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'initial_creation': return <FileText className="w-4 h-4" />;
      case 'manual_adjustment': return <User className="w-4 h-4" />;
      case 'ai_reanalysis': return <GitBranch className="w-4 h-4" />;
      case 'evidence_gathering': return <Eye className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'initial_creation': return 'bg-green-100 text-green-800';
      case 'manual_adjustment': return 'bg-blue-100 text-blue-800';
      case 'ai_reanalysis': return 'bg-purple-100 text-purple-800';
      case 'evidence_gathering': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'initial_creation': return 'Created';
      case 'manual_adjustment': return 'Manual Edit';
      case 'ai_reanalysis': return 'AI Re-analysis';
      case 'evidence_gathering': return 'Evidence Update';
      default: return 'Unknown';
    }
  };

  const handleRevert = (version: number) => {
    if (version === currentVersion) {
      toast({
        title: "Already Current Version",
        description: "This is already the current version of the analysis.",
        variant: "destructive",
      });
      return;
    }

    if (onRevert) {
      onRevert(version);
      toast({
        title: "Version Reverted",
        description: `Analysis has been reverted to version ${version}.`,
      });
    }
  };

  const renderChanges = (changes: Record<string, { from: any; to: any }>) => {
    if (Object.keys(changes).length === 0) {
      return <div className="text-sm text-gray-500 italic">No specific changes recorded</div>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(changes).map(([field, change]) => (
          <div key={field} className="text-sm">
            <div className="font-medium text-gray-700 capitalize">
              {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
            </div>
            <div className="ml-2 space-y-1">
              <div className="text-red-600">
                <span className="font-medium">From:</span> {
                  typeof change.from === 'object' 
                    ? JSON.stringify(change.from, null, 2) 
                    : String(change.from || 'Empty').substring(0, 100)
                }
              </div>
              <div className="text-green-600">
                <span className="font-medium">To:</span> {
                  typeof change.to === 'object' 
                    ? JSON.stringify(change.to, null, 2) 
                    : String(change.to || 'Empty').substring(0, 100)
                }
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="w-5 h-5" />
          <span>Version History & Audit Trail</span>
          <Badge variant="outline">v{currentVersion}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <History className="h-4 w-4" />
          <AlertDescription>
            Complete audit trail of all changes made to this analysis. Click on any version to view details.
          </AlertDescription>
        </Alert>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {auditHistory.map((entry, index) => (
              <div
                key={entry.version}
                className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                  selectedVersion === entry.version
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedVersion(
                  selectedVersion === entry.version ? null : entry.version
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getTypeColor(entry.type)}`}>
                      {getTypeIcon(entry.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">Version {entry.version}</span>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(entry.type)}
                        </Badge>
                        {entry.version === currentVersion && (
                          <Badge className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{entry.user}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(entry.timestamp)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-sm">
                        <strong>Reason:</strong> {entry.reason}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVersion(selectedVersion === entry.version ? null : entry.version);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {entry.version !== currentVersion && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevert(entry.version);
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Revert
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedVersion === entry.version && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-sm mb-3">Changes Made:</h4>
                    {renderChanges(entry.changes)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {auditHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No version history available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}