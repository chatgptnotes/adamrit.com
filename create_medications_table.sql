-- Create medications table if it doesn't exist
CREATE TABLE IF NOT EXISTS medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    dosage VARCHAR(100),
    route VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);

-- Sample medication data
INSERT INTO medications (name, code, dosage, route) VALUES
('Amoxicillin', 'MED001', '500mg', 'Oral'),
('Paracetamol', 'MED002', '650mg', 'Oral'),
('Ibuprofen', 'MED003', '400mg', 'Oral'),
('Omeprazole', 'MED004', '20mg', 'Oral'),
('Metformin', 'MED005', '500mg', 'Oral'),
('Amlodipine', 'MED006', '5mg', 'Oral'),
('Aspirin', 'MED007', '75mg', 'Oral'),
('Atorvastatin', 'MED008', '10mg', 'Oral'),
('Losartan', 'MED009', '50mg', 'Oral'),
('Metoprolol', 'MED010', '25mg', 'Oral'),
('Ceftriaxone', 'MED011', '1g', 'Intravenous'),
('Morphine', 'MED012', '10mg', 'Intravenous'),
('Ondansetron', 'MED013', '4mg', 'Intravenous'),
('Furosemide', 'MED014', '40mg', 'Intravenous'),
('Insulin Regular', 'MED015', '100 IU/mL', 'Subcutaneous'),
('Enoxaparin', 'MED016', '40mg', 'Subcutaneous'),
('Salbutamol', 'MED017', '100mcg/puff', 'Inhalation'),
('Budesonide', 'MED018', '200mcg/puff', 'Inhalation'),
('Betamethasone', 'MED019', '0.1%', 'Topical'),
('Ciprofloxacin', 'MED020', '0.3%', 'Eye Drops')
ON CONFLICT (id) DO NOTHING; 