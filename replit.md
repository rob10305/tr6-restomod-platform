# TR6 Restomod Parts Platform

## Overview

This is a full-stack web application for TR6 restomod enthusiasts to discover, compare, and track aftermarket parts across multiple suppliers. The platform aggregates parts from various TR6 parts suppliers into a single searchable database with an interactive visual interface. Users can browse parts by category, track prices, manage wishlists, document their builds, and connect with the TR6 community.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Charts**: Recharts for price history visualization
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Build Tool**: Vite for development and production builds

The frontend follows a pages-based architecture with reusable components. Custom hooks abstract data fetching logic (e.g., `use-products`, `use-wishlist`, `use-auth`). The design uses a dark automotive-themed aesthetic with amber/orange accent colors.

### Backend Architecture

- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for validation
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple
- **Web Scraping**: Cheerio-based scrapers for aggregating product data from supplier websites

The backend serves both the API and static files in production. Route handlers are organized by resource type (suppliers, categories, products, profiles, wishlists, garage, build threads).

### Data Storage

- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for schema management (`npm run db:push`)

Core tables include:
- `suppliers` - Parts vendor information and scraper configuration
- `categories` - Product categories with diagram positioning for visual navigation
- `products` - Part listings with pricing, images, and supplier relationships
- `profiles` - Extended user profiles linked to auth users
- `userWishlists` - User saved products
- `userGarage` - User's vehicle collection
- `buildThreads` - Community build project documentation
- `reviews` - Product ratings and reviews
- `sessions` / `users` - Replit Auth required tables

### Authentication

Uses Replit Auth which implements OpenID Connect. Session data stored in PostgreSQL. The auth system is encapsulated in `server/replit_integrations/auth/` with:
- `replitAuth.ts` - OIDC configuration and Passport strategy
- `storage.ts` - User CRUD operations
- `routes.ts` - Auth-specific API endpoints

Protected routes use the `isAuthenticated` middleware.

### Shared Code

The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` - Drizzle table definitions and Zod insert schemas
- `routes.ts` - API route definitions with path patterns and response schemas
- `models/auth.ts` - User and session table definitions

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- connect-pg-simple for session storage

### Authentication
- Replit Auth (OpenID Connect provider)
- Requires `ISSUER_URL`, `REPL_ID`, and `SESSION_SECRET` environment variables

### Web Scraping
- **Quick Scraper**: Cheerio-based HTML parsing for configured suppliers
- **Browser Scraper**: Playwright with Chromium for advanced scraping with image downloads
- **Multi-Site Support**: Automatic site type detection for WooCommerce, Shopify, and generic e-commerce sites
- **Custom URL Scraper**: Enter any product category URL to scrape products from new sites
- **Auto-Discovery**: New suppliers are automatically created and tracked when scraping custom URLs
- Configured scrapers for Good Parts, Moss Motors, and Rimmer Bros suppliers

Site Detection Strategies:
- WooCommerce: Detects via body classes, gallery selectors, and stylesheet links
- Shopify: Detects via CDN scripts and digital wallet meta tags
- Generic: Fallback with broad product link detection and JSON-LD support

### UI/Frontend Libraries
- Radix UI primitives (dialogs, dropdowns, tooltips, etc.)
- Recharts for data visualization
- Framer Motion for animations
- date-fns for date formatting

### Development
- Vite with React plugin
- Replit-specific Vite plugins for error overlay and dev tools
- esbuild for production server bundling