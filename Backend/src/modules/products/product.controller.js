import { findAllProducts, findProductById } from './product.repository.js';
import { HttpError } from '../../errors/http-error.js';

export async function getProducts(req, res) {
  const products = await findAllProducts();

  res.json({ products });
}

export async function getProduct(req, res) {
  const id = Number(req.params.id);

  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isInteger(id) || id > 4294967295) {
    throw new HttpError(400, 'Product ID must be a valid positive integer');
  }

  const product = await findProductById(id);

  if (!product) {
    throw new HttpError(404, 'Product not found');
  }

  res.json({ product });
}
