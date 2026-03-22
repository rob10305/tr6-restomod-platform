import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertWishlistItem } from "@shared/routes";

export function useWishlist() {
  return useQuery({
    queryKey: [api.wishlist.list.path],
    queryFn: async () => {
      const res = await fetch(api.wishlist.list.path, { credentials: "include" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Failed to fetch wishlist");
      return api.wishlist.list.responses[200].parse(await res.json());
    },
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: InsertWishlistItem) => {
      const res = await fetch(api.wishlist.add.path, {
        method: api.wishlist.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add to wishlist");
      return api.wishlist.add.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.wishlist.list.path] }),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.wishlist.remove.path, { id });
      const res = await fetch(url, {
        method: api.wishlist.remove.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove from wishlist");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.wishlist.list.path] }),
  });
}
