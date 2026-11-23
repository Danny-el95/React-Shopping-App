import { pool } from '../../db/pool.js';

function formatProduct(product) {
  // MySQL returns DECIMAL prices as strings; the frontend needs numbers.
  return {
    id: Number(product.id),
    name: product.name,
    price: Number(product.price),
    image: product.image,
    description: product.description,
  };
}

export async function findAllProducts() {
  const sql = `
    SELECT id, name, price, image, description
    FROM products
    WHERE is_active = TRUE
    ORDER BY id
  `;
  const [rows] = await pool.execute(sql);

  return rows.map(formatProduct);
}

export async function findProductById(id) {
  const sql = `
    SELECT id, name, price, image, description
    FROM products
    WHERE id = ? AND is_active = TRUE
    LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [id]);

  if (!rows[0]) return null;
  return formatProduct(rows[0]);
}
