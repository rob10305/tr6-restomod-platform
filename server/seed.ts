import { db } from "./db";
import { suppliers, categories, products, productImages } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Suppliers
  const [moss] = await db.insert(suppliers).values({
    name: "Moss Motors",
    websiteUrl: "https://mossmotors.com",
    baseCountry: "USA",
    shippingToUs: true,
    averageRating: "4.50",
    description: "Leading supplier of British sports car parts.",
  }).returning();

  const [rimmer] = await db.insert(suppliers).values({
    name: "Rimmer Bros",
    websiteUrl: "https://rimmerbros.com",
    baseCountry: "UK",
    shippingToUs: true,
    averageRating: "4.20",
    description: "Parts and accessories for Triumph, MG, Rover, Land Rover, Jaguar.",
  }).returning();

  // Categories
  const [engine] = await db.insert(categories).values({
    name: "Engine",
    slug: "engine",
    description: "Engine components and upgrades",
    icon: "engine",
    diagramXPosition: "50.00",
    diagramYPosition: "20.00",
  }).returning();

  const [suspension] = await db.insert(categories).values({
    name: "Suspension",
    slug: "suspension",
    description: "Shocks, springs, and bushings",
    icon: "suspension",
    diagramXPosition: "20.00",
    diagramYPosition: "70.00",
  }).returning();

  const [interior] = await db.insert(categories).values({
    name: "Interior",
    slug: "interior",
    description: "Seats, carpet, dashboard",
    icon: "interior",
    diagramXPosition: "50.00",
    diagramYPosition: "50.00",
  }).returning();

  // Products
  const [carb] = await db.insert(products).values({
    supplierId: moss.id,
    categoryId: engine.id,
    name: "Dual Weber DCOE Carburetor Kit",
    slug: "dual-weber-dcoe-kit",
    description: "Performance carburetor upgrade for the TR6 engine. Includes manifold and linkage.",
    price: "1295.00",
    inStock: true,
    stockStatus: "in_stock",
    productUrl: "https://mossmotors.com/tr6-weber-carb-kit",
    primaryImageUrl: "https://mossmotors.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/3/7/372-560_1.jpg",
    isPerformance: true,
    averageRating: "4.80",
  }).returning();

  const [coil] = await db.insert(products).values({
    supplierId: moss.id,
    categoryId: engine.id,
    name: "Pertronix Flame-Thrower Coil",
    slug: "pertronix-coil",
    description: "High performance ignition coil.",
    price: "45.99",
    inStock: true,
    stockStatus: "in_stock",
    productUrl: "https://mossmotors.com/pertronix-coil",
    primaryImageUrl: "https://mossmotors.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/1/4/143-000_1.jpg",
    isPerformance: true,
    averageRating: "4.70",
  }).returning();

  const [shocks] = await db.insert(products).values({
    supplierId: rimmer.id,
    categoryId: suspension.id,
    name: "GAZ Adjustable Shock Absorber Kit",
    slug: "gaz-shocks-rear",
    description: "Rear telescopic shock conversion kit.",
    price: "350.00",
    currency: "GBP",
    inStock: true,
    stockStatus: "low_stock",
    productUrl: "https://rimmerbros.com/Item--i-RL1640",
    isPerformance: true,
    averageRating: "4.60",
  }).returning();

  console.log("Seeding complete!");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
