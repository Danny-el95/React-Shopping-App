import { useEffect, useState } from 'react';
import ProductCard from '../Components/ProductCard';
import { fetchProducts } from '../api/server';

const ProductsPage = () => {
    // Store the products returned by the backend.
    const [products, setProducts] = useState([]);
    // Track whether the product request is still running.
    const [loading, setLoading] = useState(true);
    // Store what the customer types into the search field
    const [search, setSearch] = useState('');
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

    const searchItem = search.trim().toLowerCase();
    // Return true for names that match; an empty search includes every product.
    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchItem)
    );

    return (
        <div className="page products-page">
            <div className='container'>
                <h1 className='page-title'>All Products</h1>
                <form className="products-search" role="search" onSubmit={(event) => event.preventDefault()}>
                    <label className="products-search-label" htmlFor="product-search">Search by product name</label>
                    <div className="products-search-controls">
                    <div className="products-search-field">
                    <svg className="products-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
                    <input className="products-search-input" type="search"
                        id='product-search'
                        placeholder='Try almonds or cashews'
                        name='search'
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    </div>

                    {search && (
                        <button className="products-search-clear" type='button' onClick={() => { setSearch(''); document.getElementById('product-search')?.focus(); }}>
                            Clear Search
                        </button>
                    )}
                    </div>
                </form>
                {loading ? (
                    <p role="status">Loading products...</p>
                ) : error ? (
                    <p role="alert">{error}</p>
                ) : products.length === 0 ? (
                    <p>No products are available.</p>
                ) : filteredProducts.length === 0 ? (
                    <p role="status">No products match “{search.trim()}”.</p>
                ) : (
                    <div className='product-grid'>
                        {filteredProducts.map((product) => (
                            <ProductCard product={product} key={product.id} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;
