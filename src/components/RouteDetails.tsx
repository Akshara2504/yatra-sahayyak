import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, ArrowDown } from "lucide-react";
import { useState } from "react";
import { useRouteStops, type RouteStop } from "@/hooks/useRouteStops";
import type { Route } from "@/hooks/useRoutes";
import { translations, type Language } from "@/lib/translations";

interface RouteDetailsProps {
  route: Route;
  language: Language;
  onBack: () => void;
  onProceedToPayment: (source: RouteStop, destination: RouteStop, fare: number) => void;
}

export const RouteDetails = ({ route, language, onBack, onProceedToPayment }: RouteDetailsProps) => {
  const { data: stops, isLoading } = useRouteStops(route.id);
  const [sourceStopId, setSourceStopId] = useState<string>("");
  const [destinationStopId, setDestinationStopId] = useState<string>("");
  const t = translations[language];

  const calculateFare = (sourceId: string, destinationId: string) => {
    if (!stops || !sourceId || !destinationId) return 0;
    
    const sourceStop = stops.find(s => s.id === sourceId);
    const destinationStop = stops.find(s => s.id === destinationId);
    
    if (!sourceStop || !destinationStop) return 0;
    
    return Math.abs(destinationStop.fare_from_origin - sourceStop.fare_from_origin);
  };

  const fare = calculateFare(sourceStopId, destinationStopId);
  const canProceed = sourceStopId && destinationStopId && sourceStopId !== destinationStopId;

  const handleProceed = () => {
    if (!stops || !canProceed) return;
    
    const sourceStop = stops.find(s => s.id === sourceStopId)!;
    const destinationStop = stops.find(s => s.id === destinationStopId)!;
    
    onProceedToPayment(sourceStop, destinationStop, fare);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t.loadingDetails}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{route.route_number}</h1>
          <p className="text-muted-foreground">{route.route_name}</p>
        </div>
      </div>

      <Card className="bus-shadow">
        <CardHeader>
          <CardTitle>{t.selectJourney}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t.from}</label>
            <Select value={sourceStopId} onValueChange={setSourceStopId}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectSource} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {stops?.map((stop) => (
                  <SelectItem key={stop.id} value={stop.id}>
                    {stop.stop.stop_name} ({stop.stop.stop_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t.to}</label>
            <Select value={destinationStopId} onValueChange={setDestinationStopId}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectDestination} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {stops?.map((stop) => (
                  <SelectItem 
                    key={stop.id} 
                    value={stop.id}
                    disabled={stop.id === sourceStopId}
                  >
                    {stop.stop.stop_name} ({stop.stop.stop_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fare > 0 && (
            <div className="bg-accent p-4 rounded-lg border-l-4 border-primary">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t.totalFare}:</span>
                <span className="text-xl font-bold text-primary">₹{fare}</span>
              </div>
            </div>
          )}

          <Button 
            className="w-full bus-gradient bus-shadow" 
            disabled={!canProceed}
            onClick={handleProceed}
          >
            {t.proceedToPayment}
          </Button>
        </CardContent>
      </Card>

      <Card className="bus-shadow">
        <CardHeader>
          <CardTitle>{t.allStops}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stops?.map((stop, index) => (
              <div key={stop.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                  {stop.stop_order}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{stop.stop.stop_name}</div>
                  <div className="text-sm text-muted-foreground">{stop.stop.stop_code}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  ₹{stop.fare_from_origin}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};