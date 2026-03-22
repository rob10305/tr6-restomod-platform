import { Navigation } from "@/components/Navigation";
import { useBuildThreads, useCreateBuildThread } from "@/hooks/use-build-threads";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBuildThreadSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Hammer, Eye, MessageSquare, Plus } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function BuildThreads() {
  const { data: threads, isLoading } = useBuildThreads();
  const { user } = useAuth();
  const { mutate: createThread } = useCreateBuildThread();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertBuildThreadSchema),
    defaultValues: {
      title: "",
      description: "",
      tr6Year: 1974,
      buildType: "restoration",
      status: "in_progress",
      userId: user?.sub || ""
    }
  });

  const onSubmit = (data: any) => {
    if (!user) return;
    createThread({ ...data, userId: user.sub }, {
      onSuccess: () => {
        toast({ title: "Build Thread Created", description: "Your project is live!" });
        form.reset();
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="container px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Community Builds</h1>
            <p className="text-muted-foreground">Follow the restoration journeys of fellow enthusiasts.</p>
          </div>
          
          {user && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary text-black hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" /> Start Build Thread
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-foreground">
                <DialogHeader>
                  <DialogTitle>Start a New Build Thread</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-background border-border" placeholder="e.g. 1974 Sapphire Blue Frame-Off" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="buildType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Build Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border-border">
                              <SelectItem value="restoration">Restoration</SelectItem>
                              <SelectItem value="restomod">Restomod</SelectItem>
                              <SelectItem value="performance">Performance</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-primary text-black">Create Thread</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div>Loading...</div>
          ) : threads?.map((thread) => (
            <Link key={thread.id} href={`/builds/${thread.id}`}>
              <Card className="p-6 bg-card border-border hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{thread.title}</h3>
                      <Badge variant="secondary" className="bg-muted">{thread.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(thread.createdAt!), 'MMM d, yyyy')}</span>
                      <span className="flex items-center"><Hammer className="w-3 h-3 mr-1" /> {thread.buildType}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-muted-foreground">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{thread.viewCount}</div>
                      <div className="text-xs uppercase">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{thread.likeCount}</div>
                      <div className="text-xs uppercase">Likes</div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
