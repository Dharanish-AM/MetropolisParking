CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);

INSERT INTO roles (name, description) VALUES 
('ADMIN', 'System Administrator with full access'),
('OPERATOR', 'Parking Lot Operator with operational access'),
('CUSTOMER', 'Parking Lot Customer with basic access');

INSERT INTO permissions (name, description) VALUES 
('manage_users', 'Create, update, and delete users'),
('manage_lots', 'Create, update, and delete parking lots'),
('manage_spaces', 'Create, update, and delete parking spaces'),
('manage_vehicles', 'Register and manage vehicles'),
('manage_sessions', 'Start, end, and view parking sessions'),
('manage_payments', 'Process and view payments'),
('view_dashboard', 'View operational and financial dashboards');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'OPERATOR' AND p.name IN ('manage_lots', 'manage_spaces', 'manage_vehicles', 'manage_sessions', 'manage_payments', 'view_dashboard');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'CUSTOMER' AND p.name IN ('manage_vehicles');

INSERT INTO users (name, email, password_hash, role_id)
VALUES ('Admin User', 'admin@metropolisparking.com', '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC', (SELECT id FROM roles WHERE name = 'ADMIN'));
