import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { MarketplaceListing, InsertMarketplaceListing } from "@shared/schema";

export function useMarketplaceListings(params?: { userId?: string; itemType?: string; status?: string }) {
  const queryString = params ? new URLSearchParams(params as any).toString() : '';
  return useQuery<MarketplaceListing[]>({
    queryKey: ['/api/marketplace', params],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace${queryString ? `?${queryString}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch listings');
      return response.json();
    },
  });
}

export function useMyMarketplaceListings() {
  return useQuery<MarketplaceListing[]>({
    queryKey: ['/api/marketplace/my-listings'],
  });
}

export function useMarketplaceListing(id: number) {
  return useQuery<MarketplaceListing>({
    queryKey: ['/api/marketplace', id],
    enabled: !!id,
  });
}

export function useCreateMarketplaceListing() {
  return useMutation({
    mutationFn: async (listing: Omit<InsertMarketplaceListing, 'userId'>) => {
      const response = await apiRequest('POST', '/api/marketplace', listing);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/my-listings'] });
    },
  });
}

export function useUpdateMarketplaceListing() {
  return useMutation({
    mutationFn: async ({ id, ...listing }: { id: number } & Partial<InsertMarketplaceListing>) => {
      const response = await apiRequest('PUT', `/api/marketplace/${id}`, listing);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/my-listings'] });
    },
  });
}

export function useDeleteMarketplaceListing() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/marketplace/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/my-listings'] });
    },
  });
}

export async function uploadMarketplaceImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  
  const response = await fetch('/api/marketplace/upload-images', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload images');
  }
  
  const result = await response.json();
  return result.imageUrls;
}
