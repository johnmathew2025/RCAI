import { TaxonomyManager } from '@/components/taxonomy-manager';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Database, AlertTriangle } from 'lucide-react';

export default function TaxonomyManagementEnhanced() {
  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="page-taxonomy-management-enhanced">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Taxonomy Management</h1>
          <p className="text-muted-foreground mt-1">
            Equipment Groups & Types with FK Constraint Enforcement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-700 border-green-300">
            <Shield className="h-3 w-3 mr-1" />
            FK Protected
          </Badge>
          <Badge variant="outline" className="text-blue-700 border-blue-300">
            <Database className="h-3 w-3 mr-1" />
            Zero Hardcoding
          </Badge>
        </div>
      </div>

      {/* FK Constraint Information */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-lg">
            <Database className="h-5 w-5" />
            Foreign Key Constraint Enforcement
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-600 dark:text-blue-400 space-y-2">
          <p className="font-medium">✅ Active Protections:</p>
          <ul className="space-y-1 ml-4 text-sm">
            <li>• Equipment Types MUST belong to an Equipment Group (NOT NULL constraint)</li>
            <li>• Creating types without groupId returns HTTP 400 error</li>
            <li>• Deleting groups with dependent types is blocked (ON DELETE RESTRICT)</li>
            <li>• Group updates cascade to dependent types (ON UPDATE CASCADE)</li>
            <li>• All orphaned records are identified and fixable through admin UI</li>
          </ul>
        </CardContent>
      </Card>

      {/* Main Taxonomy Manager */}
      <TaxonomyManager />

      {/* Technical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Technical Implementation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Database: PostgreSQL with enforced FK constraints</p>
          <p>• API: Strict validation with detailed error messages</p>
          <p>• UI: Dynamic group loading, disabled states for invalid operations</p>
          <p>• Testing: Automated FK constraint validation suite available</p>
        </CardContent>
      </Card>
    </div>
  );
}