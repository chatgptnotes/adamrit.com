import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Lazy imports — avoid module-level init that breaks build
    const twilio = (await import('twilio')).default;
    const { createClient } = await import('@supabase/supabase-js');

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { to, person_id, person_name, call_type = 'manual' } = await req.json();
    if (!to) return NextResponse.json({ error: 'Phone number required' }, { status: 400 });

    // Normalize to Indian mobile number with +91
    let toNumber = to.replace(/\s+/g, '').replace(/^0/, '');
    if (!toNumber.startsWith('+')) toNumber = '+91' + toNumber.replace(/^91/, '');

    const call = await twilioClient.calls.create({
      to: toNumber,
      from: process.env.TWILIO_PHONE_NUMBER!,
      twiml: `<Response><Say voice="alice" language="en-IN">Hello, this is a call from Hope Hospital Nagpur. Dr Murali's team is calling for a referral follow-up. Thank you for your support. Please call us back on 0712 2220000 for any queries.</Say></Response>`,
    });

    // Log to call_logs (non-blocking)
    supabase.from('call_logs').insert({
      person_id, person_name,
      phone_number: toNumber,
      call_sid: call.sid,
      call_status: call.status,
      call_type,
      initiated_at: new Date().toISOString(),
    }).then(() => {}).catch(() => {});

    return NextResponse.json({ success: true, call_sid: call.sid, status: call.status, to: toNumber });
  } catch (err: any) {
    console.error('Twilio call error:', err);
    return NextResponse.json({ error: err.message || 'Call failed' }, { status: 500 });
  }
}
