-- Add NABH Bhopal and Non-NABH Bhopal columns to mandatory_services table
ALTER TABLE public.mandatory_services
ADD COLUMN IF NOT EXISTS nabh_bhopal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS non_nabh_bhopal DECIMAL(10,2);

-- Add comments for documentation
COMMENT ON COLUMN public.mandatory_services.nabh_bhopal IS 'Rate for NABH Bhopal payments';
COMMENT ON COLUMN public.mandatory_services.non_nabh_bhopal IS 'Rate for Non-NABH Bhopal payments';
