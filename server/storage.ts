import { db } from "./db";
import {
  suppliers,
  categories,
  products,
  profiles,
  userWishlists,
  userGarage,
  reviews,
  buildThreads,
  buildThreadProducts,
  marketplaceListings,
  type Supplier,
  type Category,
  type Product,
  type Profile,
  type InsertProfile,
  type WishlistItem,
  type InsertWishlistItem,
  type GarageItem,
  type InsertGarageItem,
  type BuildThread,
  type InsertBuildThread,
  type MarketplaceListing,
  type InsertMarketplaceListing,
} from "@shared/schema";
import { eq, like, desc, and, sql, inArray } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  getSupplierByName(name: string): Promise<Supplier | undefined>;
  createSupplier(supplier: Partial<Supplier>): Promise<Supplier>;
  updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier | undefined>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;

  // Products
  getProducts(params?: {
    search?: string;
    categoryId?: string;
    supplierId?: string;
    carModel?: string;
    subcategory?: string;
    sort?: string;
  }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByIds(ids: number[]): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: Partial<Product>): Promise<Product>;

  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile>;

  // Wishlist
  getWishlist(userId: string): Promise<(WishlistItem & { product: Product })[]>;
  addToWishlist(item: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(id: number, userId: string): Promise<void>;

  // Garage
  getGarage(userId: string): Promise<(GarageItem & { product: Product })[]>;
  addToGarage(item: InsertGarageItem): Promise<GarageItem>;
  updateGarageItem(id: number, userId: string, item: Partial<InsertGarageItem>): Promise<GarageItem>;

  // Build Threads
  getBuildThreads(userId?: string): Promise<BuildThread[]>;
  createBuildThread(thread: InsertBuildThread): Promise<BuildThread>;
  getBuildThread(id: number): Promise<BuildThread | undefined>;

  // Cleanup
  deleteProductsBySupplier(supplierId: number): Promise<number>;
  deleteProductsByCategory(categoryId: number): Promise<number>;
  deleteProductsBeforeDate(beforeDate: Date): Promise<number>;
  deleteSupplier(supplierId: number): Promise<void>;

  // Marketplace
  getMarketplaceListings(params?: { userId?: string; itemType?: string; status?: string }): Promise<MarketplaceListing[]>;
  getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined>;
  getUserMarketplaceListings(userId: string): Promise<MarketplaceListing[]>;
  createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing>;
  updateMarketplaceListing(id: number, userId: string, listing: Partial<InsertMarketplaceListing>): Promise<MarketplaceListing | undefined>;
  deleteMarketplaceListing(id: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Auth methods delegated to authStorage
  getUser = authStorage.getUser;
  upsertUser = authStorage.upsertUser;

  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async getSupplierByName(name: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.name, name));
    return supplier;
  }

  async createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier as any).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers).set(data as any).where(eq(suppliers.id, id)).returning();
    return updated;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.displayOrder);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getProducts(params?: {
    search?: string;
    categoryId?: string;
    supplierId?: string;
    carModel?: string;
    subcategory?: string;
    sort?: string;
  }): Promise<Product[]> {
    let query = db.select().from(products);

    const conditions = [];
    if (params?.search) {
      conditions.push(like(products.name, `%${params.search}%`));
    }
    if (params?.categoryId) {
      const categoryIdNum = parseInt(params.categoryId);
      if (!isNaN(categoryIdNum)) {
        conditions.push(eq(products.categoryId, categoryIdNum));
      } else {
        const [category] = await db.select().from(categories).where(eq(categories.slug, params.categoryId));
        if (category) {
          conditions.push(eq(products.categoryId, category.id));
        }
      }
    }
    if (params?.supplierId) {
      conditions.push(eq(products.supplierId, parseInt(params.supplierId)));
    }
    if (params?.carModel) {
      conditions.push(like(products.carModel, `%${params.carModel}%`));
    }
    if (params?.subcategory) {
      conditions.push(eq(products.subcategory, params.subcategory));
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(...conditions));
    }

    if (params?.sort === "price_asc") {
      // @ts-ignore
      query = query.orderBy(products.price);
    } else if (params?.sort === "price_desc") {
      // @ts-ignore
      query = query.orderBy(desc(products.price));
    } else if (params?.sort === "newest") {
      // @ts-ignore
      query = query.orderBy(desc(products.createdAt));
    }

    return await query;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByIds(ids: number[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const productList = await db.select().from(products).where(inArray(products.id, ids));
    return productList;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product as any).returning();
    return newProduct;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile> {
    const [updated] = await db
      .update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  }

  async getWishlist(userId: string): Promise<(WishlistItem & { product: Product })[]> {
    const items = await db
      .select({
        wishlist: userWishlists,
        product: products,
      })
      .from(userWishlists)
      .innerJoin(products, eq(userWishlists.productId, products.id))
      .where(eq(userWishlists.userId, userId));

    return items.map((item) => ({ ...item.wishlist, product: item.product }));
  }

  async addToWishlist(item: InsertWishlistItem): Promise<WishlistItem> {
    const [newItem] = await db.insert(userWishlists).values(item).returning();
    return newItem;
  }

  async removeFromWishlist(id: number, userId: string): Promise<void> {
    await db
      .delete(userWishlists)
      .where(and(eq(userWishlists.id, id), eq(userWishlists.userId, userId)));
  }

  async getGarage(userId: string): Promise<(GarageItem & { product: Product })[]> {
    const items = await db
      .select({
        garage: userGarage,
        product: products,
      })
      .from(userGarage)
      .innerJoin(products, eq(userGarage.productId, products.id))
      .where(eq(userGarage.userId, userId));

    return items.map((item) => ({ ...item.garage, product: item.product }));
  }

  async addToGarage(item: InsertGarageItem): Promise<GarageItem> {
    const [newItem] = await db.insert(userGarage).values(item).returning();
    return newItem;
  }

  async updateGarageItem(
    id: number,
    userId: string,
    updates: Partial<InsertGarageItem>
  ): Promise<GarageItem> {
    const [updated] = await db
      .update(userGarage)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(userGarage.id, id), eq(userGarage.userId, userId)))
      .returning();
    return updated;
  }

  async getBuildThreads(userId?: string): Promise<BuildThread[]> {
    if (userId) {
      return await db.select().from(buildThreads).where(eq(buildThreads.userId, userId));
    }
    return await db.select().from(buildThreads).orderBy(desc(buildThreads.createdAt));
  }

  async createBuildThread(thread: InsertBuildThread): Promise<BuildThread> {
    const [newThread] = await db.insert(buildThreads).values(thread).returning();
    return newThread;
  }

  async getBuildThread(id: number): Promise<BuildThread | undefined> {
    const [thread] = await db.select().from(buildThreads).where(eq(buildThreads.id, id));
    return thread;
  }

  async deleteProductsBySupplier(supplierId: number): Promise<number> {
    const result = await db.delete(products).where(eq(products.supplierId, supplierId)).returning();
    return result.length;
  }

  async deleteProductsByCategory(categoryId: number): Promise<number> {
    const result = await db.delete(products).where(eq(products.categoryId, categoryId)).returning();
    return result.length;
  }

  async deleteProductsBeforeDate(beforeDate: Date): Promise<number> {
    const result = await db.delete(products).where(sql`${products.createdAt} < ${beforeDate}`).returning();
    return result.length;
  }

  async deleteSupplier(supplierId: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, supplierId));
  }

  async getMarketplaceListings(params?: { userId?: string; itemType?: string; status?: string }): Promise<MarketplaceListing[]> {
    let query = db.select().from(marketplaceListings);
    const conditions = [];
    
    if (params?.userId) {
      conditions.push(eq(marketplaceListings.userId, params.userId));
    }
    if (params?.itemType) {
      conditions.push(eq(marketplaceListings.itemType, params.itemType));
    }
    if (params?.status) {
      conditions.push(eq(marketplaceListings.status, params.status));
    } else {
      conditions.push(eq(marketplaceListings.status, 'active'));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(marketplaceListings).where(and(...conditions)).orderBy(desc(marketplaceListings.createdAt));
    }
    return await db.select().from(marketplaceListings).orderBy(desc(marketplaceListings.createdAt));
  }

  async getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined> {
    const [listing] = await db.select().from(marketplaceListings).where(eq(marketplaceListings.id, id));
    return listing;
  }

  async getUserMarketplaceListings(userId: string): Promise<MarketplaceListing[]> {
    return await db.select().from(marketplaceListings).where(eq(marketplaceListings.userId, userId)).orderBy(desc(marketplaceListings.createdAt));
  }

  async createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing> {
    const [newListing] = await db.insert(marketplaceListings).values(listing).returning();
    return newListing;
  }

  async updateMarketplaceListing(id: number, userId: string, listing: Partial<InsertMarketplaceListing>): Promise<MarketplaceListing | undefined> {
    const [updated] = await db.update(marketplaceListings)
      .set({ ...listing, updatedAt: new Date() })
      .where(and(eq(marketplaceListings.id, id), eq(marketplaceListings.userId, userId)))
      .returning();
    return updated;
  }

  async deleteMarketplaceListing(id: number, userId: string): Promise<void> {
    await db.delete(marketplaceListings).where(and(eq(marketplaceListings.id, id), eq(marketplaceListings.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
