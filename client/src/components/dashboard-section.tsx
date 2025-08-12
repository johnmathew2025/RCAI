import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, Search, Clock, Target, TrendingUp, AlertCircle } from "lucide-react";
import type { Analysis } from "@shared/schema";

interface Analytics {
  totalAnalyses: number;
  rootCausesIdentified: number;
  avgAnalysisTime: string;
  successRate: number;
  rootCauseDistribution: Record<string, number>;
  confidenceDistribution: Record<string, number>;
}

export default function DashboardSection() {
  const { data: analyses = [] } = useQuery<Analysis[]>({
    queryKey: ["/api/analyses"],
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });

  const completedAnalyses = analyses.filter(a => a.status === "completed");
  const recentAnalyses = completedAnalyses.slice(0, 3);

  const rootCauseChartData = analytics?.rootCauseDistribution 
    ? Object.entries(analytics.rootCauseDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const confidenceChartData = analytics?.confidenceDistribution
    ? Object.entries(analytics.confidenceDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "priority-high";
      case "medium": return "priority-medium";
      case "low": return "priority-low";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "confidence-high";
    if (confidence >= 70) return "confidence-medium";
    return "confidence-low";
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInHours = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Issues Analyzed</p>
                <p className="text-2xl font-bold text-foreground">{analytics?.totalAnalyses || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-accent mr-1" />
              <span className="text-accent font-medium">+12%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Root Causes Identified</p>
                <p className="text-2xl font-bold text-foreground">{analytics?.rootCausesIdentified || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Search className="text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-accent mr-1" />
              <span className="text-accent font-medium">+8%</span>
              <span className="text-muted-foreground ml-1">resolution rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Analysis Time</p>
                <p className="text-2xl font-bold text-foreground">{analytics?.avgAnalysisTime || "0m"}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-accent mr-1" />
              <span className="text-accent font-medium">-15%</span>
              <span className="text-muted-foreground ml-1">faster than manual</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-foreground">{analytics?.successRate || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-accent mr-1" />
              <span className="text-accent font-medium">+3%</span>
              <span className="text-muted-foreground ml-1">accuracy improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Root Cause Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={rootCauseChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {rootCauseChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Confidence Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={confidenceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(217, 91%, 60%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Findings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Root Cause Findings</CardTitle>
          <Button variant="ghost" size="sm">View All</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentAnalyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No completed analyses yet. Upload files to get started.</p>
            </div>
          ) : (
            recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-foreground">{analysis.issueDescription}</h4>
                      <Badge className={getPriorityColor(analysis.priority)}>
                        {analysis.priority.charAt(0).toUpperCase() + analysis.priority.slice(1)} Priority
                      </Badge>
                      {analysis.confidence && (
                        <Badge className={getConfidenceColor(analysis.confidence)}>
                          {analysis.confidence}% Confidence
                        </Badge>
                      )}
                    </div>
                    {analysis.rootCause && (
                      <p className="text-muted-foreground text-sm mb-3">
                        Root cause identified: {analysis.rootCause}
                      </p>
                    )}
                    {analysis.recommendations && Array.isArray(analysis.recommendations) && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Recommendations:</span>
                        <ul className="text-sm text-muted-foreground ml-4 mt-1 space-y-1">
                          {analysis.recommendations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {formatTimeAgo(analysis.createdAt)}
                      </div>
                      {analysis.equipmentType && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {analysis.equipmentType.charAt(0).toUpperCase() + analysis.equipmentType.slice(1).replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
