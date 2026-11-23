import { HttpError } from '../../errors/http-error.js';
import { getCartSummary, addItemToCart, setCartQuantity, removeItemFromCart, emptyCart } from './cart.service.js';

// Validate product IDs from either the URL or a JSON request body.
function readProductId(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new HttpError(400, 'A valid product ID is required');
  }

  const id = Number(value);
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isInteger(id) || id > 4294967295) {
    throw new HttpError(400, 'Product ID must be a valid positive integer');
  }

  return id;
}

// Return the saved cart and its backend-calculated subtotal in cents.
export async function getCart(req, res) {
  const cart = await getCartSummary(req.user.id);
  res.json(cart);
}

// Add one active product and return the updated cart.
export async function addItem(req, res) {
  const productId = readProductId(req.body?.productId);

  const cart = await addItemToCart(req.user.id, productId);
  res.json(cart);
}

// Set a positive quantity; use DELETE to remove the item instead of sending zero.
export async function updateItem(req, res) {
  const productId = readProductId(req.params.productId);
  const quantity = req.body?.quantity;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 4294967295) {
    throw new HttpError(400, 'Quantity must be a positive whole number up to 4294967295');
  }

  const cart = await setCartQuantity(req.user.id, productId, quantity);

  res.json(cart);
}

// Remove an item and return the remaining cart, even if it was already removed.
export async function removeItem(req, res) {
  const productId = readProductId(req.params.productId);
  const cart = await removeItemFromCart(req.user.id, productId);
  res.json(cart);
}

// Clear the database cart, not just the frontend's temporary state.
export async function clearCart(req, res) {
  const cart = await emptyCart(req.user.id);
  res.json(cart);
}
