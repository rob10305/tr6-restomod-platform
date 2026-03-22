import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertBuildThread } from "@shared/routes";

export function useBuildThreads(userId?: string) {
  return useQuery({
    queryKey: [api.buildThreads.list.path, userId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      
      const url = `${api.buildThreads.list.path}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch build threads");
      return api.buildThreads.list.responses[200].parse(await res.json());
    },
  });
}

export function useBuildThread(id: number) {
  return useQuery({
    queryKey: [api.buildThreads.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.buildThreads.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch build thread");
      return api.buildThreads.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateBuildThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBuildThread) => {
      const res = await fetch(api.buildThreads.create.path, {
        method: api.buildThreads.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create build thread");
      return api.buildThreads.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.buildThreads.list.path] }),
  });
}
