-- Preserve the selected painting size on cart items so size-specific prices remain intact.
ALTER TABLE cart_items
    ADD COLUMN size_option_id INT UNSIGNED NULL AFTER painting_id,
    ADD KEY idx_cart_items_size_option (size_option_id),
    ADD CONSTRAINT fk_cart_items_size_option
        FOREIGN KEY (size_option_id) REFERENCES painting_size_options(id) ON DELETE SET NULL;
