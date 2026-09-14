-- Preserve customer email/address and the selected size on submitted orders.
ALTER TABLE orders
    ADD COLUMN customer_email VARCHAR(255) NULL AFTER shipping_phone,
    ADD COLUMN shipping_address TEXT NULL AFTER customer_email;

ALTER TABLE order_items
    ADD COLUMN size_option_id INT UNSIGNED NULL AFTER painting_id,
    ADD COLUMN size_name VARCHAR(120) NULL AFTER size_option_id,
    ADD COLUMN size_width DECIMAL(10,2) NULL AFTER size_name,
    ADD COLUMN size_height DECIMAL(10,2) NULL AFTER size_width,
    ADD COLUMN size_unit VARCHAR(12) NULL AFTER size_height;

ALTER TABLE order_items
    ADD KEY idx_order_items_size_option (size_option_id),
    ADD CONSTRAINT fk_order_items_size_option
        FOREIGN KEY (size_option_id) REFERENCES painting_size_options(id) ON DELETE SET NULL;
