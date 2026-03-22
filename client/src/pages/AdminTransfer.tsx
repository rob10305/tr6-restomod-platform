import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Download, Upload, Database, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { Link } from "wouter";

interface ImportResult {
  success: boolean;
  results: {
    suppliers: { imported: number; skipped: number };
    categories: { imported: number; skipped: number };
    products: { imported: number; skipped: number };
    errors: string[];
  };
}

export default function AdminTransfer() {
  const { toast } = useToast();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/export', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tr6-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Export Complete",
        description: "Data has been downloaded. Upload this file on your production site to import.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!importFile) throw new Error("Please select a file to import");
      
      const formData = new FormData();
      formData.append('dataFile', importFile);
      
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      
      return response.json() as Promise<ImportResult>;
    },
    onSuccess: (data) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      
      const totalImported = data.results.suppliers.imported + data.results.products.imported;
      toast({
        title: "Import Complete",
        description: `Successfully imported ${totalImported} items.`,
      });
      
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
              Data Transfer
            </h1>
            <p className="text-muted-foreground">
              Export data from development and import it to production.
            </p>
          </div>
          <Link href="/admin/scraper">
            <Button variant="outline" className="gap-2 border-border" data-testid="link-scraper">
              <Database className="w-4 h-4" />
              Back to Scraper
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                Step 1: Export Data
                <Badge variant="secondary" className="ml-2">Development</Badge>
              </CardTitle>
              <CardDescription>
                Download all suppliers, categories, and products as a JSON file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-background rounded-lg border border-border">
                <h4 className="font-medium text-muted-foreground mb-2">What gets exported:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    All suppliers and their settings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    All products with images and prices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Category mappings
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                className="w-full gap-2"
                data-testid="button-export"
              >
                {exportMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exportMutation.isPending ? "Exporting..." : "Export All Data"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                Step 2: Import Data
                <Badge variant="default" className="ml-2">Production</Badge>
              </CardTitle>
              <CardDescription>
                Upload the exported JSON file to import data into this environment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="import-file" className="text-muted-foreground">
                  Select Export File
                </Label>
                <Input
                  ref={fileInputRef}
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="bg-background border-border"
                  data-testid="input-import-file"
                />
              </div>

              {importFile && (
                <div className="p-3 bg-background rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    Selected: <span className="text-amber-400">{importFile.name}</span>
                  </p>
                </div>
              )}
              
              <Button 
                onClick={() => importMutation.mutate()}
                disabled={!importFile || importMutation.isPending}
                className="w-full gap-2"
                data-testid="button-import"
              >
                {importMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {importMutation.isPending ? "Importing..." : "Import Data"}
              </Button>

              {importResult && (
                <div className="p-4 bg-background rounded-lg border border-border space-y-3">
                  <h4 className="font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Import Results
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Suppliers imported:</div>
                    <div className="text-foreground">{importResult.results.suppliers.imported}</div>
                    <div className="text-muted-foreground">Suppliers skipped:</div>
                    <div className="text-muted-foreground">{importResult.results.suppliers.skipped}</div>
                    <div className="text-muted-foreground">Products imported:</div>
                    <div className="text-foreground">{importResult.results.products.imported}</div>
                    <div className="text-muted-foreground">Products skipped:</div>
                    <div className="text-muted-foreground">{importResult.results.products.skipped}</div>
                  </div>
                  {importResult.results.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {importResult.results.errors.length} errors occurred
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              How to Transfer Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4 text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <p className="text-foreground font-medium">Export from Development</p>
                  <p className="text-sm">On your development site, click "Export All Data" to download the JSON file.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <p className="text-foreground font-medium">Go to Production Site</p>
                  <p className="text-sm">Navigate to restomod.life/admin/transfer in your browser.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <p className="text-foreground font-medium">Import the Data</p>
                  <p className="text-sm">Upload the JSON file and click "Import Data". Existing items will be skipped.</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
