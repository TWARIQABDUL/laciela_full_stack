CREATE TABLE IF NOT EXISTS edit_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_username VARCHAR(255) NOT NULL,
    branch_id VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    record_date DATE NOT NULL,
    product_name VARCHAR(255),
    old_sold INT,
    new_sold INT,
    price DECIMAL(10,2),
    reason TEXT,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
