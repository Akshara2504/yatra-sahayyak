import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RouteStop {
  id: string;
  route_id: string;
  stop_id: string;
  stop_order: number;
  fare_from_origin: number;
  created_at: string;
  stop: {
    id: string;
    stop_name: string;
    stop_code: string;
    latitude?: number;
    longitude?: number;
  };
}

export const useRouteStops = (routeId: string) => {
  return useQuery({
    queryKey: ["route-stops", routeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("route_stops")
        .select(`
          *,
          stop:stops(*)
        `)
        .eq("route_id", routeId)
        .order("stop_order");
      
      if (error) throw error;
      return data as RouteStop[];
    },
    enabled: !!routeId,
  });
};