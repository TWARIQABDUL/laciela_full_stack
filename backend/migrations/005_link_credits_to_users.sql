-- Add user_id (FK to users) to credits table
ALTER TABLE credits ADD COLUMN user_id INT DEFAULT NULL;

-- Add FK constraint
ALTER TABLE credits
  ADD CONSTRAINT fk_credits_user
  FOREIGN KEY (user_id) REFERENCES users(userId)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Add requester_user_id to edit_requests so we can directly join on user_id for deductions
ALTER TABLE edit_requests ADD COLUMN requester_user_id INT DEFAULT NULL;

ALTER TABLE edit_requests
  ADD CONSTRAINT fk_edit_requests_user
  FOREIGN KEY (requester_user_id) REFERENCES users(userId)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
