-- Assign all existing Company Formation leads to Ajwa
UPDATE leads
SET contact_owner = 'Ajwa', updated_at = now()
WHERE funnel = 'Company Formation';
