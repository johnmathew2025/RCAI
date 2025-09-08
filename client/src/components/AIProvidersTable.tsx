import { useAiSettings, useCreateAiSetting } from '../hooks/useAiSettings';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus } from 'lucide-react';

export default function AIProvidersTable() {
  const { data = [] } = useAiSettings();
  const create = useCreateAiSetting();
  
  const [formData, setFormData] = useState({
    provider: '',
    modelId: '',
    apiKey: '',
    isActive: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider || !formData.modelId || !formData.apiKey) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      await create.mutateAsync({ 
        provider: formData.provider, 
        modelId: formData.modelId, 
        apiKey: formData.apiKey, 
        isActive: true 
      });
      setFormData({ provider: '', modelId: '', apiKey: '', isActive: false });
    } catch (error) {
      console.error('Error creating provider:', error);
      alert('Failed to create provider');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Provider Management</CardTitle>
        <p className="text-sm text-muted-foreground">
          Single source of truth - all API keys encrypted and stored securely
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input
            placeholder="Provider (e.g., openai)"
            value={formData.provider}
            onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
            required
          />
          <Input
            placeholder="Model ID (e.g., gpt-4o-mini)"
            value={formData.modelId}
            onChange={(e) => setFormData(prev => ({ ...prev, modelId: e.target.value }))}
            required
          />
          <Input
            type="password"
            placeholder="API Key"
            value={formData.apiKey}
            onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
            required
          />
          <Button type="submit" disabled={create.isPending}>
            <Plus className="w-4 h-4 mr-2" />
            {create.isPending ? 'Adding...' : 'Add Provider'}
          </Button>
        </form>

        {/* Providers Table */}
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No AI providers configured. Add one above to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>API Key</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((provider: any) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.provider}</TableCell>
                  <TableCell>{provider.modelId}</TableCell>
                  <TableCell>
                    <Badge variant={provider.isActive ? "default" : "secondary"}>
                      {provider.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(provider.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {provider.apiKeyPreview}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}