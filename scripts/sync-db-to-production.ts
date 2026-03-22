import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

const DEV_DATABASE_URL = process.env.DATABASE_URL;
const PROD_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL;

if (!DEV_DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set");
  process.exit(1);
}

if (!PROD_DATABASE_URL) {
  console.error("ERROR: PRODUCTION_DATABASE_URL environment variable is not set");
  console.error("Please set PRODUCTION_DATABASE_URL to your production database connection string");
  process.exit(1);
}

async function syncDatabases() {
  console.log("Starting database sync from development to production...\n");

  const devPool = new Pool({ connectionString: DEV_DATABASE_URL });
  const prodPool = new Pool({ connectionString: PROD_DATABASE_URL });

  const devDb = drizzle(devPool, { schema });
  const prodDb = drizzle(prodPool, { schema });

  try {
    console.log("Exporting data from development database...\n");

    const suppliers = await devDb.select().from(schema.suppliers);
    console.log(`  - Suppliers: ${suppliers.length} records`);

    const categories = await devDb.select().from(schema.categories);
    console.log(`  - Categories: ${categories.length} records`);

    const products = await devDb.select().from(schema.products);
    console.log(`  - Products: ${products.length} records`);

    const users = await devDb.select().from(schema.users);
    console.log(`  - Users: ${users.length} records`);

    const profiles = await devDb.select().from(schema.profiles);
    console.log(`  - Profiles: ${profiles.length} records`);

    const userWishlists = await devDb.select().from(schema.userWishlists);
    console.log(`  - Wishlists: ${userWishlists.length} records`);

    const userGarage = await devDb.select().from(schema.userGarage);
    console.log(`  - Garage vehicles: ${userGarage.length} records`);

    const buildThreads = await devDb.select().from(schema.buildThreads);
    console.log(`  - Build threads: ${buildThreads.length} records`);

    const reviews = await devDb.select().from(schema.reviews);
    console.log(`  - Reviews: ${reviews.length} records`);

    console.log("\nImporting data to production database...\n");

    if (suppliers.length > 0) {
      await prodPool.query("DELETE FROM suppliers CASCADE");
      for (const supplier of suppliers) {
        await prodDb.insert(schema.suppliers).values(supplier).onConflictDoNothing();
      }
      console.log(`  - Imported ${suppliers.length} suppliers`);
    }

    if (categories.length > 0) {
      await prodPool.query("DELETE FROM categories CASCADE");
      for (const category of categories) {
        await prodDb.insert(schema.categories).values(category).onConflictDoNothing();
      }
      console.log(`  - Imported ${categories.length} categories`);
    }

    if (products.length > 0) {
      await prodPool.query("DELETE FROM products CASCADE");
      for (const product of products) {
        await prodDb.insert(schema.products).values(product).onConflictDoNothing();
      }
      console.log(`  - Imported ${products.length} products`);
    }

    if (users.length > 0) {
      await prodPool.query("DELETE FROM users CASCADE");
      for (const user of users) {
        await prodDb.insert(schema.users).values(user).onConflictDoNothing();
      }
      console.log(`  - Imported ${users.length} users`);
    }

    if (profiles.length > 0) {
      await prodPool.query("DELETE FROM profiles CASCADE");
      for (const profile of profiles) {
        await prodDb.insert(schema.profiles).values(profile).onConflictDoNothing();
      }
      console.log(`  - Imported ${profiles.length} profiles`);
    }

    if (userWishlists.length > 0) {
      await prodPool.query("DELETE FROM user_wishlists");
      for (const wishlist of userWishlists) {
        await prodDb.insert(schema.userWishlists).values(wishlist).onConflictDoNothing();
      }
      console.log(`  - Imported ${userWishlists.length} wishlists`);
    }

    if (userGarage.length > 0) {
      await prodPool.query("DELETE FROM user_garage");
      for (const vehicle of userGarage) {
        await prodDb.insert(schema.userGarage).values(vehicle).onConflictDoNothing();
      }
      console.log(`  - Imported ${userGarage.length} garage vehicles`);
    }

    if (buildThreads.length > 0) {
      await prodPool.query("DELETE FROM build_threads CASCADE");
      for (const thread of buildThreads) {
        await prodDb.insert(schema.buildThreads).values(thread).onConflictDoNothing();
      }
      console.log(`  - Imported ${buildThreads.length} build threads`);
    }

    if (reviews.length > 0) {
      await prodPool.query("DELETE FROM reviews");
      for (const review of reviews) {
        await prodDb.insert(schema.reviews).values(review).onConflictDoNothing();
      }
      console.log(`  - Imported ${reviews.length} reviews`);
    }

    console.log("\nDatabase sync completed successfully!");

  } catch (error) {
    console.error("Error during database sync:", error);
    throw error;
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

syncDatabases().catch((error) => {
  console.error("Sync failed:", error);
  process.exit(1);
});
