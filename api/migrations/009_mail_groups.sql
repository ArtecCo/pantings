CREATE TABLE IF NOT EXISTS mail_groups (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    group_key VARCHAR(50) NOT NULL,
    group_name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mail_groups_key (group_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mail_group_recipients (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    mail_group_id INT UNSIGNED NOT NULL,
    recipient_name VARCHAR(160) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mail_group_recipient (mail_group_id, recipient_email),
    CONSTRAINT fk_mail_group_recipient_group FOREIGN KEY (mail_group_id) REFERENCES mail_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO mail_groups (group_key, group_name, description)
VALUES
('ORDER_UPDATES', 'Order Updates', 'Recipients notified when customer orders are created or updated.'),
('SYSTEM_UPDATES', 'System Updates', 'Recipients for system and security notifications.')
ON DUPLICATE KEY UPDATE group_name=VALUES(group_name), description=VALUES(description);
