-- Existing products and new products default to a 250g package.
-- Store grams as a number so other package sizes can be supported later.
ALTER TABLE products
    ADD COLUMN package_weight_grams INT UNSIGNED NOT NULL DEFAULT 250,
    ADD CONSTRAINT chk_product_package_weight CHECK (package_weight_grams > 0);
