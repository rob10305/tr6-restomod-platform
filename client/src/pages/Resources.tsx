import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ExternalLink, 
  Play, 
  Star, 
  Tag, 
  BookOpen,
  Facebook,
  Instagram,
  Youtube,
  ChevronDown,
  ChevronUp,
  Users,
  Filter
} from "lucide-react";
import { SiX } from "react-icons/si";

const buildTypes = [
  { id: "all", name: "All Builds" },
  { id: "restoration", name: "Restoration" },
  { id: "performance", name: "Performance" },
  { id: "efi", name: "EFI Conversion" },
  { id: "suspension", name: "Suspension Upgrade" },
  { id: "electrical", name: "Electrical/Wiring" },
  { id: "interior", name: "Interior" },
];

const socialCommunities = [
  { 
    name: "Facebook", 
    icon: Facebook, 
    color: "text-blue-600",
    resources: [
      { name: "TR6 Enthusiasts Group", members: "15.2K", url: "#", buildTypes: ["restoration", "performance"] },
      { name: "British Car Restoration", members: "8.5K", url: "#", buildTypes: ["restoration", "interior"] },
      { name: "Restomod Nation", members: "12.1K", url: "#", buildTypes: ["performance", "efi", "suspension"] },
      { name: "Classic Triumph Owners", members: "6.8K", url: "#", buildTypes: ["restoration", "electrical"] },
      { name: "EFI Conversion Experts", members: "4.2K", url: "#", buildTypes: ["efi", "electrical"] },
    ]
  },
  { 
    name: "Instagram", 
    icon: Instagram, 
    color: "text-pink-500",
    resources: [
      { name: "@tr6restomod", members: "5.2K", url: "#", buildTypes: ["restoration", "performance"] },
      { name: "@classictriumph", members: "8.9K", url: "#", buildTypes: ["restoration"] },
      { name: "@britishcarsofinstagram", members: "22.4K", url: "#", buildTypes: ["restoration", "interior"] },
      { name: "@restomodbuilds", members: "11.3K", url: "#", buildTypes: ["performance", "suspension"] },
      { name: "@efiswaps", members: "7.1K", url: "#", buildTypes: ["efi", "electrical"] },
    ]
  },
  { 
    name: "X (Twitter)", 
    icon: SiX, 
    color: "text-foreground",
    resources: [
      { name: "@TR6Community", members: "3.1K", url: "#", buildTypes: ["restoration"] },
      { name: "@RestomodWorld", members: "7.8K", url: "#", buildTypes: ["performance", "efi"] },
      { name: "@ClassicBritCars", members: "4.5K", url: "#", buildTypes: ["restoration", "interior"] },
      { name: "@SuspensionPros", members: "2.9K", url: "#", buildTypes: ["suspension", "performance"] },
    ]
  },
  { 
    name: "YouTube", 
    icon: Youtube, 
    color: "text-red-500",
    resources: [
      { name: "TR6 Garage", members: "25.6K", url: "#", buildTypes: ["restoration", "performance"] },
      { name: "Restomod Revival", members: "42.1K", url: "#", buildTypes: ["performance", "efi", "suspension"] },
      { name: "British Car Workshop", members: "18.9K", url: "#", buildTypes: ["restoration", "electrical"] },
      { name: "Classic Car Chronicles", members: "31.2K", url: "#", buildTypes: ["restoration", "interior"] },
      { name: "EFI Demystified", members: "15.4K", url: "#", buildTypes: ["efi", "electrical"] },
    ]
  },
];

const topSuppliers = [
  { name: "Moss Motors", rating: 4.8, speciality: "Original Parts", url: "#" },
  { name: "Rimmer Bros", rating: 4.7, speciality: "Wide Selection", url: "#" },
  { name: "The Good Parts Company", rating: 4.9, speciality: "Performance Parts", url: "#" },
  { name: "Revington TR", rating: 4.6, speciality: "TR Specialists", url: "#" },
];

const currentOffers = [
  { title: "Spring Sale - 15% Off Suspension", supplier: "Moss Motors", expires: "Apr 30", code: "SPRING15" },
  { title: "Free Shipping Over $100", supplier: "Rimmer Bros", expires: "Ongoing", code: "FREESHIP" },
  { title: "Buy 3 Get 1 Free - Filters", supplier: "The Good Parts Company", expires: "May 15", code: "FILTER4" },
];

const featuredVideos = [
  { title: "TR6 Full Restoration Timelapse", channel: "Classic Car Revival", duration: "18:45", views: "125K" },
  { title: "Installing Modern EFI on a TR6", channel: "Restomod Garage", duration: "32:10", views: "89K" },
  { title: "Brake Upgrade Guide - TR Series", channel: "British Car Workshop", duration: "24:30", views: "67K" },
  { title: "Interior Restoration Tips", channel: "Vintage Auto Care", duration: "15:22", views: "45K" },
];

const communityStories = [
  { title: "From Barn Find to Show Winner", author: "Mike T.", excerpt: "How I restored my 1974 TR6 over 3 years..." },
  { title: "My First Restomod Build", author: "Sarah K.", excerpt: "Adding modern reliability to classic style..." },
  { title: "Cross-Country in a TR6", author: "James R.", excerpt: "3,000 miles from coast to coast in my restored TR..." },
];

export default function Resources() {
  const [expandedSocial, setExpandedSocial] = useState<string | null>(null);
  const [selectedBuildType, setSelectedBuildType] = useState<string>("all");

  const toggleSocial = (name: string) => {
    setExpandedSocial(expandedSocial === name ? null : name);
  };

  const getFilteredCommunities = () => {
    if (selectedBuildType === "all") {
      return socialCommunities;
    }
    
    return socialCommunities.map(social => ({
      ...social,
      resources: social.resources.filter(resource => 
        resource.buildTypes.includes(selectedBuildType)
      )
    })).filter(social => social.resources.length > 0);
  };

  const filteredCommunities = getFilteredCommunities();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Resources</h1>
            <p className="text-muted-foreground">Everything you need for your restomod journey</p>
          </div>

          <div className="grid gap-8">
            <section>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Find Additional Communities
                </h2>
                
                <div className="flex items-center gap-2 bg-card/50 p-2 rounded-lg border border-border">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedBuildType} onValueChange={setSelectedBuildType}>
                    <SelectTrigger className="w-[180px] border-border" data-testid="select-build-type">
                      <SelectValue placeholder="Filter by build type" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildTypes.map(type => (
                        <SelectItem key={type.id} value={type.id} data-testid={`select-item-${type.id}`}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedBuildType !== "all" && (
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="outline" className="border-primary text-primary">
                    Showing: {buildTypes.find(t => t.id === selectedBuildType)?.name}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedBuildType("all")}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="button-clear-filter"
                  >
                    Clear filter
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredCommunities.map((social) => (
                  <div key={social.name} className="space-y-2">
                    <Card 
                      className={`bg-card border-border hover-elevate cursor-pointer transition-all ${expandedSocial === social.name ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => toggleSocial(social.name)}
                      data-testid={`card-social-${social.name.toLowerCase()}`}
                    >
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <social.icon className={`w-8 h-8 mb-2 ${social.color}`} />
                        <h3 className="font-semibold text-foreground">{social.name}</h3>
                        <p className="text-sm text-muted-foreground">{social.resources.length} communities</p>
                        <div className="mt-2">
                          {expandedSocial === social.name ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {expandedSocial === social.name && (
                      <Card className="bg-muted/50 border-border" data-testid={`card-social-expanded-${social.name.toLowerCase()}`}>
                        <CardContent className="p-3 space-y-2">
                          {social.resources.map((resource, idx) => (
                            <a
                              key={idx}
                              href={resource.url}
                              className="flex items-center justify-between p-2 rounded-md bg-background hover-elevate cursor-pointer"
                              data-testid={`link-community-${social.name.toLowerCase()}-${idx}`}
                            >
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground truncate">{resource.name}</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {resource.buildTypes.slice(0, 2).map(bt => (
                                    <Badge key={bt} variant="secondary" className="text-xs px-1 py-0">
                                      {buildTypes.find(t => t.id === bt)?.name || bt}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">{resource.members}</span>
                            </a>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}
              </div>

              {filteredCommunities.length === 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No communities found</h3>
                    <p className="text-muted-foreground">No communities match the selected build type.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSelectedBuildType("all")}
                      data-testid="button-show-all"
                    >
                      Show all communities
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Top Rated Suppliers
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {topSuppliers.map((supplier) => (
                  <Card key={supplier.name} className="bg-card border-border hover-elevate cursor-pointer" data-testid={`card-supplier-${supplier.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-foreground">{supplier.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        <span className="font-semibold text-foreground">{supplier.rating}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{supplier.speciality}</p>
                      <Button size="sm" variant="outline" className="w-full border-border">
                        Visit Store <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Current Offers
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {currentOffers.map((offer, index) => (
                  <Card key={index} className="bg-card border-border" data-testid={`card-offer-${index}`}>
                    <CardContent className="p-4">
                      <Badge className="mb-2 bg-primary text-primary-foreground">{offer.supplier}</Badge>
                      <h3 className="font-semibold text-foreground mb-2">{offer.title}</h3>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Expires: {offer.expires}</span>
                        <code className="bg-muted px-2 py-1 rounded text-foreground font-mono text-xs">{offer.code}</code>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Featured Videos
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredVideos.map((video, index) => (
                  <Card key={index} className="bg-card border-border hover-elevate cursor-pointer" data-testid={`card-video-${index}`}>
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Play className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">{video.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{video.channel}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{video.duration}</span>
                        <span>{video.views} views</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Community Stories
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {communityStories.map((story, index) => (
                  <Card key={index} className="bg-card border-border hover-elevate cursor-pointer" data-testid={`card-story-${index}`}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">{story.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{story.excerpt}</p>
                      <p className="text-xs text-primary font-medium">By {story.author}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" className="border-border">
                  View All Stories
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
