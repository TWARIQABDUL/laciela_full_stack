-- Drop the foreign key referencing the obsolete employees table
ALTER TABLE employee_loans DROP FOREIGN KEY employee_loans_ibfk_1;

-- Drop the obsolete employees table
DROP TABLE IF EXISTS employees;
