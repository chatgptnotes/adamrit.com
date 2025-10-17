-- =====================================================
-- SUPPLIERS TABLE - Complete Migration
-- =====================================================

-- Create suppliers table with all fields
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_code VARCHAR(100) NOT NULL UNIQUE,
    supplier_type VARCHAR(100),
    phone VARCHAR(50),
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    email VARCHAR(255),
    pin VARCHAR(20),
    dl_no VARCHAR(255),
    account_group VARCHAR(100),
    cst VARCHAR(100),
    s_tax_no VARCHAR(100),
    address TEXT,
    credit_day INTEGER DEFAULT 0,
    bank_or_branch VARCHAR(255),
    mobile VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster search and lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(supplier_type);

-- Add comments for documentation
COMMENT ON TABLE suppliers IS 'Master table for supplier information - stores all supplier/vendor details';
COMMENT ON COLUMN suppliers.supplier_name IS 'Full name of the supplier company';
COMMENT ON COLUMN suppliers.supplier_code IS 'Unique code identifier for the supplier';
COMMENT ON COLUMN suppliers.supplier_type IS 'Type of supplier: Distributor, Wholesaler, or Retailer';
COMMENT ON COLUMN suppliers.credit_limit IS 'Maximum credit amount allowed for this supplier';
COMMENT ON COLUMN suppliers.credit_day IS 'Number of days credit period allowed';
COMMENT ON COLUMN suppliers.dl_no IS 'Drug License Number';
COMMENT ON COLUMN suppliers.cst IS 'Central Sales Tax Number';
COMMENT ON COLUMN suppliers.s_tax_no IS 'Service Tax Number';
COMMENT ON COLUMN suppliers.account_group IS 'Account grouping: Pharmacy or General';

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();

-- =====================================================
-- SAMPLE DATA INSERT
-- =====================================================

-- Example: Insert sample supplier data
-- You can use this as a template for inserting your data

INSERT INTO suppliers (
    supplier_name,
    supplier_code,
    supplier_type,
    phone,
    credit_limit,
    email,
    pin,
    dl_no,
    account_group,
    cst,
    s_tax_no,
    address,
    credit_day,
    bank_or_branch,
    mobile
) VALUES (
    'dfgdf',                    -- supplier_name
    'SUP001',                   -- supplier_code (make this unique for each supplier)
    'Distributor',              -- supplier_type (Distributor, Wholesaler, or Retailer)
    '1234567890',              -- phone
    50000.00,                  -- credit_limit
    'supplier@example.com',    -- email
    '123456',                  -- pin
    'DL123456',                -- dl_no
    'Pharmacy',                -- account_group (Pharmacy or General)
    'sdf',                     -- cst
    'ST123456',                -- s_tax_no
    'Sample Address Line 1',   -- address
    30,                        -- credit_day
    'Sample Bank Name',        -- bank_or_branch
    '9876543210'              -- mobile
);

-- =====================================================
-- VERIFY DATA
-- =====================================================

-- Check if table was created successfully
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_name = 'suppliers'
ORDER BY
    ordinal_position;

-- View all suppliers
SELECT * FROM suppliers ORDER BY created_at DESC;

-- =====================================================
-- USEFUL QUERIES FOR SUPPLIER MANAGEMENT
-- =====================================================

-- Search suppliers by name or code
-- SELECT * FROM suppliers
-- WHERE supplier_name ILIKE '%search_term%'
--    OR supplier_code ILIKE '%search_term%'
-- ORDER BY supplier_name;

-- Get suppliers with pagination (15 per page)
-- SELECT * FROM suppliers
-- ORDER BY supplier_name
-- LIMIT 15 OFFSET 0;

-- Update a supplier
-- UPDATE suppliers
-- SET
--     supplier_name = 'New Name',
--     phone = '1234567890'
-- WHERE id = 1;

-- Delete a supplier
-- DELETE FROM suppliers WHERE id = 1;

-- Count total suppliers
-- SELECT COUNT(*) FROM suppliers;
