import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { VisualCategorySelector } from "@/components/VisualCategorySelector";
import { MakeModelSelector } from "@/components/MakeModelSelector";
import { ArrowRight, Wrench, Trophy, Users, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function Home() {
  const featuredRestomods = [
    {
      id: 1,
      title: "LS-Swapped TR6 Build",
      owner: "ClassicModern",
      image: null,
      description: "A full restomod with LS3 power, modern suspension, and period-correct styling",
      tags: ["Engine Swap", "Suspension", "Interior"]
    },
    {
      id: 2,
      title: "Fuel-Injected Spitfire",
      owner: "SpitfireFan",
      image: null,
      description: "EFI conversion with custom intake manifold and modern ECU",
      tags: ["EFI", "Engine", "Performance"]
    },
    {
      id: 3,
      title: "Track-Ready GT6",
      owner: "VintageRacer",
      image: null,
      description: "Full cage, coilovers, and big brake kit for vintage racing",
      tags: ["Track", "Brakes", "Suspension"]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90 z-0 pointer-events-none" />
        <div className="container relative z-10 px-4 py-20 md:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            The Ultimate Restomod Platform
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-foreground mb-6">
            Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Dream Machine</span>
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-muted-foreground">
            Your single source to find specialist parts outside of mainstream suppliers. Compare parts, track prices, plan your build, and join a community of Restomod enthusiasts pushing the limits.
          </p>
        </div>
      </section>

      {/* Make/Model Selector */}
      <MakeModelSelector />

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center py-8 bg-background">
        <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-8" asChild>
          <Link href="/parts">Start Browsing Parts</Link>
        </Button>
        <Button size="lg" variant="outline" className="border-border hover:bg-muted text-muted-foreground" asChild>
          <Link href="/builds">View Community Builds</Link>
        </Button>
      </div>

      {/* Visual Categories */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">Options for your Restomod</h2>
              <p className="text-muted-foreground">Explore options that others have already tried</p>
            </div>
            <Button variant="ghost" className="text-primary" asChild>
              <Link href="/diagram">View Resources <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
          
          <VisualCategorySelector />
        </div>
      </section>

      {/* Featured Restomods */}
      <section className="py-16 border-t border-border bg-card/30">
        <div className="container px-4">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground">Featured Restomods</h2>
              <p className="text-muted-foreground mt-2">Community builds pushing the boundaries of classic car modification</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/builds">View All Builds</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredRestomods.map((build) => (
              <Card key={build.id} className="bg-card border-border overflow-hidden group cursor-pointer hover-elevate" data-testid={`card-build-${build.id}`}>
                <div className="aspect-video bg-muted relative flex items-center justify-center">
                  {build.image ? (
                    <img src={build.image} alt={build.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Camera className="w-12 h-12 mb-2" />
                      <span className="text-sm">Build photos coming soon</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-muted-foreground">by {build.owner}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{build.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{build.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {build.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background border-t border-border">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-card/50 border border-border">
              <Wrench className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Price Comparison</h3>
              <p className="text-muted-foreground">We track prices across Moss Motors, Rimmer Bros, and others so you get the best deal.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 border border-border">
              <Trophy className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Build Tracking</h3>
              <p className="text-muted-foreground">Document your restoration journey, manage your budget, and share progress.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 border border-border">
              <Users className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Community Driven</h3>
              <p className="text-muted-foreground">See what parts other enthusiasts are using and read verified reviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-background py-12">
        <div className="container px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-xl text-foreground">RESTO<span className="text-primary">MODS</span></span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/admin/database" className="text-muted-foreground hover:text-primary text-sm transition-colors" data-testid="link-admin-footer">
              Admin
            </Link>
            <p className="text-muted-foreground text-sm">© 2024 Restomod Platform. Built for enthusiasts.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
