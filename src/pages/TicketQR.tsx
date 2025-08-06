import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";
import { toast } from "sonner";

interface TicketData {
  id: string;
  ticket_number: string;
  fare: number;
  scan_count: number;
  created_at: string;
  expires_at: string;
  used_at?: string;
  source_stop: { stop_name: string };
  destination_stop: { stop_name: string };
  route: { route_number: string };
}

const TicketQR = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchTicket = async () => {
    if (!ticketId) return;

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          route:routes(route_number),
          source_stop:stops!source_stop_id(stop_name),
          destination_stop:stops!destination_stop_id(stop_name)
        `)
        .eq('id', ticketId)
        .single();

      if (error || !data) {
        toast.error("Ticket not found");
        navigate("/");
        return;
      }

      setTicket(data as TicketData);
      await generateQRCode(data as TicketData);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      toast.error("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (ticketData: TicketData) => {
    try {
      const qrData = JSON.stringify({
        ticket_id: ticketData.id,
        ticket_number: ticketData.ticket_number,
        source: ticketData.source_stop.stop_name,
        destination: ticketData.destination_stop.stop_name,
        fare: ticketData.fare,
        timestamp: ticketData.created_at,
        route: ticketData.route.route_number
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      setQrCodeUrl(qrCodeDataURL);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    }
  };

  const handleScan = async () => {
    if (!ticket || ticket.scan_count >= 2) return;

    setScanning(true);
    try {
      const newScanCount = ticket.scan_count + 1;
      const { error } = await supabase
        .from('tickets')
        .update({ 
          scan_count: newScanCount,
          used_at: newScanCount === 1 ? new Date().toISOString() : ticket.used_at
        })
        .eq('id', ticket.id);

      if (error) {
        toast.error("Failed to update scan count");
        return;
      }

      setTicket({ ...ticket, scan_count: newScanCount });
      
      if (newScanCount >= 2) {
        toast.success("Final scan completed - QR code is now expired");
      } else {
        toast.success("Scan recorded successfully");
      }
    } catch (error) {
      console.error("Error updating scan count:", error);
      toast.error("Failed to record scan");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Ticket Not Found</h2>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = ticket.scan_count >= 2;
  const createdAt = new Date(ticket.created_at);
  const expiresAt = new Date(ticket.expires_at);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <Button 
          onClick={() => navigate("/")} 
          variant="ghost" 
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isExpired ? "🚫 QR Expired" : "✅ Valid Ticket"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ticket Details */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-lg font-bold text-primary mb-3">
                {ticket.ticket_number}
              </div>
              <div className="space-y-1 text-sm">
                <div><strong>Route:</strong> {ticket.route.route_number}</div>
                <div><strong>From:</strong> {ticket.source_stop.stop_name}</div>
                <div><strong>To:</strong> {ticket.destination_stop.stop_name}</div>
                <div><strong>Fare:</strong> ₹{ticket.fare}</div>
                <div><strong>Purchased:</strong> {createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                <div><strong>Expires:</strong> {expiresAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
              </div>
            </div>

            {/* QR Code Section */}
            {!isExpired && qrCodeUrl && (
              <div className="bg-white p-6 rounded-lg border-2 border-border text-center">
                <h3 className="font-semibold mb-4 text-foreground">Ticket QR Code</h3>
                <img 
                  src={qrCodeUrl} 
                  alt="Ticket QR Code" 
                  className="mx-auto max-w-[200px] rounded"
                />
                <p className="text-xs text-muted-foreground mt-2">Scan for ticket verification</p>
              </div>
            )}

            {/* Scan Status */}
            <div className={`p-4 rounded-lg ${isExpired ? 'bg-destructive/10' : 'bg-secondary'}`}>
              <div className="font-semibold mb-2">Scans Used: {ticket.scan_count}/2</div>
              {isExpired ? (
                <span className="text-destructive">⚠️ This QR code has been scanned the maximum number of times and is now expired.</span>
              ) : (
                <span className="text-green-600">✅ QR code is still valid for {2 - ticket.scan_count} more scan(s)</span>
              )}
            </div>

            {/* Manual Scan Button (for testing) */}
            {!isExpired && (
              <Button 
                onClick={handleScan}
                disabled={scanning}
                className="w-full"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Recording Scan...
                  </>
                ) : (
                  'Simulate Scan'
                )}
              </Button>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Last updated: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketQR;