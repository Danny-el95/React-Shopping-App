import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../Context/CartContext'
import { useOrder } from '../Context/OrderContext'
import ProductImage from './ProductImage'


const ProductCard = ({ product }) => {
    const { addToCart, cartItems, cartLoading, isUpdating } = useCart();
    const { isSaving, hasPendingCheckout } = useOrder();
    const productInCart = cartItems.find((item) => item.id === product.id);

    const [added, setAdded] = useState(false);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState(null);
    const feedbackTimer = useRef(null);

    useEffect(() => () => clearTimeout(feedbackTimer.current), []);

    // Confirm the database update before displaying success.
    const handleAddToCart = async () => {
        if (isSaving || hasPendingCheckout) return;
        setError(null);
        setAdding(true);
        const result = await addToCart(product.id);
        setAdding(false);
        if (!result.success) {
            if (result.error) setError(result.error);
            return;
        }
        setAdded(true);
        clearTimeout(feedbackTimer.current);
        feedbackTimer.current = setTimeout(() => setAdded(false), 1800);
    };

    return (
        <article className='product-card'>
            <Link to={`/products/${product.id}`} className='product-card-image-link' aria-label={`View ${product.name} details`}>
                <ProductImage
                    src={product.image}
                    alt={product.name}
                    className="product-card-image"
                    loading='lazy'
                    decoding='async'
                />
            </Link>
            <div className='product-card-content'>
                <p className='product-card-eyebrow'>D&apos;s NutShop</p>
                <h3 className='product-card-name'>{product.name}</h3>
                <p className="product-package-weight">{product.packageWeightGrams}g per pack</p>
                <p className='product-card-description'>{product.description}</p>
                <div className='product-card-price-row'>
                    <p className='product-card-price'>${product.price.toFixed(2)}</p>
                    <span className='product-card-cart-count'>
                        {productInCart ? `${productInCart.quantity} in cart` : 'Not in cart yet'}
                    </span>
                </div>
                <div className='product-card-actions'>
                    <button type='button' className='product-card-add' disabled={cartLoading || isUpdating || adding || isSaving || hasPendingCheckout} onClick={handleAddToCart} aria-label={`Add ${product.name} to cart`}>
                        {adding ? 'Adding...' : added && productInCart ? `Added to cart (${productInCart.quantity})` : '+ Add to cart'}
                    </button>
                    <Link className='product-card-details' to={`/products/${product.id}`} aria-label={`View ${product.name} details`}>View details <span aria-hidden='true'>→</span></Link>
                </div>
                {error && <p role="alert">{error}</p>}
                {hasPendingCheckout && <Link to="/checkout">Confirm your pending checkout</Link>}
                <span className='product-card-feedback' role='status' aria-live='polite'>
                    {added && productInCart ? `${product.name} added to your cart.` : ''}
                </span>
            </div>
        </article>
    )
}

export default ProductCard
