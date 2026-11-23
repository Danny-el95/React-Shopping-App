import { useEffect, useState } from 'react';
import ProductCard from '../Components/ProductCard';
import { fetchProducts } from '../api/server';

const ProductsPage = () => {
    // Store the products returned by the backend.
    const [products, setProducts] = useState([]);
    // Track whether the product request is still running.
    const [loading, setLoading] = useState(true);
    // Store a message to display if the request fails.
    const [error, setError] = useState(null);

    // Fetch products when the Products page mounts.
    useEffect(() => {
        // Ignore the response if this effect has already been cleaned up.
        let cancelled = false;

        // Request products and update the loading, success, or error state.
        async function loadProducts() {
            try {
                const products = await fetchProducts();

                if (!cancelled) {
                    setProducts(products);
                }
            } catch {
                if (!cancelled) {
                    setError('Unable to load items. Please try again.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProducts();

        // Stop this request's result from updating state after cleanup.
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="page products-page">
            <div className='container'>
                <h1 className='page-title'>All Products</h1>
                {loading ? (
                    <p role="status">Loading products...</p>
                ) : error ? (
                    <p role="alert">{error}</p>
                ) : products.length === 0 ? (
                    <p>No products are available.</p>
                ) : (
                    <div className='product-grid'>
                        {products.map((product) => (
                            <ProductCard product={product} key={product.id} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;
