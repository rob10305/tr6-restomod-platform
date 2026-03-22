import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertGarageItem } from "@shared/routes";

export function useGarage() {
  return useQuery({
    queryKey: [api.garage.list.path],
    queryFn: async () => {
      const res = await fetch(api.garage.list.path, { credentials: "include" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Failed to fetch garage");
      return api.garage.list.responses[200].parse(await res.json());
    },
  });
}

export function useAddToGarage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: InsertGarageItem) => {
      const res = await fetch(api.garage.add.path, {
        method: api.garage.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add to garage");
      return api.garage.add.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.garage.list.path] }),
  });
}

export function useUpdateGarageItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertGarageItem>) => {
      const url = buildUrl(api.garage.update.path, { id });
      const res = await fetch(url, {
        method: api.garage.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update garage item");
      return api.garage.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.garage.list.path] }),
  });
}
