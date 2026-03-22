import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { RefreshCw, Database, Trash2, Clock, Loader2, Globe, Image, Upload, FileSpreadsheet, AlertTriangle, Calendar, Tag, Building2 } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef } from "react";
import type { Supplier, Category, Product } from "@shared/schema";

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

export default function AdminDatabase() {
  const { toast } = useToast();
  const [isPolling, setIsPolling] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const [selectedSupplierForDelete, setSelectedSupplierForDelete] = useState<string>("");
  const [selectedCategoryForDelete, setSelectedCategoryForDelete] = useState<string>("");
  const [deleteBeforeDate, setDeleteBeforeDate] = useState<string>("");

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

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

  const csvImportMutation = useMutation({
    mutationFn: async () => {
      if (!csvFile) throw new Error("No CSV file selected");
      
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

  const deleteBySupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/products/by-supplier/${supplierId}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scraper/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Products Deleted",
        description: `Successfully deleted ${data.deletedCount} products.`,
      });
      setSelectedSupplierForDelete("");
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteByCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/products/by-category/${categoryId}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scraper/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Products Deleted",
        description: `Successfully deleted ${data.deletedCount} products.`,
      });
      setSelectedCategoryForDelete("");
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteByDateMutation = useMutation({
    mutationFn: async (beforeDate: string) => {
      const response = await apiRequest("DELETE", "/api/admin/products/by-date", { beforeDate });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scraper/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Products Deleted",
        description: `Successfully deleted ${data.deletedCount} products created before the selected date.`,
      });
      setDeleteBeforeDate("");
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRunSupplier = (supplierName: string) => {
    runScraperMutation.mutate(supplierName);
  };

  const handleRunBrowserScraper = (supplierName?: string, url?: string) => {
    runBrowserScraperMutation.mutate({ supplier: supplierName, url });
  };

  const handleCustomUrlScrape = () => {
    if (!customUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to scrape.",
        variant: "destructive",
      });
      return;
    }
    handleRunBrowserScraper(undefined, customUrl);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <div className="container px-4 py-8">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Database Management
          </h1>
          <p className="text-muted-foreground">Manage your product database, cleanup data, and update supplier information.</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <Link href="/admin/inventory">
            <Button variant="outline" className="gap-2" data-testid="link-inventory">
              <Database className="w-4 h-4" /> View Inventory
            </Button>
          </Link>
          <Link href="/admin/transfer">
            <Button variant="outline" className="gap-2" data-testid="link-transfer">
              <RefreshCw className="w-4 h-4" /> Data Transfer
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-5 h-5" />
                Database Cleanup
              </CardTitle>
              <CardDescription>
                Remove products from the database. Use with caution - these actions cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Delete by Supplier
                </Label>
                <div className="flex gap-2">
                  <Select value={selectedSupplierForDelete} onValueChange={setSelectedSupplierForDelete}>
                    <SelectTrigger className="flex-1 bg-background border-border" data-testid="select-delete-supplier">
                      <SelectValue placeholder="Select supplier..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {suppliers?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    onClick={() => selectedSupplierForDelete && deleteBySupplierMutation.mutate(selectedSupplierForDelete)}
                    disabled={!selectedSupplierForDelete || deleteBySupplierMutation.isPending}
                    data-testid="button-delete-by-supplier"
                  >
                    {deleteBySupplierMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Removes all products from the selected supplier.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Delete by Category
                </Label>
                <div className="flex gap-2">
                  <Select value={selectedCategoryForDelete} onValueChange={setSelectedCategoryForDelete}>
                    <SelectTrigger className="flex-1 bg-background border-border" data-testid="select-delete-category">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    onClick={() => selectedCategoryForDelete && deleteByCategoryMutation.mutate(selectedCategoryForDelete)}
                    disabled={!selectedCategoryForDelete || deleteByCategoryMutation.isPending}
                    data-testid="button-delete-by-category"
                  >
                    {deleteByCategoryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Removes all products in the selected category.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Delete by Date
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="datetime-local"
                    value={deleteBeforeDate}
                    onChange={(e) => setDeleteBeforeDate(e.target.value)}
                    className="flex-1 bg-background border-border"
                    data-testid="input-delete-date"
                  />
                  <Button
                    variant="destructive"
                    onClick={() => deleteBeforeDate && deleteByDateMutation.mutate(deleteBeforeDate)}
                    disabled={!deleteBeforeDate || deleteByDateMutation.isPending}
                    data-testid="button-delete-by-date"
                  >
                    {deleteByDateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Removes all products created before the selected date and time.</p>
              </div>

              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-300">
                    Warning: Deletion operations are permanent and cannot be undone. Make sure you have a backup before deleting data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                CSV Import
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
                    <li><code className="text-foreground">supplier</code>, <code className="text-foreground">part_number</code>, <code className="text-foreground">category</code></li>
                    <li><code className="text-foreground">subcategory</code>, <code className="text-foreground">car_model</code>, <code className="text-foreground">image_file</code></li>
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

        <Card className="bg-card/50 border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Web Scraping
            </CardTitle>
            <CardDescription>
              Scrape products from supplier websites using browser automation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-url" className="text-muted-foreground">
                Custom URL (optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="custom-url"
                  type="url"
                  placeholder="https://example.com/products"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 bg-background border-border"
                  data-testid="input-custom-url"
                />
                <Button 
                  onClick={handleCustomUrlScrape}
                  disabled={runBrowserScraperMutation.isPending || !customUrl}
                  className="gap-2"
                  data-testid="button-scrape-url"
                >
                  {runBrowserScraperMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  Scrape URL
                </Button>
              </div>
            </div>

            {browserProgress && browserProgress.status === "running" && (
              <div className="p-4 bg-background rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Scraping {browserProgress.supplier}...</span>
                  <Badge variant="secondary">
                    {browserProgress.savedProducts} / {browserProgress.totalProducts}
                  </Badge>
                </div>
                <Progress 
                  value={browserProgress.totalProducts > 0 ? (browserProgress.savedProducts / browserProgress.totalProducts) * 100 : 0} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Page {browserProgress.currentPage}
                  {browserProgress.currentProduct && ` - ${browserProgress.currentProduct}`}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statusLoading ? (
                <p className="text-muted-foreground">Loading suppliers...</p>
              ) : status?.map((s) => (
                <Card key={s.name} className="bg-muted/30 border-border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-white">{s.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {s.productCount} products
                      </p>
                    </div>
                    {s.lastScraped && (
                      <Badge variant="outline" className="text-xs border-border">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(new Date(s.lastScraped), { addSuffix: true })}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunSupplier(s.name)}
                      disabled={runScraperMutation.isPending}
                      className="flex-1"
                    >
                      Quick
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRunBrowserScraper(s.name)}
                      disabled={runBrowserScraperMutation.isPending}
                      className="flex-1"
                    >
                      Browser
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
