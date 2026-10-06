import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../Context/CartContext'


const ProductCard = ({ product }) => {
    const { addToCart, cartItems } = useCart();
    const productInCart = cartItems.find((item) => item.id === product.id);

    const [added, setAdded] = useState(false);
    const feedbackTimer = useRef(null);

    useEffect(() => () => clearTimeout(feedbackTimer.current), []);

    const handleAddToCart = () => {
        addToCart(product.id);
        setAdded(true);
        clearTimeout(feedbackTimer.current);
        feedbackTimer.current = setTimeout(() => setAdded(false), 1800);
    };

    return (
        <article className='product-card'>
            <Link to={`/products/${product.id}`} className='product-card-image-link' aria-label={`View ${product.name} details`}>
                <img src={product.image} alt={product.name} className='product-card-image' loading='lazy' decoding='async' />
            </Link>
            <div className='product-card-content'>
                <p className='product-card-eyebrow'>D&apos;s NutShop</p>
                <h3 className='product-card-name'>{product.name}</h3>
                <p className='product-card-description'>{product.description}</p>
                <div className='product-card-price-row'>
                    <p className='product-card-price'>${product.price.toFixed(2)}</p>
                    <span className='product-card-cart-count'>
                        {productInCart ? `${productInCart.quantity} in cart` : 'Not in cart yet'}
                    </span>
                </div>
                <div className='product-card-actions'>
                    <button type='button' className='product-card-add' onClick={handleAddToCart} aria-label={`Add ${product.name} to cart`}>
                        {added ? '✓ Added to cart' : '+ Add to cart'}
                    </button>
                    <Link className='product-card-details' to={`/products/${product.id}`} aria-label={`View ${product.name} details`}>View details <span aria-hidden='true'>→</span></Link>
                </div>
                <span className='product-card-feedback' role='status' aria-live='polite'>
                    {added ? `${product.name} added to your cart.` : ''}
                </span>
            </div>
        </article>
    )
}

export default ProductCard
