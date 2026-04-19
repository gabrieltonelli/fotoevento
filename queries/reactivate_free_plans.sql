UPDATE profiles 
SET trials_used_count = 0 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'gabrieltonelli@gmail.com');
