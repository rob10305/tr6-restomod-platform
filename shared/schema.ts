import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, date, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  websiteUrl: text("website_url"),
  baseCountry: text("base_country"),
  logoUrl: text("logo_url"),
  shippingToUs: boolean("shipping_to_us").default(true),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  totalReviews: integer("total_reviews").default(0),
  isActive: boolean("is_active").default(true),
  email: text("email"),
  phone: text("phone"),
  description: text("description"),
  returnPolicy: text("return_policy"),
  warrantyInfo: text("warranty_info"),
  scraperConfig: jsonb("scraper_config"),
  lastScrapedAt: timestamp("last_scraped_at"),
  csvUploaded: boolean("csv_uploaded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  parentId: integer("parent_id"), // Self-reference handled in relations
  description: text("description"),
  icon: text("icon"),
  colorCode: text("color_code"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  diagramXPosition: decimal("diagram_x_position", { precision: 5, scale: 2 }),
  diagramYPosition: decimal("diagram_y_position", { precision: 5, scale: 2 }),
  hotspotRadius: decimal("hotspot_radius", { precision: 5, scale: 2 }).default("5.0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(), //.references(() => suppliers.id),
  categoryId: integer("category_id").notNull(), //.references(() => categories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  partNumber: text("part_number"),
  manufacturer: text("manufacturer"),
  subcategory: text("subcategory"),
  carModel: text("car_model"),
  imageFile: text("image_file"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  inStock: boolean("in_stock").default(true),
  stockStatus: text("stock_status"), // 'in_stock', 'low_stock', 'backorder', 'discontinued'
  estimatedDeliveryDays: integer("estimated_delivery_days"),
  productUrl: text("product_url").notNull(),
  primaryImageUrl: text("primary_image_url"),
  isOem: boolean("is_oem").default(false),
  isPerformance: boolean("is_performance").default(false),
  isRestoration: boolean("is_restoration").default(true),
  difficultyLevel: text("difficulty_level"), // 'easy', 'medium', 'hard', 'professional'
  viewCount: integer("view_count").default(0),
  clickCount: integer("click_count").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  totalReviews: integer("total_reviews").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastScrapedAt: timestamp("last_scraped_at"),
  lastPriceUpdate: timestamp("last_price_update"),
});

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(), //.references(() => products.id),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  displayOrder: integer("display_order").default(0),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(), //.references(() => products.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Extension of the auth users table
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), //.references(() => users.id),
  username: text("username").unique().notNull(),
  bio: text("bio"),
  location: text("location"),
  ownsTr6: boolean("owns_tr6").default(false),
  tr6Year: integer("tr6_year"),
  tr6Color: text("tr6_color"),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  role: text("role").default("user"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userWishlists = pgTable("user_wishlists", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), //.references(() => users.id),
  productId: integer("product_id").notNull(), //.references(() => products.id),
  notes: text("notes"),
  priority: integer("priority").default(0),
  addedAt: timestamp("added_at").defaultNow(),
});

export const userGarage = pgTable("user_garage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), //.references(() => users.id),
  productId: integer("product_id").notNull(), //.references(() => products.id),
  installedDate: date("installed_date"),
  installationNotes: text("installation_notes"),
  installationDifficulty: text("installation_difficulty"),
  status: text("status").default("installed"), // 'installed', 'removed', 'planning'
  photoUrls: text("photo_urls").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(), //.references(() => products.id),
  userId: text("user_id").notNull(), //.references(() => users.id),
  rating: integer("rating").notNull(),
  title: text("title"),
  content: text("content").notNull(),
  verifiedPurchase: boolean("verified_purchase").default(false),
  helpfulCount: integer("helpful_count").default(0),
  notHelpfulCount: integer("not_helpful_count").default(0),
  isApproved: boolean("is_approved").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviewPhotos = pgTable("review_photos", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(), //.references(() => reviews.id),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productCompatibility = pgTable("product_compatibility", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(), //.references(() => products.id),
  relatedProductId: integer("related_product_id").notNull(), //.references(() => products.id),
  relationshipType: text("relationship_type").notNull(), // 'requires', 'compatible_with', 'incompatible_with', 'alternative_to'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const buildThreads = pgTable("build_threads", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), //.references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  tr6Year: integer("tr6_year"),
  tr6Vin: text("tr6_vin"),
  buildType: text("build_type"), // 'restoration', 'restomod', 'performance', 'daily_driver'
  status: text("status").default("in_progress"), // 'planning', 'in_progress', 'completed', 'paused'
  budget: decimal("budget", { precision: 10, scale: 2 }),
  startDate: date("start_date"),
  completionDate: date("completion_date"),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const buildThreadProducts = pgTable("build_thread_products", {
  id: serial("id").primaryKey(),
  buildThreadId: integer("build_thread_id").notNull(), //.references(() => buildThreads.id),
  productId: integer("product_id").notNull(), //.references(() => products.id),
  installationDate: date("installation_date"),
  notes: text("notes"),
  photoUrls: text("photo_urls").array(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const searchAnalytics = pgTable("search_analytics", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  userId: text("user_id"), //.references(() => users.id),
  resultsCount: integer("results_count"),
  clickedProductId: integer("clicked_product_id"), //.references(() => products.id),
  sessionId: text("session_id"),
  searchedAt: timestamp("searched_at").defaultNow(),
});

export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  itemType: text("item_type").notNull(), // 'part', 'car', 'accessory'
  condition: text("condition"), // 'new', 'used_excellent', 'used_good', 'used_fair', 'for_parts'
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  negotiable: boolean("negotiable").default(false),
  shippingAvailable: boolean("shipping_available").default(false),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  pickupOnly: boolean("pickup_only").default(true),
  location: text("location"),
  imageUrls: text("image_urls").array(),
  partNumber: text("part_number"),
  manufacturer: text("manufacturer"),
  yearFrom: integer("year_from"),
  yearTo: integer("year_to"),
  status: text("status").default("active"), // 'active', 'sold', 'pending', 'expired'
  viewCount: integer("view_count").default(0),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// === RELATIONS ===

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parent_category",
  }),
  children: many(categories, { relationName: "parent_category" }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  priceHistory: many(priceHistory),
  wishlists: many(userWishlists),
  garageEntries: many(userGarage),
  reviews: many(reviews),
  compatibility: many(productCompatibility, { relationName: "source_product" }),
  relatedTo: many(productCompatibility, { relationName: "related_product" }),
  buildThreadUsages: many(buildThreadProducts),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  wishlist: many(userWishlists),
  garage: many(userGarage),
  reviews: many(reviews),
  buildThreads: many(buildThreads),
  marketplaceListings: many(marketplaceListings),
}));

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one }) => ({
  user: one(users, {
    fields: [marketplaceListings.userId],
    references: [users.id],
  }),
}));

export const userWishlistsRelations = relations(userWishlists, ({ one }) => ({
  user: one(users, {
    fields: [userWishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [userWishlists.productId],
    references: [products.id],
  }),
}));

export const userGarageRelations = relations(userGarage, ({ one }) => ({
  user: one(users, {
    fields: [userGarage.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [userGarage.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  photos: many(reviewPhotos),
}));

export const reviewPhotosRelations = relations(reviewPhotos, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewPhotos.reviewId],
    references: [reviews.id],
  }),
}));

export const buildThreadsRelations = relations(buildThreads, ({ one, many }) => ({
  user: one(users, {
    fields: [buildThreads.userId],
    references: [users.id],
  }),
  products: many(buildThreadProducts),
}));

export const buildThreadProductsRelations = relations(buildThreadProducts, ({ one }) => ({
  buildThread: one(buildThreads, {
    fields: [buildThreadProducts.buildThreadId],
    references: [buildThreads.id],
  }),
  product: one(products, {
    fields: [buildThreadProducts.productId],
    references: [products.id],
  }),
}));

export const productCompatibilityRelations = relations(productCompatibility, ({ one }) => ({
  product: one(products, {
    fields: [productCompatibility.productId],
    references: [products.id],
    relationName: "source_product",
  }),
  relatedProduct: one(products, {
    fields: [productCompatibility.relatedProductId],
    references: [products.id],
    relationName: "related_product",
  }),
}));

// === ZOD SCHEMAS ===

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastScrapedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastScrapedAt: true,
  lastPriceUpdate: true,
  viewCount: true,
  clickCount: true,
  averageRating: true,
  totalReviews: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertWishlistItemSchema = createInsertSchema(userWishlists).omit({
  id: true,
  addedAt: true,
});

export const insertGarageItemSchema = createInsertSchema(userGarage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpfulCount: true,
  notHelpfulCount: true,
  isApproved: true,
  isFeatured: true,
});

export const insertBuildThreadSchema = createInsertSchema(buildThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  likeCount: true,
});

export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  expiresAt: true,
});

// === TYPES ===

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type WishlistItem = typeof userWishlists.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;

export type GarageItem = typeof userGarage.$inferSelect;
export type InsertGarageItem = z.infer<typeof insertGarageItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type BuildThread = typeof buildThreads.$inferSelect;
export type InsertBuildThread = z.infer<typeof insertBuildThreadSchema>;

export type BuildThreadProduct = typeof buildThreadProducts.$inferSelect;

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;
