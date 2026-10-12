import { useCart } from "../Context/CartContext"
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../Context/AuthContext';
import { useLayoutEffect, useRef } from "react";
import { useOrder } from "../Context/OrderContext";


const Checkout = () => {
    const { getCartItemsWithProduct, updateQuantity, removeFromCart, getCartTotal, clearCheckout } = useCart();
    const cartItems = getCartItemsWithProduct();
    const removeButtons = useRef(new Map());
    const emptyMessage = useRef(null);
    const pendingFocus = useRef(null);

    // Wait for React to remove the row before focusing a remaining control.
    useLayoutEffect(() => {
        const target = pendingFocus.current;
        if (!target) return;
        if (target.empty && cartItems.length !== 0) return;
        if (!target.empty && cartItems.some(item => item.id === target.removedId)) return;

        const nextButton = removeButtons.current.get(target.nextId);
        (nextButton || emptyMessage.current)?.focus();
        pendingFocus.current = null;
    });

    const removeItem = (productId) => {
        const index = cartItems.findIndex(item => item.id === productId);
        if (index < 0) return;
        const nextItem = cartItems[index + 1] || cartItems[index - 1];
        pendingFocus.current = { removedId: productId, nextId: nextItem?.id };
        removeFromCart(productId);
    };

    const clearCartWithFocus = () => {
        pendingFocus.current = { empty: true };
        clearCheckout();
    };

    const total = getCartTotal();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { saveOrder } = useOrder();

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
        const saved = saveOrder();

        if (!saved) {
            alert("Could not save your order. Please try again.");
            return;
        }
        
        clearCartWithFocus();
        navigate('/orders');
    }

    

    const emptyCart = () => {
        if (cartItems.length === 0) return;

        // Ask for confirmation before clearing the cart
        const confirmed = window.confirm("Are you sure you want to empty your cart? All Items will be removed.");
        if (confirmed) {
            clearCartWithFocus();
        }
    }
    return (
        <div className="page checkout-page">
            <div className="container">
                <h1 className="page-title">Your Cart</h1>
                <div className="checkout-container">
                    <div className="checkout-items">
                        <h2 className="checkout-section-title"> Order Summary</h2>
                        {cartItems.length === 0 && <p ref={emptyMessage} tabIndex={-1} className="checkout-empty">Your cart is empty. Browse our nuts to find your next favorite.</p>}
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
                                        <button className="quantity-btn" aria-label={`Decrease ${item.product.name} quantity`} onClick={() => item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1)}>-</button>
                                        <span className="quantity-value">{item.quantity}</span>
                                        <button className="quantity-btn" aria-label={`Increase ${item.product.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                    </div>

                                    <p className="checkout-item-total">
                                        ${(item.product.price * item.quantity).toFixed(2)}
                                    </p>
                                    <button ref={(node) => { if (node) removeButtons.current.set(item.id, node); else removeButtons.current.delete(item.id); }} className="checkout-remove" aria-label={`Remove ${item.product.name} from cart`} onClick={() => removeItem(item.id)}>
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
