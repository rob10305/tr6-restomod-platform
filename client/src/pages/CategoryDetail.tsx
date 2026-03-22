import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, BookOpen, MessageSquare, ExternalLink, Wrench } from "lucide-react";
import { Link, useParams } from "wouter";
import { useSelectedCar } from "@/context/CarContext";

const categoryData: Record<string, {
  name: string;
  description: string;
  subcategories: Array<{
    id: string;
    name: string;
    description: string;
    partCount?: number;
  }>;
  resources: Array<{
    title: string;
    type: "guide" | "forum" | "video";
    url?: string;
  }>;
  popularParts: Array<{
    name: string;
    supplier: string;
  }>;
}> = {
  "1": {
    name: "Engine",
    description: "Everything you need to rebuild, upgrade, or swap your engine. From stock rebuilds to modern fuel injection conversions.",
    subcategories: [
      { id: "engine-blocks", name: "Blocks & Short Blocks", description: "Complete blocks and short block assemblies", partCount: 12 },
      { id: "cylinder-heads", name: "Cylinder Heads", description: "Stock and performance cylinder heads", partCount: 8 },
      { id: "pistons-rods", name: "Pistons & Connecting Rods", description: "Forged and cast options for all builds", partCount: 24 },
      { id: "camshafts", name: "Camshafts & Timing", description: "Performance cams and timing components", partCount: 18 },
      { id: "intake", name: "Intake & Carburetors", description: "Carbs, manifolds, and EFI conversions", partCount: 32 },
      { id: "ignition", name: "Ignition Systems", description: "Electronic ignition upgrades and components", partCount: 15 },
    ],
    resources: [
      { title: "TR6 Engine Rebuild Guide", type: "guide" },
      { title: "Weber DCOE Tuning Tips", type: "forum" },
      { title: "EFI Conversion Walkthrough", type: "video" },
      { title: "Compression Ratio Calculator", type: "guide" },
    ],
    popularParts: [
      { name: "Dual Weber DCOE Kit", supplier: "Moss Motors" },
      { name: "Pertronix Ignition", supplier: "Good Parts" },
      { name: "Performance Camshaft", supplier: "Rimmer Bros" },
    ]
  },
  "2": {
    name: "Suspension",
    description: "Transform your handling with modern suspension components. From subtle improvements to full racing setups.",
    subcategories: [
      { id: "shocks", name: "Shock Absorbers", description: "Adjustable and performance shocks", partCount: 14 },
      { id: "springs", name: "Springs & Coilovers", description: "Lowering springs and coilover kits", partCount: 10 },
      { id: "bushings", name: "Bushings & Mounts", description: "Polyurethane and rubber bushings", partCount: 28 },
      { id: "sway-bars", name: "Sway Bars", description: "Front and rear anti-roll bars", partCount: 6 },
      { id: "steering", name: "Steering Components", description: "Racks, columns, and upgrades", partCount: 12 },
    ],
    resources: [
      { title: "Suspension Geometry Explained", type: "guide" },
      { title: "Best Coilover Setup Discussion", type: "forum" },
      { title: "DIY Alignment Guide", type: "video" },
    ],
    popularParts: [
      { name: "GAZ Adjustable Shocks", supplier: "Rimmer Bros" },
      { name: "Poly Bushing Kit", supplier: "Good Parts" },
      { name: "Lowering Spring Set", supplier: "Moss Motors" },
    ]
  },
  "3": {
    name: "Interior",
    description: "Restore or modernize your cabin with quality interior components. Seats, trim, gauges, and more.",
    subcategories: [
      { id: "seats", name: "Seats & Covers", description: "Complete seats and upholstery kits", partCount: 18 },
      { id: "carpet", name: "Carpet & Floor Mats", description: "Complete carpet sets and mats", partCount: 8 },
      { id: "dash", name: "Dashboard & Gauges", description: "Dash pads, gauges, and switches", partCount: 22 },
      { id: "trim", name: "Interior Trim", description: "Door panels, headliners, and trim pieces", partCount: 35 },
      { id: "steering-wheels", name: "Steering Wheels", description: "Classic and modern wheel options", partCount: 12 },
    ],
    resources: [
      { title: "Seat Recovering Tutorial", type: "video" },
      { title: "Dakota Digital Gauge Install", type: "guide" },
      { title: "Interior Color Matching", type: "forum" },
    ],
    popularParts: [
      { name: "Leather Seat Kit", supplier: "Moss Motors" },
      { name: "Moto-Lita Steering Wheel", supplier: "Rimmer Bros" },
      { name: "Full Carpet Set", supplier: "Good Parts" },
    ]
  },
  "5": {
    name: "Electrical",
    description: "Upgrade your electrical system for reliability and modern conveniences. Wiring, lighting, and electronics.",
    subcategories: [
      { id: "wiring", name: "Wiring Harnesses", description: "Complete and partial harness kits", partCount: 8 },
      { id: "lighting", name: "Lighting", description: "LED upgrades and restoration lights", partCount: 24 },
      { id: "charging", name: "Charging System", description: "Alternators and regulators", partCount: 10 },
      { id: "switches", name: "Switches & Relays", description: "Replacement and upgrade switches", partCount: 32 },
    ],
    resources: [
      { title: "Wiring Diagram Library", type: "guide" },
      { title: "LED Conversion Guide", type: "video" },
      { title: "Alternator Upgrade Discussion", type: "forum" },
    ],
    popularParts: [
      { name: "Complete Wiring Harness", supplier: "Moss Motors" },
      { name: "LED Headlight Kit", supplier: "Good Parts" },
      { name: "High Output Alternator", supplier: "Rimmer Bros" },
    ]
  },
  "6": {
    name: "Brakes",
    description: "Stop with confidence. Upgrade your braking system with modern components and materials.",
    subcategories: [
      { id: "rotors", name: "Rotors & Drums", description: "Slotted, drilled, and stock rotors", partCount: 12 },
      { id: "pads", name: "Brake Pads", description: "Street and track pad compounds", partCount: 18 },
      { id: "calipers", name: "Calipers", description: "Rebuilt and upgrade calipers", partCount: 8 },
      { id: "master-cylinder", name: "Master Cylinders", description: "Stock and performance options", partCount: 6 },
      { id: "lines", name: "Brake Lines", description: "Stainless braided and stock lines", partCount: 10 },
    ],
    resources: [
      { title: "Big Brake Kit Install", type: "video" },
      { title: "Brake Pad Compound Comparison", type: "guide" },
      { title: "Bleeding Brakes Properly", type: "forum" },
    ],
    popularParts: [
      { name: "Stainless Brake Line Kit", supplier: "Good Parts" },
      { name: "EBC Green Stuff Pads", supplier: "Moss Motors" },
      { name: "Rebuilt Caliper Set", supplier: "Rimmer Bros" },
    ]
  },
  "7": {
    name: "Wheels",
    description: "Complete your look with the right wheels and tires. Classic styles to modern performance options.",
    subcategories: [
      { id: "wire-wheels", name: "Wire Wheels", description: "Classic spoke wheels", partCount: 8 },
      { id: "alloy-wheels", name: "Alloy Wheels", description: "Modern alloy options", partCount: 12 },
      { id: "tires", name: "Tires", description: "Period-correct and performance tires", partCount: 16 },
      { id: "hubs", name: "Hubs & Adapters", description: "Hub assemblies and wheel adapters", partCount: 10 },
    ],
    resources: [
      { title: "Wheel Fitment Guide", type: "guide" },
      { title: "Wire Wheel Restoration", type: "video" },
      { title: "Tire Size Calculator", type: "guide" },
    ],
    popularParts: [
      { name: "72-Spoke Wire Wheels", supplier: "Moss Motors" },
      { name: "Minilite Style Alloys", supplier: "Rimmer Bros" },
      { name: "Vredestein Classic Tires", supplier: "Good Parts" },
    ]
  },
  "8": {
    name: "Exhaust",
    description: "Get the right sound and performance from your exhaust system. Headers to mufflers.",
    subcategories: [
      { id: "headers", name: "Headers & Manifolds", description: "Performance headers and stock manifolds", partCount: 8 },
      { id: "pipes", name: "Pipes & Systems", description: "Complete exhaust systems", partCount: 12 },
      { id: "mufflers", name: "Mufflers & Tips", description: "Silencers and exhaust tips", partCount: 14 },
      { id: "hangers", name: "Hangers & Hardware", description: "Mounting hardware and gaskets", partCount: 20 },
    ],
    resources: [
      { title: "Header Selection Guide", type: "guide" },
      { title: "Exhaust Sound Comparison", type: "video" },
      { title: "Stainless vs Mild Steel", type: "forum" },
    ],
    popularParts: [
      { name: "Stainless Steel System", supplier: "Moss Motors" },
      { name: "Performance Headers", supplier: "Good Parts" },
      { name: "Sports Silencer", supplier: "Rimmer Bros" },
    ]
  },
  "4": {
    name: "Instruments",
    description: "Monitor your engine and vehicle systems with quality gauges and switches. From restoration to modern digital upgrades.",
    subcategories: [
      { id: "gauges", name: "Gauges", description: "Speedometers, tachs, and auxiliary gauges", partCount: 22 },
      { id: "senders", name: "Senders & Sensors", description: "Temperature, oil pressure, and fuel senders", partCount: 16 },
      { id: "switches", name: "Switches", description: "Ignition, lighting, and accessory switches", partCount: 28 },
      { id: "bezels", name: "Bezels & Trim", description: "Gauge bezels and instrument trim", partCount: 10 },
    ],
    resources: [
      { title: "Gauge Calibration Guide", type: "guide" },
      { title: "Digital Gauge Conversion", type: "video" },
      { title: "Smiths vs VDO Discussion", type: "forum" },
    ],
    popularParts: [
      { name: "Smiths Gauge Set", supplier: "Moss Motors" },
      { name: "Electronic Speedo Kit", supplier: "Good Parts" },
      { name: "Oil Pressure Sender", supplier: "Rimmer Bros" },
    ]
  },
};

export default function CategoryDetail() {
  const params = useParams<{ id: string }>();
  const categoryId = params.id || "1";
  const category = categoryData[categoryId];
  const { selectedCar } = useSelectedCar();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [categoryId]);

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="container px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Category Not Found</h1>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "guide": return <BookOpen className="w-4 h-4" />;
      case "forum": return <MessageSquare className="w-4 h-4" />;
      case "video": return <ExternalLink className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "guide": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "forum": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "video": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-muted/10 text-muted-foreground border-border";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="container px-4 py-8">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <div className="mb-10 flex justify-between items-start gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-display font-bold text-foreground mb-3">{category.name}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl">{category.description}</p>
          </div>
          {selectedCar && (
            <div className="flex-shrink-0 hidden md:block" data-testid="selected-car-indicator">
              <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                {selectedCar.image ? (
                  <img 
                    src={selectedCar.image} 
                    alt={`${selectedCar.makeName} ${selectedCar.modelName}`}
                    className="w-20 h-12 object-cover rounded"
                    data-testid="img-selected-car"
                  />
                ) : (
                  <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">No image</span>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Options for</p>
                  <p className="text-sm font-bold text-foreground" data-testid="text-selected-car-name">
                    {selectedCar.makeName} {selectedCar.modelName}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedCar.years}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Wrench className="w-6 h-6 text-primary" />
                Browse by Subcategory
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {category.subcategories.map((sub) => (
                  <Link key={sub.id} href={`/parts?categoryId=${categoryId}&subcategory=${sub.id}`}>
                    <Card className="bg-card border-border cursor-pointer hover:border-primary/50 transition-all h-full" data-testid={`card-subcategory-${sub.id}`}>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-foreground">{sub.name}</h3>
                          {sub.partCount && (
                            <Badge variant="secondary" className="text-xs">
                              {sub.partCount} parts
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{sub.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                Resources & Guides
              </h2>
              <div className="space-y-3">
                {category.resources.map((resource, idx) => (
                  <Card key={idx} className="bg-card border-border cursor-pointer hover:border-primary/50 transition-all" data-testid={`card-resource-${idx}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getTypeIcon(resource.type)}
                        </div>
                        <span className="text-foreground font-medium">{resource.title}</span>
                      </div>
                      <Badge className={`${getTypeBadge(resource.type)} border`}>
                        {resource.type}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">More resources coming soon...</p>
            </section>
          </div>

          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Popular Parts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.popularParts.map((part, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="font-medium text-foreground text-sm">{part.name}</p>
                    <p className="text-xs text-muted-foreground">from {part.supplier}</p>
                  </div>
                ))}
                <Button className="w-full mt-4" asChild>
                  <Link href={`/parts?categoryId=${categoryId}`}>
                    View All {category.name} Parts
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5 text-center">
                <MessageSquare className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-2">Join the Discussion</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with other enthusiasts working on {category.name.toLowerCase()} projects.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/builds">Community Builds</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
