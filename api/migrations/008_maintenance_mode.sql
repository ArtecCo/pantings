INSERT INTO system_settings (setting_key, setting_value)
VALUES ('maintenance_mode', '0')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);