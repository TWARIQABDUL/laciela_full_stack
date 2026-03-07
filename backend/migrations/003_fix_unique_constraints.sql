ALTER TABLE bar_products DROP INDEX name_date_unique;
ALTER TABLE bar_products DROP INDEX unique_product_per_day;
ALTER TABLE bar_products ADD UNIQUE KEY name_date_branch_unique (name, date, branch_id);

ALTER TABLE kitchen_products DROP INDEX unique_food_date;
ALTER TABLE kitchen_products ADD UNIQUE KEY name_date_branch_unique (name, date, branch_id);
