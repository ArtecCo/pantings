-- Add the order-level discount used by the released quotation.
-- Run this after 002_order_pricing.sql.
ALTER TABLE orders
    ADD COLUMN discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER delivery_amount;
