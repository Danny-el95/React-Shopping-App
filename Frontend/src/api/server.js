import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    timeout: 15000,
    withCredentials: true,
});

// Identify protected requests started before a login/logout change.
let sessionVersion = 0;

export function invalidateSessionRequests() {
    sessionVersion += 1;
}

api.interceptors.request.use((config) => {
    config.sessionVersion = sessionVersion;
    return config;
});

api.interceptors.response.use(
    (response) => {
        if (response.config.requiresAuth && response.config.sessionVersion !== sessionVersion) {
            throw new axios.CanceledError('The login session changed');
        }
        return response;
    },
    (error) => {
        const config = error.config;
        if (config?.requiresAuth && config.sessionVersion !== sessionVersion) {
            return Promise.reject(new axios.CanceledError('The login session changed'));
        }

        // Invalid login credentials are not session expiry: only protected calls emit this.
        if (config?.requiresAuth && error.response?.status === 401 && typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:expired'));
        }
        return Promise.reject(error);
    },
);

// Send registration details to the backend and return its response data.
// The calling form can catch errors and show a message to the user.
export async function registerUser({ username, email, password }) {
    const response = await api.post('/auth/register', {
        username,
        email,
        password,
    });
    return response;
}

export async function loginUser({ email, password }) {
    const response = await api.post('/auth/login', { email, password });

    return response;
}

export async function getCurrentUser() {
    return api.get('/auth/me');
}

export async function logoutUser() {
    return api.post('/auth/logout');
}

export async function fetchProducts() {
    const { data } = await api.get('/products');
    return data.products;
}

export async function fetchProductsById(id) {
    const { data } = await api.get(`/products/${id}`);
    return data.product;
}

// Fetch the logged-in user's cart, including current product details.
export async function fetchCart() {
    const { data } = await api.get('/cart', { requiresAuth: true });
    return data;
}

// Add one product, or increase its quantity if it is already in the cart.
export async function addCartItem(productId) {
    const { data } = await api.post('/cart/items', { productId }, { requiresAuth: true });
    return data;
}

// Set a cart item's quantity to a positive whole number.
export async function updateCartItem(productId, quantity) {
    const { data } = await api.patch(`/cart/items/${productId}`, { quantity }, { requiresAuth: true });
    return data;
}

// Remove one product and return the remaining cart.
export async function deleteCartItem(productId) {
    const { data } = await api.delete(`/cart/items/${productId}`, { requiresAuth: true });
    return data;
}

// Empty the logged-in user's cart and return { items: [] }.
export async function clearCart() {
    const { data } = await api.delete('/cart', { requiresAuth: true });
    return data;
}

// Order history and checkout use the same HTTP-only login cookie as the cart.
export async function fetchOrders(params = {}) {
    const { data } = await api.get('/orders', { params, requiresAuth: true });
    return data;
}

export async function fetchOrderById(id) {
    const { data } = await api.get(`/orders/${encodeURIComponent(id)}`, { requiresAuth: true });
    return data.order;
}

export async function createOrder(details) {
    const { data } = await api.post('/orders', details, { requiresAuth: true });
    return data;
}

export async function archiveOrder(id) {
    const { data } = await api.patch(`/orders/${encodeURIComponent(id)}/archive`, {}, { requiresAuth: true });
    return data.order;
}

