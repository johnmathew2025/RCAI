import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Search, Clock, Play, Filter, RefreshCw, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface RcaCase {
  id: number;
  incidentId: string;
  lastStep: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';
  summary?: string;
  payload: {
    step1?: {
      incidentTitle?: string;
      priority?: string;
    };
    step2?: {
      equipmentInfo?: string;
      manufacturer?: string;
      model?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: RcaCase[];
  count: number;
}

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  CLOSED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const statusLabels = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  CLOSED: "Closed",
  CANCELLED: "Cancelled"
};

const stepLabels = {
  1: "Incident Reporting",
  2: "Equipment Selection", 
  3: "Evidence Collection",
  4: "RCA Triage",
  5: "AI Questions",
  6: "RCA Workspace",
  7: "Actions & Approvals",
  8: "Summary & Closeout"
};

export default function RcaCases() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch RCA cases with optional status filtering
  const { data: casesResponse, isLoading, refetch } = useQuery<ApiResponse>({
    queryKey: ['/api/rca/cases', statusFilter !== "all" ? statusFilter : undefined],
    queryFn: async ({ queryKey }) => {
      const [baseUrl, status] = queryKey;
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      
      const response = await fetch(`${baseUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch RCA cases');
      }
      return response.json();
    }
  });

  const cases = casesResponse?.data || [];

  // Filter cases by search term
  const filteredCases = cases.filter(rcaCase => {
    const searchLower = searchTerm.toLowerCase();
    const incidentTitle = rcaCase.payload?.step1?.incidentTitle || '';
    const summary = rcaCase.summary || '';
    const equipmentInfo = rcaCase.payload?.step2?.equipmentInfo || '';
    
    return (
      incidentTitle.toLowerCase().includes(searchLower) ||
      summary.toLowerCase().includes(searchLower) ||
      equipmentInfo.toLowerCase().includes(searchLower) ||
      rcaCase.incidentId.toLowerCase().includes(searchLower)
    );
  });

  const handleResume = (incidentId: string, lastStep: number) => {
    // Navigate to the appropriate step in the workflow
    if (lastStep <= 1) {
      setLocation(`/incident-reporting?resume=${incidentId}`);
    } else if (lastStep <= 2) {
      setLocation(`/equipment-selection?incident=${incidentId}`);
    } else if (lastStep <= 3) {
      setLocation(`/evidence-checklist?incident=${incidentId}`);
    } else if (lastStep <= 4) {
      setLocation(`/incidents/${incidentId}/rca-triage`);
    } else {
      // For higher steps, navigate to appropriate workflow page
      setLocation(`/incidents/${incidentId}/analysis`);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RCA Cases</h1>
          <p className="text-muted-foreground">
            Manage and resume your Root Cause Analysis investigations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/incident-reporting">
            <Button data-testid="button-new-incident">
              <FileText className="h-4 w-4 mr-2" />
              New Incident
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search by incident title, equipment, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="input-search"
              />
            </div>
            <div className="w-full md:w-48">
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
                data-testid="select-status-filter"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCases.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No RCA cases found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Start by creating your first incident report."
                }
              </p>
              {(!searchTerm && statusFilter === "all") && (
                <Link href="/incident-reporting">
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Report New Incident
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCases.map((rcaCase) => (
              <Card key={rcaCase.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg" data-testid={`text-case-title-${rcaCase.id}`}>
                          {rcaCase.payload?.step1?.incidentTitle || `Incident ${rcaCase.incidentId}`}
                        </h3>
                        <Badge 
                          className={statusColors[rcaCase.status]}
                          data-testid={`badge-status-${rcaCase.id}`}
                        >
                          {statusLabels[rcaCase.status]}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          ID: {rcaCase.incidentId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Step {rcaCase.lastStep}: {stepLabels[rcaCase.lastStep as keyof typeof stepLabels]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Updated {formatDistanceToNow(new Date(rcaCase.updatedAt))} ago
                        </span>
                      </div>

                      {rcaCase.payload?.step2?.equipmentInfo && (
                        <p className="text-sm text-muted-foreground">
                          Equipment: {rcaCase.payload.step2.equipmentInfo}
                          {rcaCase.payload.step2.manufacturer && ` • ${rcaCase.payload.step2.manufacturer}`}
                          {rcaCase.payload.step2.model && ` • ${rcaCase.payload.step2.model}`}
                        </p>
                      )}

                      {rcaCase.summary && (
                        <p className="text-sm">{rcaCase.summary}</p>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <Button
                        onClick={() => handleResume(rcaCase.incidentId, rcaCase.lastStep)}
                        disabled={rcaCase.status === 'CLOSED' || rcaCase.status === 'CANCELLED'}
                        data-testid={`button-resume-${rcaCase.id}`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {rcaCase.status === 'CLOSED' ? 'View' : 'Resume'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredCases.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredCases.length} of {cases.length} cases
              </span>
              <div className="flex items-center space-x-4">
                {Object.entries(statusLabels).map(([status, label]) => {
                  const count = cases.filter(c => c.status === status).length;
                  return count > 0 ? (
                    <span key={status} className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${statusColors[status as keyof typeof statusColors].split(' ')[0]}`}></div>
                      <span>{label}: {count}</span>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}