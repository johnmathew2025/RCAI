import { Link } from "wouter";
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
            <Link href="/" className="block text-blue-600 hover:underline">Go to Home</Link>
            <Link href="/incident-reporting" className="block text-blue-600 hover:underline">Go to Incident Reporting</Link>
            <Link href="/equipment-selection" className="block text-blue-600 hover:underline">Go to Equipment Selection</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}