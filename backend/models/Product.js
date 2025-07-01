const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Product title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    url: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.*flipkart\.com.*/.test(v);
            },
            message: props => `${props.value} is not a valid Flipkart URL!`
        }
    },
    currentPrice: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    priceHistory: {
        type: [Number],
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'Price history cannot be empty'
        }
    },
    reviews: String,
    totalPurchases: String,
    createdAt: { 
        type: Date, 
        default: Date.now,
        immutable: true 
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Product', productSchema);