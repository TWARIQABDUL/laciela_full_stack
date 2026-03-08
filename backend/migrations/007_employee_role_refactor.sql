-- 1. Add payment column to users table
ALTER TABLE users ADD COLUMN payment DECIMAL(10,2) DEFAULT 0;

-- 2. Port existing payment back to users (if linked via user_id)
UPDATE users u
JOIN credits c ON u.userId = c.user_id
SET u.payment = c.payment
WHERE c.user_id IS NOT NULL;

-- 3. Update employee_loans to point to users(userId) instead of credits(id)
-- First, if any loan points to a credit that has a user_id, update it
UPDATE employee_loans el
JOIN credits c ON el.employee_id = c.id
SET el.employee_id = c.user_id
WHERE c.user_id IS NOT NULL;

-- If a loan points to a credit with NO user_id, we can't reliably map it to users.
-- We will delete orphaned loans to maintain referential integrity.
DELETE FROM employee_loans WHERE employee_id NOT IN (SELECT userId FROM users);

-- Optional: add a foreign key to ensure employee_id always maps to users.userId
ALTER TABLE employee_loans
  ADD CONSTRAINT fk_employee_loans_user
  FOREIGN KEY (employee_id) REFERENCES users(userId)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 4. Drop the credits table entirely, as all staff are now simply "Users" with a payment column and EMPLOYEE role
DROP TABLE IF EXISTS credits;
