import { 
  useSecureAiProviders, 
  useCreateSecureAiProvider, 
  useTestSecureAiProvider,
  useDeleteSecureAiProvider,
  useSetActiveSecureAiProvider
} from '../hooks/useSecureAiProviders';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Plus, TestTube, Lock, Trash2, Activity } from 'lucide-react';

export default function AIProvidersTable() {
  const { data: providers = [] } = useSecureAiProviders();
  const createProvider = useCreateSecureAiProvider();
  const testProvider = useTestSecureAiProvider();
  const deleteProvider = useDeleteSecureAiProvider();
  const setActiveProvider = useSetActiveSecureAiProvider();
  
  const [formData, setFormData] = useState({
    provider: '',
    modelId: '',
    apiKey: '',
    setActive: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider || !formData.modelId || !formData.apiKey) {
      alert('Please fill all fields including API Key');
      return;
    }
    
    try {
      await createProvider.mutateAsync(formData);
      // Clear form after successful save (never repopulate API key)
      setFormData({ provider: '', modelId: '', apiKey: '', setActive: false });
    } catch (error) {
      console.error('Error creating provider:', error);
    }
  };

  const handleTest = async (id: number) => {
    await testProvider.mutateAsync(id);
  };

  const handleSetActive = async (id: number) => {
    await setActiveProvider.mutateAsync(id);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this AI provider?')) {
      await deleteProvider.mutateAsync(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Provider Management</CardTitle>
        <p className="text-sm text-muted-foreground">
          API keys are encrypted and stored securely on the backend. They are never exposed to client-side code.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-2">
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
            placeholder="API Key (masked)"
            value={formData.apiKey}
            onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
            required
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="setActive"
              checked={formData.setActive}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, setActive: checked as boolean }))
              }
            />
            <label htmlFor="setActive" className="text-sm">Set Active</label>
          </div>
          <Button type="submit" disabled={createProvider.isPending} className="col-span-2">
            <Plus className="w-4 h-4 mr-2" />
            {createProvider.isPending ? 'Saving...' : 'Save Provider'}
          </Button>
        </form>

        {/* Providers Table */}
        {providers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No AI providers configured. Add one above to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Model ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.provider}</TableCell>
                  <TableCell>{provider.modelId}</TableCell>
                  <TableCell>
                    {provider.active ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {provider.hasKey ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Stored
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(provider.id)}
                        disabled={testProvider.isPending}
                      >
                        <TestTube className="w-3 h-3 mr-1" />
                        Test
                      </Button>
                      {!provider.active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetActive(provider.id)}
                          disabled={setActiveProvider.isPending}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(provider.id)}
                        disabled={deleteProvider.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
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