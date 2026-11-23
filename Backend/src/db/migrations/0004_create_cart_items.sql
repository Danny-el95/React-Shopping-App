CREATE TABLE cart_items (
    -- Match the ID types in the users and products tables exactly.
    user_id BIGINT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,

    -- Each user can have only one cart row for a given product.
    PRIMARY KEY (user_id, product_id),

    -- Index the product foreign key; user_id is already indexed by the primary key.
    KEY idx_cart_items_product_id (product_id),

    -- A zero quantity should remove the item instead of leaving an empty row.
    CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0),

    -- Remove cart rows automatically if their user or product is deleted.
    CONSTRAINT fk_cart_items_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
