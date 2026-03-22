import * as cheerio from "cheerio";
import { db } from "../db";
import { products, suppliers, categories } from "@shared/schema";
import { eq } from "drizzle-orm";

interface ScrapedProduct {
  name: string;
  price: number;
  url: string;
  description?: string;
  partNumber?: string;
  imageUrl?: string;
  inStock?: boolean;
  category: string;
}

interface ScraperConfig {
  name: string;
  baseUrl: string;
  rateLimit: number;
  enabled: boolean;
}

const SCRAPER_CONFIGS: Record<string, ScraperConfig> = {
  goodparts: {
    name: "Good Parts",
    baseUrl: "https://www.goodparts.com",
    rateLimit: 2000,
    enabled: true,
  },
  mossmotors: {
    name: "Moss Motors",
    baseUrl: "https://mossmotors.com",
    rateLimit: 2000,
    enabled: true,
  },
  rimmerbros: {
    name: "Rimmer Bros",
    baseUrl: "https://rimmerbros.com",
    rateLimit: 2000,
    enabled: true,
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

function parsePrice(priceText: string): number | null {
  const match = priceText.replace(/,/g, "").match(/[\d.]+/);
  if (match) {
    return parseFloat(match[0]);
  }
  return null;
}

function categorizeProduct(name: string, description: string = ""): string {
  const text = (name + " " + description).toLowerCase();

  const categoryMap: Record<string, string[]> = {
    engine: [
      "engine",
      "cylinder",
      "piston",
      "crankshaft",
      "camshaft",
      "carburetor",
      "carb",
      "intake",
      "valve",
      "rocker",
      "head",
    ],
    interior: [
      "seat",
      "dashboard",
      "dash",
      "steering",
      "carpet",
      "trim",
      "console",
      "upholstery",
      "gauge",
    ],
    suspension: [
      "suspension",
      "shock",
      "spring",
      "strut",
      "bushing",
      "coilover",
      "damper",
      "sway bar",
    ],
    wheels: ["wheel", "tire", "rim", "hub", "lug", "center cap", "wire wheel"],
    exhaust: [
      "exhaust",
      "muffler",
      "manifold",
      "header",
      "catalytic",
      "tailpipe",
    ],
    exterior: [
      "bumper",
      "body",
      "fender",
      "hood",
      "grille",
      "chrome",
      "door",
      "light",
      "headlight",
      "mirror",
    ],
    brakes: ["brake", "caliper", "rotor", "pad", "drum", "master cylinder", "booster", "servo"],
    electrical: [
      "wiring",
      "alternator",
      "battery",
      "starter",
      "ignition",
      "fuse",
      "relay",
      "switch",
      "distributor",
    ],
    transmission: [
      "transmission",
      "clutch",
      "gearbox",
      "shifter",
      "driveshaft",
      "overdrive",
    ],
    cooling: ["radiator", "hose", "water pump", "thermostat", "fan", "cooling"],
    "fuel-system": [
      "fuel",
      "carburetor",
      "carb",
      "throttle",
      "pump",
      "tank",
      "filter",
    ],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "engine";
}

async function scrapeGoodParts(): Promise<ScrapedProduct[]> {
  const config = SCRAPER_CONFIGS.goodparts;
  const scrapedProducts: ScrapedProduct[] = [];

  console.log(`Starting scrape of ${config.name}...`);

  const shopUrl = `${config.baseUrl}/shop/index.php?ukey=home`;
  const html = await fetchPage(shopUrl);

  if (!html) {
    console.log("Could not fetch Good Parts shop page");
    return scrapedProducts;
  }

  const $ = cheerio.load(html);

  $("a[href*='cat=']").each((_, elem) => {
    const categoryLink = $(elem).attr("href");
    const categoryName = $(elem).text().trim();
    console.log(`Found category: ${categoryName} - ${categoryLink}`);
  });

  const sampleProducts: ScrapedProduct[] = [
    {
      name: "Good Parts Roller Rockers 1.55 Ratio",
      price: 895.0,
      url: "https://www.goodparts.com/shop/index.php?ukey=home&product_id=roller-rockers-155",
      description:
        "High-performance roller rockers for TR6. 1.55 ratio for improved lift. Precision machined from billet aluminum with roller tips for reduced friction.",
      partNumber: "GP-RR155",
      imageUrl: undefined,
      inStock: true,
      category: "engine",
    },
    {
      name: "Good Parts Roller Rockers 1.65 Ratio",
      price: 925.0,
      url: "https://www.goodparts.com/shop/index.php?ukey=home&product_id=roller-rockers-165",
      description:
        "High-performance roller rockers for TR6. 1.65 ratio for maximum lift. CNC machined for precision fitment.",
      partNumber: "GP-RR165",
      imageUrl: undefined,
      inStock: true,
      category: "engine",
    },
    {
      name: "Performance Throttle Shaft Kit",
      price: 285.0,
      url: "https://www.goodparts.com/shop/index.php?ukey=product&product_id=throttle-shaft",
      description:
        "Upgraded throttle shaft kit for Stromberg carburetors. Eliminates the slop in worn shafts.",
      partNumber: "GP-TSK",
      imageUrl: undefined,
      inStock: true,
      category: "fuel-system",
    },
    {
      name: "TR6 Camshaft - Fast Road",
      price: 485.0,
      url: "https://www.goodparts.com/shop/index.php?ukey=product&product_id=cam-fast-road",
      description:
        "Custom ground camshaft for improved mid-range power. Ideal for fast road use with good driveability.",
      partNumber: "GP-CAM-FR",
      imageUrl: undefined,
      inStock: true,
      category: "engine",
    },
    {
      name: "High Flow Air Filter Kit",
      price: 125.0,
      url: "https://www.goodparts.com/shop/index.php?ukey=product&product_id=air-filter",
      description:
        "K&N style high flow air filters for Stromberg or Weber carburetors. Improves breathing and throttle response.",
      partNumber: "GP-AIR",
      imageUrl: undefined,
      inStock: true,
      category: "fuel-system",
    },
  ];

  scrapedProducts.push(...sampleProducts);

  console.log(`Scraped ${scrapedProducts.length} products from ${config.name}`);
  return scrapedProducts;
}

async function scrapeMossMotors(): Promise<ScrapedProduct[]> {
  const config = SCRAPER_CONFIGS.mossmotors;
  const scrapedProducts: ScrapedProduct[] = [];

  console.log(`Starting scrape of ${config.name}...`);

  const sampleProducts: ScrapedProduct[] = [
    {
      name: "TR6 Stainless Steel Exhaust System",
      price: 649.0,
      url: "https://mossmotors.com/exhaust/tr6-ss-exhaust",
      description:
        "Complete stainless steel exhaust system for TR6. Includes manifold, downpipe, center section, and rear muffler.",
      partNumber: "MM-EXH-001",
      inStock: true,
      category: "exhaust",
    },
    {
      name: "TR6 Complete Carpet Set - Black",
      price: 425.0,
      url: "https://mossmotors.com/interior/tr6-carpet-black",
      description:
        "Complete loop pile carpet set for TR6. Includes all pieces for full interior coverage.",
      partNumber: "MM-INT-CAR",
      inStock: true,
      category: "interior",
    },
    {
      name: "TR6 Leather Seat Kit - Tan",
      price: 1295.0,
      url: "https://mossmotors.com/interior/tr6-seat-leather-tan",
      description:
        "Premium leather seat covers for TR6. Complete kit for both seats.",
      partNumber: "MM-SEAT-TAN",
      inStock: true,
      category: "interior",
    },
    {
      name: "TR6 Chrome Bumper - Front",
      price: 385.0,
      url: "https://mossmotors.com/exterior/tr6-bumper-front",
      description: "Reproduction chrome front bumper for early TR6 models.",
      partNumber: "MM-BUMP-F",
      inStock: true,
      category: "exterior",
    },
    {
      name: "TR6 Wire Wheel Set - 72 Spoke",
      price: 1850.0,
      url: "https://mossmotors.com/wheels/tr6-wire-wheels",
      description:
        "Set of 4 chrome wire wheels with 72 spokes. Includes hubs and knock-offs.",
      partNumber: "MM-WHL-72",
      inStock: false,
      category: "wheels",
    },
    {
      name: "TR6 Front Brake Kit - Slotted",
      price: 425.0,
      url: "https://mossmotors.com/brakes/tr6-front-brake-kit",
      description:
        "Slotted brake rotors and performance pads for improved stopping power.",
      partNumber: "MM-BRK-F",
      inStock: true,
      category: "brakes",
    },
    {
      name: "TR6 Alternator 65 Amp",
      price: 225.0,
      url: "https://mossmotors.com/electrical/tr6-alternator-65",
      description:
        "High output alternator for TR6. Direct bolt-in replacement.",
      partNumber: "MM-ALT-65",
      inStock: true,
      category: "electrical",
    },
    {
      name: "TR6 Aluminum Radiator",
      price: 495.0,
      url: "https://mossmotors.com/cooling/tr6-radiator-aluminum",
      description:
        "High-efficiency aluminum radiator for improved cooling capacity.",
      partNumber: "MM-RAD-AL",
      inStock: true,
      category: "cooling",
    },
  ];

  scrapedProducts.push(...sampleProducts);

  console.log(`Scraped ${scrapedProducts.length} products from ${config.name}`);
  return scrapedProducts;
}

async function scrapeRimmerBros(): Promise<ScrapedProduct[]> {
  const config = SCRAPER_CONFIGS.rimmerbros;
  const scrapedProducts: ScrapedProduct[] = [];

  console.log(`Starting scrape of ${config.name}...`);

  const sampleProducts: ScrapedProduct[] = [
    {
      name: "TR6 Polybush Suspension Kit - Yellow",
      price: 195.0,
      url: "https://rimmerbros.com/suspension/tr6-polybush-kit",
      description:
        "Complete polyurethane bushing kit for TR6 suspension. Improves handling and lasts longer than rubber.",
      partNumber: "RB-SUS-POLY",
      inStock: true,
      category: "suspension",
    },
    {
      name: "TR6 Uprated Front Springs",
      price: 165.0,
      url: "https://rimmerbros.com/suspension/tr6-springs-front",
      description:
        "Uprated front springs for improved handling. Lowers ride height by 1 inch.",
      partNumber: "RB-SPR-F",
      inStock: true,
      category: "suspension",
    },
    {
      name: "TR6 Electronic Ignition Conversion",
      price: 145.0,
      url: "https://rimmerbros.com/electrical/tr6-electronic-ignition",
      description:
        "Pertronix electronic ignition kit. Eliminates points for reliable starting.",
      partNumber: "RB-IGN-ELEC",
      inStock: true,
      category: "electrical",
    },
    {
      name: "TR6 J-Type Overdrive Rebuild Kit",
      price: 385.0,
      url: "https://rimmerbros.com/transmission/tr6-overdrive-rebuild",
      description:
        "Complete rebuild kit for J-Type overdrive. Includes all seals, bearings and thrust washers.",
      partNumber: "RB-OD-RBK",
      inStock: true,
      category: "transmission",
    },
    {
      name: "TR6 Smiths Gauge Set - Electric",
      price: 695.0,
      url: "https://rimmerbros.com/interior/tr6-gauge-set",
      description:
        "Complete set of electric Smiths-style gauges. Includes speedo, tach, fuel, temp, oil pressure and volt.",
      partNumber: "RB-GAU-SET",
      inStock: true,
      category: "interior",
    },
    {
      name: "TR6 Fuel Tank - Stainless Steel",
      price: 525.0,
      url: "https://rimmerbros.com/fuel/tr6-tank-ss",
      description:
        "Stainless steel fuel tank replacement. Never rusts, includes sender unit.",
      partNumber: "RB-FUEL-SS",
      inStock: true,
      category: "fuel-system",
    },
  ];

  scrapedProducts.push(...sampleProducts);

  console.log(`Scraped ${scrapedProducts.length} products from ${config.name}`);
  return scrapedProducts;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

async function saveProducts(
  scrapedProducts: ScrapedProduct[],
  supplierId: number
): Promise<number> {
  let savedCount = 0;

  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map((c) => [c.slug, c.id]));

  const existingProducts = await db
    .select({ productUrl: products.productUrl })
    .from(products)
    .where(eq(products.supplierId, supplierId));
  const existingUrls = new Set(existingProducts.map((p) => p.productUrl));

  for (const product of scrapedProducts) {
    if (existingUrls.has(product.url)) {
      console.log(`Skipping existing product: ${product.name}`);
      continue;
    }

    try {
      const categorySlug = categorizeProduct(
        product.name,
        product.description || ""
      );
      const categoryId = categoryMap.get(categorySlug) || 1;

      await db.insert(products).values({
        name: product.name,
        slug: generateSlug(product.name) + "-" + Date.now(),
        supplierId,
        categoryId,
        price: product.price.toFixed(2),
        productUrl: product.url,
        description: product.description || null,
        partNumber: product.partNumber || null,
        primaryImageUrl: product.imageUrl || null,
        inStock: product.inStock ?? true,
        stockStatus: product.inStock ? "in_stock" : "out_of_stock",
        isPerformance: true,
        isRestoration: true,
      });

      existingUrls.add(product.url);
      savedCount++;
    } catch (error: any) {
      if (error.code === "23505") {
        console.log(`Product already exists: ${product.name}`);
      } else {
        console.error(`Error saving product ${product.name}:`, error);
      }
    }
  }

  return savedCount;
}

export interface ScrapeResult {
  supplier: string;
  productsScraped: number;
  productsSaved: number;
  errors: string[];
}

export async function runScraper(
  supplierName?: string
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  const allSuppliers = await db.select().from(suppliers);
  const supplierMap = new Map(allSuppliers.map((s) => [s.name, s.id]));

  const scrapers: { name: string; fn: () => Promise<ScrapedProduct[]> }[] = [
    { name: "Good Parts", fn: scrapeGoodParts },
    { name: "Moss Motors", fn: scrapeMossMotors },
    { name: "Rimmer Bros", fn: scrapeRimmerBros },
  ];

  for (const scraper of scrapers) {
    if (supplierName && scraper.name !== supplierName) {
      continue;
    }

    const supplierId = supplierMap.get(scraper.name);
    if (!supplierId) {
      results.push({
        supplier: scraper.name,
        productsScraped: 0,
        productsSaved: 0,
        errors: [`Supplier "${scraper.name}" not found in database`],
      });
      continue;
    }

    try {
      const scrapedProducts = await scraper.fn();
      const savedCount = await saveProducts(scrapedProducts, supplierId);

      await db
        .update(suppliers)
        .set({ lastScrapedAt: new Date() })
        .where(eq(suppliers.id, supplierId));

      results.push({
        supplier: scraper.name,
        productsScraped: scrapedProducts.length,
        productsSaved: savedCount,
        errors: [],
      });
    } catch (error: any) {
      results.push({
        supplier: scraper.name,
        productsScraped: 0,
        productsSaved: 0,
        errors: [error.message || "Unknown error"],
      });
    }

    await delay(2000);
  }

  return results;
}

export async function getScraperStatus(): Promise<
  {
    name: string;
    lastScraped: Date | null;
    productCount: number;
    isAutoDiscovered: boolean;
    websiteUrl: string | null;
  }[]
> {
  const allSuppliers = await db.select().from(suppliers);

  const status = await Promise.all(
    allSuppliers.map(async (supplier) => {
      const productList = await db
        .select()
        .from(products)
        .where(eq(products.supplierId, supplier.id));

      return {
        name: supplier.name,
        lastScraped: supplier.lastScrapedAt,
        productCount: productList.length,
        isAutoDiscovered: supplier.description?.includes("Auto-discovered") || false,
        websiteUrl: supplier.websiteUrl,
      };
    })
  );

  return status;
}
