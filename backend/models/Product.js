const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: String,
    description: String,
    url: String,
    currentPrice: Number,
    priceHistory: [Number],
    reviews: String,
    totalPurchases: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
