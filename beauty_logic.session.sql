ALTER TABLE usuarios
ADD COLUMN codigo_recuperacao VARCHAR(6) NULL,
ADD COLUMN expiracao_codigo DATETIME NULL;