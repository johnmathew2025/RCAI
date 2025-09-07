import { useState } from "react";
import { Brain, Activity, Users, Search, ArrowRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation, Link, useNavigate } from "react-router-dom";

import DashboardSection from "@/components/dashboard-section";
import HistorySection from "@/components/history-section";

function NewAnalysisSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Evidence-First Root Cause Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive, systematic approach to accurate root cause identification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Search className="h-4 w-4" />
            <AlertDescription>
              <strong>Enhanced Workflow:</strong> Our new evidence-driven process guides you through 
              structured data collection before AI analysis, ensuring higher accuracy and confidence.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">1</Badge>
                <h4 className="font-medium">Evidence Collection</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Structured questionnaire covering asset context, symptoms, operating conditions, and maintenance history
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">2</Badge>
                <h4 className="font-medium">AI Analysis</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced root cause analysis using collected evidence with confidence scoring and reasoning
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">3</Badge>
                <h4 className="font-medium">Results & Action</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Detailed findings with actionable recommendations and comprehensive audit trail
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/incident-reporting" className="flex-1" rel="noopener noreferrer">
              <Button className="w-full flex items-center gap-2" size="lg">
                <FileText className="h-5 w-5" />
                Report New Incident
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link to="/new" className="flex-1">
              <Button variant="outline" className="w-full flex items-center gap-2" size="lg">
                <Search className="h-5 w-5" />
                Legacy Analysis Upload
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </div>


          
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="font-medium mb-1">What makes this better?</p>
            <ul className="space-y-1 text-xs">
              <li>• Systematic evidence gathering prevents missed critical information</li>
              <li>• Equipment-specific questions provide relevant context</li>
              <li>• Structured data ensures consistent, auditable analysis</li>
              <li>• Higher confidence scores through comprehensive input</li>
            </ul>
          </div>
        </CardContent>
      </Card>



    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="/quanntaum-logo.jpg" 
                  alt="Quanntaum Logo" 
                  className="w-8 h-8 rounded-lg object-contain"
                />
                <h1 className="text-xl font-bold text-foreground">Quanntaum RCA Intelligence Pro</h1>
                <Badge className="enterprise-gradient text-white text-xs px-2 py-1 font-medium">
                  AI-Powered
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                <span>System Active</span>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin')}
                className="text-sm font-medium"
              >
                <Users className="w-4 h-4 mr-2" />
                Admin Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload & Analyze</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Analysis History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <NewAnalysisSection />
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardSection />
          </TabsContent>

          <TabsContent value="history">
            <HistorySection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
