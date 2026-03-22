import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { RefreshCw, Database, CheckCircle, XCircle, Clock, Loader2, Globe, Image, Monitor, ChevronDown, ChevronUp, ExternalLink, Link as LinkIcon, Upload, FileSpreadsheet, ImagePlus } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef } from "react";
import type { Product } from "@shared/schema";

interface ScraperStatus {
  name: string;
  lastScraped: string | null;
  productCount: number;
  isAutoDiscovered: boolean;
  websiteUrl: string | null;
}

interface ScrapeResult {
  supplier: string;
  productsScraped: number;
  productsSaved: number;
  errors: string[];
}

interface BrowserScrapeResult extends ScrapeResult {
  imagesDownloaded: number;
  savedProductIds: number[];
  scrapedProductIds: number[];
}

interface ScrapeProgress {
  supplier: string;
  status: "idle" | "running" | "completed" | "error";
  currentPage: number;
  totalProducts: number;
  savedProducts: number;
  currentProduct?: string;
  error?: string;
}

interface CSVImportResult {
  success: boolean;
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
  imagesUploaded: number;
}

export default function AdminScraper() {
  const { toast } = useToast();
  const [isPolling, setIsPolling] = useState(false);
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [loadedProducts, setLoadedProducts] = useState<Map<string, Product[]>>(new Map());
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());
  const [customUrl, setCustomUrl] = useState("");
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const toggleSupplier = async (supplierName: string, productIds: number[]) => {
    const newExpanded = new Set(expandedSuppliers);
    if (newExpanded.has(supplierName)) {
      newExpanded.delete(supplierName);
    } else {
      newExpanded.add(supplierName);
      if (!loadedProducts.has(supplierName) && productIds.length > 0) {
        setLoadingProducts(prev => new Set(prev).add(supplierName));
        try {
          const response = await apiRequest("POST", "/api/products/by-ids", { ids: productIds });
          const products = await response.json();
          setLoadedProducts(prev => new Map(prev).set(supplierName, products));
        } catch (error) {
          console.error("Failed to load products:", error);
        }
        setLoadingProducts(prev => {
          const next = new Set(prev);
          next.delete(supplierName);
          return next;
        });
      }
    }
    setExpandedSuppliers(newExpanded);
  };

  const { data: status, isLoading: statusLoading } = useQuery<ScraperStatus[]>({
    queryKey: ["/api/admin/scraper/status"],
  });

  const { data: browserProgress } = useQuery<ScrapeProgress>({
    queryKey: ["/api/admin/browser-scraper/progress"],
    refetchInterval: isPolling ? 1000 : false,
    enabled: isPolling,
  });

  const runScraperMutation = useMutation({
    mutationFn: async (supplier?: string) => {
      const response = await apiRequest("POST", "/api/admin/scraper/run", { supplier });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scraper/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      const results = data.results as ScrapeResult[];
      const totalSaved = results.reduce((acc, r) => acc + r.productsSaved, 0);
      
      toast({
        title: "Scraping Complete",
        description: `Successfully saved ${totalSaved} new products from ${results.length} supplier(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Scraping Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const runBrowserScraperMutation = useMutation({
    mutationFn: async ({ supplier, url }: { supplier?: string; url?: string }) => {
      setIsPolling(true);
      const response = await apiRequest("POST", "/api/admin/browser-scraper/run", { supplier, url });
      return response.json();
    },
    onSuccess: (data) => {
      setIsPolling(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scraper/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      const results = data.results as BrowserScrapeResult[];
      const totalSaved = results.reduce((acc, r) => acc + r.productsSaved, 0);
      const totalImages = results.reduce((acc, r) => acc + r.imagesDownloaded, 0);
      
      toast({
        title: "Browser Scraping Complete",
        description: `Saved ${totalSaved} products with ${totalImages} images from ${results.length} supplier(s).`,
      });
    },
    onError: (error: Error) => {
      setIsPolling(false);
      toast({
        title: "Browser Scraping Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRunAll = () => {
    runScraperMutation.mutate(undefined);
  };

  const handleRunSupplier = (supplier: string) => {
    runScraperMutation.mutate(supplier);
  };

  const handleRunBrowserScraper = (supplier?: string, url?: string) => {
    runBrowserScraperMutation.mutate({ supplier, url });
  };

  const csvImportMutation = useMutation({
    mutationFn: async () => {
      if (!csvFile) throw new Error("Please select a CSV file");
      
      const formData = new FormData();
      formData.append('csv', csvFile);
      formData.append('supplierName', supplierName || 'CSV Import');
      
      if (imageFiles) {
        for (let i = 0; i < imageFiles.length; i++) {
          formData.append('images', imageFiles[i]);
        }
      }
      
      const response = await fetch('/api/admin/import/csv', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      
      return response.json() as Promise<CSVImportResult>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scraper/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      toast({
        title: "CSV Import Complete",
        description: `Imported ${data.imported} products, skipped ${data.skipped}. ${data.imagesUploaded} images uploaded.`,
      });
      
      setCsvFile(null);
      setImageFiles(null);
      setSupplierName("");
      if (csvInputRef.current) csvInputRef.current.value = "";
      if (imagesInputRef.current) imagesInputRef.current.value = "";
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="container px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-display font-bold text-foreground" data-testid="text-page-title">
              Admin: Parts Scraper
            </h1>
            <p className="text-muted-foreground">
              Populate the database by scraping TR6 parts from various suppliers.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/transfer">
              <Button variant="outline" className="gap-2 border-border" data-testid="link-transfer">
                <Upload className="w-4 h-4" />
                Transfer Data
              </Button>
            </Link>
            <Link href="/admin/inventory">
              <Button variant="outline" className="gap-2 border-border" data-testid="link-inventory">
                <Database className="w-4 h-4" />
                View Inventory
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Quick Scraper
              </CardTitle>
              <CardDescription>
                Fast scraper using sample data. Good for testing and demos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleRunAll}
                disabled={runScraperMutation.isPending || runBrowserScraperMutation.isPending}
                className="gap-2"
                data-testid="button-run-all-scrapers"
              >
                {runScraperMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {runScraperMutation.isPending ? "Scraping..." : "Run Quick Scraper"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Browser Scraper
                <Badge variant="secondary" className="ml-2">
                  <Image className="w-3 h-3 mr-1" />
                  With Images
                </Badge>
              </CardTitle>
              <CardDescription>
                Uses a real browser to scrape actual supplier websites. Captures product images.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-url" className="text-muted-foreground flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Custom URL (optional)
                </Label>
                <Input
                  id="custom-url"
                  type="url"
                  placeholder="https://example.com/product-category/..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="bg-background border-border"
                  data-testid="input-custom-url"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a product category page URL from any WooCommerce site to scrape products from it.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleRunBrowserScraper(undefined, customUrl || undefined)}
                  disabled={runScraperMutation.isPending || runBrowserScraperMutation.isPending}
                  className="gap-2"
                  variant="default"
                  data-testid="button-run-browser-scraper"
                >
                  {runBrowserScraperMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  {runBrowserScraperMutation.isPending ? "Scraping..." : customUrl ? "Scrape Custom URL" : "Run All Suppliers"}
                </Button>
                {customUrl && (
                  <Button
                    variant="outline"
                    onClick={() => setCustomUrl("")}
                    disabled={runBrowserScraperMutation.isPending}
                    data-testid="button-clear-url"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {browserProgress && browserProgress.status === "running" && (
                <div className="space-y-2 p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Scraping: {browserProgress.supplier}</span>
                    <span className="text-amber-400">{browserProgress.totalProducts} products found</span>
                  </div>
                  {browserProgress.currentProduct && (
                    <p className="text-xs text-muted-foreground truncate">
                      {browserProgress.currentProduct}
                    </p>
                  )}
                  <Progress 
                    value={browserProgress.totalProducts > 0 ? (browserProgress.savedProducts / browserProgress.totalProducts) * 100 : 0} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{browserProgress.savedProducts} saved</span>
                    <span>Page {browserProgress.currentPage}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                CSV Import
                <Badge variant="secondary" className="ml-2">
                  <ImagePlus className="w-3 h-3 mr-1" />
                  With Images
                </Badge>
              </CardTitle>
              <CardDescription>
                Import products from a CSV file with optional image uploads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-name" className="text-muted-foreground">
                  Default Supplier Name
                </Label>
                <Input
                  id="supplier-name"
                  type="text"
                  placeholder="e.g., My Parts Supplier"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="bg-background border-border"
                  data-testid="input-supplier-name"
                />
                <p className="text-xs text-muted-foreground">
                  Used when CSV row doesn't have a supplier column
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="csv-file" className="text-muted-foreground flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  CSV File
                </Label>
                <Input
                  ref={csvInputRef}
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="bg-background border-border"
                  data-testid="input-csv-file"
                />
                <div className="text-xs text-muted-foreground space-y-1 p-3 bg-background rounded-lg border border-border">
                  <p className="font-medium text-muted-foreground">Required CSV columns:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li><code className="text-amber-400">name</code> - Product name (required)</li>
                    <li><code className="text-amber-400">price</code> - Price in dollars</li>
                  </ul>
                  <p className="font-medium text-muted-foreground mt-2">Optional columns:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li><code className="text-foreground">supplier</code> or <code className="text-foreground">vendor</code> - Supplier per row (overrides default above)</li>
                    <li><code className="text-foreground">part_number</code> or <code className="text-foreground">sku</code></li>
                    <li><code className="text-foreground">description</code></li>
                    <li><code className="text-foreground">category</code> (e.g., engine, brakes, suspension)</li>
                    <li><code className="text-foreground">url</code> - Product page URL</li>
                    <li><code className="text-foreground">image_url</code> - External image URL</li>
                    <li><code className="text-foreground">in_stock</code> (true/false)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="images" className="text-muted-foreground flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Images Folder (optional)
                </Label>
                <Input
                  ref={imagesInputRef}
                  id="images"
                  type="file"
                  accept="image/*"
                  {...{ webkitdirectory: "", directory: "" } as any}
                  onChange={(e) => setImageFiles(e.target.files)}
                  className="bg-background border-border"
                  data-testid="input-images-folder"
                />
                {imageFiles && imageFiles.length > 0 && (
                  <p className="text-xs text-amber-400">
                    Found {imageFiles.length} image(s) in selected folder
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Select a folder containing product images. Subfolders will be included. 
                  Images are matched by SKU or product name (e.g., "TR6-BRAKE-001.jpg" matches part_number "TR6-BRAKE-001").
                  If not selected, no images will be imported.
                </p>
              </div>

              {csvFile && (
                <div className="p-3 bg-background rounded-lg border border-border">
                  <p className="text-sm text-foreground">
                    Selected: <span className="text-amber-400">{csvFile.name}</span>
                    {imageFiles && imageFiles.length > 0 && (
                      <span className="text-muted-foreground"> + {imageFiles.length} images</span>
                    )}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={() => csvImportMutation.mutate()}
                disabled={!csvFile || csvImportMutation.isPending}
                className="gap-2 w-full"
                data-testid="button-import-csv"
              >
                {csvImportMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {csvImportMutation.isPending ? "Importing..." : "Import CSV"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-4">Supplier Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statusLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="bg-card/50 border-border animate-pulse">
                <CardHeader>
                  <div className="h-6 w-32 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))
          ) : status?.map((supplier) => (
            <Card key={supplier.name} className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span data-testid={`text-supplier-${supplier.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      {supplier.name}
                    </span>
                    {supplier.isAutoDiscovered && (
                      <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                        Auto-discovered
                      </Badge>
                    )}
                  </div>
                  <Badge variant={supplier.productCount > 0 ? "default" : "secondary"}>
                    {supplier.productCount} products
                  </Badge>
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {supplier.lastScraped 
                      ? `Last scraped ${formatDistanceToNow(new Date(supplier.lastScraped))} ago`
                      : "Never scraped"
                    }
                  </div>
                  {supplier.websiteUrl && (
                    <a 
                      href={supplier.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-amber-400 transition-colors"
                      data-testid={`link-supplier-website-${supplier.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {supplier.websiteUrl.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRunSupplier(supplier.name)}
                  disabled={runScraperMutation.isPending || runBrowserScraperMutation.isPending}
                  className="gap-2"
                  data-testid={`button-scrape-${supplier.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {runScraperMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Quick
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleRunBrowserScraper(supplier.name)}
                  disabled={runScraperMutation.isPending || runBrowserScraperMutation.isPending}
                  className="gap-2"
                  data-testid={`button-browser-scrape-${supplier.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {runBrowserScraperMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Globe className="w-3 h-3" />
                  )}
                  Browser
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
