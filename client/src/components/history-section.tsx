import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import type { Analysis } from "@shared/schema";

export default function HistorySection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // Add status filter
  const [currentPage, setCurrentPage] = useState(1);
  const [, setLocation] = useLocation();
  const itemsPerPage = 10;

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set("search", searchQuery);
  if (priorityFilter && priorityFilter !== "all") queryParams.set("priority", priorityFilter);
  if (dateFilter && dateFilter !== "all") queryParams.set("dateRange", dateFilter);
  // Always include status parameter since backend needs it to determine filtering
  queryParams.set("status", statusFilter);

  const { data: analyses = [], isLoading, refetch } = useQuery<Analysis[]>({
    queryKey: ["/api/analyses", queryParams.toString()],
    queryFn: async () => {
      const url = `/api/analyses${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch analyses");
      return response.json();
    },
  });

  const totalPages = Math.ceil(analyses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAnalyses = analyses.slice(startIndex, startIndex + itemsPerPage);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "priority-high";
      case "medium": return "priority-medium";
      case "low": return "priority-low";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return "bg-gray-100 text-gray-800";
    if (confidence >= 90) return "confidence-high";
    if (confidence >= 70) return "confidence-medium";
    return "confidence-low";
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExport = () => {
    // Implementation for export functionality
    console.log("Export functionality would be implemented here");
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-muted-foreground" size={16} />
                </div>
                <Input
                  placeholder="Search analyses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Drafts Only</SelectItem>
                  <SelectItem value="completed">Completed Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <p className="text-sm text-muted-foreground">Complete record of all root cause analyses</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No analyses found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Analysis ID</TableHead>
                      <TableHead className="min-w-[140px]">Equipment</TableHead>
                      <TableHead className="min-w-[200px]">Issue Description</TableHead>
                      <TableHead className="min-w-[200px]">Root Cause</TableHead>
                      <TableHead className="min-w-[100px]">Confidence</TableHead>
                      <TableHead className="min-w-[90px]">Priority</TableHead>
                      <TableHead className="min-w-[140px]">Date</TableHead>
                      <TableHead className="min-w-[160px] sticky right-0 bg-background">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAnalyses.map((analysis: any) => (
                      <TableRow key={analysis.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium min-w-[120px]">
                          <div className="flex flex-col">
                            <span>{analysis.investigationId}</span>
                            {analysis.isDraft && (
                              <Badge variant="outline" className="text-xs w-fit mt-1">
                                Draft
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[140px]">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {analysis.equipmentType?.charAt(0).toUpperCase() + analysis.equipmentType?.slice(1).replace('_', ' ')}
                            </span>
                            {analysis.evidenceData?.equipment_tag && (
                              <span className="text-xs text-muted-foreground">{analysis.evidenceData.equipment_tag}</span>
                            )}
                            {analysis.location && (
                              <span className="text-xs text-muted-foreground">{analysis.location}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[200px] max-w-[250px] truncate">{analysis.whatHappened}</TableCell>
                        <TableCell className="min-w-[200px] max-w-[250px] truncate">
                          {analysis.cause || "Processing..."}
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          {analysis.confidence && !analysis.isDraft ? (
                            <Badge className={getConfidenceColor(analysis.confidence)}>
                              {analysis.confidence}%
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-[90px]">
                          <Badge className={getPriorityColor(analysis.priority)}>
                            {analysis.priority.charAt(0).toUpperCase() + analysis.priority.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm min-w-[140px]">
                          {formatDate(analysis.createdAt)}
                        </TableCell>
                        <TableCell className="min-w-[160px] sticky right-0 bg-background">
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (analysis.isDraft) {
                                  // Navigate to continue draft
                                  setLocation(`/equipment-selection?incident=${analysis.id}`);
                                } else {
                                  // Navigate to comprehensive analysis details page
                                  setLocation(`/analysis-details/${analysis.id}`);
                                }
                              }}
                              className="text-xs px-2"
                            >
                              {analysis.isDraft ? 'Continue' : 'Details'}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs px-2">
                              Export
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, analyses.length)} of {analyses.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
