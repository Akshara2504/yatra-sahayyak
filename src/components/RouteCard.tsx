import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, MapPin } from "lucide-react";
import type { Route } from "@/hooks/useRoutes";
import { translations, type Language } from "@/lib/translations";

interface RouteCardProps {
  route: Route;
  language: Language;
  onSelect: (route: Route) => void;
}

export const RouteCard = ({ route, language, onSelect }: RouteCardProps) => {
  const t = translations[language];
  
  return (
    <Card className="hover:shadow-lg hover:bus-shadow transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">{route.route_number}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-foreground">{route.route_name}</p>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{t.state}: {route.state}</span>
            <Button onClick={() => onSelect(route)} size="sm" className="bus-gradient">
              {t.selectRoute}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};