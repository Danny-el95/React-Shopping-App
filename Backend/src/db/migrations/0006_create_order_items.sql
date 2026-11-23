CREATE TABLE order_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NULL,
    -- Snapshot these values: product edits must never rewrite purchase history.
    product_name VARCHAR(150) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price_cents BIGINT UNSIGNED NOT NULL,
    line_total_cents BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_order_items_product (order_id, product_id),
    KEY idx_order_items_product (product_id),
    CONSTRAINT chk_order_items_amounts CHECK (
        quantity > 0 AND unit_price_cents <= 9007199254740991 AND
        line_total_cents <= 9007199254740991
    ),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT,
    -- A deleted product leaves the item's saved name and price intact.
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
