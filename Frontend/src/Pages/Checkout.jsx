import { useCart } from "../Context/CartContext"
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../Context/AuthContext';
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useOrder } from "../Context/OrderContext";
import { toast } from "react-toastify";


const Checkout = () => {
    const { getCartItemsWithProduct, updateQuantity, removeFromCart, getBackendCartTotal, totalsMatch, clearCheckout, cartLoading, cartError, isUpdating, refreshCart } = useCart();
    const cartItems = getCartItemsWithProduct();
    const removeButtons = useRef(new Map());
    const emptyMessage = useRef(null);
    const pendingFocus = useRef(null);
    const [checkoutError, setCheckoutError] = useState(null);
    const { saveOrder, isSaving, hasPendingCheckout } = useOrder();
    const orderInProgress = useRef(false);
    const busy = cartLoading || isUpdating || isSaving;
    const hasUnavailableItems = cartItems.some((item) => !item.product.isActive);

    // Check current prices when the customer opens checkout.
    useEffect(() => { refreshCart(); }, [refreshCart]);

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

    // Wait for the backend before announcing removal or moving focus.
    const removeItem = async (productId) => {
        const index = cartItems.findIndex(item => item.id === productId);
        if (index < 0) return;
        const nextItem = cartItems[index + 1] || cartItems[index - 1];
        pendingFocus.current = { removedId: productId, nextId: nextItem?.id };
        const result = await removeFromCart(productId);
        if (result.success) toast.success('Item deleted');
        else pendingFocus.current = null;
    };

    // Clear both the database cart and the displayed cart through the context.
    const clearCartWithFocus = async () => {
        pendingFocus.current = { empty: true };
        const result = await clearCheckout();
        if (!result.success) pendingFocus.current = null;
        return result;
    };

    const total = getBackendCartTotal();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const placeOrder = async () => {

        if (!user) {
            navigate('/auth', {
                state: {
                    initialMode: 'login',
                    from: location.pathname + location.search + location.hash,
                },
            });

            return;
        }


        if (busy || orderInProgress.current) return;
        if (!hasPendingCheckout && (cartError || !totalsMatch || hasUnavailableItems || cartItems.length === 0)) return;

        orderInProgress.current = true;
        setCheckoutError(null);
        try {
            // The backend saves the order and clears the cart in one transaction.
            const result = await saveOrder();
            if (!result.success) { setCheckoutError(result.error); return; }
            toast.success(`Order ${result.order.id} placed successfully`);
            navigate('/orders');
        } finally {
            orderInProgress.current = false;
        }
    }



    const emptyCart = async () => {
        if (busy || hasPendingCheckout || cartItems.length === 0) return;

        // Ask for confirmation before clearing the cart
        const confirmed = window.confirm("Are you sure you want to empty your cart? All Items will be removed.");
        if (confirmed) {
            const result = await clearCartWithFocus();
            if (result.success) toast.success('Cart deleted successfully');
        }
    }
    return (
        <div className="page checkout-page">
            <div className="container">
                <h1 className="page-title">Your Cart</h1>
                {cartLoading && <p role="status">Loading your cart...</p>}
                {!cartLoading && !isUpdating && !cartError && !totalsMatch && (
                    <div role="alert">
                        <p>Your cart totals could not be confirmed. Please reload your cart.</p>
                        <button type="button" disabled={busy} onClick={refreshCart}>Reload cart</button>
                    </div>
                )}
                {cartError && (
                    <div role="alert">
                        <p>{cartError}</p>
                        <button type="button" disabled={busy} onClick={refreshCart}>Retry loading cart</button>
                    </div>
                )}
                {checkoutError && <p role="alert">{checkoutError}</p>}
                {hasPendingCheckout && <p role="status">Confirm your previous checkout using Retry checkout, or <Link to="/orders">check your orders</Link>.</p>}
                {hasUnavailableItems && <p role="alert">Remove unavailable products before placing your order.</p>}
                {!user && <p>Please <Link to="/auth" state={{ initialMode: 'login', from: location.pathname + location.search + location.hash }}>log in</Link> to view your saved cart.</p>}
                <div className="checkout-container">
                    <div className="checkout-items">
                        <h2 className="checkout-section-title"> Order Summary</h2>
                        {user && !cartLoading && !cartError && cartItems.length === 0 && <p ref={emptyMessage} tabIndex={-1} className="checkout-empty">Your cart is empty. Browse our nuts to find your next favorite.</p>}
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
                                    {!item.product.isActive && <p>Currently unavailable</p>}
                                </div>
                                <div className="checkout-item-controls">
                                    <div className="quantity-controls">
                                        <button className="quantity-btn" disabled={busy || hasPendingCheckout || !item.product.isActive} aria-label={`Decrease ${item.product.name} quantity`} onClick={() => item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1)}>-</button>
                                        <span className="quantity-value">{item.quantity}</span>
                                        <button className="quantity-btn" disabled={busy || hasPendingCheckout || !item.product.isActive} aria-label={`Increase ${item.product.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                    </div>

                                    <p className="checkout-item-total">
                                        ${(item.lineTotalCents / 100).toFixed(2)}
                                    </p>
                                    <button ref={(node) => { if (node) removeButtons.current.set(item.id, node); else removeButtons.current.delete(item.id); }} disabled={busy || hasPendingCheckout} className="checkout-remove" aria-label={`Remove ${item.product.name} from cart`} onClick={() => removeItem(item.id)}>
                                        Remove
                                    </button>
                                </div>

                            </div>
                        ))}
                        <div className="checkout-actions">
                            <Link className="checkout-continue" to="/">Continue Shopping</Link>
                            <button type="button" className="checkout-empty-cart" disabled={busy || hasPendingCheckout || cartItems.length === 0} onClick={emptyCart}>Empty Cart</button>
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
                        <button className="product-card-add checkout-order" disabled={busy || (!hasPendingCheckout && (Boolean(cartError) || !totalsMatch || hasUnavailableItems || cartItems.length === 0))} onClick={placeOrder}>
                            {isSaving ? 'Placing order...' : hasPendingCheckout ? 'Retry checkout' : 'Place Order'}
                        </button>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
