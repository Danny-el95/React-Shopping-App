import { createContext, useContext } from 'react';

const OrderContext = createContext(null);

export function useOrder() {
    const orders = useContext(OrderContext);
    if (!orders) throw new Error('useOrder must be used inside OrderProvider');
    return orders;
}

export default OrderContext;
