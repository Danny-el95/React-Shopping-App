import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../Components/ProductCard';
import { fetchProducts } from '../api/server';

const Home = () => {
    // Store the products returned by the backend.
    const [products, setProducts] = useState([]);
    // Track whether the product request is still running.
    const [loading, setLoading] = useState(true);
    // Store a message to display if the request fails.
    const [error, setError] = useState(null);

    // Fetch products when the Home page mounts.
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
        <div className="page home-page">
            <header className='home-hero'>
                <p className='home-eyebrow'>D&apos;s NutShop</p>
                <h1 className='home-title'>
                    A little crunch.<br />
                    <span>A moment to enjoy.</span>
                </h1>
                <p className='home-subtitle'>From cashews to pistachios, discover your favorite nuts for everyday snacking, sharing, and everything in between.</p>
            </header>

            <div className='container'>
                <h2 className='home-products-title'>Explore our selection</h2>
                {loading ? (
                    <p role="status">Loading products...</p>
                ) : error ? (
                    <p role="alert">{error}</p>
                ) : products.length === 0 ? (
                    <p>No products are available.</p>
                ) : (
                    <div className='product-grid'>
                        {products.slice(0, 3).map((product) => (
                            <ProductCard product={product} key={product.id} />
                        ))}
                    </div>
                )}
                <Link className="home-view-products" to="/product" reloadDocument>View all products <span aria-hidden="true">&#8594;</span></Link>
            </div>
        </div>
    );
};

export default Home;
