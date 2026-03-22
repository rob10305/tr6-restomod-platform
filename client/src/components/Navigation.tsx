import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Wrench, 
  Menu, 
  Search, 
  User, 
  LogOut, 
  Heart, 
  Car,
  LayoutGrid,
  MessagesSquare,
  Database,
  PlusCircle
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function Navigation() {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/parts?search=${encodeURIComponent(search)}`);
    }
  };

  const NavLinks = () => (
    <>
      <Link href="/parts" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/parts' ? 'text-primary' : 'text-muted-foreground'}`}>
        Parts Catalog
      </Link>
      <Link href="/builds" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/builds' ? 'text-primary' : 'text-muted-foreground'}`}>
        Build Threads
      </Link>
      <Link href="/diagram" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/diagram' ? 'text-primary' : 'text-muted-foreground'}`}>
        Resources
      </Link>
      <Link href="/submit-build" className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${location === '/submit-build' ? 'text-primary' : 'text-muted-foreground'}`}>
        <PlusCircle className="h-4 w-4" />
        Submit Your Build
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 bg-background border-r border-border">
            <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold mb-8">
              <Wrench className="h-6 w-6 text-primary" />
              <span>TR6<span className="text-primary">MODS</span></span>
            </Link>
            <nav className="flex flex-col gap-4">
              <NavLinks />
            </nav>
          </SheetContent>
        </Sheet>
        
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="hidden font-display font-bold sm:inline-block text-xl tracking-tight">
            RESTO<span className="text-primary">MODS</span>
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <NavLinks />
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <form onSubmit={handleSearch} className="hidden lg:block w-full max-w-sm relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search parts, numbers, etc..."
              className="w-full bg-secondary border-border pl-9 focus-visible:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-border">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                    <AvatarFallback>{user.firstName?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card border-border" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.username || user.firstName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile?tab=garage" className="cursor-pointer">
                    <Car className="mr-2 h-4 w-4" />
                    <span>My Garage</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild>
                  <Link href="/admin/database" className="cursor-pointer" data-testid="link-admin">
                    <Database className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              <a href="/api/login">Log In</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
