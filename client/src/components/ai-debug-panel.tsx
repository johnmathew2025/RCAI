/**
 * AI SETTINGS DEBUG PANEL - UNIVERSAL PROTOCOL STANDARD
 * NO HARDCODING: All configurations dynamic, environment-driven
 * 
 * Features:
 * - Last 100 debug lines with filters
 * - Export logs functionality
 * - System health indicators
 * - Trace ID search
 */

import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw, Filter, Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { aiDebugger, type TraceLog } from "@/lib/debug-ai-settings";

interface SystemHealth {
  apiVersion: string;
  gitSha: string;
  debug: boolean;
  timestamp: string;
  providerStats?: {
    recordCount: number;
    activeCount: number;
    latestCreatedAt: string | null;
    schemaVersion: string;
    envOk: boolean;
  };
}

interface AIDebugPanelProps {
  isVisible: boolean;
}

export function AIDebugPanel({ isVisible }: AIDebugPanelProps) {
  const [logs, setLogs] = useState<TraceLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<TraceLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    status: '',
    traceId: '',
    level: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isVisible) return null;

  useEffect(() => {
    refreshLogs();
    fetchSystemHealth();
    
    // Auto-refresh every 5 seconds when visible
    const interval = setInterval(() => {
      refreshLogs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const refreshLogs = () => {
    const currentLogs = aiDebugger.getLogs();
    setLogs(currentLogs);
  };

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      const { api } = await import('@/api');
      const metaResponse = await api('/meta');
      const metaData = await metaResponse.json();
      
      let providerStats = undefined;
      try {
        const debugResponse = await api('/admin/ai-settings/debug');
        if (debugResponse.ok) {
          providerStats = await debugResponse.json();
        }
      } catch {
        // Debug endpoint may not be available
      }
      
      setSystemHealth({
        ...metaData,
        providerStats
      });
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];
    
    if (filters.action) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(filters.action.toLowerCase())
      );
    }
    
    if (filters.status) {
      filtered = filtered.filter(log => {
        if (filters.status === 'success') return log.result?.success === true;
        if (filters.status === 'error') return log.result?.success === false;
        return true;
      });
    }
    
    if (filters.traceId) {
      filtered = filtered.filter(log => 
        log.id.toLowerCase().includes(filters.traceId.toLowerCase())
      );
    }
    
    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }
    
    setFilteredLogs(filtered);
  };

  const clearLogs = () => {
    aiDebugger.clearLogs();
    refreshLogs();
  };

  const exportLogs = () => {
    const exportData = aiDebugger.exportLogs();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-settings-debug-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getHealthIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="mt-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          AI Settings Debug Panel
          <Badge variant="outline">DEBUG MODE</Badge>
        </CardTitle>
        <CardDescription>
          Comprehensive debugging for AI provider management. Only visible in debug mode.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Debug Logs</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs">
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={refreshLogs} size="sm" variant="outline">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
                <Button onClick={clearLogs} size="sm" variant="outline">
                  Clear Logs
                </Button>
                <Button onClick={exportLogs} size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                
                <div className="flex items-center gap-2 ml-auto">
                  <Input
                    placeholder="Filter by action"
                    value={filters.action}
                    onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
                    className="w-32"
                  />
                  <Input
                    placeholder="Trace ID"
                    value={filters.traceId}
                    onChange={(e) => setFilters(f => ({ ...f, traceId: e.target.value }))}
                    className="w-32"
                  />
                  <Select value={filters.status} onValueChange={(value) => setFilters(f => ({ ...f, status: value }))}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_STATUS">All</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Logs Display */}
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No debug logs found. Try interacting with AI provider actions.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-2 p-2 text-sm hover:bg-gray-50 border-b"
                      >
                        <Badge variant={log.level === 'ERROR' ? 'destructive' : 'outline'}>
                          {log.level}
                        </Badge>
                        <span className="font-mono text-xs text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className="font-medium">{log.action}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.id}
                        </Badge>
                        {log.network && (
                          <Badge variant={log.network.status && log.network.status < 400 ? 'default' : 'destructive'}>
                            {log.network.method} {log.network.status} ({log.network.duration}ms)
                          </Badge>
                        )}
                        {log.result && (
                          <span className={`text-xs ${log.result.success ? 'text-green-600' : 'text-red-600'}`}>
                            {log.result.message}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="health">
            <div className="space-y-4">
              <Button onClick={fetchSystemHealth} size="sm" variant="outline" disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh Health
              </Button>
              
              {systemHealth && (
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">System Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>API Version:</span>
                        <Badge variant="outline">{systemHealth.apiVersion}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Git SHA:</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {systemHealth.gitSha.slice(0, 8)}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Debug Mode:</span>
                        {getHealthIcon(systemHealth.debug)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {systemHealth.providerStats && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Provider Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Providers:</span>
                          <Badge>{systemHealth.providerStats.recordCount}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Active:</span>
                          <Badge variant="default">{systemHealth.providerStats.activeCount}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>DB Connection:</span>
                          {getHealthIcon(systemHealth.providerStats.envOk)}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Schema:</span>
                          <Badge variant="outline">{systemHealth.providerStats.schemaVersion}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}