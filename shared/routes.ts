import { z } from "zod";
import {
  insertSupplierSchema,
  insertCategorySchema,
  insertProductSchema,
  insertProfileSchema,
  insertWishlistItemSchema,
  insertGarageItemSchema,
  insertReviewSchema,
  insertBuildThreadSchema,
  insertMarketplaceListingSchema,
  suppliers,
  categories,
  products,
  profiles,
  userWishlists,
  userGarage,
  reviews,
  buildThreads,
  marketplaceListings,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  suppliers: {
    list: {
      method: "GET" as const,
      path: "/api/suppliers",
      responses: {
        200: z.array(z.custom<typeof suppliers.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/suppliers/:id",
      responses: {
        200: z.custom<typeof suppliers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  categories: {
    list: {
      method: "GET" as const,
      path: "/api/categories",
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/categories/:id",
      responses: {
        200: z.custom<typeof categories.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  products: {
    list: {
      method: "GET" as const,
      path: "/api/products",
      input: z.object({
        search: z.string().optional(),
        categoryId: z.string().optional(), // using string for URL params handling convenience
        supplierId: z.string().optional(),
        carModel: z.string().optional(),
        subcategory: z.string().optional(),
        sort: z.enum(["price_asc", "price_desc", "rating", "newest"]).optional(),
        cursor: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/products/:id",
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  profiles: {
    me: {
      method: "GET" as const,
      path: "/api/profiles/me",
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/profiles/me",
      input: insertProfileSchema.partial(),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  wishlist: {
    list: {
      method: "GET" as const,
      path: "/api/wishlist",
      responses: {
        200: z.array(z.custom<typeof userWishlists.$inferSelect & { product: typeof products.$inferSelect }>()),
        401: errorSchemas.unauthorized,
      },
    },
    add: {
      method: "POST" as const,
      path: "/api/wishlist",
      input: insertWishlistItemSchema,
      responses: {
        201: z.custom<typeof userWishlists.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    remove: {
      method: "DELETE" as const,
      path: "/api/wishlist/:id",
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  garage: {
    list: {
      method: "GET" as const,
      path: "/api/garage",
      responses: {
        200: z.array(z.custom<typeof userGarage.$inferSelect & { product: typeof products.$inferSelect }>()),
        401: errorSchemas.unauthorized,
      },
    },
    add: {
      method: "POST" as const,
      path: "/api/garage",
      input: insertGarageItemSchema,
      responses: {
        201: z.custom<typeof userGarage.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/garage/:id",
      input: insertGarageItemSchema.partial(),
      responses: {
        200: z.custom<typeof userGarage.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  buildThreads: {
    list: {
      method: "GET" as const,
      path: "/api/build-threads",
      input: z.object({
        userId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof buildThreads.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/build-threads",
      input: insertBuildThreadSchema,
      responses: {
        201: z.custom<typeof buildThreads.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/build-threads/:id",
      responses: {
        200: z.custom<typeof buildThreads.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  marketplace: {
    list: {
      method: "GET" as const,
      path: "/api/marketplace",
      input: z.object({
        userId: z.string().optional(),
        itemType: z.string().optional(),
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof marketplaceListings.$inferSelect>()),
      },
    },
    myListings: {
      method: "GET" as const,
      path: "/api/marketplace/my-listings",
      responses: {
        200: z.array(z.custom<typeof marketplaceListings.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/marketplace",
      input: insertMarketplaceListingSchema,
      responses: {
        201: z.custom<typeof marketplaceListings.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/marketplace/:id",
      responses: {
        200: z.custom<typeof marketplaceListings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/marketplace/:id",
      input: insertMarketplaceListingSchema.partial(),
      responses: {
        200: z.custom<typeof marketplaceListings.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/marketplace/:id",
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
