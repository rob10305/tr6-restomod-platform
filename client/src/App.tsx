import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CarProvider } from "@/context/CarContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import PartsCatalog from "@/pages/PartsCatalog";
import ProductDetails from "@/pages/ProductDetails";
import BuildThreads from "@/pages/BuildThreads";
import Profile from "@/pages/Profile";
import AdminScraper from "@/pages/AdminScraper";
import AdminInventory from "@/pages/AdminInventory";
import AdminTransfer from "@/pages/AdminTransfer";
import AdminDatabase from "@/pages/AdminDatabase";
import CategoryDetail from "@/pages/CategoryDetail";
import SubmitBuild from "@/pages/SubmitBuild";
import Resources from "@/pages/Resources";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/parts" component={PartsCatalog} />
      <Route path="/category/:id" component={CategoryDetail} />
      <Route path="/products/:id" component={ProductDetails} />
      <Route path="/builds" component={BuildThreads} />
      <Route path="/submit-build" component={SubmitBuild} />
      <Route path="/profile" component={Profile} />
      <Route path="/diagram" component={Resources} />
      <Route path="/admin/scraper" component={AdminScraper} />
      <Route path="/admin/inventory" component={AdminInventory} />
      <Route path="/admin/transfer" component={AdminTransfer} />
      <Route path="/admin/database" component={AdminDatabase} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CarProvider>
          <Toaster />
          <Router />
        </CarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
