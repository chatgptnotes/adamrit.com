import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

export async function POST(req: NextRequest) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER!;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const {
      visitId,
      patientName,
      referringDoctorName,
      referringDoctorPhone,
      ourDoctorName,
      ourDoctorPhone,
      delayMinutes = 0,
    } = body;

    if (!referringDoctorPhone || !ourDoctorPhone) {
      return NextResponse.json({ error: 'Both doctor phone numbers are required' }, { status: 400 });
    }

    const conferenceRoom = `HopeConf-${Date.now()}`;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adamrit-com.vercel.app';
    const twimlUrl = `${appBaseUrl}/api/twilio/twiml?room=${encodeURIComponent(conferenceRoom)}`;

    const client = twilio(accountSid, authToken);
    const callTime = new Date(Date.now() + delayMinutes * 60 * 1000);

    // Format phone numbers (ensure + prefix)
    const formatPhone = (phone: string) => phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const refPhone = formatPhone(referringDoctorPhone);
    const ourPhone = formatPhone(ourDoctorPhone);

    // Send WhatsApp notification to our doctor BEFORE calling
    let whatsappSent = false;
    try {
      const notifyMsg = delayMinutes > 0
        ? `Hello Dr. ${ourDoctorName}, a conference call with Dr. ${referringDoctorName} (referring doctor) regarding patient ${patientName} is scheduled in ${delayMinutes} minute(s). Please be available. - Hope Hospital`
        : `Hello Dr. ${ourDoctorName}, a conference call with Dr. ${referringDoctorName} (referring doctor) regarding patient ${patientName} is being initiated now. Please pick up the call. - Hope Hospital`;

      await client.messages.create({
        from: twilioWhatsAppFrom,
        to: `whatsapp:${ourPhone}`,
        body: notifyMsg,
      });
      whatsappSent = true;
    } catch (waError: any) {
      console.error('WhatsApp notification failed (non-fatal):', waError.message);
      // Continue even if WhatsApp fails
    }

    // If delay > 0, we schedule; for now we initiate immediately after delay notation
    // (For true scheduling, a cron/queue would be needed - initiating immediately for simplicity)
    const calls: string[] = [];

    // Call referring doctor
    const call1 = await client.calls.create({
      url: twimlUrl,
      to: refPhone,
      from: twilioPhone,
      statusCallback: `${appBaseUrl}/api/twilio/status`,
      statusCallbackMethod: 'POST',
    });
    calls.push(call1.sid);

    // Call our doctor
    const call2 = await client.calls.create({
      url: twimlUrl,
      to: ourPhone,
      from: twilioPhone,
      statusCallback: `${appBaseUrl}/api/twilio/status`,
      statusCallbackMethod: 'POST',
    });
    calls.push(call2.sid);

    // Save to call_logs
    const { error: logError } = await supabase.from('call_logs').insert({
      visit_id: visitId || null,
      patient_name: patientName || null,
      referring_doctor_name: referringDoctorName,
      referring_doctor_phone: refPhone,
      our_doctor_name: ourDoctorName,
      our_doctor_phone: ourPhone,
      conference_room: conferenceRoom,
      scheduled_at: callTime.toISOString(),
      delay_minutes: delayMinutes,
      status: 'initiated',
      whatsapp_notified: whatsappSent,
    });

    if (logError) {
      console.error('Failed to log call:', logError);
    }

    return NextResponse.json({
      success: true,
      conferenceRoom,
      callSids: calls,
      whatsappNotified: whatsappSent,
      message: `Conference call initiated between Dr. ${ourDoctorName} and Dr. ${referringDoctorName}`,
    });
  } catch (error: any) {
    console.error('Conference call error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate conference call' }, { status: 500 });
  }
}
