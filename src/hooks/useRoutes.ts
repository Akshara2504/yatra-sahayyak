import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Route {
  id: string;
  route_name: string;
  route_number: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export const useRoutes = () => {
  return useQuery({
    queryKey: ["routes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .order("route_number");
      
      if (error) throw error;
      return data as Route[];
    },
  });
};