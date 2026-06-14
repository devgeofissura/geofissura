-- Corrige tipo da coluna uuid de UUID para VARCHAR(50)
-- O uuid é o identificador do sensor no mundo real (ex: GF-000001)
ALTER TABLE sensores ALTER COLUMN uuid TYPE VARCHAR(50) USING uuid::varchar(50);
ALTER TABLE sensores ALTER COLUMN uuid DROP DEFAULT;
