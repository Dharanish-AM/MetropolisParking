CREATE TABLE parking_spots (
  id VARCHAR(255) PRIMARY KEY,
  spot_number VARCHAR(50) NOT NULL UNIQUE,
  spot_type VARCHAR(50) NOT NULL,
  is_occupied BOOLEAN NOT NULL
);

CREATE TABLE parking_tickets (
  id VARCHAR(255) PRIMARY KEY,
  spot_id VARCHAR(255) NOT NULL REFERENCES parking_spots(id),
  license_plate VARCHAR(50) NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE NULL,
  amount_paid DECIMAL(10, 2) NULL
);

-- Seed some parking spots
INSERT INTO parking_spots (id, spot_number, spot_type, is_occupied) VALUES
('spot-1', 'A101', 'Compact', false),
('spot-2', 'A102', 'Compact', false),
('spot-3', 'B101', 'Large', false),
('spot-4', 'B102', 'Large', false),
('spot-5', 'C101', 'Handicap', false),
('spot-6', 'D101', 'Electric', false);
