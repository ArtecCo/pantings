-- Multiple size/price options per painting.
-- One option is marked as the standard size; the existing paintings.price/width/height
-- columns remain synchronized with that standard option for backward compatibility.
CREATE TABLE painting_size_options (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    painting_id INT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    width DECIMAL(10,2) NOT NULL,
    height DECIMAL(10,2) NOT NULL,
    unit VARCHAR(12) NOT NULL DEFAULT 'in',
    price DECIMAL(12,2) NOT NULL,
    is_standard TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_painting_size_options_painting (painting_id),
    CONSTRAINT fk_painting_size_options_painting
        FOREIGN KEY (painting_id) REFERENCES paintings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO painting_size_options (painting_id, name, width, height, unit, price, is_standard, sort_order)
SELECT id, CONCAT(width, ' × ', height, ' in'), width, height, 'in', price, 1, 0
FROM paintings
WHERE width IS NOT NULL AND height IS NOT NULL AND price IS NOT NULL;
