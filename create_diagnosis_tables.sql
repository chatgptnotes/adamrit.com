-- Create diagnosis table
CREATE TABLE IF NOT EXISTS diagnosis (
    id SERIAL PRIMARY KEY,
    diagnosis_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    icd_code VARCHAR(20),
    category VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    package_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(300) NOT NULL,
    description TEXT,
    base_amount DECIMAL(10,2),
    category VARCHAR(100),
    duration_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create complications table
CREATE TABLE IF NOT EXISTS complications (
    id SERIAL PRIMARY KEY,
    complication_code VARCHAR(20) UNIQUE NOT NULL,
    foreign_key VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(300) NOT NULL,
    description TEXT,
    severity VARCHAR(50), -- mild, moderate, severe, critical
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create diagnosis_complications mapping table
CREATE TABLE IF NOT EXISTS diagnosis_complications (
    id SERIAL PRIMARY KEY,
    diagnosis_id INTEGER REFERENCES diagnosis(id) ON DELETE CASCADE,
    complication_id INTEGER REFERENCES complications(id) ON DELETE CASCADE,
    probability VARCHAR(50), -- high, medium, low
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(diagnosis_id, complication_id)
);

-- Create patient_diagnosis table
CREATE TABLE IF NOT EXISTS patient_diagnosis (
    id SERIAL PRIMARY KEY,
    patient_unique_id VARCHAR(255) NOT NULL,
    diagnosis_id INTEGER REFERENCES diagnosis(id) ON DELETE CASCADE,
    visit_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, resolved, chronic
    diagnosed_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create patient_complications table
CREATE TABLE IF NOT EXISTS patient_complications (
    id SERIAL PRIMARY KEY,
    patient_unique_id VARCHAR(255) NOT NULL,
    complication_id INTEGER REFERENCES complications(id) ON DELETE CASCADE,
    diagnosis_id INTEGER REFERENCES diagnosis(id),
    visit_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, resolved, monitoring
    occurred_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert sample diagnosis data
INSERT INTO diagnosis (diagnosis_code, name, icd_code, category, description) VALUES
('DG001', 'Type 2 Diabetes Mellitus', 'E11', 'Endocrine', 'A chronic condition that affects the way your body metabolizes sugar'),
('DG002', 'Essential Hypertension', 'I10', 'Cardiovascular', 'High blood pressure without known cause'),
('DG003', 'Acute Myocardial Infarction', 'I21', 'Cardiovascular', 'Heart attack due to blocked coronary artery'),
('DG004', 'Chronic Kidney Disease', 'N18', 'Renal', 'Progressive loss of kidney function over time'),
('DG005', 'Asthma', 'J45', 'Respiratory', 'Chronic inflammatory disease of the airways'),
('DG006', 'Pneumonia', 'J18', 'Respiratory', 'Infection that inflames air sacs in lungs'),
('DG007', 'Gastroesophageal Reflux Disease', 'K21', 'Gastrointestinal', 'Chronic digestive disease'),
('DG008', 'Osteoarthritis', 'M15', 'Musculoskeletal', 'Degenerative joint disease'),
('DG009', 'Depression', 'F32', 'Mental Health', 'Mental health disorder characterized by persistent sadness'),
('DG010', 'Hypothyroidism', 'E03', 'Endocrine', 'Underactive thyroid condition');

-- Insert sample packages data
INSERT INTO packages (package_code, name, description, base_amount, category, duration_days) VALUES
('PKG001', 'Basic Cardiac Package', 'Basic cardiac monitoring and treatment', 25000.00, 'Cardiovascular', 3),
('PKG002', 'Diabetes Management Package', 'Comprehensive diabetes care and monitoring', 15000.00, 'Endocrine', 5),
('PKG003', 'Respiratory Care Package', 'Complete respiratory treatment and monitoring', 18000.00, 'Respiratory', 4),
('PKG004', 'Renal Care Package', 'Kidney function monitoring and treatment', 22000.00, 'Renal', 7),
('PKG005', 'General Surgery Package', 'Standard surgical procedures and recovery', 35000.00, 'Surgery', 2),
('PKG006', 'Emergency Care Package', 'Emergency treatment and stabilization', 12000.00, 'Emergency', 1),
('PKG007', 'Psychiatric Care Package', 'Mental health evaluation and treatment', 8000.00, 'Mental Health', 3);

-- Insert sample complications data
INSERT INTO complications (complication_code, foreign_key, name, description, severity, category) VALUES
('CP001', 'CP001', 'Diabetic Ketoacidosis', 'Life-threatening complication of diabetes', 'critical', 'Metabolic'),
('CP002', 'CP002', 'Hypertensive Crisis', 'Severe increase in blood pressure', 'severe', 'Cardiovascular'),
('CP003', 'CP003', 'Cardiogenic Shock', 'Heart unable to pump enough blood', 'critical', 'Cardiovascular'),
('CP004', 'CP004', 'Acute Kidney Injury', 'Sudden episode of kidney failure', 'severe', 'Renal'),
('CP005', 'CP005', 'Respiratory Failure', 'Lungs cannot provide enough oxygen', 'critical', 'Respiratory'),
('CP006', 'CP006', 'Sepsis', 'Body response to infection', 'severe', 'Infectious'),
('CP007', 'CP007', 'Bleeding', 'Excessive blood loss', 'moderate', 'Hematologic'),
('CP008', 'CP008', 'Infection', 'Bacterial or viral infection', 'mild', 'Infectious'),
('CP009', 'CP009', 'Deep Vein Thrombosis', 'Blood clot in deep vein', 'moderate', 'Vascular'),
('CP010', 'CP010', 'Pneumothorax', 'Collapsed lung', 'moderate', 'Respiratory');

-- Insert sample diagnosis-complications relationships
INSERT INTO diagnosis_complications (diagnosis_id, complication_id, probability) VALUES
(1, 1, 'high'),    -- Diabetes -> Diabetic Ketoacidosis
(1, 4, 'medium'),  -- Diabetes -> Acute Kidney Injury
(2, 2, 'high'),    -- Hypertension -> Hypertensive Crisis
(2, 3, 'medium'),  -- Hypertension -> Cardiogenic Shock
(3, 3, 'high'),    -- MI -> Cardiogenic Shock
(3, 7, 'medium'),  -- MI -> Bleeding
(4, 4, 'high'),    -- CKD -> Acute Kidney Injury
(5, 5, 'medium'),  -- Asthma -> Respiratory Failure
(6, 5, 'high'),    -- Pneumonia -> Respiratory Failure
(6, 6, 'medium');  -- Pneumonia -> Sepsis 