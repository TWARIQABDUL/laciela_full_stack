-- Drop requester_username from edit_requests since we now use requester_user_id FK for all lookups
ALTER TABLE edit_requests DROP COLUMN requester_username;
