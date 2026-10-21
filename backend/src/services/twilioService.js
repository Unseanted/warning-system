import twilio from 'twilio';

export async function sendSms(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.warn('[Twilio DEMO]', to, String(body).slice(0, 80));
    return { status: 'demo_sent', sid: 'DEMO_SID', to, body };
  }

  try {
    const client = twilio(sid, token);
    const msg = await client.messages.create({ body, from, to });
    return { status: 'sent', sid: msg.sid, to, body };
  } catch (err) {
    console.error('Twilio error', err.message);
    return { status: 'failed', error: err.message, to, body };
  }
}

export function buildAlertMessage(location, riskLabel, trend = 'stable') {
  return (
    `FLOOD ALERT - ${String(riskLabel).toUpperCase()} RISK: ${location}. ` +
    `Risk is expected to remain ${String(riskLabel).toUpperCase()} for the next 48 hours. ` +
    `Trend: ${trend}. Monitor official channels. - FRPEWS`
  );
}
