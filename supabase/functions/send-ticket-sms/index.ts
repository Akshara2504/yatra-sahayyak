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

function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's a 10-digit Indian number, add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it already has country code but no +, add it
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  
  // If it already has +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Default: assume it's correctly formatted
  return phone;
}

async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    console.log('Attempting to send SMS to:', to);
    console.log('Twilio Account SID:', twilioAccountSid ? 'Set' : 'Missing');
    console.log('Twilio Auth Token:', twilioAuthToken ? 'Set' : 'Missing');
    console.log('Twilio Phone Number:', twilioPhoneNumber);
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Missing Twilio credentials');
      return false;
    }

    const formattedTo = formatPhoneNumber(to);
    console.log('Formatted phone number:', formattedTo);
    
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
          To: formattedTo,
          From: twilioPhoneNumber!,
          Body: message,
        }),
      }
    );

    console.log('Twilio API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio SMS error response:', errorText);
      return false;
    }

    const responseData = await response.json();
    console.log('SMS sent successfully:', responseData);
    return true;
  } catch (error) {
    console.error('SMS sending failed with error:', error);
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

    // Format short SMS message (under 100 characters for Twilio trial)
    const smsMessage = `TkID:${ticketNumber} ₹${fare} ${ticket.source_stop.stop_name}->${ticket.destination_stop.stop_name} Scan: ${qrCode}`;

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