CREATE TABLE orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    -- One checkout attempt can create only one order for this user.
    request_key CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    cart_version CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    customer_email VARCHAR(254) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'placed',
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    subtotal_cents BIGINT UNSIGNED NOT NULL,
    total_cents BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    -- Archiving hides history without destroying purchase records.
    archived_at DATETIME(3) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_orders_request (user_id, request_key),
    KEY idx_orders_history (user_id, archived_at, id),
    CONSTRAINT chk_orders_amounts CHECK (
        subtotal_cents <= 9007199254740991 AND
        total_cents >= subtotal_cents AND total_cents <= 9007199254740991
    ),
    -- Keep historical orders if an account-deletion feature is added later.
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
