import { createContext, useContext } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";
// import { getProductsById } from "../Data/Products";

const OrderContext = createContext(null);

export default function OrderProvider({ children }) {
    const ORDERS_KEY = "nutshop.orders.v1";

    const [orders, setOrders] = useState(() => {
        try {
            const storeOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
            return Array.isArray(storeOrders) ? storeOrders : [];
        } catch (error) {
            console.error("Error loading orders from localStorage:", error);
            return [];
        }
    }); //{id: 2, quantity: 5}

    useEffect(() => {
        try {
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        } catch (error) {
            console.error("Orders could not be saved:", error);
        }
    }, [orders]);

    const { user } = useAuth();
    const { getCartTotal, getCartItemsWithProduct } = useCart();
    const cartItem = getCartItemsWithProduct();
    const navigate = useNavigate();

    const saveOrder = () => {
        if (!user) {
            alert("Please log in or sign up to place an order");
            navigate('/auth');
            return;
        }else {
            const order =  {
                id: crypto.randomUUID(),
                customerEmail: user.email,
                items: cartItem.map(({ product, quantity }) => ({
                    productId: product.id,
                    name: product.name,
                    quantity,
                    unitPriceCents: Math.round(product.price * 100),
                })),
                subtotal: getCartTotal(),
                createdAt: new Date().toISOString(),
            }
            setOrders((previous) => [...previous, order]);
            return order;
        }
    }
    

    // const addToCart = (productId) => {
    //     const existing = cartItems.find((item) => item.id === productId)
    //     if (existing) {
    //         const currentQuantity = existing.quantity;
    //         const updatedCartItems = cartItems.map((item) => item.id === productId
    //             ? { id: productId, quantity: currentQuantity + 1 }
    //             : item
    //         );
    //         setCartItems(updatedCartItems);
    //     } else {
    //         setCartItems([...cartItems, { id: productId, quantity: 1 }])
    //     }

    // }

    // const getCartItemsWithProduct = () => {
    //     return cartItems.map(item => ({
    //         ...item,
    //         product: getProductsById(item.id)
    //     })).filter(item => item.product);
    // }

    // const removeFromCart = (productId) => {
    //     setCartItems(cartItems.filter((item) => item.id !== productId))
    // }



    // const clearCheckout = () => {
    //     setCartItems([]);
    // }


    return <OrderContext.Provider value={{ orders, saveOrder, getCartTotal }}>{children}</OrderContext.Provider>;
}



export function useOrder() {
    const context = useContext(OrderContext);

    return context;
}
