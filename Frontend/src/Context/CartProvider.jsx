import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { fetchCart, addCartItem, updateCartItem, deleteCartItem, clearCart } from '../api/server';
import CartContext from './CartContext';

// Keep session errors separate from invalid login credentials.
function getCartError(error) {
    if (error.response?.status === 401) return 'Your session expired. Please log in again.';
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'The cart request timed out. Please try again.';
    if (!error.response) return 'Unable to reach the server. Please try again.';
    if (error.response.status >= 500) return 'Unable to update your cart right now. Please try again.';
    return error.response.data?.error || 'Unable to update your cart. Please try again.';
}

export default function CartProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const userId = user?.id ?? null;
    const navigate = useNavigate();
    const location = useLocation();

    // Keep items and load results associated with their owner.
    const [cart, setCart] = useState({ userId, items: [], subtotalCents: 0, cartVersion: null, version: -1, error: null });
    const [updatingUser, setUpdatingUser] = useState(null);
    const [reloadCount, setReloadCount] = useState(0);
    const activeUser = useRef(null);
    const updateInProgress = useRef(false);

    // Reset immediately on account changes so old items never reach the page.
    if (cart.userId !== userId) {
        setCart({ userId, items: [], subtotalCents: 0, cartVersion: null, version: -1, error: null });
    }

    const cartItems = cart.userId === userId ? cart.items : [];
    const cartError = cart.userId === userId ? cart.error : null;
    const cartLoading = Boolean(authLoading || (userId && (cart.userId !== userId || cart.version !== reloadCount)));
    const isUpdating = userId !== null && updatingUser === userId;

    // Fetch the saved cart after login, refresh, or an explicit retry.
    useEffect(() => {
        let cancelled = false;
        activeUser.current = userId;

        async function loadCart() {
            try {
                const { items, subtotalCents, cartVersion } = await fetchCart();
                if (!cancelled) setCart({ userId, items, subtotalCents, cartVersion, version: reloadCount, error: null });
            } catch (error) {
                if (!cancelled) {
                    setCart((current) => ({
                        userId,
                        items: current.userId === userId ? current.items : [],
                        subtotalCents: current.userId === userId ? current.subtotalCents : 0,
                        cartVersion: current.userId === userId ? current.cartVersion : null,
                        version: reloadCount,
                        error: getCartError(error),
                    }));
                }
            }
        }

        if (userId && !authLoading) loadCart();

        // Ignore responses that arrive after logout or switching accounts.
        return () => {
            cancelled = true;
            activeUser.current = null;
        };
    }, [userId, authLoading, reloadCount]);

    // Preserve the current page when an anonymous shopper needs to log in.
    function requestLogin() {
        navigate('/auth', {
            state: {
                initialMode: 'login',
                from: location.pathname + location.search + location.hash,
            },
        });
    }

    // Share API handling between actions and prevent overlapping updates.
    async function changeCart(request) {
        if (!userId) {
            requestLogin();
            return { success: false, requiresLogin: true };
        }
        if (cartLoading || updateInProgress.current) {
            return { success: false, error: 'Please wait for the current cart request.' };
        }

        const ownerId = userId;
        updateInProgress.current = true;
        setUpdatingUser(ownerId);
        setCart((current) => ({ ...current, error: null }));

        try {
            const { items, subtotalCents, cartVersion } = await request();
            if (activeUser.current !== ownerId) return { success: false };
            setCart({ userId: ownerId, items, subtotalCents, cartVersion, version: reloadCount, error: null });
            return { success: true };
        } catch (error) {
            if (activeUser.current !== ownerId) return { success: false };
            const message = getCartError(error);
            setCart((current) => ({ ...current, error: message }));
            if (error.response?.status === 401) {
                setCart({ userId: ownerId, items: [], subtotalCents: 0, cartVersion: null, version: reloadCount, error: message });
                requestLogin();
            }
            return { success: false, error: message };
        } finally {
            updateInProgress.current = false;
            if (activeUser.current === ownerId) setUpdatingUser(null);
        }
    }

    // Each action receives the complete updated cart from the backend.
    const addToCart = (productId) => changeCart(() => addCartItem(productId));
    const removeFromCart = (productId) => changeCart(() => deleteCartItem(productId));
    const clearCheckout = () => changeCart(() => clearCart());

    // Preserve checkout's existing behavior: zero quantity removes the item.
    const updateQuantity = (productId, quantity) => quantity <= 0
        ? removeFromCart(productId)
        : changeCart(() => updateCartItem(productId, quantity));

    // Joined product details are already included in each API cart item.
    const getCartItemsWithProduct = () => cartItems;

    // Keep an independent frontend calculation to check the backend response.
    const frontendSubtotalCents = cartItems.reduce((total, item) =>
        total + (item.product.isActive ? Math.round(item.product.price * 100) * item.quantity : 0), 0);

    const backendSubtotalCents = cart.userId === userId ? cart.subtotalCents : 0;
    const totalsMatch = frontendSubtotalCents === backendSubtotalCents;

    // Preserve the frontend helper; use the backend total as checkout's authority.
    const getCartTotal = () => frontendSubtotalCents / 100;
    const getBackendCartTotal = () => backendSubtotalCents / 100;

    // Retry loading the cart without refreshing the entire page.
    const refreshCart = useCallback(() => {
        if (!updateInProgress.current) setReloadCount((count) => count + 1);
    }, []);

    // Apply the cart returned by checkout without sending a separate DELETE request.
    const applyServerCart = (data) => {
        if (!userId || activeUser.current !== userId || updateInProgress.current) return;
        setCart({ userId, ...data, version: reloadCount, error: null });
    };

    return (
        <CartContext.Provider value={{
            cartItems, cartLoading, cartError, isUpdating, refreshCart, applyServerCart,
            cartVersion: cart.userId === userId ? cart.cartVersion : null,
            addToCart, removeFromCart, updateQuantity,
            getCartItemsWithProduct, getCartTotal, getBackendCartTotal, totalsMatch, clearCheckout,
        }}>
            {children}
        </CartContext.Provider>
    );
}

