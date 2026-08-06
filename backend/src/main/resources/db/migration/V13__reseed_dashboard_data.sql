DO $$
DECLARE
    space_ids UUID[];
    vehicle_ids UUID[];
    cust_ids UUID[];
    sess_id UUID;
    e_time TIMESTAMP WITH TIME ZONE;
    x_time TIMESTAMP WITH TIME ZONE;
    dur INT;
    calc_fee DECIMAL(10, 2);
    p_method VARCHAR(50);
    p_status VARCHAR(50);
    methods TEXT[] := ARRAY['CASH', 'CARD', 'UPI', 'WALLET'];
    i INT;
BEGIN
    SELECT array_agg(id) INTO space_ids FROM parking_spaces;
    SELECT array_agg(id) INTO vehicle_ids FROM vehicles;
    SELECT array_agg(id) INTO cust_ids FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'CUSTOMER');

    IF array_length(space_ids, 1) > 0 AND array_length(vehicle_ids, 1) > 0 THEN
        FOR i IN 1..500 LOOP
            sess_id := gen_random_uuid();
            e_time := CURRENT_TIMESTAMP - (INTERVAL '1 day' * (1 + (i % 28))) - (INTERVAL '1 minute' * ((i * 19) % 1440));
            dur := 30 + ((i * 13) % 450);
            x_time := e_time + (INTERVAL '1 minute' * dur);
            calc_fee := round(((dur::numeric / 60.0) * (40 + (i % 60))), 2);

            INSERT INTO parking_sessions (id, vehicle_id, space_id, entry_time, exit_time, duration_minutes, fee, created_at, updated_at)
            VALUES (
                sess_id,
                vehicle_ids[1 + (i % array_length(vehicle_ids, 1))],
                space_ids[1 + (i % array_length(space_ids, 1))],
                e_time,
                x_time,
                dur,
                calc_fee,
                e_time,
                x_time
            )
            ON CONFLICT (id) DO NOTHING;

            p_method := methods[1 + (i % array_length(methods, 1))];
            p_status := CASE WHEN i % 20 = 0 THEN 'FAILED' WHEN i % 25 = 0 THEN 'REFUNDED' WHEN i % 30 = 0 THEN 'PENDING' ELSE 'SUCCESS' END;

            INSERT INTO payments (id, session_id, amount, method, status, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                sess_id,
                calc_fee,
                p_method,
                p_status,
                x_time,
                x_time
            )
            ON CONFLICT (id) DO NOTHING;
        END LOOP;

        UPDATE parking_spaces SET status = 'AVAILABLE', updated_at = CURRENT_TIMESTAMP;

        FOR i IN 1..array_length(space_ids, 1) LOOP
            IF i % 20 < 7 THEN
                sess_id := gen_random_uuid();
                e_time := CURRENT_TIMESTAMP - (INTERVAL '1 minute' * (15 + (i * 7) % 300));

                INSERT INTO parking_sessions (id, vehicle_id, space_id, entry_time, exit_time, duration_minutes, fee, created_at, updated_at)
                VALUES (
                    sess_id,
                    vehicle_ids[1 + (i % array_length(vehicle_ids, 1))],
                    space_ids[i],
                    e_time,
                    NULL,
                    NULL,
                    NULL,
                    e_time,
                    e_time
                )
                ON CONFLICT (id) DO NOTHING;

                UPDATE parking_spaces SET status = 'OCCUPIED', updated_at = CURRENT_TIMESTAMP WHERE id = space_ids[i];
            ELSIF i % 20 IN (7, 8) THEN
                UPDATE parking_spaces SET status = 'RESERVED', updated_at = CURRENT_TIMESTAMP WHERE id = space_ids[i];
            ELSIF i % 20 = 9 THEN
                UPDATE parking_spaces SET status = 'OUT_OF_SERVICE', updated_at = CURRENT_TIMESTAMP WHERE id = space_ids[i];
            END IF;
        END LOOP;
    END IF;
END $$;
