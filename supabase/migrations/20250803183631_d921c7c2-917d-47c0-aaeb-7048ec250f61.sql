-- Insert sample routes
INSERT INTO public.routes (route_name, route_number, state) VALUES
('Secunderabad to Mehdipatnam', '49M', 'Telangana'),
('Jubilee Bus Station to HITEC City', '218', 'Telangana'),
('Kacheguda to Gachibowli', '156V', 'Telangana'),
('LB Nagar to Kukatpally', '279U', 'Telangana');

-- Insert sample stops
INSERT INTO public.stops (stop_name, stop_code, latitude, longitude) VALUES
('Secunderabad Railway Station', 'SEC001', 17.4399, 78.5015),
('Paradise Circle', 'PAR002', 17.4239, 78.4738),
('Begumpet', 'BEG003', 17.4435, 78.4593),
('Ameerpet', 'AME004', 17.4374, 78.4482),
('Panjagutta', 'PAN005', 17.4239, 78.4482),
('Banjara Hills', 'BAN006', 17.4126, 78.4482),
('Mehdipatnam', 'MEH007', 17.3915, 78.4482),
('Jubilee Bus Station', 'JUB008', 17.4435, 78.4738),
('HITEC City', 'HIT009', 17.4483, 78.3808),
('Kacheguda', 'KAC010', 17.3753, 78.4815),
('Gachibowli', 'GAC011', 17.4400, 78.3489),
('LB Nagar', 'LBN012', 17.3516, 78.5510),
('Kukatpally', 'KUK013', 17.4840, 78.4071);

-- Insert route stops for Route 49M (Secunderabad to Mehdipatnam)
INSERT INTO public.route_stops (route_id, stop_id, stop_order, fare_from_origin) VALUES
((SELECT id FROM routes WHERE route_number = '49M'), (SELECT id FROM stops WHERE stop_code = 'SEC001'), 1, 0),
((SELECT id FROM routes WHERE route_number = '49M'), (SELECT id FROM stops WHERE stop_code = 'PAR002'), 2, 15),
((SELECT id FROM routes WHERE route_number = '49M'), (SELECT id FROM stops WHERE stop_code = 'BEG003'), 3, 20),
((SELECT id FROM routes WHERE route_number = '49M'), (SELECT id FROM stops WHERE stop_code = 'AME004'), 4, 25),
((SELECT id FROM routes WHERE route_number = '49M'), (SELECT id FROM stops WHERE stop_code = 'PAN005'), 5, 30),
((SELECT id FROM routes WHERE route_number = '49M'), (SELECT id FROM stops WHERE stop_code = 'BAN006'), 6, 35),
((SELECT id FROM routes WHERE route_number = '49M'), (SELECT id FROM stops WHERE stop_code = 'MEH007'), 7, 40);

-- Insert route stops for Route 218 (Jubilee to HITEC City)
INSERT INTO public.route_stops (route_id, stop_id, stop_order, fare_from_origin) VALUES
((SELECT id FROM routes WHERE route_number = '218'), (SELECT id FROM stops WHERE stop_code = 'JUB008'), 1, 0),
((SELECT id FROM routes WHERE route_number = '218'), (SELECT id FROM stops WHERE stop_code = 'BEG003'), 2, 18),
((SELECT id FROM routes WHERE route_number = '218'), (SELECT id FROM stops WHERE stop_code = 'AME004'), 3, 25),
((SELECT id FROM routes WHERE route_number = '218'), (SELECT id FROM stops WHERE stop_code = 'PAN005'), 4, 32),
((SELECT id FROM routes WHERE route_number = '218'), (SELECT id FROM stops WHERE stop_code = 'HIT009'), 5, 45);

-- Insert route stops for Route 156V (Kacheguda to Gachibowli)
INSERT INTO public.route_stops (route_id, stop_id, stop_order, fare_from_origin) VALUES
((SELECT id FROM routes WHERE route_number = '156V'), (SELECT id FROM stops WHERE stop_code = 'KAC010'), 1, 0),
((SELECT id FROM routes WHERE route_number = '156V'), (SELECT id FROM stops WHERE stop_code = 'AME004'), 2, 22),
((SELECT id FROM routes WHERE route_number = '156V'), (SELECT id FROM stops WHERE stop_code = 'PAN005'), 3, 28),
((SELECT id FROM routes WHERE route_number = '156V'), (SELECT id FROM stops WHERE stop_code = 'GAC011'), 4, 38);

-- Insert route stops for Route 279U (LB Nagar to Kukatpally)
INSERT INTO public.route_stops (route_id, stop_id, stop_order, fare_from_origin) VALUES
((SELECT id FROM routes WHERE route_number = '279U'), (SELECT id FROM stops WHERE stop_code = 'LBN012'), 1, 0),
((SELECT id FROM routes WHERE route_number = '279U'), (SELECT id FROM stops WHERE stop_code = 'KAC010'), 2, 20),
((SELECT id FROM routes WHERE route_number = '279U'), (SELECT id FROM stops WHERE stop_code = 'AME004'), 3, 35),
((SELECT id FROM routes WHERE route_number = '279U'), (SELECT id FROM stops WHERE stop_code = 'KUK013'), 4, 50);