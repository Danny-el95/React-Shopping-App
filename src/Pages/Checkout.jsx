import { useCart } from "../Context/CartContext"
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../Context/AuthContext';


const Checkout = () => {
    const { getCartItemsWithProduct, updateQuantity, removeFromCart, getCartTotal, clearCheckout } = useCart();
    const cartItems = getCartItemsWithProduct();

    const total = getCartTotal();
    const navigate = useNavigate();
    const { user } = useAuth();

    const placeOrder = () => {

        if (!user) {
            alert("Please log in or sign up to place an order");
            navigate('/auth');
            return;
        }


        if (total === 0) {
            alert("Please add an item")
        } else {
            alert("Order Successful");
        }

        clearCheckout();
    }

    const emptyCart = () => {
        if (cartItems.length === 0) return;

        // Ask for confirmation before clearing the cart
        const confirmed = window.confirm("Are you sure you want to empty your cart? All Items will be removed.");
        if (confirmed) {
            clearCheckout();
        }
    }
    return (
        <div className="page checkout-page">
            <div className="container">
                <h1 className="page-title">Your Cart</h1>
                <div className="checkout-container">
                    <div className="checkout-items">
                        <h2 className="checkout-section-title"> Order Summary</h2>
                        {cartItems.length === 0 && <p className="checkout-empty">Your cart is empty. Browse our nuts to find your next favorite.</p>}
                        {cartItems.map((item) => (
                            <div key={item.id} className="checkout-item">
                                <img
                                    src={item.product.image}
                                    alt={item.product.name}
                                    className="checkout-item-image"
                                />
                                <div className="checkout-item-details">
                                    <h3 className="checkout-item-name">{item.product.name}</h3>
                                    <p className="checkout-item-price">${item.product.price.toFixed(2)} each</p>
                                </div>
                                <div className="checkout-item-controls">
                                    <div className="quantity-controls">
                                        <button className="quantity-btn" aria-label={`Decrease ${item.product.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                        <span className="quantity-value">{item.quantity}</span>
                                        <button className="quantity-btn" aria-label={`Increase ${item.product.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                    </div>

                                    <p className="checkout-item-total">
                                        ${(item.product.price * item.quantity).toFixed(2)}
                                    </p>
                                    <button className="checkout-remove" aria-label={`Remove ${item.product.name} from cart`} onClick={() => removeFromCart(item.id)}>
                                        Remove
                                    </button>
                                </div>

                            </div>
                        ))}
                        <div className="checkout-actions">
                            <Link className="checkout-continue" to="/">Continue Shopping</Link>
                            <button type="button" className="checkout-empty-cart" disabled={cartItems.length === 0} onClick={emptyCart}>Empty Cart</button>
                        </div>
                    </div>

                    <div className="checkout-summary">
                        <h2 className="checkout-section-title">Total</h2>
                        <div className="checkout-total">
                            <p className="checkout-total-label">Subtotal</p>
                            <p className="checkout-total-value">${total.toFixed(2)}</p>
                        </div>
                        <div className="checkout-total">
                            <p className="checkout-total-label">Total</p>
                            <p className="checkout-total-value checkout-total-final">${total.toFixed(2)}</p>
                        </div>

                        <p className="checkout-shipping-note">Shipping is not included in the total shown.</p>
                        <button className="product-card-add checkout-order" disabled={cartItems.length === 0} onClick={() => placeOrder()}>Place Order</button>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
