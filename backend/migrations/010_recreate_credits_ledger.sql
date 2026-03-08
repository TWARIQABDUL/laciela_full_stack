-- Recreate the credits table as a Deduction Ledger
CREATE TABLE IF NOT EXISTS credits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  branch_id VARCHAR(50) DEFAULT NULL,
  CONSTRAINT fk_credits_ledger_user FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE ON UPDATE CASCADE
);
