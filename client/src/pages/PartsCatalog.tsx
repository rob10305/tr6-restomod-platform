import { Navigation } from "@/components/Navigation";
import { MakeModelSelector } from "@/components/MakeModelSelector";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Supplier } from "@shared/schema";

export default function PartsCatalog() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("categoryId") || "";
  const initialCarModel = searchParams.get("carModel") || "";
  const initialSupplier = searchParams.get("supplierId") || "";
  const initialSort = searchParams.get("sort") || "newest";

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [carModel, setCarModel] = useState(initialCarModel);
  const [supplier, setSupplier] = useState(initialSupplier);
  const [sort, setSort] = useState(initialSort);

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("categoryId", category);
    if (carModel) params.set("carModel", carModel);
    if (supplier) params.set("supplierId", supplier);
    if (sort && sort !== "newest") params.set("sort", sort);
    const queryString = params.toString();
    const newPath = queryString ? `/parts?${queryString}` : "/parts";
    const currentPath = location + (window.location.search || "");
    if (currentPath !== newPath && location === "/parts") {
      setLocation(newPath, { replace: true });
    }
  }, [search, category, carModel, supplier, sort, location, setLocation]);

  const { data: products, isLoading } = useProducts({ 
    search, 
    categoryId: category,
    carModel: carModel,
    supplierId: supplier,
    sort: sort as any 
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Vehicle Selector */}
      <MakeModelSelector />
      
      <div className="container px-4 py-8">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Parts Catalog</h1>
          <p className="text-muted-foreground">Browse thousands of parts from top suppliers.</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card/50 p-4 rounded-xl border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, part number, or keyword..." 
              className="pl-9 bg-background border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <Select value={supplier || "all"} onValueChange={(val) => setSupplier(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[180px] bg-background border-border" data-testid="select-supplier">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers?.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category || "all"} onValueChange={(val) => setCategory(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[180px] bg-background border-border" data-testid="select-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="1">Engine</SelectItem>
                <SelectItem value="2">Suspension</SelectItem>
                <SelectItem value="3">Interior</SelectItem>
                <SelectItem value="5">Electrical</SelectItem>
                <SelectItem value="6">Brakes</SelectItem>
                <SelectItem value="7">Wheels</SelectItem>
                <SelectItem value="8">Exhaust</SelectItem>
              </SelectContent>
            </Select>

            <Select value={carModel || "all"} onValueChange={(val) => setCarModel(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[180px] bg-background border-border" data-testid="select-carmodel">
                <SelectValue placeholder="Car Model" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="TR6">TR6</SelectItem>
                <SelectItem value="TR4A">TR4A</SelectItem>
                <SelectItem value="TR250">TR250</SelectItem>
                <SelectItem value="TR2">TR2</SelectItem>
                <SelectItem value="GT6">GT6</SelectItem>
                <SelectItem value="Spitfire">Spitfire</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px] bg-background border-border" data-testid="select-sort">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="newest">Newest Arrivals</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Best Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[300px] w-full bg-card rounded-xl" />
                <Skeleton className="h-4 w-2/3 bg-card" />
                <Skeleton className="h-4 w-1/3 bg-card" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-card mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No parts found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
