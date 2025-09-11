import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { API_ENDPOINTS } from '../config/apiEndpoints';

interface SecureAiProvider {
  id: number;
  provider: string;
  modelId: string;
  active: boolean;
  hasKey: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateProviderData {
  provider: string;
  modelId: string;
  apiKey: string;
  setActive?: boolean;
}

interface TestResult {
  ok: boolean;
  message?: string;
  latencyMs?: number;
}

export function useSecureAiProviders() {
  return useQuery<SecureAiProvider[]>({
    queryKey: ['secure-ai-providers'],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.aiProviders(), {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch AI providers');
      }
      return response.json();
    },
  });
}

export function useCreateSecureAiProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateProviderData) => {
      const response = await fetch(API_ENDPOINTS.aiProviders(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create provider');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-ai-providers'] });
      toast({
        title: "Success",
        description: "AI provider created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useTestSecureAiProvider() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number): Promise<TestResult> => {
      const response = await fetch(API_ENDPOINTS.aiProviderTest(id), {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to test provider');
      }

      return response.json();
    },
    onSuccess: (result) => {
      if (result.ok) {
        toast({
          title: "Test Successful",
          description: `Provider connection verified${result.latencyMs ? ` (${result.latencyMs}ms)` : ''}`,
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.message || "Provider test failed",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSecureAiProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(API_ENDPOINTS.aiProviderById(id), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete provider');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-ai-providers'] });
      toast({
        title: "Success",
        description: "AI provider deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSetActiveSecureAiProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(API_ENDPOINTS.aiProviderById(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ setActive: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set active provider');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-ai-providers'] });
      toast({
        title: "Success",
        description: "Active AI provider updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}