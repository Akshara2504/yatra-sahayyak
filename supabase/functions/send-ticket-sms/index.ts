import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateTicketNumber(): string {
  return 'TKT' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 3).toUpperCase();
}

function generateQRCode(ticketId: string): string {
  return `https://dmgjatzisypbddvlfzbz.supabase.co/functions/v1/verify-ticket?id=${ticketId}`;
}

async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: twilioPhoneNumber!,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio SMS error:', error);
      return false;
    }

    console.log('SMS sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      routeId,
      sourceStopId, // This is route_stops.id
      destinationStopId, // This is route_stops.id  
      fare,
      passengerMobile,
      paymentId,
      languagePreference = 'english'
    } = await req.json();

    console.log('Processing ticket creation for:', { routeId, sourceStopId, destinationStopId, fare, passengerMobile });

    // Get the actual stop IDs from route_stops
    const { data: sourceRouteStop, error: sourceError } = await supabase
      .from('route_stops')
      .select('stop_id')
      .eq('id', sourceStopId)
      .single();

    const { data: destinationRouteStop, error: destError } = await supabase
      .from('route_stops')
      .select('stop_id')
      .eq('id', destinationStopId)
      .single();

    if (sourceError || destError) {
      console.error('Error getting stop IDs:', { sourceError, destError });
      throw new Error('Invalid route stops');
    }

    // Generate ticket details
    const ticketId = crypto.randomUUID();
    const ticketNumber = generateTicketNumber();
    const qrCode = generateQRCode(ticketId);

    // Insert ticket into database using actual stop IDs
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        id: ticketId,
        ticket_number: ticketNumber,
        route_id: routeId,
        source_stop_id: sourceRouteStop.stop_id, // Use actual stop ID
        destination_stop_id: destinationRouteStop.stop_id, // Use actual stop ID
        fare: fare,
        passenger_mobile: passengerMobile,
        payment_id: paymentId,
        qr_code: qrCode,
        language_preference: languagePreference,
        status: 'active',
        scan_count: 0
      })
      .select(`
        *,
        route:routes(route_number),
        source_stop:stops!source_stop_id(stop_name),
        destination_stop:stops!destination_stop_id(stop_name)
      `)
      .single();

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      throw new Error('Failed to create ticket');
    }

    // Insert transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        payment_id: paymentId,
        ticket_id: ticketId,
        amount: fare,
        currency: 'INR',
        payment_gateway: 'razorpay',
        status: 'success'
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
    }

    // Format SMS message
    const timestamp = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const smsMessage = `🎟️ Ticket Confirmed!
Route: ${ticket.source_stop.stop_name} ➝ ${ticket.destination_stop.stop_name}
Fare: ₹${fare}
Time: ${timestamp}

Scan your ticket here (valid for 2 uses):
${qrCode}

Ticket ID: ${ticketNumber}`;

    // Send SMS
    const smsSuccess = await sendSMS(passengerMobile, smsMessage);

    return new Response(
      JSON.stringify({
        success: true,
        ticket: {
          id: ticketId,
          ticketNumber: ticketNumber,
          qrCode: qrCode,
          smsStatus: smsSuccess ? 'sent' : 'failed'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-ticket-sms function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});