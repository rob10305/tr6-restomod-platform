import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2, Car, Wrench, Calendar, DollarSign, FileText } from "lucide-react";
import type { InsertBuildThread } from "@shared/schema";

export default function SubmitBuild() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vin: "",
    buildType: "",
    status: "in_progress",
    budget: "",
    startDate: "",
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertBuildThread) => {
      const response = await apiRequest("POST", "/api/build-threads", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/build-threads"] });
      toast({
        title: "Build Submitted",
        description: "Your build has been submitted successfully! It will appear in the Build Threads section.",
      });
      setLocation("/builds");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to submit your build.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your build.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      userId: user.id,
      title: formData.title,
      description: formData.description || undefined,
      tr6Year: formData.vehicleYear ? parseInt(formData.vehicleYear) : undefined,
      tr6Vin: formData.vin || undefined,
      buildType: formData.buildType || undefined,
      status: formData.status,
      budget: formData.budget || undefined,
      startDate: formData.startDate || undefined,
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="container px-4 py-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2" data-testid="text-page-title">
            Submit Your Build
          </h1>
          <p className="text-muted-foreground">
            Share your restomod project with the community. Tell us about your build, what you're working on, and inspire other enthusiasts.
          </p>
        </div>

        {!user && (
          <Card className="bg-amber-500/10 border-amber-500/30 mb-6">
            <CardContent className="py-4">
              <p className="text-amber-400 text-sm">
                You need to <a href="/api/login" className="underline font-medium">log in</a> to submit your build.
              </p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="bg-card/50 border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Build Details
              </CardTitle>
              <CardDescription>
                Give your build a name and describe what makes it special.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Build Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., My 1974 TR6 Restomod Project"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="bg-background border-border"
                  data-testid="input-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your build... What are your goals? What modifications are you planning or have completed?"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="bg-background border-border min-h-32"
                  data-testid="input-description"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                Vehicle Information
              </CardTitle>
              <CardDescription>
                Tell us about the vehicle you're building.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleMake">Make</Label>
                  <Input
                    id="vehicleMake"
                    placeholder="e.g., Triumph"
                    value={formData.vehicleMake}
                    onChange={(e) => updateField("vehicleMake", e.target.value)}
                    className="bg-background border-border"
                    data-testid="input-vehicle-make"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleModel">Model</Label>
                  <Input
                    id="vehicleModel"
                    placeholder="e.g., TR6"
                    value={formData.vehicleModel}
                    onChange={(e) => updateField("vehicleModel", e.target.value)}
                    className="bg-background border-border"
                    data-testid="input-vehicle-model"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleYear">Year</Label>
                  <Input
                    id="vehicleYear"
                    type="number"
                    placeholder="e.g., 1974"
                    value={formData.vehicleYear}
                    onChange={(e) => updateField("vehicleYear", e.target.value)}
                    className="bg-background border-border"
                    data-testid="input-vehicle-year"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN (Optional)</Label>
                  <Input
                    id="vin"
                    placeholder="Vehicle identification number"
                    value={formData.vin}
                    onChange={(e) => updateField("vin", e.target.value)}
                    className="bg-background border-border"
                    data-testid="input-vin"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Build Status
              </CardTitle>
              <CardDescription>
                What type of build is this and where are you in the process?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buildType">Build Type</Label>
                  <Select value={formData.buildType} onValueChange={(value) => updateField("buildType", value)}>
                    <SelectTrigger className="bg-background border-border" data-testid="select-build-type">
                      <SelectValue placeholder="Select build type" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="restoration">Full Restoration</SelectItem>
                      <SelectItem value="restomod">Restomod</SelectItem>
                      <SelectItem value="performance">Performance Build</SelectItem>
                      <SelectItem value="daily_driver">Daily Driver</SelectItem>
                      <SelectItem value="show_car">Show Car</SelectItem>
                      <SelectItem value="track_car">Track Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Current Status</Label>
                  <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                    <SelectTrigger className="bg-background border-border" data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateField("startDate", e.target.value)}
                    className="bg-background border-border"
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Estimated Budget
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 15000"
                    value={formData.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                    className="bg-background border-border"
                    data-testid="input-budget"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/builds")}
              className="border-border"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!user || submitMutation.isPending}
              className="gap-2"
              data-testid="button-submit"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Build"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
