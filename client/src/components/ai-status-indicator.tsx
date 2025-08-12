/**
 * AI STATUS INDICATOR - ABSOLUTE NO HARDCODING VERIFICATION DISPLAY
 * 
 * This component provides real-time visual verification that ALL AI operations
 * use ONLY admin-managed configuration with NO hardcoded fallbacks
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, Database, Key, TestTube, Shield, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AIStatusReport {
  timestamp: string;
  configurationSource: 'admin-database' | 'hardcoded-violation';
  activeProvider: {
    id: number;
    provider: string;
    model: string;
    isActive: boolean;
    isTestSuccessful: boolean;
    apiKeyStatus: 'encrypted-stored' | 'hardcoded-violation';
  } | null;
  systemHealth: 'working' | 'configuration-required' | 'error';
  lastAIOperation: {
    timestamp: string;
    source: string;
    success: boolean;
    provider: string;
  } | null;
  complianceStatus: 'compliant' | 'hardcoding-detected';
  violations: string[];
}

export default function AIStatusIndicator() {
  const [testInProgress, setTestInProgress] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);

  // Fetch real-time AI status
  const { data: statusData, refetch, isLoading } = useQuery<{
    success: boolean;
    status: AIStatusReport;
    timestamp: string;
  }>({
    queryKey: ["/api/admin/ai-status"],
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: false,
  });
  
  // Clear old test results when status is working to prevent confusion
  useEffect(() => {
    if (statusData?.status?.systemHealth === 'working' && statusData?.status?.activeProvider?.isTestSuccessful) {
      setLastTestResult(null);
    }
  }, [statusData]);

  const status = statusData?.status;

  // Enhanced test with error handling
  const handleTestConfiguration = async () => {
    setTestInProgress(true);
    try {
      const response = await apiRequest("/api/admin/ai-status/test", {
        method: "POST"
      });
      
      console.log('[AI Status Test] Response:', response);
      setLastTestResult(response);
      refetch(); // Refresh status after test
    } catch (error: any) {
      console.error('[AI Status Test] Error:', error);
      setLastTestResult({ 
        success: false, 
        message: 'Test failed',
        error: error.message || 'Unknown error occurred',
        errorType: 'network_error'
      });
    } finally {
      setTestInProgress(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" />
            AI Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Loading AI status...</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (!status) return 'gray';
    if (status.complianceStatus === 'hardcoding-detected') return 'red';
    if (status.systemHealth === 'working') return 'green';
    if (status.systemHealth === 'configuration-required') return 'yellow';
    return 'red';
  };

  const getHealthIcon = () => {
    if (!status) return <AlertCircle className="h-4 w-4" />;
    if (status.complianceStatus === 'hardcoding-detected') return <XCircle className="h-4 w-4 text-red-500" />;
    if (status.systemHealth === 'working') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status.systemHealth === 'configuration-required') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className={`border-2 ${getStatusColor() === 'red' ? 'border-red-200 bg-red-50' : 
                      getStatusColor() === 'green' ? 'border-green-200 bg-green-50' : 
                      getStatusColor() === 'yellow' ? 'border-yellow-200 bg-yellow-50' : 
                      'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            AI Configuration Status
          </div>
          <div className="flex items-center gap-2">
            {getHealthIcon()}
            <Badge variant={
              getStatusColor() === 'green' ? 'default' :
              getStatusColor() === 'yellow' ? 'secondary' : 'destructive'
            }>
              {status?.systemHealth?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Configuration Source Verification */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Configuration Source:</span>
            <Badge variant={status?.configurationSource === 'admin-database' ? 'default' : 'destructive'}>
              {status?.configurationSource === 'admin-database' ? (
                <>
                  <Database className="h-3 w-3 mr-1" />
                  Admin Database
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Hardcoded Violation
                </>
              )}
            </Badge>
          </div>
          
          {/* Active Provider Details */}
          {status?.activeProvider ? (
            <div className="bg-white border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Active Provider:</span>
                <span className="text-xs font-mono">{status.activeProvider.provider} ({status.activeProvider.model})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Database ID:</span>
                <span className="text-xs font-mono">#{status.activeProvider.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">API Key Status:</span>
                <Badge variant="outline" className="text-xs">
                  <Key className="h-3 w-3 mr-1" />
                  {status.activeProvider.apiKeyStatus}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="text-sm text-red-700">No active AI provider configured</span>
            </div>
          )}
        </div>

        {/* Compliance Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Compliance Status:</span>
            <Badge variant={status?.complianceStatus === 'compliant' ? 'default' : 'destructive'}>
              <Shield className="h-3 w-3 mr-1" />
              {status?.complianceStatus?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </div>
          
          {/* Violations Display */}
          {status?.violations && status.violations.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-xs font-medium text-red-700 mb-1">Hardcoding Violations Detected:</div>
              {status.violations.map((violation, index) => (
                <div key={index} className="text-xs text-red-600 flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {violation}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last AI Operation */}
        {status?.lastAIOperation && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Last AI Operation:</span>
            <div className="bg-gray-50 border rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Source:</span>
                <span className="text-xs font-mono">{status.lastAIOperation.source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Provider Used:</span>
                <span className="text-xs font-mono">{status.lastAIOperation.provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Status:</span>
                <Badge variant={status.lastAIOperation.success ? 'default' : 'destructive'} className="text-xs">
                  {status.lastAIOperation.success ? 'SUCCESS' : 'FAILED'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Timestamp:</span>
                <span className="text-xs text-gray-500">
                  {new Date(status.lastAIOperation.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Test Button */}
        <div className="pt-2 border-t">
          <Button 
            onClick={handleTestConfiguration}
            disabled={testInProgress || !status?.activeProvider}
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testInProgress ? 'Testing Configuration...' : 'Test AI Configuration'}
          </Button>
          
          {/* Test Result - Only show if recent test or system not working */}
          {lastTestResult && (status?.systemHealth !== 'working' || testInProgress) && (
            <div className={`mt-2 p-2 rounded-lg text-xs ${
              lastTestResult.success 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <div className="font-medium">
                {lastTestResult.success ? '✅ Test Successful' : '❌ Test Failed'}
              </div>
              <div>{lastTestResult.message}</div>
              {lastTestResult.configurationSource && (
                <div className="mt-1 text-gray-600">
                  Source: {lastTestResult.configurationSource}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Timestamp */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Last updated: {status ? new Date(status.timestamp).toLocaleString() : 'Unknown'}
        </div>
      </CardContent>
    </Card>
  );
}