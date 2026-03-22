import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useGarage } from "@/hooks/use-garage";
import { useWishlist } from "@/hooks/use-wishlist";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Car, Heart, Settings, Trash2, List, Video, FileText, ShoppingCart, ExternalLink, Plus, X, MapPin, Truck, Package, ImageIcon } from "lucide-react";
import { useRemoveFromWishlist } from "@/hooks/use-wishlist";
import { useMyMarketplaceListings, useCreateMarketplaceListing, useDeleteMarketplaceListing, uploadMarketplaceImages } from "@/hooks/use-marketplace";
import { formatPrice } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: garage } = useGarage();
  const { data: wishlist } = useWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();
  const { data: myListings, isLoading: listingsLoading } = useMyMarketplaceListings();
  const { mutate: createListing, isPending: isCreating } = useCreateMarketplaceListing();
  const { mutate: deleteListing } = useDeleteMarketplaceListing();
  const { toast } = useToast();
  
  const [isListingFormOpen, setIsListingFormOpen] = useState(false);
  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    itemType: 'part',
    condition: 'used_good',
    price: '',
    currency: 'USD',
    negotiable: false,
    shippingAvailable: false,
    shippingCost: '',
    pickupOnly: true,
    location: '',
    partNumber: '',
    manufacturer: '',
    yearFrom: '',
    yearTo: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Basic query param handling to select tab
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const defaultTab = searchParams.get("tab") || "overview";

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 10) {
      toast({ title: "Error", description: "Maximum 10 images allowed", variant: "destructive" });
      return;
    }
    setSelectedImages(prev => [...prev, ...files]);
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setListingForm({
      title: '',
      description: '',
      itemType: 'part',
      condition: 'used_good',
      price: '',
      currency: 'USD',
      negotiable: false,
      shippingAvailable: false,
      shippingCost: '',
      pickupOnly: true,
      location: '',
      partNumber: '',
      manufacturer: '',
      yearFrom: '',
      yearTo: '',
      contactEmail: '',
      contactPhone: '',
    });
    setSelectedImages([]);
    setImagePreviewUrls([]);
  };

  const handleCreateListing = async () => {
    if (!listingForm.title || !listingForm.price) {
      toast({ title: "Error", description: "Title and price are required", variant: "destructive" });
      return;
    }

    try {
      setIsUploading(true);
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadMarketplaceImages(selectedImages);
      }

      createListing({
        title: listingForm.title,
        description: listingForm.description || undefined,
        itemType: listingForm.itemType,
        condition: listingForm.condition || undefined,
        price: listingForm.price,
        currency: listingForm.currency,
        negotiable: listingForm.negotiable,
        shippingAvailable: listingForm.shippingAvailable,
        shippingCost: listingForm.shippingCost || undefined,
        pickupOnly: listingForm.pickupOnly,
        location: listingForm.location || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        partNumber: listingForm.partNumber || undefined,
        manufacturer: listingForm.manufacturer || undefined,
        yearFrom: listingForm.yearFrom ? parseInt(listingForm.yearFrom) : undefined,
        yearTo: listingForm.yearTo ? parseInt(listingForm.yearTo) : undefined,
        contactEmail: listingForm.contactEmail || undefined,
        contactPhone: listingForm.contactPhone || undefined,
        status: 'active',
      }, {
        onSuccess: () => {
          toast({ title: "Success", description: "Listing created successfully" });
          setIsListingFormOpen(false);
          resetForm();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create listing", variant: "destructive" });
        }
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload images", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="bg-card border-b border-border py-12">
        <div className="container px-4 flex items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-border">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback className="text-2xl">{user.firstName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">{user.firstName} {user.lastName}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="border-border">Edit Profile</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="bg-card border-border mb-8 flex-wrap gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parts-list">Parts List</TabsTrigger>
            <TabsTrigger value="media-links">Media Links</TabsTrigger>
            <TabsTrigger value="tech-info">Tech Info</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="garage">My Garage</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border hover-elevate cursor-pointer" onClick={() => window.location.href = '/profile?tab=parts-list'}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><List className="w-5 h-5 text-primary" /> Parts List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">{wishlist?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Saved Parts</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border hover-elevate cursor-pointer" onClick={() => window.location.href = '/profile?tab=media-links'}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Video className="w-5 h-5 text-primary" /> Media Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">0</div>
                  <p className="text-sm text-muted-foreground">Videos & Articles</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border hover-elevate cursor-pointer" onClick={() => window.location.href = '/profile?tab=tech-info'}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><FileText className="w-5 h-5 text-primary" /> Tech Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">0</div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border hover-elevate cursor-pointer" onClick={() => window.location.href = '/profile?tab=marketplace'}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><ShoppingCart className="w-5 h-5 text-primary" /> Marketplace</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">{myListings?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Listings</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Card className="bg-card border-border hover-elevate cursor-pointer" onClick={() => window.location.href = '/profile?tab=garage'}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Car className="w-5 h-5 text-primary" /> My Garage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">{garage?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Parts Installed</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="parts-list">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-foreground">My Parts List</h2>
                <Button variant="outline" size="sm">
                  <List className="w-4 h-4 mr-2" /> Add Part
                </Button>
              </div>
              <div className="grid gap-4">
                {wishlist?.map((item) => (
                  <Card key={item.id} className="bg-card border-border p-4 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                        {item.product.primaryImageUrl && <img src={item.product.primaryImageUrl} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <Link href={`/products/${item.product.id}`}>
                          <h3 className="font-bold text-foreground hover:text-primary cursor-pointer">{item.product.name}</h3>
                        </Link>
                        <p className="font-mono text-primary">{formatPrice(item.product.price, item.product.currency)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(item.product.productUrl, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-1" /> Buy
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => removeFromWishlist(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                {(!wishlist || wishlist.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No parts saved yet. Browse the catalog to add parts to your list.</p>
                    <Link href="/products">
                      <Button variant="outline" className="mt-4">Browse Parts</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="media-links">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-foreground">Media Links</h2>
                <Button variant="outline" size="sm">
                  <Video className="w-4 h-4 mr-2" /> Add Link
                </Button>
              </div>
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Save your favorite TR6 videos, articles, and tutorials here.</p>
                <p className="text-sm mt-2">YouTube videos, forum posts, build guides, and more.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tech-info">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-foreground">Tech Info</h2>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" /> Add Document
                </Button>
              </div>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Store technical documents, specifications, and notes here.</p>
                <p className="text-sm mt-2">Wiring diagrams, torque specs, part numbers, and reference materials.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="marketplace">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-foreground">Marketplace</h2>
                <Dialog open={isListingFormOpen} onOpenChange={setIsListingFormOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-list-item">
                      <Plus className="w-4 h-4 mr-2" /> List Item for Sale
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Listing</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g., TR6 Weber DCOE Carburetors"
                          value={listingForm.title}
                          onChange={(e) => setListingForm(prev => ({ ...prev, title: e.target.value }))}
                          data-testid="input-listing-title"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="itemType">Item Type</Label>
                          <Select value={listingForm.itemType} onValueChange={(v) => setListingForm(prev => ({ ...prev, itemType: v }))}>
                            <SelectTrigger data-testid="select-item-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="part">Part</SelectItem>
                              <SelectItem value="car">Car</SelectItem>
                              <SelectItem value="accessory">Accessory</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="condition">Condition</Label>
                          <Select value={listingForm.condition} onValueChange={(v) => setListingForm(prev => ({ ...prev, condition: v }))}>
                            <SelectTrigger data-testid="select-condition">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="used_excellent">Used - Excellent</SelectItem>
                              <SelectItem value="used_good">Used - Good</SelectItem>
                              <SelectItem value="used_fair">Used - Fair</SelectItem>
                              <SelectItem value="for_parts">For Parts</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your item, include any relevant details about condition, history, etc."
                          value={listingForm.description}
                          onChange={(e) => setListingForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          data-testid="input-listing-description"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="price">Price *</Label>
                          <Input
                            id="price"
                            type="number"
                            placeholder="0.00"
                            value={listingForm.price}
                            onChange={(e) => setListingForm(prev => ({ ...prev, price: e.target.value }))}
                            data-testid="input-listing-price"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="currency">Currency</Label>
                          <Select value={listingForm.currency} onValueChange={(v) => setListingForm(prev => ({ ...prev, currency: v }))}>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="CAD">CAD ($)</SelectItem>
                              <SelectItem value="AUD">AUD ($)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={listingForm.negotiable}
                              onCheckedChange={(v) => setListingForm(prev => ({ ...prev, negotiable: v }))}
                              data-testid="switch-negotiable"
                            />
                            <Label>Negotiable</Label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-3 flex items-center gap-2"><Truck className="w-4 h-4" /> Shipping Options</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={listingForm.shippingAvailable}
                              onCheckedChange={(v) => setListingForm(prev => ({ ...prev, shippingAvailable: v, pickupOnly: !v && prev.pickupOnly }))}
                              data-testid="switch-shipping"
                            />
                            <Label>Shipping Available</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={listingForm.pickupOnly}
                              onCheckedChange={(v) => setListingForm(prev => ({ ...prev, pickupOnly: v }))}
                              data-testid="switch-pickup"
                            />
                            <Label>Pickup Only</Label>
                          </div>
                        </div>
                        {listingForm.shippingAvailable && (
                          <div className="grid gap-2 mt-3">
                            <Label htmlFor="shippingCost">Shipping Cost</Label>
                            <Input
                              id="shippingCost"
                              type="number"
                              placeholder="0.00"
                              value={listingForm.shippingCost}
                              onChange={(e) => setListingForm(prev => ({ ...prev, shippingCost: e.target.value }))}
                              data-testid="input-shipping-cost"
                            />
                          </div>
                        )}
                        <div className="grid gap-2 mt-3">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            placeholder="City, State/Country"
                            value={listingForm.location}
                            onChange={(e) => setListingForm(prev => ({ ...prev, location: e.target.value }))}
                            data-testid="input-location"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Photos</h3>
                        <div className="grid grid-cols-5 gap-2">
                          {imagePreviewUrls.map((url, index) => (
                            <div key={index} className="relative aspect-square bg-muted rounded-md overflow-hidden">
                              <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => removeImage(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                          {selectedImages.length < 10 && (
                            <label className="aspect-square bg-muted rounded-md border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover-elevate">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageSelect}
                                data-testid="input-images"
                              />
                              <Plus className="w-6 h-6 text-muted-foreground" />
                            </label>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Add up to 10 photos</p>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> Part Details (Optional)</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="partNumber">Part Number</Label>
                            <Input
                              id="partNumber"
                              placeholder="e.g., 155101"
                              value={listingForm.partNumber}
                              onChange={(e) => setListingForm(prev => ({ ...prev, partNumber: e.target.value }))}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="manufacturer">Manufacturer</Label>
                            <Input
                              id="manufacturer"
                              placeholder="e.g., Weber"
                              value={listingForm.manufacturer}
                              onChange={(e) => setListingForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div className="grid gap-2">
                            <Label htmlFor="yearFrom">Year From</Label>
                            <Input
                              id="yearFrom"
                              type="number"
                              placeholder="1969"
                              value={listingForm.yearFrom}
                              onChange={(e) => setListingForm(prev => ({ ...prev, yearFrom: e.target.value }))}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="yearTo">Year To</Label>
                            <Input
                              id="yearTo"
                              type="number"
                              placeholder="1976"
                              value={listingForm.yearTo}
                              onChange={(e) => setListingForm(prev => ({ ...prev, yearTo: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-3">Contact Information (Optional)</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="contactEmail">Email</Label>
                            <Input
                              id="contactEmail"
                              type="email"
                              placeholder="your@email.com"
                              value={listingForm.contactEmail}
                              onChange={(e) => setListingForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="contactPhone">Phone</Label>
                            <Input
                              id="contactPhone"
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              value={listingForm.contactPhone}
                              onChange={(e) => setListingForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleCreateListing}
                        disabled={isCreating || isUploading}
                        className="w-full"
                        data-testid="button-create-listing"
                      >
                        {isCreating || isUploading ? "Creating..." : "Create Listing"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {listingsLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading your listings...</div>
              ) : myListings && myListings.length > 0 ? (
                <div className="grid gap-4">
                  {myListings.map((listing) => (
                    <Card key={listing.id} className="bg-card border-border" data-testid={`listing-card-${listing.id}`}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                            {listing.imageUrls && listing.imageUrls.length > 0 ? (
                              <img src={listing.imageUrls[0]} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h3 className="font-bold text-foreground truncate">{listing.title}</h3>
                                <p className="text-lg font-mono text-primary">{formatPrice(listing.price, listing.currency)}</p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <span className={`text-xs px-2 py-1 rounded-md ${listing.status === 'active' ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                                  {listing.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                              <span className="capitalize">{listing.itemType}</span>
                              {listing.condition && <span>• {listing.condition.replace('_', ' ')}</span>}
                              {listing.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {listing.location}
                                </span>
                              )}
                              {listing.shippingAvailable && <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Ships</span>}
                              {listing.pickupOnly && <span>Pickup Only</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteListing(listing.id)}
                              data-testid={`button-delete-listing-${listing.id}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't listed any items yet.</p>
                  <p className="text-sm mt-2">Click "List Item for Sale" to sell your parts or car.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="garage">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground mb-4">Installed Parts</h2>
              {garage?.length === 0 ? (
                <div className="text-muted-foreground">No parts in garage yet.</div>
              ) : (
                <div className="grid gap-4">
                  {garage?.map((item) => (
                    <Card key={item.id} className="bg-card border-border p-4 flex justify-between items-center">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                          {item.product.primaryImageUrl && <img src={item.product.primaryImageUrl} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">Status: {item.status}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon"><Settings className="w-4 h-4" /></Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
