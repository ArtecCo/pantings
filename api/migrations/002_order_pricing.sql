-- Order pricing lifecycle: customer submits the base artwork value first;
-- the artist/admin releases the final quotation after acceptance.
ALTER TABLE orders
    ADD COLUMN base_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER subtotal,
    ADD COLUMN customization_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER base_amount,
    ADD COLUMN delivery_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER customization_amount,
    ADD COLUMN discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER delivery_amount,
    ADD COLUMN price_released_at DATETIME NULL AFTER delivered_at,
    ADD COLUMN price_released_by INT NULL AFTER price_released_at,
    ADD COLUMN payment_link VARCHAR(1000) NULL AFTER price_released_by;

-- Existing orders retain their recorded subtotal as the original/base value.
UPDATE orders SET base_amount = subtotal WHERE base_amount = 0.00;
