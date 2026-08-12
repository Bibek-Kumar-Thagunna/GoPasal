-- One-time repair: shops marked ACTIVE by admin before KYC sync fix.
-- Run: psql $DATABASE_URL -f backend/scripts/fix-approved-store-kyc.sql

UPDATE stores
SET
  verification_step = 'APPROVED',
  kyc_status = 'APPROVED',
  verification_reviewed_at = COALESCE(verification_reviewed_at, NOW()),
  is_open = true,
  updated_at = NOW()
WHERE status = 'ACTIVE'
  AND verification_step IS DISTINCT FROM 'APPROVED';
