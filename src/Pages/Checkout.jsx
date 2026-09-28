import { useCart } from "../Context/CartContext"
import { useNavigate } from "react-router-dom";
import { useAuth } from '../Context/AuthContext';
import { useContext } from "react";


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
    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">Checkout</h1>
                <div className="checkout-container">
                    <div className="checkout-items">
                        <h2 className="checkout-section-title"> Order Summary</h2>
                        {cartItems.map((item, id) => (
                            <div key={id} className="checkout-item">
                                <img
                                    src={item.product.image}
                                    alt={item.product.image}
                                    className="checkout-item-image"
                                />
                                <div className="checkout-item-details">
                                    <h3 className="checkout-item-price">{item.product.name}</h3>
                                    <p className="checkout-item-price">${item.product.price} each</p>
                                </div>
                                <div className="checkout-item-controls">
                                    <div className="quantity-controls">
                                        <button className="quantity-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                        <span className="quantity-value">{item.quantity}</span>
                                        <button className="quantity-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                    </div>

                                    <p className="checkout-item-total">
                                        ${(item.product.price * item.quantity).toFixed(2)}
                                    </p>
                                    <button className="btn btn-secondary btn-small" onClick={() => removeFromCart(item.id)}>
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="checkout-summary">
                        <h2 className="section-checkout-title">Total</h2>
                        <div className="checkout-total">
                            <p className="checkout-total-label">Subtotal</p>
                            <p className="checkout-total-value">${total.toFixed(2)}</p>
                        </div>
                        <div className="checkout-total">
                            <p className="checkout-total-label">Total</p>
                            <p className="checkout-total-value checkout-total-final">${total.toFixed(2)}</p>
                        </div>

                        <button className="btn btn-primary btn-large btn-block" onClick={() => placeOrder()}>Place Order</button>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout