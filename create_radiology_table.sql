-- Create radiology table if it doesn't exist
CREATE TABLE IF NOT EXISTS radiology (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  rate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some initial radiology tests
INSERT INTO radiology (name, code, rate) VALUES
('X-Ray Chest PA View', 'R-001', 400),
('CT Scan Brain', 'R-002', 5000),
('MRI Brain', 'R-003', 12000),
('Ultrasound Abdomen', 'R-004', 2500),
('X-Ray Spine', 'R-005', 800),
('CT Scan Chest', 'R-006', 5000),
('MRI Spine', 'R-007', 14000),
('Ultrasound Pelvis', 'R-008', 2000),
('X-Ray Knee', 'R-009', 700),
('CT Scan Abdomen', 'R-010', 5500)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    rate = EXCLUDED.rate,
    updated_at = NOW(); 