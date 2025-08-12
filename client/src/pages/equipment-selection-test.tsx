import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function EquipmentSelectionTest() {
  const [incidentId, setIncidentId] = useState<number | null>(null);

  // Extract incident ID from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('incident');
    if (id) {
      setIncidentId(parseInt(id));
    }
  }, []);

  if (!incidentId) {
    return <div>Loading investigation...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Equipment Selection & Symptom Input</h1>
              <p className="text-slate-600">Step 2: Select specific equipment part and describe symptoms</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Equipment Selection Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Incident ID: {incidentId}</p>
            <p>This is a test version of the equipment selection page.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}