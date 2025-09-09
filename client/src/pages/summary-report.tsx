import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Calendar, MapPin, AlertTriangle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function SummaryReport() {
  const { incidentId } = useParams<{ incidentId: string }>();
  
  const { data: reportData, isLoading } = useQuery({
    queryKey: [`/api/incidents/${incidentId}/summary-report`],
    enabled: !!incidentId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating comprehensive summary report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData?.report) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Failed to generate summary report. Please try again.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const report = reportData.report;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Incident Summary Report</h1>
            <p className="text-gray-600">Investigation ID: {report.metadata.investigationId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/">← Back to Home</Link>
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* 1. Incident Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">1</span>
            Incident Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-gray-700">Incident Title</label>
                <p className="text-gray-900">{report.incidentOverview.incidentTitle}</p>
              </div>
              <div>
                <label className="font-semibold text-gray-700">Date of Incident</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {report.incidentOverview.dateOfIncident}
                </p>
              </div>
              <div>
                <label className="font-semibold text-gray-700">Reported By</label>
                <p className="text-gray-900">{report.incidentOverview.reportedBy}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-gray-700">Equipment Tag</label>
                <p className="text-gray-900 font-mono">{report.incidentOverview.equipmentTag}</p>
              </div>
              <div>
                <label className="font-semibold text-gray-700">Location</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {report.incidentOverview.location}
                </p>
              </div>
              <div>
                <label className="font-semibold text-gray-700">System/Process</label>
                <Badge variant="outline" className="text-sm">{report.incidentOverview.systemProcess}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Incident Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">2</span>
            Incident Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700">What Failed?</label>
              <p className="text-gray-900 mb-3">{report.incidentDescription.whatFailed}</p>
              <label className="font-semibold text-gray-700">When did it happen?</label>
              <p className="text-gray-900">{report.incidentDescription.whenHappened}</p>
            </div>
            <div>
              <label className="font-semibold text-gray-700">How was it discovered?</label>
              <p className="text-gray-900 mb-3">{report.incidentDescription.howDiscovered}</p>
              <label className="font-semibold text-gray-700">Initial Consequence</label>
              <p className="text-gray-900">{report.incidentDescription.initialConsequence}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Impact Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">3</span>
            Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <h4 className="font-semibold text-red-600 mb-2">Safety</h4>
              <p className="text-sm text-gray-700">{report.impactSummary.safety}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-semibold text-green-600 mb-2">Environment</h4>
              <p className="text-sm text-gray-700">{report.impactSummary.environment}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-semibold text-blue-600 mb-2">Production</h4>
              <p className="text-sm text-gray-700">{report.impactSummary.production}</p>
            </div>
            <div className="p-3 border rounded-lg md:col-span-2 lg:col-span-1">
              <h4 className="font-semibold text-purple-600 mb-2">Cost Estimate</h4>
              <p className="text-sm text-gray-700">{report.impactSummary.costEstimate}</p>
            </div>
            <div className="p-3 border rounded-lg md:col-span-2">
              <h4 className="font-semibold text-orange-600 mb-2">Regulatory/Compliance</h4>
              <p className="text-sm text-gray-700">{report.impactSummary.regulatory}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Timeline of Events */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-medium">4</span>
            Timeline of Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.timeline.map((event: any, index: number) => (
              <div key={index} className="flex gap-4 p-3 border-l-4 border-blue-200 bg-gray-50 rounded-r-lg">
                <div className="font-mono text-sm font-semibold text-blue-600 min-w-[60px]">
                  {event.time}
                </div>
                <div className="text-gray-900">{event.event}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5. Evidence Collected */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">5</span>
            Evidence Collected
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.evidenceCollected.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Type</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Source / File</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Observations</th>
                  </tr>
                </thead>
                <tbody>
                  {report.evidenceCollected.map((evidence: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        <Badge variant="outline" className="text-xs">{evidence.type}</Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{evidence.source}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{evidence.observations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No evidence files collected yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Root Cause Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">6</span>
            Root Cause Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="font-semibold text-gray-700 block mb-2">Primary Root Cause</label>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-900">{report.rootCauseSummary.primaryRootCause}</p>
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-2">Contributing Factors</label>
                <div className="space-y-2">
                  {report.rootCauseSummary.contributingFactors.length > 0 ? (
                    report.rootCauseSummary.contributingFactors.map((factor: string, index: number) => (
                      <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                        <p className="text-orange-900">{factor}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No contributing factors identified</p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <label className="font-semibold text-gray-700 block mb-2">Latent/Systemic Cause</label>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-900">{report.rootCauseSummary.latentCause}</p>
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-2">Detection Gaps</label>
                <div className="space-y-2">
                  {report.rootCauseSummary.detectionGaps.length > 0 ? (
                    report.rootCauseSummary.detectionGaps.map((gap: string, index: number) => (
                      <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <p className="text-blue-900">{gap}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No detection gaps identified</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. RCA Methodology */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-sm font-medium">7</span>
            Root Cause Analysis Methodology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700 block mb-2">Method Used</label>
              <Badge className="mb-3">{report.rcaMethodology.method}</Badge>
              <p className="text-sm text-gray-600">{report.rcaMethodology.description}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold">Confidence Level</span>
                <Badge variant={report.rcaMethodology.confidenceLevel > 80 ? "default" : "secondary"}>
                  {report.rcaMethodology.confidenceLevel}%
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold">Evidence Library Used</span>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold block mb-1">ISO Compliance</span>
                <span className="text-xs text-gray-600">{report.rcaMethodology.isoCompliance}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 8. Corrective and Preventive Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm font-medium">8</span>
            Corrective and Preventive Actions (CAPA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Action</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Type</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Owner</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Due Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.correctiveActions.map((action: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-sm">{action.action}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Badge variant={action.type === 'Corrective' ? "destructive" : "default"} className="text-xs">
                        {action.type}
                      </Badge>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{action.owner}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-mono">{action.dueDate}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Badge variant="outline" className="text-xs">{action.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 9. Lessons Learned */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-sm font-medium">9</span>
            Lessons Learned
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {report.lessonsLearned.map((lesson: string, index: number) => (
              <li key={index} className="flex items-start gap-3 p-3 border-l-4 border-teal-200 bg-teal-50 rounded-r-lg">
                <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-900">{lesson}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Report Metadata */}
      <Card className="border-gray-200">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>Report Generated: {new Date(report.metadata.reportGeneratedDate).toLocaleString()}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Generated by: {report.metadata.reportGeneratedBy}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Evidence Files: {report.metadata.totalEvidenceFiles}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Overall Confidence: {report.metadata.overallConfidence}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}