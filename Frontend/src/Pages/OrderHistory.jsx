import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../Context/AuthContext';
import { useOrder } from '../Context/OrderContext';

const formatMoney = (cents, currency) => new Intl.NumberFormat(undefined, {
    style: 'currency', currency,
}).format(cents / 100);

const OrderHistory = () => {
    const { user } = useAuth();
    const { orders, ordersLoading, ordersError, archiveOrder, refreshOrders, searchOrders, searchTerm, page, totalPages, setOrderPage } = useOrder();
    const [search, setSearch] = useState(searchTerm);
    const [archiving, setArchiving] = useState(null);
    const [actionError, setActionError] = useState(null);

    // Search the backend by the readable order ID, for this account only.
    const handleSearch = (event) => {
        event.preventDefault();
        setActionError(null);
        searchOrders(search);
    };

    // Cancelling confirmation makes no request and displays no failure message.
    const hideOrder = async (id) => {
        if (!window.confirm(`Hide order ${id} from your history? This does not cancel the order.`)) return;
        setActionError(null);
        setArchiving(id);
        const result = await archiveOrder(id);
        setArchiving(null);
        if (result.success) toast.success('Order hidden from history');
        else if (result.error) setActionError(result.error);
    };

    return (
        <main className="page orders-page">
            <div className="container">
                <header className="orders-header">
                    <h1 className="page-title">Order History</h1>
                    <form className="orders-search" role="search" aria-label="Search order history" onSubmit={handleSearch}>
                        <input className="orders-search-input" type="search" name="search" aria-label="Order ID" placeholder="For example, NS-000001" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={24} />
                        <button className="orders-search-button" type="submit" disabled={!user || ordersLoading}>Search orders</button>
                        {searchTerm && <button type="button" onClick={() => { setSearch(''); searchOrders(''); }}>Show all orders</button>}
                    </form>
                </header>
                {actionError && <p role="alert">{actionError}</p>}
                {!user ? (
                    <p className="orders-empty">Please <Link to="/auth" state={{ initialMode: 'login', from: '/orders' }}>log in</Link> to view your order history.</p>
                ) : ordersLoading ? (
                    <p role="status">Loading your orders...</p>
                ) : ordersError ? (
                    <div role="alert"><p>{ordersError}</p><button type="button" onClick={refreshOrders}>Retry loading orders</button></div>
                ) : orders.length === 0 ? (
                    <p className="orders-empty">{searchTerm ? 'No order matches that ID in your history.' : "You haven't placed any orders yet."}</p>
                ) : (
                    <>
                        <ul className="orders-list">
                            {orders.map((order) => (
                                <li key={order.id} className="order-card">
                                    <h2 className="order-heading">Order: <span className="order-reference">{order.id}</span></h2>
                                    <p>Status: {order.status}</p>
                                    <p className="order-date"><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString()}</time></p>
                                    <p className="order-email">Email: {order.customerEmail}</p>
                                    <ul className="order-items">
                                        {order.items.map((item) => (
                                            <li key={item.id} className="order-item">
                                                <h3>{item.name}</h3>
                                                <p>Quantity: {item.quantity}</p>
                                                <p>Price each: {formatMoney(item.unitPriceCents, order.currency)}</p>
                                                <p className="order-item-total">Item total: {formatMoney(item.lineTotalCents, order.currency)}</p>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="order-footer">
                                        <button type="button" className="checkout-remove" disabled={Boolean(archiving)} onClick={() => hideOrder(order.id)}>
                                            {archiving === order.id ? 'Hiding...' : 'Hide from history'}
                                        </button>
                                        <div className="order-footer-summary">
                                            <p className="order-subtotal"><strong>Subtotal: {formatMoney(order.subtotalCents, order.currency)}</strong></p>
                                            <p className="order-subtotal"><strong>Total: {formatMoney(order.totalCents, order.currency)}</strong></p>
                                            <p className="order-shipping-note">Shipping is not included</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <nav aria-label="Order history pages">
                            <button type="button" disabled={page <= 1} onClick={() => setOrderPage(page - 1)}>Previous</button>
                            <span> Page {page} of {Math.max(1, totalPages)} </span>
                            <button type="button" disabled={page >= totalPages} onClick={() => setOrderPage(page + 1)}>Next</button>
                        </nav>
                    </>
                )}
            </div>
        </main>
    );
};

export default OrderHistory;
