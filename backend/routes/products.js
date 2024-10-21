const express = require('express');
const Product = require('../models/Product');
const puppeteer = require('puppeteer');
const router = express.Router();

// Add a new product
router.post('/add', async (req, res) => {
    const { title, description, url, currentPrice, reviews, totalPurchases } = req.body;

    const product = new Product({
        title,
        description,
        url,
        currentPrice,
        priceHistory: [currentPrice],
        reviews,
        totalPurchases
    });

    try {
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add product', error });
    }
});

// Fetch product details
router.post('/fetch-details', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'Product URL is required' });
    }

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const productDetails = await page.evaluate(() => {
            const title = document.querySelector('span.B_NuCI') ? document.querySelector('span.B_NuCI').innerText : 'Title not found';
            const price = document.querySelector('div._30jeq3') ? document.querySelector('div._30jeq3').innerText : 'Price not found';
            const description = document.querySelector('div.cPHDOP') ? document.querySelector('div.cPHDOP').innerText : 'Description not found';
            const reviews = document.querySelector('span._2_R_DZ') ? document.querySelector('span._2_R_DZ').innerText : 'Reviews not found';

            return {
                title,
                price,
                description,
                reviews
            };
        });

        await browser.close();

        return res.status(200).json(productDetails);
    } catch (error) {
        console.error('Error fetching product details:', error.message);
        return res.status(500).json({ message: 'Failed to fetch product details', error: error.message });
    }
});

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch products', error });
    }
});

// Update product price
router.put('/recheck/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const { newPrice } = req.body;
        product.currentPrice = newPrice;
        product.priceHistory.push(newPrice);

        await product.save();
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update product price', error });
    }
});

module.exports = router;
