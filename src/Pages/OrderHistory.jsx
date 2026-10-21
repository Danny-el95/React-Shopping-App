import { toast } from 'react-toastify';
import { useAuth } from '../Context/AuthContext'
import { useOrder } from '../Context/OrderContext'


const OrderHistory = () => {
    const { user } = useAuth();
    const { orders, deleteOrder } = useOrder();
    const order = user
        ? orders.filter(order => order.customerEmail === user.email)
        : [];

    return (
        <main className="page orders-page">
            <div className="container">
                <header className="orders-header">
                    <h1 className="page-title">Order History</h1>
                    <form className="orders-search" role="search" aria-label="Search order history">
                        <input className="orders-search-input" type="search" name="search" aria-label="Order ID" placeholder="Enter your order ID" />
                        <button className="orders-search-button" type="submit">Search orders</button>
                    </form>
                </header>
                {!user ? (
                    <p className="orders-empty">Please log in to view your order history.</p>
                ) : order.length === 0 ? (
                    <p className="orders-empty">You haven&apos;t placed any orders yet.</p>
                ) : (
                    <ul className="orders-list">
                        {order.map(order => (
                            <li key={order.id} className="order-card">
                                <h2 className="order-heading">Order: <span className="order-reference">#{order.id}</span></h2>
                                {order.createdAt && (
                                    <p className="order-date">
                                        <time dateTime={order.createdAt}>
                                            {new Date(order.createdAt).toLocaleString()}
                                        </time>
                                    </p>
                                )}

                                <p className="order-email">Email: {order.customerEmail}</p>

                                <ul className="order-items">
                                    {order.items.map(item => (
                                        <li key={item.productId} className="order-item">
                                            <h3>{item.name}</h3>
                                            <p>Quantity: {item.quantity}</p>
                                            <p>Price each: ${(item.unitPriceCents / 100).toFixed(2)}</p>
                                            <p className="order-item-total">Item total: ${((item.unitPriceCents * item.quantity) / 100).toFixed(2)}</p>
                                        </li>
                                    ))}
                                </ul>
                                <button type="button"
                                    className="checkout-remove"
                                    onClick={() => {
                                        const confirmed = window.confirm(
                                            "Delete this order from your history?"
                                        );

                                        if (confirmed && !deleteOrder(order.id)) {
                                            alert("Could not delete the order. Please try again.");
                                        } else {
                                            toast.success('Order deleted successfully')
                                        }
                                    }}>Delete Order</button>

                                <p className="order-subtotal">
                                    <strong>
                                        Subtotal: ${order.subtotal.toFixed(2)}
                                    </strong>
                                </p>
                                <p className="order-shipping-note">Shipping is not included</p>
                            </li>

                        ))}
                    </ul>

                )}
            </div>
        </main>
    )
}

export default OrderHistory
