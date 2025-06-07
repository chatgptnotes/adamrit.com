-- Add foreign_key column to complications table
ALTER TABLE complications
ADD COLUMN foreign_key VARCHAR(20);

-- Update existing rows with a default foreign key
UPDATE complications
SET foreign_key = 'COMP_' || id
WHERE foreign_key IS NULL;

-- Make foreign_key column NOT NULL and UNIQUE after populating data
ALTER TABLE complications
ALTER COLUMN foreign_key SET NOT NULL,
ADD CONSTRAINT complications_foreign_key_unique UNIQUE (foreign_key); 