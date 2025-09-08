import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, MessageCircle, Search, TrendingUp, Lightbulb, Home, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NLPAnalysisPage() {
  const [questionParams, setQuestionParams] = useState({
    equipmentType: "",
    failureMode: "",
    existingEvidence: []
  });

  // Analyze question patterns from Evidence Library
  const { data: questionAnalysis, isLoading: loadingQuestions } = useQuery({
    queryKey: ["/api/nlp/analyze-questions"]
  });

  // Analyze root cause logic patterns
  const { data: logicAnalysis, isLoading: loadingLogic } = useQuery({
    queryKey: ["/api/nlp/analyze-root-cause-logic"]
  });

  const handleGenerateQuestions = async () => {
    if (!questionParams.equipmentType || !questionParams.failureMode) {
      return;
    }

    try {
      const { apiPost } = await import('@/api');
      const response = await apiPost("/nlp/generate-questions", questionParams);
      
      if (response.ok) {
        const suggestions = await response.json();
        console.log("Generated suggestions:", suggestions);
        // Handle suggestions
      }
    } catch (error) {
      console.error("Error generating questions:", error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          NLP Analysis Dashboard
        </h1>
        <p className="text-gray-600">
          Natural Language Processing analysis of Evidence Library patterns for intelligent question generation
        </p>
      </div>

      <Tabs defaultValue="question-patterns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="question-patterns">Question Patterns</TabsTrigger>
          <TabsTrigger value="logic-analysis">Root Cause Logic</TabsTrigger>
          <TabsTrigger value="question-generator">Question Generator</TabsTrigger>
        </TabsList>

        {/* Question Patterns Analysis */}
        <TabsContent value="question-patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Question Type Classification
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingQuestions ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ) : questionAnalysis?.questionTypes ? (
                <div className="space-y-4">
                  {questionAnalysis.questionTypes.slice(0, 8).map((type: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold capitalize">{type.type.replace('-', ' ')}</h3>
                        <Badge variant="secondary">{type.frequency} questions</Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {type.examples.slice(0, 3).map((example: string, i: number) => (
                          <div key={i} className="bg-gray-50 p-2 rounded italic">
                            "{example}"
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>No question patterns found. Make sure Evidence Library has AI/Investigator Questions data.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Technical Terms Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              {questionAnalysis?.keyTerms ? (
                <div className="flex flex-wrap gap-2">
                  {questionAnalysis.keyTerms.slice(0, 20).map((term: any, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {term.term} ({term.frequency})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No technical terms identified</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipment-Specific Question Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              {questionAnalysis?.equipmentSpecificPatterns ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questionAnalysis.equipmentSpecificPatterns.slice(0, 6).map((equipment: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{equipment.equipment}</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {equipment.commonQuestions.slice(0, 3).map((q: string, i: number) => (
                          <div key={i} className="bg-blue-50 p-2 rounded">• {q}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No equipment-specific patterns identified</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Root Cause Logic Analysis */}
        <TabsContent value="logic-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Logic Structure Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLogic ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : logicAnalysis?.logicStructures ? (
                <div className="space-y-4">
                  {logicAnalysis.logicStructures.map((structure: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold capitalize">{structure.structure.replace('-', ' ')}</h3>
                        <p className="text-sm text-gray-600">{structure.description}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {structure.frequency} cases
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>No logic structure patterns found. Check Root Cause Logic data in Evidence Library.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Reasoning Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              {logicAnalysis?.commonPatterns ? (
                <div className="space-y-3">
                  {logicAnalysis.commonPatterns.slice(0, 6).map((pattern: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{pattern.pattern}</p>
                        <Badge variant="secondary">{pattern.frequency}x</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {pattern.examples.slice(0, 2).map((example: string, i: number) => (
                          <div key={i} className="mt-1 italic">"{example}"</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No common patterns identified</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Causal Language Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {logicAnalysis?.causalWords ? (
                <div className="flex flex-wrap gap-2">
                  {logicAnalysis.causalWords.map((word: any, index: number) => (
                    <Badge key={index} variant="outline" className="bg-orange-50">
                      {word.word} ({word.frequency})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No causal words identified</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Question Generator */}
        <TabsContent value="question-generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Intelligent Question Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipment-type">Equipment Type</Label>
                  <Input 
                    id="equipment-type"
                    placeholder="e.g., equipment type from database"
                    value={questionParams.equipmentType}
                    onChange={(e) => setQuestionParams(prev => ({...prev, equipmentType: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="failure-mode">Failure Mode</Label>
                  <Input 
                    id="failure-mode"
                    placeholder="e.g., Seal Leak, Bearing Failure"
                    value={questionParams.failureMode}
                    onChange={(e) => setQuestionParams(prev => ({...prev, failureMode: e.target.value}))}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleGenerateQuestions}
                disabled={!questionParams.equipmentType || !questionParams.failureMode}
                className="w-full"
              >
                Generate Contextual Questions
              </Button>

              <Alert>
                <AlertDescription>
                  Enter equipment type and failure mode to generate contextual follow-up questions based on Evidence Library patterns.
                  The NLP engine will analyze similar cases and suggest relevant questions to gather missing evidence.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}