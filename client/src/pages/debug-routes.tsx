import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugRoutes() {
  return (
    <div className="min-h-screen p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Debug Routes Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This page loads to test if routing is working.</p>
          <div className="mt-4 space-y-2">
            <Link to={import.meta.env.VITE_HOME_ROUTE || '/'} className="block text-blue-600 hover:underline">Go to Home</Link>
            <Link to="/incident-reporting" className="block text-blue-600 hover:underline" rel="noopener noreferrer">Go to Incident Reporting</Link>
            <Link to="/equipment-selection" className="block text-blue-600 hover:underline">Go to Equipment Selection</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}