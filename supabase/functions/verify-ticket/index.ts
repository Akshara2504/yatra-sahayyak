import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ticketId = url.searchParams.get('id');

    if (!ticketId) {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><title>Invalid Ticket</title></head>
        <body style="font-family: Arial; padding: 20px; text-align: center;">
          <h1>❌ Invalid Ticket</h1>
          <p>Ticket ID not provided</p>
        </body>
        </html>`,
        { 
          headers: { 'Content-Type': 'text/html' },
          status: 400
        }
      );
    }

    // Get ticket details
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        route:routes(route_number, route_name),
        source_stop:stops!source_stop_id(stop_name),
        destination_stop:stops!destination_stop_id(stop_name)
      `)
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><title>Ticket Not Found</title></head>
        <body style="font-family: Arial; padding: 20px; text-align: center;">
          <h1>❌ Ticket Not Found</h1>
          <p>Invalid or expired ticket ID</p>
        </body>
        </html>`,
        { 
          headers: { 'Content-Type': 'text/html' },
          status: 404
        }
      );
    }

    // Check if ticket is expired
    const now = new Date();
    const expiresAt = new Date(ticket.expires_at);
    
    if (now > expiresAt) {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><title>Ticket Expired</title></head>
        <body style="font-family: Arial; padding: 20px; text-align: center;">
          <h1>⏰ Ticket Expired</h1>
          <p>This ticket has expired and is no longer valid</p>
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <strong>Ticket: ${ticket.ticket_number}</strong><br>
            Route: ${ticket.source_stop.stop_name} → ${ticket.destination_stop.stop_name}<br>
            Expired: ${expiresAt.toLocaleString()}
          </div>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Check scan count
    if (ticket.scan_count >= 2) {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><title>Ticket Already Used</title></head>
        <body style="font-family: Arial; padding: 20px; text-align: center;">
          <h1>🚫 Ticket Already Used</h1>
          <p>This ticket has been scanned the maximum number of times (2) and is no longer valid</p>
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px;">
            <strong>Ticket: ${ticket.ticket_number}</strong><br>
            Route: ${ticket.source_stop.stop_name} → ${ticket.destination_stop.stop_name}<br>
            Scans Used: ${ticket.scan_count}/2
          </div>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Update scan count
    const newScanCount = ticket.scan_count + 1;
    await supabase
      .from('tickets')
      .update({ 
        scan_count: newScanCount,
        used_at: newScanCount === 1 ? new Date().toISOString() : ticket.used_at
      })
      .eq('id', ticketId);

    const isLastScan = newScanCount >= 2;
    const createdAt = new Date(ticket.created_at);

    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Valid Ticket</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: Arial; padding: 20px; text-align: center; background: #f0f9ff;">
        <div style="max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h1 style="color: #059669; margin-bottom: 20px;">✅ Valid Ticket</h1>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 15px;">
              ${ticket.ticket_number}
            </div>
            
            <div style="text-align: left; line-height: 1.6;">
              <strong>Route:</strong> ${ticket.route.route_number}<br>
              <strong>From:</strong> ${ticket.source_stop.stop_name}<br>
              <strong>To:</strong> ${ticket.destination_stop.stop_name}<br>
              <strong>Fare:</strong> ₹${ticket.fare}<br>
              <strong>Purchased:</strong> ${createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}<br>
              <strong>Expires:</strong> ${expiresAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </div>
          </div>
          
          <div style="background: ${isLastScan ? '#fef3c7' : '#dcfce7'}; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Scans Used: ${newScanCount}/2</strong><br>
            ${isLastScan ? 
              '<span style="color: #d97706;">⚠️ This was the final scan. Ticket is now expired.</span>' : 
              '<span style="color: #059669;">✅ Ticket is still valid for 1 more scan</span>'
            }
          </div>
          
          <div style="font-size: 12px; color: #6b7280; margin-top: 20px;">
            Verified at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </div>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Error in verify-ticket function:', error);
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body style="font-family: Arial; padding: 20px; text-align: center;">
        <h1>❌ Error</h1>
        <p>An error occurred while verifying the ticket</p>
      </body>
      </html>`,
      { 
        headers: { 'Content-Type': 'text/html' },
        status: 500
      }
    );
  }
});