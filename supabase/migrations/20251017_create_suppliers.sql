-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_code VARCHAR(100) NOT NULL UNIQUE,
    supplier_type VARCHAR(100),
    phone VARCHAR(50),
    credit_limit DECIMAL(15, 2),
    email VARCHAR(255),
    pin VARCHAR(20),
    dl_no VARCHAR(255),
    account_group VARCHAR(100),
    cst VARCHAR(100),
    s_tax_no VARCHAR(100),
    address TEXT,
    credit_day INTEGER,
    bank_or_branch VARCHAR(255),
    mobile VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster search
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code);

-- Add comment
COMMENT ON TABLE suppliers IS 'Master table for supplier information';
