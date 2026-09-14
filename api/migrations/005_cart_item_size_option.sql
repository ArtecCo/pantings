-- Preserve the selected painting size on cart items so size-specific prices remain intact.
-- Run this migration only after 004_painting_size_options.sql has completed successfully.
-- size_option_id uses the exact type of painting_size_options.id to keep the FK valid.
SET @size_option_id_type = (
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'painting_size_options'
      AND COLUMN_NAME = 'id'
    LIMIT 1
);

SET @add_column_sql = CONCAT(
    'ALTER TABLE cart_items ',
    'ADD COLUMN size_option_id ', @size_option_id_type, ' NULL AFTER painting_id'
);

PREPARE add_size_option_column FROM @add_column_sql;
EXECUTE add_size_option_column;
DEALLOCATE PREPARE add_size_option_column;

ALTER TABLE cart_items
    ADD KEY idx_cart_items_size_option (size_option_id),
    ADD CONSTRAINT fk_cart_items_size_option
        FOREIGN KEY (size_option_id) REFERENCES painting_size_options(id) ON DELETE SET NULL;
