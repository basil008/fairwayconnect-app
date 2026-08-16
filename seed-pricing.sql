-- ALGS 2026 Pricing Structure
INSERT INTO pricing_items (id, name, type, amount, description, is_active, season) VALUES
('price_001', 'Event Entry Fee - Hollywood Lakes', 'event', 15.00, 'Standard entry fee for Hollywood Lakes tournament', 1, '2026'),
('price_002', 'Event Entry Fee - St Margarets', 'event', 20.00, 'Entry fee for St Margarets tournament', 1, '2026'),
('price_003', 'Event Entry Fee - Ashbourne', 'event', 18.00, 'Entry fee for Ashbourne tournament', 1, '2026'),
('price_004', 'Event Entry Fee - Woodbrook', 'event', 25.00, 'Premium entry fee for Woodbrook tournament', 1, '2026'),
('price_005', 'Event Entry Fee - Malahide', 'event', 22.00, 'Entry fee for Malahide tournament', 1, '2026'),
('price_006', 'Event Entry Fee - Skerries', 'event', 17.00, 'Entry fee for Skerries tournament', 1, '2026'),
('price_007', 'Event Entry Fee - Corrstown', 'event', 19.00, 'Entry fee for Corrstown tournament', 1, '2026'),
('price_008', 'Event Entry Fee - Beaverstown', 'event', 16.00, 'Entry fee for Beaverstown tournament', 1, '2026'),

('price_009', 'Annual Membership - 2026', 'membership', 50.00, 'Full year ALGS membership including all events', 1, '2026'),
('price_010', 'New Member Registration', 'membership', 25.00, 'One-time fee for new members joining ALGS', 1, '2026'),
('price_011', 'Guest Player Fee', 'membership', 30.00, 'Fee for non-members playing in events', 1, '2026'),

('price_012', '1st Place Prize', 'prize', 100.00, 'Winner prize for tournament events', 1, '2026'),
('price_013', '2nd Place Prize', 'prize', 60.00, 'Runner-up prize for tournament events', 1, '2026'),
('price_014', '3rd Place Prize', 'prize', 40.00, 'Third place prize for tournament events', 1, '2026'),
('price_015', 'Nearest the Pin', 'prize', 20.00, 'NTP prize for each tournament', 1, '2026'),
('price_016', 'Longest Drive', 'prize', 20.00, 'Longest drive prize for each tournament', 1, '2026'),
('price_017', 'Front 9 Winner', 'prize', 15.00, 'Best front 9 score prize', 1, '2026'),
('price_018', 'Back 9 Winner', 'prize', 15.00, 'Best back 9 score prize', 1, '2026'),

('price_019', 'Golf Society Jacket', 'other', 85.00, 'Official ALGS branded jacket', 1, '2026'),
('price_020', 'Golf Society Polo', 'other', 35.00, 'ALGS branded polo shirt', 1, '2026'),
('price_021', 'Annual Dinner Ticket', 'other', 75.00, 'Ticket for ALGS annual dinner', 1, '2026'),
('price_022', 'Trophy Engraving', 'other', 10.00, 'Cost per trophy engraving', 1, '2026'),
('price_023', 'Score Card Printing', 'other', 50.00, 'Annual cost for custom scorecards', 1, '2026');