import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchProductsById } from '../api/server';
import { useCart } from '../Context/CartContext'
import { useOrder } from '../Context/OrderContext'
import ProductImage from "../Components/ProductImage";


const ProductDetails = () => {
    // Read the product ID from the page URL.
    const { id } = useParams();
    const navigate = useNavigate();

    // A numeric offset moves back in history; a string navigates to a URL.
    const goBack = () => {
        navigate(-1);
    }

    // A different key creates fresh state whenever the URL's product ID changes.
    return (
        <>
            <div className="product-detail-navigation">
                <button
                    type="button"
                    className="product-detail-back"
                    onClick={goBack}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m12 5-7 7 7 7M5 12h14" />
                    </svg>
                    Back
                </button>
            </div>

            <ProductDetailsContent key={id} id={id} />
        </>

    )


};

const ProductDetailsContent = ({ id }) => {
    // Store the product returned by the backend.
    const [product, setProduct] = useState(null);
    // Track whether the product request is still running.
    const [loading, setLoading] = useState(true);
    // Store a message for missing products or failed requests.
    const [error, setError] = useState(null);
    // Report add-to-cart failures without replacing the product details.
    const [cartActionError, setCartActionError] = useState(null);
    const [adding, setAdding] = useState(false);
    // Keep the existing cart actions and quantity display.
    const { addToCart, cartItems, cartLoading, isUpdating } = useCart();
    const { isSaving, hasPendingCheckout } = useOrder();


    // Fetch the product after mounting; the key handles resetting local state.
    useEffect(() => {
        // Ignore responses from requests for a previous product or closed page.
        let cancelled = false;

        // Request one product and handle success, errors, and completion.
        async function loadProduct() {
            try {
                const product = await fetchProductsById(id);

                if (!cancelled) {
                    setProduct(product);
                }
            } catch (error) {
                if (!cancelled) {
                    if (error.response?.status === 404) {
                        setError('Product not found.');
                    } else if (error.response?.status === 400) {
                        setError('Invalid product ID.');
                    } else {
                        setError('Unable to load this product. Please try again.');
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProduct();

        // Prevent this request's result from updating state after cleanup.
        return () => {
            cancelled = true;
        };
    }, [id]);

    // Wait for the saved cart before allowing another add request.
    const handleAddToCart = async () => {
        if (isSaving || hasPendingCheckout) return;
        setCartActionError(null);
        setAdding(true);
        const result = await addToCart(product.id);
        setAdding(false);
        if (!result.success && result.error) setCartActionError(result.error);
    };

    // Fresh component state shows loading until the async request completes.
    if (loading) {
        return <div className="page"><div className="container"><p role="status">Loading product...</p></div></div>;
    }

    // Show request failures separately from the loading state.
    if (error || !product) {
        return (
            <div className="page">
                <div className="container">
                    <p role="alert">{error || 'Product not found.'}</p>
                    <Link to="/product">Back to all products</Link>
                </div>
            </div>
        );
    }

    const productInCart = cartItems.find((item) => item.id === product.id);



    return (
        <div className="page">
            <div className="container">
                <div className="product-detail">
                    <div className="product-detail-image">
                        <ProductImage
                            // src={product.image}
                            alt={product.name}
                            loading='lazy'
                            decoding='async'
                        />
                    </div>
                    <div className="product-detail-content">
                        <p className="product-card-eyebrow">D&apos;s NutShop</p>
                        <h1 className="product-detail-name">{product.name}</h1>
                        <p className="product-package-weight">Package weight: {product.packageWeightGrams}g</p>
                        <p className="product-detail-price">${product.price.toFixed(2)}</p>
                        <p className="product-detail-description">{product.description}</p>
                        <span className="product-card-cart-count product-detail-cart-count">
                            {productInCart ? `${productInCart.quantity} in cart` : 'Not in cart yet'}
                        </span>
                        <button type="button" className="product-card-add product-detail-add" disabled={cartLoading || isUpdating || adding || isSaving || hasPendingCheckout} onClick={handleAddToCart}>
                            {adding ? 'Adding...' : '+ Add to cart'}
                        </button>
                        {cartActionError && <p role="alert">{cartActionError}</p>}
                        {hasPendingCheckout && <Link to="/checkout">Confirm your pending checkout</Link>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductDetails
