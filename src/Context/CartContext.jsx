import { createContext, useContext } from "react";
import { useState } from "react";
import { getProductsById } from "../Data/Products";

const CartContext = createContext(null);

export default function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]); //{id: 2. Quantity: 5}

    const addToCart = (productId) => {
        const existing = cartItems.find((item) => item.id === productId)
        if (existing) {
            const currentQuantity = existing.quantity;
            const updatedCartItems = cartItems.map((item) => item.id === productId
                ? { id: productId, quantity: currentQuantity + 1 }
                : item
            );
            setCartItems(updatedCartItems);
        } else {
            setCartItems([...cartItems, { id: productId, quantity: 1 }])
        }

    }

    const getCartItemsWithProduct = () => {
        return cartItems.map(item => ({
            ...item,
            product: getProductsById(item.id)
        })).filter(item => item.product);
    }

    const removeFromCart = (productId) => {
        setCartItems(cartItems.filter((item) => item.id !== productId))
    }

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCartItems(
            cartItems.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    }

    const getCartTotal = () => {
        const total = cartItems.reduce((total, item) => {
            const product = getProductsById(item.id);
            return total + (product ? product.price * item.quantity : 0);
        }, 0)
        return total;
    }

    const clearCheckout = () => {
        setCartItems([]);
    }


    return <CartContext.Provider value={{ cartItems, addToCart, getCartItemsWithProduct, removeFromCart, updateQuantity, getCartTotal, clearCheckout }}>{children}</CartContext.Provider>;
}



export function useCart() {
    const context = useContext(CartContext);

    return context;
}