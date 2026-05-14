import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  natureOfBusiness: string;
  businessType?: string;
  services: string[];
  action: string;
  timestamp: string;
  sheetName?: string;
  lead_status?: string;
  // UTMs
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  // Click IDs
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  msclkid?: string;
  wbraid?: string;
  gbraid?: string;
  li_fat_id?: string;
  twclid?: string;
  // Meta CAPI cookies + dedup
  fbp?: string;
  fbc?: string;
  pixel_event_id?: string;
  // Page context
  landing_url?: string;
  referrer_url?: string;
  page_path?: string;
  page_url?: string;
  // Device / browser
  user_agent?: string;
  language?: string;
  timezone?: string;
  screen_resolution?: string;
  viewport_size?: string;
}

// Lightweight UA parsing — no external deps
function parseUA(ua: string) {
  const u = ua || "";
  let device_type = "desktop";
  if (/Tablet|iPad/i.test(u)) device_type = "tablet";
  else if (/Mobi|Android|iPhone|iPod/i.test(u)) device_type = "mobile";

  let browser = "";
  if (/Edg\//i.test(u)) browser = "Edge";
  else if (/OPR\//i.test(u)) browser = "Opera";
  else if (/Chrome\//i.test(u)) browser = "Chrome";
  else if (/Firefox\//i.test(u)) browser = "Firefox";
  else if (/Safari\//i.test(u)) browser = "Safari";

  let os = "";
  if (/Windows NT/i.test(u)) os = "Windows";
  else if (/Mac OS X/i.test(u)) os = "macOS";
  else if (/Android/i.test(u)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(u)) os = "iOS";
  else if (/Linux/i.test(u)) os = "Linux";

  return { device_type, browser, os };
}

function refDomain(url: string) {
  try {
    if (!url) return "";
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData: FormData = await req.json();

    // Server-side enrichment from request headers (more reliable than client)
    const submittedIp =
      (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      '';
    const cfCountry = req.headers.get('cf-ipcountry') || '';
    const cfCity = req.headers.get('cf-ipcity') || '';
    const cfRegion = req.headers.get('cf-region') || '';
    const ipHash = submittedIp ? await sha256Hex(submittedIp + ':ejad-tracking-v1') : '';
    const ua = parseUA(formData.user_agent || req.headers.get('user-agent') || '');
    const referrerDomain = refDomain(formData.referrer_url || '');
    
    // Get credentials from environment
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    const sheetId = Deno.env.get('GOOGLE_SHEET_ID');
    
    if (!serviceAccountJson || !sheetId) {
      throw new Error('Missing Google Sheets credentials');
    }
    
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    // Create JWT for Google API authentication
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };
    
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };
    
    // Import crypto for JWT signing
    const encoder = new TextEncoder();
    const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const claimBase64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const signatureInput = `${headerBase64}.${claimBase64}`;
    
    // Import the private key
    const pemKey = serviceAccount.private_key;
    const pemContents = pemKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\n/g, '');
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(signatureInput)
    );
    
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    const jwt = `${signatureInput}.${signatureBase64}`;
    
    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }
    
    // Determine sheet name (default to 'Company Formation')
    const targetSheet = formData.sheetName || 'Company Formation';

    // Universal tracking tail appended to EVERY sheet row (after sheet-specific cols)
    const trackingTail: string[] = [
      formData.utm_source || '',
      formData.utm_medium || '',
      formData.utm_campaign || '',
      formData.utm_term || '',
      formData.utm_content || '',
      formData.fbclid || '',
      formData.gclid || '',
      formData.ttclid || '',
      formData.msclkid || '',
      formData.wbraid || '',
      formData.gbraid || '',
      formData.li_fat_id || '',
      formData.twclid || '',
      formData.fbp || '',
      formData.fbc || '',
      formData.landing_url || '',
      formData.page_url || '',
      formData.referrer_url || '',
      referrerDomain,
      formData.user_agent || '',
      ua.browser,
      ua.os,
      ua.device_type,
      formData.language || '',
      formData.timezone || '',
      formData.screen_resolution || '',
      formData.viewport_size || '',
      cfCountry,
      cfRegion,
      cfCity,
      ipHash,
    ];
    
    // Parse data based on sheet type
    let rowData: string[];
    
    if (targetSheet === 'Silicon Valley') {
      // Extract category, company, position from natureOfBusiness
      const businessParts = formData.natureOfBusiness.split(' | ');
      const category = businessParts[0] || '';
      const company = businessParts[1] || '';
      const position = businessParts[2] || '';
      
      // Extract data from services array
      const experienceMatch = formData.services.find(s => s.startsWith('Experience:'));
      const experience = experienceMatch ? experienceMatch.replace('Experience: ', '').replace(' years', '') : '';
      
      const linkedinMatch = formData.services.find(s => s.startsWith('LinkedIn:'));
      const linkedin = linkedinMatch ? linkedinMatch.replace('LinkedIn: ', '') : '';
      
      const motivationMatch = formData.services.find(s => s.startsWith('Motivation:'));
      const motivation = motivationMatch ? motivationMatch.replace('Motivation: ', '') : '';
      
      const subsidyMatch = formData.services.find(s => s.startsWith('Subsidy:'));
      const subsidyInfo = subsidyMatch ? subsidyMatch.replace('Subsidy: ', '') : 'No';
      
      // Parse subsidy info
      const applyingForSubsidy = subsidyInfo.startsWith('Yes');
      const subsidyReason = applyingForSubsidy ? subsidyInfo.replace('Yes - ', '') : '';
      
      rowData = [
        formData.timestamp,
        formData.fullName,
        formData.email,
        formData.phone,
        formData.city,
        category,
        company,
        position,
        experience,
        linkedin,
        motivation,
        applyingForSubsidy ? 'Yes' : 'No',
        subsidyReason,
        formData.action,
        ...trackingTail,
      ];
    } else if (targetSheet === 'Visa Desk') {
      // Format for 'Visa Desk' sheet
      // Extract individual fields from services array
      const age = formData.services.find(s => s.startsWith('Age:'))?.replace('Age: ', '') || '';
      const applicationType = formData.services.find(s => s.startsWith('Application Type:'))?.replace('Application Type: ', '') || '';
      const natureOfWork = formData.services.find(s => s.startsWith('Nature of Work:'))?.replace('Nature of Work: ', '') || '';
      const purpose = formData.services.find(s => s.startsWith('Purpose:'))?.replace('Purpose: ', '') || '';
      const education = formData.services.find(s => s.startsWith('Education:'))?.replace('Education: ', '') || '';
      const employment = formData.services.find(s => s.startsWith('Employment:'))?.replace('Employment: ', '') || '';
      const annualIncome = formData.services.find(s => s.startsWith('Annual Income:'))?.replace('Annual Income: ', '') || '';
      const professionalAffiliations = formData.services.find(s => s.startsWith('Professional Affiliations:'))?.replace('Professional Affiliations: ', '') || '';
      const propertyOwnership = formData.services.find(s => s.startsWith('Property Ownership:'))?.replace('Property Ownership: ', '') || '';
      const familyTies = formData.services.find(s => s.startsWith('Family Ties:'))?.replace('Family Ties: ', '') || '';
      const travelHistory = formData.services.find(s => s.startsWith('Travel History:'))?.replace('Travel History: ', '') || '';
      const previousRejections = formData.services.find(s => s.startsWith('Previous Rejections:'))?.replace('Previous Rejections: ', '') || '';
      const intendedDate = formData.services.find(s => s.startsWith('Intended Date:'))?.replace('Intended Date: ', '') || '';
      
      rowData = [
        formData.timestamp,
        formData.fullName,
        formData.email,
        formData.phone,
        formData.city,
        age,
        applicationType,
        natureOfWork,
        purpose,
        education,
        employment,
        annualIncome,
        professionalAffiliations,
        propertyOwnership,
        familyTies,
        travelHistory,
        previousRejections,
        intendedDate,
        ...trackingTail,
      ];
    } else if (targetSheet === 'Contact Us') {
      // Native /contact form
      const subject = formData.services.find(s => s.startsWith('Subject:'))?.replace('Subject: ', '') || '';
      const message = formData.services.find(s => s.startsWith('Message:'))?.replace('Message: ', '') || '';
      rowData = [
        formData.timestamp,
        formData.fullName,
        formData.email,
        formData.phone,
        subject,
        message,
        ...trackingTail,
      ];
    } else {
      // Default format for 'Company Formation' sheet - starts from column A
      // Lead status goes in a dedicated column
      const leadStatusColumn = formData.lead_status === 'irrelevant' ? 'Irrelevant' : (formData.lead_status === 'qualified' ? 'Qualified' : '');
      
      rowData = [
        formData.timestamp,           // Column A
        formData.fullName,            // Column B
        formData.email,               // Column C
        formData.phone,               // Column D
        formData.city,                // Column E
        formData.natureOfBusiness,    // Column F
        formData.businessType || '',  // Column G
        formData.services.join(', '), // Column H
        formData.action,              // Column I
        leadStatusColumn,             // Column J - Lead Status
        ...trackingTail,
      ];
    }
    
    // Append data to Google Sheet
    // Using A1:Z1 range ensures the API detects the table from row 1 starting at column A
    // and appends to the next available row starting from column A
    const range = `'${targetSheet}'!A1:Z1`;
    
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: range,
          majorDimension: 'ROWS',
          values: [rowData],
        }),
      }
    );
    
    const appendResult = await appendResponse.json();
    
    if (!appendResponse.ok) {
      throw new Error(`Failed to append to sheet: ${JSON.stringify(appendResult)}`);
    }

    // Also insert into leads table with lead-type/stage/status defaults + duplicate detection
    try {
      const leadTypeName = formData.sheetName || 'Company Formation';
      const { data: existingDuplicate } = await sb
        .from('leads')
        .select('id')
        .or(`email.eq.${formData.email || ''},phone.eq.${formData.phone || ''}`)
        .limit(1)
        .maybeSingle();

      const { data: leadType } = await sb
        .from('lead_types')
        .select('id,name,default_status_id,manual_review_before_outreach')
        .eq('name', leadTypeName)
        .maybeSingle();

      const { data: firstStage } = leadType?.id
        ? await sb.from('lead_stages').select('id').eq('lead_type_id', leadType.id).eq('is_active', true).order('position', { ascending: true }).limit(1).maybeSingle()
        : { data: null as any };

      const { data: duplicateStatus } = await sb.from('lead_statuses').select('id').eq('name', 'Duplicate').maybeSingle();

      const leadInsert: Record<string, any> = {
        funnel: leadTypeName,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        city: formData.city || null,
        nature_of_business: formData.natureOfBusiness || null,
        business_type: formData.businessType || null,
        services: formData.services || [],
        lead_status: formData.lead_status || 'new',
        utm_source: formData.utm_source || null,
        utm_medium: formData.utm_medium || null,
        utm_campaign: formData.utm_campaign || null,
        utm_term: formData.utm_term || null,
        utm_content: formData.utm_content || null,
        fbclid: formData.fbclid || null,
        gclid: formData.gclid || null,
        ttclid: formData.ttclid || null,
        msclkid: formData.msclkid || null,
        wbraid: formData.wbraid || null,
        gbraid: formData.gbraid || null,
        li_fat_id: formData.li_fat_id || null,
        twclid: formData.twclid || null,
        fbp: formData.fbp || null,
        fbc: formData.fbc || null,
        pixel_event_id: formData.pixel_event_id || null,
        landing_url: formData.landing_url || null,
        referrer_url: formData.referrer_url || null,
        referrer_domain: referrerDomain || null,
        form_page_path: formData.page_path || null,
        user_agent: formData.user_agent || null,
        browser: ua.browser || null,
        os: ua.os || null,
        device_type: ua.device_type || null,
        language: formData.language || null,
        timezone: formData.timezone || null,
        screen_resolution: formData.screen_resolution || null,
        viewport_size: formData.viewport_size || null,
        country: cfCountry || null,
        region: cfRegion || null,
        ip_hash: ipHash || null,
        submitted_ip: submittedIp || null,
        raw_data: formData as any,
        lead_type_id: leadType?.id || null,
        lead_stage_id: firstStage?.id || null,
        lead_status_id: existingDuplicate ? (duplicateStatus?.id || null) : (leadType?.default_status_id || null),
        source: 'website',
        utm_ad_set: (formData as any).utm_ad_set || null,
        utm_ad_name: (formData as any).utm_ad_name || null,
        duplicate_of_lead_id: existingDuplicate?.id || null,
        duplicate_needs_review: !!existingDuplicate,
        stage_entered_at: new Date().toISOString(),
      };

      const { data: createdLead } = await sb.from('leads').insert(leadInsert).select('id').maybeSingle();

      if (createdLead?.id) {
        await sb.from('lead_source_activities').insert({
          lead_id: createdLead.id,
          source: 'website_form_submit',
          payload: { utm_campaign: formData.utm_campaign || null, utm_ad_set: (formData as any).utm_ad_set || null, utm_ad_name: (formData as any).utm_ad_name || null }
        });
      }
    } catch {
      // DB insert is non-blocking; the sheet append already succeeded
    }

    return new Response(
      JSON.stringify({ success: true, result: appendResult }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
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
