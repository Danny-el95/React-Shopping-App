import { createContext, useContext } from "react";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";
// import { getProductsById } from "../Data/Products";

const OrderContext = createContext(null);

function isValidOrder(order) {
    return order !== null && typeof order === "object" &&
        typeof order.id === "string" && order.id.trim().length > 0 &&
        typeof order.customerEmail === "string" && order.customerEmail.trim().length > 0 &&
        typeof order.createdAt === "string" && Number.isFinite(Date.parse(order.createdAt)) &&
        typeof order.subtotal === "number" && Number.isFinite(order.subtotal) && order.subtotal >= 0 &&
        Array.isArray(order.items) && order.items.length > 0 &&
        order.items.every(item =>
            item !== null && typeof item === "object" &&
            Number.isSafeInteger(item.productId) && item.productId > 0 &&
            typeof item.name === "string" && item.name.trim().length > 0 &&
            Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
            Number.isSafeInteger(item.unitPriceCents) && item.unitPriceCents >= 0
        );
}

export default function OrderProvider({ children }) {
    const ORDERS_KEY = "nutshop.orders.v1";

    const [orders, setOrders] = useState(() => {
        try {
            const storeOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
            return Array.isArray(storeOrders) ? storeOrders.filter(isValidOrder) : [];
        } catch (error) {
            console.error("Error loading orders from localStorage:", error);
            return [];
        }
    }); //{id: 2, quantity: 5}

    const { user } = useAuth();
    const { getCartTotal, getCartItemsWithProduct } = useCart();
    const cartItem = getCartItemsWithProduct();
    const navigate = useNavigate();


    const saveOrder = () => {
        if (!user) {
            alert("Please log in or sign up to place an order");
            navigate('/auth');
            return;
        } else {
            const order = {
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
            try {
                const storedOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
                if (!Array.isArray(storedOrders)) {
                    throw new Error("Saved order history is invalid");
                }
                if (!isValidOrder(order)) {
                    throw new Error("New order is invalid");
                }
                const updatedOrders = [...storedOrders.filter(isValidOrder), order];
                localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
                setOrders(updatedOrders);
            } catch (error) {
                console.error("Orders could not be saved:", error);
                return null;
            }
            return order;
        }

    }
    const deleteOrder = (orderId) => {
        if (!user) return false;

        try {
            const storedOrders = JSON.parse(
                localStorage.getItem(ORDERS_KEY) || "[]"
            );
            if (!Array.isArray(storedOrders)) {
                throw new Error("Saved order history is invalid");
            }

            const updatedOrders = storedOrders
                .filter(isValidOrder)
                .filter(
                    (order) =>
                        !(
                            order.id === orderId &&
                            order.customerEmail === user.email
                        )
                );
            // Persist first so a storage failure doesn't hide the order.
            localStorage.setItem(
                ORDERS_KEY,
                JSON.stringify(updatedOrders)
            );
            setOrders(updatedOrders);
            return true;
        } catch (error) {
            console.error("Order could not be deleted:", error)
            return false
        }
    };


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


    return <OrderContext.Provider value={{ orders, saveOrder, getCartTotal, deleteOrder }}>{children}</OrderContext.Provider>;
}



export function useOrder() {
    const context = useContext(OrderContext);

    return context;
}
