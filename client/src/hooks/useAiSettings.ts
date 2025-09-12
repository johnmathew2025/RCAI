import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const KEY = ['admin.aiSettings.v2']; // New key to bust old caches

export const useAiSettings = ({ enabled = false } = {}) =>
  useQuery({ 
    queryKey: KEY, 
    queryFn: async () => {
      const response = await api(API_ENDPOINTS.aiProviders());
      return await response.json();
    },
    enabled,
    staleTime: 0, 
    gcTime: 0, 
    refetchOnMount: 'always', 
    refetchOnWindowFocus: 'always' 
  });

export const useCreateAiSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {provider:string; modelId:string; isActive?:boolean}) => {
      return api(API_ENDPOINTS.aiProviders(), { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
};