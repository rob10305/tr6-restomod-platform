import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useSuppliers() {
  return useQuery({
    queryKey: [api.suppliers.list.path],
    queryFn: async () => {
      const res = await fetch(api.suppliers.list.path);
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return api.suppliers.list.responses[200].parse(await res.json());
    },
  });
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: [api.suppliers.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.suppliers.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch supplier");
      return api.suppliers.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useSupplierMap() {
  const { data: suppliers } = useSuppliers();
  const supplierMap = new Map<number, string>();
  
  if (suppliers) {
    suppliers.forEach(s => supplierMap.set(s.id, s.name));
  }
  
  return supplierMap;
}
