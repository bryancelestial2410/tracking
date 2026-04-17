-- ============================================
-- NCF CHS-CSR Database Schema
-- Run this in your Aiven MySQL console
-- ============================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TOOLS TABLE
CREATE TABLE IF NOT EXISTS tools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status ENUM('available', 'unavailable') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  instructor VARCHAR(100) NOT NULL,
  section VARCHAR(50) NOT NULL,
  room VARCHAR(50) NOT NULL,
  course VARCHAR(100) NOT NULL,
  date_reservation DATE NOT NULL,
  date_need DATE NOT NULL,
  date_return DATE NOT NULL,
  lab_procedure TEXT,
  equipment JSON,
  mannequins VARCHAR(10) DEFAULT '0',
  status ENUM('pending', 'approved', 'borrowed', 'returned', 'cancelled') DEFAULT 'pending',
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  returned_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Optional: Insert a default admin user
-- Password is: admin123 (bcrypt hashed)
INSERT INTO users (name, email, password, role) VALUES (
  'Admin',
  'admin@ncf.edu',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
);