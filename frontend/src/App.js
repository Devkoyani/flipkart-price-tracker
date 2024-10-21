import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [productUrl, setProductUrl] = useState('');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const fetchProductDetails = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/products/add', {
        url: productUrl,
      });
      setProducts([...products, response.data]);
      setProductUrl('');
    } catch (error) {
      console.error('Failed to add product', error);
    }
  };

  const recheckPrice = async (productId) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/products/recheck/${productId}`);
      setProducts(products.map(product => product._id === productId ? response.data : product));
    } catch (error) {
      console.error('Failed to recheck price', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(search.toLowerCase()) &&
    product.currentPrice >= priceRange.min && product.currentPrice <= priceRange.max
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Flipkart Product Price Tracker</h1>

      {/* Product URL Input */}
      <div className="mb-4">
        <input
          type="text"
          className="border p-2 w-full"
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
          placeholder="Enter Flipkart product URL"
        />
        <button onClick={fetchProductDetails} className="bg-blue-500 text-white p-2 mt-2">
          Fetch Details
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-4">
        <input
          type="text"
          className="border p-2 w-full"
          placeholder="Search by product title"
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex justify-between mt-2">
          <input
            type="number"
            className="border p-2"
            placeholder="Min Price"
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
          />
          <input
            type="number"
            className="border p-2"
            placeholder="Max Price"
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
          />
        </div>
      </div>

      {/* Display Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div key={product._id} className="border p-4">
            <h2 className="font-bold">{product.title}</h2>
            <p>{product.description}</p>
            <p>Price: ₹{product.currentPrice}</p>
            <p>Reviews: {product.reviews}</p>
            <p>Total Purchases: {product.totalPurchases}</p>
            <button
              className="bg-green-500 text-white p-2 mt-2"
              onClick={() => recheckPrice(product._id)}
            >
              Recheck Price
            </button>

            <div className="mt-4">
              <h3 className="font-semibold">Price History:</h3>
              <ul>
                {product.priceHistory.map((price, index) => (
                  <li key={index}>₹{price}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
