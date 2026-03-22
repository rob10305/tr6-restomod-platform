import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Link } from "wouter";
import { type Product } from "@shared/schema";
import { useAddToWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useSupplierMap } from "@/hooks/use-suppliers";
import { formatPrice } from "@/lib/currency";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { toast } = useToast();
  const supplierMap = useSupplierMap();

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please log in", description: "You need an account to save items.", variant: "destructive" });
      return;
    }
    
    addToWishlist({ 
      userId: user.id,
      productId: product.id,
      notes: ""
    }, {
      onSuccess: () => {
        toast({ title: "Added to Build List", description: `${product.name} saved.` });
      }
    });
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group relative block h-full">
        <Card className="h-full overflow-hidden bg-card border-border transition-all duration-300 hover-elevate">
          <div className="aspect-square relative overflow-hidden bg-muted/30">
            {product.primaryImageUrl ? (
              <img 
                src={product.primaryImageUrl} 
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Eye className="h-12 w-12" />
              </div>
            )}
            
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <Badge className="absolute top-2 right-2 bg-red-600" data-testid={`badge-sale-${product.id}`}>
                Sale
              </Badge>
            )}
          </div>
          
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {product.name}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground tracking-wider mt-1" data-testid={`text-supplier-${product.id}`}>
              Supplier: {supplierMap.get(product.supplierId) || "Unknown"}
            </p>
            {product.carModel && (
              <p className="text-xs text-muted-foreground mt-1" data-testid={`text-carmodel-${product.id}`}>
                Fits: {product.carModel}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="p-4 pt-0 flex-grow">
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-primary">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through font-mono">
                  {formatPrice(product.originalPrice, product.currency)}
                </span>
              )}
            </div>
            
            <div className="mt-3 flex gap-2 flex-wrap">
              {product.subcategory && <Badge variant="outline" className="text-xs border-border text-muted-foreground" data-testid={`badge-subcategory-${product.id}`}>{product.subcategory}</Badge>}
              {product.isOem && <Badge variant="outline" className="text-xs border-border text-muted-foreground" data-testid={`badge-oem-${product.id}`}>OEM</Badge>}
              {product.isPerformance && <Badge variant="outline" className="text-xs border-primary/50 text-primary" data-testid={`badge-performance-${product.id}`}>Performance</Badge>}
              {!product.inStock && <Badge variant="destructive" className="text-xs" data-testid={`badge-outofstock-${product.id}`}>Out of Stock</Badge>}
            </div>
          </CardContent>
          
          <CardFooter className="p-4 pt-0 mt-auto flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 bg-primary text-primary-foreground"
              onClick={(e) => { e.preventDefault(); window.open(product.productUrl, '_blank'); }}
              data-testid={`button-buynow-${product.id}`}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy Now
            </Button>
            <Button 
              size="icon" 
              variant="outline" 
              className="border-border"
              onClick={handleWishlist}
              data-testid={`button-wishlist-${product.id}`}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Link>
  );
}
