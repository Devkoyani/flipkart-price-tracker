const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const productRoutes = require('./routes/products');

const app = express(); // Initialize app here

app.use(cors());
app.use(bodyParser.json());
app.use('/api/products', productRoutes); // Place routes after initializing app

// MongoDB connection URI
const mongoURI = 'mongodb+srv://devkoyani:@cluster0.akqvs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';


// Connect to MongoDB Atlas
mongoose.connect(mongoURI, {
   
    useNewUrlParser: true,       
    useUnifiedTopology: true,    
   
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch((error) => {
    console.error('MongoDB connection error:', error.message);  // This will log the error message
    console.error('Full error details:', error);  // This will log the full error object
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
