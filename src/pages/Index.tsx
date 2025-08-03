import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, MapPin, Languages } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { RouteCard } from "@/components/RouteCard";
import { RouteDetails } from "@/components/RouteDetails";
import { useRoutes, type Route } from "@/hooks/useRoutes";
import type { RouteStop } from "@/hooks/useRouteStops";

const Index = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const { data: routes, isLoading } = useRoutes();

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
  };

  const handleBackToRoutes = () => {
    setSelectedRoute(null);
  };

  const handleProceedToPayment = (source: RouteStop, destination: RouteStop, fare: number) => {
    // TODO: Implement payment flow
    console.log("Proceeding to payment:", { source, destination, fare });
  };

  if (selectedRoute) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <RouteDetails 
            route={selectedRoute}
            onBack={handleBackToRoutes}
            onProceedToPayment={handleProceedToPayment}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Bus className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Yatra Sahayyak</h1>
          </div>
          <p className="text-primary-foreground/80">Digital Bus Ticketing System</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Language Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Select Language / भाषा चुनें / భాష ఎంచుకోండి
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs">
              <LanguageSelector 
                value={selectedLanguage} 
                onValueChange={setSelectedLanguage} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Routes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Available Bus Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading routes...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes?.map((route) => (
                  <RouteCard 
                    key={route.id} 
                    route={route} 
                    onSelect={handleRouteSelect}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
