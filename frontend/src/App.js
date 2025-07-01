import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [productUrl, setProductUrl] = useState("");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    fetchProducts();
  }, [pagination.page]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5000/api/products", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });

      // Ensure data is always an array
      const productsData = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setProducts(productsData);
      setPagination({
        page: response.data?.page || 1,
        limit: response.data?.limit || 10,
        total: response.data?.total || 0,
        pages: response.data?.pages || 1,
      });
    } catch (error) {
      setError("Failed to fetch products. Please try again later.");
      console.error("Failed to fetch products", error);
      setProducts([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetails = async () => {
    if (!productUrl) {
      setError("Please enter a valid Flipkart URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Fetch product details
      const detailsResponse = await axios.post(
        "/api/products/fetch-details",
        { url: productUrl },
        { timeout: 10000 } // 10 second timeout
      );
       console.log("Details response:", detailsResponse.data);

      if (!detailsResponse.data.success) {
        throw new Error(
          detailsResponse.data.message || "Failed to fetch details"
        );
      }

      // Step 2: Add to database
      const addResponse = await axios.post(
        "/api/products/add",
        {
          ...detailsResponse.data.data,
          url: productUrl,
        },
        { timeout: 10000 }
      );
      console.log("Add response:", addResponse.data);

      if (!addResponse.data.success) {
        throw new Error(addResponse.data.message || "Failed to add product");
      }

      // Update state only if both steps succeeded
      setProducts((prev) => [addResponse.data.data, ...prev]);
      setProductUrl("");
    } catch (error) {
      let errorMessage = "Failed to add product";

      if (error.response) {
        // The request was made and the server responded with a status code
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please try again.";
      } else {
        // Something happened in setting up the request
        errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);
      console.error("Product tracking error:", error);
    } finally {
      setLoading(false);
    }
  };

  const recheckPrice = async (productId) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/products/recheck/${productId}`,
        { newPrice: null } // Let backend handle the scraping
      );
      setProducts(
        products.map((product) =>
          product._id === productId ? response.data.data : product
        )
      );
    } catch (error) {
      setError("Failed to refresh price. Please try again later.");
      console.error("Failed to recheck price", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter(
        (product) =>
          product?.title?.toLowerCase().includes(search.toLowerCase()) &&
          product?.currentPrice >= (priceRange.min || 0) &&
          product?.currentPrice <= (priceRange.max || Infinity)
      )
    : [];

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  return (
    <div className="min-h-screen bg-neutral-500 py-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-800">
          Flipkart Price Tracker
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            Loading...
          </div>
        )}

        {/* Add Product */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="Enter Flipkart product URL (e.g., https://www.flipkart.com/...)"
          />
          <button
            onClick={fetchProductDetails}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {loading ? "Processing..." : "Track Product"}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search products..."
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Min Price (₹)
              </label>
              <input
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                onChange={(e) =>
                  setPriceRange({ ...priceRange, min: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Max Price (₹)
              </label>
              <input
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10000"
                onChange={(e) =>
                  setPriceRange({ ...priceRange, max: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white"
                >
                  <div className="p-4">
                    <h2 className="font-bold text-lg mb-2 line-clamp-2 text-gray-800">
                      {product.title}
                    </h2>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-blue-600">
                        ₹{product.currentPrice.toLocaleString()}
                      </span>
                      <button
                        onClick={() => recheckPrice(product._id)}
                        disabled={loading}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:bg-green-400"
                      >
                        {loading ? "Refreshing..." : "Refresh"}
                      </button>
                    </div>

                    <div className="flex justify-between text-sm text-gray-500 mb-3">
                      <span>⭐ {product.reviews || "No reviews"}</span>
                      <span>🛒 {product.totalPurchases || "N/A"}</span>
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <h3 className="font-medium mb-2 text-gray-700">
                        Price History
                      </h3>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {product.priceHistory.map((price, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 px-2 py-1 rounded text-sm whitespace-nowrap"
                          >
                            ₹{price.toLocaleString()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-center">
              <nav className="inline-flex rounded-md shadow">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={pageNum === pagination.page}
                      className={`px-4 py-2 border ${
                        pageNum === pagination.page
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}
              </nav>
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            {loading
              ? "Loading products..."
              : "No products found. Add a product URL to get started."}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
