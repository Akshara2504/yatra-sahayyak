import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, MapPin, Languages } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { RouteCard } from "@/components/RouteCard";
import { RouteDetails } from "@/components/RouteDetails";
import { PaymentPage } from "@/components/PaymentPage";
import { useRoutes, type Route } from "@/hooks/useRoutes";
import type { RouteStop } from "@/hooks/useRouteStops";
import { translations, type Language } from "@/lib/translations";

const Index = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("english");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [paymentData, setPaymentData] = useState<{ source: RouteStop; destination: RouteStop; fare: number } | null>(null);
  const { data: routes, isLoading } = useRoutes();
  const t = translations[selectedLanguage];

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
  };

  const handleBackToRoutes = () => {
    setSelectedRoute(null);
    setPaymentData(null);
  };

  const handleProceedToPayment = (source: RouteStop, destination: RouteStop, fare: number) => {
    setPaymentData({ source, destination, fare });
  };

  const handleBackToRouteDetails = () => {
    setPaymentData(null);
  };

  // Show payment page
  if (selectedRoute && paymentData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <PaymentPage 
            route={selectedRoute}
            sourceStop={paymentData.source}
            destinationStop={paymentData.destination}
            fare={paymentData.fare}
            language={selectedLanguage}
            onBack={handleBackToRouteDetails}
          />
        </div>
      </div>
    );
  }

  // Show route details
  if (selectedRoute) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <RouteDetails 
            route={selectedRoute}
            language={selectedLanguage}
            onBack={handleBackToRoutes}
            onProceedToPayment={handleProceedToPayment}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bus-gradient text-primary-foreground p-6 bus-shadow">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Bus className="h-8 w-8" />
            <h1 className="text-3xl font-bold">{t.appTitle}</h1>
          </div>
          <p className="text-primary-foreground/90">{t.subtitle}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Language Selector */}
        <Card className="mb-6 bus-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t.selectLanguage}
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
        <Card className="bus-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t.availableRoutes}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">{t.loadingRoutes}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes?.map((route) => (
                  <RouteCard 
                    key={route.id} 
                    route={route}
                    language={selectedLanguage}
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
