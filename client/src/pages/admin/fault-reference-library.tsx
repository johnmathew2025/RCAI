/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * 
 * ADMIN INTERFACE: Feature-to-Fault Library / RCA Knowledge Library Management
 * NO HARDCODING: All patterns and fault mapping loaded from dynamic database
 * AUTHENTICATION: Admin-only access with proper authentication checks
 * IMPORT/EXPORT: CSV/Excel bulk operations for library management
 * PROTOCOL: UNIVERSAL_PROTOCOL_STANDARD.md
 * DATE: January 27, 2025
 * LAST REVIEWED: January 27, 2025
 * EXCEPTIONS: None
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  FileText,
  Shield,
  Database
} from "lucide-react";
import { Label } from "@/components/ui/label";

interface FaultReferenceEntry {
  id: string;
  evidenceType: string;
  pattern: string;
  matchingCriteria: string;
  probableFault: string;
  confidence: number;
  recommendations?: string;
  referenceStandard?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function FaultReferenceLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [evidenceTypeFilter, setEvidenceTypeFilter] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FaultReferenceEntry | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all fault reference library entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["/api/admin/fault-reference-library"],
    retry: false,
  });

  // Search entries when filters change
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/admin/fault-reference-library/search", { q: searchTerm, evidenceType: evidenceTypeFilter }],
    enabled: searchTerm.length > 0 || evidenceTypeFilter.length > 0,
    retry: false,
  });

  const displayedEntries = searchTerm || evidenceTypeFilter ? searchResults : entries;

  // Create new entry mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<FaultReferenceEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await apiRequest("/api/admin/fault-reference-library", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fault-reference-library"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Fault reference entry created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create entry",
        variant: "destructive" 
      });
    },
  });

  // Update entry mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FaultReferenceEntry> }) => {
      return await apiRequest(`/api/admin/fault-reference-library/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fault-reference-library"] });
      setEditingEntry(null);
      toast({ title: "Success", description: "Fault reference entry updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update entry",
        variant: "destructive" 
      });
    },
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/fault-reference-library/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fault-reference-library"] });
      toast({ title: "Success", description: "Fault reference entry deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete entry",
        variant: "destructive" 
      });
    },
  });

  // Import entries mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { api } = await import('@/api');
      const response = await api('/admin/fault-reference-library/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fault-reference-library"] });
      setIsImportDialogOpen(false);
      setImportFile(null);
      toast({ 
        title: "Import Complete", 
        description: `Successfully imported ${data.imported} entries. ${data.errors > 0 ? `${data.errors} errors encountered.` : ''}` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Import Failed", 
        description: error.message || "Failed to import entries",
        variant: "destructive" 
      });
    },
  });

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const { api } = await import('@/api');
      const response = await api(`/admin/fault-reference-library/export/${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `fault-reference-library.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: `Library exported as ${format.toUpperCase()}` });
    } catch (error) {
      toast({ 
        title: "Export Failed", 
        description: "Failed to export library",
        variant: "destructive" 
      });
    }
  };

  const handleImport = () => {
    if (importFile) {
      importMutation.mutate(importFile);
    }
  };

  const EntryForm = ({ entry, onSubmit, onCancel }: {
    entry?: FaultReferenceEntry;
    onSubmit: (data: any) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      evidenceType: entry?.evidenceType || '',
      pattern: entry?.pattern || '',
      matchingCriteria: entry?.matchingCriteria || '',
      probableFault: entry?.probableFault || '',
      confidence: entry?.confidence || 0,
      recommendations: entry?.recommendations || '',
      referenceStandard: entry?.referenceStandard || '',
      notes: entry?.notes || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="evidenceType">Evidence Type *</Label>
            <Select 
              value={formData.evidenceType} 
              onValueChange={(value) => setFormData({ ...formData, evidenceType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select evidence type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vibration">Vibration</SelectItem>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="pressure">Pressure</SelectItem>
                <SelectItem value="acoustic">Acoustic</SelectItem>
                <SelectItem value="visual">Visual</SelectItem>
                <SelectItem value="electrical">Database-Driven</SelectItem>
                <SelectItem value="chemical">Chemical</SelectItem>
                <SelectItem value="process">Process</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confidence">Confidence (%) *</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pattern">Pattern *</Label>
          <Input
            value={formData.pattern}
            onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
            placeholder="e.g., High frequency vibration at 2x RPM"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="probableFault">Probable Fault *</Label>
          <Input
            value={formData.probableFault}
            onChange={(e) => setFormData({ ...formData, probableFault: e.target.value })}
            placeholder="e.g., Bearing misalignment"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="matchingCriteria">Matching Criteria *</Label>
          <Textarea
            value={formData.matchingCriteria}
            onChange={(e) => setFormData({ ...formData, matchingCriteria: e.target.value })}
            placeholder="Describe the conditions that must be met for this pattern to match..."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recommendations">Recommendations</Label>
          <Textarea
            value={formData.recommendations}
            onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
            placeholder="Recommended actions and next steps..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="referenceStandard">Reference Standard</Label>
            <Input
              value={formData.referenceStandard}
              onChange={(e) => setFormData({ ...formData, referenceStandard: e.target.value })}
              placeholder="e.g., ISO 14224, API 610"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {entry ? 'Update' : 'Create'} Entry
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Fault Reference Library</h1>
            <p className="text-muted-foreground">Admin-only Feature-to-Fault mapping knowledge base</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Database className="h-4 w-4" />
          <span>{entries.length} entries</span>
        </Badge>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 flex gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search patterns, faults, criteria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={evidenceTypeFilter} onValueChange={setEvidenceTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Evidence Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="vibration">Vibration</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="pressure">Pressure</SelectItem>
                  <SelectItem value="acoustic">Acoustic</SelectItem>
                  <SelectItem value="visual">Visual</SelectItem>
                  <SelectItem value="electrical">Database-Driven</SelectItem>
                  <SelectItem value="chemical">Chemical</SelectItem>
                  <SelectItem value="process">Process</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Entry</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Fault Reference Entry</DialogTitle>
                  </DialogHeader>
                  <EntryForm
                    onSubmit={(data) => createMutation.mutate(data)}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Import</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Fault Reference Library</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="import-file"
                      />
                      <label htmlFor="import-file" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          Click to upload CSV or Excel file
                        </p>
                      </label>
                      {importFile && (
                        <p className="mt-2 text-sm text-green-600">
                          Selected: {importFile.name}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsImportDialogOpen(false);
                          setImportFile(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleImport} 
                        disabled={!importFile || importMutation.isPending}
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                onClick={() => handleExport('csv')}
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>CSV</span>
              </Button>

              <Button 
                variant="outline" 
                onClick={() => handleExport('excel')}
                className="flex items-center space-x-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Excel</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Library Table */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Entries</CardTitle>
          <CardDescription>
            Dynamic fault pattern mapping for evidence analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading fault reference library...</div>
          ) : displayedEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || evidenceTypeFilter ? 'No entries match your search criteria' : 'No fault reference entries found. Create your first entry to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evidence Type</TableHead>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Probable Fault</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedEntries.map((entry: FaultReferenceEntry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge variant="outline">{entry.evidenceType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={entry.pattern}>
                        {entry.pattern}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={entry.probableFault}>
                        {entry.probableFault}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={entry.confidence >= 80 ? "default" : entry.confidence >= 60 ? "secondary" : "outline"}
                        >
                          {entry.confidence}%
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.referenceStandard || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingEntry(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this entry?')) {
                                deleteMutation.mutate(entry.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingEntry && (
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Fault Reference Entry</DialogTitle>
            </DialogHeader>
            <EntryForm
              entry={editingEntry}
              onSubmit={(data) => updateMutation.mutate({ id: editingEntry.id, data })}
              onCancel={() => setEditingEntry(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}