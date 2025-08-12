import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, FileText, Brain, Search, Lightbulb, Languages } from "lucide-react";
import type { Analysis } from "@shared/schema";

interface ProcessingStage {
  name: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "processing" | "completed";
  progress: number;
}

interface ProcessingStatusProps {
  analysisId: number | null;
}

export default function ProcessingStatus({ analysisId }: ProcessingStatusProps) {
  const [stages, setStages] = useState<ProcessingStage[]>([
    {
      name: "parsing",
      label: "Data Parsing & Validation",
      icon: <FileText className="w-4 h-4" />,
      status: "pending",
      progress: 0,
    },
    {
      name: "nlp",
      label: "NLP Analysis",
      icon: <Languages className="w-4 h-4" />,
      status: "pending",
      progress: 0,
    },
    {
      name: "pattern",
      label: "Pattern Recognition",
      icon: <Search className="w-4 h-4" />,
      status: "pending",
      progress: 0,
    },
    {
      name: "rootcause",
      label: "Root Cause Identification",
      icon: <Brain className="w-4 h-4" />,
      status: "pending",
      progress: 0,
    },
    {
      name: "recommendations",
      label: "Generating Recommendations",
      icon: <Lightbulb className="w-4 h-4" />,
      status: "pending",
      progress: 0,
    },
  ]);

  const { data: analysis } = useQuery<Analysis>({
    queryKey: ["/api/analyses", analysisId],
    enabled: !!analysisId,
    refetchInterval: analysisId ? 1000 : false, // Poll every second while processing
  });

  useEffect(() => {
    if (!analysis) return;

    if (analysis.status === "processing") {
      // Simulate processing stages
      const processingInterval = setInterval(() => {
        setStages((prevStages) => {
          const newStages = [...prevStages];
          let hasActiveStage = false;

          for (let i = 0; i < newStages.length; i++) {
            const stage = newStages[i];
            
            if (stage.status === "completed") {
              continue;
            }
            
            if (!hasActiveStage) {
              if (stage.status === "pending") {
                stage.status = "processing";
              }
              
              if (stage.status === "processing") {
                hasActiveStage = true;
                stage.progress = Math.min(stage.progress + 5, 100);
                
                if (stage.progress >= 100) {
                  stage.status = "completed";
                  stage.progress = 100;
                }
              }
              break;
            }
          }

          return newStages;
        });
      }, 300);

      return () => clearInterval(processingInterval);
    } else if (analysis.status === "completed") {
      // Mark all stages as completed
      setStages((prevStages) =>
        prevStages.map((stage) => ({
          ...stage,
          status: "completed",
          progress: 100,
        }))
      );
    }
  }, [analysis?.status]);

  const getStageIcon = (stage: ProcessingStage) => {
    if (stage.status === "completed") {
      return <CheckCircle className="w-4 h-4 text-accent" />;
    } else if (stage.status === "processing") {
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    }
    return <div className="w-4 h-4 text-muted-foreground">{stage.icon}</div>;
  };

  const getStageStatus = (stage: ProcessingStage) => {
    switch (stage.status) {
      case "completed":
        return <Badge variant="secondary" className="bg-accent/10 text-accent">Complete</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Processing...</Badge>;
      default:
        return <span className="text-sm text-muted-foreground">Pending</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Processing Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage) => (
          <div key={stage.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  stage.status === "completed" 
                    ? "bg-accent/10" 
                    : stage.status === "processing" 
                    ? "bg-primary/10" 
                    : "bg-muted"
                }`}>
                  {getStageIcon(stage)}
                </div>
                <span className="font-medium text-foreground">{stage.label}</span>
              </div>
              {getStageStatus(stage)}
            </div>
            {stage.status !== "pending" && (
              <div className="ml-11">
                <Progress value={stage.progress} className="h-2" />
              </div>
            )}
          </div>
        ))}

        {/* Results Preview */}
        {analysis?.status === "completed" && (
          <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-accent" size={20} />
              <h3 className="font-medium text-accent">Analysis Complete</h3>
            </div>
            <p className="text-accent/80 text-sm mt-1">
              Switch to Dashboard to view detailed results
            </p>
            {analysis.confidence && (
              <div className="mt-2">
                <Badge variant="secondary" className="bg-accent/10 text-accent">
                  {analysis.confidence}% Confidence
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
