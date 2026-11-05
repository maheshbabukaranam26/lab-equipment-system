-- College Laboratory Equipment Management System (MySQL 8+)

CREATE DATABASE IF NOT EXISTS lab_equipment_db;
USE lab_equipment_db;

-- ---------- Users (students, faculty, admins) ----------
CREATE TABLE users (
    user_id     INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    role        ENUM('student','faculty','admin') NOT NULL,
    department  VARCHAR(50)
);

-- ---------- Equipment (your table) ----------
CREATE TABLE equipment (
    equipment_id        INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    category            VARCHAR(50)  NOT NULL,
    quantity            INT NOT NULL CHECK (quantity >= 0),
    available_quantity  INT NOT NULL CHECK (available_quantity >= 0),
    status              VARCHAR(20) NOT NULL DEFAULT 'available',
    CONSTRAINT chk_status CHECK (status IN ('available','unavailable','damaged','maintenance')),
    CONSTRAINT chk_avail  CHECK (available_quantity <= quantity)
);

-- ---------- Requests (students/faculty ask for equipment) ----------
CREATE TABLE equipment_requests (
    request_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    equipment_id  INT NOT NULL,
    quantity      INT NOT NULL CHECK (quantity > 0),
    purpose       VARCHAR(255),
    request_date  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status        ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
    approved_by   INT NULL,
    FOREIGN KEY (user_id)      REFERENCES users(user_id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id),
    FOREIGN KEY (approved_by)  REFERENCES users(user_id)
);

-- ---------- Issue & return transactions ----------
CREATE TABLE transactions (
    transaction_id    INT AUTO_INCREMENT PRIMARY KEY,
    request_id        INT NOT NULL,
    equipment_id      INT NOT NULL,
    user_id           INT NOT NULL,            -- borrower
    issued_by         INT NOT NULL,            -- admin/staff
    quantity_issued   INT NOT NULL CHECK (quantity_issued > 0),
    issue_date        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date          DATE NOT NULL,
    return_date       DATETIME NULL,
    return_condition  ENUM('good','damaged','lost') NULL,
    FOREIGN KEY (request_id)   REFERENCES equipment_requests(request_id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id),
    FOREIGN KEY (user_id)      REFERENCES users(user_id),
    FOREIGN KEY (issued_by)    REFERENCES users(user_id)
);

-- ---------- Damaged / unavailable tracking (admin) ----------
CREATE TABLE equipment_issues (
    issue_id          INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id      INT NOT NULL,
    transaction_id    INT NULL,
    reported_by       INT NOT NULL,
    issue_type        ENUM('damaged','lost','under_maintenance','unavailable') NOT NULL,
    quantity_affected INT NOT NULL CHECK (quantity_affected > 0),
    description       VARCHAR(255),
    reported_date     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_date     DATETIME NULL,
    FOREIGN KEY (equipment_id)   REFERENCES equipment(equipment_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
    FOREIGN KEY (reported_by)    REFERENCES users(user_id)
);

-- ---------- Triggers: keep available_quantity in sync ----------
DELIMITER //

-- Block issuing more than what's available
CREATE TRIGGER trg_issue_check BEFORE INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE avail INT;
    SELECT available_quantity INTO avail FROM equipment WHERE equipment_id = NEW.equipment_id;
    IF avail < NEW.quantity_issued THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not enough equipment available';
    END IF;
END//

-- On issue: reduce available stock
CREATE TRIGGER trg_issue_update AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    UPDATE equipment
       SET available_quantity = available_quantity - NEW.quantity_issued,
           status = IF(available_quantity - NEW.quantity_issued = 0, 'unavailable', status)
     WHERE equipment_id = NEW.equipment_id;
END//

-- On return: restore stock if good; log an issue if damaged/lost
CREATE TRIGGER trg_return_update AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    IF OLD.return_date IS NULL AND NEW.return_date IS NOT NULL THEN
        IF NEW.return_condition = 'good' THEN
            UPDATE equipment
               SET available_quantity = available_quantity + NEW.quantity_issued,
                   status = 'available'
             WHERE equipment_id = NEW.equipment_id;
        ELSE
            INSERT INTO equipment_issues
                (equipment_id, transaction_id, reported_by, issue_type, quantity_affected, description)
            VALUES
                (NEW.equipment_id, NEW.transaction_id, NEW.issued_by,
                 NEW.return_condition, NEW.quantity_issued, 'Reported at return');
        END IF;
    END IF;
END//

DELIMITER ;

-- ---------- Sample data ----------
INSERT INTO users (name, email, role, department) VALUES
('Admin One',  'admin@college.edu',   'admin',   'Lab'),
('Ravi Kumar', 'ravi@college.edu',    'student', 'Physics'),
('Dr. Meena',  'meena@college.edu',   'faculty', 'Chemistry');

INSERT INTO equipment (name, category, quantity, available_quantity, status) VALUES
('Microscope',        'Biology',   10, 10, 'available'),
('Bunsen Burner',     'Chemistry', 20, 20, 'available'),
('Digital Multimeter','Physics',    8,  8, 'available');

-- ---------- Useful queries ----------
-- Available equipment
-- SELECT * FROM equipment WHERE available_quantity > 0;

-- Pending requests
-- SELECT r.request_id, u.name, e.name AS equipment, r.quantity
--   FROM equipment_requests r JOIN users u USING(user_id) JOIN equipment e USING(equipment_id)
--  WHERE r.status = 'pending';

-- Overdue items
-- SELECT t.transaction_id, u.name, e.name, t.due_date
--   FROM transactions t JOIN users u USING(user_id) JOIN equipment e USING(equipment_id)
--  WHERE t.return_date IS NULL AND t.due_date < CURDATE();

-- Unresolved damaged/lost/unavailable items
-- SELECT e.name, i.issue_type, i.quantity_affected, i.reported_date
--   FROM equipment_issues i JOIN equipment e USING(equipment_id)
--  WHERE i.resolved_date IS NULL;
