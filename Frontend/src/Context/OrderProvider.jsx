import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import OrderContext from './OrderContext';
import { fetchOrders, createOrder, archiveOrder as archiveOrderRequest } from '../api/server';

// Only retry metadata is stored in sessionStorage, never order records or credentials.
function readPending(userId) {
    if (!userId) return null;
    try {
        const data = JSON.parse(sessionStorage.getItem(`nutshop.checkout.${userId}`) || 'null');
        return data && typeof data.requestKey === 'string' && /^[a-f0-9]{64}$/.test(data.expectedCartVersion)
            ? { ...data, userId } : null;
    } catch { return null; }
}

function orderError(error) {
    if (error.response?.status === 401) return 'Please log in to continue';
    if (error.response?.status >= 500 || !error.response) return 'Unable to confirm the request. Please retry or check your order history.';
    return error.response.data?.error || 'Unable to complete the order request';
}

export default function OrderProvider({ children }) {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const { cartItems, cartVersion, cartLoading, cartError, totalsMatch, isUpdating, applyServerCart, refreshCart } = useCart();
    const [history, setHistory] = useState({ userId, orders: [], total: 0, historyTotal: 0, totalPages: 0, key: null, error: null });
    const [query, setQuery] = useState({ search: '', page: 1, revision: 0 });
    const [pendingCheckout, setPendingCheckout] = useState(() => readPending(userId));
    const [savingUser, setSavingUser] = useState(null);
    const activeUser = useRef(null);
    const saveInProgress = useRef(false);

    // Prevent another account's history or pending checkout appearing after login/logout.
    if (history.userId !== userId) {
        setHistory({ userId, orders: [], total: 0, historyTotal: 0, totalPages: 0, key: null, error: null });
        setQuery({ search: '', page: 1, revision: 0 });
        setPendingCheckout(readPending(userId));
    }

    const key = JSON.stringify(query);
    const orders = history.userId === userId ? history.orders : [];
    const ordersLoading = Boolean(userId && (history.userId !== userId || history.key !== key));
    const ordersError = history.userId === userId ? history.error : null;
    const isSaving = userId !== null && savingUser === userId;
    const hasPendingCheckout = Boolean(userId && pendingCheckout?.userId === userId);

    // Fetch owned, paginated history and ignore responses from older queries/accounts.
    useEffect(() => {
        let cancelled = false;
        activeUser.current = userId;
        async function loadOrders() {
            try {
                const data = await fetchOrders({ search: query.search, page: query.page, limit: 10 });
                if (cancelled) return;
                if (query.page > Math.max(1, data.totalPages)) {
                    setQuery((current) => ({ ...current, page: Math.max(1, data.totalPages) }));
                    return;
                }
                setHistory({ userId, ...data, key, error: null });
            } catch (error) {
                if (!cancelled) setHistory((current) => ({ ...current, userId, key, error: orderError(error) }));
            }
        }
        if (userId) loadOrders();
        return () => { cancelled = true; activeUser.current = null; };
    }, [userId, query.search, query.page, key]);

    const refreshOrders = useCallback(() => setQuery((current) => ({ ...current, revision: current.revision + 1 })), []);
    const searchOrders = useCallback((search) => setQuery((current) => ({ search: search.trim().toUpperCase(), page: 1, revision: current.revision + 1 })), []);
    const setOrderPage = useCallback((page) => setQuery((current) => ({ ...current, page })), []);

    useEffect(() => {
        window.addEventListener('focus', refreshOrders);
        return () => window.removeEventListener('focus', refreshOrders);
    }, [refreshOrders]);

    // Reuse a checkout key on uncertain failures, including after a page refresh.
    const saveOrder = async () => {
        if (!userId) return { success: false, error: 'Please log in to place an order' };
        if (saveInProgress.current || isUpdating || cartLoading) return { success: false, error: 'Please wait for the current cart request' };
        let attempt = hasPendingCheckout ? pendingCheckout : null;
        if (!attempt) {
            if (cartError || !totalsMatch || !cartVersion || !cartItems.length || cartItems.some((item) => !item.product.isActive)) {
                return { success: false, error: 'Please reload and review your cart before checkout' };
            }
            attempt = { userId, requestKey: crypto.randomUUID(), expectedCartVersion: cartVersion };
            try {
                sessionStorage.setItem(`nutshop.checkout.${userId}`, JSON.stringify({ requestKey: attempt.requestKey, expectedCartVersion: attempt.expectedCartVersion }));
            } catch { return { success: false, error: 'Allow session storage so checkout can be retried safely' }; }
            setPendingCheckout(attempt);
        }

        const ownerId = userId;
        saveInProgress.current = true;
        setSavingUser(ownerId);
        try {
            const data = await createOrder({ requestKey: attempt.requestKey, expectedCartVersion: attempt.expectedCartVersion });
            if (activeUser.current !== ownerId) return { success: false, error: 'Your account changed. Please check your order history' };
            applyServerCart(data.cart);
            try { sessionStorage.removeItem(`nutshop.checkout.${ownerId}`); } catch { /* Replaying the key is still safe. */ }
            setPendingCheckout(null);
            setQuery((current) => ({ search: '', page: 1, revision: current.revision + 1 }));
            return { success: true, order: data.order, replayed: data.replayed };
        } catch (error) {
            if (activeUser.current !== ownerId) return { success: false, error: 'Your account changed. Please check your order history' };
            if ([400, 409].includes(error.response?.status)) {
                try { sessionStorage.removeItem(`nutshop.checkout.${ownerId}`); } catch { /* No order was created for this attempt. */ }
                setPendingCheckout(null);
                refreshCart();
            }
            return { success: false, error: orderError(error) };
        } finally {
            saveInProgress.current = false;
            if (activeUser.current === ownerId) setSavingUser(null);
        }
    };

    // Archive only after server confirmation; never permanently delete purchase records.
    const archiveOrder = async (id) => {
        const ownerId = userId;
        if (!ownerId) return { success: false, error: 'Please log in to continue' };
        try {
            await archiveOrderRequest(id);
            if (activeUser.current !== ownerId) return { success: false };
            refreshOrders();
            return { success: true };
        } catch (error) { return { success: false, error: orderError(error) }; }
    };

    return (
        <OrderContext.Provider value={{
            orders, ordersLoading, ordersError, isSaving, hasPendingCheckout, saveOrder, archiveOrder,
            refreshOrders, searchOrders, setOrderPage, searchTerm: query.search, page: query.page,
            totalPages: history.userId === userId ? history.totalPages : 0,
            orderCount: history.userId === userId ? history.historyTotal : 0,
        }}>
            {children}
        </OrderContext.Provider>
    );
}
