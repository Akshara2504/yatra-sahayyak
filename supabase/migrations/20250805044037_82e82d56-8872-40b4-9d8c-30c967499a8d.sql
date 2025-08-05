-- Create edge function for ticket generation and SMS sending
-- This migration ensures proper constraints for the existing tickets table

-- Add constraint to ensure scan_count doesn't exceed 2
ALTER TABLE tickets 
ADD CONSTRAINT ticket_scan_limit CHECK (scan_count <= 2);

-- Add index for faster QR code lookups
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);

-- Add index for ticket status
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);