-- Migration: Add tally_bank_statements and tally_gst_data tables
-- For Bank Reconciliation (Item 7) and GST Data Sync (Item 10)

-- Bank Statements table for reconciliation
CREATE TABLE IF NOT EXISTS tally_bank_statements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_ledger TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  reference TEXT,
  deposit DECIMAL(15,2) DEFAULT 0,
  withdrawal DECIMAL(15,2) DEFAULT 0,
  balance DECIMAL(15,2),
  matched_voucher_id UUID REFERENCES tally_vouchers(id),
  match_status TEXT DEFAULT 'unmatched', -- matched, unmatched
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tally_bank_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on tally_bank_statements" ON tally_bank_statements FOR ALL USING (true);
CREATE INDEX idx_bank_stmt_date ON tally_bank_statements(date);
CREATE INDEX idx_bank_stmt_bank ON tally_bank_statements(bank_ledger);

-- GST Data table for cached GST reports
CREATE TABLE IF NOT EXISTS tally_gst_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL, -- gstr1, gstr3b, gst_ledger
  period_from DATE,
  period_to DATE,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tally_gst_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on tally_gst_data" ON tally_gst_data FOR ALL USING (true);
