import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Store, Package, ChevronDown, ChevronUp, ExternalLink, Loader2, Globe, Settings, BarChart3, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { Product, Supplier } from "@shared/schema";
import { Link } from "wouter";

export default function AdminInventory() {
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<number>>(new Set());

  const { data: suppliers, isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const toggleSupplier = (supplierId: number) => {
    const newExpanded = new Set(expandedSuppliers);
    if (newExpanded.has(supplierId)) {
      newExpanded.delete(supplierId);
    } else {
      newExpanded.add(supplierId);
    }
    setExpandedSuppliers(newExpanded);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2" data-testid="heading-inventory-management">Inventory Management</h1>
            <p className="text-muted-foreground">View and manage all inventoried suppliers and their products</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/scraper">
              <Button variant="outline" className="border-border" data-testid="link-scraper">
                <Settings className="mr-2 h-4 w-4" /> Scraper Settings
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardDescription>Total Suppliers</CardDescription>
              <CardTitle className="text-2xl font-mono text-primary" data-testid="stat-total-suppliers">
                {suppliersLoading ? "..." : suppliers?.length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardDescription>Active Suppliers</CardDescription>
              <CardTitle className="text-2xl font-mono text-green-500" data-testid="stat-active-suppliers">
                {suppliersLoading ? "..." : suppliers?.filter(s => s.isActive).length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardDescription>Recently Updated</CardDescription>
              <CardTitle className="text-2xl font-mono text-blue-500" data-testid="stat-recently-updated">
                {suppliersLoading ? "..." : suppliers?.filter(s => s.lastScrapedAt).length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardDescription>Coming Soon</CardDescription>
              <CardTitle className="text-sm text-muted-foreground">More analytics</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-card/50 border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Inventoried Websites
            </CardTitle>
            <CardDescription>
              All suppliers that have been scraped or added to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {suppliersLoading ? (
              <div className="flex items-center justify-center py-8" data-testid="status-loading-suppliers">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : suppliers && suppliers.length > 0 ? (
              <div className="space-y-3">
                {suppliers.map((supplier) => (
                  <SupplierRow
                    key={supplier.id}
                    supplier={supplier}
                    isExpanded={expandedSuppliers.has(supplier.id)}
                    onToggle={() => toggleSupplier(supplier.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground" data-testid="status-no-suppliers">
                <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No suppliers found. Use the scraper to add some.</p>
                <Link href="/admin/scraper">
                  <Button variant="outline" className="mt-4 border-border" data-testid="link-add-supplier">
                    Go to Scraper
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics
              </CardTitle>
              <CardDescription>Product and pricing analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Coming soon: Price tracking, inventory trends, and more.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/scraper">
                <Button variant="outline" className="w-full justify-start border-border" data-testid="button-run-scraper">
                  <Globe className="mr-2 h-4 w-4" /> Run Browser Scraper
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start border-border" disabled data-testid="button-export">
                <Package className="mr-2 h-4 w-4" /> Export Products (Coming Soon)
              </Button>
              <Button variant="outline" className="w-full justify-start border-border text-red-400" disabled data-testid="button-cleanup">
                <Trash2 className="mr-2 h-4 w-4" /> Cleanup Duplicates (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface SupplierRowProps {
  supplier: Supplier;
  isExpanded: boolean;
  onToggle: () => void;
}

function SupplierRow({ supplier, isExpanded, onToggle }: SupplierRowProps) {
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { supplierId: supplier.id.toString() }],
    enabled: isExpanded,
  });

  return (
    <div className="border border-border rounded-lg">
      <div
        className="flex items-center justify-between p-4 cursor-pointer bg-card/30 rounded-t-lg"
        onClick={onToggle}
        data-testid={`supplier-row-${supplier.id}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground flex items-center gap-2" data-testid={`text-supplier-name-${supplier.id}`}>
              {supplier.name}
              {supplier.lastScrapedAt && (
                <Badge variant="outline" className="text-xs border-blue-700 text-blue-400">
                  Scraped
                </Badge>
              )}
              {supplier.csvUploaded && (
                <Badge variant="outline" className="text-xs border-green-700 text-green-400">
                  CSV Upload
                </Badge>
              )}
              {!supplier.isActive && (
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {supplier.websiteUrl && (
                <a
                  href={supplier.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`link-supplier-website-${supplier.id}`}
                >
                  <Globe className="h-3 w-3" />
                  {new URL(supplier.websiteUrl).hostname}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {supplier.lastScrapedAt && (
                <span data-testid={`text-last-scraped-${supplier.id}`}>
                  Last scraped {formatDistanceToNow(new Date(supplier.lastScrapedAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Products</div>
            <div className="font-mono text-primary">View</div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" data-testid={`icon-collapse-${supplier.id}`} />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" data-testid={`icon-expand-${supplier.id}`} />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border bg-background/50 p-4">
          {productsLoading ? (
            <div className="flex items-center justify-center py-4" data-testid={`status-loading-products-${supplier.id}`}>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading products...</span>
            </div>
          ) : products && products.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-3" data-testid={`text-product-count-${supplier.id}`}>
                Showing {products.length} products from {supplier.name}
              </div>
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <div
                      className="flex items-center gap-3 p-3 bg-card/50 rounded-lg cursor-pointer"
                      data-testid={`product-row-${product.id}`}
                    >
                      {product.primaryImageUrl ? (
                        <img
                          src={product.primaryImageUrl}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                          data-testid={`img-product-${product.id}`}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate" data-testid={`text-product-name-${product.id}`}>{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.partNumber && <span className="font-mono" data-testid={`text-part-number-${product.id}`}>#{product.partNumber}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-primary" data-testid={`text-product-price-${product.id}`}>${Number(product.price).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground" data-testid={`text-stock-status-${product.id}`}>
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground" data-testid={`status-no-products-${supplier.id}`}>
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No products found for this supplier</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
