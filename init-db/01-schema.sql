SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE='ANSI_QUOTES';
CREATE TABLE "bar_products" (
  "id" int NOT NULL AUTO_INCREMENT,
  "name" varchar(255) NOT NULL,
  "initial_price" decimal(10,2) DEFAULT NULL,
  "price" decimal(10,2) DEFAULT NULL,
  "opening_stock" int DEFAULT NULL,
  "entree" int DEFAULT '0',
  "sold" int DEFAULT '0',
  "date" date NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "name_date_unique" ("name","date"),
  UNIQUE KEY "unique_product_per_day" ("name","date")
);

CREATE TABLE "billiard" (
  "id" int NOT NULL AUTO_INCREMENT,
  "date" date NOT NULL,
  "token" int DEFAULT '0',
  "cash" decimal(12,2) DEFAULT '0.00',
  "cash_momo" decimal(12,2) DEFAULT '0.00',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "branch" (
  "id" varchar(50) NOT NULL,
  "branchName" varchar(100) NOT NULL,
  "region" varchar(100) NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "id" ("id")
);

CREATE TABLE "credits" (
  "id" int NOT NULL AUTO_INCREMENT,
  "name" varchar(100) NOT NULL,
  "payment" decimal(15,2) NOT NULL DEFAULT '0.00',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "employee_loans" (
  "id" int NOT NULL AUTO_INCREMENT,
  "employee_id" int NOT NULL,
  "amount" decimal(12,2) NOT NULL,
  "reason" text,
  "loan_date" date NOT NULL,
  "total_paid" decimal(12,2) DEFAULT '0.00',
  "remaining" decimal(12,2) DEFAULT '0.00',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  KEY "employee_id" ("employee_id"),
  CONSTRAINT "employee_loans_ibfk_1" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE
);

CREATE TABLE "employees" (
  "id" int NOT NULL AUTO_INCREMENT,
  "name" varchar(255) NOT NULL,
  "phone" varchar(100) DEFAULT NULL,
  "position" varchar(100) DEFAULT NULL,
  "salary" decimal(12,2) DEFAULT '0.00',
  "total_loan" decimal(15,2) DEFAULT '0.00',
  "total_remaining" decimal(15,2) DEFAULT '0.00',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "expenses" (
  "id" int NOT NULL AUTO_INCREMENT,
  "expense_name" varchar(150) NOT NULL,
  "amount" decimal(15,2) NOT NULL,
  "cost" decimal(15,2) NOT NULL DEFAULT '0.00',
  "date" date NOT NULL,
  "category" enum('bar','kitchen','unprofitable') NOT NULL,
  "is_profit" tinyint NOT NULL DEFAULT '1',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "guesthouse" (
  "id" int NOT NULL AUTO_INCREMENT,
  "date" date NOT NULL,
  "vip" int DEFAULT '0',
  "normal" int DEFAULT '0',
  "status" varchar(20) DEFAULT 'Available',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "vip_price" decimal(10,2) DEFAULT '0.00',
  "normal_price" decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY ("id")
);

CREATE TABLE "gym" (
  "id" int NOT NULL AUTO_INCREMENT,
  "date" date NOT NULL,
  "daily_people" int DEFAULT '0',
  "monthly_people" int DEFAULT '0',
  "total_people" int DEFAULT '0',
  "cash" decimal(12,2) DEFAULT '0.00',
  "cash_momo" decimal(12,2) DEFAULT '0.00',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "kitchen_products" (
  "id" int NOT NULL AUTO_INCREMENT,
  "name" varchar(255) NOT NULL,
  "initial_price" decimal(10,2) DEFAULT '0.00',
  "price" decimal(10,2) NOT NULL,
  "opening_stock" int DEFAULT '0',
  "entree" int NOT NULL DEFAULT '0',
  "sold" int NOT NULL DEFAULT '0',
  "date" date NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "unique_food_date" ("name","date")
);

CREATE TABLE "users" (
  "userId" int NOT NULL AUTO_INCREMENT,
  "username" varchar(50) NOT NULL,
  "role" enum('SUPER_ADMIN','BAR_MAN','MANAGER','CHIEF_KITCHEN','ADMIN','TOKEN_MAN','LAND_LORD','GYM') NOT NULL,
  "password" varchar(255) NOT NULL,
  "status" enum('active','inactive') NOT NULL DEFAULT 'active',
  "branch_id" varchar(50) DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "edited_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId"),
  UNIQUE KEY "username" ("username"),
  KEY "fk_branch" ("branch_id"),
  CONSTRAINT "fk_branch" FOREIGN KEY ("branch_id") REFERENCES "branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

