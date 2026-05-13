import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.json();
    
    console.log('Received form submission:', formData);
    
    // Forward to Google Apps Script
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxFwqdOyWxDBIMBXfBfFWG8wNzDvzkMBbCzlWiViRzptCvznlZKZvsi-YED_hJT9RxT9g/exec';
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const responseText = await response.text();
    console.log('Google Script raw response:', responseText);
    console.log('Response status:', response.status);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON. Response was:', responseText.substring(0, 500));
      // Even if we can't parse the response, the submission might have succeeded
      // Google Apps Script sometimes returns HTML even on success
      result = { status: 'submitted', note: 'Response was not JSON but request was sent' };
    }

    console.log('Processed result:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error submitting to Google Sheets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
