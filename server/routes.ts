import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertProfileSchema, insertMarketplaceListingSchema } from "@shared/schema";
import { runScraper, getScraperStatus } from "./scraper";
import { runBrowserScraper, getScrapeProgress } from "./scraper/browser-scraper";
import multer from "multer";
import { parse } from "csv-parse/sync";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = file.fieldname === 'csv' ? 'uploads/csv' : 'public/images/products';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'csv') {
      const allowedNames = ['products.csv', 'products-catalog.csv'];
      const filename = file.originalname.toLowerCase();
      if (allowedNames.includes(filename)) {
        cb(null, true);
      } else {
        cb(new Error('Only files named "products.csv" or "products-catalog.csv" are allowed'));
      }
    } else if (file.fieldname === 'images') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    } else {
      cb(null, true);
    }
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Suppliers ===
  app.get(api.suppliers.list.path, async (req, res) => {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  });

  app.get(api.suppliers.get.path, async (req, res) => {
    const supplier = await storage.getSupplier(Number(req.params.id));
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json(supplier);
  });

  // === Categories ===
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.categories.get.path, async (req, res) => {
    const category = await storage.getCategory(Number(req.params.id));
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  });

  // === Products ===
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts(req.query as any);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  app.post("/api/products/by-ids", async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json([]);
    }
    const productList = await storage.getProductsByIds(ids.map(Number));
    res.json(productList);
  });

  // === Profiles ===
  app.get(api.profiles.me.path, isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) {
        // Auto-create profile if not exists
        // @ts-ignore
        const claims = req.user.claims;
        const newProfile = await storage.createProfile({
            userId: claims.sub,
            username: claims.preferred_username || claims.email?.split('@')[0] || `user_${claims.sub.substring(0,8)}`,
            isVerified: false,
            isActive: true,
            role: "user"
        });
        return res.json(newProfile);
    }
    res.json(profile);
  });

  app.put(api.profiles.update.path, isAuthenticated, async (req, res) => {
     // @ts-ignore
    const userId = req.user.claims.sub;
    const input = api.profiles.update.input.parse(req.body);
    const profile = await storage.updateProfile(userId, input);
    res.json(profile);
  });

  // === Wishlist ===
  app.get(api.wishlist.list.path, isAuthenticated, async (req, res) => {
     // @ts-ignore
    const userId = req.user.claims.sub;
    const wishlist = await storage.getWishlist(userId);
    res.json(wishlist);
  });

  app.post(api.wishlist.add.path, isAuthenticated, async (req, res) => {
     // @ts-ignore
    const userId = req.user.claims.sub;
    const input = api.wishlist.add.input.parse(req.body);
    // Ensure userId matches
    if (input.userId !== userId) {
        return res.status(400).json({ message: "User ID mismatch" });
    }
    const item = await storage.addToWishlist(input);
    res.status(201).json(item);
  });

  app.delete(api.wishlist.remove.path, isAuthenticated, async (req, res) => {
     // @ts-ignore
    const userId = req.user.claims.sub;
    await storage.removeFromWishlist(Number(req.params.id), userId);
    res.status(204).send();
  });

  // === Garage ===
  app.get(api.garage.list.path, isAuthenticated, async (req, res) => {
     // @ts-ignore
    const userId = req.user.claims.sub;
    const garage = await storage.getGarage(userId);
    res.json(garage);
  });

  app.post(api.garage.add.path, isAuthenticated, async (req, res) => {
     // @ts-ignore
    const userId = req.user.claims.sub;
    const input = api.garage.add.input.parse(req.body);
    if (input.userId !== userId) {
        return res.status(400).json({ message: "User ID mismatch" });
    }
    const item = await storage.addToGarage(input);
    res.status(201).json(item);
  });

  app.put(api.garage.update.path, isAuthenticated, async (req, res) => {
     // @ts-ignore
    const userId = req.user.claims.sub;
    const input = api.garage.update.input.parse(req.body);
    const item = await storage.updateGarageItem(Number(req.params.id), userId, input);
    res.json(item);
  });

  // === Build Threads ===
  app.get(api.buildThreads.list.path, async (req, res) => {
    const threads = await storage.getBuildThreads(req.query.userId as string);
    res.json(threads);
  });

  app.post(api.buildThreads.create.path, isAuthenticated, async (req, res) => {
     // @ts-ignore
    const userId = req.user.claims.sub;
    const input = api.buildThreads.create.input.parse(req.body);
    if (input.userId !== userId) {
        return res.status(400).json({ message: "User ID mismatch" });
    }
    const thread = await storage.createBuildThread(input);
    res.status(201).json(thread);
  });

  app.get(api.buildThreads.get.path, async (req, res) => {
    const thread = await storage.getBuildThread(Number(req.params.id));
    if (!thread) {
      return res.status(404).json({ message: "Thread not found" });
    }
    res.json(thread);
  });

  // === Marketplace ===
  app.get(api.marketplace.list.path, async (req, res) => {
    const listings = await storage.getMarketplaceListings(req.query as any);
    res.json(listings);
  });

  app.get(api.marketplace.myListings.path, isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user.claims.sub;
    const listings = await storage.getUserMarketplaceListings(userId);
    res.json(listings);
  });

  app.post(api.marketplace.create.path, isAuthenticated, async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.user.claims.sub;
      const validatedData = insertMarketplaceListingSchema.parse({ ...req.body, userId });
      const listing = await storage.createMarketplaceListing(validatedData);
      res.status(201).json(listing);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to create listing" });
    }
  });

  app.get(api.marketplace.get.path, async (req, res) => {
    const listing = await storage.getMarketplaceListing(Number(req.params.id));
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    res.json(listing);
  });

  app.put(api.marketplace.update.path, isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user.claims.sub;
    const listing = await storage.updateMarketplaceListing(Number(req.params.id), userId, req.body);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found or unauthorized" });
    }
    res.json(listing);
  });

  app.delete(api.marketplace.delete.path, isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user.claims.sub;
    await storage.deleteMarketplaceListing(Number(req.params.id), userId);
    res.status(204).send();
  });

  // Marketplace image upload
  app.post("/api/marketplace/upload-images", isAuthenticated, upload.array('images', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const imageUrls = files.map(file => `/images/products/${file.filename}`);
      res.json({ imageUrls });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Upload failed" });
    }
  });

  // === Admin: Scraper ===
  app.get("/api/admin/scraper/status", isAuthenticated, async (req, res) => {
    try {
      const status = await getScraperStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error getting scraper status" });
    }
  });

  app.post("/api/admin/scraper/run", isAuthenticated, async (req, res) => {
    try {
      const { supplier } = req.body || {};
      const results = await runScraper(supplier);
      res.json({ success: true, results });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error running scraper" });
    }
  });

  // === Browser-based Scraper ===
  app.get("/api/admin/browser-scraper/progress", isAuthenticated, async (req, res) => {
    try {
      const progress = getScrapeProgress();
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error getting scrape progress" });
    }
  });

  app.post("/api/admin/browser-scraper/run", isAuthenticated, async (req, res) => {
    try {
      const { supplier, url } = req.body || {};
      const results = await runBrowserScraper(supplier, url);
      res.json({ success: true, results });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error running browser scraper" });
    }
  });

  // === CSV Import ===
  app.post(
    "/api/admin/import/csv",
    isAuthenticated,
    upload.fields([
      { name: 'csv', maxCount: 1 },
      { name: 'images', maxCount: 5000 }
    ]),
    async (req, res) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        if (!files.csv || files.csv.length === 0) {
          return res.status(400).json({ message: "CSV file is required" });
        }

        const csvFile = files.csv[0];
        const imageFiles = files.images || [];
        
        // Build image lookup structures for flexible matching
        const imageMap = new Map<string, string>(); // normalized key -> path
        const imageList: { original: string; normalized: string; path: string }[] = [];
        
        for (const img of imageFiles) {
          const nameWithoutExt = path.basename(img.originalname, path.extname(img.originalname));
          const normalized = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '');
          const imagePath = `/images/products/${img.filename}`;
          imageMap.set(normalized, imagePath);
          imageList.push({ original: nameWithoutExt, normalized, path: imagePath });
        }
        
        // Helper function to find matching image with flexible matching
        const findMatchingImage = (partNumber: string, productName: string): string | null => {
          const partNorm = partNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
          const nameNorm = productName.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          // 1. Exact match on part number
          if (partNorm && imageMap.has(partNorm)) {
            return imageMap.get(partNorm)!;
          }
          
          // 2. Exact match on product name
          if (nameNorm && imageMap.has(nameNorm)) {
            return imageMap.get(nameNorm)!;
          }
          
          // 3. Image filename contains the part number (for cases like RATCO-CH-01 matching RATCO-CH-FRAME-001)
          if (partNorm) {
            // Extract base part number prefix (e.g., "ratcoch" from "ratcoch01")
            const partPrefix = partNorm.replace(/\d+$/, '');
            for (const img of imageList) {
              if (img.normalized.startsWith(partPrefix) || img.normalized.includes(partNorm)) {
                return img.path;
              }
            }
          }
          
          // 4. Try matching first significant word from product name
          const firstWord = productName.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (firstWord && firstWord.length > 3) {
            for (const img of imageList) {
              if (img.normalized.includes(firstWord)) {
                return img.path;
              }
            }
          }
          
          return null;
        };

        // Read and parse CSV
        const csvContent = fs.readFileSync(csvFile.path, 'utf-8');
        const records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });

        // Default supplier name from form field
        const defaultSupplierName = req.body.supplierName || 'CSV Import';
        
        // Cache for suppliers (to avoid repeated DB lookups)
        const supplierCache = new Map<string, { id: number }>();

        // Get all categories for mapping
        const categories = await storage.getCategories();
        const categoryMap = new Map(categories.map(c => [c.slug.toLowerCase(), c.id]));
        categoryMap.set('default', 1); // Engine as default

        const results = {
          total: records.length,
          imported: 0,
          skipped: 0,
          errors: [] as string[],
        };

        for (const record of records as Record<string, string>[]) {
          try {
            // Required fields
            const name = record.name || record.Name || record.product_name || record.title;
            const price = parseFloat(record.price || record.Price || '0');

            if (!name) {
              results.skipped++;
              results.errors.push(`Row missing required 'name' field`);
              continue;
            }

            // Get supplier from row or use default
            const rowSupplierName = record.supplier || record.Supplier || record.vendor || record.Vendor || defaultSupplierName;
            
            // Get or create supplier (with caching)
            let supplier = supplierCache.get(rowSupplierName);
            if (!supplier) {
              let existingSupplier = await storage.getSupplierByName(rowSupplierName);
              if (!existingSupplier) {
                existingSupplier = await storage.createSupplier({
                  name: rowSupplierName,
                  websiteUrl: null,
                  isActive: true,
                  csvUploaded: true,
                });
              } else {
                // Mark existing supplier as having CSV uploads
                await storage.updateSupplier(existingSupplier.id, { csvUploaded: true });
              }
              supplier = { id: existingSupplier.id };
              supplierCache.set(rowSupplierName, supplier);
            }

            // Optional fields
            const partNumber = record.part_number || record.sku || record.SKU || record.partNumber || '';
            const description = record.description || record.Description || '';
            const categorySlug = (record.category || record.Category || 'engine').toLowerCase().replace(/\s+/g, '-');
            const productUrl = record.url || record.product_url || record.productUrl || '#';
            const inStock = record.in_stock !== 'false' && record.inStock !== 'false';

            // Find category ID
            let categoryId = categoryMap.get(categorySlug) || 1;
            
            // Try to match image using flexible matching
            const matchedImage = findMatchingImage(partNumber, name);

            // Generate slug
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

            // Check if product already exists
            const existing = await storage.getProductBySlug(slug);
            if (existing) {
              results.skipped++;
              continue;
            }

            // Get currency from CSV (default to USD if not specified)
            const currency = record.currency || record.Currency || 'USD';

            // Create product
            await storage.createProduct({
              name,
              slug,
              price: price.toString(),
              partNumber,
              description,
              categoryId,
              supplierId: supplier.id,
              productUrl,
              primaryImageUrl: matchedImage || record.image_url || record.imageUrl || null,
              inStock,
              currency,
              isOem: record.is_oem === 'true' || record.isOem === 'true',
              isPerformance: record.is_performance === 'true' || record.isPerformance === 'true',
              isRestoration: record.is_restoration !== 'false' && record.isRestoration !== 'false',
            });

            results.imported++;
          } catch (err: any) {
            results.errors.push(`Error importing ${record.name || 'unknown'}: ${err.message}`);
            results.skipped++;
          }
        }

        // Cleanup CSV file
        fs.unlinkSync(csvFile.path);

        res.json({
          success: true,
          ...results,
          imagesUploaded: imageFiles.length,
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message || "Error importing CSV" });
      }
    }
  );

  // === Data Transfer (Dev to Prod) ===
  
  // Export all data as JSON (for download)
  app.get("/api/admin/export", isAuthenticated, async (req, res) => {
    try {
      const allSuppliers = await storage.getSuppliers();
      const allCategories = await storage.getCategories();
      const allProducts = await storage.getProducts({});
      
      const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        data: {
          suppliers: allSuppliers,
          categories: allCategories,
          products: allProducts,
        },
        stats: {
          suppliers: allSuppliers.length,
          categories: allCategories.length,
          products: allProducts.length,
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=tr6-data-export.json');
      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error exporting data" });
    }
  });
  
  // Import data from JSON
  app.post(
    "/api/admin/import",
    isAuthenticated,
    upload.single('dataFile'),
    async (req, res) => {
      try {
        const file = req.file;
        if (!file) {
          return res.status(400).json({ message: "JSON data file is required" });
        }
        
        const fileContent = fs.readFileSync(file.path, 'utf-8');
        const importData = JSON.parse(fileContent);
        
        if (!importData.data) {
          return res.status(400).json({ message: "Invalid export file format" });
        }
        
        const results = {
          suppliers: { imported: 0, skipped: 0 },
          categories: { imported: 0, skipped: 0 },
          products: { imported: 0, skipped: 0 },
          errors: [] as string[],
        };
        
        // Create supplier ID mapping (old ID -> new ID)
        const supplierIdMap = new Map<number, number>();
        
        // Import suppliers
        if (importData.data.suppliers) {
          for (const supplier of importData.data.suppliers) {
            try {
              const existing = await storage.getSupplierByName(supplier.name);
              if (existing) {
                supplierIdMap.set(supplier.id, existing.id);
                results.suppliers.skipped++;
              } else {
                const newSupplier = await storage.createSupplier({
                  name: supplier.name,
                  websiteUrl: supplier.websiteUrl,
                  logoUrl: supplier.logoUrl,
                  description: supplier.description,
                  isActive: supplier.isActive ?? true,
                  scraperConfig: supplier.scraperConfig,
                });
                supplierIdMap.set(supplier.id, newSupplier.id);
                results.suppliers.imported++;
              }
            } catch (err: any) {
              results.errors.push(`Supplier ${supplier.name}: ${err.message}`);
            }
          }
        }
        
        // Import products
        if (importData.data.products) {
          for (const product of importData.data.products) {
            try {
              // Check if product exists by slug
              const existing = await storage.getProductBySlug(product.slug);
              if (existing) {
                results.products.skipped++;
                continue;
              }
              
              // Map supplier ID
              const newSupplierId = supplierIdMap.get(product.supplierId) || product.supplierId;
              
              await storage.createProduct({
                name: product.name,
                slug: product.slug,
                partNumber: product.partNumber,
                description: product.description,
                price: product.price,
                originalPrice: product.originalPrice,
                categoryId: product.categoryId,
                supplierId: newSupplierId,
                primaryImageUrl: product.primaryImageUrl,
                productUrl: product.productUrl,
                inStock: product.inStock ?? true,
                isOem: product.isOem ?? false,
                isPerformance: product.isPerformance ?? false,
                isRestoration: product.isRestoration ?? true,
              });
              results.products.imported++;
            } catch (err: any) {
              results.errors.push(`Product ${product.name}: ${err.message}`);
            }
          }
        }
        
        // Cleanup
        fs.unlinkSync(file.path);
        
        res.json({
          success: true,
          results,
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message || "Error importing data" });
      }
    }
  );

  // === Database Cleanup ===
  const deleteByIdSchema = z.object({
    supplierId: z.string().regex(/^\d+$/, "Invalid ID format").transform(Number),
  });

  const deleteByCategorySchema = z.object({
    categoryId: z.string().regex(/^\d+$/, "Invalid ID format").transform(Number),
  });

  const deleteByDateSchema = z.object({
    beforeDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), "Invalid date format"),
  });

  app.delete("/api/admin/products/by-supplier/:supplierId", isAuthenticated, async (req, res) => {
    try {
      const parsed = deleteByIdSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }
      const deletedCount = await storage.deleteProductsBySupplier(parsed.data.supplierId);
      res.json({ success: true, deletedCount });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error deleting products" });
    }
  });

  app.delete("/api/admin/products/by-category/:categoryId", isAuthenticated, async (req, res) => {
    try {
      const parsed = deleteByCategorySchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }
      const deletedCount = await storage.deleteProductsByCategory(parsed.data.categoryId);
      res.json({ success: true, deletedCount });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error deleting products" });
    }
  });

  app.delete("/api/admin/products/by-date", isAuthenticated, async (req, res) => {
    try {
      const parsed = deleteByDateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }
      const date = new Date(parsed.data.beforeDate);
      const deletedCount = await storage.deleteProductsBeforeDate(date);
      res.json({ success: true, deletedCount });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error deleting products" });
    }
  });

  app.delete("/api/admin/supplier/:supplierId", isAuthenticated, async (req, res) => {
    try {
      const parsed = deleteByIdSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }
      // First delete all products for this supplier
      await storage.deleteProductsBySupplier(parsed.data.supplierId);
      // Then delete the supplier itself
      await storage.deleteSupplier(parsed.data.supplierId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error deleting supplier" });
    }
  });

  return httpServer;
}
