import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

const KEY = ['admin.aiSettings.v2']; // New key to bust old caches

export const useAiSettings = () =>
  useQuery({ 
    queryKey: KEY, 
    queryFn: async () => {
      const response = await api('/admin/ai-settings');
      return await response.json();
    },
    staleTime: 0, 
    gcTime: 0, 
    refetchOnMount: 'always', 
    refetchOnWindowFocus: 'always' 
  });

export const useCreateAiSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {provider:string; modelId:string; isActive?:boolean}) => {
      return api('/admin/ai-settings', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};