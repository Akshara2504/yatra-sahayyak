-- Create RLS policies for public access to routes and stops (public transport data)
-- Routes table - allow read access to everyone
CREATE POLICY "Allow read access to routes" ON public.routes
FOR SELECT USING (true);

-- Stops table - allow read access to everyone  
CREATE POLICY "Allow read access to stops" ON public.stops
FOR SELECT USING (true);

-- Route_stops table - allow read access to everyone
CREATE POLICY "Allow read access to route_stops" ON public.route_stops
FOR SELECT USING (true);

-- Tickets table - restrict access (passengers can only see their own tickets)
CREATE POLICY "Users can view their own tickets" ON public.tickets
FOR SELECT USING (true); -- For now allowing all access since no auth is implemented yet

CREATE POLICY "Allow ticket creation" ON public.tickets
FOR INSERT WITH CHECK (true); -- For now allowing all inserts since no auth is implemented yet

-- Transactions table - restrict access (users can only see their own transactions)
CREATE POLICY "Users can view their own transactions" ON public.transactions
FOR SELECT USING (true); -- For now allowing all access since no auth is implemented yet

CREATE POLICY "Allow transaction creation" ON public.transactions
FOR INSERT WITH CHECK (true); -- For now allowing all inserts since no auth is implemented yet