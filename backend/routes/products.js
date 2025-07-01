const express = require("express");
const Product = require("../models/Product");
const puppeteer = require("puppeteer");
const router = express.Router();
const { validateProduct } = require('../middlewares/validateProduct.js');
const { validationResult } = require('express-validator');

// Configure Puppeteer launch options
const puppeteerOptions = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
};

// Add a new product with validation
// In routes/products.js
router.post('/add', validateProduct, async (req, res) => {
    const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  try {
    const { title, description, url, currentPrice, reviews, totalPurchases } = req.body;
    
    // Validate required fields
    if (!title || !url || currentPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, URL and Price are required fields'
      });
    }

    const product = new Product({
      title: title || 'No title available',
      description: description || 'No description available',
      url,
      currentPrice: Number(currentPrice) || 0,
      priceHistory: [Number(currentPrice) || 0],
      reviews: reviews || 'No reviews',
      totalPurchases: totalPurchases || 'N/A'
    });

    await product.save();
    
    res.status(201).json({
      success: true,
      data: product
    });
    
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to database',
      error: error.message
    });
  }
});

// Enhanced fetch product details with better error handling
router.post("/fetch-details", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.includes("flipkart.com")) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid Flipkart product URL",
    });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set realistic headers
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Check if product page loaded correctly
    const isBlocked = await page.evaluate(
      () =>
        document.querySelector("h1")?.textContent.includes("Access Denied") ||
        document.querySelector("body")?.textContent.includes("bot")
    );

    if (isBlocked) {
      throw new Error("Flipkart blocked the request");
    }

    // Extract product details with more robust selectors
    const productDetails = await page.evaluate(() => {
      const extractText = (selector) =>
        document.querySelector(selector)?.innerText?.trim() || "Not available";

      const extractPrice = (selector) => {
        const text = extractText(selector);
        return parseFloat(text.replace(/[^0-9.]/g, "")) || 0;
      };

      return {
        title: extractText("h1 span.B_NuCI") || extractText("h1"),
        currentPrice: extractPrice("div._30jeq3._16Jk6d"),
        description:
          extractText("div._1mXcCf.RmoJUa") || extractText("div._1AN87F"),
        reviews: extractText("span._2_R_DZ"),
        totalPurchases: extractText("div._3UAT2v._16PBlm"),
      };
    });

    if (!productDetails.title || !productDetails.currentPrice) {
      throw new Error("Essential product details not found");
    }

    res.status(200).json({
      success: true,
      data: productDetails,
    });
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
      error: error.message,
    });
  } finally {
    if (browser) await browser.close();
  }
});

// Get all products with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments();

    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// Update product price with better validation
router.put("/recheck/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { newPrice } = req.body;
    if (typeof newPrice !== "number" || newPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price value",
      });
    }

    product.currentPrice = newPrice;
    product.priceHistory.push(newPrice);

    await product.save();

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product price",
      error: error.message,
    });
  }
});

module.exports = router;
