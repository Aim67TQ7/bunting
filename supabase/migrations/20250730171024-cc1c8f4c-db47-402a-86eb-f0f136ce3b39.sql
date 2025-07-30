-- Fix the malformed URL in the reports table for Operations Dashboard
UPDATE reports 
SET url = 'https://shipclerk.buntinggpt.com?token=shipclerk-secure-2024'
WHERE name = 'Operations Dashboard' 
AND url = 'https://shipclerk.buntinggpt.com.?token=shipclerk-secure-2024';