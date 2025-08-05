import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Phone } from "lucide-react";
import { useState } from "react";
import type { RouteStop } from "@/hooks/useRouteStops";
import type { Route } from "@/hooks/useRoutes";
import { translations, type Language } from "@/lib/translations";
import { supabase } from "@/integrations/supabase/client";

interface PaymentPageProps {
  route: Route;
  sourceStop: RouteStop;
  destinationStop: RouteStop;
  fare: number;
  language: Language;
  onBack: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PaymentPage = ({ route, sourceStop, destinationStop, fare, language, onBack }: PaymentPageProps) => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const t = translations[language];

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = resolve;
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsProcessing(true);

    try {
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const options = {
        key: "rzp_test_Lt1vXXRbPYiNIA", // Test key provided by user
        amount: fare * 100, // Amount in paise
        currency: "INR",
        name: "Yatra Sahayyak",
        description: `${route.route_number}: ${sourceStop.stop.stop_name} to ${destinationStop.stop.stop_name}`,
        handler: async function (response: any) {
          // Payment successful
          console.log("Payment successful:", response);
          
          try {
            // Call edge function to generate ticket and send SMS
            const { data, error } = await supabase.functions.invoke('send-ticket-sms', {
              body: {
                routeId: route.id,
                sourceStopId: sourceStop.id,
                destinationStopId: destinationStop.id,
                fare: fare,
                passengerMobile: mobileNumber,
                paymentId: response.razorpay_payment_id,
                languagePreference: language
              }
            });

            if (error) throw error;

            if (data.success) {
              alert(`Payment successful! Ticket ${data.ticket.ticketNumber} has been sent to your mobile number. SMS Status: ${data.ticket.smsStatus}`);
            } else {
              alert("Payment successful but failed to generate ticket. Please contact support.");
            }
          } catch (error) {
            console.error("Error generating ticket:", error);
            alert("Payment successful but failed to send ticket. Please contact support with payment ID: " + response.razorpay_payment_id);
          }
        },
        prefill: {
          contact: mobileNumber,
        },
        theme: {
          color: "#3B82F6"
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t.paymentDetails}</h1>
          <p className="text-muted-foreground">{route.route_number}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Journey Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t.paymentDetails}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.route}:</span>
                <span className="font-medium">{route.route_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.source}:</span>
                <span className="font-medium">{sourceStop.stop.stop_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.destination}:</span>
                <span className="font-medium">{destinationStop.stop.stop_name}</span>
              </div>
              <div className="border-t pt-2 mt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>{t.totalFare}:</span>
                  <span className="text-primary">₹{fare}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {t.enterMobile}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mobile">{t.mobileNumber}</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="1234567890"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="mt-1"
              />
            </div>
            
            <Button 
              className="w-full bus-gradient bus-shadow" 
              onClick={handlePayment}
              disabled={isProcessing || !mobileNumber || mobileNumber.length !== 10}
            >
              {isProcessing ? "Processing..." : `${t.payNow} ₹${fare}`}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              Powered by Razorpay (Test Mode)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};