-- Remove the development server origin; preserve filenames and product IDs.
-- Already-relative paths and images hosted elsewhere remain unchanged.
UPDATE products
SET image = SUBSTRING(image, CHAR_LENGTH('http://localhost:8080') + 1)
WHERE image LIKE 'http://localhost:8080/images/products/%';
