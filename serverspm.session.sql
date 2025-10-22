-- Tabla de Roles
CREATE TABLE roles (
id INT PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(50) NOT NULL UNIQUE,
description VARCHAR(255),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
INDEX idx_name (name)
);

-- Tabla de Estados (para logs y citas)
CREATE TABLE status_types (
id INT PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(50) NOT NULL UNIQUE,
description VARCHAR(255),
category ENUM('appointment', 'auth', 'message', 'account') NOT NULL
);

-- Tabla de Usuarios Principal
CREATE TABLE users (
id INT PRIMARY KEY AUTO_INCREMENT,
email VARCHAR(120) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL,
first_name VARCHAR(100) NOT NULL,
last_name VARCHAR(100) NOT NULL,
phone VARCHAR(20),
avatar_url VARCHAR(255),
role_id INT NOT NULL,
is_active BOOLEAN DEFAULT TRUE,
is_verified BOOLEAN DEFAULT FALSE,
email_verified_at TIMESTAMP NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
last_login TIMESTAMP NULL,
FOREIGN KEY (role_id) REFERENCES roles(id),
INDEX idx_email (email),
INDEX idx_role_id (role_id),
INDEX idx_active (is_active)
);

-- Tabla de Estado de Actividad en Tiempo Real
CREATE TABLE user_activity_status (
id INT PRIMARY KEY AUTO_INCREMENT,
user_id INT NOT NULL UNIQUE,
is_online BOOLEAN DEFAULT FALSE,
last_activity_at TIMESTAMP NULL,
last_seen_at TIMESTAMP NULL,
status ENUM('online', 'away', 'offline', 'do_not_disturb') DEFAULT 'offline',
current_page VARCHAR(255),
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
INDEX idx_is_online (is_online),
INDEX idx_status (status),
INDEX idx_updated (updated_at)
);

-- Tabla de Perfiles de Psicólogos
CREATE TABLE psychologist_profiles (
id INT PRIMARY KEY AUTO_INCREMENT,
user_id INT NOT NULL UNIQUE,
specialty VARCHAR(100),
license_number VARCHAR(100) NOT NULL UNIQUE,
bio TEXT,
professional_experience INT,
availability_start TIME,
availability_end TIME,
max_appointments_per_day INT DEFAULT 8,
is_available BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
INDEX idx_available (is_available)
);

-- Tabla de Perfiles de Estudiantes
CREATE TABLE student_profiles (
id INT PRIMARY KEY AUTO_INCREMENT,
user_id INT NOT NULL UNIQUE,
student_id VARCHAR(50) NOT NULL UNIQUE,
semester INT,
program VARCHAR(100),
emergency_contact_name VARCHAR(100),
emergency_contact_phone VARCHAR(20),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
INDEX idx_student_id (student_id)
);

-- Tabla de Citas/Appointments
CREATE TABLE appointments (
id INT PRIMARY KEY AUTO_INCREMENT,
student_id INT NOT NULL,
psychologist_id INT,
scheduled_date DATE NOT NULL,
scheduled_time TIME NOT NULL,
status_id INT NOT NULL,
reason_for_visit TEXT,
notes TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
cancelled_at TIMESTAMP NULL,
completed_at TIMESTAMP NULL,
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (psychologist_id) REFERENCES users(id) ON DELETE SET NULL,
FOREIGN KEY (status_id) REFERENCES status_types(id),
INDEX idx_student (student_id),
INDEX idx_psychologist (psychologist_id),
INDEX idx_status (status_id),
INDEX idx_date (scheduled_date),
INDEX idx_datetime (scheduled_date, scheduled_time)
);

-- Tabla de Disponibilidad de Psicólogos (Horarios específicos)
CREATE TABLE psychologist_availability (
id INT PRIMARY KEY AUTO_INCREMENT,
psychologist_id INT NOT NULL,
day_of_week INT,
start_time TIME NOT NULL,
end_time TIME NOT NULL,
is_available BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (psychologist_id) REFERENCES users(id) ON DELETE CASCADE,
INDEX idx_psychologist (psychologist_id),
UNIQUE KEY unique_psychologist_day (psychologist_id, day_of_week)
);

-- Tabla de Mensajes (Chat)
CREATE TABLE messages (
id INT PRIMARY KEY AUTO_INCREMENT,
sender_id INT NOT NULL,
recipient_id INT NOT NULL,
appointment_id INT,
content TEXT NOT NULL,
is_read BOOLEAN DEFAULT FALSE,
read_at TIMESTAMP NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
INDEX idx_sender (sender_id),
INDEX idx_recipient (recipient_id),
INDEX idx_conversation (sender_id, recipient_id),
INDEX idx_created (created_at),
INDEX idx_read (is_read)
);

-- Tabla de Blog/Estados (Estudiantes)
CREATE TABLE blog_posts (
id INT PRIMARY KEY AUTO_INCREMENT,
author_id INT NOT NULL,
title VARCHAR(255) NOT NULL,
content TEXT NOT NULL,
status_mood ENUM('happy', 'neutral', 'sad', 'anxious', 'stressed') DEFAULT 'neutral',
likes_count INT DEFAULT 0,
is_published BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
INDEX idx_author (author_id),
INDEX idx_published (is_published),
INDEX idx_created (created_at)
);

-- Tabla de Logs del Sistema
CREATE TABLE system_logs (
id INT PRIMARY KEY AUTO_INCREMENT,
user_id INT,
action VARCHAR(100) NOT NULL,
entity_type VARCHAR(50),
entity_id INT,
status_type_id INT,
description TEXT,
ip_address VARCHAR(45),
user_agent VARCHAR(255),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
FOREIGN KEY (status_type_id) REFERENCES status_types(id),
INDEX idx_user (user_id),
INDEX idx_action (action),
INDEX idx_created (created_at),
INDEX idx_entity (entity_type, entity_id),
INDEX idx_complex (user_id, created_at, action)
);

-- Tabla de Estadísticas de Psicólogos (para Dashboard)
CREATE TABLE psychologist_statistics (
id INT PRIMARY KEY AUTO_INCREMENT,
psychologist_id INT NOT NULL,
total_appointments INT DEFAULT 0,
completed_appointments INT DEFAULT 0,
cancelled_appointments INT DEFAULT 0,
total_unique_students INT DEFAULT 0,
average_rating DECIMAL(3,2) DEFAULT 0,
month INT,
year INT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (psychologist_id) REFERENCES users(id) ON DELETE CASCADE,
UNIQUE KEY unique_month_psychologist (psychologist_id, month, year),
INDEX idx_psychologist (psychologist_id)
);

-- Tabla de Calificaciones de Citas
CREATE TABLE appointment_ratings (
id INT PRIMARY KEY AUTO_INCREMENT,
appointment_id INT NOT NULL UNIQUE,
student_id INT NOT NULL,
psychologist_id INT NOT NULL,
rating INT CHECK (rating >= 1 AND rating <= 5),
comment TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (psychologist_id) REFERENCES users(id) ON DELETE CASCADE,
INDEX idx_psychologist (psychologist_id)
);

-- Tabla de Notificaciones
CREATE TABLE notifications (
id INT PRIMARY KEY AUTO_INCREMENT,
user_id INT NOT NULL,
title VARCHAR(255) NOT NULL,
message TEXT NOT NULL,
notification_type VARCHAR(50),
related_entity_type VARCHAR(50),
related_entity_id INT,
is_read BOOLEAN DEFAULT FALSE,
read_at TIMESTAMP NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
INDEX idx_user (user_id),
INDEX idx_read (is_read),
INDEX idx_created (created_at)
);

-- Tabla de Auditoría (Cambios de TL Mayor)
CREATE TABLE admin_audit_log (
id INT PRIMARY KEY AUTO_INCREMENT,
admin_id INT NOT NULL,
action VARCHAR(100) NOT NULL,
target_user_id INT,
old_values JSON,
new_values JSON,
reason TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
INDEX idx_admin (admin_id),
INDEX idx_created (created_at)
);

-- ==========================================
-- INSERTS INICIALES
-- ==========================================

INSERT INTO roles (id, name, description) VALUES
(1, 'TL_MAYOR', 'TL Mayor - Administrador del sistema'),
(2, 'PSYCHOLOGIST', 'Psicólogo - Profesional de salud mental'),
(3, 'STUDENT', 'Estudiante - Usuario que agenda citas');

INSERT INTO status_types (id, name, description, category) VALUES
(1, 'PENDING', 'Cita pendiente de asignación', 'appointment'),
(2, 'ASSIGNED', 'Cita asignada a psicólogo', 'appointment'),
(3, 'COMPLETED', 'Cita completada', 'appointment'),
(4, 'CANCELLED', 'Cita cancelada', 'appointment'),
(5, 'LOGIN', 'Inicio de sesión', 'auth'),
(6, 'LOGOUT', 'Cierre de sesión', 'auth'),
(7, 'ACCOUNT_CREATED', 'Cuenta creada', 'account'),
(8, 'MESSAGE_SENT', 'Mensaje enviado', 'message'),
(9, 'PROFILE_UPDATED', 'Perfil actualizado', 'account');