import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export function useAiSettings() {
  return useQuery({
    queryKey: ['admin.aiSettings.v2'],               // NEW key (v2 busts old cache)
    queryFn: async () => {
      const response = await api('/admin/ai-settings');
      return await response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });
}