DO $$
DECLARE
    admin_role_id UUID;
    operator_role_id UUID;
    customer_role_id UUID;
    
    lot_bkc_id UUID := gen_random_uuid();
    lot_ubcity_id UUID := gen_random_uuid();
    lot_cp_id UUID := gen_random_uuid();
    lot_hitec_id UUID := gen_random_uuid();
    lot_express_id UUID := gen_random_uuid();
    lot_phoenix_id UUID := gen_random_uuid();
    lot_sec18_id UUID := gen_random_uuid();
    lot_cyberhub_id UUID := gen_random_uuid();

    u_rec RECORD;
    l_rec RECORD;
    lvl_rec RECORD;
    sp_rec RECORD;
    v_rec RECORD;

    cust_ids UUID[];
    lot_ids UUID[];
    space_ids UUID[];
    vehicle_ids UUID[];

    i INT;
    j INT;
    lvl_cnt INT;
    sp_cnt INT;
    v_type TEXT;
    sp_type TEXT;
    sp_num TEXT;
    p_plate TEXT;
    p_state TEXT;
    p_code INT;
    p_char1 CHAR;
    p_char2 CHAR;
    p_num INT;
    sess_id UUID;
    e_time TIMESTAMPTZ;
    x_time TIMESTAMPTZ;
    dur INT;
    calc_fee DECIMAL(10,2);
    p_method TEXT;
    p_status TEXT;
    act_name TEXT;
    ent_type TEXT;
    det_txt TEXT;

    states TEXT[] := ARRAY['MH', 'KA', 'DL', 'TS', 'TN', 'HR', 'UP'];
    brands TEXT[] := ARRAY['Tata', 'Mahindra', 'Maruti Suzuki', 'Hyundai', 'Toyota', 'Honda', 'BMW', 'Audi', 'Ather', 'Ola', 'TVS', 'Royal Enfield'];
    methods TEXT[] := ARRAY['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'WALLET'];
    v_types TEXT[] := ARRAY['CAR', 'SUV', 'BIKE', 'EV', 'TRUCK'];

    user_data RECORD;
    customer_names TEXT[] := ARRAY[
        'Aarav Sharma', 'Ananya Iyer', 'Vikramaditya Rao', 'Priya Patel', 'Devendra Singh',
        'Rohan Gupta', 'Kavya Nair', 'Siddharth Verma', 'Sneha Kulkarni', 'Aditya Joshi',
        'Meera Reddy', 'Rahul Dravid', 'Aisha Khan', 'Karthik Ramesh', 'Pooja Bhat',
        'Nikhil Deshmukh', 'Ritu Banerjee', 'Sanjay Kumar', 'Deepak Mishra', 'Shweta Tiwari',
        'Varun Kapoor', 'Neha Agarwal', 'Arjun Mehta', 'Divya Sundaram', 'Manish Pandey',
        'Tanvi Shah', 'Amitav Roy', 'Roshni Mukherjee', 'Ganesh Rao', 'Preeti Menon',
        'Tarun Chawla', 'Bhavna Hegde', 'Alok Saxena', 'Kiran Das', 'Rajesh Pillai'
    ];
BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN';
    SELECT id INTO operator_role_id FROM roles WHERE name = 'OPERATOR';
    SELECT id INTO customer_role_id FROM roles WHERE name = 'CUSTOMER';

    INSERT INTO users (id, name, email, password_hash, role_id) VALUES
    (gen_random_uuid(), 'Vikramaditya Sharma', 'vikram.sharma@metropolis.in', '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC', admin_role_id),
    (gen_random_uuid(), 'Ananya Deshmukh', 'ananya.deshmukh@metropolis.in', '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC', admin_role_id),
    (gen_random_uuid(), 'Rajesh Verma', 'rajesh.verma@metropolis.in', '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC', operator_role_id),
    (gen_random_uuid(), 'Priya Nair', 'priya.nair@metropolis.in', '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC', operator_role_id),
    (gen_random_uuid(), 'Siddharth Kulkarni', 'siddharth.kulkarni@metropolis.in', '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC', operator_role_id),
    (gen_random_uuid(), 'Kavita Singh', 'kavita.singh@metropolis.in', '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC', operator_role_id),
    (gen_random_uuid(), 'Deepak Joshi', 'deepak.joshi@metropolis.in', '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC', operator_role_id),
    (gen_random_uuid(), 'Meena Gupta', 'meena.gupta@metropolis.in', '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC', operator_role_id),
    (gen_random_uuid(), 'Rohit Reddy', 'rohit.reddy@metropolis.in', '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC', operator_role_id),
    (gen_random_uuid(), 'Arun Singh', 'arun.singh@metropolis.in', '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC', operator_role_id);

    FOR i IN 1..array_length(customer_names, 1) LOOP
        INSERT INTO users (id, name, email, password_hash, role_id)
        VALUES (
            gen_random_uuid(),
            customer_names[i],
            lower(replace(customer_names[i], ' ', '.')) || '@gmail.com',
            '$2a$12$7sTWE4JCB8Ih10RZO/18Z.DNh1wpw3KMCidd3yf5zwE/K3zUsJFmC',
            customer_role_id
        );
    END LOOP;

    SELECT array_agg(id) INTO cust_ids FROM users WHERE role_id = customer_role_id;

    INSERT INTO parking_lots (id, name, location) VALUES
    (lot_bkc_id, 'BKC Cyber City Plaza', 'Bandra Kurla Complex, G Block, Mumbai, Maharashtra'),
    (lot_ubcity_id, 'UB City Luxury Parking', 'Vittal Mallya Road, Bengaluru, Karnataka'),
    (lot_cp_id, 'Connaught Place Central Hub', 'Block C, Inner Circle, New Delhi, Delhi'),
    (lot_hitec_id, 'HITEC City Tech Park Parkade', 'Phase 2, Madhapur, Hyderabad, Telangana'),
    (lot_express_id, 'Express Avenue Mall Plaza', 'Royapettah, Chennai, Tamil Nadu'),
    (lot_phoenix_id, 'Phoenix Marketcity Garage', 'Viman Nagar, Pune, Maharashtra'),
    (lot_sec18_id, 'Sector 18 Commercial Complex', 'Sector 18, Noida, Uttar Pradesh'),
    (lot_cyberhub_id, 'Cyber Hub Transit Tower', 'DLF Cyber City, Phase 2, Gurugram, Haryana');

    lot_ids := ARRAY[lot_bkc_id, lot_ubcity_id, lot_cp_id, lot_hitec_id, lot_express_id, lot_phoenix_id, lot_sec18_id, lot_cyberhub_id];

    FOR i IN 1..array_length(lot_ids, 1) LOOP
        lvl_cnt := CASE WHEN i = 1 THEN 6 WHEN i = 2 THEN 5 ELSE 4 END;
        FOR j IN 1..lvl_cnt LOOP
            INSERT INTO parking_levels (id, lot_id, level_number)
            VALUES (gen_random_uuid(), lot_ids[i], j);
        END LOOP;
    END LOOP;

    FOR lvl_rec IN SELECT id, lot_id, level_number FROM parking_levels LOOP
        sp_cnt := CASE WHEN lvl_rec.level_number = 1 THEN 30 ELSE 25 END;
        FOR j IN 1..sp_cnt LOOP
            IF j % 10 = 0 THEN
                sp_type := 'EV';
            ELSIF j % 10 = 1 THEN
                sp_type := 'VIP';
            ELSIF j % 10 = 2 THEN
                sp_type := 'HANDICAPPED';
            ELSIF j % 10 IN (3, 4) THEN
                sp_type := 'MOTORCYCLE';
            ELSE
                sp_type := 'STANDARD';
            END IF;

            sp_num := 'L' || lvl_rec.level_number || '-' || lpad(j::text, 3, '0');

            INSERT INTO parking_spaces (id, lot_id, level_id, space_number, type, status)
            VALUES (gen_random_uuid(), lvl_rec.lot_id, lvl_rec.id, sp_num, sp_type, 'AVAILABLE');
        END LOOP;
    END LOOP;

    FOR i IN 1..array_length(lot_ids, 1) LOOP
        INSERT INTO pricing_rules (id, rule_type, rate, vehicle_type, lot_id) VALUES
        (gen_random_uuid(), 'HOURLY', 60.00, 'CAR', lot_ids[i]),
        (gen_random_uuid(), 'HOURLY', 80.00, 'SUV', lot_ids[i]),
        (gen_random_uuid(), 'HOURLY', 30.00, 'BIKE', lot_ids[i]),
        (gen_random_uuid(), 'HOURLY', 50.00, 'EV', lot_ids[i]),
        (gen_random_uuid(), 'HOURLY', 120.00, 'TRUCK', lot_ids[i]),
        (gen_random_uuid(), 'DAILY', 450.00, 'CAR', lot_ids[i]),
        (gen_random_uuid(), 'PEAK', 90.00, 'CAR', lot_ids[i]),
        (gen_random_uuid(), 'WEEKEND', 75.00, 'CAR', lot_ids[i]),
        (gen_random_uuid(), 'VIP', 150.00, 'CAR', lot_ids[i]),
        (gen_random_uuid(), 'EV_DISCOUNT', 40.00, 'EV', lot_ids[i]);
    END LOOP;

    FOR i IN 1..300 LOOP
        p_state := states[1 + (i % array_length(states, 1))];
        p_code := 1 + (i % 14);
        p_char1 := chr(65 + (i % 26));
        p_char2 := chr(65 + ((i + 7) % 26));
        p_num := 1000 + (i * 37) % 8999;
        p_plate := p_state || lpad(p_code::text, 2, '0') || p_char1 || p_char2 || p_num::text;
        
        v_type := v_types[1 + (i % array_length(v_types, 1))];

        INSERT INTO vehicles (id, plate_number, type, owner_id)
        VALUES (
            gen_random_uuid(),
            p_plate,
            v_type,
            cust_ids[1 + (i % array_length(cust_ids, 1))]
        );
    END LOOP;

    SELECT array_agg(id) INTO space_ids FROM parking_spaces;
    SELECT array_agg(id) INTO vehicle_ids FROM vehicles;

    FOR i IN 1..500 LOOP
        sess_id := gen_random_uuid();
        e_time := CURRENT_TIMESTAMP - (INTERVAL '1 day' * (i % 28)) - (INTERVAL '1 minute' * ((i * 19) % 1440));
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
        );

        p_method := methods[1 + (i % array_length(methods, 1))];
        p_status := CASE WHEN i % 20 = 0 THEN 'FAILED' WHEN i % 25 = 0 THEN 'REFUNDED' WHEN i % 30 = 0 THEN 'PENDING' ELSE 'SUCCESSFUL' END;

        INSERT INTO payments (id, session_id, amount, method, status, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            sess_id,
            calc_fee,
            p_method,
            p_status,
            x_time,
            x_time
        );
    END LOOP;

    FOR i IN 1..array_length(space_ids, 1) LOOP
        IF i % 10 <= 6 THEN
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
            );

            UPDATE parking_spaces SET status = 'OCCUPIED', updated_at = CURRENT_TIMESTAMP WHERE id = space_ids[i];
        ELSIF i % 10 = 7 THEN
            UPDATE parking_spaces SET status = 'RESERVED', updated_at = CURRENT_TIMESTAMP WHERE id = space_ids[i];
        ELSIF i % 10 = 8 THEN
            UPDATE parking_spaces SET status = 'MAINTENANCE', updated_at = CURRENT_TIMESTAMP WHERE id = space_ids[i];
        ELSIF i % 10 = 9 THEN
            UPDATE parking_spaces SET status = 'OUT_OF_SERVICE', updated_at = CURRENT_TIMESTAMP WHERE id = space_ids[i];
        END IF;
    END LOOP;

    FOR i IN 1..100 LOOP
        e_time := CURRENT_TIMESTAMP + (INTERVAL '1 hour' * (i % 72)) - (INTERVAL '1 day' * (i % 5));
        x_time := e_time + INTERVAL '2 hours';
        calc_fee := 120.00 + (i % 50);

        p_status := CASE WHEN i % 4 = 0 THEN 'COMPLETED' WHEN i % 7 = 0 THEN 'CANCELLED' WHEN i % 10 = 0 THEN 'PENDING' ELSE 'CONFIRMED' END;

        INSERT INTO reservations (id, user_id, space_id, start_time, end_time, status, fee, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            cust_ids[1 + (i % array_length(cust_ids, 1))],
            space_ids[1 + ((i * 3) % array_length(space_ids, 1))],
            e_time,
            x_time,
            p_status,
            calc_fee,
            CURRENT_TIMESTAMP - (INTERVAL '1 day' * (i % 10)),
            CURRENT_TIMESTAMP
        );
    END LOOP;

    FOR i IN 1..600 LOOP
        e_time := CURRENT_TIMESTAMP - (INTERVAL '1 hour' * (i % 240));
        act_name := CASE 
            WHEN i % 7 = 0 THEN 'USER_LOGIN'
            WHEN i % 7 = 1 THEN 'START_PARKING_SESSION'
            WHEN i % 7 = 2 THEN 'END_PARKING_SESSION'
            WHEN i % 7 = 3 THEN 'PROCESS_PAYMENT'
            WHEN i % 7 = 4 THEN 'UPDATE_SPACE_STATUS'
            WHEN i % 7 = 5 THEN 'CREATE_RESERVATION'
            ELSE 'UPDATE_PRICING_RULE'
        END;

        ent_type := CASE 
            WHEN i % 7 IN (0, 6) THEN 'USER'
            WHEN i % 7 IN (1, 2) THEN 'PARKING_SESSION'
            WHEN i % 7 = 3 THEN 'PAYMENT'
            WHEN i % 7 = 4 THEN 'PARKING_SPACE'
            ELSE 'RESERVATION'
        END;

        det_txt := '{"action": "' || act_name || '", "initiated_by": "system", "status": "SUCCESS", "event_id": "' || gen_random_uuid() || '"}';

        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, timestamp)
        VALUES (
            gen_random_uuid(),
            cust_ids[1 + (i % array_length(cust_ids, 1))],
            act_name,
            ent_type,
            space_ids[1 + (i % array_length(space_ids, 1))],
            det_txt,
            e_time
        );
    END LOOP;
END $$;
