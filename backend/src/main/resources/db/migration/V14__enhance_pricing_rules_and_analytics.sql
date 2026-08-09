ALTER TABLE pricing_rules
  ADD COLUMN IF NOT EXISTS start_hour INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS end_hour INT DEFAULT 24 NOT NULL,
  ADD COLUMN IF NOT EXISTS occupancy_threshold INT DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS surge_multiplier DECIMAL(5, 2) DEFAULT 1.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS min_fee DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS max_daily_cap DECIMAL(10, 2) DEFAULT 100.00 NOT NULL;

INSERT INTO pricing_rules (id, rule_type, rate, vehicle_type, lot_id, start_hour, end_hour, occupancy_threshold, surge_multiplier, min_fee, max_daily_cap)
SELECT v.id, v.rule_type, v.rate, v.vehicle_type, v.lot_id, v.start_hour, v.end_hour, v.occupancy_threshold, v.surge_multiplier, v.min_fee, v.max_daily_cap
FROM (VALUES
  (gen_random_uuid(), 'PEAK_SURGE', 60.00, 'CAR', '11111111-1111-4111-8111-111111111111'::uuid, 8, 18, 75, 1.25, 20.00, 250.00),
  (gen_random_uuid(), 'HOURLY', 40.00, 'BIKE', '11111111-1111-4111-8111-111111111111'::uuid, 0, 24, 0, 1.00, 10.00, 150.00),
  (gen_random_uuid(), 'OCCUPANCY_BASED', 80.00, 'SUV', '22222222-2222-4222-8222-222222222222'::uuid, 0, 24, 80, 1.50, 30.00, 350.00),
  (gen_random_uuid(), 'HOURLY', 30.00, 'EV', '22222222-2222-4222-8222-222222222222'::uuid, 0, 24, 0, 1.00, 10.00, 200.00),
  (gen_random_uuid(), 'PEAK_SURGE', 75.00, 'CAR', '33333333-3333-4333-8333-333333333333'::uuid, 9, 20, 70, 1.30, 25.00, 300.00)
) AS v(id, rule_type, rate, vehicle_type, lot_id, start_hour, end_hour, occupancy_threshold, surge_multiplier, min_fee, max_daily_cap)
WHERE EXISTS (SELECT 1 FROM parking_lots WHERE id = v.lot_id);
