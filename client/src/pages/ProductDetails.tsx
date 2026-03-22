import { Navigation } from "@/components/Navigation";
import { useProduct } from "@/hooks/use-products";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Heart, ExternalLink, Activity, Info } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAddToWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";
import { useSupplierMap } from "@/hooks/use-suppliers";
import { formatPrice } from "@/lib/currency";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProductDetails() {
  const [, params] = useRoute("/products/:id");
  const id = Number(params?.id);
  const { data: product, isLoading } = useProduct(id);
  const { user } = useAuth();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { toast } = useToast();
  const supplierMap = useSupplierMap();

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container px-4 py-8">
          <Skeleton className="h-[600px] w-full bg-card rounded-xl" />
        </div>
      </div>
    );
  }

  const priceHistoryData = [
    { date: 'Jan', price: Number(product.price) * 0.95 },
    { date: 'Feb', price: Number(product.price) * 0.98 },
    { date: 'Mar', price: Number(product.price) },
  ];

  const handleWishlist = () => {
    if (!user) {
      toast({ title: "Please log in", description: "You need an account to save items.", variant: "destructive" });
      return;
    }
    addToWishlist({ userId: user.id, productId: product.id, notes: "" });
    toast({ title: "Added to Build List", description: "Item saved to your profile." });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />
      
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-card rounded-2xl overflow-hidden border border-border">
              {product.primaryImageUrl ? (
                <img src={product.primaryImageUrl} alt={product.name} className="w-full h-full object-contain p-8" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
              )}
            </div>
          </div>

          {/* Right Column - Info */}
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">{product.name}</h1>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="bg-muted px-2 py-1 rounded text-muted-foreground font-mono">Part #{product.partNumber}</span>
                <span className="text-muted-foreground" data-testid="text-supplier">Supplier: {supplierMap.get(product.supplierId) || "Unknown"}</span>
                {product.subcategory && (
                  <span className="bg-muted px-2 py-1 rounded text-muted-foreground" data-testid="text-subcategory">{product.subcategory}</span>
                )}
              </div>
              {product.carModel && (
                <div className="mt-2 text-sm text-muted-foreground" data-testid="text-carmodel">
                  Fits: <span className="text-foreground">{product.carModel}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="text-4xl font-bold font-mono text-primary">{formatPrice(product.price, product.currency)}</div>
              {product.originalPrice && (
                <div className="text-xl text-muted-foreground line-through font-mono">{formatPrice(product.originalPrice, product.currency)}</div>
              )}
            </div>

            <div className="flex flex-col gap-3 mb-8">
              <Button size="lg" className="w-full bg-primary text-black font-bold" onClick={() => window.open(product.productUrl, '_blank')} data-testid="button-buynow">
                <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
                <ExternalLink className="ml-2 h-4 w-4 opacity-50" />
              </Button>
              <Button size="lg" variant="outline" className="w-full border-border" onClick={handleWishlist} data-testid="button-wishlist">
                <Heart className="mr-2 h-5 w-5" /> Add to Build List
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              <Badge variant="outline" className="border-border text-foreground py-1 px-3" data-testid="badge-stockstatus">
                {product.inStock ? "In Stock" : "Out of Stock"}
              </Badge>
              {product.isOem && <Badge variant="secondary" className="bg-muted text-foreground py-1 px-3" data-testid="badge-oem">OEM Spec</Badge>}
              {product.isPerformance && <Badge variant="secondary" className="bg-amber-900/50 text-amber-500 py-1 px-3" data-testid="badge-performance">Performance Upgrade</Badge>}
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full bg-card border-border">
                <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">Price History</TabsTrigger>
                <TabsTrigger value="specs" data-testid="tab-specs">Specifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-4 space-y-4">
                <Card className="p-6 bg-card/30 border-border">
                  <p className="text-foreground leading-relaxed">
                    {product.description || "No description available for this product."}
                  </p>
                </Card>
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <Card className="p-6 bg-card/30 border-border h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                        itemStyle={{ color: '#fbbf24' }}
                      />
                      <Line type="monotone" dataKey="price" stroke="#fbbf24" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </TabsContent>

              <TabsContent value="specs" className="mt-4">
                <Card className="p-6 bg-card/30 border-border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {product.carModel && (
                      <>
                        <div className="text-muted-foreground">Compatible Models</div>
                        <div className="text-foreground" data-testid="spec-carmodel">{product.carModel}</div>
                      </>
                    )}
                    {product.subcategory && (
                      <>
                        <div className="text-muted-foreground">Subcategory</div>
                        <div className="text-foreground" data-testid="spec-subcategory">{product.subcategory}</div>
                      </>
                    )}
                    <div className="text-muted-foreground">Part Number</div>
                    <div className="text-foreground font-mono" data-testid="spec-partnumber">{product.partNumber || "N/A"}</div>
                    <div className="text-muted-foreground">Difficulty</div>
                    <div className="text-foreground capitalize" data-testid="spec-difficulty">{product.difficultyLevel || "Medium"}</div>
                    <div className="text-muted-foreground">Stock Status</div>
                    <div className="text-foreground" data-testid="spec-stockstatus">{product.inStock ? "In Stock" : "Out of Stock"}</div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
