import { createContext, useContext } from 'react';

// Shared context used by the provider and all cart consumers.
const CartContext = createContext(null);

// Read the cart state and actions supplied by CartProvider.
export function useCart() {
    const cart = useContext(CartContext);

    if (!cart) {
        throw new Error('useCart must be used inside CartProvider');
    }

    return cart;
}

export default CartContext;
