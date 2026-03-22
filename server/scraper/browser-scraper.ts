import { chromium, Browser, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { db } from "../db";
import { products, categories, suppliers } from "@shared/schema";
import { eq } from "drizzle-orm";

function getChromiumPath(): string {
  if (process.env.CHROMIUM_PATH) {
    return process.env.CHROMIUM_PATH;
  }
  const possiblePaths = [
    "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  throw new Error("Chromium not found. Set CHROMIUM_PATH environment variable.");
}
const IMAGES_DIR = path.join(process.cwd(), "public/images/products");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

export interface ScrapedProduct {
  name: string;
  price: number;
  url: string;
  description?: string;
  partNumber?: string;
  imageUrl?: string;
  localImagePath?: string;
  inStock?: boolean;
  category?: string;
}

export interface ScrapeProgress {
  supplier: string;
  status: "idle" | "running" | "completed" | "error";
  currentPage: number;
  totalProducts: number;
  savedProducts: number;
  currentProduct?: string;
  error?: string;
}

let scrapeProgress: ScrapeProgress = {
  supplier: "",
  status: "idle",
  currentPage: 0,
  totalProducts: 0,
  savedProducts: 0,
};

export function getScrapeProgress(): ScrapeProgress {
  return { ...scrapeProgress };
}

async function downloadImage(imageUrl: string, filename: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const filePath = path.join(IMAGES_DIR, filename);
      const file = fs.createWriteStream(filePath);
      
      const protocol = imageUrl.startsWith("https") ? https : http;
      
      protocol.get(imageUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            downloadImage(redirectUrl, filename).then(resolve);
            return;
          }
        }
        
        if (response.statusCode !== 200) {
          console.log(`Failed to download image: ${imageUrl} (status: ${response.statusCode})`);
          resolve(null);
          return;
        }
        
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(`/images/products/${filename}`);
        });
      }).on("error", (err) => {
        console.log(`Error downloading image: ${err.message}`);
        fs.unlink(filePath, () => {});
        resolve(null);
      });
    } catch (error) {
      console.log(`Exception downloading image: ${error}`);
      resolve(null);
    }
  });
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

function categorizeProduct(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  
  if (text.includes("engine") || text.includes("cylinder") || text.includes("piston") || 
      text.includes("cam") || text.includes("rocker") || text.includes("valve")) {
    return "engine";
  }
  if (text.includes("suspension") || text.includes("spring") || text.includes("shock") || 
      text.includes("bush") || text.includes("arm")) {
    return "suspension";
  }
  if (text.includes("brake") || text.includes("caliper") || text.includes("pad") || 
      text.includes("rotor") || text.includes("disc") || text.includes("booster") || 
      text.includes("servo") || text.includes("master cylinder")) {
    return "brakes";
  }
  if (text.includes("exhaust") || text.includes("manifold") || text.includes("muffler") || 
      text.includes("pipe") || text.includes("header")) {
    return "exhaust";
  }
  if (text.includes("electric") || text.includes("wire") || text.includes("switch") || 
      text.includes("relay") || text.includes("gauge") || text.includes("light")) {
    return "electrical";
  }
  if (text.includes("carburetor") || text.includes("fuel") || text.includes("pump") || 
      text.includes("filter") || text.includes("throttle") || text.includes("injection")) {
    return "fuel-system";
  }
  if (text.includes("transmission") || text.includes("gear") || text.includes("clutch") || 
      text.includes("diff") || text.includes("axle")) {
    return "transmission";
  }
  if (text.includes("cooling") || text.includes("radiator") || text.includes("fan") || 
      text.includes("thermostat") || text.includes("water")) {
    return "cooling";
  }
  if (text.includes("wheel") || text.includes("tire") || text.includes("hub") || 
      text.includes("bearing")) {
    return "wheels";
  }
  if (text.includes("body") || text.includes("panel") || text.includes("fender") || 
      text.includes("door") || text.includes("hood") || text.includes("bumper")) {
    return "exterior";
  }
  if (text.includes("interior") || text.includes("seat") || text.includes("carpet") || 
      text.includes("dash") || text.includes("trim")) {
    return "interior";
  }
  
  return "engine";
}

async function scrapeGoodParts(browser: Browser): Promise<ScrapedProduct[]> {
  const page = await browser.newPage();
  const scrapedProducts: ScrapedProduct[] = [];
  
  const categoryUrls = [
    { url: "https://www.goodparts.com/product-category/engine/roller-rockers/", category: "engine" },
    { url: "https://www.goodparts.com/product-category/engine/camshafts-tappets-and-timing-sets/", category: "engine" },
    { url: "https://www.goodparts.com/product-category/engine/valve-train/", category: "engine" },
    { url: "https://www.goodparts.com/product-category/engine/carburetors-accessories-and-throttle-parts/", category: "fuel-system" },
    { url: "https://www.goodparts.com/product-category/suspension/", category: "suspension" },
    { url: "https://www.goodparts.com/product-category/brakes/", category: "brakes" },
    { url: "https://www.goodparts.com/product-category/exhaust/", category: "exhaust" },
    { url: "https://www.goodparts.com/product-category/drive-train/", category: "transmission" },
  ];
  
  try {
    scrapeProgress.supplier = "Good Parts";
    scrapeProgress.status = "running";
    
    const allProductLinks: { url: string; category: string }[] = [];
    
    for (let catIdx = 0; catIdx < categoryUrls.length; catIdx++) {
      const cat = categoryUrls[catIdx];
      scrapeProgress.currentPage = catIdx + 1;
      scrapeProgress.currentProduct = `Scanning category: ${cat.category}`;
      
      console.log(`Scanning Good Parts category: ${cat.url}`);
      
      try {
        await page.goto(cat.url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(1500);
        
        const links = await page.$$eval("a[href*='/product/']", (anchors) =>
          anchors
            .map((a) => (a as HTMLAnchorElement).href)
            .filter((href) => href.includes("/product/") && !href.includes("/product-category/"))
        );
        
        const uniqueLinks = Array.from(new Set(links));
        console.log(`Found ${uniqueLinks.length} products in ${cat.category}`);
        
        for (const link of uniqueLinks.slice(0, 10)) {
          allProductLinks.push({ url: link, category: cat.category });
        }
      } catch (error) {
        console.log(`Error scanning category ${cat.url}:`, error);
      }
    }
    
    console.log(`Total product links to scrape: ${allProductLinks.length}`);
    
    for (let i = 0; i < allProductLinks.length; i++) {
      const { url: link, category } = allProductLinks[i];
      scrapeProgress.currentProduct = `Product ${i + 1} of ${allProductLinks.length}`;
      
      try {
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(1000);
        
        const name = await page.$eval("h1.product_title, h1", (el) => el.textContent?.trim() || "").catch(() => "");
        if (!name || name.includes("Search") || name.includes("Cart")) continue;
        
        const priceText = await page.$eval(".woocommerce-Price-amount, .price ins .amount, .price .amount", 
          (el) => el.textContent || "").catch(() => "0");
        const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
        
        const description = await page.$eval(".woocommerce-product-details__short-description, #tab-description, .product-description", 
          (el) => el.textContent?.trim() || "").catch(() => "");
        
        const sku = await page.$eval(".sku, .sku_wrapper .sku", (el) => el.textContent?.trim() || "").catch(() => "");
        
        // Try multiple selectors for product images, prioritizing actual product images over logos
        let imageUrl = "";
        const imageSelectors = [
          ".woocommerce-product-gallery__image img[src*='uploads']",
          ".woocommerce-product-gallery img[data-large_image]",
          ".woocommerce-product-gallery__image img",
          "figure.woocommerce-product-gallery__wrapper img",
          ".product-images img",
          ".wp-post-image[src*='uploads']",
          ".wp-post-image",
        ];
        
        for (const selector of imageSelectors) {
          try {
            imageUrl = await page.$eval(selector, (el) => {
              const img = el as HTMLImageElement;
              // Try to get the largest available image
              return img.dataset.largeSrc || img.dataset.large_image || img.dataset.src || img.src || "";
            });
            // Skip if it's a placeholder, logo, or very small image
            if (imageUrl && 
                imageUrl.startsWith("http") && 
                !imageUrl.includes("logo") && 
                !imageUrl.includes("placeholder") &&
                !imageUrl.includes("woocommerce-placeholder") &&
                imageUrl.includes("uploads")) {
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        let localImagePath: string | undefined;
        if (imageUrl && imageUrl.startsWith("http") && !imageUrl.includes("logo")) {
          try {
            const ext = path.extname(new URL(imageUrl).pathname) || ".jpg";
            const filename = `goodparts-${generateSlug(name)}-${Date.now()}${ext}`;
            const downloaded = await downloadImage(imageUrl, filename);
            if (downloaded) {
              localImagePath = downloaded;
            }
          } catch (imgError) {
            console.log(`Failed to download image for ${name}`);
          }
        }
        
        scrapedProducts.push({
          name,
          price,
          url: link,
          description: description.substring(0, 500),
          partNumber: sku,
          imageUrl,
          localImagePath,
          inStock: true,
          category,
        });
        
        scrapeProgress.totalProducts = scrapedProducts.length;
        console.log(`Scraped: ${name} - $${price} (${localImagePath ? 'with image' : 'no image'})`);
        
      } catch (error) {
        console.log(`Error scraping product at ${link}:`, error);
      }
    }
    
  } catch (error) {
    console.error("Error scraping Good Parts:", error);
    scrapeProgress.error = String(error);
  } finally {
    await page.close();
  }
  
  return scrapedProducts;
}

async function scrapeMossMotors(browser: Browser): Promise<ScrapedProduct[]> {
  const page = await browser.newPage();
  const scrapedProducts: ScrapedProduct[] = [];
  
  try {
    scrapeProgress.supplier = "Moss Motors";
    scrapeProgress.status = "running";
    scrapeProgress.currentPage = 1;
    
    console.log("Navigating to Moss Motors TR6 section...");
    await page.goto("https://www.mossmotors.com/triumph/tr250-tr6", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    
    await page.waitForTimeout(2000);
    
    const productElements = await page.$$(".product-item, .product-card, [class*='product-list'] a");
    console.log(`Found ${productElements.length} product elements`);
    
    for (let i = 0; i < Math.min(productElements.length, 20); i++) {
      scrapeProgress.currentProduct = `Product ${i + 1}`;
      
      try {
        const productData = await page.$$eval(".product-item, .product-card", (items, index) => {
          const item = items[index];
          if (!item) return null;
          
          const nameEl = item.querySelector(".product-name, .title, h3, h4");
          const priceEl = item.querySelector(".price, .product-price");
          const linkEl = item.querySelector("a");
          const imgEl = item.querySelector("img");
          const skuEl = item.querySelector(".sku, .part-number");
          
          return {
            name: nameEl?.textContent?.trim() || "",
            price: priceEl?.textContent?.trim() || "0",
            url: (linkEl as HTMLAnchorElement)?.href || "",
            imageUrl: (imgEl as HTMLImageElement)?.src || "",
            partNumber: skuEl?.textContent?.trim() || "",
          };
        }, i);
        
        if (!productData || !productData.name) continue;
        
        const price = parseFloat(productData.price.replace(/[^0-9.]/g, "")) || 0;
        
        let localImagePath: string | undefined;
        if (productData.imageUrl && productData.imageUrl.startsWith("http")) {
          const ext = path.extname(new URL(productData.imageUrl).pathname) || ".jpg";
          const filename = `moss-${generateSlug(productData.name)}-${Date.now()}${ext}`;
          const downloaded = await downloadImage(productData.imageUrl, filename);
          if (downloaded) {
            localImagePath = downloaded;
          }
        }
        
        scrapedProducts.push({
          name: productData.name,
          price,
          url: productData.url,
          partNumber: productData.partNumber,
          imageUrl: productData.imageUrl,
          localImagePath,
          inStock: true,
          category: categorizeProduct(productData.name, ""),
        });
        
        scrapeProgress.totalProducts = scrapedProducts.length;
        console.log(`Scraped: ${productData.name} - $${price}`);
        
      } catch (error) {
        console.log(`Error scraping Moss product ${i}:`, error);
      }
    }
    
  } catch (error) {
    console.error("Error scraping Moss Motors:", error);
    scrapeProgress.error = String(error);
  } finally {
    await page.close();
  }
  
  return scrapedProducts;
}

async function scrapeRimmerBros(browser: Browser): Promise<ScrapedProduct[]> {
  const page = await browser.newPage();
  const scrapedProducts: ScrapedProduct[] = [];
  
  try {
    scrapeProgress.supplier = "Rimmer Bros";
    scrapeProgress.status = "running";
    scrapeProgress.currentPage = 1;
    
    console.log("Navigating to Rimmer Bros TR6 section...");
    await page.goto("https://rfrimmerbros.com/t/triumph-tr6", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    
    await page.waitForTimeout(2000);
    
    const productCards = await page.$$(".product-card, .product-item, [class*='product']");
    console.log(`Found ${productCards.length} product cards`);
    
    for (let i = 0; i < Math.min(productCards.length, 20); i++) {
      scrapeProgress.currentProduct = `Product ${i + 1}`;
      
      try {
        const productData = await page.$$eval("[class*='product']", (items, index) => {
          const item = items[index];
          if (!item) return null;
          
          const nameEl = item.querySelector(".product-name, .title, h3, h4, a");
          const priceEl = item.querySelector(".price, .product-price, [class*='price']");
          const linkEl = item.querySelector("a");
          const imgEl = item.querySelector("img");
          
          return {
            name: nameEl?.textContent?.trim() || "",
            price: priceEl?.textContent?.trim() || "0",
            url: (linkEl as HTMLAnchorElement)?.href || "",
            imageUrl: (imgEl as HTMLImageElement)?.src || "",
          };
        }, i);
        
        if (!productData || !productData.name) continue;
        
        const price = parseFloat(productData.price.replace(/[^0-9.]/g, "")) || 0;
        
        let localImagePath: string | undefined;
        if (productData.imageUrl && productData.imageUrl.startsWith("http")) {
          const ext = path.extname(new URL(productData.imageUrl).pathname) || ".jpg";
          const filename = `rimmer-${generateSlug(productData.name)}-${Date.now()}${ext}`;
          const downloaded = await downloadImage(productData.imageUrl, filename);
          if (downloaded) {
            localImagePath = downloaded;
          }
        }
        
        scrapedProducts.push({
          name: productData.name,
          price,
          url: productData.url,
          imageUrl: productData.imageUrl,
          localImagePath,
          inStock: true,
          category: categorizeProduct(productData.name, ""),
        });
        
        scrapeProgress.totalProducts = scrapedProducts.length;
        console.log(`Scraped: ${productData.name} - $${price}`);
        
      } catch (error) {
        console.log(`Error scraping Rimmer product ${i}:`, error);
      }
    }
    
  } catch (error) {
    console.error("Error scraping Rimmer Bros:", error);
    scrapeProgress.error = String(error);
  } finally {
    await page.close();
  }
  
  return scrapedProducts;
}

interface SaveProductsResult {
  savedCount: number;
  savedProductIds: number[];
  allMatchedProductIds: number[];
}

async function saveProducts(scrapedProducts: ScrapedProduct[], supplierId: number): Promise<SaveProductsResult> {
  let savedCount = 0;
  const savedProductIds: number[] = [];
  const allMatchedProductIds: number[] = [];
  
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map((c) => [c.slug, c.id]));
  
  const existingProducts = await db
    .select({ id: products.id, productUrl: products.productUrl })
    .from(products)
    .where(eq(products.supplierId, supplierId));
  const existingUrlToId = new Map(existingProducts.map((p) => [p.productUrl, p.id]));
  
  for (const product of scrapedProducts) {
    const existingId = existingUrlToId.get(product.url);
    if (existingId) {
      console.log(`Skipping existing product: ${product.name}`);
      allMatchedProductIds.push(existingId);
      continue;
    }
    
    try {
      const categorySlug = product.category || categorizeProduct(product.name, product.description || "");
      const categoryId = categoryMap.get(categorySlug) || 1;
      
      const [inserted] = await db.insert(products).values({
        name: product.name,
        slug: generateSlug(product.name) + "-" + Date.now(),
        supplierId,
        categoryId,
        price: product.price.toFixed(2),
        productUrl: product.url,
        description: product.description || null,
        partNumber: product.partNumber || null,
        primaryImageUrl: product.localImagePath || product.imageUrl || null,
        inStock: product.inStock ?? true,
        stockStatus: product.inStock ? "in_stock" : "out_of_stock",
        isPerformance: true,
        isRestoration: true,
      }).returning({ id: products.id });
      
      if (inserted) {
        savedProductIds.push(inserted.id);
        allMatchedProductIds.push(inserted.id);
      }
      
      existingUrlToId.set(product.url, inserted.id);
      savedCount++;
      scrapeProgress.savedProducts = savedCount;
      
    } catch (error: any) {
      if (error.code === "23505") {
        console.log(`Product already exists: ${product.name}`);
      } else {
        console.error(`Error saving product ${product.name}:`, error);
      }
    }
  }
  
  return { savedCount, savedProductIds, allMatchedProductIds };
}

export interface BrowserScrapeResult {
  supplier: string;
  productsScraped: number;
  productsSaved: number;
  imagesDownloaded: number;
  savedProductIds: number[];
  scrapedProductIds: number[];
  errors: string[];
}

interface SiteStrategy {
  name: string;
  productLinkSelectors: string[];
  productLinkPatterns: RegExp[];
  nameSelectors: string[];
  priceSelectors: string[];
  descriptionSelectors: string[];
  skuSelectors: string[];
  imageSelectors: string[];
}

const siteStrategies: Record<string, SiteStrategy> = {
  woocommerce: {
    name: "WooCommerce",
    productLinkSelectors: [
      "a.woocommerce-LoopProduct-link", 
      "a.woocommerce-loop-product__link",
      "li.product > a",
      "ul.products li a:first-of-type",
      ".product-inner a",
      "a[href*='/product/']"
    ],
    productLinkPatterns: [/\/product\/[a-zA-Z0-9-]+\/?$/, /\/shop\/[a-zA-Z0-9-]+\/?$/],
    nameSelectors: ["h1.product_title", ".product_title", "[itemprop='name']", "h1"],
    priceSelectors: [
      ".woocommerce-Price-amount bdi", 
      ".woocommerce-Price-amount", 
      "p.price ins .woocommerce-Price-amount",
      "p.price .woocommerce-Price-amount",
      ".price .amount",
      ".price"
    ],
    descriptionSelectors: [
      ".woocommerce-product-details__short-description", 
      ".product-short-description",
      "#tab-description .woocommerce-Tabs-panel--description",
      "#tab-description",
      "[itemprop='description']"
    ],
    skuSelectors: [".sku", ".sku_wrapper .sku", "[itemprop='sku']", ".product_meta .sku"],
    imageSelectors: [
      ".woocommerce-product-gallery__image img",
      ".woocommerce-product-gallery img",
      "img.wp-post-image",
      ".product-image img",
      "[itemprop='image']"
    ],
  },
  shopify: {
    name: "Shopify",
    productLinkSelectors: ["a[href*='/products/']", ".product-card a", ".product-item a"],
    productLinkPatterns: [/\/products\/[^\/\?]+/],
    nameSelectors: [".product-single__title", ".product__title", "h1.title", "h1"],
    priceSelectors: [".product__price", ".price__regular", "[data-product-price]", ".money", ".price"],
    descriptionSelectors: [".product-single__description", ".product__description", ".rte"],
    skuSelectors: [".product-single__sku", "[data-sku]", ".variant-sku"],
    imageSelectors: [".product-single__photo img", ".product__image", ".featured-image img"],
  },
  generic: {
    name: "Generic",
    productLinkSelectors: [
      "a[href*='/product']", "a[href*='/item']", "a[href*='/p/']",
      ".product a", ".item a", ".product-link", "[data-product-link]",
      "a[href*='product']", "a[href*='item']", ".catalog-item a"
    ],
    productLinkPatterns: [/\/(product|item|p)\/[^\/]+/, /[?&]product/, /[?&]item/],
    nameSelectors: ["h1.product-title", "h1.product-name", ".product-title", ".product-name", "[itemprop='name']", "h1"],
    priceSelectors: [
      ".product-price", ".price", "[itemprop='price']", ".current-price",
      ".sale-price", ".regular-price", "[data-price]", ".amount"
    ],
    descriptionSelectors: [
      ".product-description", ".description", "[itemprop='description']",
      ".product-details", ".product-info", "#description"
    ],
    skuSelectors: [".sku", ".product-sku", "[itemprop='sku']", ".part-number", ".item-number"],
    imageSelectors: [
      ".product-image img", ".product-gallery img", "[itemprop='image']",
      ".main-image img", ".product-photo img", ".gallery img:first-of-type"
    ],
  },
  englishparts: {
    name: "English Parts",
    productLinkSelectors: ["a[href*='part-detail']", ".part-link", ".product-tile a"],
    productLinkPatterns: [/part-detail/, /\/parts\//],
    nameSelectors: [".part-title", ".product-name", "h1", ".item-title"],
    priceSelectors: [".part-price", ".price", ".item-price", "[data-price]"],
    descriptionSelectors: [".part-description", ".product-description", ".item-details"],
    skuSelectors: [".part-number", ".sku", ".item-number"],
    imageSelectors: [".part-image img", ".product-image img", ".item-image img"],
  },
};

async function detectSiteType(page: Page): Promise<string> {
  const pageContent = await page.content().catch(() => "");
  const pageUrl = page.url().toLowerCase();
  
  const hasWooCommerce = await page.$('body.woocommerce, .woocommerce-product-gallery, link[href*="woocommerce"]').catch(() => null);
  if (hasWooCommerce || pageContent.includes("woocommerce") || pageContent.includes("WooCommerce")) {
    return "woocommerce";
  }
  
  const hasShopify = await page.$('script[src*="shopify"], meta[name="shopify-digital-wallet"]').catch(() => null);
  if (hasShopify || pageContent.includes('"Shopify"') || pageContent.includes("cdn.shopify.com")) {
    return "shopify";
  }
  
  if (pageUrl.includes("englishparts.com") || pageContent.includes("englishparts.com")) {
    return "englishparts";
  }
  
  const hasJsonLd = await page.$('script[type="application/ld+json"]').catch(() => null);
  if (hasJsonLd) {
    const jsonLdContent = await page.$eval('script[type="application/ld+json"]', (el) => el.textContent || "").catch(() => "");
    if (jsonLdContent.includes('"@type":"Product"') || jsonLdContent.includes('"@type": "Product"')) {
      return "generic";
    }
  }
  
  return "generic";
}

async function extractJsonLdProducts(page: Page): Promise<Array<{name: string; price: number; url: string; description?: string; imageUrl?: string; sku?: string}>> {
  const products: Array<{name: string; price: number; url: string; description?: string; imageUrl?: string; sku?: string}> = [];
  
  try {
    const jsonLdScripts = await page.$$eval('script[type="application/ld+json"]', (scripts) =>
      scripts.map((s) => s.textContent || "")
    );
    
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script);
        const items = Array.isArray(data) ? data : [data];
        
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"] === "ItemPage") {
            const product = item["@type"] === "ItemPage" ? item.mainEntity : item;
            if (product && product.name) {
              let price = 0;
              if (product.offers) {
                const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
                price = parseFloat(offers.price || offers.lowPrice || "0");
              }
              
              products.push({
                name: product.name,
                price,
                url: product.url || page.url(),
                description: product.description,
                imageUrl: Array.isArray(product.image) ? product.image[0] : product.image,
                sku: product.sku,
              });
            }
          }
          
          if (item["@graph"]) {
            for (const graphItem of item["@graph"]) {
              if (graphItem["@type"] === "Product") {
                let price = 0;
                if (graphItem.offers) {
                  const offers = Array.isArray(graphItem.offers) ? graphItem.offers[0] : graphItem.offers;
                  price = parseFloat(offers.price || offers.lowPrice || "0");
                }
                
                products.push({
                  name: graphItem.name,
                  price,
                  url: graphItem.url || page.url(),
                  description: graphItem.description,
                  imageUrl: Array.isArray(graphItem.image) ? graphItem.image[0] : graphItem.image,
                  sku: graphItem.sku,
                });
              }
            }
          }
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    console.log("JSON-LD extraction error:", error);
  }
  
  return products;
}

async function findProductLinks(page: Page, strategy: SiteStrategy): Promise<string[]> {
  let allLinks: string[] = [];
  
  for (const selector of strategy.productLinkSelectors) {
    try {
      const links = await page.$$eval(selector, (anchors) =>
        anchors.map((a) => (a as HTMLAnchorElement).href).filter((href) => href && href.startsWith("http"))
      );
      allLinks = [...allLinks, ...links];
    } catch {
      continue;
    }
  }
  
  try {
    const wooProductLinks = await page.$$eval('li.product a.woocommerce-LoopProduct-link, ul.products li a', (anchors) =>
      anchors.map((a) => (a as HTMLAnchorElement).href).filter((href) => href && href.startsWith("http"))
    );
    allLinks = [...allLinks, ...wooProductLinks];
  } catch {
    // WooCommerce specific selector failed
  }
  
  const uniqueLinks = Array.from(new Set(allLinks));
  
  const filteredLinks = uniqueLinks.filter((link) => {
    const lowerLink = link.toLowerCase();
    const isCart = lowerLink.includes("/cart") || lowerLink.includes("/checkout") || lowerLink.includes("/account");
    const isCategory = lowerLink.includes("/category/") || lowerLink.includes("/product-category/") || lowerLink.includes("/shop/page/");
    const isLogin = lowerLink.includes("/login") || lowerLink.includes("/register") || lowerLink.includes("/my-account");
    const isUtility = lowerLink.includes("sitemap") || lowerLink.includes("privacy") || lowerLink.includes("terms") || 
                      lowerLink.includes("contact") || lowerLink.includes("about") || lowerLink.includes("faq") ||
                      lowerLink.includes("shipping") || lowerLink.includes("returns") || lowerLink.includes("wishlist");
    const matchesPattern = strategy.productLinkPatterns.some((pattern) => pattern.test(link));
    
    const hasProductSlug = /\/product\/[a-zA-Z0-9-]+\/?$/.test(link);
    const hasProductsSlug = /\/products\/[a-zA-Z0-9-]+\/?$/.test(link);
    
    return !isCart && !isCategory && !isLogin && !isUtility && (matchesPattern || hasProductSlug || hasProductsSlug || link.includes("/item/"));
  });
  
  return filteredLinks;
}

async function scrapeProductPage(page: Page, strategy: SiteStrategy, link: string): Promise<ScrapedProduct | null> {
  try {
    await page.goto(link, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(1500);
    
    const pageContent = await page.content();
    if (pageContent.includes("captcha") || pageContent.includes("CAPTCHA") || pageContent.includes("verify")) {
      console.log(`CAPTCHA detected on ${link}, skipping...`);
      return null;
    }
    
    const jsonLdProducts = await extractJsonLdProducts(page);
    if (jsonLdProducts.length > 0) {
      const jsonLdProduct = jsonLdProducts[0];
      console.log(`Found JSON-LD product: ${jsonLdProduct.name}`);
      
      let localImagePath: string | undefined;
      if (jsonLdProduct.imageUrl && jsonLdProduct.imageUrl.startsWith("http")) {
        try {
          const ext = path.extname(new URL(jsonLdProduct.imageUrl).pathname) || ".jpg";
          const filename = `custom-${generateSlug(jsonLdProduct.name)}-${Date.now()}${ext}`;
          const downloaded = await downloadImage(jsonLdProduct.imageUrl, filename);
          if (downloaded) {
            localImagePath = downloaded;
          }
        } catch {
          console.log(`Failed to download image for ${jsonLdProduct.name}`);
        }
      }
      
      return {
        name: jsonLdProduct.name,
        price: jsonLdProduct.price,
        url: link,
        description: jsonLdProduct.description,
        partNumber: jsonLdProduct.sku,
        imageUrl: jsonLdProduct.imageUrl,
        localImagePath,
        inStock: true,
      };
    }
    
    let name = "";
    for (const selector of strategy.nameSelectors) {
      try {
        name = await page.$eval(selector, (el) => el.textContent?.trim() || "");
        if (name && name.length > 2) break;
      } catch {
        continue;
      }
    }
    
    const invalidNames = ["Search", "Cart", "Login", "Sitemap", "Privacy", "Terms", "Contact", "About", "FAQ", "404", "Not Found", "Page not found", "Error"];
    if (!name || name.length < 3 || invalidNames.some((inv) => name.includes(inv))) {
      return null;
    }
    
    let priceText = "0";
    for (const selector of strategy.priceSelectors) {
      try {
        priceText = await page.$eval(selector, (el) => el.textContent || "0");
        if (priceText && priceText.match(/[\d.]/)) break;
      } catch {
        continue;
      }
    }
    const priceMatches = priceText.match(/[\d,]+\.?\d*/g);
    const price = priceMatches ? parseFloat(priceMatches[0].replace(/,/g, "")) : 0;
    
    let description = "";
    for (const selector of strategy.descriptionSelectors) {
      try {
        description = await page.$eval(selector, (el) => el.textContent?.trim() || "");
        if (description) break;
      } catch {
        continue;
      }
    }
    
    let sku = "";
    for (const selector of strategy.skuSelectors) {
      try {
        sku = await page.$eval(selector, (el) => el.textContent?.trim() || "");
        if (sku) break;
      } catch {
        continue;
      }
    }
    
    let imageUrl = "";
    for (const selector of strategy.imageSelectors) {
      try {
        imageUrl = await page.$eval(selector, (el) => {
          const img = el as HTMLImageElement;
          return img.src || img.dataset.src || img.dataset.lazySrc || "";
        });
        if (imageUrl && imageUrl.startsWith("http")) break;
      } catch {
        continue;
      }
    }
    
    let localImagePath: string | undefined;
    if (imageUrl && imageUrl.startsWith("http")) {
      try {
        const ext = path.extname(new URL(imageUrl).pathname) || ".jpg";
        const filename = `custom-${generateSlug(name)}-${Date.now()}${ext}`;
        const downloaded = await downloadImage(imageUrl, filename);
        if (downloaded) {
          localImagePath = downloaded;
        }
      } catch {
        console.log(`Failed to download image for ${name}`);
      }
    }
    
    return {
      name,
      price,
      url: link,
      description: description.substring(0, 500),
      partNumber: sku,
      imageUrl,
      localImagePath,
      inStock: true,
      category: categorizeProduct(name, description),
    };
  } catch (error) {
    console.log(`Error scraping ${link}:`, error);
    return null;
  }
}

async function getOrCreateSupplier(url: string): Promise<{ id: number; name: string; isNew: boolean }> {
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname.replace("www.", "").toLowerCase();
  const domainParts = domain.split(".");
  const supplierName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
  
  const allSuppliers = await db.select().from(suppliers);
  const existingSupplier = allSuppliers.find((s) => {
    if (!s.websiteUrl) return false;
    try {
      const existingDomain = new URL(s.websiteUrl).hostname.replace("www.", "").toLowerCase();
      return existingDomain === domain;
    } catch {
      return false;
    }
  });
  
  if (existingSupplier) {
    return { id: existingSupplier.id, name: existingSupplier.name, isNew: false };
  }
  
  const existingByName = allSuppliers.find((s) => s.name.toLowerCase() === supplierName.toLowerCase());
  if (existingByName) {
    return { id: existingByName.id, name: existingByName.name, isNew: false };
  }
  
  const [newSupplier] = await db.insert(suppliers).values({
    name: supplierName,
    websiteUrl: `https://${domain}`,
    description: `Auto-discovered supplier from ${domain}`,
    lastScrapedAt: new Date(),
    isActive: true,
  }).returning();
  
  console.log(`Created new supplier: ${supplierName} (ID: ${newSupplier.id})`);
  return { id: newSupplier.id, name: supplierName, isNew: true };
}

async function scrapeCustomUrl(browser: Browser, url: string): Promise<{ products: ScrapedProduct[]; supplierInfo: { id: number; name: string; isNew: boolean } }> {
  const page = await browser.newPage();
  const scrapedProducts: ScrapedProduct[] = [];
  
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname;
  
  scrapeProgress.supplier = domain;
  scrapeProgress.status = "running";
  scrapeProgress.currentPage = 1;
  
  console.log(`Navigating to custom URL: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const pageContent = await page.content();
    if (pageContent.includes("captcha") || pageContent.includes("CAPTCHA") || pageContent.includes("verify")) {
      throw new Error(`CAPTCHA detected on ${domain}. This site has bot protection enabled.`);
    }
    
    const siteType = await detectSiteType(page);
    console.log(`Detected site type: ${siteType}`);
    
    const strategy = siteStrategies[siteType];
    scrapeProgress.currentProduct = `Detected: ${strategy.name} site`;
    
    let productLinks = await findProductLinks(page, strategy);
    
    if (productLinks.length === 0 && siteType !== "generic") {
      console.log("No products found with specific strategy, trying generic...");
      productLinks = await findProductLinks(page, siteStrategies.generic);
    }
    
    if (productLinks.length === 0) {
      const allLinks = await page.$$eval("a", (anchors) => 
        anchors.map((a) => (a as HTMLAnchorElement).href).filter((href) => href && href.startsWith("http"))
      );
      productLinks = allLinks.filter((link) => 
        !link.includes("/cart") && !link.includes("/checkout") && 
        !link.includes("/account") && !link.includes("/login") &&
        (link.includes("product") || link.includes("item") || link.includes("part") || link.includes("/p/"))
      );
    }
    
    const uniqueLinks = Array.from(new Set(productLinks));
    console.log(`Found ${uniqueLinks.length} potential product links`);
    scrapeProgress.currentProduct = `Found ${uniqueLinks.length} products`;
    
    const maxProducts = Math.min(uniqueLinks.length, 30);
    
    for (let i = 0; i < maxProducts; i++) {
      const link = uniqueLinks[i];
      scrapeProgress.currentProduct = `Product ${i + 1} of ${maxProducts}`;
      
      const product = await scrapeProductPage(page, strategy, link);
      
      if (product) {
        scrapedProducts.push(product);
        scrapeProgress.totalProducts = scrapedProducts.length;
        console.log(`Scraped: ${product.name} - $${product.price} (${product.localImagePath ? 'with image' : 'no image'})`);
      }
    }
    
    const supplierInfo = await getOrCreateSupplier(url);
    
    return { products: scrapedProducts, supplierInfo };
    
  } catch (error) {
    console.error("Error scraping custom URL:", error);
    scrapeProgress.error = String(error);
    throw error;
  } finally {
    await page.close();
  }
}

export async function runBrowserScraper(supplierName?: string, customUrl?: string): Promise<BrowserScrapeResult[]> {
  const results: BrowserScrapeResult[] = [];
  
  console.log("Launching browser...");
  const chromiumPath = getChromiumPath();
  console.log(`Using Chromium at: ${chromiumPath}`);
  
  const browser = await chromium.launch({
    executablePath: chromiumPath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  
  try {
    const allSuppliers = await db.select().from(suppliers);
    const supplierMap = new Map(allSuppliers.map((s) => [s.name, s.id]));
    
    if (customUrl) {
      console.log(`Scraping custom URL: ${customUrl}`);
      scrapeProgress = {
        supplier: "Custom URL",
        status: "running",
        currentPage: 0,
        totalProducts: 0,
        savedProducts: 0,
      };
      
      try {
        const { products: scrapedProducts, supplierInfo } = await scrapeCustomUrl(browser, customUrl);
        const imagesDownloaded = scrapedProducts.filter((p) => p.localImagePath).length;
        
        const { savedCount, savedProductIds, allMatchedProductIds } = await saveProducts(scrapedProducts, supplierInfo.id);
        
        await db
          .update(suppliers)
          .set({ lastScrapedAt: new Date() })
          .where(eq(suppliers.id, supplierInfo.id));
        
        scrapeProgress.status = "completed";
        
        const supplierLabel = supplierInfo.isNew 
          ? `${supplierInfo.name} (New Supplier)` 
          : supplierInfo.name;
        
        results.push({
          supplier: supplierLabel,
          productsScraped: scrapedProducts.length,
          productsSaved: savedCount,
          imagesDownloaded,
          savedProductIds,
          scrapedProductIds: allMatchedProductIds,
          errors: [],
        });
        
      } catch (error: any) {
        scrapeProgress.status = "error";
        scrapeProgress.error = error.message;
        
        results.push({
          supplier: "Custom URL",
          productsScraped: 0,
          productsSaved: 0,
          imagesDownloaded: 0,
          savedProductIds: [],
          scrapedProductIds: [],
          errors: [error.message],
        });
      }
      
      await browser.close();
      scrapeProgress.status = "idle";
      return results;
    }
    
    const scraperConfigs = [
      { name: "Good Parts", fn: scrapeGoodParts },
      { name: "Moss Motors", fn: scrapeMossMotors },
      { name: "Rimmer Bros", fn: scrapeRimmerBros },
    ];
    
    for (const config of scraperConfigs) {
      if (supplierName && config.name !== supplierName) {
        continue;
      }
      
      const supplierId = supplierMap.get(config.name);
      if (!supplierId) {
        results.push({
          supplier: config.name,
          productsScraped: 0,
          productsSaved: 0,
          imagesDownloaded: 0,
          savedProductIds: [],
          scrapedProductIds: [],
          errors: [`Supplier "${config.name}" not found in database`],
        });
        continue;
      }
      
      console.log(`Starting browser scrape for ${config.name}...`);
      scrapeProgress = {
        supplier: config.name,
        status: "running",
        currentPage: 0,
        totalProducts: 0,
        savedProducts: 0,
      };
      
      try {
        const scrapedProducts = await config.fn(browser);
        const imagesDownloaded = scrapedProducts.filter((p) => p.localImagePath).length;
        
        const { savedCount, savedProductIds, allMatchedProductIds } = await saveProducts(scrapedProducts, supplierId);
        
        await db
          .update(suppliers)
          .set({ lastScrapedAt: new Date() })
          .where(eq(suppliers.id, supplierId));
        
        scrapeProgress.status = "completed";
        
        results.push({
          supplier: config.name,
          productsScraped: scrapedProducts.length,
          productsSaved: savedCount,
          imagesDownloaded,
          savedProductIds,
          scrapedProductIds: allMatchedProductIds,
          errors: [],
        });
        
      } catch (error: any) {
        scrapeProgress.status = "error";
        scrapeProgress.error = error.message;
        
        results.push({
          supplier: config.name,
          productsScraped: 0,
          productsSaved: 0,
          imagesDownloaded: 0,
          savedProductIds: [],
          scrapedProductIds: [],
          errors: [error.message],
        });
      }
    }
    
  } finally {
    await browser.close();
    scrapeProgress.status = "idle";
  }
  
  return results;
}
